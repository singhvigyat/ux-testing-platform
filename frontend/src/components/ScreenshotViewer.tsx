import { useState } from 'react';
import type { ScreenshotSet } from '../types';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface Props {
  screenshots: ScreenshotSet;
  url: string;
}

type Tab = 'desktop' | 'mobile' | 'tablet';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'desktop', label: 'Desktop', icon: <Monitor size={14} /> },
  { id: 'mobile', label: 'Mobile', icon: <Smartphone size={14} /> },
  { id: 'tablet', label: 'Tablet', icon: <Tablet size={14} /> },
];

export default function ScreenshotViewer({ screenshots, url }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('desktop');
  const [lightbox, setLightbox] = useState(false);

  const currentSrc = screenshots[activeTab];

  return (
    <div className="glass-card animate-fade-in-up" style={{ overflow: 'hidden' }}>
      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`screenshot-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <a
          href={currentSrc}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent-1)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          ↗ Open full size
        </a>
      </div>

      {/* Screenshot Display */}
      <div
        style={{
          position: 'relative',
          background: '#0a0a1a',
          cursor: 'zoom-in',
          maxHeight: activeTab === 'tablet' ? '500px' : 'auto',
          overflowY: activeTab === 'tablet' ? 'auto' : 'hidden',
        }}
        onClick={() => setLightbox(true)}
      >
        <img
          src={currentSrc}
          alt={`${activeTab} screenshot of ${url}`}
          style={{
            width: activeTab === 'mobile' ? '375px' : '100%',
            height: activeTab === 'desktop' ? '400px' : 'auto',
            objectFit: activeTab === 'desktop' ? 'cover' : undefined,
            objectPosition: 'top',
            display: 'block',
            margin: activeTab === 'mobile' ? '0 auto' : undefined,
          }}
          loading="lazy"
        />
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '11px',
          }}
        >
          Click to enlarge
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            backdropFilter: 'blur(8px)',
          }}
        >
          <img
            src={currentSrc}
            alt="Enlarged screenshot"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            }}
          />
        </div>
      )}
    </div>
  );
}
