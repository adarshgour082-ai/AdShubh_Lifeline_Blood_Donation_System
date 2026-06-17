/**
 * AdShubh Lifeline – Central Data Store
 * All statistics and UI state derive from persisted localStorage records.
 */
(() => {
  'use strict';

  const STORAGE_VERSION = 'lifeline_v1';
  const PREFIX = 'adshubh_lifeline_';

  const KEYS = {
    donors: PREFIX + 'donors',
    requests: PREFIX + 'requests',
    inventory: PREFIX + 'inventory',
    notifications: PREFIX + 'notifications',
    activity: PREFIX + 'activity',
    adminActions: PREFIX + 'admin_actions',
    settings: PREFIX + 'settings',
    version: PREFIX + 'version',
  };

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const VERIFICATION_STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'completed'];
  const INVENTORY_THRESHOLDS = { healthy: 15, low: 8 };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function defaultInventory() {
    const inv = {};
    BLOOD_GROUPS.forEach((bg) => {
      inv[bg] = { total: 0, available: 0, reserved: 0, donated: 0, used: 0 };
    });
    return inv;
  }

  function defaultSettings() {
    return {
      siteName: 'AdShubh Lifeline',
      emergencyContact: '+91 108',
      adminEmail: 'admin@adshubhlifeline.in',
      inventoryHealthy: INVENTORY_THRESHOLDS.healthy,
      inventoryLow: INVENTORY_THRESHOLDS.low,
      adminAuthenticated: false,
    };
  }

  function initStorage() {
    const version = localStorage.getItem(KEYS.version);
    if (version !== STORAGE_VERSION) {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(KEYS.version, STORAGE_VERSION);
    }
    if (!read(KEYS.inventory)) write(KEYS.inventory, defaultInventory());
    if (!read(KEYS.settings)) write(KEYS.settings, defaultSettings());
    if (!read(KEYS.donors)) write(KEYS.donors, []);
    if (!read(KEYS.requests)) write(KEYS.requests, []);
    if (!read(KEYS.notifications)) write(KEYS.notifications, []);
    if (!read(KEYS.activity)) write(KEYS.activity, []);
    if (!read(KEYS.adminActions)) write(KEYS.adminActions, []);
  }

  function getInventoryStatus(available) {
    const settings = getSettings();
    const low = settings.inventoryLow ?? INVENTORY_THRESHOLDS.low;
    const healthy = settings.inventoryHealthy ?? INVENTORY_THRESHOLDS.healthy;
    if (available <= low) return 'critical';
    if (available < healthy) return 'low';
    return 'healthy';
  }

  function recalculateInventory() {
    const donors = getDonors();
    const requests = getRequests();
    const inv = defaultInventory();

    donors.filter((d) => d.verificationStatus === 'approved').forEach((d) => {
      if (inv[d.bloodGroup]) {
        inv[d.bloodGroup].donated += 1;
        inv[d.bloodGroup].total += 1;
        if (d.availabilityStatus === 'available') {
          inv[d.bloodGroup].available += 1;
        }
      }
    });

    requests
      .filter((r) => r.verificationStatus === 'approved' || r.verificationStatus === 'completed')
      .forEach((r) => {
        const units = Number(r.unitsRequired) || 1;
        if (inv[r.bloodGroup]) {
          inv[r.bloodGroup].reserved += units;
          inv[r.bloodGroup].used += r.verificationStatus === 'completed' ? units : 0;
        }
      });

    BLOOD_GROUPS.forEach((bg) => {
      inv[bg].available = Math.max(0, inv[bg].total - inv[bg].reserved);
      inv[bg].status = getInventoryStatus(inv[bg].available);
    });

    write(KEYS.inventory, inv);
    return inv;
  }

  function addActivity(type, message, meta = {}) {
    const activity = read(KEYS.activity, []);
    activity.unshift({ id: uid(), type, message, timestamp: now(), meta });
    write(KEYS.activity, activity.slice(0, 200));
  }

  function addNotification(type, title, message, relatedId = null) {
    const notifications = read(KEYS.notifications, []);
    notifications.unshift({
      id: uid(),
      type,
      title,
      message,
      relatedId,
      read: false,
      createdAt: now(),
    });
    write(KEYS.notifications, notifications.slice(0, 100));
  }

  function logAdminAction(action, details = {}) {
    const actions = read(KEYS.adminActions, []);
    actions.unshift({ id: uid(), action, details, timestamp: now() });
    write(KEYS.adminActions, actions.slice(0, 300));
  }

  function getDonors() {
    return read(KEYS.donors, []);
  }

  function getDonor(id) {
    return getDonors().find((d) => d.id === id);
  }

  function saveDonors(donors) {
    write(KEYS.donors, donors);
    recalculateInventory();
  }

  function addDonor(data) {
    const donor = {
      id: uid(),
      fullName: data.fullName?.trim(),
      age: Number(data.age),
      gender: data.gender,
      mobile: data.mobile?.trim(),
      email: data.email?.trim(),
      bloodGroup: data.bloodGroup,
      city: data.city?.trim(),
      lastDonationDate: data.lastDonationDate || null,
      availabilityStatus: data.availabilityStatus || 'available',
      verificationStatus: 'submitted',
      statusHistory: [{ status: 'submitted', timestamp: now(), note: 'Registration submitted' }],
      createdAt: now(),
      updatedAt: now(),
    };

    const donors = getDonors();
    donors.unshift(donor);
    saveDonors(donors);

    addActivity('donor_registered', `New donor registered: ${donor.fullName} (${donor.bloodGroup})`, { donorId: donor.id });
    addNotification('registration', 'New Donor Registration', `${donor.fullName} registered as ${donor.bloodGroup} donor in ${donor.city}.`, donor.id);

    return donor;
  }

  function updateDonorStatus(id, status, note = '') {
    const donors = getDonors();
    const idx = donors.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    donors[idx].verificationStatus = status;
    donors[idx].updatedAt = now();
    donors[idx].statusHistory.push({ status, timestamp: now(), note });
    saveDonors(donors);

    const d = donors[idx];
    const messages = {
      under_review: `Donor under review: ${d.fullName}`,
      approved: `Donor approved: ${d.fullName}`,
      rejected: `Donor rejected: ${d.fullName}`,
    };
    if (messages[status]) {
      addActivity(`donor_${status}`, messages[status], { donorId: id });
      addNotification('approval', `Donor ${status.replace('_', ' ')}`, messages[status], id);
    }

    logAdminAction('donor_status_update', { donorId: id, status });
    return d;
  }

  function deleteDonor(id) {
    const donors = getDonors().filter((d) => d.id !== id);
    saveDonors(donors);
    addActivity('donor_deleted', 'A donor record was removed.', { donorId: id });
    logAdminAction('donor_delete', { donorId: id });
  }

  function getRequests() {
    return read(KEYS.requests, []);
  }

  function getRequest(id) {
    return getRequests().find((r) => r.id === id);
  }

  function saveRequests(requests) {
    write(KEYS.requests, requests);
    recalculateInventory();
  }

  function addRequest(data) {
    const request = {
      id: uid(),
      patientName: data.patientName?.trim(),
      bloodGroup: data.bloodGroup,
      unitsRequired: Number(data.unitsRequired) || 1,
      hospitalName: data.hospitalName?.trim(),
      location: data.location?.trim(),
      contactNumber: data.contactNumber?.trim(),
      emergencyLevel: data.emergencyLevel || 'normal',
      medicalProof: data.medicalProof?.trim() || '',
      verificationStatus: 'submitted',
      statusHistory: [{ status: 'submitted', timestamp: now(), note: 'Emergency request submitted' }],
      createdAt: now(),
      updatedAt: now(),
      completedAt: null,
    };

    const requests = getRequests();
    requests.unshift(request);
    saveRequests(requests);

    addActivity('request_submitted', `Blood request submitted for ${request.patientName} (${request.bloodGroup})`, { requestId: request.id });
    addNotification('emergency', 'Emergency Blood Request', `${request.patientName} needs ${request.unitsRequired} unit(s) of ${request.bloodGroup} at ${request.hospitalName}.`, request.id);

    return request;
  }

  function updateRequestStatus(id, status, note = '') {
    const requests = getRequests();
    const idx = requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    requests[idx].verificationStatus = status;
    requests[idx].updatedAt = now();
    requests[idx].statusHistory.push({ status, timestamp: now(), note });
    if (status === 'completed') requests[idx].completedAt = now();

    saveRequests(requests);
    const r = requests[idx];

    addActivity(`request_${status}`, `Request ${status}: ${r.patientName} (${r.bloodGroup})`, { requestId: id });
    addNotification('request', `Request ${status}`, `${r.patientName}'s request is now ${status}.`, id);

    if (status === 'completed') {
      addNotification('completion', 'Request Completed', `Blood request for ${r.patientName} has been fulfilled.`, id);
    }

    logAdminAction('request_status_update', { requestId: id, status });
    return r;
  }

  function deleteRequest(id) {
    const requests = getRequests().filter((r) => r.id !== id);
    saveRequests(requests);
    addActivity('request_deleted', 'A blood request was removed.', { requestId: id });
    logAdminAction('request_delete', { requestId: id });
  }

  function getInventory() {
    return recalculateInventory();
  }

  function getNotifications() {
    return read(KEYS.notifications, []);
  }

  function markNotificationRead(id) {
    const notifications = getNotifications();
    const n = notifications.find((x) => x.id === id);
    if (n) n.read = true;
    write(KEYS.notifications, notifications);
  }

  function markAllNotificationsRead() {
    const notifications = getNotifications().map((n) => ({ ...n, read: true }));
    write(KEYS.notifications, notifications);
  }

  function getActivity(limit = 20) {
    return read(KEYS.activity, []).slice(0, limit);
  }

  function getSettings() {
    return read(KEYS.settings, defaultSettings());
  }

  function saveSettings(settings) {
    write(KEYS.settings, { ...getSettings(), ...settings, updatedAt: now() });
    recalculateInventory();
  }

  function getStats() {
    const donors = getDonors();
    const requests = getRequests();
    const inventory = getInventory();

    const verifiedDonors = donors.filter((d) => d.verificationStatus === 'approved');
    const activeDonors = verifiedDonors.filter((d) => d.availabilityStatus === 'available');
    const pendingVerification =
      donors.filter((d) => ['submitted', 'under_review'].includes(d.verificationStatus)).length +
      requests.filter((r) => ['submitted', 'under_review'].includes(r.verificationStatus)).length;

    const activeRequests = requests.filter((r) => ['submitted', 'under_review', 'approved'].includes(r.verificationStatus));
    const emergencyRequests = requests.filter(
      (r) => r.emergencyLevel === 'critical' && r.verificationStatus !== 'completed' && r.verificationStatus !== 'rejected'
    );
    const completedRequests = requests.filter((r) => r.verificationStatus === 'completed');
    const successfulRequests = completedRequests.length;

    let availableBloodUnits = 0;
    BLOOD_GROUPS.forEach((bg) => {
      availableBloodUnits += inventory[bg]?.available || 0;
    });

    const totalDonations = verifiedDonors.length;
    const livesSaved = successfulRequests;

    return {
      totalDonors: donors.length,
      verifiedDonors: verifiedDonors.length,
      activeDonors: activeDonors.length,
      pendingVerification,
      activeRequests: activeRequests.length,
      emergencyRequests: emergencyRequests.length,
      availableBloodUnits,
      totalDonations,
      livesSaved,
      successfulRequests,
      totalRequests: requests.length,
    };
  }

  function searchDonors(filters = {}) {
    const { bloodGroup, city, availability } = filters;
    return getDonors().filter((d) => {
      if (d.verificationStatus !== 'approved') return false;
      if (bloodGroup && bloodGroup !== 'all' && d.bloodGroup !== bloodGroup) return false;
      if (city && city !== 'all' && d.city.toLowerCase() !== city.toLowerCase()) return false;
      if (availability && availability !== 'all' && d.availabilityStatus !== availability) return false;
      return true;
    });
  }

  function getCities() {
    const cities = new Set(getDonors().map((d) => d.city).filter(Boolean));
    return Array.from(cities).sort();
  }

  function exportAllData() {
    return {
      donors: getDonors(),
      requests: getRequests(),
      inventory: getInventory(),
      notifications: getNotifications(),
      activity: read(KEYS.activity, []),
      settings: getSettings(),
      exportedAt: now(),
    };
  }

  function clearAllData() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    initStorage();
  }

  initStorage();

  window.LifelineStore = {
    KEYS,
    BLOOD_GROUPS,
    VERIFICATION_STATUSES,
    getDonors,
    getDonor,
    addDonor,
    updateDonorStatus,
    deleteDonor,
    getRequests,
    getRequest,
    addRequest,
    updateRequestStatus,
    deleteRequest,
    getInventory,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getActivity,
    getSettings,
    saveSettings,
    getStats,
    searchDonors,
    getCities,
    exportAllData,
    clearAllData,
    getInventoryStatus,
    logAdminAction,
    recalculateInventory,
  };
})();
