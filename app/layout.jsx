import '../src/styles/main.css';
import { AuthProvider } from '../components/AuthProvider';
import OnboardingModal from '../components/OnboardingModal';
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
  title: 'BrutalAudit',
  description: 'Ruthless static analysis for your codebase.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
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
