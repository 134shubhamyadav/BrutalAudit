'use client';
import { useMagnetic } from '../lib/hooks';

export default function MagneticCard({ children, className, style, strength = 0.5 }) {
  const ref = useMagnetic(strength);
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
