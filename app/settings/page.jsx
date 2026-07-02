'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Image from 'next/image';
import { auth } from '../../lib/firebase';
import { unlink, deleteUser, signOut } from 'firebase/auth';
import { toast } from '../../components/Toast';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [lastUsernameChange, setLastUsernameChange] = useState(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  useEffect(() => {
    if (user) {
      user.getIdToken().then(token => 
        fetch('/api/profile/username', { headers: { 'Authorization': `Bearer ${token}` } })
      )
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setUsername(data.profile.username || '');
            setNewUsername(data.profile.username || '');
            setLastUsernameChange(data.profile.last_username_change);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  if (loading) return null;
  if (!user) {
    router.push('/');
    return null;
  }

  const hasGithub = user.providerData.some(p => p.providerId === 'github.com');
  const hasGoogle = user.providerData.some(p => p.providerId === 'google.com');
  const hasPassword = user.providerData.some(p => p.providerId === 'password');

  const handleUnlinkGithub = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub? You will not be able to scan new repositories until you reconnect.')) return;
    
    setIsUnlinking(true);
    setError('');
    try {
      await unlink(user, 'github.com');
      setSuccess('GitHub account disconnected successfully.');
      setTimeout(() => setSuccess(''), 3000);
      window.location.reload(); // Force refresh state
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/no-such-provider') {
        setError('GitHub is not linked.');
      } else {
        setError('Failed to unlink GitHub. Try signing in again first.');
      }
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleManageBilling = async () => {
    setLoadingBilling(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error && data.error.includes('No billing account found')) {
        toast.info('Billing is currently paused. You are on the promotional Free Pro plan until Aug 15, 2026!');
        setLoadingBilling(false);
      } else {
        toast.error(data.error || 'Failed to open billing portal');
        setLoadingBilling(false);
      }
    } catch (err) {
      toast.error('Error opening billing portal');
      setLoadingBilling(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('DANGER: Are you absolutely sure you want to permanently delete your account? This action CANNOT be undone!')) return;
    
    setIsDeleting(true);
    setError('');
    try {
      await deleteUser(user);
      router.push('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('For security reasons, please sign out and sign back in before deleting your account.');
      } else {
        setError('Failed to delete account. ' + err.message);
      }
      setIsDeleting(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    setIsUpdatingUsername(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/profile/username', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update username');
      
      setUsernameSuccess('Username updated successfully!');
      setUsername(data.profile.username);
      setLastUsernameChange(data.profile.last_username_change);
      setTimeout(() => setUsernameSuccess(''), 3000);
    } catch (err) {
      setUsernameError(err.message);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const calculateDaysLeft = () => {
    if (!lastUsernameChange) return 0;
    const lastChange = new Date(lastUsernameChange);
    const daysSinceChange = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceChange >= 20) return 0;
    return Math.ceil(20 - daysSinceChange);
  };

  const daysLeft = calculateDaysLeft();

  return (
    <div id="settings" className="page dashboard-layout active">
      <Sidebar activeId="settings" auditCount={0} />

      <main className="main-content">
        <div className="dash-header">
          <div>
            <div className="dash-title">Profile Settings ⚙️</div>
            <div className="dash-sub">Manage your account, connections, and security preferences.</div>
          </div>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '24px', padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}
        {success && <div style={{ color: '#10B981', marginBottom: '24px', padding: '16px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>✓ {success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', maxWidth: '1400px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Profile Details */}
          <div className="glass dash-widget" style={{ padding: '32px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              👤 Profile Overview
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
              <div className="profile-avatar" style={{ width: '80px', height: '80px', margin: '0', position: 'relative' }}>
                <Image src={user.photoURL || 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'} alt="Avatar" fill style={{ objectFit: 'cover' }} sizes="80px" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.displayName || 'Unknown Developer'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{user.email || 'No email provided'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Leaderboard Username</h4>
              <form onSubmit={handleUpdateUsername}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="premium-input"
                    placeholder="Enter username"
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff' }}
                    disabled={daysLeft > 0}
                    pattern="^[a-zA-Z0-9_.]{1,30}$"
                    title="Up to 30 characters. Letters, numbers, underscores, and periods only."
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn-red premium-glow ripple-btn" 
                    disabled={daysLeft > 0 || isUpdatingUsername || newUsername === username}
                    style={{ padding: '10px 20px', opacity: (daysLeft > 0 || newUsername === username) ? 0.5 : 1 }}
                  >
                    {isUpdatingUsername ? 'Saving...' : 'Update'}
                  </button>
                </div>
                {daysLeft > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    You can change your username again in {daysLeft} day(s).
                  </div>
                )}
                {usernameError && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{usernameError}</div>}
                {usernameSuccess && <div style={{ color: '#10B981', fontSize: '13px', marginTop: '8px' }}>{usernameSuccess}</div>}
              </form>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="glass dash-widget" style={{ padding: '32px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🔗 Connected Accounts
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" style={{ width: '28px', filter: 'invert(1)' }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>GitHub</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Required for repository auditing</div>
                  </div>
                </div>
                {hasGithub ? (
                  <button 
                    className="btn-ghost" 
                    onClick={handleUnlinkGithub} 
                    disabled={isUnlinking}
                    style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    {isUnlinking ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>Not Connected</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '28px' }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Google</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Quick sign-in</div>
                  </div>
                </div>
                {hasGoogle ? (
                  <span style={{ color: '#10B981', fontSize: '14px', padding: '8px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>Connected</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>Not Connected</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '24px' }}>✉️</div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Email & Password</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Standard authentication</div>
                  </div>
                </div>
                {hasPassword ? (
                  <span style={{ color: '#10B981', fontSize: '14px', padding: '8px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>Enabled</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>Not Configured</span>
                )}
              </div>

            </div>
          </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* AI Disclaimer & Feedback */}
          <div className="glass dash-widget" style={{ padding: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🤖 AI Disclaimer & Feedback
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
              Our AI is constantly learning and can sometimes make mistakes. We apologize for any inaccuracies in the audit reports! If you notice repeated issues, please share your feedback to help us improve.
            </p>
            <a 
              href="mailto:feedback@brutalaudit.com"
              className="btn-ghost" 
              style={{ padding: '10px 20px', display: 'inline-block', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              ✉️ Send Feedback
            </a>
          </div>

          {/* Scoring Guide */}
          <div className="glass dash-widget" style={{ padding: '32px', border: '1px solid var(--glass-border)', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📈 Audit Scoring & Grades
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '18px' }}>90 - 100</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Grade: A (Excellent)</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
                <div style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: '18px' }}>75 - 89</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Grade: B (Good)</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
                <div style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: '18px' }}>60 - 74</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Grade: C (Fair)</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                <div style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '18px' }}>0 - 59</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Grade: D/F (Needs Work)</div>
              </div>
            </div>
            
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>💡 Tips for Better Scores:</h4>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
              <li>Write clean, modular code with consistent naming conventions.</li>
              <li>Include comprehensive documentation and meaningful comments.</li>
              <li>Ensure robust error handling and avoid deeply nested code blocks.</li>
              <li>Implement unit integration tests to cover critical paths.</li>
            </ul>
          </div>

          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1400px', width: '100%', marginTop: '32px' }}>
          {/* Billing & Subscription */}
          <div className="glass dash-widget" style={{ padding: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              💳 Billing & Subscription
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6', maxWidth: '800px' }}>
              Manage your active subscription plan, payment methods, and billing history through our secure Stripe portal.
            </p>
            
            <button 
              className="btn-ghost ripple-btn" 
              onClick={() => router.push('/billing')}
              style={{ padding: '10px 20px', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
            >
              Manage Subscription
            </button>
          </div>

          {/* Danger Zone */}
          <div className="glass dash-widget" style={{ padding: '32px', border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(239,68,68,0.05) 100%)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⚠️ Danger Zone
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6', maxWidth: '800px' }}>
              Deleting your account is permanent. All your data, profile information, and authentication links will be permanently wiped from our Firebase servers immediately. Your previous audit records in Supabase will become orphaned.
            </p>
            
            <button 
              className="btn-red premium-glow ripple-btn" 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              style={{ width: '100%', maxWidth: '300px', padding: '14px' }}
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
