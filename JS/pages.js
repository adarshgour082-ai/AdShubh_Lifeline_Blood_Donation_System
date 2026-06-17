/**
 * AdShubh Lifeline – Page Controllers
 */
(() => {
  'use strict';

  const { escapeHtml, formatDate, formatDateTime, timeAgo, animateCounter, showToast, statusBadge, priorityBadge, verifiedBadge, inventoryStatusBadge, emptyState, encodeTel, validateMobile, validateEmail } = LifelineUI;

  // ─── HOME ───
  function initHome() {
    const stats = LifelineStore.getStats();
    const inventory = LifelineStore.getInventory();

    document.querySelectorAll('[data-stat]').forEach((el) => {
      const key = el.dataset.stat;
      const val = stats[key] ?? 0;
      animateCounter(el, val);
    });

    const previewGrid = document.getElementById('heroInventoryPreview');
    if (previewGrid) {
      previewGrid.innerHTML = LifelineStore.BLOOD_GROUPS.map((bg) => {
        const inv = inventory[bg];
        return `<div class="inventory-card inv-${inv.status}">
          <div class="blood-type">${bg}</div>
          <div class="units">${inv.available} units</div>
          ${inventoryStatusBadge(inv.status)}
        </div>`;
      }).join('');
    }

    const activityEl = document.getElementById('homeActivity');
    if (activityEl) {
      const activity = LifelineStore.getActivity(5);
      activityEl.innerHTML = activity.length
        ? activity.map((a) => `<div class="activity-item"><div class="activity-dot"></div><div><div class="activity-text">${escapeHtml(a.message)}</div><div class="activity-time">${timeAgo(a.timestamp)}</div></div></div>`).join('')
        : '<p class="text-muted">No activity yet. Register a donor to get started.</p>';
    }
  }

  // ─── FIND BLOOD ───
  function initFindBlood() {
    const bloodFilter = document.getElementById('filterBloodGroup');
    const cityFilter = document.getElementById('filterCity');
    const availFilter = document.getElementById('filterAvailability');
    const resultsEl = document.getElementById('searchResults');
    const countEl = document.getElementById('resultCount');

    function populateCities() {
      const cities = LifelineStore.getCities();
      if (!cityFilter) return;
      cityFilter.innerHTML = '<option value="all">All Cities</option>' + cities.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    function render() {
      const filters = {
        bloodGroup: bloodFilter?.value || 'all',
        city: cityFilter?.value || 'all',
        availability: availFilter?.value || 'all',
      };
      const results = LifelineStore.searchDonors(filters);

      if (countEl) countEl.textContent = `${results.length} donor${results.length !== 1 ? 's' : ''} found`;

      if (!results.length) {
        resultsEl.innerHTML = emptyState(
          'No donors found',
          'Try adjusting your filters or encourage someone to register as a donor.',
          '<a href="become-donor.html" class="btn btn-primary">Become Donor</a>'
        );
        return;
      }

      resultsEl.innerHTML = `<div class="donor-grid">${results
        .map(
          (d) => `
        <div class="card donor-card">
          <div class="donor-card-header">
            <div style="display:flex;gap:12px;align-items:center">
              <div class="donor-avatar">${escapeHtml(d.fullName.charAt(0))}</div>
              <div>
                <strong>${escapeHtml(d.fullName)}</strong>
                <div class="donor-meta">${escapeHtml(d.city)} · ${escapeHtml(d.gender)}</div>
              </div>
            </div>
            <span class="badge badge-approved">${escapeHtml(d.bloodGroup)}</span>
          </div>
          <div class="donor-badges">
            ${verifiedBadge('donor')}
            <span class="badge badge-${d.availabilityStatus === 'available' ? 'approved' : 'submitted'}">${d.availabilityStatus === 'available' ? 'Available' : d.availabilityStatus === 'on-call' ? 'On Call' : 'Unavailable'}</span>
          </div>
          <div class="donor-meta">Last donation: ${formatDate(d.lastDonationDate)} · Updated ${timeAgo(d.updatedAt)}</div>
          <div class="donor-actions">
            <a href="tel:${encodeTel(d.mobile)}" class="btn btn-primary btn-sm" style="flex:1">Contact</a>
          </div>
        </div>`
        )
        .join('')}</div>`;
    }

    populateCities();
    [bloodFilter, cityFilter, availFilter].forEach((el) => el?.addEventListener('change', render));
    render();
  }

  // ─── BECOME DONOR (multi-step) ───
  function initBecomeDonor() {
    const form = document.getElementById('donorForm');
    if (!form) return;

    let currentStep = 1;
    const totalSteps = 3;
    const formContainer = document.getElementById('formSteps');
    const successScreen = document.getElementById('donorSuccess');

    function showStep(n) {
      currentStep = n;
      formContainer.querySelectorAll('.form-step').forEach((s, i) => s.classList.toggle('active', i + 1 === n));
      document.querySelectorAll('.step-item').forEach((s, i) => {
        s.classList.toggle('active', i + 1 === n);
        s.classList.toggle('done', i + 1 < n);
      });
      document.getElementById('prevStep').style.visibility = n === 1 ? 'hidden' : 'visible';
      document.getElementById('nextStep').textContent = n === totalSteps ? 'Submit Registration' : 'Continue';
    }

    function validateStep(n) {
      const step = formContainer.querySelector(`.form-step[data-step="${n}"]`);
      let valid = true;
      step.querySelectorAll('[required]').forEach((field) => {
        const group = field.closest('.form-group');
        group?.classList.remove('invalid');
        if (!field.value.trim()) {
          group?.classList.add('invalid');
          valid = false;
        }
      });

      if (n === 1) {
        const mobile = document.getElementById('donorMobile');
        const email = document.getElementById('donorEmail');
        if (mobile && !validateMobile(mobile.value)) {
          mobile.closest('.form-group')?.classList.add('invalid');
          valid = false;
        }
        if (email && email.value && !validateEmail(email.value)) {
          email.closest('.form-group')?.classList.add('invalid');
          valid = false;
        }
      }
      return valid;
    }

    document.getElementById('nextStep')?.addEventListener('click', () => {
      if (!validateStep(currentStep)) {
        showToast('Please fill in all required fields correctly.', 'error');
        return;
      }
      if (currentStep < totalSteps) {
        showStep(currentStep + 1);
      } else {
        submitDonor();
      }
    });

    document.getElementById('prevStep')?.addEventListener('click', () => {
      if (currentStep > 1) showStep(currentStep - 1);
    });

    function submitDonor() {
      const data = {
        fullName: document.getElementById('donorName').value,
        age: document.getElementById('donorAge').value,
        gender: document.getElementById('donorGender').value,
        mobile: document.getElementById('donorMobile').value,
        email: document.getElementById('donorEmail').value,
        bloodGroup: document.getElementById('donorBloodGroup').value,
        city: document.getElementById('donorCity').value,
        lastDonationDate: document.getElementById('donorLastDonation').value || null,
        availabilityStatus: document.getElementById('donorAvailability').value,
      };

      LifelineStore.addDonor(data);
      form.classList.add('hidden');
      document.querySelector('.steps-indicator')?.classList.add('hidden');
      document.querySelector('.form-nav')?.classList.add('hidden');
      successScreen?.classList.remove('hidden');
      showToast('Registration submitted successfully!', 'success');
    }

    showStep(1);
  }

  // ─── EMERGENCY REQUEST ───
  function initEmergencyRequest() {
    const form = document.getElementById('emergencyForm');
    if (!form) return;

    const levelSelect = document.getElementById('emergencyLevel');
    const levelPreview = document.getElementById('levelPreview');

    levelSelect?.addEventListener('change', () => {
      if (levelPreview) levelPreview.innerHTML = priorityBadge(levelSelect.value);
    });
    if (levelPreview && levelSelect) levelPreview.innerHTML = priorityBadge(levelSelect.value);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach((field) => {
        const group = field.closest('.form-group');
        group?.classList.remove('invalid');
        if (!field.value.trim()) {
          group?.classList.add('invalid');
          valid = false;
        }
      });

      const phone = document.getElementById('requestContact');
      if (phone && !validateMobile(phone.value)) {
        phone.closest('.form-group')?.classList.add('invalid');
        valid = false;
      }

      if (!valid) {
        showToast('Please complete all required fields.', 'error');
        return;
      }

      LifelineStore.addRequest({
        patientName: document.getElementById('patientName').value,
        bloodGroup: document.getElementById('requestBloodGroup').value,
        unitsRequired: document.getElementById('unitsRequired').value,
        hospitalName: document.getElementById('hospitalName').value,
        location: document.getElementById('requestLocation').value,
        contactNumber: document.getElementById('requestContact').value,
        emergencyLevel: document.getElementById('emergencyLevel').value,
        medicalProof: document.getElementById('medicalProof').value,
      });

      form.classList.add('hidden');
      document.getElementById('requestSuccess')?.classList.remove('hidden');
      showToast('Emergency request submitted. Awaiting admin verification.', 'success');
    });
  }

  // ─── BLOOD AVAILABILITY ───
  function initBloodAvailability() {
    const grid = document.getElementById('availabilityGrid');
    if (!grid) return;

    function render() {
      const inventory = LifelineStore.getInventory();
      grid.innerHTML = LifelineStore.BLOOD_GROUPS.map((bg) => {
        const inv = inventory[bg];
        return `<div class="inventory-card inv-${inv.status}">
          <div class="blood-type">${bg}</div>
          <div class="units">${inv.available} of ${inv.total} units available</div>
          ${inventoryStatusBadge(inv.status)}
          <div class="donor-meta" style="margin-top:8px">Reserved: ${inv.reserved} · Used: ${inv.used}</div>
        </div>`;
      }).join('');
    }
    render();
  }

  // ─── CONTACT FORM ───
  function initContact() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Message sent successfully. We will respond within 24 hours.', 'success');
      form.reset();
    });
  }

  // ─── ADMIN: DASHBOARD ───
  function initAdminDashboard() {
    const stats = LifelineStore.getStats();
    document.querySelectorAll('[data-stat]').forEach((el) => {
      animateCounter(el, stats[el.dataset.stat] ?? 0);
    });

    const activityEl = document.getElementById('adminActivity');
    if (activityEl) {
      const activity = LifelineStore.getActivity(10);
      activityEl.innerHTML = activity.length
        ? activity.map((a) => `<div class="activity-item"><div class="activity-dot"></div><div><div class="activity-text">${escapeHtml(a.message)}</div><div class="activity-time">${timeAgo(a.timestamp)}</div></div></div>`).join('')
        : '<p class="text-muted">No activity yet.</p>';
    }

    renderInventoryChart();
    renderAlerts();
  }

  function renderInventoryChart() {
    const chart = document.getElementById('inventoryChart');
    if (!chart) return;
    const inventory = LifelineStore.getInventory();
    const max = Math.max(1, ...LifelineStore.BLOOD_GROUPS.map((bg) => inventory[bg].available));

    chart.innerHTML = LifelineStore.BLOOD_GROUPS.map((bg) => {
      const val = inventory[bg].available;
      const pct = (val / max) * 100;
      return `<div class="chart-bar-group">
        <div class="chart-bar-value">${val}</div>
        <div class="chart-bar" style="height:${Math.max(pct, 4)}%"></div>
        <div class="chart-bar-label">${bg}</div>
      </div>`;
    }).join('');
  }

  function renderAlerts() {
    const alertsEl = document.getElementById('inventoryAlerts');
    if (!alertsEl) return;
    const inventory = LifelineStore.getInventory();
    const alerts = LifelineStore.BLOOD_GROUPS.filter((bg) => inventory[bg].status !== 'healthy').map((bg) => ({
      bg,
      status: inventory[bg].status,
      available: inventory[bg].available,
    }));

    alertsEl.innerHTML = alerts.length
      ? alerts.map((a) => `<div class="activity-item"><div class="activity-dot" style="background:var(--${a.status === 'critical' ? 'critical' : 'warning'})"></div><div><div class="activity-text"><strong>${a.bg}</strong> — ${a.available} units (${a.status})</div></div></div>`).join('')
      : '<p class="text-muted">All blood groups are at healthy levels.</p>';
  }

  // ─── ADMIN: DONORS ───
  function initAdminDonors() {
    const tableBody = document.getElementById('donorsTableBody');
    if (!tableBody) return;

    function render() {
      const donors = LifelineStore.getDonors();
      if (!donors.length) {
        tableBody.innerHTML = `<tr><td colspan="8">${emptyState('No donors registered', 'Donors will appear here once they register.', '<a href="../become-donor.html" class="btn btn-primary btn-sm">View Registration Page</a>')}</td></tr>`;
        return;
      }

      tableBody.innerHTML = donors
        .map(
          (d) => `
        <tr>
          <td><strong>${escapeHtml(d.fullName)}</strong></td>
          <td>${escapeHtml(d.bloodGroup)}</td>
          <td>${escapeHtml(d.city)}</td>
          <td>${escapeHtml(d.mobile)}</td>
          <td>${d.availabilityStatus}</td>
          <td>${statusBadge(d.verificationStatus)}</td>
          <td>${timeAgo(d.updatedAt)}</td>
          <td class="table-actions">
            ${d.verificationStatus === 'submitted' ? `<button class="btn btn-accent btn-sm" data-action="review" data-id="${d.id}">Review</button>` : ''}
            ${d.verificationStatus === 'under_review' ? `<button class="btn btn-success btn-sm" data-action="approve" data-id="${d.id}">Approve</button><button class="btn btn-danger btn-sm" data-action="reject" data-id="${d.id}">Reject</button>` : ''}
            ${d.verificationStatus === 'approved' ? verifiedBadge('donor') : ''}
            <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${d.id}">Delete</button>
          </td>
        </tr>`
        )
        .join('');
    }

    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'review') LifelineStore.updateDonorStatus(id, 'under_review', 'Moved to review');
      if (action === 'approve') LifelineStore.updateDonorStatus(id, 'approved', 'Donor verified and approved');
      if (action === 'reject') LifelineStore.updateDonorStatus(id, 'rejected', 'Registration rejected');
      if (action === 'delete' && confirm('Delete this donor record?')) LifelineStore.deleteDonor(id);
      render();
      showToast('Donor record updated.', 'success');
    });

    render();
  }

  // ─── ADMIN: REQUESTS ───
  function initAdminRequests() {
    const tableBody = document.getElementById('requestsTableBody');
    if (!tableBody) return;

    function render() {
      const requests = LifelineStore.getRequests();
      if (!requests.length) {
        tableBody.innerHTML = `<tr><td colspan="8">${emptyState('No emergency requests', 'Requests will appear here when submitted.', '<a href="../emergency-request.html" class="btn btn-primary btn-sm">View Request Form</a>')}</td></tr>`;
        return;
      }

      tableBody.innerHTML = requests
        .map(
          (r) => `
        <tr>
          <td><strong>${escapeHtml(r.patientName)}</strong></td>
          <td>${escapeHtml(r.bloodGroup)}</td>
          <td>${r.unitsRequired}</td>
          <td>${escapeHtml(r.hospitalName)}</td>
          <td>${priorityBadge(r.emergencyLevel)}</td>
          <td>${statusBadge(r.verificationStatus)}</td>
          <td>${timeAgo(r.createdAt)}</td>
          <td class="table-actions">
            ${r.verificationStatus === 'submitted' ? `<button class="btn btn-accent btn-sm" data-action="review" data-id="${r.id}">Review</button>` : ''}
            ${r.verificationStatus === 'under_review' ? `<button class="btn btn-success btn-sm" data-action="approve" data-id="${r.id}">Approve</button><button class="btn btn-danger btn-sm" data-action="reject" data-id="${r.id}">Reject</button>` : ''}
            ${r.verificationStatus === 'approved' ? `<button class="btn btn-primary btn-sm" data-action="complete" data-id="${r.id}">Complete</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${r.id}">Delete</button>
          </td>
        </tr>`
        )
        .join('');
    }

    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'review') LifelineStore.updateRequestStatus(id, 'under_review', 'Under admin review');
      if (action === 'approve') LifelineStore.updateRequestStatus(id, 'approved', 'Request approved');
      if (action === 'reject') LifelineStore.updateRequestStatus(id, 'rejected', 'Request rejected');
      if (action === 'complete') LifelineStore.updateRequestStatus(id, 'completed', 'Blood request fulfilled');
      if (action === 'delete' && confirm('Delete this request?')) LifelineStore.deleteRequest(id);
      render();
      showToast('Request updated.', 'success');
    });

    render();
  }

  // ─── ADMIN: INVENTORY ───
  function initAdminInventory() {
    const grid = document.getElementById('adminInventoryGrid');
    if (!grid) return;

    function render() {
      const inventory = LifelineStore.getInventory();
      grid.innerHTML = LifelineStore.BLOOD_GROUPS.map((bg) => {
        const inv = inventory[bg];
        return `<div class="card inventory-card inv-${inv.status}">
          <div class="blood-type">${bg}</div>
          <div class="units">${inv.available} available / ${inv.total} total</div>
          ${inventoryStatusBadge(inv.status)}
          <div class="donor-meta" style="margin-top:12px">
            Donated: ${inv.donated} · Reserved: ${inv.reserved} · Used: ${inv.used}
          </div>
        </div>`;
      }).join('');
    }
    render();
  }

  // ─── ADMIN: VERIFICATION ───
  function initAdminVerification() {
    const container = document.getElementById('verificationQueue');
    if (!container) return;

    function render() {
      const pendingDonors = LifelineStore.getDonors().filter((d) => ['submitted', 'under_review'].includes(d.verificationStatus));
      const pendingRequests = LifelineStore.getRequests().filter((r) => ['submitted', 'under_review'].includes(r.verificationStatus));

      if (!pendingDonors.length && !pendingRequests.length) {
        container.innerHTML = emptyState('Verification queue is clear', 'All donors and requests have been processed.');
        return;
      }

      let html = '';
      pendingDonors.forEach((d) => {
        html += `<div class="card" style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
            <div><span class="badge badge-submitted">Donor</span> <strong>${escapeHtml(d.fullName)}</strong> — ${escapeHtml(d.bloodGroup)} · ${escapeHtml(d.city)}</div>
            ${statusBadge(d.verificationStatus)}
          </div>
          ${LifelineUI.renderTimeline(d.statusHistory)}
          <div class="table-actions" style="margin-top:12px">
            ${d.verificationStatus === 'submitted' ? `<button class="btn btn-accent btn-sm" onclick="LifelineStore.updateDonorStatus('${d.id}','under_review','Review started');location.reload()">Start Review</button>` : ''}
            ${d.verificationStatus === 'under_review' ? `<button class="btn btn-success btn-sm" onclick="LifelineStore.updateDonorStatus('${d.id}','approved','Approved');location.reload()">Approve</button><button class="btn btn-danger btn-sm" onclick="LifelineStore.updateDonorStatus('${d.id}','rejected','Rejected');location.reload()">Reject</button>` : ''}
          </div>
        </div>`;
      });

      pendingRequests.forEach((r) => {
        html += `<div class="card" style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
            <div><span class="badge badge-submitted">Request</span> <strong>${escapeHtml(r.patientName)}</strong> — ${escapeHtml(r.bloodGroup)} × ${r.unitsRequired} · ${escapeHtml(r.hospitalName)}</div>
            <div>${priorityBadge(r.emergencyLevel)} ${statusBadge(r.verificationStatus)}</div>
          </div>
          ${LifelineUI.renderTimeline(r.statusHistory)}
          <div class="table-actions" style="margin-top:12px">
            ${r.verificationStatus === 'submitted' ? `<button class="btn btn-accent btn-sm" onclick="LifelineStore.updateRequestStatus('${r.id}','under_review','Review started');location.reload()">Start Review</button>` : ''}
            ${r.verificationStatus === 'under_review' ? `<button class="btn btn-success btn-sm" onclick="LifelineStore.updateRequestStatus('${r.id}','approved','Approved');location.reload()">Approve</button><button class="btn btn-danger btn-sm" onclick="LifelineStore.updateRequestStatus('${r.id}','rejected','Rejected');location.reload()">Reject</button>` : ''}
          </div>
        </div>`;
      });

      container.innerHTML = html;
    }
    render();
  }

  // ─── ADMIN: ANALYTICS ───
  function initAdminAnalytics() {
    const stats = LifelineStore.getStats();
    const donors = LifelineStore.getDonors();
    const requests = LifelineStore.getRequests();

    document.querySelectorAll('[data-stat]').forEach((el) => animateCounter(el, stats[el.dataset.stat] ?? 0));

    const bgChart = document.getElementById('bloodGroupChart');
    if (bgChart) {
      const counts = {};
      LifelineStore.BLOOD_GROUPS.forEach((bg) => (counts[bg] = 0));
      donors.filter((d) => d.verificationStatus === 'approved').forEach((d) => counts[d.bloodGroup]++);
      const max = Math.max(1, ...Object.values(counts));
      bgChart.innerHTML = LifelineStore.BLOOD_GROUPS.map((bg) => {
        const val = counts[bg];
        return `<div class="chart-bar-group"><div class="chart-bar-value">${val}</div><div class="chart-bar" style="height:${(val / max) * 100}%"></div><div class="chart-bar-label">${bg}</div></div>`;
      }).join('');
    }

    const statusChart = document.getElementById('requestStatusChart');
    if (statusChart) {
      const statuses = ['submitted', 'under_review', 'approved', 'completed', 'rejected'];
      const counts = statuses.map((s) => requests.filter((r) => r.verificationStatus === s).length);
      const max = Math.max(1, ...counts);
      statusChart.innerHTML = statuses
        .map(
          (s, i) =>
            `<div class="chart-bar-group"><div class="chart-bar-value">${counts[i]}</div><div class="chart-bar" style="height:${(counts[i] / max) * 100}%;background:var(--accent)"></div><div class="chart-bar-label">${s.replace('_', ' ')}</div></div>`
        )
        .join('');
    }
  }

  // ─── ADMIN: REPORTS ───
  function initAdminReports() {
    document.getElementById('exportData')?.addEventListener('click', () => {
      const data = LifelineStore.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `adshubh-lifeline-report-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      showToast('Report exported successfully.', 'success');
    });

    const summary = document.getElementById('reportSummary');
    if (summary) {
      const stats = LifelineStore.getStats();
      summary.innerHTML = `
        <div class="stat-grid">
          ${Object.entries({ 'Total Donors': stats.totalDonors, 'Verified Donors': stats.verifiedDonors, 'Active Requests': stats.activeRequests, 'Lives Saved': stats.livesSaved, 'Blood Units': stats.availableBloodUnits })
            .map(([label, val]) => `<div class="stat-card"><div class="stat-value">${val}</div><div class="stat-label">${label}</div></div>`)
            .join('')}
        </div>`;
    }
  }

  // ─── ADMIN: SETTINGS ───
  function initAdminSettings() {
    const form = document.getElementById('settingsForm');
    if (!form) return;

    const settings = LifelineStore.getSettings();
    document.getElementById('settingSiteName').value = settings.siteName;
    document.getElementById('settingEmergency').value = settings.emergencyContact;
    document.getElementById('settingEmail').value = settings.adminEmail;
    document.getElementById('settingHealthy').value = settings.inventoryHealthy;
    document.getElementById('settingLow').value = settings.inventoryLow;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      LifelineStore.saveSettings({
        siteName: document.getElementById('settingSiteName').value,
        emergencyContact: document.getElementById('settingEmergency').value,
        adminEmail: document.getElementById('settingEmail').value,
        inventoryHealthy: Number(document.getElementById('settingHealthy').value),
        inventoryLow: Number(document.getElementById('settingLow').value),
      });
      showToast('Settings saved successfully.', 'success');
    });

    document.getElementById('clearData')?.addEventListener('click', () => {
      if (confirm('This will permanently delete all platform data. Continue?')) {
        LifelineStore.clearAllData();
        showToast('All data cleared.', 'warning');
        setTimeout(() => location.reload(), 1000);
      }
    });
  }

  // ─── Boot ───
  const PAGE_INIT = {
    home: initHome,
    'find-blood': initFindBlood,
    'become-donor': initBecomeDonor,
    emergency: initEmergencyRequest,
    availability: initBloodAvailability,
    contact: initContact,
    dashboard: initAdminDashboard,
    donors: initAdminDonors,
    requests: initAdminRequests,
    inventory: initAdminInventory,
    verification: initAdminVerification,
    analytics: initAdminAnalytics,
    reports: initAdminReports,
    settings: initAdminSettings,
  };

  document.addEventListener('DOMContentLoaded', () => {
    LifelineLayout.injectLayout();
    LifelineUI.initMobileNav();
    LifelineUI.setActiveNav();
    LifelineUI.initReveal();
    LifelineLayout.initNotificationPanel();
    LifelineLayout.initAdminMobileNav();

    const page = document.body.dataset.page;
    PAGE_INIT[page]?.();
  });
})();
