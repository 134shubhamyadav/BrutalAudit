'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar.jsx';
import { StatCardSkeleton, RepoCardSkeleton } from '../../components/SkeletonCard.jsx';
import EmptyState, { ErrorState } from '../../components/EmptyState.jsx';
import { ScoreRadarChart, TrendsLineChart } from '../../components/Charts.jsx';
import AnimatedCounter from '../../components/AnimatedCounter';
import MagneticCard from '../../components/MagneticCard';
import { BarChart3, ShieldCheck, Component, Cpu, Rocket, HeartPulse } from 'lucide-react';
import { api } from '../../lib/api.js';

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function gradeColor(score) {
  if (score >= 85) return '#10B981';
  if (score >= 70) return '#F59E0B';
  return '#EF4444';
}

function scoreToGrade(score) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}



export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoadingStats(true);
    setError(null);
    try {
      const data = await api.dashboard.get();
      setStats(data.stats);
      setRecentAudits(data.recentAudits || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStats(false);
    }
  }

  const criticalCount = recentAudits.reduce((sum, a) => {
    return sum + (a.findings?.filter((f) => f.severity === 'critical').length || 0);
  }, 0);

  return (
    <div id="dashboard" className="page dashboard-layout active">
      <Sidebar activeId="dashboard" auditCount={stats?.totalAudits || 0} />

      <main className="main-content">
        <div className="dash-header">
          <div>
            <div className="dash-title">
              {greeting}, {user?.displayName?.split(' ')[0] || 'Developer'} 👋
            </div>
            <div className="dash-sub">
              {loadingStats
                ? 'Loading your dashboard…'
                : recentAudits.length === 0
                ? 'Run your first audit to get started.'
                : `You have ${recentAudits.length} recent audit${recentAudits.length !== 1 ? 's' : ''}${criticalCount > 0 ? `. ${criticalCount} critical issue${criticalCount !== 1 ? 's' : ''} need${criticalCount === 1 ? 's' : ''} attention.` : '. Looking good!'}`
              }
            </div>
          </div>
          <button
            className="btn-red premium-glow ripple-btn"
            onClick={() => router.push('/repos')}
          >
            + New Audit
          </button>
        </div>

        {/* Stat Cards */}
        <div className="overview-cards stagger-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {loadingStats ? (
            Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <MagneticCard className="glass ov-card hover-lift" style={{ '--i': 1 }}>
                <div className="ov-icon glow-icon"><BarChart3 size={24} /></div>
                <div className="ov-label">Overall Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <div className="ov-val">
                    <AnimatedCounter end={stats?.avgScore || 0} />
                  </div>
                  <span className="ov-val-suffix">/100</span>
                </div>
                <div className="ov-change change-up">
                  {stats?.avgScore ? `Grade ${scoreToGrade(stats.avgScore)}` : 'No audits'}
                </div>
              </MagneticCard>

              <MagneticCard className="glass ov-card hover-lift" style={{ '--i': 2 }}>
                <div className="ov-icon glow-icon" style={{ color: '#3B82F6' }}><ShieldCheck size={24} /></div>
                <div className="ov-label">Security Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <div className="ov-val">
                    <AnimatedCounter end={stats?.avgSecurity || 0} />
                  </div>
                  <span className="ov-val-suffix">/100</span>
                </div>
                <div className="ov-change" style={{ color: '#10B981' }}>
                  ✓ Core Vulnerability Safe
                </div>
              </MagneticCard>

              <MagneticCard className="glass ov-card hover-lift" style={{ '--i': 3 }}>
                <div className="ov-icon glow-icon" style={{ color: '#F59E0B' }}><Component size={24} /></div>
                <div className="ov-label">Architecture Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <div className="ov-val">
                    <AnimatedCounter end={stats?.avgArchitecture || 0} />
                  </div>
                  <span className="ov-val-suffix">/100</span>
                </div>
                <div className="ov-change" style={{ color: '#a1a1aa' }}>
                  Decoupled layers
                </div>
              </MagneticCard>

              <MagneticCard className="glass ov-card hover-lift" style={{ '--i': 4 }}>
                <div className="ov-icon glow-icon" style={{ color: '#EF4444' }}><Cpu size={24} /></div>
                <div className="ov-label">AI Slop Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <div className="ov-val" style={{ color: (stats?.avgSlop || 0) < 50 ? '#EF4444' : '#FAFAFA' }}>
                    <AnimatedCounter end={stats?.avgSlop || 0} />
                  </div>
                  <span className="ov-val-suffix">/100</span>
                </div>
                <div className="ov-change" style={{ color: (stats?.avgSlop || 0) < 50 ? '#EF4444' : '#22C55E' }}>
                  {(stats?.avgSlop || 0) < 50 ? '⚠️ High AI generated slop' : '✓ Clean original code'}
                </div>
              </MagneticCard>

              <MagneticCard className="glass ov-card hover-lift" style={{ '--i': 5 }}>
                <div className="ov-icon glow-icon" style={{ color: '#22C55E' }}><Rocket size={24} /></div>
                <div className="ov-label">Production Readiness</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <div className="ov-val">
                    <AnimatedCounter end={stats?.avgReadiness || 0} />
                  </div>
                  <span className="ov-val-suffix">/100</span>
                </div>
                <div className="ov-change" style={{ color: '#22C55E' }}>
                  Docker & CI pipelines
                </div>
              </MagneticCard>

              <MagneticCard className="glass ov-card hover-lift" style={{ '--i': 6 }}>
                <div className="ov-icon glow-icon" style={{ color: '#a1a1aa' }}><HeartPulse size={24} /></div>
                <div className="ov-label">Repository Health</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <div className="ov-val">
                    <AnimatedCounter end={stats?.avgHealth || 0} />
                  </div>
                  <span className="ov-val-suffix">/100</span>
                </div>
                <div className="ov-change" style={{ color: '#22C55E' }}>
                  Good maintainability
                </div>
              </MagneticCard>

            </>
          )}
        </div>

        {/* Recent Audits */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
          
          <div className="glass dash-widget hover-glow">
            <div className="widget-header">
              <h3>Audit Trends</h3>
            </div>
            {!loadingStats && recentAudits.length === 0 ? (
              <EmptyState icon="📈" title="No trends yet" message="Run multiple audits to see your score progression." />
            ) : loadingStats ? (
              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
              </div>
            ) : (
              <TrendsLineChart audits={recentAudits} />
            )}
          </div>

          <div className="glass dash-widget hover-glow">
            <div className="widget-header">
              <h3>Score Breakdown</h3>
            </div>
            {!loadingStats && recentAudits.length === 0 ? (
              <EmptyState icon="🎯" title="No data yet" message="Run an audit to see your score breakdown by category." />
            ) : loadingStats ? (
              <div style={{ padding: '20px' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div className="skeleton" style={{ width: '60%', height: '13px', marginBottom: '8px', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                const latest = recentAudits[0];
                if (!latest?.scores) return null;
                return (
                  <div style={{ padding: '4px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Latest: <strong style={{ color: 'var(--text-secondary)' }}>{latest.repo_name}</strong>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ScoreRadarChart scores={latest.scores} />
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          <div className="glass dash-widget hover-glow">
            <div className="widget-header">
              <h3>Recent Audits</h3>
              {recentAudits.length > 0 && (
                <button className="btn-ghost btn-sm" onClick={() => router.push('/repos')}>
                  View all →
                </button>
              )}
            </div>

            {error && <ErrorState message={error} onRetry={fetchDashboardData} />}

            {!error && !loadingStats && recentAudits.length === 0 && (
              <EmptyState
                icon="🔍"
                title="No audits yet"
                message="Select a repository and run your first BrutalAudit to see results here."
                cta="+ New Audit"
                onCta={() => router.push('/repos')}
              />
            )}

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!error && recentAudits.map((audit, i) => {
                const score = audit.scores?.overall || 0;
                const color = gradeColor(score);
                return (
                  <div
                    key={audit.id}
                    className="activity-item anim-enter"
                    style={{ animationDelay: `${i * 0.1}s`, cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                    onClick={() => router.push(`/report/${audit.id}`)}
                  >
                    <div className="activity-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }}></div>
                    <div className="activity-content">
                      <p>
                        <strong>{audit.repo_name}</strong>
                      </p>
                      <span className="time" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span>{timeAgo(audit.completed_at)}</span>
                        <span style={{ color, fontWeight: 600 }}>{score}/100</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
