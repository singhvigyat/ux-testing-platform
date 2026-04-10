import path from 'path';
import fs from 'fs';
import { chromium, Page } from 'playwright';
import { ScreenshotSet } from '../types';

const SCREENSHOTS_BASE_DIR = path.join(__dirname, '..', '..', 'screenshots');

type DOMElement = {
  id: number;
  tag: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ViewportDOM = {
  viewport: 'desktop' | 'tablet' | 'mobile';
  width: number;
  elements: DOMElement[];
};

async function extractDOMForViewport(page: Page, viewport: 'desktop' | 'tablet' | 'mobile', viewportWidth: number, jobDir: string): Promise<void> {
  const elements = await page.evaluate(() => {
    const validTags = new Set([
      'a', 'button', 'input', 'select', 'textarea', 'label', 'h1', 'h2', 'h3', 'h4', 'p', 'li', 'img', 'nav', 'header', 'footer', 'form'
    ]);
    const results: DOMElement[] = [];
    let idCounter = 1;

    const allElements = document.querySelectorAll('*');

    for (const el of allElements) {
      const tagInfo = el.tagName.toLowerCase();
      if (!validTags.has(tagInfo)) continue;

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      // Ensure bounding box is within the current viewport
      if (rect.y < 0 || rect.y > window.innerHeight) continue;

      let text = (el as HTMLElement).innerText || (el as HTMLInputElement).value || (el as HTMLImageElement).alt || '';
      text = text.trim().substring(0, 80);

      results.push({
        id: idCounter++,
        tag: tagInfo,
        text,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }

    return results;
  });

  console.log(`  → Extracted ${elements.length} DOM elements for ${viewport}`);

  const domData: ViewportDOM = {
    viewport,
    width: viewportWidth,
    elements,
  };

  fs.writeFileSync(path.join(jobDir, `dom-${viewport}.json`), JSON.stringify(domData, null, 2));
}

/**
 * Captures 3 screenshots of a URL:
 * - Desktop (1280x720)
 * - Tablet (768x1024)
 * - Mobile (375x812)
 * 
 * Also extracts DOM bounding boxed for each.
 * Returns relative paths served by the static file server.
 */
export async function captureScreenshots(url: string, jobId: string): Promise<ScreenshotSet> {
  const jobDir = path.join(SCREENSHOTS_BASE_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // ─── Desktop ──────────────────────────────────────────
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const desktopPage = await desktopContext.newPage();
    await navigateSafely(desktopPage, url);
    await extractDOMForViewport(desktopPage, 'desktop', 1280, jobDir);
    const desktopPath = path.join(jobDir, 'desktop.png');
    await desktopPage.screenshot({ path: desktopPath, type: 'png' });
    await desktopContext.close();
    console.log(`  → Desktop screenshot saved`);

    // ─── Tablet ────────────────────────────────────────
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1',
    });
    const tabletPage = await tabletContext.newPage();
    await navigateSafely(tabletPage, url);
    await extractDOMForViewport(tabletPage, 'tablet', 768, jobDir);
    const tabletPath = path.join(jobDir, 'tablet.png');
    await tabletPage.screenshot({ path: tabletPath, type: 'png' });
    await tabletContext.close();
    console.log(`  → Tablet screenshot saved`);

    // ─── Mobile ───────────────────────────────────────────
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    });
    const mobilePage = await mobileContext.newPage();
    await navigateSafely(mobilePage, url);
    await extractDOMForViewport(mobilePage, 'mobile', 375, jobDir);
    const mobilePath = path.join(jobDir, 'mobile.png');
    await mobilePage.screenshot({ path: mobilePath, type: 'png' });
    await mobileContext.close();
    console.log(`  → Mobile screenshot saved`);

    return {
      desktop: `/screenshots/${jobId}/desktop.png`,
      tablet: `/screenshots/${jobId}/tablet.png`,
      mobile: `/screenshots/${jobId}/mobile.png`,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Navigate with sensible timeouts and wait for network to settle
 */
async function navigateSafely(page: import('playwright').Page, url: string): Promise<void> {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });
  } catch {
    // networkidle can time out on heavy pages — fallback to domcontentloaded
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      });
      // Still wait a moment for JS to render
      await page.waitForTimeout(2000);
    } catch (fallbackErr) {
      throw new Error(`Failed to load URL: ${url}. ${(fallbackErr as Error).message}`);
    }
  }
}
