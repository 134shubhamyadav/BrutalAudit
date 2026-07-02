import '../src/styles/main.css';
import { AuthProvider } from '../components/AuthProvider';
import OnboardingModal from '../components/OnboardingModal';
import { ToastProvider } from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { Space_Grotesk, Inter } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'BrutalAudit — AI-Powered Code Audit Tool',
  description: 'Get a brutally honest AI-powered audit of your GitHub repository. Security, architecture, performance, test coverage and documentation scores in minutes.',
  keywords: ['code audit', 'AI code review', 'security analysis', 'GitHub audit', 'code quality'],
  openGraph: {
    title: 'BrutalAudit — AI-Powered Code Audit Tool',
    description: 'Get a brutally honest AI-powered audit of your GitHub repository in minutes.',
    type: 'website',
    url: 'https://brutalaudit.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrutalAudit — AI Code Auditor',
    description: 'Brutally honest AI code audits. Security, architecture, performance scored.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head />
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <div className="bg-blobs">
              <div className="blob blob1"></div>
              <div className="blob blob2"></div>
              <div className="blob blob3"></div>
            </div>
            <div className="grid-bg"></div>

            <OnboardingModal />
            {children}

            {/* Global toast notification system */}
            <ToastProvider />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
