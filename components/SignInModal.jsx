'use client';

import { useState, useEffect } from 'react';
import { auth, googleProvider, githubProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function SignInModal({ isOpen, onClose, defaultIsSignUp = false }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(defaultIsSignUp);
  
  useEffect(() => {
    if (isOpen) {
      setIsSignUp(defaultIsSignUp);
      setError('');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, defaultIsSignUp]);

  if (!isOpen) return null;

  const handleSocialSignIn = async (provider) => {
    try {
      setError('');
      const result = await signInWithPopup(auth, provider);
      
      if (provider.providerId === 'github.com') {
        const { GithubAuthProvider } = await import('firebase/auth');
        const credential = GithubAuthProvider.credentialFromResult(result);
        if (credential && credential.accessToken) {
          localStorage.setItem('githubToken', credential.accessToken);
        }
      }
      
      onClose();
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to sign in. Please try again.');
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        if (!name.trim()) {
          setError('Name is required.');
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Email is already in use.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError('Failed to authenticate. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.7)', 
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="glass modal-content" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '400px', padding: '32px',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        borderRadius: '16px', backgroundColor: 'rgba(10, 10, 10, 0.9)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {isSignUp && (
            <input 
              type="text" 
              placeholder="Full Name"
              className="premium-input"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp}
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address"
            className="premium-input"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password"
            className="premium-input"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {isSignUp && (
            <input 
              type="password" 
              placeholder="Confirm Password"
              className="premium-input"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={isSignUp}
              minLength={6}
            />
          )}
          <button type="submit" className="btn-red premium-glow ripple-btn" style={{ width: '100%', padding: '12px', marginTop: '4px' }}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#666' }}>
          <hr style={{ flex: 1, borderColor: '#333' }} />
          <span style={{ padding: '0 10px', fontSize: '12px' }}>OR</span>
          <hr style={{ flex: 1, borderColor: '#333' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            type="button"
            className="btn-ghost ripple-btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px', border: '1px solid #333' }}
            onClick={() => handleSocialSignIn(googleProvider)}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px' }} />
            Continue with Google
          </button>
          
          <button 
            type="button"
            className="btn-ghost ripple-btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px', border: '1px solid #333' }}
            onClick={() => handleSocialSignIn(githubProvider)}
          >
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" style={{ width: '20px', filter: 'invert(1)' }} />
            Continue with GitHub
          </button>
        </div>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#a1a1aa' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span 
            style={{ color: '#dc2626', cursor: 'pointer' }}
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
}
