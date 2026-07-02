'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import EmptyState, { ErrorState } from '../../components/EmptyState';
import { Trophy, Medal, Star } from 'lucide-react';

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLeaders(data.leaderboard || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function getRewardBadge(idx) {
    if (idx === 0) return <span style={{ fontSize: '11px', background: 'linear-gradient(90deg, #FFD700, #F59E0B)', color: '#000', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>100% OFF ELITE</span>;
    if (idx === 1) return <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>100% OFF PRO</span>;
    if (idx === 2) return <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>50% OFF PRO</span>;
    if (idx >= 3 && idx <= 9) return <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>10% OFF PRO</span>;
    return null;
  }

  function getRankIcon(index) {
    if (index === 0) return <Trophy size={28} style={{ color: '#F59E0B' }} />;
    if (index === 1) return <Medal size={24} style={{ color: '#9CA3AF' }} />;
    if (index === 2) return <Medal size={24} style={{ color: '#D97706' }} />;
    return <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>{index + 1}</span>;
  }

  return (
    <div id="leaderboard" className="page dashboard-layout active">
      <Sidebar activeId="leaderboard" auditCount={0} />

      <main className="main-content">
        <div className="dash-header">
          <div>
            <div className="dash-title">Global Leaderboard 🏆</div>
            <div className="dash-sub">Top hackers on BrutalAudit based on their overall repository scores.</div>
          </div>
          <button
            className="btn-red premium-glow ripple-btn"
            onClick={() => router.push('/repos')}
          >
            Audit Your Repo
          </button>
        </div>

        <div className="glass dash-widget anim-enter" style={{ marginTop: '24px', padding: '24px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(10, 10, 10, 0) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎁 Leaderboard Rewards
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            Compete for exclusive subscription discounts based on your rank!
            <br />
            <span style={{ display: 'inline-block', marginTop: '8px' }}>
              <strong style={{ color: '#F59E0B' }}>1st Place:</strong> 100% off Elite. 
              <strong style={{ color: '#10B981', marginLeft: '16px' }}>2nd Place:</strong> 100% off Pro. 
              <strong style={{ color: '#3B82F6', marginLeft: '16px' }}>3rd Place:</strong> 50% off Pro. 
              <strong style={{ color: '#a1a1aa', marginLeft: '16px' }}>4th-10th Place:</strong> 10% off Pro.
            </span>
          </p>
        </div>

        <div className="glass dash-widget" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
              <div className="skeleton" style={{ width: '100%', height: '400px', borderRadius: '12px' }} />
            </div>
          ) : error ? (
            <div style={{ padding: '40px' }}>
              <ErrorState message={error} onRetry={fetchLeaderboard} />
            </div>
          ) : leaders.length === 0 ? (
            <div style={{ padding: '40px' }}>
              <EmptyState icon="🏆" title="No Data Yet" message="Be the first to run an audit and get on the leaderboard!" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
                <div style={{ width: '60px', textAlign: 'center' }}>Rank</div>
                <div style={{ flex: 1, paddingLeft: '16px' }}>Hacker</div>
                <div style={{ width: '100px', textAlign: 'right' }}>Score</div>
              </div>
              
              {leaders.map((repo, idx) => (
                <div 
                  key={repo.user_id || idx} 
                  style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {getRankIcon(idx)}
                  </div>
                  
                  <div style={{ flex: 1, paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: idx < 3 ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      @{repo.username}
                      {getRewardBadge(idx)}
                    </div>
                  </div>
                  
                  <div style={{ width: '100px', textAlign: 'right' }}>
                    <div style={{ 
                      display: 'inline-block', 
                      padding: '6px 14px', 
                      borderRadius: '20px', 
                      background: repo.score >= 85 ? 'rgba(16, 185, 129, 0.1)' : repo.score >= 70 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: repo.score >= 85 ? '#10B981' : repo.score >= 70 ? '#F59E0B' : '#EF4444',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {repo.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
