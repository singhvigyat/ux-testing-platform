import type { UXReport } from '../types';
import { useMemo } from 'react';

const PERSONAS_META: Record<string, { avatar: string; color: string; label: string }> = {
  'elderly_non_technical': { avatar: '👵', color: '#f59e0b', label: 'Maya (Elderly User)' },
  'developer': { avatar: '💻', color: '#3b82f6', label: 'Dev (Developer)' },
  'first_time_visitor': { avatar: '👀', color: '#10b981', label: 'Arjun (First-time Visitor)' },
  'visually_impaired': { avatar: '🦯', color: '#8b5cf6', label: 'Priya (Visually Impaired)' },
};

interface Props {
  report: UXReport | null;
}

export default function AnalysisProgress({ report }: Props) {
  const completedPersonas = report?.personaInsights.map((p) => p.personaId) ?? [];
  const hasScreenshots = !!(report?.screenshots?.desktop);
  const selectedPersonas = report?.selectedPersonas ?? ['elderly_non_technical']; // fallback

  const ANALYSIS_STEPS = useMemo(() => {
    const steps = [
      { id: 'screenshot', label: 'Capturing screenshots with Playwright' }
    ];
    
    selectedPersonas.forEach(pid => {
      const meta = PERSONAS_META[pid] || { label: pid, avatar: '🤖' };
      steps.push({ id: pid, label: `Analyzing as ${meta.label}` });
    });
    
    steps.push({ id: 'aggregate', label: 'Aggregating results & detecting conflicts' });
    return steps;
  }, [selectedPersonas]);

  const getStepStatus = (stepId: string): 'done' | 'active' | 'pending' => {
    if (stepId === 'screenshot') return hasScreenshots ? 'done' : (report?.status === 'processing' ? 'active' : 'pending');
    if (stepId === 'aggregate') return report?.status === 'processing' && completedPersonas.length === selectedPersonas.length ? 'active' : 'pending';
    if (completedPersonas.includes(stepId)) return 'done';
    
    // Active if it's currently running (since they run in parallel, all selected but not completed are 'active')
    if (hasScreenshots && report?.status === 'processing') {
      if (selectedPersonas.includes(stepId) && !completedPersonas.includes(stepId)) return 'active';
    }
    return 'pending';
  };


  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '60px auto',
        textAlign: 'center',
      }}
      className="animate-fade-in"
    >
      {/* Spinner orb */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
          border: '2px solid rgba(99,102,241,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          fontSize: '32px',
        }}
        className="animate-pulse-glow"
      >
        🔍
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
        Analyzing Your Website
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
        {report?.url ? (
          <>
            Running AI persona agent on{' '}
            <span style={{ color: 'var(--color-accent-1)' }}>
              {new URL(report.url).hostname}
            </span>
            . This typically takes 30–90 seconds.
          </>
        ) : (
          'Starting analysis pipeline...'
        )}
      </p>

      {/* Progress steps */}
      <div
        className="glass-card"
        style={{ padding: '24px', textAlign: 'left' }}
      >
        {ANALYSIS_STEPS.map((step, idx) => {
          const status = getStepStatus(step.id);
          const meta = PERSONAS_META[step.id];

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 0',
                borderBottom: idx < ANALYSIS_STEPS.length - 1 ? '1px solid var(--color-border)' : 'none',
                opacity: status === 'pending' ? 0.35 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {/* Status indicator */}
              <div style={{ width: '28px', height: '28px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {status === 'done' ? (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.2)',
                      border: '1px solid rgba(16,185,129,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                    }}
                  >
                    ✓
                  </div>
                ) : status === 'active' ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: '2px solid var(--color-text-muted)',
                    }}
                  />
                )}
              </div>

              {/* Avatar for persona steps */}
              {meta && (
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{meta.avatar}</span>
              )}

              {/* Label */}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: status === 'active' ? 600 : 400,
                  color: status === 'active' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Persona completed indicator */}
      {completedPersonas.length > 0 && (
        <div
          style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'center' }}
        >
          {completedPersonas.map((pid) => {
            const meta = PERSONAS_META[pid];
            return meta ? (
              <span
                key={pid}
                style={{
                  fontSize: '24px',
                  opacity: 0.9,
                }}
                title={pid}
              >
                {meta.avatar}
              </span>
            ) : null;
          })}
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', alignSelf: 'center', marginLeft: '4px' }}>
            {completedPersonas.length}/{selectedPersonas.length} personas done
          </span>
        </div>
      )}
    </div>
  );
}
