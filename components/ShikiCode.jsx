'use client';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

export default function ShikiCode({ code, lang = 'javascript' }) {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    if (!code) return;
    let isMounted = true;
    
    // Attempt syntax highlighting. Fallback to raw code on failure.
    codeToHtml(code, {
      lang: lang,
      theme: 'vitesse-dark'
    }).then(result => {
      if (isMounted) setHtml(result);
    }).catch((e) => {
      console.error("Shiki highlight error:", e);
      if (isMounted) setHtml(`<pre><code>${code}</code></pre>`);
    });

    return () => { isMounted = false; };
  }, [code, lang]);

  if (!html) {
    return (
      <div className="shiki-loading" style={{ opacity: 0.5 }}>
        <pre style={{ margin: 0 }}><code>{code}</code></pre>
      </div>
    );
  }

  return (
    <div
      className="shiki-wrapper"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        margin: 0,
        borderRadius: '6px',
        overflow: 'hidden',
        fontSize: '13px',
      }}
    />
  );
}
