'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { ShieldCheck, Calendar, Zap, Rocket } from 'lucide-react';

export default function BillingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const promoEnd = new Date('2026-08-15T23:59:59Z').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = promoEnd - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) return null;
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div id="billing" className="page dashboard-layout active">
      <Sidebar activeId="settings" />

      <main className="main-content">
        <div className="dash-header">
          <div>
            <div className="dash-title">Billing & Subscription 💳</div>
            <div className="dash-sub">Manage your BrutalAudit plan and limits.</div>
          </div>
          <button className="btn-ghost ripple-btn" onClick={() => router.push('/settings')}>
            ← Back to Settings
          </button>
        </div>

        <div className="glass dash-widget" style={{ marginTop: '32px', padding: '40px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(10, 10, 10, 0.8) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '32px', color: '#fff' }}>Pro Plan</h2>
                <span style={{ background: '#EF4444', color: '#fff', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>
                  PROMO ACTIVE
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '500px', lineHeight: '1.6' }}>
                You currently have unrestricted access to all Pro features for free during our special promotional period!
              </p>
            </div>
            
            <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.5)', minWidth: '300px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} /> Promo Ends In
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{timeLeft.days}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Days</div>
                </div>
                <div style={{ fontSize: '32px', color: 'var(--text-muted)', fontWeight: 'bold' }}>:</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hours</div>
                </div>
                <div style={{ fontSize: '32px', color: 'var(--text-muted)', fontWeight: 'bold' }}>:</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{timeLeft.mins.toString().padStart(2, '0')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mins</div>
                </div>
                <div style={{ fontSize: '32px', color: 'var(--text-muted)', fontWeight: 'bold' }}>:</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#EF4444', fontFamily: 'monospace' }}>{timeLeft.secs.toString().padStart(2, '0')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Secs</div>
                </div>
              </div>
              <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Billing will be enabled after August 15, 2026.
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ color: '#10B981', padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', height: 'fit-content' }}>
                <Zap size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff' }}>Unlimited Audits</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Scan as many repositories as you want without hitting any rate limits.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ color: '#F59E0B', padding: '10px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', height: 'fit-content' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff' }}>Deep Security Analysis</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Access to advanced vulnerability detection and architectural flaw scanning.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ color: '#3B82F6', padding: '10px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', height: 'fit-content' }}>
                <Rocket size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff' }}>AI Auto-Fixes</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Get copy-pasteable code patches directly from the AI for critical issues.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
