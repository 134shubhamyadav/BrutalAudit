/**
 * Lightweight zero-dependency toast system.
 * Usage: import { toast } from '@/components/Toast';
 *        toast.success('Done!');
 *        toast.error('Something broke');
 *        toast.info('Heads up');
 *        toast.warning('Be careful');
 */

'use client';
import { useEffect, useState, useCallback } from 'react';

let _addToast = null;

export function toast(message, type = 'info') {
  if (_addToast) {
    _addToast({ message, type, id: Date.now() + Math.random() });
  } else {
    // Fallback if called before provider mounts (should not happen in practice)
    console.warn('[Toast]', type, message);
  }
}

toast.success = (msg) => toast(msg, 'success');
toast.error   = (msg) => toast(msg, 'error');
toast.warning = (msg) => toast(msg, 'warning');
toast.info    = (msg) => toast(msg, 'info');

const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', text: '#10B981' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  text: '#EF4444' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#F59E0B' },
  info:    { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.4)', text: '#818CF8' },
};

function ToastItem({ item, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 4 seconds
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 350);
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [item.id, onRemove]);

  const c = COLORS[item.type] || COLORS.info;

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(item.id), 350); }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '14px 18px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        maxWidth: '380px',
        width: '100%',
        cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{ICONS[item.type]}</span>
      <span style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5', flex: 1 }}>
        {item.message}
      </span>
    </div>
  );
}

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts(prev => [...prev.slice(-4), t]); // Max 5 toasts
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(item => (
        <div key={item.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem item={item} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
