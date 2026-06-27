export function initUI() {
  // Navigation
  const navTriggers = document.querySelectorAll('[data-navigate]');
  const pages = document.querySelectorAll('.page');
  const mainNav = document.getElementById('main-nav');

  navTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-navigate');
      
      // Hide all pages
      pages.forEach(p => p.classList.remove('active'));
      
      // Show target page
      const targetPage = document.getElementById(targetId);
      if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
      }

      // Handle auth modes if navigating to auth
      if (targetId === 'auth') {
        const authMode = btn.getAttribute('data-auth-mode');
        if (authMode) {
          setAuthMode(authMode);
        }
      }
      
      // Toggle main nav visibility based on layout
      if (targetId === 'dashboard' || targetId === 'repos' || targetId === 'report') {
        if (mainNav) mainNav.style.display = 'none';
      } else {
        if (mainNav) mainNav.style.display = 'flex';
      }

      // Update sidebar active states if applicable
      if (targetPage && targetPage.classList.contains('dashboard-layout')) {
        document.querySelectorAll('.sidebar .nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll(`.sidebar .nav-item[data-navigate="${targetId}"]`).forEach(nav => nav.classList.add('active'));
      }
    });
  });

  // Auth toggle links inside the auth card
  document.querySelectorAll('.auth-toggle-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = link.getAttribute('data-auth-mode');
      if (mode) setAuthMode(mode);
    });
  });

  // Ripple Effect
  const rippleBtns = document.querySelectorAll('.ripple-btn');
  rippleBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const circle = document.createElement('span');
      circle.classList.add('ripple');
      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;
      
      // Calculate max distance to cover whole button
      const size = Math.max(rect.width, rect.height);
      circle.style.width = circle.style.height = `${size}px`;
      
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });

  // Magnetic Buttons
  const magneticItems = document.querySelectorAll('.magnetic');
  magneticItems.forEach(item => {
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Move slightly towards mouse
      item.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = '';
    });
  });

  // Tabs Logic
  const tabs = document.querySelectorAll('.audit-tab');
  const panels = document.querySelectorAll('.audit-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = `panel-${tab.getAttribute('data-tab')}`;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Expandable issue cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.issue-card');
    if (card) {
      card.classList.toggle('expanded');
      const hint = card.querySelector('.expand-hint');
      if (hint) {
        hint.textContent = card.classList.contains('expanded') ? 'Hide code snippet ↑' : 'View code snippet ↓';
      }
    }
  });
}

function setAuthMode(mode) {
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  const submitBtn = document.getElementById('auth-submit-btn');
  const footerText = document.getElementById('auth-footer-text');
  const nameWrap = document.getElementById('auth-name-wrap');
  const verifyWrap = document.getElementById('auth-verify-wrap');
  
  if (!title || !sub || !submitBtn || !footerText) return;

  if (mode === 'signup') {
    title.textContent = 'Create your account';
    sub.textContent = 'Start auditing your GitHub repositories for free. Read-only access - we never write to your repos.';
    submitBtn.textContent = 'Create Account';
    footerText.innerHTML = `Already have an account? <span class="text-link auth-toggle-link" data-auth-mode="signin">Sign In →</span>`;
    if (nameWrap) nameWrap.style.display = 'flex';
    if (verifyWrap) verifyWrap.style.display = 'flex';
  } else {
    title.textContent = 'Welcome back.';
    sub.textContent = 'Connect your GitHub account to start auditing your repositories. Read-only access - we never write to your repos.';
    submitBtn.textContent = 'Sign In';
    footerText.innerHTML = `Don't have an account? <span class="text-link auth-toggle-link" data-auth-mode="signup">Create one free →</span>`;
    if (nameWrap) nameWrap.style.display = 'none';
    if (verifyWrap) verifyWrap.style.display = 'none';
  }

  // Re-attach listener to the newly generated link
  const newLink = footerText.querySelector('.auth-toggle-link');
  if (newLink) {
    newLink.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode(newLink.getAttribute('data-auth-mode'));
    });
  }
}

// Toast System
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Loading Simulation
export function startAuditSimulation() {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  
  overlay.style.display = 'flex';
  const steps = overlay.querySelectorAll('.loading-step');
  
  let currentStep = 0;
  
  const interval = setInterval(() => {
    if (currentStep > 0) {
      steps[currentStep - 1].classList.remove('active');
      steps[currentStep - 1].classList.add('done');
    }
    
    if (currentStep < steps.length) {
      steps[currentStep].classList.add('active');
      currentStep++;
    } else {
      clearInterval(interval);
      overlay.style.display = 'none';
      steps.forEach(s => { s.classList.remove('active'); s.classList.remove('done'); });
      document.querySelector('[data-navigate="report"]').click();
      showToast('Audit completed successfully!', 'success');
    }
  }, 1000);
}
