'use client';

import { useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Image from 'next/image';
import { auth } from '../../lib/firebase';
import { unlink, deleteUser, signOut } from 'firebase/auth';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
          
          {/* Profile Details */}
          <div className="glass dash-widget" style={{ padding: '32px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              👤 Profile Overview
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div className="profile-avatar premium-glow" style={{ width: '80px', height: '80px', margin: '0', position: 'relative' }}>
                <Image src={user.photoURL || 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'} alt="Avatar" fill style={{ objectFit: 'cover' }} sizes="80px" />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.displayName || 'Unknown Developer'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{user.email || 'No email provided'}</div>
              </div>
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

          {/* Danger Zone */}
          <div className="glass dash-widget" style={{ padding: '32px', border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(239,68,68,0.05) 100%)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⚠️ Danger Zone
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
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
