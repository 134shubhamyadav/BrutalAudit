'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar.jsx';
import IssueCard from '../../components/IssueCard.jsx';
import ScoreRing from '../../components/ScoreRing.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { ScoreRadarChart } from '../../components/Charts.jsx';

const TAB_TYPES = {
  security:     { label: 'Security',     icon: '🔐', type: 'security' },
  architecture: { label: 'Architecture', icon: '🏗️', type: 'architecture' },
  performance:  { label: 'Performance',  icon: '⚡', type: 'performance' },
  'ai-fixes':   { label: 'AI Fixes ✨',  icon: '🤖', type: null }, 
};

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

const MOCK_AUDIT = {
  repo_name: 'acme-corp/nextjs-monorepo',
  repo_full_name: 'acme-corp/nextjs-monorepo',
  completed_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  repo_meta: {
    language: 'TypeScript',
    stars: 12450,
    description: 'Enterprise React framework with Next.js app router and TRPC.',
    url: 'https://github.com/vercel/next.js',
  },
  scores: {
    overall: 68,
    security: 42,
    architecture: 78,
    performance: 85,
  },
  summary: 'The repository exhibits a modern architecture but has severe security flaws, including exposed secrets in the environment configuration and high-risk SQL injection vulnerabilities in the core API routes.',
  findings: [
    {
      type: 'security',
      severity: 'critical',
      title: 'Exposed JWT Secret in API Route',
      description: 'The JWT_SECRET is hardcoded in plaintext within the authentication handler. This allows anyone with read access to the repository to forge authentication tokens and bypass all security controls.',
      file: 'apps/web/app/api/auth/route.ts',
      line: 24,
      fix: 'Remove the hardcoded secret and replace it with process.env.JWT_SECRET. Ensure the environment variable is securely provisioned in your deployment environment.\n\n- const secret = "super-secret-key-123";\n+ const secret = process.env.JWT_SECRET;'
    },
    {
      type: 'security',
      severity: 'high',
      title: 'SQL Injection Vulnerability in User Query',
      description: 'Unsanitized user input from req.query.id is directly concatenated into a raw SQL query string in the database adapter.',
      file: 'packages/db/src/queries/users.ts',
      line: 112,
      fix: 'Use parameterized queries or a query builder like Prisma to automatically sanitize inputs.\n\n- await sql`SELECT * FROM users WHERE id = ${req.query.id}`\n+ await db.user.findUnique({ where: { id: String(req.query.id) } });'
    },
    {
      type: 'architecture',
      severity: 'medium',
      title: 'High Coupling in Payment Service',
      description: 'The payment service directly imports and instantiates the Stripe client, making it difficult to mock during tests or swap providers in the future.',
      file: 'packages/core/src/services/payment.ts',
      line: 15,
      fix: 'Inject the payment provider as a dependency rather than hardcoding the Stripe instantiation.\n\n- const stripe = new Stripe(key);\n+ constructor(private paymentProvider: PaymentProvider) {}'
    },
    {
      type: 'performance',
      severity: 'low',
      title: 'Unoptimized Image Loading',
      description: 'Large hero images are being loaded without the Next.js next/image component, missing out on automatic WebP conversion and lazy loading.',
      file: 'apps/web/components/Hero.tsx',
      line: 45,
      fix: null
    }
  ]
};

export default function DemoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('security');
  const [copied, setCopied] = useState(false);

  const audit = MOCK_AUDIT;

  function copyShareUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getTabFindings(tabKey) {
    if (!audit?.findings) return [];
    if (tabKey === 'ai-fixes') {
      return audit.findings.filter((f) => f.fix && f.fix.length > 10);
    }
    return audit.findings.filter((f) => f.type === TAB_TYPES[tabKey]?.type);
  }

  const scores = audit.scores;
  const meta = audit.repo_meta;

  return (
    <div id="report" className="page dashboard-layout active">
      <Sidebar activeId="report" />

      <main className="main-content">
        {/* DISCLAIMER BANNER */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          color: '#F59E0B',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Live Demo Mode</strong>
            <span style={{ fontSize: '13px', opacity: 0.9 }}>
              This is a static mock report to demonstrate BrutalAudit's capabilities. No authentication is required, and this does not affect your real account. 
              <span 
                style={{ marginLeft: '8px', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => document.querySelector('[data-auth-mode="signup"]')?.click() || router.push('/')}
              >
                Sign up to audit your own code.
              </span>
            </span>
          </div>
        </div>

        {/* Report Header */}
        <div className="report-header glass-panel anim-enter">
          <button
            className="btn-ghost btn-sm ripple-btn"
            onClick={() => router.push('/')}
            style={{ marginBottom: '20px' }}
          >
            ← Back to Home
          </button>

          <div className="report-hero">
            <ScoreRing score={scores.overall || 0} />

            <div className="report-info">
              <h1 className="report-name">{audit.repo_name}</h1>
              <div className="report-meta">
                <span><span className="icon">🕒</span> Audited {timeAgo(audit.completed_at)}</span>
                {meta.language && <span><span className="icon">💻</span> {meta.language}</span>}
                {meta.stars !== undefined && <span><span className="icon">⭐</span> {meta.stars.toLocaleString()} stars</span>}
              </div>

              {meta.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>
                  {meta.description}
                </p>
              )}

              {audit.summary && (
                <div className="glass" style={{
                  padding: '12px 16px', borderRadius: '10px', marginTop: '12px',
                  fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6',
                  border: '1px solid var(--glass-border)'
                }}>
                  {audit.summary}
                </div>
              )}

              {/* Score Radar Chart */}
              <div style={{ marginTop: '24px', width: '100%', maxWidth: '350px' }}>
                <ScoreRadarChart scores={scores} />
              </div>

              {/* Share button */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button className="btn-ghost btn-sm ripple-btn" onClick={copyShareUrl}>
                  {copied ? '✓ Copied!' : '🔗 Share Report'}
                </button>
                <a
                  href={meta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-sm ripple-btn"
                >
                  View on GitHub ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="audit-tabs anim-enter" style={{ animationDelay: '0.1s' }}>
          {Object.entries(TAB_TYPES).map(([key, tab]) => {
            const count = getTabFindings(key).length;
            return (
              <button
                key={key}
                className={`audit-tab ripple-btn${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {tab.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="audit-panels stagger-group">
          <div className="audit-panel active">
            <div className="issues-list">
              {(() => {
                const findings = getTabFindings(activeTab);

                if (findings.length === 0) {
                  return (
                    <EmptyState
                      icon={activeTab === 'ai-fixes' ? '✨' : '✅'}
                      title={activeTab === 'ai-fixes' ? 'No AI fixes generated' : `No ${activeTab} issues found`}
                      message={
                        activeTab === 'ai-fixes'
                          ? 'AI fix suggestions are generated for high-severity findings.'
                          : `Great news! No ${activeTab} issues were detected in this audit.`
                      }
                    />
                  );
                }

                return findings.map((finding, i) => (
                  <IssueCard key={i} finding={finding} />
                ));
              })()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
