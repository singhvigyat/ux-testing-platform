import type { UXReport } from '../types';
import { Globe, Clock, TrendingUp, Lightbulb, AlertTriangle } from 'lucide-react';

interface Props {
  report: UXReport;
}

function OverallScoreGauge({ score }: { score: number }) {
  const radius = 60;
  const circumference = Math.PI * radius; // semicircle
  const progress = (score / 10) * circumference;
  const color = score <= 3 ? '#10b981' : score <= 6 ? '#f59e0b' : '#ef4444';
  const label = score <= 3 ? 'Good' : score <= 6 ? 'Needs Work' : 'Critical Issues';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="160" height="90" viewBox="0 0 160 90" style={{ overflow: 'visible' }}>
        {/* Background semicircle */}
        <path
          d="M 20 80 A 60 60 0 0 1 140 80"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress semicircle */}
        <path
          d="M 20 80 A 60 60 0 0 1 140 80"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Score text */}
        <text x="80" y="70" textAnchor="middle" fill={color} fontSize="32" fontWeight="800" fontFamily="Inter">
          {score.toFixed(1)}
        </text>
        <text x="80" y="88" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Inter">
          / 10 severity
        </text>
      </svg>
      <div
        style={{
          display: 'inline-block',
          marginTop: '12px',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 700,
          background: `${color}20`,
          border: `1px solid ${color}40`,
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function SummaryPanel({ report }: Props) {
  return (
    <div className="glass-card animate-fade-in-up" style={{ overflow: 'hidden', marginBottom: '0' }}>
      {/* Header bar */}
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={18} color="var(--color-accent-1)" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>UX Analysis Report</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <Globe size={11} />
            <span className="mono">{report.url}</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <Clock size={12} />
          {report.analysisTime ? `Completed in ${(report.analysisTime / 1000).toFixed(1)}s` : ''}
        </div>
      </div>

      <div style={{ padding: '28px 24px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Score gauge */}
        <OverallScoreGauge score={report.severityScore} />

        {/* Summary text + stats */}
        <div>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              marginBottom: '24px',
            }}
          >
            {report.summary}
          </p>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '24px',
            }}
          >
            {[
              { label: 'Personas', value: report.personaInsights.length, color: 'var(--color-accent-1)' },
              { label: 'Issues Found', value: report.majorIssues.length, color: '#f59e0b' },
              { label: 'Conflicts', value: report.conflicts.length, color: '#ef4444' },
              { label: 'Recommendations', value: report.recommendations.length, color: '#10b981' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                  minWidth: '90px',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Major Issues */}
          {report.majorIssues.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#f87171',
                  marginBottom: '10px',
                }}
              >
                <AlertTriangle size={14} />
                Major Issues
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {report.majorIssues.slice(0, 4).map((issue, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      paddingLeft: '16px',
                      position: 'relative',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ position: 'absolute', left: 0, top: '7px', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#10b981',
                  marginBottom: '10px',
                }}
              >
                <Lightbulb size={14} />
                Recommendations
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {report.recommendations.slice(0, 3).map((rec, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      paddingLeft: '16px',
                      position: 'relative',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ position: 'absolute', left: 0, top: '7px', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', opacity: 0.7 }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
