import { useState } from 'react';
import type { PersonaAnalysis } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PERSONA_META: Record<string, { avatar: string; color: string; bgColor: string }> = {
  'elderly-user': { avatar: '👵', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)' },
  'developer-user': { avatar: '👨‍💻', color: '#6366f1', bgColor: 'rgba(99,102,241,0.1)' },
  'first-time-visitor': { avatar: '🧑', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)' },
  'visually-impaired': { avatar: '🦯', color: '#a855f7', bgColor: 'rgba(168,85,247,0.1)' },
};

interface Props {
  insight: PersonaAnalysis;
  index: number;
}

function getSeverityClass(score: number): string {
  if (score <= 3) return 'severity-low';
  if (score <= 6) return 'severity-medium';
  return 'severity-high';
}

function getSeverityLabel(score: number): string {
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
}

function ScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color = score <= 3 ? '#10b981' : score <= 6 ? '#f59e0b' : '#ef4444';

  return (
    <div className="score-ring">
      <svg width="72" height="72" viewBox="0 0 72 72">
        {/* Background track */}
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        {/* Progress arc */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="score-center" style={{ color }}>
        {score}
      </div>
    </div>
  );
}

export default function PersonaCard({ insight, index }: Props) {
  const [expanded, setExpanded] = useState(true);
  const meta = PERSONA_META[insight.personaId] ?? { avatar: '🤖', color: '#6366f1', bgColor: 'rgba(99,102,241,0.1)' };

  const issuesCount =
    insight.usabilityIssues.length +
    insight.accessibilityIssues.length +
    insight.confusionPoints.length;

  return (
    <div
      className="glass-card animate-fade-in-up"
      id={`persona-card-${insight.personaId}`}
      style={{
        overflow: 'hidden',
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both',
        border: `1px solid ${meta.color}25`,
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: expanded ? '1px solid var(--color-border)' : 'none',
          background: meta.bgColor,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            className="persona-avatar"
            style={{
              background: meta.bgColor,
              border: `2px solid ${meta.color}50`,
            }}
          >
            {meta.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{insight.persona}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {issuesCount} issue{issuesCount !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ScoreRing score={insight.severityScore} />
          {expanded ? (
            <ChevronUp size={16} color="var(--color-text-muted)" />
          ) : (
            <ChevronDown size={16} color="var(--color-text-muted)" />
          )}
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div style={{ padding: '20px' }}>
          {/* Severity badge */}
          <div style={{ marginBottom: '20px' }}>
            <span className={`severity-badge ${getSeverityClass(insight.severityScore)}`}>
              Severity: {getSeverityLabel(insight.severityScore)} ({insight.severityScore}/10)
            </span>
          </div>

          {/* Positive Observations */}
          {insight.positiveObservations.length > 0 && (
            <IssueSection
              title="✅ What works well"
              items={insight.positiveObservations}
              color="#10b981"
              bgColor="rgba(16,185,129,0.08)"
              borderColor="rgba(16,185,129,0.2)"
            />
          )}

          {/* Usability Issues */}
          {insight.usabilityIssues.length > 0 && (
            <IssueSection
              title="⚠️ Usability Issues"
              items={insight.usabilityIssues}
              color="#f59e0b"
              bgColor="rgba(245,158,11,0.08)"
              borderColor="rgba(245,158,11,0.2)"
            />
          )}

          {/* Accessibility Issues */}
          {insight.accessibilityIssues.length > 0 && (
            <IssueSection
              title="♿ Accessibility Issues"
              items={insight.accessibilityIssues}
              color="#a855f7"
              bgColor="rgba(168,85,247,0.08)"
              borderColor="rgba(168,85,247,0.2)"
            />
          )}

          {/* Confusion Points */}
          {insight.confusionPoints.length > 0 && (
            <IssueSection
              title="❓ Confusion Points"
              items={insight.confusionPoints}
              color="#ef4444"
              bgColor="rgba(239,68,68,0.08)"
              borderColor="rgba(239,68,68,0.2)"
            />
          )}
        </div>
      )}
    </div>
  );
}

function IssueSection({
  title,
  items,
  color,
  bgColor,
  borderColor,
}: {
  title: string;
  items: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '14px',
        borderRadius: '10px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 600, color, marginBottom: '10px' }}>
        {title}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
              paddingLeft: '16px',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: color,
                opacity: 0.7,
              }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
