/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import path from 'path';
import fs from 'fs';
import { chromium, Page } from 'playwright';
import sharp from 'sharp';
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
  fontSize: number;
  color: string;
  backgroundColor: string;
  role: string;
  ariaLabel: string;
  isClickable: boolean;
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

      const fontSize = parseFloat(style.fontSize) || 0;
      const color = style.color || '';
      const backgroundColor = style.backgroundColor || '';
      const role = el.getAttribute('role') || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const isClickable = tagInfo === 'a' || tagInfo === 'button' || style.cursor === 'pointer';

      results.push({
        id: idCounter++,
        tag: tagInfo,
        text,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        fontSize: Math.round(fontSize),
        color,
        backgroundColor,
        role,
        ariaLabel,
        isClickable,
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

  const uiStructureData = {
    viewport,
    pageWidth: viewportWidth,
    elementCount: elements.length,
    elements
  };

  fs.writeFileSync(path.join(jobDir, `ui-structure-${viewport}.json`), JSON.stringify(uiStructureData, null, 2));
}

async function generateLabeledScreenshot(viewport: 'desktop' | 'tablet' | 'mobile', viewportWidth: number, viewportHeight: number, jobDir: string): Promise<void> {
  const domPath = path.join(jobDir, `dom-${viewport}.json`);
  const screenshotPath = path.join(jobDir, `${viewport}.png`);
  const outputPath = path.join(jobDir, `som-${viewport}.png`);

  if (!fs.existsSync(domPath) || !fs.existsSync(screenshotPath)) return;

  const domData: ViewportDOM = JSON.parse(fs.readFileSync(domPath, 'utf-8'));
  
  if (!domData || !domData.elements || domData.elements.length === 0) return;

  const validElements = domData.elements.filter(el => el.width > 0 && el.height > 0);

  if (validElements.length === 0) return;

  const image = sharp(screenshotPath);
  const metadata = await image.metadata();
  const imgWidth = metadata.width || viewportWidth;
  const imgHeight = metadata.height || viewportHeight;

  const labels = validElements.map(el => `
  <rect x="${el.x}" y="${el.y}" width="22" height="20" rx="3" fill="#1D4ED8"/>
  <text x="${el.x + 3}" y="${el.y + 14}" font-size="11" font-family="monospace" fill="white">${el.id}</text>
  `).join('');

  const svg = `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
  ${labels}
  </svg>`;

  await image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toFile(outputPath);

  console.log(`  → Labeled screenshot (SoM) saved for ${viewport}`);
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
    await generateLabeledScreenshot('desktop', 1280, 720, jobDir);

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
    await generateLabeledScreenshot('tablet', 768, 1024, jobDir);

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
    await generateLabeledScreenshot('mobile', 375, 812, jobDir);

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
