import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startAnalysis } from '../services/api';
import { Bot, Scan, Users, Zap, Shield, TrendingUp } from 'lucide-react';

const EXAMPLE_URLS = [
  'https://stripe.com',
  'https://linear.app',
  'https://notion.so',
  'https://vercel.com',
];

const AVAILABLE_PERSONAS = [
  { id: 'elderly-user', avatar: '👵', name: 'Margaret', role: 'Elderly User', color: '#f59e0b' },
  { id: 'developer-user', avatar: '👨‍💻', name: 'Alex', role: 'Developer', color: '#6366f1' },
  { id: 'first-time-visitor', avatar: '🧑', name: 'Jordan', role: 'First-Timer', color: '#10b981' },
  { id: 'visually-impaired', avatar: '🦯', name: 'Sam', role: 'Low Vision', color: '#a855f7' },
];

const FEATURES = [
  {
    icon: <Users size={20} />,
    title: '4 AI Personas',
    desc: 'Elderly user, developer, first-time visitor & accessibility expert',
  },
  {
    icon: <Scan size={20} />,
    title: 'Screenshot Analysis',
    desc: 'Captures desktop, mobile & full-page views automatically',
  },
  {
    icon: <Zap size={20} />,
    title: 'Conflict Detection',
    desc: 'Finds where different users disagree on UX quality',
  },
  {
    icon: <Shield size={20} />,
    title: 'Accessibility Audit',
    desc: 'WCAG-aligned visual accessibility checks',
  },
  {
    icon: <TrendingUp size={20} />,
    title: 'Severity Scoring',
    desc: 'Weighted issue prioritization across all personas',
  },
  {
    icon: <Bot size={20} />,
    title: 'Gemini AI',
    desc: 'Powered by Google Gemini 2.0 Flash vision model',
  },
];

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['first-time-visitor']);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (selectedPersonas.length === 0) {
      setError('Please select at least one persona.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { jobId } = await startAnalysis(url.trim(), selectedPersonas);
      navigate(`/report/${jobId}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to start analysis. Is the backend running?');
      setLoading(false);
    }
  };

  const togglePersona = (id: string) => {
    setSelectedPersonas(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const useExample = (exUrl: string) => setUrl(exUrl);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Ambient glow orbs */}
      <div
        style={{
          position: 'fixed',
          top: '10%',
          left: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container-main" style={{ paddingTop: '80px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
        {/* ── Header ── */}
        <header style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#818cf8',
              fontWeight: 500,
            }}
            className="animate-fade-in"
          >
            <Bot size={14} />
            Multi-Agent AI System • Powered by Gemini Vision
          </div>

          <h1
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px' }}
            className="animate-fade-in delay-100"
          >
            <span className="gradient-text">Multi-Agent</span>
            <br />
            UX Testing Platform
          </h1>

          <p
            style={{
              fontSize: '1.2rem',
              color: 'var(--color-text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
            className="animate-fade-in delay-200"
          >
            Submit any website URL. Four AI personas — each simulating a different user —
            independently analyze the interface and surface{' '}
            <span style={{ color: 'var(--color-accent-1)' }}>conflicts, accessibility issues,</span> and{' '}
            <span style={{ color: 'var(--color-accent-1)' }}>usability problems</span> invisible to a single lens.
          </p>
        </header>

        {/* ── URL Input Form ── */}
        <div
          style={{ maxWidth: '680px', margin: '0 auto 48px' }}
          className="animate-fade-in delay-300"
        >
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '8px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--color-border)',
                backdropFilter: 'blur(12px)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              id="url-form-container"
            >
              <input
                id="website-url-input"
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                placeholder="Enter website URL (e.g. https://stripe.com)"
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: '16px',
                  padding: '12px 16px',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  const container = e.target.closest('#url-form-container') as HTMLElement;
                  if (container) {
                    container.style.borderColor = 'var(--color-border-accent)';
                    container.style.boxShadow = 'var(--shadow-glow)';
                  }
                }}
                onBlur={(e) => {
                  const container = e.target.closest('#url-form-container') as HTMLElement;
                  if (container) {
                    container.style.borderColor = 'var(--color-border)';
                    container.style.boxShadow = 'none';
                  }
                }}
              />
              <button
                id="start-analysis-btn"
                type="submit"
                disabled={loading || !url.trim()}
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: '15px', whiteSpace: 'nowrap' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: 'spin 1s linear infinite' }}
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Starting...
                  </span>
                ) : (
                  'Analyze →'
                )}
              </button>
            </div>
          </form>

          {/* Error message */}
          {error && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                fontSize: '14px',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Persona Selectors */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
          }}>
            {AVAILABLE_PERSONAS.map((p) => {
              const isActive = selectedPersonas.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePersona(p.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    background: isActive ? `${p.color}25` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isActive ? `${p.color}50` : 'var(--color-border)'}`,
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    opacity: isActive ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = `${p.color}50`;
                      e.currentTarget.style.color = 'var(--color-text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  <span>{p.avatar}</span>
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Example URLs */}
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Try:</span>
            {EXAMPLE_URLS.map((exUrl) => (
              <button
                key={exUrl}
                onClick={() => useExample(exUrl)}
                style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.4)';
                  (e.target as HTMLButtonElement).style.color = 'var(--color-accent-1)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                  (e.target as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                }}
              >
                {new URL(exUrl).hostname}
              </button>
            ))}
          </div>
        </div>

        {/* ── Persona Showcase ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            maxWidth: '900px',
            margin: '0 auto 64px',
          }}
          className="animate-fade-in delay-400"
        >
          {AVAILABLE_PERSONAS.map((persona) => (
            <div
              key={persona.id}
              className="glass-card"
              style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  background: `${persona.color}15`,
                  border: `2px solid ${persona.color}40`,
                  flexShrink: 0,
                }}
              >
                {persona.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {persona.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {persona.role}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Feature Grid ── */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="animate-fade-in delay-500">
          <h2
            style={{
              textAlign: 'center',
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '32px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            What gets analyzed
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass-card"
                style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent-1)',
                    flexShrink: 0,
                  }}
                >
                  {feature.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {feature.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {feature.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
