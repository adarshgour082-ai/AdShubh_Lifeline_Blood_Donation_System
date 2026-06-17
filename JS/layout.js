/**
 * AdShubh Lifeline – Layout (Header, Footer, Admin Shell)
 */
(() => {
  'use strict';

  const LOGO_SVG = `<svg class="logo-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28C16 28 6 20.5 6 12.5C6 8.36 9.36 5 13.5 5C15.24 5 16.82 5.72 18 7C19.18 5.72 20.76 5 22.5 5C26.64 5 30 8.36 30 12.5C30 20.5 16 28 16 28Z" fill="#D32F2F"/>
    <path d="M16 24V10M12 14H20" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M10 8L8 6M22 8L24 6" stroke="#1565C0" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;

  const PUBLIC_NAV = [
    { href: 'index.html', label: 'Home', nav: 'home' },
    { href: 'find-blood.html', label: 'Find Blood', nav: 'find-blood' },
    { href: 'become-donor.html', label: 'Become Donor', nav: 'become-donor' },
    { href: 'emergency-request.html', label: 'Emergency Request', nav: 'emergency' },
    { href: 'blood-availability.html', label: 'Blood Availability', nav: 'availability' },
    { href: 'about.html', label: 'About Us', nav: 'about' },
    { href: 'contact.html', label: 'Contact Us', nav: 'contact' },
  ];

  const ADMIN_NAV = [
    { href: 'index.html', label: 'Dashboard', nav: 'dashboard', icon: 'grid' },
    { href: 'donors.html', label: 'Donor Management', nav: 'donors', icon: 'users' },
    { href: 'requests.html', label: 'Request Management', nav: 'requests', icon: 'clipboard' },
    { href: 'inventory.html', label: 'Blood Inventory', nav: 'inventory', icon: 'droplet' },
    { href: 'verification.html', label: 'Verification Center', nav: 'verification', icon: 'shield' },
    { href: 'analytics.html', label: 'Analytics', nav: 'analytics', icon: 'chart' },
    { href: 'reports.html', label: 'Reports', nav: 'reports', icon: 'file' },
    { href: 'settings.html', label: 'Settings', nav: 'settings', icon: 'gear' },
  ];

  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  };

  function renderPublicHeader() {
    const unread = LifelineStore.getNotifications().filter((n) => !n.read).length;
    return `
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="brand">
          ${LOGO_SVG}
          <span class="brand-text">
            <strong>AdShubh</strong>
            <small>Lifeline</small>
          </span>
        </a>
        <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="nav-menu">
          ${PUBLIC_NAV.map((item) => `<a href="${item.href}" data-nav="${item.nav}">${item.label}</a>`).join('')}
          <a href="admin/index.html" class="btn btn-outline btn-sm nav-admin">Admin</a>
        </nav>
      </div>
    </header>`;
  }

  function renderPublicFooter() {
    const settings = LifelineStore.getSettings();
    const year = new Date().getFullYear();
    return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="index.html" class="brand">
              ${LOGO_SVG}
              <span class="brand-text"><strong>AdShubh</strong><small>Lifeline</small></span>
            </a>
            <p>Smart Blood Donation & Emergency Response Platform connecting donors, recipients, hospitals, and volunteers through one trusted system.</p>
            <div class="footer-emergency">
              <strong>Emergency:</strong> ${LifelineUI.escapeHtml(settings.emergencyContact)}
            </div>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><a href="find-blood.html">Find Blood</a></li>
              <li><a href="become-donor.html">Become Donor</a></li>
              <li><a href="emergency-request.html">Emergency Request</a></li>
              <li><a href="blood-availability.html">Blood Availability</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="about.html">About Us</a></li>
              <li><a href="contact.html">Contact Us</a></li>
              <li><a href="privacy.html">Privacy Policy</a></li>
              <li><a href="terms.html">Terms of Use</a></li>
            </ul>
          </div>
          <div>
            <h4>Connect</h4>
            <div class="social-links">
              <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter">𝕏</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>
              <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${year} AdShubh Lifeline. All rights reserved.</span>
          <span class="text-muted">Last updated: ${LifelineUI.formatDateTime(new Date().toISOString())}</span>
        </div>
      </div>
    </footer>`;
  }

  function renderAdminShell(contentHtml, pageTitle) {
    const stats = LifelineStore.getStats();
    const unread = LifelineStore.getNotifications().filter((n) => !n.read).length;
    const prefix = '';

    return `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <a href="../index.html" class="brand admin-brand">
          ${LOGO_SVG}
          <span class="brand-text"><strong>AdShubh</strong><small>Lifeline Admin</small></span>
        </a>
        <nav class="admin-nav">
          ${ADMIN_NAV.map(
            (item) => `
            <a href="${item.href}" data-nav="${item.nav}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS[item.icon]}</svg>
              ${item.label}
            </a>`
          ).join('')}
        </nav>
        <a href="../index.html" class="admin-back">← Back to Website</a>
      </aside>
      <div class="admin-main">
        <header class="admin-topbar">
          <div style="display:flex;align-items:center">
            <button class="admin-menu-toggle" id="adminMenuToggle" aria-label="Toggle sidebar" style="display:none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <div>
            <h1 class="admin-page-title">${LifelineUI.escapeHtml(pageTitle)}</h1>
            <p class="admin-page-sub">Manage donors, requests, and inventory in real time</p>
            </div>
          </div>
          <div class="admin-topbar-actions">
            <div class="notification-bell" id="adminNotifications" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              ${unread ? `<span class="notif-count">${unread}</span>` : ''}
            </div>
            <div class="admin-stat-pill">
              <span class="text-muted">Pending</span>
              <strong>${stats.pendingVerification}</strong>
            </div>
          </div>
        </header>
        <main class="admin-content">${contentHtml}</main>
      </div>
    </div>
    <div id="notifPanel" class="notif-panel hidden"></div>`;
  }

  function injectLayout() {
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');
    const adminSlot = document.getElementById('admin-root');

    if (headerSlot) headerSlot.innerHTML = renderPublicHeader();
    if (footerSlot) footerSlot.innerHTML = renderPublicFooter();

    if (adminSlot) {
      const title = adminSlot.dataset.title || 'Dashboard';
      const content = adminSlot.innerHTML;
      adminSlot.outerHTML = renderAdminShell(content, title);
    }
  }

  function initAdminMobileNav() {
    const toggle = document.getElementById('adminMenuToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    if (!toggle || !sidebar) return;

    if (window.innerWidth <= 992) toggle.style.display = 'inline-flex';

    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  function initNotificationPanel() {
    const bell = document.getElementById('adminNotifications');
    const panel = document.getElementById('notifPanel');
    if (!bell || !panel) return;

    const render = () => {
      const notifications = LifelineStore.getNotifications().slice(0, 15);
      if (!notifications.length) {
        panel.innerHTML = '<div class="notif-panel-inner"><p class="text-muted p-3">No notifications yet.</p></div>';
        return;
      }
      panel.innerHTML = `
        <div class="notif-panel-inner">
          <div class="notif-panel-header">
            <strong>Notifications</strong>
            <button id="markAllRead" class="btn btn-ghost btn-sm">Mark all read</button>
          </div>
          <div class="notif-list">
            ${notifications
              .map(
                (n) => `
              <div class="notif-item ${n.read ? 'read' : ''}" data-id="${n.id}">
                <strong>${LifelineUI.escapeHtml(n.title)}</strong>
                <p>${LifelineUI.escapeHtml(n.message)}</p>
                <span class="notif-time">${LifelineUI.timeAgo(n.createdAt)}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>`;

      document.getElementById('markAllRead')?.addEventListener('click', () => {
        LifelineStore.markAllNotificationsRead();
        render();
        bell.querySelector('.notif-count')?.remove();
      });

      panel.querySelectorAll('.notif-item').forEach((item) => {
        item.addEventListener('click', () => {
          LifelineStore.markNotificationRead(item.dataset.id);
          item.classList.add('read');
        });
      });
    };

    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('hidden');
      render();
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !bell.contains(e.target)) {
        panel.classList.add('hidden');
      }
    });
  }

  window.LifelineLayout = {
    injectLayout,
    initNotificationPanel,
    initAdminMobileNav,
    LOGO_SVG,
  };
})();
