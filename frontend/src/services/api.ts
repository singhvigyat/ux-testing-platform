import type { UXReport } from '../types';

const API_BASE = '/api';

/**
 * Start a new UX analysis job
 */
export async function startAnalysis(url: string, personaIds?: string[]): Promise<{ jobId: string; message: string }> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, personaIds }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  return res.json();
}

/**
 * Get the current status / results of an analysis job
 */
export async function getAnalysisStatus(jobId: string): Promise<UXReport> {
  const res = await fetch(`${API_BASE}/analyze/${jobId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  return res.json();
}
