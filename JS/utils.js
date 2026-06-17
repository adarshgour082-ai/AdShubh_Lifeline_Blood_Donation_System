/**
 * AdShubh Lifeline – Shared UI Utilities
 */
(() => {
  'use strict';

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function formatNumber(n) {
    try {
      return new Intl.NumberFormat('en-IN').format(n);
    } catch {
      return String(n);
    }
  }

  function animateCounter(el, target, duration = 900) {
    if (!el) return;
    const from = 0;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = formatNumber(Math.round(from + (target - from) * ease(t)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function showToast(message, type = 'success') {
    let host = document.getElementById('toastHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toastHost';
      host.className = 'toast-host';
      document.body.appendChild(host);
    }

    const icons = {
      success: '✓',
      error: '!',
      warning: '⚠',
      info: 'i',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const remove = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 4000);
  }

  function statusBadge(status) {
    const labels = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    };
    const cls = status.replace('_', '-');
    return `<span class="badge badge-status badge-${cls}">${labels[status] || status}</span>`;
  }

  function priorityBadge(level) {
    const labels = { critical: 'Critical', high: 'High', normal: 'Normal' };
    return `<span class="badge badge-priority badge-${level}">${labels[level] || level}</span>`;
  }

  function verifiedBadge(type = 'donor') {
    const labels = {
      donor: 'Verified Donor',
      request: 'Verified Request',
      hospital: 'Verified Hospital',
      admin: 'Admin Approved',
    };
    return `<span class="badge badge-verified"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>${labels[type]}</span>`;
  }

  function inventoryStatusBadge(status) {
    const labels = { healthy: 'Healthy', low: 'Low Stock', critical: 'Critical' };
    return `<span class="badge badge-inventory badge-inv-${status}">${labels[status]}</span>`;
  }

  function renderTimeline(history = []) {
    if (!history.length) return '<p class="text-muted">No status history.</p>';
    return `<div class="timeline">${history
      .slice()
      .reverse()
      .map(
        (h) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          ${statusBadge(h.status)}
          <span class="timeline-time">${formatDateTime(h.timestamp)}</span>
          ${h.note ? `<p class="timeline-note">${escapeHtml(h.note)}</p>` : ''}
        </div>
      </div>`
      )
      .join('')}</div>`;
  }

  function emptyState(title, description, actionHtml = '') {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
        ${actionHtml ? `<div class="empty-actions">${actionHtml}</div>` : ''}
      </div>`;
  }

  function encodeTel(phone) {
    return String(phone ?? '').replace(/[^\d+]/g, '');
  }

  function validateMobile(mobile) {
    return /^(\+91[\s-]?)?[6-9]\d{9}$/.test(String(mobile).replace(/\s/g, ''));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function initReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    nodes.forEach((n) => io.observe(n));
  }

  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav-menu');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    document.querySelectorAll('.nav-menu a[data-nav]').forEach((a) => {
      a.classList.toggle('active', a.dataset.nav === page);
    });
    document.querySelectorAll('.admin-nav a[data-nav]').forEach((a) => {
      a.classList.toggle('active', a.dataset.nav === page);
    });
  }

  window.LifelineUI = {
    escapeHtml,
    formatDate,
    formatDateTime,
    timeAgo,
    formatNumber,
    animateCounter,
    showToast,
    statusBadge,
    priorityBadge,
    verifiedBadge,
    inventoryStatusBadge,
    renderTimeline,
    emptyState,
    encodeTel,
    validateMobile,
    validateEmail,
    initReveal,
    initMobileNav,
    setActiveNav,
  };
})();
