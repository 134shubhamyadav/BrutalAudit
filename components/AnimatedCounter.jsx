'use client';
import { useEffect, useState, useRef } from 'react';

export default function AnimatedCounter({ end, duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Check reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(end);
      return;
    }
    
    let observer;
    let animationFrame;
    let startTime;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      if (progress < duration) {
        // easeOutExpo
        const progressNormalized = progress / duration;
        const easedProgress = progressNormalized === 1 ? 1 : 1 - Math.pow(2, -10 * progressNormalized);
        
        setCount(Math.floor(end * easedProgress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animationFrame = requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    observer.observe(el);
    
    return () => {
      if (observer) observer.disconnect();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [end, duration]);
  
  return <span ref={ref}>{count.toLocaleString()}</span>;
}
