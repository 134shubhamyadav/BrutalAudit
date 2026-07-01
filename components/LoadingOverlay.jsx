'use client';
import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  "Cloning the repository (virtually)...",
  "Judging your variable names...",
  "Consulting the AI oracle...",
  "Running static analysis...",
  "Hunting for hardcoded passwords...",
  "Scanning for infinite loops...",
  "Evaluating architecture coupling...",
  "Reading your comments... wait, there are none.",
  "Looking for N+1 queries...",
  "Wondering why this file is 3,000 lines long...",
  "Generating brutal honesty...",
];

export default function LoadingOverlay({ repoName, currentStep, onCancel }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { key: 'fetching', label: 'Fetching file tree…' },
    { key: 'analyzing', label: 'Running AI analysis…' },
    { key: 'saving', label: 'Generating report…' },
  ];
  
  const activeIndex = steps.findIndex(s => s.key === currentStep);

  const handleCancelClick = () => {
    if (window.confirm("Are you sure? This will halt the analysis process and discard any progress.")) {
      if (onCancel) onCancel();
    }
  };

  return (
    <div className="loading-overlay anim-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 5, 5, 0.98)', backdropFilter: 'blur(16px)', zIndex: 1000, position: 'fixed', inset: 0, overflow: 'hidden' }}>
      
      {/* Side Ambient Glows */}
      <div style={{ position: 'absolute', top: '20%', left: '-10%', width: '40vw', height: '60vh', background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vh', background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }}></div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Scanner Visual */}
        <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '2rem' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(239, 68, 68, 0.2)' }}></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', borderTop: '2px solid #ef4444', borderRight: '2px solid #ef4444', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', borderTop: '2px solid #f87171', borderLeft: '2px solid #f87171', animation: 'spin 1.5s linear infinite reverse' }}></div>
        <div style={{ position: 'absolute', inset: '20px', borderRadius: '50%', borderBottom: '2px solid #fca5a5', borderRight: '2px solid #fca5a5', animation: 'spin 2s linear infinite' }}></div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
          🕵️
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 600 }}>
        Analyzing <span className="grad-text">{repoName}</span>
      </h2>
      
      <div style={{ 
        height: '24px', 
        marginBottom: '2rem', 
        color: 'var(--text2)', 
        fontSize: '1rem',
        fontFamily: 'monospace',
        transition: 'opacity 0.3s ease'
      }}>
        {`> ${LOADING_MESSAGES[messageIndex]}`}
        <span style={{ animation: 'pulse 1s infinite' }}>_</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        {steps.map((step, idx) => {
          const isActive = currentStep === step.key;
          const isDone = activeIndex > idx;
          const isPending = activeIndex < idx;

          return (
            <div key={step.key} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              padding: '12px 16px',
              borderRadius: '8px',
              background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.3s ease',
              opacity: isPending ? 0.5 : 1
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDone ? '#10B981' : isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                border: isActive ? '2px solid #ef4444' : 'none',
                color: '#fff',
                fontSize: '12px'
              }}>
                {isDone ? '✓' : isActive ? <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} /> : (idx + 1)}
              </div>
              <span style={{ 
                color: isDone ? '#10B981' : isActive ? '#fff' : 'var(--text3)',
                fontWeight: isActive ? 600 : 400
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'relative', zIndex: 1, marginTop: '3rem' }}>
        <button 
          className="btn-ghost ripple-btn" 
          onClick={handleCancelClick}
          style={{
            padding: '8px 24px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ fontSize: '16px' }}>✕</span> Cancel Analysis
        </button>
      </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}} />
    </div>
  );
}
