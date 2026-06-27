'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { auth, githubProvider } from '../lib/firebase';
import { linkWithPopup, updateProfile, updateEmail, GithubAuthProvider } from 'firebase/auth';

export default function OnboardingModal() {
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Local state for profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [isLinking, setIsLinking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.displayName && !name) setName('');
      if (!user.email && !email) setEmail('');
    }
  }, [user]);

  if (loading || !user) return null;

  // Determine what is missing
  const hasGithub = user.providerData.some(p => p.providerId === 'github.com');
  const hasName = !!user.displayName;
  const hasEmail = !!user.email;

  if (hasGithub && hasName && hasEmail) {
    return null; // Onboarding complete!
  }

  const handleConnectGithub = async () => {
    setIsLinking(true);
    setError('');
    try {
      const result = await linkWithPopup(user, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        localStorage.setItem('githubToken', credential.accessToken);
      }
      setSuccess('GitHub connected successfully!');
      setTimeout(() => setSuccess(''), 2000);
      // Force reload auth state might be needed, but Firebase usually updates currentUser automatically
    } catch (err) {
      console.error("Error linking GitHub:", err);
      if (err.code === 'auth/credential-already-in-use') {
        setError('This GitHub account is already linked to another user.');
      } else {
        setError('Failed to connect GitHub. Please try again.');
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    try {
      const promises = [];
      if (!hasName && name.trim()) {
        promises.push(updateProfile(user, { displayName: name.trim() }));
      }
      if (!hasEmail && email.trim()) {
        promises.push(updateEmail(user, email.trim()));
      }
      
      await Promise.all(promises);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 2000);
      
      // Reload user to ensure state is fresh
      await user.reload();
      // A trick to trigger re-render in useAuth if reload doesn't trigger onIdTokenChanged immediately
      window.dispatchEvent(new Event('firebase-auth-refresh'));
      window.location.reload(); // Simple brute force to get fresh UI
    } catch (err) {
      console.error("Error updating profile:", err);
      if (err.code === 'auth/email-already-in-use') setError('Email already in use.');
      else setError('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.85)', 
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000 // Very high z-index to block everything
    }}>
      <div className="glass modal-content anim-enter" style={{
        width: '100%', maxWidth: '450px', padding: '40px',
        border: '1px solid rgba(220, 38, 38, 0.4)',
        borderRadius: '16px', backgroundColor: 'rgba(10, 10, 10, 0.95)'
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '28px', textAlign: 'center' }}>Welcome to BrutalAudit!</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
          To run ruthless audits on your codebase, we need to finalize your setup.
        </p>

        {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center', fontSize: '14px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
        {success && <div style={{ color: '#10B981', marginBottom: '16px', textAlign: 'center', fontSize: '14px', background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '8px' }}>✓ {success}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STEP 1: GitHub Connection */}
          {!hasGithub && (
            <div className="glass" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--red-base)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Connect GitHub</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                We need read access to your GitHub repositories to perform static analysis and audits.
              </p>
              <button 
                className="btn-ghost ripple-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px', border: '1px solid #333' }}
                onClick={handleConnectGithub}
                disabled={isLinking}
              >
                <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" style={{ width: '20px', filter: 'invert(1)' }} />
                {isLinking ? 'Connecting...' : 'Connect GitHub Account'}
              </button>
            </div>
          )}

          {/* STEP 2: Profile Details */}
          {hasGithub && (!hasName || !hasEmail) && (
            <div className="glass anim-enter" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--red-base)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Complete Profile</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Just a few more details so we know what to call you!
              </p>
              
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!hasName && (
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    className="premium-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                )}
                {!hasEmail && (
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    className="premium-input"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                )}
                <button type="submit" className="btn-red premium-glow ripple-btn" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save & Continue'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
