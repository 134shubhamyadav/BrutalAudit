import '../src/styles/main.css';
import { AuthProvider } from '../components/AuthProvider';
import OnboardingModal from '../components/OnboardingModal';

export const metadata = {
  title: 'BrutalAudit',
  description: 'Ruthless static analysis for your codebase.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <div className="bg-blobs">
            <div className="blob blob1"></div>
            <div className="blob blob2"></div>
            <div className="blob blob3"></div>
          </div>
          <div className="grid-bg"></div>
          <div id="toast-container"></div>
          
          <OnboardingModal />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
