import path from 'path';
import fs from 'fs';
import { chromium, devices } from 'playwright';
import { ScreenshotSet } from '../types';

const SCREENSHOTS_BASE_DIR = path.join(__dirname, '..', '..', 'screenshots');

/**
 * Captures 3 screenshots of a URL:
 * - Desktop (1366×768)
 * - Mobile (iPhone 13 emulation)
 * - Full-page (desktop, scrolled)
 *
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
    // ─── Desktop Screenshot ──────────────────────────────────────────
    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const desktopPage = await desktopContext.newPage();
    await navigateSafely(desktopPage, url);
    const desktopPath = path.join(jobDir, 'desktop.png');
    await desktopPage.screenshot({ path: desktopPath, type: 'png' });
    await desktopContext.close();
    console.log(`  → Desktop screenshot saved`);

    // ─── Mobile Screenshot ───────────────────────────────────────────
    const iPhone = devices['iPhone 13'];
    const mobileContext = await browser.newContext({ ...iPhone });
    const mobilePage = await mobileContext.newPage();
    await navigateSafely(mobilePage, url);
    const mobilePath = path.join(jobDir, 'mobile.png');
    await mobilePage.screenshot({ path: mobilePath, type: 'png' });
    await mobileContext.close();
    console.log(`  → Mobile screenshot saved`);

    // ─── Full-Page Screenshot ────────────────────────────────────────
    const fullPageContext = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const fullPagePage = await fullPageContext.newPage();
    await navigateSafely(fullPagePage, url);
    const fullPagePath = path.join(jobDir, 'fullpage.png');
    await fullPagePage.screenshot({ path: fullPagePath, type: 'png', fullPage: true });
    await fullPageContext.close();
    console.log(`  → Full-page screenshot saved`);

    return {
      // Return URL paths (relative to static server)
      desktop: `/screenshots/${jobId}/desktop.png`,
      mobile: `/screenshots/${jobId}/mobile.png`,
      fullPage: `/screenshots/${jobId}/fullpage.png`,
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
