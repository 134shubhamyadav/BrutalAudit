'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useRouter } from 'next/navigation';

export default function DeveloperPortal() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // NO credentials stored here. Auth is handled server-side via /api/dev-auth
  // Credentials live in .env.local: DEV_ADMIN_EMAIL and DEV_ADMIN_PASS

  useEffect(() => {
    const isAuth = sessionStorage.getItem('dev_auth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/dev-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('dev_auth', 'true');
        setIsAuthenticated(true);
        fetchReviews();
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch {
      setLoginError('Could not connect to server. Try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dev_auth');
    setIsAuthenticated(false);
    setReviews([]);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews?type=all');
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ color: 'white', padding: '40px' }}>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white' }}>
        <div className="glass" style={{ padding: '40px', borderRadius: '16px', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>Developer Portal</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px', marginBottom: '24px' }}>Internal access only</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="email" 
              placeholder="Admin Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="premium-input"
              style={{ padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
              required
              autoComplete="email"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="premium-input"
              style={{ padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
              required
              autoComplete="current-password"
            />
            {loginError && <div style={{ color: '#EF4444', fontSize: '13px' }}>{loginError}</div>}
            <button 
              type="submit" 
              className="btn-red premium-glow" 
              style={{ padding: '12px' }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Authenticating...' : 'Login'}
            </button>
          </form>
          <button className="btn-ghost" style={{ width: '100%', marginTop: '16px' }} onClick={() => router.push('/')}>Return to Home</button>
        </div>
      </div>
    );
  }

  const liveReviews = reviews.filter(r => r.rating >= 4);
  const feedbackReviews = reviews.filter(r => r.rating < 4);

  const ReviewCard = ({ r }) => (
    <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{r.email}</div>
        <div style={{ color: '#F59E0B' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
      </div>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>"{r.text}"</p>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        {new Date(r.created_at).toLocaleString()}
      </div>
    </div>
  );

  return (
    <div id="dev-portal" className="page dashboard-layout active">
      <Sidebar activeId="" />
      
      <main className="main-content">
        <div className="dash-header">
          <div>
            <div className="dash-title">Developer Feedback 🛠️</div>
            <div className="dash-sub">Monitor user reviews and internal feedback.</div>
          </div>
          <button className="btn-ghost ripple-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginTop: '32px' }}>
          
          <div className="glass dash-widget" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10B981' }}>●</span> Live Reviews (4 & 5 Stars)
              <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{liveReviews.length} total</span>
            </h3>
            {liveReviews.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No live reviews yet.</p> : null}
            {liveReviews.map(r => <ReviewCard key={r.id} r={r} />)}
          </div>

          <div className="glass dash-widget" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#EF4444' }}>●</span> Private Feedback (1 to 3 Stars)
              <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{feedbackReviews.length} total</span>
            </h3>
            {feedbackReviews.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No feedback yet.</p> : null}
            {feedbackReviews.map(r => <ReviewCard key={r.id} r={r} />)}
          </div>

        </div>
      </main>
    </div>
  );
}
