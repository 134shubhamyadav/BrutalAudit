
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { HeroNetworkCanvas, InfiniteBadges } from '../components/HeroVisuals';
import { api } from '../lib/api.js';
import { useAuth } from '../components/AuthProvider';
import SignInModal from '../components/SignInModal';
import { auth, signOut } from '../lib/firebase';

export default function Home() {
  const { user, loading } = useAuth();
  const isSignedIn = !!user;
  const router = useRouter();
  const initialized = useRef(false);
  const [stats, setStats] = useState({ totalAudits: 0, avgScore: 85, loaded: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUpModal, setIsSignUpModal] = useState(false);

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
        setStats({ totalAudits: data.totalAudits + 120, avgScore: data.avgScore || 85, loaded: true });
      })
      .catch(() => setStats({ totalAudits: 120, avgScore: 85, loaded: true }));
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
      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultIsSignUp={isSignUpModal} />
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
          <div className="glass stat-card hover-lift magnetic">
            <div className="stat-num">{stats.loaded ? stats.totalAudits.toLocaleString() : '...'}<span className="stat-red">+</span></div>
            <div className="stat-label">Repos Analyzed</div>
          </div>
          <div className="glass stat-card hover-lift magnetic">
            <div className="stat-num">{stats.loaded ? stats.avgScore : '...'}<span className="stat-red">/100</span></div>
            <div className="stat-label">Avg Code Grade</div>
          </div>
          <div className="glass stat-card hover-lift magnetic">
            <div className="stat-num">{stats.loaded ? '3.2' : '...'}<span className="stat-red">s</span></div>
            <div className="stat-label">Avg Audit Time</div>
          </div>
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
          
          <div className="glass feature-card hover-glow">
            <div className="feature-icon">🔐</div>
            <div className="feature-title">Security Scanning</div>
            <div className="feature-desc">CVE detection, secret exposure, SQL injection vectors, and dependency vulnerabilities mapped to OWASP top 10.</div>
          </div>
          <div className="glass feature-card hover-glow">
            <div className="feature-icon">🏗️</div>
            <div className="feature-title">Architecture Analysis</div>
            <div className="feature-desc">Circular dependencies, coupling metrics, separation of concerns, and design pattern recognition across your entire codebase.</div>
          </div>
          <div className="glass feature-card hover-glow">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Performance Profiling</div>
            <div className="feature-desc">Bundle bloat, N+1 queries, memory leaks, and algorithmic complexity analysis with fix suggestions.</div>
          </div>
          <div className="glass feature-card hover-glow">
            <div className="feature-icon">🧪</div>
            <div className="feature-title">Test Coverage</div>
            <div className="feature-desc">Coverage gaps, flaky test detection, missing edge cases, and test quality scoring with mutation analysis.</div>
          </div>
          <div className="glass feature-card hover-glow">
            <div className="feature-icon">📚</div>
            <div className="feature-title">Documentation Score</div>
            <div className="feature-desc">Inline comments, README quality, API docs completeness, and changelog hygiene evaluated and graded.</div>
          </div>
          <div className="glass feature-card hover-glow">
            <div className="feature-icon">🤖</div>
            <div className="feature-title">AI Fix Suggestions</div>
            <div className="feature-desc">Not just problems: GPT-4 generated refactoring plans, ordered by impact and grouped by effort level.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-label">From Developers</div>
        <h2 className="section-title">Trusted by teams who<br />care about quality.</h2>
        <div className="testi-grid stagger-group">
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
        </div>
      </section>

      <section className="section">
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple pricing.<br />No surprises.</h2>
        <div className="pricing-grid stagger-group">
          <div className="glass price-card hover-glow">
            <div className="price-tier">Starter</div>
            <div className="price-amount">$0</div>
            <div className="price-period">Forever free</div>
            <div className="price-divider"></div>
            <div className="price-feature"><span className="check">✓</span> 3 repos / month</div>
            <div className="price-feature"><span className="check">✓</span> Basic audit report</div>
            <div className="price-feature"><span className="check">✓</span> Security scan</div>
            <div className="price-feature" style={{ opacity: 0.4 }}><span>✗</span> AI fix suggestions</div>
            <div className="price-feature" style={{ opacity: 0.4 }}><span>✗</span> Detailed code insights</div>
            <div style={{ marginTop: '24px' }}>
              {!isSignedIn ? (
                <button className="btn-ghost ripple-btn" style={{ width: '100%' }} onClick={openSignUp}>Get Started Free</button>
              ) : (
                <button className="btn-ghost ripple-btn" style={{ width: '100%' }} onClick={() => router.push('/dashboard')}>Get Started Free</button>
              )}
            </div>
          </div>
          <div className="glass price-card featured premium-glow hover-glow">
            <div className="price-badge">MOST POPULAR</div>
            <div className="price-tier">Pro</div>
            <div className="price-amount">$29<span style={{ fontSize: '20px', color: 'var(--text3)' }}>/mo</span></div>
            <div className="price-period">Per workspace</div>
            <div className="price-divider"></div>
            <div className="price-feature"><span className="check">✓</span> Unlimited repos</div>
            <div className="price-feature"><span className="check">✓</span> Full audit report</div>
            <div className="price-feature"><span className="check">✓</span> AI fix suggestions</div>
            <div className="price-feature"><span className="check">✓</span> Detailed code insights</div>
            <div className="price-feature"><span className="check">✓</span> Priority support</div>
            <div style={{ marginTop: '24px' }}>
              {!isSignedIn ? (
                <button className="btn-red ripple-btn" style={{ width: '100%' }} onClick={openSignUp}>Start Pro Trial</button>
              ) : (
                <button className="btn-red ripple-btn" style={{ width: '100%' }} onClick={() => router.push('/dashboard')}>Start Pro Trial</button>
              )}
            </div>
          </div>
          <div className="glass price-card hover-glow">
            <div className="price-tier">Enterprise</div>
            <div className="price-amount">Custom</div>
            <div className="price-period">Contact us</div>
            <div className="price-divider"></div>
            <div className="price-feature"><span className="check">✓</span> Everything in Pro</div>
            <div className="price-feature"><span className="check">✓</span> SSO / SAML</div>
            <div className="price-feature"><span className="check">✓</span> On-premise option</div>
            <div className="price-feature"><span className="check">✓</span> SLA guarantee</div>
            <div className="price-feature"><span className="check">✓</span> Dedicated CSM</div>
            <div style={{ marginTop: '24px' }}><button className="btn-ghost ripple-btn" style={{ width: '100%' }}>Talk to Sales</button></div>
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