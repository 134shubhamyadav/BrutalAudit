'use client';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--red)', textDecoration: 'none' }}>
        ← Back to Home
      </Link>
      <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Terms of Service</h1>
      <div style={{ color: 'var(--text2)', lineHeight: '1.6' }}>
        <p style={{ marginBottom: '1rem' }}>Last updated: July 2026</p>
        <p style={{ marginBottom: '1rem' }}>
          Welcome to BrutalAudit. By using our service, you agree to these Terms of Service.
        </p>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text1)', marginTop: '2rem', marginBottom: '1rem' }}>Use of Service</h2>
        <p style={{ marginBottom: '1rem' }}>
          You may use BrutalAudit to analyze repositories that you own or have the right to access. You may not use our service for malicious purposes or to analyze code you do not have permission to view.
        </p>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text1)', marginTop: '2rem', marginBottom: '1rem' }}>Limitation of Liability</h2>
        <p style={{ marginBottom: '1rem' }}>
          BrutalAudit provides automated AI analysis. We do not guarantee the accuracy, completeness, or reliability of any findings. The service is provided "as is" without warranties of any kind. We are not liable for any damages resulting from the use or inability to use our service.
        </p>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text1)', marginTop: '2rem', marginBottom: '1rem' }}>Changes to Terms</h2>
        <p style={{ marginBottom: '1rem' }}>
          We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of any updated terms.
        </p>
      </div>
    </div>
  );
}
