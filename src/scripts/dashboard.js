import Chart from 'chart.js/auto';
import { startAuditSimulation } from './ui.js';

export function initDashboard() {
  // Animated Counters
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    const duration = 2000;
    const step = target / (duration / 16);
    
    let current = 0;
    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.innerText = Math.ceil(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.innerText = target;
      }
    };
    
    // Intersection Observer to trigger when visible
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        updateCounter();
        observer.disconnect();
      }
    });
    observer.observe(counter);
  });

  // Score Bars Animation
  const scoreBars = document.querySelectorAll('.sb-fill');
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        bar.style.width = bar.getAttribute('data-width');
      }
    });
  });
  scoreBars.forEach(bar => barObserver.observe(bar));

  // Initialize Trend Chart
  const ctx = document.getElementById('trendChart');
  if (ctx) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Overall Score',
          data: [65, 70, 68, 75, 78, 82],
          borderColor: '#FF1E1E',
          backgroundColor: 'rgba(255, 30, 30, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#000',
          pointBorderColor: '#FF1E1E',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 10, 10, 0.9)',
            titleFont: { family: 'Space Grotesk' },
            bodyFont: { family: 'Inter' },
            padding: 12,
            borderColor: 'rgba(255, 30, 30, 0.3)',
            borderWidth: 1,
            displayColors: false
          }
        },
        scales: {
          y: {
            min: 50, max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#71717A', font: { family: 'Space Grotesk' } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#71717A', font: { family: 'Space Grotesk' } }
          }
        }
      }
    });
  }

  // Generate Heatmap
  const heatmap = document.getElementById('commit-heatmap');
  if (heatmap) {
    // 52 weeks * 7 days
    let html = '<div style="display:grid; grid-template-columns: repeat(52, 1fr); gap: 3px;">';
    for (let i = 0; i < 52 * 7; i++) {
      const val = Math.random();
      let colorClass = 'hm-0'; // bg default
      if (val > 0.9) colorClass = 'hm-4';
      else if (val > 0.75) colorClass = 'hm-3';
      else if (val > 0.5) colorClass = 'hm-2';
      else if (val > 0.3) colorClass = 'hm-1';
      
      const opacity = colorClass === 'hm-0' ? '0.05' : '1';
      const bg = colorClass === 'hm-0' ? 'rgba(255,255,255,0.05)' : 
                 colorClass === 'hm-1' ? 'rgba(255,30,30,0.2)' :
                 colorClass === 'hm-2' ? 'rgba(255,30,30,0.5)' :
                 colorClass === 'hm-3' ? 'rgba(255,30,30,0.8)' : '#FF1E1E';
                 
      html += `<div style="aspect-ratio: 1; border-radius: 2px; background: ${bg}; cursor: pointer" title="Activity level: ${Math.floor(val*10)}"></div>`;
    }
    html += '</div>';
    heatmap.innerHTML = html;
  }

  // Populate Repositories
  const reposContainer = document.getElementById('repos-container');
  if (reposContainer) {
    const repos = [
      { name: 'frontend-monorepo', desc: 'Main React web application and component library', lang: 'TypeScript', langColor: '#3178c6', score: '82', grade: 'A', risk: 'Low' },
      { name: 'payment-api', desc: 'Core payment processing microservice', lang: 'Go', langColor: '#00ADD8', score: '94', grade: 'A', risk: 'Low' },
      { name: 'auth-service', desc: 'Authentication and identity provider', lang: 'Rust', langColor: '#dea584', score: '76', grade: 'B', risk: 'Medium' },
      { name: 'legacy-admin', desc: 'Old internal admin dashboard (Deprecated)', lang: 'JavaScript', langColor: '#f1e05a', score: '42', grade: 'C', risk: 'High' }
    ];

    let html = '';
    repos.forEach((repo, i) => {
      const scoreClass = repo.grade === 'A' ? 'badge-good' : repo.grade === 'B' ? 'badge-warning' : 'badge-critical';
      const scoreColor = repo.grade === 'A' ? 'rgba(16, 185, 129, 0.1)' : repo.grade === 'B' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      const textCol = repo.grade === 'A' ? '#10B981' : repo.grade === 'B' ? '#F59E0B' : '#EF4444';
      
      html += `
        <div class="glass repo-card hover-lift magnetic" style="animation-delay: ${i * 0.1}s">
          <div>
            <div class="repo-name">
              ${repo.name} 
              <span class="score-pill" style="background: ${scoreColor}; color: ${textCol}; border-color: ${textCol}40">${repo.grade}</span>
            </div>
            <div class="repo-desc">${repo.desc}</div>
            <div class="repo-meta">
              <span class="repo-stat"><span class="lang-dot" style="background: ${repo.langColor}"></span> ${repo.lang}</span>
              <span class="repo-stat">⭐ ${Math.floor(Math.random() * 500)}</span>
              <span class="repo-stat">Last audit: 2d ago</span>
            </div>
          </div>
          <div>
            <button class="btn-ghost btn-sm ripple-btn" data-action="start-audit">Quick Audit</button>
          </div>
        </div>
      `;
    });
    reposContainer.innerHTML = html;

    // Filter Logic
    const filterBtns = document.querySelectorAll('.filters-row .filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.innerText.trim();
        const cards = reposContainer.querySelectorAll('.repo-card');
        
        cards.forEach((card, index) => {
          const grade = card.querySelector('.score-pill').innerText;
          const name = card.querySelector('.repo-name').innerText;
          let show = false;
          
          if (filter === 'All Repos') show = true;
          else if (filter === 'High Risk' && grade === 'C') show = true;
          else if (filter === 'Needs Audit' && (grade === 'B' || grade === 'C')) show = true;
          else if (filter === 'Favorites' && index === 0) show = true; // Just mock first repo as favorite
          
          card.style.display = show ? 'flex' : 'none';
        });
      });
    });
  }

  // Bind start audit buttons dynamically
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="start-audit"]');
    if (btn) startAuditSimulation();
    
    const githubBtn = e.target.closest('[data-action="github-auth"]');
    if (githubBtn) {
      githubBtn.innerHTML = '<span class="loading-ring" style="width: 20px; height: 20px; border-width: 2px;"></span> Connecting...';
      setTimeout(() => {
        document.querySelector('[data-navigate="dashboard"]').click();
      }, 1500);
    }
  });
}
