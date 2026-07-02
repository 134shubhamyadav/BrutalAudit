'use client';

import { useState, useEffect } from 'react';

export default function CountdownBanner() {
  const targetDate = new Date('2026-08-15T23:59:59').getTime();
  const [timeLeft, setTimeLeft] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('PROMO EXPIRED');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isClient) return null;

  return (
    <div style={{
      marginTop: '16px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center'
    }}>
      <span style={{ color: '#fca5a5', fontSize: '13px', lineHeight: '1.4' }}>
        🚀 Pro is 100% Free until Aug 15! No credit card required.
      </span>
      <span style={{ 
        background: 'rgba(0,0,0,0.4)', 
        color: '#fff',
        padding: '4px 10px', 
        borderRadius: '6px', 
        fontFamily: 'monospace',
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '0.5px'
      }}>
        Ends in: {timeLeft || 'Loading...'}
      </span>
    </div>
  );
}
