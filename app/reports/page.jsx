'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar.jsx';
import EmptyState, { ErrorState } from '../../components/EmptyState.jsx';
import { api } from '../../lib/api.js';

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function ReportsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.audits.list()
      .then(data => { setAudits(data.audits || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  return (
    <div className="page dashboard-layout active">
      <Sidebar activeId="reports" />
      <main className="main-content">
        <div className="dash-header">
          <div>
            <div className="dash-title">Audit History</div>
            <div className="dash-sub">All your past audits across all repositories.</div>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-ring premium-glow" style={{ width: '32px', height: '32px', margin: '0 auto 16px auto' }}></div>
            <div style={{ color: 'var(--text-secondary)' }}>Loading history...</div>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : audits.length === 0 ? (
          <EmptyState 
            icon="📭" 
            title="No audits found" 
            description="You haven't run any repository audits yet."
            action={{ label: 'Go to Repositories', onClick: () => router.push('/repos') }}
          />
        ) : (
          <div className="grid">
            {audits.map(audit => (
              <div key={audit.id} className="repo-card glass-panel anim-enter" onClick={() => router.push(`/report/${audit.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="repo-name" style={{ margin: 0 }}>{audit.repo_name}</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                      {audit.repo_owner}
                    </div>
                  </div>
                  {audit.scores && audit.scores.overall && (
                    <div className="score-badge" style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--text-primary)' }}>
                      {audit.scores.overall}/100
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div>
                    <span className="icon">🕒</span> {timeAgo(audit.completed_at)}
                  </div>
                  <div>
                    <span className="icon">🛡️</span> Security {audit.scores?.security || 0}
                  </div>
                  <div>
                    <span className="icon">⚡</span> Perf {audit.scores?.performance || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
