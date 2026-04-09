import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnalysisStatus } from '../services/api';
import type { UXReport } from '../types';
import AnalysisProgress from '../components/AnalysisProgress';
import ScreenshotViewer from '../components/ScreenshotViewer';
import PersonaCard from '../components/PersonaCard';
import ConflictSection from '../components/ConflictSection';
import SummaryPanel from '../components/SummaryPanel';
import { ArrowLeft, Clock, Globe } from 'lucide-react';

const POLL_INTERVAL = 2500; // ms

export default function ReportPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<UXReport | null>(null);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const data = await getAnalysisStatus(jobId);
        setReport(data);

        if (data.status === 'complete' || data.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (err) {
        setError((err as Error).message);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    // Fetch immediately, then poll
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId]);

  const isLoading = !report || report.status === 'pending' || report.status === 'processing';

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{ padding: '12px 24px' }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Ambient glow */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          right: '10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container-main" style={{ paddingTop: '40px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
        {/* ── Top Nav ── */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}
          className="animate-fade-in"
        >
          <button
            onClick={() => navigate('/')}
            id="back-to-home-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              color: 'var(--color-text-secondary)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.borderColor = 'var(--color-border-accent)';
              (e.currentTarget).style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.borderColor = 'var(--color-border)';
              (e.currentTarget).style.color = 'var(--color-text-secondary)';
            }}
          >
            <ArrowLeft size={14} />
            New Analysis
          </button>

          {report && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Globe size={14} />
              <span className="mono" style={{ color: 'var(--color-text-primary)' }}>
                {report.url ? new URL(report.url).hostname : '—'}
              </span>
            </div>
          )}
        </div>

        {/* ── Loading / Progress State ── */}
        {isLoading && (
          <AnalysisProgress report={report} />
        )}

        {/* ── Error State ── */}
        {report?.status === 'error' && (
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              marginBottom: '32px',
            }}
          >
            <h3 style={{ color: '#f87171', fontWeight: 700, marginBottom: '8px' }}>Analysis Failed</h3>
            <p style={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
              {report.error || 'An unknown error occurred during analysis.'}
            </p>
          </div>
        )}

        {/* ── Complete Report ── */}
        {report?.status === 'complete' && (
          <div className="animate-fade-in">
            {/* Summary Panel */}
            <SummaryPanel report={report} />

            <div className="divider" />

            {/* Screenshots */}
            <section style={{ marginBottom: '48px' }}>
              <h2 className="section-title">
                <span className="gradient-text">📸</span> Captured Screenshots
              </h2>
              <ScreenshotViewer screenshots={report.screenshots} url={report.url} />
            </section>

            <div className="divider" />

            {/* Persona Insights */}
            <section style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>
                  <span className="gradient-text">🤖</span> Persona Analyses
                </h2>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={13} />
                  {report.analysisTime ? `${(report.analysisTime / 1000).toFixed(1)}s total` : ''}
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '20px',
                }}
              >
                {report.personaInsights.map((insight, i) => (
                  <PersonaCard key={insight.personaId} insight={insight} index={i} />
                ))}
              </div>
            </section>

            {/* Conflicts */}
            {report.conflicts.length > 0 && (
              <>
                <div className="divider" />
                <section style={{ marginBottom: '48px' }}>
                  <h2 className="section-title">
                    <span className="gradient-text">⚡</span> UX Conflicts Detected
                  </h2>
                  <ConflictSection conflicts={report.conflicts} />
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
