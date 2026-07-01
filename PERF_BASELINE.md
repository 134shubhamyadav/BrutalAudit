# BrutalAudit Performance Baseline

## Baseline Issues (Pre-Optimization)
- **Magnetic Hover**: Bound unthrottled to `mousemove`, mutating inline styles directly and causing layout thrashing.
- **Animations (`pulse-glow`)**: Animating `box-shadow` instead of `opacity`/`transform`, causing forced repaints on every frame and killing the 60fps budget.
- **Glassmorphism**: Stacked `backdrop-filter: blur(40px)` causing heavy GPU overhead, especially on scroll.
- **Hero Canvas**: Leaking `requestAnimationFrame` loops on re-mounts, compounding `ctx.scale` on resize, and executing O(n^2) Math.sqrt checks for particles even when off-screen.
- **Ripple Effect**: Leaving detached DOM nodes accumulating without proper `animationend` cleanup.
- **Staggered Entrances**: Fixed CSS `:nth-child` limits causing dynamic list rendering issues.

## Expected Improvements (Post-Optimization)
- 60fps stable during scroll and interactions.
- Zero forced reflows/repaints during hover states.
- 0 detached DOM nodes on ripple clicks.
- Improved LCP via `next/image` and `next/font`.
- Accurate touch targets (>= 44px) and robust accessibility (focus rings).
