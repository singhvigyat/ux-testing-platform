import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UXReport, JobStatus } from '../types';
import { captureScreenshots } from '../crawler/screenshotService';
import { analyzeWithPersona } from '../agents/personaAnalyzer';
import { buildReport } from '../aggregator/reportBuilder';
import { personas } from '../agents/personas';

// In-memory job store (MVP — no DB needed)
const jobs = new Map<string, UXReport>();

// URL validation
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * POST /api/analyze
 * Validates URL, creates job, kicks off async analysis
 */
export async function startAnalysis(req: Request, res: Response): Promise<void> {
  const { url, personaIds } = req.body;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  if (!isValidUrl(normalizedUrl)) {
    res.status(400).json({ error: 'Invalid URL format. Please include http:// or https://' });
    return;
  }

  const generatedJobId = uuidv4();
  const now = new Date().toISOString();

  const activePersonas = Array.isArray(personaIds) && personaIds.length > 0
    ? personas.filter((p) => personaIds.includes(p.id))
    : personas;

  const selectedPersonaIds = activePersonas.map(p => p.id);

  // Create initial job record
  const initialReport: UXReport = {
    jobId: generatedJobId,
    url: normalizedUrl,
    status: 'pending',
    screenshots: { desktop: '', mobile: '', tablet: '' },
    selectedPersonas: selectedPersonaIds,
    personaInsights: [],
    conflicts: [],
    summary: '',
    majorIssues: [],
    recommendations: [],
    severityScore: 0,
    analysisTime: 0,
    createdAt: now,
  };

  jobs.set(generatedJobId, initialReport);

  // Respond immediately with jobId
  res.status(202).json({
    jobId: generatedJobId,
    message: 'Analysis started. Poll GET /api/analyze/:jobId for results.',
  });

  // Run analysis asynchronously (don't await)
  runAnalysis(generatedJobId, normalizedUrl, personaIds).catch((err) => {
    console.error(`[Job ${generatedJobId}] Fatal error:`, err);
    const job = jobs.get(generatedJobId);
    if (job) {
      jobs.set(generatedJobId, { ...job, status: 'error', error: err.message });
    }
  });
}

/**
 * GET /api/analyze/:jobId
 * Returns job status and results
 */
export function getAnalysisStatus(req: Request, res: Response): void {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json(job);
}

/**
 * Main async analysis pipeline
 */
async function runAnalysis(
  jobId: string,
  url: string,
  personaIds?: string[]
): Promise<void> {
  const startTime = Date.now();
  const updateJob = (updates: Partial<UXReport>) => {
    const current = jobs.get(jobId)!;
    jobs.set(jobId, { ...current, ...updates });
  };

  try {
    console.log(`\n[Job ${jobId}] Starting analysis for: ${url}`);
    updateJob({ status: 'processing' });

    // Step 1: Capture screenshots
    console.log(`[Job ${jobId}] 📸 Capturing screenshots...`);
    const screenshots = await captureScreenshots(url, jobId);
    updateJob({ screenshots });
    console.log(`[Job ${jobId}] ✅ Screenshots captured`);

    // Step 2: Run all persona agents in parallel
    const activePersonas = Array.isArray(personaIds) && personaIds.length > 0
      ? personas.filter((p) => personaIds.includes(p.id))
      : personas; // fallback to all if none specified

    console.log(`[Job ${jobId}] 🤖 Analyzing with ${activePersonas.length} personas in parallel...`);
    const analysisPromises = activePersonas.map(persona => 
      analyzeWithPersona(persona, screenshots.desktop)
    );

    const results = await Promise.all(analysisPromises);
    
    // Filter out nulls (failed agents) and log successes
    const personaInsights = results.filter((r): r is UXReport['personaInsights'][0] => r !== null);
    
    updateJob({ personaInsights: [...personaInsights] });

    personaInsights.forEach(analysis => {
      console.log(`\n[Job ${jobId}] ✅ ${analysis.personaName} analysis complete (score: ${analysis.overallScore}/10)`);
      console.dir(analysis, { depth: null, colors: true });
    });

    // Step 3: Aggregate results and detect conflicts
    console.log(`[Job ${jobId}] 📊 Building final report...`);
    const report = buildReport(jobId, url, personaInsights, screenshots);
    const analysisTime = Date.now() - startTime;

    updateJob({
      ...report,
      status: 'complete',
      analysisTime,
      completedAt: new Date().toISOString(),
    });

    console.log(`[Job ${jobId}] 🎉 Analysis complete in ${(analysisTime / 1000).toFixed(1)}s`);
  } catch (error) {
    const err = error as Error;
    console.error(`[Job ${jobId}] ❌ Error:`, err.message);
    updateJob({
      status: 'error',
      error: err.message,
      analysisTime: Date.now() - startTime,
    });
  }
}
