'use client';
import { useEffect, useRef, useCallback } from 'react';

/**
 * useMagnetic - High performance magnetic hover hook.
 * Uses requestAnimationFrame to throttle mousemove events and 
 * directly mutates transform for 60fps compositor-only animation.
 */
export function useMagnetic(strength = 0.5) {
  const ref = useRef(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHovering = false;
    
    const animate = () => {
      // Lerp for smooth magnetic feel
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      
      if (el) {
        el.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
      
      // Keep animating if we are hovering or if we haven't settled back to 0
      if (isHovering || Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1) {
        rafId = requestAnimationFrame(animate);
      } else {
        // Settled exactly at 0
        if (el) el.style.transform = '';
        rafId = null;
      }
    };

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      targetX = x * strength;
      targetY = y * strength;
      
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    const handleMouseEnter = () => {
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
      targetX = 0;
      targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [strength]);

  return ref;
}

/**
 * useRipple - Injects a perfectly optimized ripple span that cleans itself up.
 */
export function useRipple() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    // Prevent nested relative positioned elements breaking ripple
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
    el.style.overflow = 'hidden';

    const handleClick = (e) => {
      const rect = el.getBoundingClientRect();
      // Calculate furthest distance to corners for perfect ripple size
      const maxDim = Math.max(rect.width, rect.height);
      const radius = Math.sqrt(rect.width * rect.width + rect.height * rect.height);
      
      const x = e.clientX - rect.left - radius;
      const y = e.clientY - rect.top - radius;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect-node';
      ripple.style.width = ripple.style.height = `${radius * 2}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      el.appendChild(ripple);

      // Clean up DOM node strictly when animation completes
      const removeRipple = () => {
        ripple.removeEventListener('animationend', removeRipple);
        ripple.remove();
      };
      
      ripple.addEventListener('animationend', removeRipple);
      
      // Fallback cleanup in case animationend fails
      setTimeout(() => {
        if (ripple.parentNode === el) {
          ripple.removeEventListener('animationend', removeRipple);
          ripple.remove();
        }
      }, 1000);
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, []);

  return ref;
}

/**
 * useFocusTrap - Traps keyboard focus within the referenced element.
 */
export function useFocusTrap(isActive = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isActive) return;
    const el = ref.current;
    if (!el) return;

    const focusableElements = Array.from(el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    // Use setTimeout to ensure the modal is rendered before focusing
    setTimeout(() => {
      if (firstElement && typeof firstElement.focus === 'function') {
        firstElement.focus();
      }
    }, 10);

    return () => {
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return ref;
}
