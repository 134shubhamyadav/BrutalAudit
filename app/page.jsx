
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { HeroNetworkCanvas, InfiniteBadges } from '../components/HeroVisuals';
import AnimatedCounter from '../components/AnimatedCounter';
import MagneticCard from '../components/MagneticCard';
import { Shield, Network, Zap, TestTube, BookOpen, Cpu, Check, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../components/AuthProvider';
import SignInModal from '../components/SignInModal';
import CountdownBanner from '../components/CountdownBanner';
import { auth, signOut } from '../lib/firebase';
import { toast } from '../components/Toast';

export default function Home() {
  const { user, loading } = useAuth();
  const isSignedIn = !!user;
  const router = useRouter();
  const initialized = useRef(false);
  const [stats, setStats] = useState({ totalAudits: 0, avgScore: 85, avgTime: 3.2, loaded: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUpModal, setIsSignUpModal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  const [liveReviews, setLiveReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch('/api/reviews?type=live')
      .then(r => r.json())
      .then(data => {
        if (data.reviews) setLiveReviews(data.reviews);
      })
      .catch(console.error);
  }, []);

  const submitReview = async () => {
    if (!isSignedIn) {
      toast.error('You must be logged in to write a review.');
      setShowReviewModal(false);
      return;
    }
    if (!reviewText.trim()) {
      toast.warning('Please write some feedback before submitting.');
      return;
    }
    if (reviewText.trim().length > 1000) {
      toast.warning('Review must be 1000 characters or less.');
      return;
    }
    setSubmittingReview(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, text: reviewText })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to submit');
      toast.success('Thank you for your review! 🎉');
      setShowReviewModal(false);
      setReviewText('');
      if (reviewRating >= 4) {
        fetch('/api/reviews?type=live').then(r => r.json()).then(data => { if(data.reviews) setLiveReviews(data.reviews); });
      }
    } catch (err) {
      toast.error(err.message || 'Error submitting review. Please try again.');
    }
    setSubmittingReview(false);
  };

  const handleCheckout = async (priceId, planTier) => {
    if (!priceId || priceId.includes('mock')) {
      toast.info('Payments coming soon! Check back after launch.');
      return;
    }
    setLoadingCheckout(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planTier })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Checkout failed. Please try again.');
        setLoadingCheckout(false);
      }
    } catch (err) {
      toast.error('Checkout error. Please try again.');
      setLoadingCheckout(false);
    }
  };

  const openSignIn = () => {
    setIsSignUpModal(false);
    setIsModalOpen(true);
  };

  const openSignUp = () => {
    setIsSignUpModal(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    api.stats.public()
      .then(data => {
        setStats({ 
          totalAudits: data.totalAudits, 
          avgScore: data.avgScore || 85, 
          avgTime: data.avgTime || 3.2,
          loaded: true 
        });
      })
      .catch(() => setStats({ totalAudits: 0, avgScore: 85, avgTime: 3.2, loaded: true }));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!initialized.current) {
        initialized.current = true;
      }
      
      const githubBtn = document.querySelector('[data-action="github-auth"]');
      if (githubBtn) {
        githubBtn.onclick = (e) => {
          e.preventDefault();
          openSignIn();
        };
      }

      if (!loading) {
        const navLinks = document.querySelectorAll('.nav-link[data-navigate="dashboard"], .nav-link[data-navigate="repos"]');
        navLinks.forEach(link => {
          link.style.display = isSignedIn ? 'inline-block' : 'none';
        });
      }
    }
  }, [loading, isSignedIn]);

  return (
    <>
      <SignInModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isSignUp={isSignUpModal}
      />

      {showReviewModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 9999 }}>
          <div className="modal-content glass hover-glow" style={{ padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>Write a Review</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              Your feedback helps us improve. Reviews of 4 or 5 stars may be featured on our landing page!
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center', fontSize: '32px', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span 
                  key={star} 
                  onClick={() => setReviewRating(star)}
                  style={{ color: star <= reviewRating ? '#EF4444' : '#333' }}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What do you think of BrutalAudit?"
              style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', marginBottom: '24px', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowReviewModal(false)}>Cancel</button>
              <button className="btn-red premium-glow" onClick={submitReview} disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="noise"></div>

  
    <nav id="main-nav" className="glass-nav">
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo(0,0)}><Image src="/logo.png" alt="Logo" width={24} height={24} /><span>BrutalAudit</span></div>
      <div className="nav-links">
        <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo(0,0)}>Home</span>
        {isSignedIn && <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>Dashboard</span>}
        {isSignedIn && <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => router.push('/repos')}>Repos</span>}
      </div>
      <div className="nav-cta">
        {!isSignedIn ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-ghost btn-sm ripple-btn" onClick={openSignIn}>Sign In</button>
            <button className="btn-red btn-sm premium-glow ripple-btn" onClick={openSignUp}>Get Started</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-ghost btn-sm ripple-btn" onClick={() => router.push('/dashboard')}>Dashboard →</button>
            <button className="btn-ghost btn-sm ripple-btn" onClick={() => signOut(auth)}>Sign Out</button>
          </div>
        )}
      </div>
    </nav>

  <div id="app-container">
    
    <div id="landing" className="page active">
      <section className="hero">
        <div className="hero-badge hover-lift">
          <span></span> AI-Powered Code Intelligence
        </div>
        <h1 className="hero-title">Brutal Truth<br />for Your <span className="grad-text">GitHub.</span></h1>
        <p className="hero-sub">Stop guessing about your code quality. BrutalAudit delivers unfiltered analysis: security flaws, architectural debt, and performance gaps, in seconds.</p>
        
        <div className="hero-actions">
          {!isSignedIn ? (
            <button className="btn-red premium-glow ripple-btn" onClick={openSignUp}>
              <span className="icon">⚡</span> Start Free Audit
            </button>
          ) : (
            <button 
              className="btn-red premium-glow ripple-btn" 
              onClick={() => router.push('/dashboard')}
            >
              <span className="icon">⚡</span> Start Free Audit
            </button>
          )}
        </div>

        
        <div className="hero-visual-container">
          <HeroNetworkCanvas />
        </div>
          
        <div className="hero-stats stagger-group">
          <MagneticCard className="glass stat-card hover-lift" style={{ '--i': 1 }}>
            <div className="stat-num">{stats.loaded ? <AnimatedCounter end={stats.totalAudits} /> : '...'}<span className="stat-red">+</span></div>
            <div className="stat-label">Repos Analyzed</div>
          </MagneticCard>
          <MagneticCard className="glass stat-card hover-lift" style={{ '--i': 2 }}>
            <div className="stat-num">{stats.loaded ? <AnimatedCounter end={stats.avgScore} /> : '...'}<span className="stat-red">/100</span></div>
            <div className="stat-label">Avg Code Grade</div>
          </MagneticCard>
          <MagneticCard className="glass stat-card hover-lift" style={{ '--i': 3 }}>
            <div className="stat-num">{stats.loaded ? stats.avgTime : '...'}<span className="stat-red">s</span></div>
            <div className="stat-label">Avg Audit Time</div>
          </MagneticCard>
        </div>
      </section>

      
      <div className="badges-row">
        <InfiniteBadges />
      </div>

      
      <section className="section">
        <div className="section-label">Capabilities</div>
        <h2 className="section-title">Everything you need to<br />ship better code.</h2>
        <p className="section-sub">Deep static analysis meets AI reasoning to surface what linters miss.</p>
        <div className="features-grid stagger-group">
          <div className="glass feature-card hover-glow" style={{ '--i': 1 }}>
            <div className="feature-icon"><Shield className="lucide-icon" size={28} /></div>
            <div className="feature-title">Security Scanning</div>
            <div className="feature-desc">CVE detection, secret exposure, SQL injection vectors, and dependency vulnerabilities mapped to OWASP top 10.</div>
          </div>
          <div className="glass feature-card hover-glow" style={{ '--i': 2 }}>
            <div className="feature-icon"><Network className="lucide-icon" size={28} /></div>
            <div className="feature-title">Architecture Analysis</div>
            <div className="feature-desc">Circular dependencies, coupling metrics, separation of concerns, and design pattern recognition across your entire codebase.</div>
          </div>
          <div className="glass feature-card hover-glow" style={{ '--i': 3 }}>
            <div className="feature-icon"><Zap className="lucide-icon" size={28} /></div>
            <div className="feature-title">Performance Profiling</div>
            <div className="feature-desc">Bundle bloat, N+1 queries, memory leaks, and algorithmic complexity analysis with fix suggestions.</div>
          </div>
          <div className="glass feature-card hover-glow" style={{ '--i': 4 }}>
            <div className="feature-icon"><TestTube className="lucide-icon" size={28} /></div>
            <div className="feature-title">Test Coverage</div>
            <div className="feature-desc">Coverage gaps, flaky test detection, missing edge cases, and test quality scoring with mutation analysis.</div>
          </div>
          <div className="glass feature-card hover-glow" style={{ '--i': 5 }}>
            <div className="feature-icon"><BookOpen className="lucide-icon" size={28} /></div>
            <div className="feature-title">Documentation Score</div>
            <div className="feature-desc">Inline comments, README quality, API docs completeness, and changelog hygiene evaluated and graded.</div>
          </div>
          <div className="glass feature-card hover-glow" style={{ '--i': 6 }}>
            <div className="feature-icon"><Cpu className="lucide-icon" size={28} /></div>
            <div className="feature-title">AI Fix Suggestions</div>
            <div className="feature-desc">Not just problems: Groq-powered AI refactoring plans, ordered by impact and grouped by effort level.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-label">From Developers</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Trusted by teams who<br />care about quality.</h2>
          <button 
            className="btn-ghost ripple-btn" 
            style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: '8px' }}
            onClick={() => {
              if (!isSignedIn) { toast.info('Please sign in to write a review.'); return; }
              setShowReviewModal(true);
            }}
          >
            ✏️ Write a Review
          </button>
        </div>
        
        <div className="testi-grid stagger-group" style={{ marginTop: '40px' }}>
          {liveReviews.length > 0 ? liveReviews.map((rev) => (
            <div key={rev.id} className="glass testi-card hover-lift">
              <div className="stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
              <div className="testi-text">"{rev.text}"</div>
              <div className="testi-author">
                <div className="avatar">{rev.email.substring(0, 2).toUpperCase()}</div>
                <div>
                  <div className="author-name">{rev.email.split('@')[0]}</div>
                  <div className="author-role">Developer</div>
                </div>
              </div>
            </div>
          )) : (
            <>
              <div className="glass testi-card hover-lift">
                <div className="stars">★★★★★</div>
                <div className="testi-text">"BrutalAudit found a critical API key exposure in our repo that had been there for 8 months. No other tool caught it. This is essential."</div>
                <div className="testi-author"><div className="avatar">SK</div><div><div className="author-name">Sarah Kim</div><div className="author-role">Senior Developer</div></div></div>
              </div>
              <div className="glass testi-card hover-lift">
                <div className="stars">★★★★★</div>
                <div className="testi-text">"The architecture analysis is insane. It drew our entire dependency graph and identified a circular dependency chain we had missed for two years."</div>
                <div className="testi-author"><div className="avatar">MR</div><div><div className="author-name">Marcus Rivera</div><div className="author-role">Open Source Maintainer</div></div></div>
              </div>
              <div className="glass testi-card hover-lift">
                <div className="stars">★★★★★</div>
                <div className="testi-text">"We reduced our bundle size by 43% using the performance roadmap. The recommendations were specific, actionable, and ranked by actual impact."</div>
                <div className="testi-author"><div className="avatar">AL</div><div><div className="author-name">Ava Lin</div><div className="author-role">Engineering Manager</div></div></div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple pricing.<br />No surprises.</h2>
        <div className="pricing-grid stagger-group">
          <div className="glass price-card hover-glow">
            <div className="price-tier">Starter</div>
            <div className="price-amount">₹0</div>
            <div className="price-period">Forever free</div>
            <div className="price-divider"></div>
            <div className="price-feature"><Check size={16} className="text-green" /> 3 repos / month</div>
            <div className="price-feature"><Check size={16} className="text-green" /> Basic audit report</div>
            <div className="price-feature"><Check size={16} className="text-green" /> Security scan</div>
            <div className="price-feature disabled"><X size={16} /> AI fix suggestions</div>
            <div className="price-feature disabled"><X size={16} /> Detailed code insights</div>
            <div style={{ marginTop: '24px' }}>
              {!isSignedIn ? (
                <button className="btn-ghost ripple-btn" style={{ width: '100%' }} onClick={openSignUp}>Get Started Free</button>
              ) : (
                <button className="btn-ghost ripple-btn" style={{ width: '100%' }} onClick={() => router.push('/dashboard')}>Get Started Free</button>
              )}
            </div>
          </div>
          <div className="glass price-card featured card-pulse hover-glow">
            <div className="price-badge">MOST POPULAR</div>
            <div className="price-tier">Pro</div>
            <div className="price-amount">₹199<span style={{ fontSize: '20px', color: 'var(--text3)' }}>/mo</span></div>
            <div className="price-period">Perfect for students</div>
            <div className="price-divider"></div>
            <div className="price-feature"><Check size={16} className="text-green" /> Unlimited repos</div>
            <div className="price-feature"><Check size={16} className="text-green" /> Full audit report</div>
            <div className="price-feature"><Check size={16} className="text-green" /> AI fix suggestions</div>
            <div className="price-feature"><Check size={16} className="text-green" /> Detailed code insights</div>
            <div className="price-feature"><Check size={16} className="text-green" /> Priority support</div>
            <div style={{ marginTop: '24px' }}>
              {!isSignedIn ? (
                <button className="btn-red ripple-btn" style={{ width: '100%' }} onClick={openSignUp}>Pro is Free! Get Started</button>
              ) : (
                <button className="btn-red ripple-btn" style={{ width: '100%' }} onClick={() => router.push('/dashboard')}>
                  Pro is Free! Go to Dashboard
                </button>
              )}
              <CountdownBanner />
            </div>
          </div>

        </div>
      </section>

      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo" style={{ fontSize: '20px' }}>BrutalAudit</div>
            <p>Unfiltered code intelligence for teams who care about shipping great software.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a>Features</a><a>Pricing</a><a>Changelog</a><a>Roadmap</a>
          </div>
          <div className="footer-col">
            <h4>Developers</h4>
            <a>API Docs</a><a>GitHub App</a><a>CLI Tool</a><a>Webhooks</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a>About</a><a>Blog</a><a>Careers</a><a>Security</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 BrutalAudit. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/privacy" style={{ fontSize: '13px', color: 'var(--text3)', textDecoration: 'none', cursor: 'pointer' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: '13px', color: 'var(--text3)', textDecoration: 'none', cursor: 'pointer' }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>

  </div>

  <div className="toast-container" id="toast-container"></div>

    </>
  );
}