import { Router } from 'express';
import { startAnalysis, getAnalysisStatus } from '../controllers/analyzeController';
import { requireAuth } from '../middleware/requireAuth';

export const analyzeRouter = Router();

/**
 * POST /api/analyze
 * Start a new UX analysis job
 * Body: { url: string }
 */
analyzeRouter.post('/', requireAuth, startAnalysis);

/**
 * GET /api/analyze/:jobId
 * Get the status and results of an analysis job
 */
analyzeRouter.get('/:jobId', requireAuth, getAnalysisStatus);
