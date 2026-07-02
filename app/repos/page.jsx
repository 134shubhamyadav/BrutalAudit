'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar.jsx';
import RepoCard from '../../components/RepoCard.jsx';
import { RepoCardSkeleton } from '../../components/SkeletonCard.jsx';
import EmptyState, { ErrorState } from '../../components/EmptyState.jsx';
import LoadingOverlay from '../../components/LoadingOverlay.jsx';
import { api } from '../../lib/api.js';

export default function ReposPage() {
  const router = useRouter();
  const [repos, setRepos] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState('All Repos');
  const [auditingRepo, setAuditingRepo] = useState(null);
  const [auditStep, setAuditStep] = useState(null);
  const [auditError, setAuditError] = useState(null);
  const [auditSuccess, setAuditSuccess] = useState(null);
  const [detailedAuditModalRepo, setDetailedAuditModalRepo] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeEventSource, setActiveEventSource] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [reposRes, dashRes] = await Promise.all([
        api.repos.list(),
        api.dashboard.get(),
      ]);

      let allRepos = reposRes.repos || [];
      const dashAudits = dashRes.recentAudits || [];

      // Sort repos: recently pushed first
      allRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      setRepos(allRepos);
      setAudits(dashAudits);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAudit(repo, isDetailed = false, overridePrompt = '') {
    setDetailedAuditModalRepo(null);
    setAuditingRepo(repo.fullName);
    setAuditStep('fetching');
    setAuditError(null);
    setAuditSuccess(null);
    
    const params = new URLSearchParams({
      owner: repo.owner,
      repo: repo.name,
      detailed: isDetailed,
      customPrompt: overridePrompt
    });

    try {
      const { auth } = await import('../../lib/firebase');
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        params.append('token', token);
      }
    } catch (e) {
      console.warn('Failed to attach Firebase token to stream', e);
    }

    const storedGithubToken = typeof window !== 'undefined' ? localStorage.getItem('githubToken') : null;
    if (storedGithubToken) {
      params.append('githubToken', storedGithubToken);
    }

    const eventSource = new EventSource(`/api/audit/stream?${params.toString()}`);
    setActiveEventSource(eventSource);

    eventSource.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      setAuditStep(data.step);
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      eventSource.close();
      setActiveEventSource(null);
      setAuditSuccess(`Audit complete! Score: ${data.scores?.overall}/100`);
      router.push(`/report/${data.auditId}`);
    });

    eventSource.addEventListener('error', (e) => {
      eventSource.close();
      setActiveEventSource(null);
      let errorMsg = 'Audit failed. Please try again.';
      try {
        const data = JSON.parse(e.data);
        if (data.message) errorMsg = data.message;
      } catch {}
      setAuditError(errorMsg);
      setAuditingRepo(null);
      setAuditStep(null);
    });
  }

  function handleCancelAudit() {
    if (activeEventSource) {
      activeEventSource.close();
      setActiveEventSource(null);
    }
    setAuditingRepo(null);
    setAuditStep(null);
    setAuditError("Audit halted by user.");
  }

  function getLastAudit(repo) {
    return audits.find((a) => a.repo_full_name === repo.fullName) || null;
  }

  function filterRepos(repos) {
    let filtered = repos;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
      );
    }

    // Filter tabs
    if (filter === 'High Risk') {
      filtered = filtered.filter((r) => {
        const audit = getLastAudit(r);
        return audit && (audit.scores?.overall || 100) < 60;
      });
    } else if (filter === 'Needs Audit') {
      filtered = filtered.filter((r) => !getLastAudit(r));
    }

    return filtered;
  }

  const displayedRepos = filterRepos(repos);
  const FILTERS = ['All Repos', 'High Risk', 'Needs Audit'];

  return (
    <div id="repos" className="page dashboard-layout active">
      <Sidebar activeId="repos" auditCount={repos.length} />

      <main className="main-content">
        <div className="dash-header">
          <div className="search-bar premium-input">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search repositories…"
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                clearTimeout(window._searchTimer);
                window._searchTimer = setTimeout(() => setSearch(val), 300);
              }}
            />
          </div>
          <button className="btn-red premium-glow ripple-btn" onClick={fetchData} disabled={loading}>
            {loading ? '↻ Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filters-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn ripple-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Audit Error/Success Toasts */}
        {auditError && (
          <div className="glass" style={{
            padding: '12px 16px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px',
            color: '#EF4444', fontSize: '14px', marginBottom: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>⚠️ {auditError}</span>
            <button onClick={() => setAuditError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>✕</button>
          </div>
        )}
        {auditSuccess && (
          <div className="glass" style={{
            padding: '12px 16px', background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px',
            color: '#10B981', fontSize: '14px', marginBottom: '16px'
          }}>
            ✓ {auditSuccess}
          </div>
        )}

        {/* Repo Grid */}
        <div className="repos-grid stagger-group" id="repos-container">
          {loading && Array.from({ length: 4 }).map((_, i) => <RepoCardSkeleton key={i} />)}

          {!loading && error && (
            <div style={{ gridColumn: '1 / -1' }}>
              <ErrorState message={error} onRetry={fetchData} />
            </div>
          )}

          {!loading && !error && displayedRepos.length === 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              {repos.length === 0 ? (
                <EmptyState
                  icon="📁"
                  title="No repositories found"
                  message="Make sure you've connected your GitHub account and have repositories available."
                  cta="Retry"
                  onCta={fetchData}
                />
              ) : (
                <EmptyState
                  icon="🔍"
                  title="No matching repositories"
                  message={`No repos match your current filter "${filter}" or search "${search}".`}
                  cta="Clear Filters"
                  onCta={() => { setFilter('All Repos'); setSearch(''); }}
                />
              )}
            </div>
          )}

          {!loading && !error && displayedRepos.map((repo, idx) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              lastAudit={getLastAudit(repo)}
              onAudit={handleAudit}
              onDetailedAudit={(r) => { setDetailedAuditModalRepo(r); setCustomPrompt(''); }}
              isAuditing={auditingRepo === repo.fullName}
              index={idx}
            />
          ))}
        </div>

        {/* Loading Overlay for Active Audit */}
        {auditingRepo && (
          <LoadingOverlay 
            repoName={auditingRepo} 
            currentStep={auditStep} 
            onCancel={handleCancelAudit}
          />
        )}

        {/* Detailed Audit Modal */}
        {detailedAuditModalRepo && (
          <div className="loading-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.8)' }}>
            <div className="glass" style={{ padding: '30px', width: '90%', maxWidth: '500px', borderRadius: '16px' }}>
              <h2 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Detailed Audit</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                Run a deep, comprehensive analysis of <strong>{detailedAuditModalRepo.name}</strong>.
                You can optionally provide custom instructions for the AI auditor below.
              </p>
              <textarea
                className="premium-input"
                style={{ width: '100%', minHeight: '120px', padding: '12px', fontSize: '14px', borderRadius: '8px', marginBottom: '20px', resize: 'vertical' }}
                placeholder="e.g. Find any hardcoded passwords, or check for GDPR compliance..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn-ghost ripple-btn" onClick={() => setDetailedAuditModalRepo(null)} disabled={auditingRepo === detailedAuditModalRepo.fullName}>Cancel</button>
                <button 
                  className="btn-red premium-glow ripple-btn" 
                  onClick={() => handleAudit(detailedAuditModalRepo, true, customPrompt)}
                  disabled={auditingRepo === detailedAuditModalRepo.fullName}
                >
                  {auditingRepo === detailedAuditModalRepo.fullName ? 'Starting...' : 'Run Detailed Audit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
