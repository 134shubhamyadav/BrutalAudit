'use client';
import { useRouter } from 'next/navigation';
import MagneticCard from './MagneticCard';
import { Star, Lock, GitBranch } from 'lucide-react';

const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', Ruby: '#701516',
  'C++': '#f34b7d', C: '#555555', Swift: '#F05138', Kotlin: '#A97BFF',
  PHP: '#4F5D95', 'C#': '#178600', Vue: '#41b883', Svelte: '#ff3e00',
};

const GRADE_CONFIG = {
  A: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16,185,129,0.3)' },
  B: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245,158,11,0.3)' },
  C: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239,68,68,0.3)' },
  D: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239,68,68,0.4)' },
};

function scoreToGrade(score) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function RepoCard({ repo, lastAudit, onAudit, onDetailedAudit, isAuditing, index = 0 }) {
  const router = useRouter();
  const grade = lastAudit ? scoreToGrade(lastAudit.scores?.overall || 0) : null;
  const gradeStyle = grade ? GRADE_CONFIG[grade] : null;
  const langColor = LANG_COLORS[repo.language] || '#888';

  return (
    <MagneticCard className="glass repo-card hover-lift" style={{ '--i': index + 1 }}>
      <div>
        <div className="repo-name">
          {repo.name}
          {grade && (
            <span
              className="score-pill"
              style={{ background: gradeStyle.bg, color: gradeStyle.color, borderColor: gradeStyle.border }}
            >
              {grade}
            </span>
          )}
          {!grade && (
            <span
              className="score-pill"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              Unaudited
            </span>
          )}
          {repo.isPrivate && (
            <span
              className="score-pill"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderColor: 'rgba(255,255,255,0.08)', marginLeft: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Lock size={12} /> Private
            </span>
          )}
        </div>
        <div className="repo-desc">{repo.description || 'No description provided.'}</div>
        <div className="repo-meta">
          <span className="repo-stat">
            <span className="lang-dot" style={{ background: langColor }}></span>
            {repo.language}
          </span>
          <span className="repo-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} className="lucide-icon" /> {repo.stars?.toLocaleString() || 0}
          </span>
          <span className="repo-stat">
            {lastAudit ? `Last audit: ${timeAgo(lastAudit.completed_at)}` : 'Never audited'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {lastAudit && (
          <button
            className="btn-ghost btn-sm ripple-btn"
            onClick={() => router.push(`/report/${lastAudit.id}`)}
          >
            View Report
          </button>
        )}
        <button
          className={`btn-ghost btn-sm ripple-btn${isAuditing ? ' loading' : ''}`}
          onClick={() => onAudit(repo)}
          disabled={isAuditing}
          style={{ minWidth: '100px' }}
        >
          {isAuditing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="loading-ring" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
              Auditing…
            </span>
          ) : 'Quick Audit'}
        </button>
        <button
          className="btn-red btn-sm premium-glow ripple-btn"
          onClick={() => onDetailedAudit(repo)}
          disabled={isAuditing}
        >
          Detailed Audit
        </button>
      </div>
    </MagneticCard>
  );
}
