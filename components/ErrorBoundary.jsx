'use client';
import { Component } from 'react';

/**
 * React Error Boundary — wraps any component tree.
 * If a child crashes, it shows a recovery UI instead of a blank page.
 * Usage: wrap page-level components with <ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console (replace with Sentry later: Sentry.captureException(error))
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: 'white',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>💥</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px', maxWidth: '400px' }}>
              {this.props.fallbackMessage || 'An unexpected error occurred on this page. Try refreshing.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); }}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={{
                marginTop: '32px',
                padding: '16px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fca5a5',
                textAlign: 'left',
                overflow: 'auto',
                maxWidth: '600px',
              }}>
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
