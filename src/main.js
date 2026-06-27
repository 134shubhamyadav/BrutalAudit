import { initUI } from './scripts/ui.js';
import { initHero } from './scripts/hero.js';
import { initDashboard } from './scripts/dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initHero();
  initDashboard();
});
