import fs from 'fs';
import path from 'path';

let html = fs.readFileSync('index.html', 'utf8');

// Extract everything between <body> and <script type="module"
const bodyMatch = html.match(/<body>([\s\S]*?)<script type="module"/);
let body = bodyMatch ? bodyMatch[1] : '';

// Convert class to className
body = body.replace(/class=/g, 'className=');
// Convert for to htmlFor
body = body.replace(/for=/g, 'htmlFor=');
// Convert crossorigin to crossOrigin
body = body.replace(/crossorigin/g, 'crossOrigin="anonymous"');
// Convert viewBox to viewBox
body = body.replace(/viewbox/g, 'viewBox');
// Convert stroke-width to strokeWidth
body = body.replace(/stroke-width/g, 'strokeWidth');
// Convert stroke-dasharray to strokeDasharray
body = body.replace(/stroke-dasharray/g, 'strokeDasharray');
// Convert stroke-dashoffset to strokeDashoffset
body = body.replace(/stroke-dashoffset/g, 'strokeDashoffset');
// Self close img and input tags
body = body.replace(/<img([^>]*[^/])>/g, '<img$1 />');
body = body.replace(/<input([^>]*[^/])>/g, '<input$1 />');
// Close br tags
body = body.replace(/<br>/g, '<br />');

// Convert styles manually (a bit hacky but works for this specific file)
body = body.replace(/style="width:100%;display:flex;align-items:center;justify-content:center;gap:12px"/g, "style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}");
body = body.replace(/style="display:none"/g, "style={{ display: 'none' }}");
body = body.replace(/style="width:100%"/g, "style={{ width: '100%' }}");
body = body.replace(/style="margin-top:24px"/g, "style={{ marginTop: '24px' }}");
body = body.replace(/style="margin-top:8px"/g, "style={{ marginTop: '8px' }}");
body = body.replace(/style="font-size:20px;color:var\(--text3\)"/g, "style={{ fontSize: '20px', color: 'var(--text3)' }}");
body = body.replace(/style="font-size:13px;color:var\(--text3\);text-align:center;margin-top:20px"/g, "style={{ fontSize: '13px', color: 'var(--text3)', textAlign: 'center', marginTop: '20px' }}");
body = body.replace(/style="flex:1;text-align:center;letter-spacing:4px;font-weight:600;"/g, "style={{ flex: 1, textAlign: 'center', letterSpacing: '4px', fontWeight: 600 }}");
body = body.replace(/style="padding:0 16px;font-size:13px;border-radius:12px;"/g, "style={{ padding: '0 16px', fontSize: '13px', borderRadius: '12px' }}");
body = body.replace(/style="font-size:20px"/g, "style={{ fontSize: '20px' }}");
body = body.replace(/style="display:flex;gap:20px"/g, "style={{ display: 'flex', gap: '20px' }}");
body = body.replace(/style="font-size:13px;color:var\(--text3\);text-decoration:none;cursor:pointer"/g, "style={{ fontSize: '13px', color: 'var(--text3)', textDecoration: 'none', cursor: 'pointer' }}");
body = body.replace(/style="width:0%"/g, "style={{ width: '0%' }}");
body = body.replace(/style="animation-delay: 0.1s"/g, "style={{ animationDelay: '0.1s' }}");
body = body.replace(/style="animation-delay: 0.2s"/g, "style={{ animationDelay: '0.2s' }}");
body = body.replace(/style="left: 65%"/g, "style={{ left: '65%' }}");
body = body.replace(/style="color:#f87171"/g, "style={{ color: '#f87171' }}");
body = body.replace(/style="color:#4ade80"/g, "style={{ color: '#4ade80' }}");
body = body.replace(/style="opacity:0.4"/g, "style={{ opacity: 0.4 }}");
body = body.replace(/style="display:flex;gap:8px"/g, "style={{ display: 'flex', gap: '8px' }}");
body = body.replace(/<!--.*?-->/gs, "");

// Add Next.js wrapper and Auth Logic
const finalJsx = `
'use client';
import { useEffect } from 'react';
import { useSignIn, useAuth } from '@clerk/nextjs';
import { initUI } from '../src/scripts/ui.js';
import { initHero } from '../src/scripts/hero.js';
import { initDashboard } from '../src/scripts/dashboard.js';

export default function Home() {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();

  useEffect(() => {
    // Run the original vanilla JS to preserve all animations and logic perfectly
    if (typeof window !== 'undefined') {
      initUI();
      initHero();
      initDashboard();
      
      // Hook up GitHub Auth manually
      const githubBtn = document.querySelector('[data-action="github-auth"]');
      if (githubBtn) {
        githubBtn.onclick = (e) => {
          e.preventDefault();
          if (isSignInLoaded && signIn) {
            signIn.authenticateWithRedirect({
              strategy: "oauth_github",
              redirectUrl: "/sso-callback",
              redirectUrlComplete: "/"
            });
          }
        };
      }

      // Hide Dashboard/Repos/Report from Nav if not signed in
      if (isAuthLoaded) {
        const navLinks = document.querySelectorAll('.nav-link[data-navigate="dashboard"], .nav-link[data-navigate="repos"]');
        navLinks.forEach(link => {
          link.style.display = isSignedIn ? 'inline-block' : 'none';
        });

        // Hide "Sign In" button if already signed in
        const ctaWrap = document.querySelector('.nav-cta');
        if (ctaWrap && isSignedIn) {
          ctaWrap.innerHTML = '<button class="btn-ghost btn-sm ripple-btn" onclick="window.location.reload()">Refresh Session</button>';
        }
      }
    }
  }, [isSignInLoaded, isAuthLoaded, isSignedIn]);

  return (
    <>
      ${body}
    </>
  );
}
`;

fs.writeFileSync('app/page.jsx', finalJsx);
console.log('Successfully generated app/page.jsx from index.html');
