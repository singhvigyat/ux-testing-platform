import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';

// Use override: true so if you swap the API key in .env, it actually forces the new key
// into process.env, instead of keeping the old depleated key cached!
dotenv.config({ override: true });

const MODEL = 'gemini-2.5-flash';

// ─── Rate limiting config ────────────────────────────────────────────────────
// Free tier: 15 RPM, but vision calls with large images eat tokens fast.
// 20s spacing → max 3 RPM, keeps us safely under the per-minute token budget.
const MIN_CALL_DELAY_MS = 20_000;
// Only retry per-MINUTE quota errors. Daily quota errors = fail immediately.
const MAX_MINUTE_RETRIES = 2;
const BASE_BACKOFF_MS = 65_000;

let lastCallTimestamp = 0;

function getClient(): GoogleGenAI {
  // Always reload .env so if the user changes the key while the server is running, 
  // it picks it up IMMEDIATELY without needing a restart!
  dotenv.config({ override: true });
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables. Please add it to backend/.env');
  }
  
  return new GoogleGenAI({ apiKey });
}

/** Sleep for `ms` milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Classifies the type of rate limit from a Gemini 429 error.
 *
 * - 'daily'  → daily quota exhausted; retrying won't help until tomorrow
 * - 'minute' → per-minute limit; retrying after a short wait will work
 * - null     → not a rate-limit error at all
 */
function classifyRateLimit(error: unknown): 'daily' | 'minute' | null {
  const message = (error as { message?: string }).message ?? '';
  const status = (error as { status?: string }).status ?? '';

  const isQuotaError =
    status === 'RESOURCE_EXHAUSTED' ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('429') ||
    message.toLowerCase().includes('quota');

  if (!isQuotaError) return null;

  // Gemini includes the quota ID in the error body. 
  if (message.includes('limit: 0')) {
    return 'daily';
  }

  if (message.includes('PerDay')) {
    return 'daily';
  }

  return 'minute';
}

/** Extracts the retry-after delay (ms) from Gemini's "retry in Xs" message */
function extractRetryDelayMs(error: unknown): number {
  try {
    const message = (error as { message?: string }).message ?? '';
    const match = message.match(/retry in ([\d.]+)s/i);
    if (match) {
      return Math.ceil(parseFloat(match[1]) * 1000) + 2_000; // +2s buffer
    }
  } catch {
    // ignore
  }
  return BASE_BACKOFF_MS;
}

/** Enforces minimum gap between consecutive Gemini API calls */
async function enforceCallSpacing(): Promise<void> {
  const elapsed = Date.now() - lastCallTimestamp;
  if (elapsed < MIN_CALL_DELAY_MS) {
    const wait = MIN_CALL_DELAY_MS - elapsed;
    console.log(`[RateLimit] Spacing calls — waiting ${(wait / 1000).toFixed(1)}s...`);
    await sleep(wait);
  }
  lastCallTimestamp = Date.now();
}

export async function analyzeBufferWithGemini(
  imageBuffer: Buffer,
  prompt: string,
): Promise<string> {
  const ai = getClient();
  const imageData = imageBuffer.toString('base64');

  let attempt = 1;
  while (true) {
    await enforceCallSpacing();

    try {
      console.log(`[Gemini] Attempt ${attempt} — calling API...`);

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          { inlineData: { mimeType: 'image/png', data: imageData } },
          { text: prompt },
        ],
      });

      const text = response.text;
      if (!text) throw new Error('Gemini returned an empty response');

      console.log(`[Gemini] ✅ Success on attempt ${attempt}.`);
      return text;

    } catch (error) {
      const limitType = classifyRateLimit(error);

      if (limitType === 'daily') {
        throw new Error(
          '🚫 Gemini free-tier DAILY quota exhausted.\n' +
          'Your quota resets at midnight Pacific Time.\n' +
          'Options:\n' +
          '  1. Wait until tomorrow and try again\n' +
          '  2. Add billing to your Google AI project (https://aistudio.google.com)\n' +
          '  3. Use a second GEMINI_API_KEY from a different Google account'
        );
      }

      if (limitType === 'minute') {
        const retryDelayMs = extractRetryDelayMs(error);
        const retryDelaySec = (retryDelayMs / 1000).toFixed(1);

        console.warn(
          `[Gemini] ⏳ Per-minute limit hit (attempt ${attempt}). ` +
          `Waiting ${retryDelaySec}s before retry...`
        );
        await sleep(retryDelayMs);
        lastCallTimestamp = 0;
        attempt++;
      } else {
        throw error;
      }
    }
  }
}

/**
 * Analyzes a screenshot with a given prompt using Gemini Vision.
 *
 * Behaviour:
 * - Enforces minimum inter-call spacing to avoid per-minute limits
 * - Retries per-MINUTE rate limits with the suggested delay
 * - Fails IMMEDIATELY on daily quota exhaustion (no pointless retries)
 *
 * @param screenshotPath - Absolute path to the screenshot file
 * @param prompt         - The persona-specific analysis prompt
 */
export async function analyzeScreenshotWithGemini(
  screenshotPath: string,
  prompt: string,
): Promise<string> {
  if (!fs.existsSync(screenshotPath)) {
    throw new Error(`Screenshot not found at path: ${screenshotPath}`);
  }

  const imageBuffer = fs.readFileSync(screenshotPath);
  return analyzeBufferWithGemini(imageBuffer, prompt);
}
