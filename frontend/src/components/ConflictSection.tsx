import type { UXConflict } from '../types';
import { Zap } from 'lucide-react';

interface Props {
  conflicts: UXConflict[];
}

export default function ConflictSection({ conflicts }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {conflicts.map((conflict, idx) => (
        <div
          key={idx}
          className="glass-card animate-fade-in-up"
          id={`conflict-${idx}`}
          style={{
            overflow: 'hidden',
            border: '1px solid rgba(239,68,68,0.2)',
            animationDelay: `${idx * 80}ms`,
            animationFillMode: 'both',
          }}
        >
          {/* Conflict header */}
          <div
            style={{
              padding: '14px 20px',
              background: 'rgba(239,68,68,0.06)',
              borderBottom: '1px solid rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={14} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#f87171', fontWeight: 700 }}>UX Conflict</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {conflict.topic}
              </div>
            </div>
          </div>

          {/* Split view */}
          <div className="conflict-split" style={{ padding: '20px', gap: '16px' }}>
            {/* Perspective A — positive */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#10b981',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                👍 Works for {conflict.personaA}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                "{conflict.perspectiveA}"
              </p>
            </div>

            {/* Perspective B — negative */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#f87171',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                👎 Problematic for {conflict.personaB}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                "{conflict.perspectiveB}"
              </p>
            </div>
          </div>
        </div>
      ))}

      {conflicts.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: '32px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
          <p>No significant conflicts detected between personas.</p>
        </div>
      )}
    </div>
  );
}
