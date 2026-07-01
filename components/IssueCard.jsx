'use client';
import { useState } from 'react';

import { ShieldAlert, Architecture, Zap, Bug, FileCode } from 'lucide-react';
import ShikiCode from './ShikiCode';

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'Critical', borderLeft: '#EF4444' },
  high:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'High',     borderLeft: '#F59E0B' },
  medium:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Medium',   borderLeft: '#3B82F6' },
  low:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Low',      borderLeft: '#10B981' },
};

const TYPE_ICONS = {
  security:     <ShieldAlert size={18} />,
  architecture: <FileCode size={18} />,
  performance:  <Zap size={18} />,
  code_smell:   <Bug size={18} />,
};

export default function IssueCard({ finding }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.medium;
  const icon = TYPE_ICONS[finding.type || finding.category] || <FileCode size={18} />;
  const hasDetailedInfo = finding.recommendation || finding.example_fix || finding.business_impact;

  return (
    <div
      className={`glass issue-card hover-lift${finding.severity === 'critical' ? ' issue-critical' : ''}`}
      style={{ borderLeft: `3px solid ${config.borderLeft}`, cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="issue-header">
        <h4 className="issue-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          {finding.title}
        </h4>
        <span
          className="issue-badge"
          style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}33` }}
        >
          {config.label}
        </span>
      </div>

      <p className="issue-desc">{finding.description}</p>

      {finding.file && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px'
        }}>
          <span style={{ color: 'var(--red-base)' }}>📄</span>
          <code style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {finding.file}{finding.line ? `:${finding.line}` : ''}
          </code>
        </div>
      )}

      {(finding.fix || hasDetailedInfo) && (
        <div className="expand-hint" style={{ marginTop: '8px' }}>
          {expanded ? 'Hide details ↑' : 'View details ↓'}
        </div>
      )}

      {expanded && (
        <div className="code-snippet" style={{ marginTop: '10px' }}>
          {finding.business_impact && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Business Impact:</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{finding.business_impact}</div>
            </div>
          )}
          {finding.technical_impact && (
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Technical Impact:</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{finding.technical_impact}</div>
            </div>
          )}
          
          {(finding.fix || finding.recommendation) && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Suggested Fix / Recommendation
              </div>
              <div style={{ marginTop: '8px' }}>
                <ShikiCode code={finding.fix || finding.recommendation} />
              </div>
            </div>
          )}

          {finding.example_fix && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Example Implementation
              </div>
              <div style={{ marginTop: '8px' }}>
                <ShikiCode code={finding.example_fix} />
              </div>
            </div>
          )}

          {finding.estimated_effort && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated Effort:</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{finding.estimated_effort}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
