// Empty states that match the existing design system exactly
export default function EmptyState({ icon, title, message, cta, onCta }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', textAlign: 'center'
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'rgba(255,30,30,0.08)', border: '1px solid rgba(255,30,30,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '32px', marginBottom: '20px'
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: '1.6', marginBottom: cta ? '24px' : 0 }}>
        {message}
      </div>
      {cta && (
        <button className="btn-red premium-glow ripple-btn" onClick={onCta} style={{ marginTop: '4px' }}>
          {cta}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px', textAlign: 'center'
    }}>
      <div style={{
        width: '60px', height: '60px', borderRadius: '16px',
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', marginBottom: '16px'
      }}>
        ⚠️
      </div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#EF4444', marginBottom: '8px' }}>
        Something went wrong
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '300px', marginBottom: '20px', lineHeight: '1.6' }}>
        {message || 'An unexpected error occurred. Please try again.'}
      </div>
      {onRetry && (
        <button className="btn-ghost ripple-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
