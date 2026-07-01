'use client';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--red)', textDecoration: 'none' }}>
        ← Back to Home
      </Link>
      <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Privacy Policy</h1>
      <div style={{ color: 'var(--text2)', lineHeight: '1.6' }}>
        <p style={{ marginBottom: '1rem' }}>Last updated: July 2026</p>
        <p style={{ marginBottom: '1rem' }}>
          At BrutalAudit, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information.
        </p>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text1)', marginTop: '2rem', marginBottom: '1rem' }}>Data We Collect</h2>
        <p style={{ marginBottom: '1rem' }}>
          We collect repository metadata and code snippets strictly for the purpose of performing security and architectural audits. 
          We do not store your source code permanently. Code chunks sent to our AI providers are not used for training models.
        </p>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text1)', marginTop: '2rem', marginBottom: '1rem' }}>Authentication</h2>
        <p style={{ marginBottom: '1rem' }}>
          We use GitHub OAuth for authentication. We only request read-only access to your public and/or private repositories. We never write to your repositories.
        </p>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text1)', marginTop: '2rem', marginBottom: '1rem' }}>Contact Us</h2>
        <p style={{ marginBottom: '1rem' }}>
          If you have any questions about this Privacy Policy, please contact us at privacy@brutalaudit.example.com.
        </p>
      </div>
    </div>
  );
}
