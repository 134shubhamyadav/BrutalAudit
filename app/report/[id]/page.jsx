'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar.jsx';
import IssueCard from '../../../components/IssueCard.jsx';
import ScoreRing from '../../../components/ScoreRing.jsx';
import { IssueCardSkeleton } from '../../../components/SkeletonCard.jsx';
import EmptyState, { ErrorState } from '../../../components/EmptyState.jsx';
import { ScoreRadarChart } from '../../../components/Charts.jsx';
import { ShieldAlert, FileCode, Zap, Bug, Bot } from 'lucide-react';
import { api } from '../../../lib/api.js';

const TAB_TYPES = {
  security:     { label: 'Security',     icon: <ShieldAlert size={16} />, type: 'security' },
  architecture: { label: 'Architecture', icon: <FileCode size={16} />, type: 'architecture' },
  performance:  { label: 'Performance',  icon: <Zap size={16} />, type: 'performance' },
  code_smell:   { label: 'Code Quality', icon: <Bug size={16} />, type: 'code_smell' },
  'ai-fixes':   { label: 'AI Fixes ✨',  icon: <Bot size={16} />, type: null },
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

export default function ReportPage({ params }) {
  const router = useRouter();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('security');
  const [copied, setCopied] = useState(false);
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Unwrap params (Next.js 15 async params)
  const [auditId, setAuditId] = useState(null);
  useEffect(() => {
    params.then?.((p) => setAuditId(p.id)).catch(() => setAuditId(params.id));
    if (!params.then) setAuditId(params.id);
  }, [params]);

  useEffect(() => {
    if (!auditId) return;
    fetchAudit();
  }, [auditId]);

  async function fetchAudit() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.audits.get(auditId);
      setAudit(data);

      // Set active tab to first tab with findings
      const tabs = ['security', 'architecture', 'performance'];
      for (const tab of tabs) {
        if ((data.findings || []).some((f) => f.type === tab)) {
          setActiveTab(tab);
          break;
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const copyShareUrl = () => {
    const acknowledged = localStorage.getItem('share-privacy-acknowledged');
    if (!acknowledged) {
      setShowPrivacyModal(true);
      return;
    }
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyBadgeMarkdown = () => {
    if (!audit?.repo_full_name) return;
    const badgeUrl = `${window.location.origin}/api/badge/${audit.repo_full_name}`;
    const reportUrl = window.location.href;
    const md = `[![BrutalAudit Score](${badgeUrl})](${reportUrl})`;
    navigator.clipboard.writeText(md);
    setBadgeCopied(true);
    setTimeout(() => setBadgeCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!audit) return;
    const { repo_name, scores, summary, findings } = audit;
    
    let md = `# BrutalAudit Report: ${repo_name}\n\n`;
    md += `## Overall Score: ${scores?.overall || 0}/100\n`;
    md += `- Security: ${scores?.security || 0}/100\n`;
    md += `- Architecture: ${scores?.architecture || 0}/100\n`;
    md += `- Performance: ${scores?.performance || 0}/100\n\n`;

    if (typeof summary === 'string') {
      md += `## Summary\n${summary}\n\n`;
    } else if (summary && typeof summary === 'object') {
      md += `## Executive Summary\n`;
      Object.entries(summary).forEach(([key, val]) => {
        md += `### For ${key.toUpperCase()}\n${val}\n\n`;
      });
    }

    const detailedData = audit.repo_meta?.detailed_data;
    if (detailedData?.strengths && detailedData.strengths.length > 0) {
      md += `## Repository Strengths\n`;
      detailedData.strengths.forEach(s => {
        if (typeof s === 'string' && s.trim().length > 0) {
          md += `- ${s}\n`;
        }
      });
      md += `\n`;
    }

    if (findings && findings.length > 0) {
      md += `## Findings\n\n`;
      findings.forEach(f => {
        md += `### [${(f.severity || 'UNKNOWN').toUpperCase()}] ${f.title}\n`;
        md += `**Category:** ${f.type || f.category || 'General'}\n`;
        if (f.file) md += `**File:** \`${f.file}\`${f.line ? ` (Line ${f.line})` : ''}\n\n`;
        md += `${f.description}\n\n`;
        if (f.business_impact) md += `**Business Impact:** ${f.business_impact}\n\n`;
        if (f.technical_impact) md += `**Technical Impact:** ${f.technical_impact}\n\n`;
        if (f.fix || f.recommendation) {
          md += `**Recommendation:**\n\`\`\`\n${f.fix || f.recommendation}\n\`\`\`\n\n`;
        }
        if (f.example_fix) {
          md += `**Example Implementation:**\n\`\`\`\n${f.example_fix}\n\`\`\`\n\n`;
        }
        md += `---\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${repo_name}_BrutalAudit_Report.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function getTabFindings(tabKey) {
    if (!audit?.findings) return [];
    if (tabKey === 'ai-fixes') {
      return audit.findings.filter((f) => f.fix && f.fix.length > 10);
    }
    return audit.findings.filter((f) => f.type === TAB_TYPES[tabKey]?.type);
  }

  const scores = audit?.scores || {};
  const meta = audit?.repo_meta || {};

  if (loading) {
    return (
      <div id="report" className="page dashboard-layout active">
        <Sidebar activeId="report" />
        <main className="main-content">
          <div className="report-header glass-panel anim-enter">
            <div className="skeleton" style={{ width: '100px', height: '32px', borderRadius: '8px', marginBottom: '24px' }} />
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '40%', height: '28px', marginBottom: '12px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '8px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '30%', height: '16px', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
          <div className="issues-list" style={{ marginTop: '20px' }}>
            {Array.from({ length: 3 }).map((_, i) => <IssueCardSkeleton key={i} />)}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div id="report" className="page dashboard-layout active">
        <Sidebar activeId="report" />
        <main className="main-content">
          <ErrorState message={error} onRetry={fetchAudit} />
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button className="btn-ghost" onClick={() => router.push('/repos')}>← Back to Repos</button>
          </div>
        </main>
      </div>
    );
  }

  if (!audit) return null;

  return (
    <div id="report" className="page dashboard-layout active">
      <Sidebar activeId="report" />

      <main className="main-content">
        {/* Report Header */}
        <div className="report-header glass-panel anim-enter">
          <button
            className="btn-ghost btn-sm ripple-btn"
            onClick={() => router.push('/repos')}
            style={{ marginBottom: '20px' }}
          >
            ← Back to Repos
          </button>

          {showPrivacyModal && (
            <div className="loading-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
              <div className="glass" style={{ padding: '28px', maxWidth: '420px', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>⚠️ Before you share</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                  Shared report links are publicly accessible by anyone with the URL. This includes all findings, scores, and code references from your repository.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button className="btn-ghost btn-sm" onClick={() => setShowPrivacyModal(false)}>Cancel</button>
                  <button className="btn-red btn-sm" onClick={() => {
                    localStorage.setItem('share-privacy-acknowledged', '1');
                    setShowPrivacyModal(false);
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}>
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="report-hero">
            <ScoreRing score={scores.overall || 0} />

            <div className="report-info">
              <h1 className="report-name">{audit.repo_name || 'Repository'}</h1>
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

              {audit.summary && (() => {
                let parsed = audit.summary;
                try { parsed = JSON.parse(audit.summary); } catch {}
                
                if (typeof parsed === 'string') {
                  return (
                    <div className="glass" style={{
                      padding: '12px 16px', borderRadius: '10px', marginTop: '12px',
                      fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6',
                      border: '1px solid var(--glass-border)'
                    }}>
                      {parsed}
                    </div>
                  );
                }
                
                return (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(parsed).map(([audience, text]) => text && (
                      <div key={audience} className="glass" style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--red-base)', marginBottom: '4px' }}>{audience}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{text}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Score Radar Chart */}
              <div style={{ marginTop: '24px', width: '100%', maxWidth: '350px' }}>
                <ScoreRadarChart scores={scores} />
              </div>

              {/* Share button */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn-ghost btn-sm ripple-btn" onClick={copyShareUrl}>
                  {copied ? '✓ Copied!' : '🔗 Share Link'}
                </button>
                <button className="btn-ghost btn-sm ripple-btn" onClick={copyBadgeMarkdown}>
                  {badgeCopied ? '✓ Copied Badge!' : '🛡️ Copy Badge'}
                </button>
                <button className="btn-ghost btn-sm ripple-btn" onClick={downloadMarkdown}>
                  📥 Download (.md)
                </button>
                <a
                  href={meta.url || `https://github.com/${audit.repo_full_name}`}
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
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {tab.icon} {tab.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="audit-panels stagger-group">
          <div key={activeTab} className="audit-panel active anim-enter">
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
                          ? 'AI fix suggestions are generated for high-severity findings. Run a new audit if findings are missing.'
                          : `Great news! No ${activeTab} issues were detected in this audit.`
                      }
                    />
                  );
                }

                return findings.map((finding, i) => (
                  <div key={i} className="anim-enter" style={{ animationDelay: `${i * 0.05}s` }}>
                    <IssueCard finding={finding} />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
