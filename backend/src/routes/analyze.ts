import { Router } from 'express';
import { startAnalysis, getAnalysisStatus } from '../controllers/analyzeController';

export const analyzeRouter = Router();

/**
 * POST /api/analyze
 * Start a new UX analysis job
 * Body: { url: string }
 */
analyzeRouter.post('/', startAnalysis);

/**
 * GET /api/analyze/:jobId
 * Get the status and results of an analysis job
 */
analyzeRouter.get('/:jobId', getAnalysisStatus);
