// app.js - Application Logic (Regular Script, defer)

// SVG Icon Helper Functions
const SVGIcons = {
  send: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
  envelope: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>',
  save: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  clipboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
  user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>',
  building: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  gear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m5.08 0l4.24 4.24"/></svg>',
  clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
};

// Database wrapper
if (!window.DB) window.DB = { schools: [], tickets: [], admin: { username: 'admin', passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' } };

function showLoadingOverlay(show) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.toggle('hidden', !show);
}

function showDBError() {
  const el = document.getElementById('dbErrorBanner');
  if (el) el.classList.remove('hidden');
}

function loadDB() { return window.DB; }

function normalizeSchoolId(value) {
  return String(value ?? '').trim();
}

function getTicketSchoolId(ticket) {
  if (!ticket) return '';
  return normalizeSchoolId(ticket.schoolId || ticket.schoolID || ticket.npsn || ticket.schoolNpsn);
}

function isTicketForSchool(ticket, schoolId) {
  return getTicketSchoolId(ticket) === normalizeSchoolId(schoolId);
}

function resolveTicketProgressData(ticket) {
  const t = ticket || {};
  const processNotes = t.processNotes || t.notes || '';
  const completeNotes = t.completeNotes
    || t.resolutionNotes
    || t.finalNotes
    || (t.status === 'Selesai' ? (t.notes || t.processNotes || '') : '');
  const hasProcessPhotos = Array.isArray(t.processPhotos) && t.processPhotos.length > 0;
  const hasCompletePhotos = Array.isArray(t.completePhotos) && t.completePhotos.length > 0;
  const hasLegacyFollowUpPhotos = Array.isArray(t.followUpPhotos) && t.followUpPhotos.length > 0;

  const processPhotos = hasProcessPhotos
    ? t.processPhotos
    : ((!hasCompletePhotos && t.status !== 'Selesai' && hasLegacyFollowUpPhotos) ? t.followUpPhotos : []);

  const completePhotos = hasCompletePhotos
    ? t.completePhotos
    : ((t.status === 'Selesai' && hasLegacyFollowUpPhotos) ? t.followUpPhotos : []);

  return { processNotes, completeNotes, processPhotos, completePhotos };
}

async function saveDB(db) {
  window.DB = db;
}

async function initDB() {
  return window.DB;
}

let currentUser = null;
window.currentUser = currentUser;
let schoolTicketFilter = 'all';
let adminTicketFilter = 'all';
let captchaA = 0, captchaB = 0;
let captchaVerified = false;
let resetTargetNPSN = '';
let photoFiles = [];
let followUpPhotoFiles = [];

// ====================== SECURITY: Session Timeout ======================
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
let sessionTimeoutId = null;

// ====================== SECURITY: Login Attempt Limiter ======================
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes
const LOGIN_ATTEMPTS_KEY = 'SiLaporLoginAttempts';

// ====================== SECURITY: Activity Log ======================
const ACTIVITY_LOG_KEY = 'SiLaporActivityLog';
const MAX_LOG_ENTRIES = 100;

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isLegacyHash(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
}

async function verifyPassword(plain, record) {
  if (!record) return false;
  if (record.passwordHash && isLegacyHash(record.passwordHash)) {
    return await hashPassword(plain) === record.passwordHash;
  }
  if (record.password && record.password === plain) {
    return true;
  }
  return false;
}

async function migrateSchoolPasswordHash(school) {
  if (!school || !school.id) return;
  if (school.password && !school.passwordHash) {
    const newHash = await hashPassword(school.password);
    school.passwordHash = newHash;
    if (window.fbUpdateSchool) await window.fbUpdateSchool(school.id, { passwordHash: newHash });
  }
}

async function migrateAdminPasswordHash(admin) {
  if (!admin) return;
  if (admin.password && !admin.passwordHash) {
    const newHash = await hashPassword(admin.password);
    admin.passwordHash = newHash;
    if (window.fbSaveAdmin) await window.fbSaveAdmin({ username: admin.username, passwordHash: newHash });
  }
}

function saveSessionUser(user) {
  try {
    sessionStorage.setItem('SiLaporUser', JSON.stringify(user));
    initSessionTimeout();
  } catch (e) {
    console.warn('Cannot save session user', e);
  }
}

function clearSessionUser() {
  try {
    sessionStorage.removeItem('SiLaporUser');
    clearSessionTimeout();
  } catch (e) {
    console.warn('Cannot clear session user', e);
  }
}

function loadSessionUser() {
  try {
    const raw = sessionStorage.getItem('SiLaporUser');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function _getInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function applySchoolState(school) {
  if (!school) return;
  currentUser = { type: 'school', school };
  window.currentUser = currentUser;

  document.getElementById('sidebarPublicNav').classList.add('hidden');
  document.getElementById('sidebarSchoolNav').classList.remove('hidden');
  document.getElementById('sidebarAdminNav').classList.add('hidden');

  const initials = _getInitials(school.name);
  document.getElementById('sidebarUserAvatar').textContent = initials;
  document.getElementById('sidebarUserName').textContent = school.name;
  document.getElementById('sidebarUserRole').textContent = 'NPSN: ' + school.id;
  document.getElementById('sidebarUser').classList.remove('hidden');
  document.getElementById('sidebarActions').classList.remove('hidden');
  document.getElementById('sidebarBtnChangePass').style.display = 'none';
  document.getElementById('sidebarBtnSchoolChangePass').style.display = '';

  document.getElementById('topbarUserAvatar').textContent = initials;
  document.getElementById('topbarUser').classList.remove('hidden');

  document.getElementById('schoolDashName').textContent = school.name;
  document.getElementById('schoolDashNPSN').textContent = 'NPSN: ' + school.id;
  if (school.firstLogin) {
    document.getElementById('firstLoginBanner').classList.remove('hidden');
  } else {
    document.getElementById('firstLoginBanner').classList.add('hidden');
  }
  schoolTicketFilter = 'all';
  renderSchoolTickets();
  updateSchoolStats();
  showPage('school-dash');
  if (window.fbLoadTicketsPage) window.fbLoadTicketsPage({ context: 'school', schoolId: school.id, reset: true });
  if (window.fbStartRealtimeForContext) window.fbStartRealtimeForContext({ context: 'school', schoolId: school.id });
}

function applyAdminState() {
  currentUser = { type: 'admin' };
  window.currentUser = currentUser;

  document.getElementById('sidebarPublicNav').classList.add('hidden');
  document.getElementById('sidebarSchoolNav').classList.add('hidden');
  document.getElementById('sidebarAdminNav').classList.remove('hidden');

  document.getElementById('sidebarUserAvatar').textContent = 'AD';
  document.getElementById('sidebarUserName').textContent = 'Administrator';
  document.getElementById('sidebarUserRole').textContent = 'Akses Penuh';
  document.getElementById('sidebarUser').classList.remove('hidden');
  document.getElementById('sidebarActions').classList.remove('hidden');
  document.getElementById('sidebarBtnChangePass').style.display = '';
  document.getElementById('sidebarBtnSchoolChangePass').style.display = 'none';

  document.getElementById('topbarUserAvatar').textContent = 'AD';
  document.getElementById('topbarUser').classList.remove('hidden');

  showPage('admin-dash');
  updateAdminStats();
  renderAdminRecent();
  if (window.fbLoadTicketsPage) window.fbLoadTicketsPage({ context: 'admin', reset: true });
  if (window.fbStartRealtimeForContext) window.fbStartRealtimeForContext({ context: 'admin' });
}

function restoreLoginState() {
  const session = loadSessionUser();
  if (!session) {
    showPage('reporter');
    return;
  }
  const DB = loadDB();
  if (session.type === 'school') {
    const school = DB.schools.find(s => s.id === session.schoolId);
    if (school) {
      applySchoolState(school);
      recordActivity('SESSION_RESTORE', `School: ${school.name} (${school.id})`);
      initSessionTimeout();
      return;
    }
  }
  if (session.type === 'admin') {
    if (DB.admin && DB.admin.username === session.username) {
      applyAdminState();
      recordActivity('SESSION_RESTORE', `Admin: ${DB.admin.username}`);
      initSessionTimeout();
      return;
    }
  }
  clearSessionUser();
  showPage('reporter');
}

// ====================== SECURITY: Session Timeout Functions ======================
function initSessionTimeout() {
  clearSessionTimeout();
  // Auto-logout after inactivity
  sessionTimeoutId = setTimeout(() => {
    recordActivity('AUTO_LOGOUT', 'Session timeout setelah 30 menit inactivity');
    logout();
    showAlert('reporterAlert', 'warning', 'Sesi Anda telah berakhir karena inaktivitas. Silakan login kembali.');
  }, SESSION_TIMEOUT_MS);
  
  // Reset timer on user activity
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetSessionTimer, true);
  });
}

function clearSessionTimeout() {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.removeEventListener(event, resetSessionTimer, true);
  });
}

function resetSessionTimer() {
  if (!currentUser || !sessionTimeoutId) return;
  clearSessionTimeout();
  initSessionTimeout();
}

function removeLegacySchoolRefreshButton() {
  const byId = document.getElementById('schoolRefreshBtn');
  if (byId) byId.remove();

  document.querySelectorAll('button[onclick*="refreshSchoolTickets"]').forEach(btn => btn.remove());
}

// ====================== SECURITY: Login Attempt Limiter ======================
function recordLoginAttempt(identifier, success = false) {
  try {
    let attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    if (!attempts[identifier]) {
      attempts[identifier] = { count: 0, firstAttemptTime: Date.now(), lockedUntil: null };
    }
    
    if (!success) {
      attempts[identifier].count += 1;
      attempts[identifier].firstAttemptTime = Date.now();
      
      if (attempts[identifier].count >= MAX_LOGIN_ATTEMPTS) {
        attempts[identifier].lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
        recordActivity('LOGIN_LOCKED', `Identifier: ${identifier}`);
      }
    }
    
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (e) {
    console.warn('Cannot record login attempt', e);
  }
}

function clearLoginAttempts(identifier) {
  try {
    let attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    if (attempts[identifier]) {
      delete attempts[identifier];
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    }
  } catch (e) {
    console.warn('Cannot clear login attempts', e);
  }
}

function isLoginLocked(identifier) {
  try {
    const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    const record = attempts[identifier];
    if (!record) return false;
    
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return true;
    }
    
    // Reset if lockout period has expired
    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
      clearLoginAttempts(identifier);
      return false;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

function getLoginLockoutTimeRemaining(identifier) {
  try {
    const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    const record = attempts[identifier];
    if (!record || !record.lockedUntil) return 0;
    
    const remaining = record.lockedUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch (e) {
    return 0;
  }
}

// ====================== SECURITY: Activity Logging ======================
function recordActivity(action, details = '') {
  try {
    let logs = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      details: details,
      userType: currentUser ? currentUser.type : 'PUBLIC',
      userId: currentUser ? (currentUser.type === 'school' ? currentUser.school.id : currentUser.username) : 'ANONYMOUS'
    };
    
    logs.push(logEntry);
    
    // Keep only last 100 entries
    if (logs.length > MAX_LOG_ENTRIES) {
      logs = logs.slice(-MAX_LOG_ENTRIES);
    }
    
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('Cannot record activity', e);
  }
}

function getActivityLog() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

// ====================== MOBILE NAVIGATION (Sidebar) ======================
function toggleMobileNav() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const isOpen = sidebar.classList.toggle('open');
  backdrop.classList.toggle('show', isOpen);
}

function closeMobileNav() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  sidebar.classList.remove('open');
  backdrop.classList.remove('show');
}

// ====================== NAVIGATION ======================
const PROTECTED_PAGES = ['school-dash', 'admin-dash'];

function updateSidebarActive(page) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  const id = 'snav-' + page;
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showPage(page) {
  closeMobileNav();
  const previousActivePage = document.querySelector('.page.active')?.id?.replace('page-', '') || '';

  if (PROTECTED_PAGES.includes(page) && !currentUser) {
    page = 'reporter';
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  updateSidebarActive(page);

  // Bersihkan input tracking saat user meninggalkan halaman lacak tiket
  if (page === 'tracking') {
    resetTracking();
  }

  if (page !== 'reporter') {
    captchaVerified = false;
  } else {
    genCaptcha();
  }
}

function logout() {
  // Log activity
  recordActivity('LOGOUT', currentUser ? (currentUser.type === 'school' ? currentUser.school.name : 'Admin') : 'Unknown');
  
  currentUser = null;
  window.currentUser = currentUser;
  clearSessionUser();
  if (window.fbStopRealtime) window.fbStopRealtime();
  if (window.fbStartRealtimeForContext) window.fbStartRealtimeForContext({ context: 'public' });

  // Restore public sidebar nav
  document.getElementById('sidebarPublicNav').classList.remove('hidden');
  document.getElementById('sidebarSchoolNav').classList.add('hidden');
  document.getElementById('sidebarAdminNav').classList.add('hidden');
  document.getElementById('sidebarUser').classList.add('hidden');
  document.getElementById('sidebarActions').classList.add('hidden');
  document.getElementById('topbarUser').classList.add('hidden');

  closeMobileNav();
  showPage('reporter');
}

// ====================== CAPTCHA ======================
function genCaptcha() {
  captchaA = Math.floor(Math.random() * 10) + 1;
  captchaB = Math.floor(Math.random() * 10) + 1;
  document.getElementById('captchaQ').textContent = captchaA + ' + ' + captchaB;
  document.getElementById('captchaAns').value = '';
  document.getElementById('captchaAns').style.borderColor = 'var(--border)';
  captchaVerified = false;
  const statusEl = document.getElementById('captchaStatus');
  if (statusEl) statusEl.textContent = '';
}

function checkCaptchaAuto() {
  const ans = parseInt(document.getElementById('captchaAns').value);
  const statusEl = document.getElementById('captchaStatus');
  if (ans === captchaA + captchaB) {
    captchaVerified = true;
    statusEl.innerHTML = SVGIcons.check + ' Verifikasi berhasil!';
    statusEl.style.color = 'var(--success)';
    document.getElementById('captchaAns').style.borderColor = 'var(--success)';
  } else if (document.getElementById('captchaAns').value.length > 0) {
    captchaVerified = false;
    statusEl.innerHTML = SVGIcons.x + ' Jawaban salah';
    statusEl.style.color = 'var(--danger)';
    document.getElementById('captchaAns').style.borderColor = 'var(--danger)';
  } else {
    captchaVerified = false;
    statusEl.textContent = '';
    document.getElementById('captchaAns').style.borderColor = 'var(--border)';
  }
}

function verifyCaptcha() {
  checkCaptchaAuto();
}

// ====================== SCHOOL SEARCH DROPDOWN ======================
function filterSchools() {
  const q = document.getElementById('schoolSearch').value.toLowerCase();
  const dd = document.getElementById('schoolDropdown');
  const DB = loadDB();
  const matches = DB.schools.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q));
  dd.innerHTML = '';
  if (matches.length === 0) {
    dd.innerHTML = '<div class="dropdown-item" style="color:var(--text-3)">Sekolah tidak ditemukan</div>';
  } else {
    matches.forEach(s => {
      const d = document.createElement('div');
      d.className = 'dropdown-item';
      d.innerHTML = `<strong>${s.name}</strong> <span style="color:var(--text-3);font-size:11px">${s.level} · ${s.city}</span>`;
      d.onclick = () => {
        document.getElementById('schoolSearch').value = s.name;
        document.getElementById('r_school_id').value = s.id;
        document.getElementById('r_school_name').value = s.name;
        dd.classList.remove('show');
      };
      dd.appendChild(d);
    });
  }
  dd.classList.add('show');
}

function showDropdown() {
  filterSchools();
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.search-select')) document.getElementById('schoolDropdown').classList.remove('show');
});

// ====================== IMAGE COMPRESSION ======================
function detectWebPSupport() {
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 1;
  const dataUrl = canvas.toDataURL('image/webp');
  return dataUrl.startsWith('data:image/webp');
}
const USE_WEBP = detectWebPSupport();
const IMG_FORMAT = USE_WEBP ? 'image/webp' : 'image/jpeg';

async function compressImage(file, maxSizeKB = 100) {
  const MAX_BYTES = maxSizeKB * 1024;
  const MAX_DIM = 1280;
  const MIN_QUALITY = 0.25;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_DIM);
            width = MAX_DIM;
          } else {
            width = Math.round((width / height) * MAX_DIM);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = USE_WEBP ? 0.85 : 0.75;
        let dataUrl = canvas.toDataURL(IMG_FORMAT, quality);

        function base64SizeBytes(b64) {
          const base = b64.split(',')[1] || b64;
          return Math.ceil((base.length * 3) / 4);
        }

        while (base64SizeBytes(dataUrl) > MAX_BYTES && quality > MIN_QUALITY) {
          quality = Math.max(quality - 0.05, MIN_QUALITY);
          dataUrl = canvas.toDataURL(IMG_FORMAT, quality);
        }

        if (base64SizeBytes(dataUrl) > MAX_BYTES) {
          let scale = 0.85;
          while (base64SizeBytes(dataUrl) > MAX_BYTES && scale > 0.2) {
            const w2 = Math.round(width * scale);
            const h2 = Math.round(height * scale);
            const c2 = document.createElement('canvas');
            c2.width = w2; c2.height = h2;
            c2.getContext('2d').drawImage(img, 0, 0, w2, h2);
            dataUrl = c2.toDataURL(IMG_FORMAT, MIN_QUALITY);
            scale -= 0.1;
          }
        }
        resolve(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function compressImages(files, maxSizeKB = 100) {
  const results = await Promise.all(files.map(async (f) => {
    const compressed = await compressImage(f, maxSizeKB);
    return compressed;
  }));
  return results;
}

// ====================== PHOTO UPLOAD ======================
function handlePhotos(inp) {
  const files = Array.from(inp.files).slice(0, 3);
  if (files.length === 0) return;
  ['photoInput', 'photoInputCamera', 'photoInputGallery'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== inp) el.value = '';
  });
  const prev = document.getElementById('photoPreview');
  prev.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:12px;color:var(--text-3);font-size:13px">Mengompresi foto...</div>';

  compressImages(files, 100).then(compressedDataUrls => {
    photoFiles = compressedDataUrls;
    prev.innerHTML = '';
    compressedDataUrls.forEach(dataUrl => {
      const img = document.createElement('img');
      img.className = 'photo-thumb';
      img.src = dataUrl;
      prev.appendChild(img);
    });
  }).catch(() => {
    prev.innerHTML = '<div style="grid-column:1/-1;color:var(--danger);font-size:13px;display:flex;align-items:center;gap:6px">' + SVGIcons.x + ' Gagal memproses foto. Coba lagi.</div>';
  });
}

// ====================== FIELD VALIDATION HELPERS ======================

const NAME_MAX = 60;
const WA_MIN = 9;
const WA_MAX = 15;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function showFieldHint(hintId, msg, isError) {
  const el = document.getElementById(hintId);
  if (!el) return;
  if (!msg) { el.style.display = 'none'; el.textContent = ''; return; }
  el.textContent = msg;
  el.style.display = 'block';
  el.style.color = isError ? 'var(--danger)' : 'var(--text-3)';
}

// Field Nama: hanya huruf, spasi, tanda titik, dan tanda hubung
function filterNameInput(input) {
  // Hapus karakter yang tidak diizinkan (angka & simbol selain . dan -)
  const cleaned = input.value.replace(/[^a-zA-ZÀ-öø-ÿ\s.\-']/g, '');
  if (input.value !== cleaned) input.value = cleaned;

  const len = cleaned.trim().length;
  if (len === 0) {
    showFieldHint('r_name_hint', '', false);
  } else if (len < 3) {
    showFieldHint('r_name_hint', 'Nama terlalu pendek (minimal 3 karakter).', true);
  } else {
    showFieldHint('r_name_hint', `${cleaned.length}/${NAME_MAX} karakter`, false);
  }
}

// Field WA: hanya angka, wajib diawali 0 atau +62
function filterWAInput(input) {
  // Izinkan + hanya di posisi pertama, sisanya hanya angka
  let val = input.value;
  // Hapus semua bukan angka dan + di awal
  val = val.replace(/[^\d+]/g, '');
  // Pastikan + hanya muncul di index 0
  if (val.indexOf('+') > 0) val = val.replace(/\+/g, '');
  if (val.split('+').length > 2) val = val.replace(/\+/g, '');
  input.value = val;

  const digits = val.replace(/\D/g, '');
  const len = digits.length;

  if (val.length === 0) {
    showFieldHint('r_wa_hint', '', false);
  } else if (!val.startsWith('0') && !val.startsWith('+62') && !val.startsWith('62')) {
    showFieldHint('r_wa_hint', 'Nomor harus diawali 0 atau +62.', true);
  } else if (len < WA_MIN) {
    showFieldHint('r_wa_hint', `Terlalu pendek — minimal ${WA_MIN} digit (sekarang ${len}).`, true);
  } else {
    showFieldHint('r_wa_hint', `${len} digit — valid`, false);
  }
}

// Field Email: opsional, tetapi wajib valid jika diisi
function validateOptionalEmail(input) {
  const value = input.value.trim();
  input.value = value;

  if (!value) {
    showFieldHint('r_email_hint', '', false);
    return true;
  }

  if (!EMAIL_PATTERN.test(value)) {
    showFieldHint('r_email_hint', 'Format email belum valid. Contoh: nama@domain.com', true);
    return false;
  }

  showFieldHint('r_email_hint', 'Format email valid.', false);
  return true;
}

// ====================== TOPIC CHANGE HANDLER ======================
function onTopicChange(select) {
  const isBully = select.value === 'Perilaku Tidak Pantas / Bullying';
  const group = document.getElementById('incidentDateGroup');
  const dateInput = document.getElementById('r_incident_date');
  if (group) {
    group.style.display = isBully ? '' : 'none';
  }
  if (dateInput) {
    // Set max date to today so future dates can't be picked
    dateInput.max = new Date().toISOString().split('T')[0];
    if (!isBully) dateInput.value = '';
    showFieldHint('r_incident_date_hint', '', false);
  }
}

// ====================== SUBMIT REPORT ======================
function submitReport() {
  const name = document.getElementById('r_name').value.trim();
  const email = document.getElementById('r_email').value.trim();
  const wa = document.getElementById('r_wa').value.trim();
  const schoolId = document.getElementById('r_school_id').value;
  const schoolName = document.getElementById('r_school_name').value;
  const topic = document.getElementById('r_topic').value;
  const desc = document.getElementById('r_desc').value.trim();

  const isBully = topic === 'Perilaku Tidak Pantas / Bullying';
  const incidentDate = isBully ? (document.getElementById('r_incident_date').value || '') : '';

  if (!name) return showAlert('reporterAlert', 'danger', 'Nama pelapor wajib diisi.');
  if (name.length < 3) return showAlert('reporterAlert', 'danger', 'Nama pelapor minimal 3 karakter.');
  if (name.length > NAME_MAX) return showAlert('reporterAlert', 'danger', `Nama pelapor maksimal ${NAME_MAX} karakter.`);
  if (/\d/.test(name)) return showAlert('reporterAlert', 'danger', 'Nama pelapor tidak boleh mengandung angka.');
  if (!wa) return showAlert('reporterAlert', 'danger', 'Nomor WhatsApp wajib diisi.');
  if (!/^(\+62|62|0)\d+$/.test(wa)) return showAlert('reporterAlert', 'danger', 'Nomor WhatsApp hanya boleh berisi angka dan harus diawali 0 atau +62.');
  const waDigits = wa.replace(/\D/g, '');
  if (waDigits.length < WA_MIN) return showAlert('reporterAlert', 'danger', `Nomor WhatsApp minimal ${WA_MIN} digit (sekarang ${waDigits.length}).`);
  if (waDigits.length > WA_MAX) return showAlert('reporterAlert', 'danger', `Nomor WhatsApp maksimal ${WA_MAX} digit.`);
  if (email && !validateOptionalEmail(document.getElementById('r_email'))) {
    return showAlert('reporterAlert', 'danger', 'Email opsional, namun jika diisi harus menggunakan format yang benar.');
  }
  if (!schoolId) return showAlert('reporterAlert', 'danger', 'Pilih sekolah dari dropdown.');
  if (!topic) return showAlert('reporterAlert', 'danger', 'Pilih topik permasalahan.');
  if (isBully && !incidentDate) return showAlert('reporterAlert', 'danger', 'Tanggal kejadian wajib diisi untuk laporan bullying.');
  if (desc.length < 20) return showAlert('reporterAlert', 'danger', 'Deskripsi permasalahan minimal 20 karakter.');
  if (!captchaVerified) return showAlert('reporterAlert', 'danger', 'Harap jawab pertanyaan verifikasi matematika dengan benar.');

  const submitBtn = document.querySelector('#page-reporter .btn-primary');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Mengirim...';

  const id = 'TKT-' + Date.now().toString(36).toUpperCase().slice(-6);

  async function collectPhotos() {
    return photoFiles;
  }

  collectPhotos().then(async photos => {
    const ticket = {
      id, reporter: name, email,
      wa, schoolId, schoolName, topic, desc, photos, status: 'Baru',
      date: new Date().toISOString(), incidentDate: incidentDate || null,
      notes: '', followUpPhotos: [], processDate: null, completeDate: null
    };
    const DB = loadDB();
    DB.tickets.push(ticket);
    if (window.fbSaveTicket) await window.fbSaveTicket(ticket);

    // Reset form
    document.getElementById('r_name').value = '';
    document.getElementById('r_email').value = '';
    showFieldHint('r_email_hint', '', false);
    document.getElementById('r_wa').value = '';
    document.getElementById('schoolSearch').value = '';
    document.getElementById('r_school_id').value = '';
    document.getElementById('r_school_name').value = '';
    document.getElementById('r_topic').value = '';
    document.getElementById('r_desc').value = '';
    document.getElementById('r_incident_date').value = '';
    document.getElementById('incidentDateGroup').style.display = 'none';
    document.getElementById('photoPreview').innerHTML = '';
    photoFiles = [];
    genCaptcha();

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Kirim Laporan';
    showTicketSuccessModal(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }).catch(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Kirim Laporan';
    showAlert('reporterAlert', 'danger', 'Terjadi kesalahan saat mengirim. Coba lagi.');
  });
}

// ====================== SCHOOL LOGIN ======================
async function schoolLogin() {
  const npsn = document.getElementById('sl_npsn').value.trim();
  const pass = document.getElementById('sl_pass').value;
  
  // Check login attempts limiter
  if (isLoginLocked(npsn)) {
    const lockoutTime = getLoginLockoutTimeRemaining(npsn);
    const minutes = Math.ceil(lockoutTime / 1000 / 60);
    return showAlert('schoolLoginAlert', 'danger', `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`);
  }
  
  const DB = loadDB();
  const school = DB.schools.find(s => s.id === npsn);
  if (!school || !(await verifyPassword(pass, school))) {
    recordLoginAttempt(npsn, false);
    return showAlert('schoolLoginAlert', 'danger', 'NPSN atau password salah.');
  }
  
  // Clear login attempts on successful login
  clearLoginAttempts(npsn);
  recordActivity('LOGIN', `School: ${school.name} (${npsn})`);
  
  await migrateSchoolPasswordHash(school);
  saveSessionUser({ type: 'school', schoolId: school.id });
  applySchoolState(school);
}


function renderLoadMoreButton(containerId, context, schoolId = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const meta = window.DBMeta?.tickets;
  if (!meta) return;

  const oldBtn = document.getElementById(containerId + '-load-more');
  if (oldBtn) oldBtn.remove();

  const isContextMatch = meta.context === context && (context !== 'school' || meta.schoolId === schoolId);
  if (!isContextMatch || !meta.hasMore) return;

  const btn = document.createElement('button');
  btn.id = containerId + '-load-more';
  btn.className = 'btn btn-outline';
  btn.style.marginTop = '12px';
  btn.style.width = '100%';
  btn.textContent = meta.isLoading ? 'Memuat...' : 'Muat lebih banyak';
  btn.disabled = meta.isLoading;
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Memuat...';
    if (window.fbLoadTicketsPage) {
      await window.fbLoadTicketsPage({ context, schoolId, reset: false });
    }
    renderLoadMoreButton(containerId, context, schoolId);
  };
  container.insertAdjacentElement('afterend', btn);
}

function updateSchoolStats() {
  if (!currentUser || currentUser.type !== 'school') return;
  const DB = loadDB();
  const tickets = DB.tickets.filter(t => isTicketForSchool(t, currentUser.school.id));
  document.getElementById('sTotal').textContent = tickets.length;
  document.getElementById('sNew').textContent = tickets.filter(t => t.status === 'Baru').length;
  document.getElementById('sProc').textContent = tickets.filter(t => t.status === 'Dalam Proses').length;
  document.getElementById('sDone').textContent = tickets.filter(t => t.status === 'Selesai').length;
}

function renderSchoolTickets() {
  if (!currentUser || currentUser.type !== 'school') return;
  const DB = loadDB();
  const q = (document.getElementById('schoolTicketSearch').value || '').toLowerCase();
  let tickets = DB.tickets.filter(t => isTicketForSchool(t, currentUser.school.id));
  if (schoolTicketFilter !== 'all') tickets = tickets.filter(t => t.status === schoolTicketFilter);
  if (q) tickets = tickets.filter(t => t.desc.toLowerCase().includes(q) || t.topic.toLowerCase().includes(q) || t.reporter.toLowerCase().includes(q));
  tickets.sort((a, b) => new Date(b.date) - new Date(a.date));
  const el = document.getElementById('schoolTicketList');
  if (tickets.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-3)">Tidak ada laporan ditemukan</div>';
    renderLoadMoreButton('schoolTicketList', 'school', currentUser.school.id);
    return;
  }
  el.innerHTML = tickets.map(t => ticketCard(t, true)).join('');
  renderLoadMoreButton('schoolTicketList', 'school', currentUser.school.id);
}

function filterSchoolTickets(status, btn) {
  schoolTicketFilter = status;
  document.querySelectorAll('#page-school-dash .filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSchoolTickets();
}

async function refreshSchoolTickets() {
  if (!currentUser || currentUser.type !== 'school') return;
  const refreshBtn = document.getElementById('schoolRefreshBtn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Menyegarkan...';
  }
  try {
    if (window.fbRefreshSchoolTickets) {
      await window.fbRefreshSchoolTickets(currentUser.school.id);
    } else if (window.fbLoadTicketsPage) {
      await window.fbLoadTicketsPage({ context: 'school', schoolId: currentUser.school.id, reset: true });
    }
    renderSchoolTickets();
    updateSchoolStats();
    showAlert('schoolDashAlert', 'success', 'Data laporan sekolah berhasil disegarkan.');
  } catch (e) {
    console.error('refreshSchoolTickets error:', e);
    showAlert('schoolDashAlert', 'danger', 'Gagal menyegarkan data laporan sekolah. Silakan coba lagi.');
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"/></svg> Refresh Data';
    }
  }
}

// ====================== ADMIN LOGIN ======================
async function adminLogin() {
  const user = document.getElementById('al_user').value.trim();
  const pass = document.getElementById('al_pass').value;
  const lockoutKey = 'admin_' + user;
  
  // Check login attempts limiter
  if (isLoginLocked(lockoutKey)) {
    const lockoutTime = getLoginLockoutTimeRemaining(lockoutKey);
    const minutes = Math.ceil(lockoutTime / 1000 / 60);
    return showAlert('adminLoginAlert', 'danger', `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`);
  }
  
  const DB = loadDB();
  if (user !== DB.admin.username || !(await verifyPassword(pass, DB.admin))) {
    recordLoginAttempt(lockoutKey, false);
    return showAlert('adminLoginAlert', 'danger', 'Username atau password admin salah.');
  }
  
  // Clear login attempts on successful login
  clearLoginAttempts(lockoutKey);
  recordActivity('LOGIN', `Admin: ${user}`);
  
  await migrateAdminPasswordHash(DB.admin);
  saveSessionUser({ type: 'admin', username: DB.admin.username });
  applyAdminState();
}

function adminTab(tab, btn) {
  ['overview', 'schools', 'reports', 'users'].forEach(t => {
    document.getElementById('admin-' + t).classList.add('hidden');
  });
  document.querySelectorAll('#page-admin-dash .tab').forEach(b => b.classList.remove('active'));
  document.getElementById('admin-' + tab).classList.remove('hidden');
  btn.classList.add('active');
  if (tab === 'schools') renderSchoolTable();
  if (tab === 'reports') renderAdminTickets();
  if (tab === 'users') renderUserTable();
}

function updateAdminStats() {
  const DB = loadDB();
  document.getElementById('aTotal').textContent = DB.tickets.length;
  document.getElementById('aNew').textContent = DB.tickets.filter(t => t.status === 'Baru').length;
  document.getElementById('aProc').textContent = DB.tickets.filter(t => t.status === 'Dalam Proses').length;
  document.getElementById('aDone').textContent = DB.tickets.filter(t => t.status === 'Selesai').length;
}

function renderAdminRecent() {
  const DB = loadDB();
  const tickets = [...DB.tickets].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  document.getElementById('adminRecentList').innerHTML = tickets.map(t => ticketCard(t, false)).join('') || '<div style="text-align:center;padding:32px;color:var(--text-3)">Belum ada laporan</div>';
  renderLoadMoreButton('adminRecentList', 'admin');
}

function renderSchoolTable() {
  const DB = loadDB();
  const q = (document.getElementById('schoolListSearch').value || '').toLowerCase();
  const schools = DB.schools.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q));
  document.getElementById('schoolTableBody').innerHTML = schools.map(s => {
    const cnt = DB.tickets.filter(t => isTicketForSchool(t, s.id)).length;
    return `<tr>
      <td><code style="background:var(--neutral);padding:2px 6px;border-radius:4px;font-size:12px">${s.id}</code></td>
      <td><strong>${s.name}</strong></td>
      <td><span class="badge badge-new">${s.level}</span></td>
      <td>${s.city}</td>
      <td>${cnt}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-sm btn-outline" onclick="openEditSchool('${s.id}')" style="font-size:12px">Edit</button>
        <button class="btn btn-sm btn-outline" onclick="openResetPass('${s.id}','${s.name.replace(/'/g, '\\\'')}')" style="font-size:12px">Reset Pass</button>
      </td>
    </tr>`;
  }).join('');
}

function renderAdminTickets() {
  const DB = loadDB();
  const q = (document.getElementById('adminReportSearch').value || '').toLowerCase();
  let tickets = [...DB.tickets];
  if (adminTicketFilter !== 'all') tickets = tickets.filter(t => t.status === adminTicketFilter);
  if (q) tickets = tickets.filter(t => t.schoolName.toLowerCase().includes(q) || t.topic.toLowerCase().includes(q) || t.reporter.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  tickets.sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('adminAllTickets').innerHTML = tickets.map(t => ticketCard(t, false)).join('') || '<div style="text-align:center;padding:32px;color:var(--text-3)">Tidak ada laporan</div>';
  renderLoadMoreButton('adminAllTickets', 'admin');
}

function filterAdminTickets(status, btn) {
  adminTicketFilter = status;
  document.querySelectorAll('#admin-reports .filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAdminTickets();
}

function renderUserTable() {
  const DB = loadDB();
  document.getElementById('userTableBody').innerHTML = DB.schools.map(s => `
    <tr>
      <td><code style="background:var(--neutral);padding:2px 6px;border-radius:4px;font-size:12px">${s.id}</code></td>
      <td>${s.name}</td>
      <td>${s.firstLogin ? '<span class="badge badge-new">Belum Login</span>' : '<span class="badge badge-done">Sudah Login</span>'}</td>
      <td><button class="btn btn-sm btn-danger" onclick="openResetPass('${s.id}','${s.name.replace(/'/g, '\\\'')}')" style="font-size:12px">Reset Password</button></td>
    </tr>
  `).join('');
}

async function addSchool() {
  const npsn = document.getElementById('a_npsn').value.trim();
  const name = document.getElementById('a_sname').value.trim();
  const level = document.getElementById('a_level').value;
  const city = document.getElementById('a_city').value.trim();
  const defpass = document.getElementById('a_defpass').value.trim();
  if (!npsn || npsn.length !== 8 || isNaN(npsn)) return alert('NPSN harus 8 digit angka');
  if (!name) return alert('Nama sekolah wajib diisi');
  const DB = loadDB();
  if (DB.schools.find(s => s.id === npsn)) return alert('NPSN sudah terdaftar');
  const defaultPassword = defpass || npsn;
  const passwordHash = await hashPassword(defaultPassword);
  const newSchool = { id: npsn, name, level, city, passwordHash, firstLogin: true };
  DB.schools.push(newSchool);
  if (window.fbSaveSchool) window.fbSaveSchool(newSchool);
  document.getElementById('a_npsn').value = '';
  document.getElementById('a_sname').value = '';
  document.getElementById('a_city').value = '';
  document.getElementById('a_defpass').value = '';
  renderSchoolTable();
  alert('Sekolah berhasil ditambahkan! NPSN: ' + npsn);
}

// Global variable to store excel data
let excelDataToImport = [];

function downloadExcelTemplate() {
  if (typeof XLSX === 'undefined') {
    alert('Library XLSX tidak terload. Silakan refresh halaman.');
    return;
  }
  
  try {
    const ws_data = [
      ['NPSN', 'Nama Sekolah', 'Jenjang', 'Kota', 'Password (Opsional)'],
      ['12345678', 'SD Maju Jaya', 'SD', 'Jakarta', ''],
      ['87654321', 'SMP Pintar', 'SMP', 'Bandung', 'sandi123'],
      ['11223344', 'SMA Berprestasi', 'SMA', 'Surabaya', '']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 }
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sekolah');
    
    const fileName = 'Template_Import_Sekolah.xlsx';
    XLSX.writeFile(wb, fileName);
  } catch (err) {
    console.error('Error generating template:', err);
    alert('Gagal membuat template: ' + err.message);
  }
}

function previewExcelData(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rows.length < 2) {
        alert('File Excel kosong atau tidak memiliki data');
        return;
      }
      
      // Skip header row
      const dataRows = rows.slice(1).filter(row => row[0] && row[1]);
      excelDataToImport = [];
      let html = '';
      
      dataRows.forEach((row, idx) => {
        const npsn = String(row[0]).trim();
        const name = String(row[1]).trim();
        const level = String(row[2]).trim() || 'SD';
        const city = String(row[3]).trim();
        const password = row[4] ? String(row[4]).trim() : '';
        
        // Validate NPSN
        if (npsn.length !== 8 || isNaN(npsn)) {
          html += `<tr style="background:var(--danger-pale);opacity:0.6"><td>${npsn}</td><td>${name}</td><td>${level}</td><td>${city}</td><td>${password || '(NPSN)'}</td></tr>`;
          return;
        }
        
        excelDataToImport.push({ npsn, name, level, city, password });
        html += `<tr><td><code style="background:var(--neutral);padding:2px 6px;border-radius:4px;font-size:12px">${npsn}</code></td><td>${name}</td><td><span class="badge badge-new">${level}</span></td><td>${city}</td><td>${password || '(NPSN)'}</td></tr>`;
      });
      
      document.getElementById('excelTableBody').innerHTML = html;
      document.getElementById('excelPreview').classList.remove('hidden');
    } catch (err) {
      alert('Gagal membaca file Excel: ' + err.message);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

async function importExcelData() {
  if (excelDataToImport.length === 0) {
    alert('Tidak ada data valid untuk diimport');
    return;
  }
  
  const DB = loadDB();
  let successCount = 0;
  let duplicateCount = 0;
  
  for (const schoolData of excelDataToImport) {
    // Check if school already exists
    if (DB.schools.find(s => s.id === schoolData.npsn)) {
      duplicateCount++;
      continue;
    }
    
    const defaultPassword = schoolData.password || schoolData.npsn;
    const passwordHash = await hashPassword(defaultPassword);
    const newSchool = {
      id: schoolData.npsn,
      name: schoolData.name,
      level: schoolData.level,
      city: schoolData.city,
      passwordHash,
      firstLogin: true
    };
    
    DB.schools.push(newSchool);
    if (window.fbSaveSchool) await window.fbSaveSchool(newSchool);
    successCount++;
  }
  
  cancelExcelImport();
  renderSchoolTable();
  
  let message = `${successCount} sekolah berhasil diimport`;
  if (duplicateCount > 0) message += ` (${duplicateCount} data duplikat dilewati)`;
  alert(message);
}

function cancelExcelImport() {
  document.getElementById('excelFileInput').value = '';
  document.getElementById('excelPreview').classList.add('hidden');
  document.getElementById('excelTableBody').innerHTML = '';
  excelDataToImport = [];
}

// ====================== GOOGLE SHEETS IMPORT ======================
let googleSheetDataToImport = [];

function parseGoogleSheetUrl(input) {
  const url = input.trim();
  // Extract Sheet ID from URL
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function importFromGoogleSheet() {
  const sheetUrlInput = document.getElementById('googleSheetUrl').value.trim();
  if (!sheetUrlInput) {
    alert('Masukkan URL Google Sheet atau Sheet ID');
    return;
  }
  
  const sheetId = parseGoogleSheetUrl(sheetUrlInput);
  if (!sheetId) {
    alert('URL Google Sheet tidak valid. Gunakan format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit');
    return;
  }
  
  try {
    const loadingDiv = document.getElementById('googleSheetLoading');
    if (loadingDiv) loadingDiv.classList.remove('hidden');
    
    // Fetch dari CSV export (tidak perlu API key)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error('Google Sheet tidak ditemukan atau tidak dapat diakses. Pastikan sheet sudah di-share dengan "Siapa saja dapat melihat".');
    }
    
    const csvText = await response.text();
    const rows = csvText.split('\
').map(row => {
      // Parse CSV dengan benar (handle quotes)
      const regex = /(?:[^,\"]+|\"[^\"]*\")+/g;
      return row.match(regex)?.map(cell => cell.replace(/^\"|\"$/g, '').trim()) || [];
    }).filter(row => row.some(cell => cell)); // Filter empty rows
    
    if (rows.length < 2) {
      throw new Error('Google Sheet kosong atau hanya memiliki header');
    }
    
    // Parse data mulai dari row 2 (skip header)
    const dataRows = rows.slice(1);
    googleSheetDataToImport = [];
    let html = '';
    let validCount = 0;
    
    dataRows.forEach((row, idx) => {
      const npsn = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();
      const level = String(row[2] || 'SD').trim();
      const city = String(row[3] || '').trim();
      const password = String(row[4] || '').trim();
      
      // Validate NPSN
      if (!npsn || npsn.length !== 8 || isNaN(npsn)) {
        html += `<tr style=\"background:var(--danger-pale);opacity:0.6\"><td>${npsn || '(kosong)'}</td><td>${name || '(kosong)'}</td><td>${level}</td><td>${city || '(kosong)'}</td><td>${password || '(NPSN)'}</td></tr>`;
        return;
      }
      
      googleSheetDataToImport.push({ npsn, name, level, city, password });
      validCount++;
      html += `<tr><td><code style=\"background:var(--neutral);padding:2px 6px;border-radius:4px;font-size:12px\">${npsn}</code></td><td>${name}</td><td><span class=\"badge badge-new\">${level}</span></td><td>${city}</td><td>${password || '(NPSN)'}</td></tr>`;
    });
    
    if (validCount === 0) {
      throw new Error('Tidak ada data valid yang ditemukan. Pastikan format: NPSN (8 digit) | Nama | Jenjang | Kota | Password');
    }
    
    document.getElementById('googleSheetTableBody').innerHTML = html;
    document.getElementById('googleSheetPreview').classList.remove('hidden');
    document.getElementById('googleSheetUrl').value = '';
    
    if (loadingDiv) loadingDiv.classList.add('hidden');
  } catch (err) {
    if (loadingDiv) loadingDiv.classList.add('hidden');
    console.error('Error importing from Google Sheet:', err);
    alert('Gagal membaca Google Sheet:\
' + err.message);
  }
}

async function confirmGoogleSheetImport() {
  if (googleSheetDataToImport.length === 0) {
    alert('Tidak ada data untuk diimport');
    return;
  }
  
  const DB = loadDB();
  let successCount = 0;
  let duplicateCount = 0;
  
  for (const schoolData of googleSheetDataToImport) {
    if (DB.schools.find(s => s.id === schoolData.npsn)) {
      duplicateCount++;
      continue;
    }
    
    const defaultPassword = schoolData.password || schoolData.npsn;
    const passwordHash = await hashPassword(defaultPassword);
    const newSchool = {
      id: schoolData.npsn,
      name: schoolData.name,
      level: schoolData.level,
      city: schoolData.city,
      passwordHash,
      firstLogin: true
    };
    
    DB.schools.push(newSchool);
    if (window.fbSaveSchool) await window.fbSaveSchool(newSchool);
    successCount++;
  }
  
  cancelGoogleSheetImport();
  renderSchoolTable();
  
  let message = `${successCount} sekolah berhasil diimport dari Google Sheet`;
  if (duplicateCount > 0) message += ` (${duplicateCount} data duplikat dilewati)`;
  alert(message);
}

function cancelGoogleSheetImport() {
  document.getElementById('googleSheetUrl').value = '';
  document.getElementById('googleSheetPreview').classList.add('hidden');
  document.getElementById('googleSheetTableBody').innerHTML = '';
  document.getElementById('googleSheetLoading').classList.add('hidden');
  googleSheetDataToImport = [];
}

function openEditSchool(npsn) {
  const DB = loadDB();
  const school = DB.schools.find(s => s.id === npsn);
  if (!school) return alert('Sekolah tidak ditemukan');
  
  document.getElementById('e_npsn').value = school.id;
  document.getElementById('e_npsn').disabled = true;
  document.getElementById('e_sname').value = school.name;
  document.getElementById('e_level').value = school.level;
  document.getElementById('e_city').value = school.city;
  
  document.getElementById('editSchoolModal').classList.add('show');
}

function closeEditSchool() {
  document.getElementById('editSchoolModal').classList.remove('show');
}

async function saveEditSchool() {
  const npsn = document.getElementById('e_npsn').value.trim();
  const name = document.getElementById('e_sname').value.trim();
  const level = document.getElementById('e_level').value;
  const city = document.getElementById('e_city').value.trim();
  
  if (!name) return alert('Nama sekolah wajib diisi');
  if (!level) return alert('Jenjang wajib diisi');
  if (!city) return alert('Kota/Kabupaten wajib diisi');
  
  const DB = loadDB();
  const schoolIndex = DB.schools.findIndex(s => s.id === npsn);
  if (schoolIndex === -1) return alert('Sekolah tidak ditemukan');
  
  const updatedSchool = {
    ...DB.schools[schoolIndex],
    name,
    level,
    city
  };
  
  DB.schools[schoolIndex] = updatedSchool;
  
  if (window.fbUpdateSchool) {
    await window.fbUpdateSchool(npsn, { name, level, city });
  }
  
  closeEditSchool();
  renderSchoolTable();
  alert('Data sekolah berhasil diperbarui!');
}

// ====================== TICKET CARD ======================
function ticketCard(t, isSchool) {
  const statusClass = t.status === 'Baru' ? 'badge-new' : t.status === 'Dalam Proses' ? 'badge-process' : 'badge-done';
  const date = new Date(t.date).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `<div class="ticket">
    <div class="ticket-head">
      <div>
        <div class="ticket-id">${t.id} · ${date}</div>
        <div class="ticket-title">${t.topic}</div>
      </div>
      <span class="badge ${statusClass}">${t.status}</span>
    </div>
    <div class="ticket-body">${t.desc.substring(0, 120)}${t.desc.length > 120 ? '...' : ''}</div>
    <div class="ticket-meta">
      <span>${SVGIcons.user} ${t.reporter}</span>
      ${t.wa ? `<span>${SVGIcons.phone} ${t.wa}</span>` : ''}
      ${!isSchool ? `<span>${SVGIcons.building} ${t.schoolName}</span>` : ''}
    </div>
    ${t.notes ? `<div style="margin-top:8px;font-size:12px;background:var(--success-pale);padding:6px 10px;border-radius:6px;color:var(--success);display:flex;align-items:center;gap:6px;word-break:break-word;overflow-wrap:anywhere">${SVGIcons.clipboard} ${t.notes}</div>` : ''}
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn btn-sm btn-outline" onclick="openTicket('${t.id}',${isSchool})">Lihat Detail</button>
      <button class="btn btn-sm btn-outline" onclick="printSingleTicketPDF('${t.id}')" style="gap:6px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Cetak
      </button>
    </div>
  </div>`;
}

function openTicket(id, isSchool) {
  document.getElementById('modalTicketId').textContent = 'Memuat detail...';
  document.getElementById('modalTicketContent').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-3)">Memuat data laporan...</div>';
  openModal('ticketModal');
  followUpPhotoFiles = [];

  const fetchAndRender = async () => {
    let t = null;
    if (window.fbGetTicketFull) t = await window.fbGetTicketFull(id);
    if (!t) {
      const DB = loadDB();
      t = DB.tickets.find(x => x.id === id);
      if (!t) {
        document.getElementById('modalTicketContent').innerHTML = '<div class="alert alert-danger"><div class="alert-icon">' + SVGIcons.x + '</div><div>Gagal memuat data laporan.</div></div>';
        return;
      }
      t = { ...t, photos: [], followUpPhotos: [] };
    }

    const date = new Date(t.date).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const processDate = t.processDate ? new Date(t.processDate).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const completeDate = t.completeDate ? new Date(t.completeDate).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const statusClass = t.status === 'Baru' ? 'badge-new' : t.status === 'Dalam Proses' ? 'badge-process' : 'badge-done';

    const photosHTML = t.photos && t.photos.length > 0 ? `
      <div style="margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-3);margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Foto Laporan</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${t.photos.map(p => `<img src="${p}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="openPhotoLightbox(this.src)">`).join('')}
        </div>
      </div>` : '';

    const { processNotes, completeNotes, processPhotos, completePhotos } = resolveTicketProgressData(t);

    const processPhotosHTML = processPhotos.length > 0 ? `
      <div style="margin-top:12px">
        <div style="font-size:12px;color:var(--text-3);margin-bottom:6px;font-weight:600;display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Foto Tindak Lanjut</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${processPhotos.map(p => `<img src="${p}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="openPhotoLightbox(this.src)">`).join('')}
        </div>
      </div>` : '';

    const completePhotosHTML = completePhotos.length > 0 ? `
      <div style="margin-top:12px">
        <div style="font-size:12px;color:var(--text-3);margin-bottom:6px;font-weight:600;display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Foto Penyelesaian</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${completePhotos.map(p => `<img src="${p}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="openPhotoLightbox(this.src)">`).join('')}
        </div>
      </div>` : '';

    document.getElementById('modalTicketId').textContent = 'Detail Laporan — ' + t.id;
    document.getElementById('modalTicketContent').innerHTML = `
      <div style="text-align:right;margin-bottom:12px">
        <button class="btn btn-sm btn-outline" onclick="printSingleTicketPDF('${t.id}')" style="gap:6px;font-size:12px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Cetak PDF
        </button>
      </div>
      <!-- BAGIAN 1: LAPORAN AWAL (BIRU) -->
      <div style="background:var(--primary-pale);border:2px solid var(--primary);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--primary);font-weight:700;margin-bottom:8px;text-transform:uppercase;display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> Laporan Awal</div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Dilaporkan: ${date}</div>
        <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Topik</div>
          <div style="font-weight:600;font-size:14px;word-break:break-word;overflow-wrap:anywhere">${t.topic}</div>
        </div>
        <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Deskripsi</div>
          <div style="line-height:1.6;font-size:13px;word-break:break-word;overflow-wrap:anywhere">${t.desc}</div>
        </div>
        ${photosHTML}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="background:#fff;border-radius:8px;padding:10px;min-width:0">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:3px">Pelapor</div>
            <div style="font-weight:600;font-size:13px;word-break:break-word;overflow-wrap:anywhere">${t.reporter}</div>
            <div style="font-size:11px;color:var(--text-2);word-break:break-all">${t.wa}</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:10px;min-width:0">
            <div style="font-size:11px;color:var(--text-3);margin-bottom:3px">Sekolah</div>
            <div style="font-weight:600;font-size:13px;word-break:break-word;overflow-wrap:anywhere">${t.schoolName}</div>
            <div style="font-size:11px;color:var(--text-2)">NPSN: ${t.schoolId}</div>
          </div>
        </div>
      </div>

      ${(t.status === 'Dalam Proses' || t.status === 'Selesai') ? `
      <!-- BAGIAN 2: PROSES (ORANYE) -->
      <div style="background:#fff3e0;border:2px solid #ffb74d;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-size:12px;color:#ff8c00;font-weight:700;margin-bottom:8px;text-transform:uppercase;display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m5.08 0l4.24 4.24"/></svg> Dalam Proses</div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Status Diubah: ${processDate}</div>
        <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Catatan Tindak Lanjut</div>
          <div style="line-height:1.6;font-size:13px;color:var(--text);word-break:break-word;overflow-wrap:anywhere">${processNotes || '(Belum ada catatan)'}</div>
        </div>
        ${processPhotosHTML}
      </div>
      ` : ''}

      ${t.status === 'Selesai' ? `
      <!-- BAGIAN 3: PENYELESAIAN (HIJAU) -->
      <div style="background:var(--success-pale);border:2px solid var(--success);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--success);font-weight:700;margin-bottom:8px;text-transform:uppercase;display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Selesai</div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Selesai: ${completeDate}</div>
        <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px;border:1px solid #a9dfbf">
          <div style="font-size:12px;color:var(--success);margin-bottom:4px;font-weight:600">Laporan ini telah selesai ditangani oleh pihak sekolah.</div>
          <div style="line-height:1.6;font-size:13px;color:var(--text);word-break:break-word;overflow-wrap:anywhere">${completeNotes || '(Tidak ada catatan penyelesaian.)'}</div>
        </div>
        ${completePhotosHTML}
      </div>
      ` : ''}

      ${isSchool && t.status !== 'Selesai' ? `
      <!-- FORM AKSI (Untuk sekolah yang belum selesai) -->
      <div style="border-top:2px solid var(--border);padding-top:16px;margin-top:16px">
        <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--primary);display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${t.status === 'Baru' ? 'Catatan Proses' : 'Catatan Penyelesaian'}</div>
        <textarea id="ticketNotes" placeholder="${t.status === 'Baru' ? 'Tuliskan langkah tindak lanjut yang telah dilakukan...' : 'Tuliskan hasil akhir penyelesaian laporan...'}" style="margin-bottom:12px;min-height:80px;width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-family:inherit">${t.status === 'Baru' ? processNotes : completeNotes}</textarea>
        
        <div style="font-size:12px;color:var(--text-3);margin-bottom:12px;background:var(--neutral);padding:10px;border-radius:6px">
          ${t.status === 'Baru' ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> Foto tindak lanjut opsional saat memproses laporan.' : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Foto tindak lanjut wajib untuk menyelesaikan laporan.'}
        </div>
        
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('followUpPhotoInputCamera').click()" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Ambil Foto</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('followUpPhotoInputGallery').click()" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Dari Galeri</button>
        </div>
        
        <div style="font-size:11px;color:var(--text-3);text-align:center;margin-bottom:12px">Maks. 3 foto, JPG/PNG</div>
        <div id="followUpPreview" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px"></div>
        
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${t.status === 'Baru' ? `<button class="btn btn-sm" style="background:var(--warning-pale);color:var(--warning);border:2px solid #f9e79f;flex:1;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px" onclick="updateStatusModal('${t.id}','Dalam Proses')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Proses Laporan</button>` : ''}
          ${t.status === 'Dalam Proses' ? `<button class="btn btn-sm" style="background:var(--success-pale);color:var(--success);border:2px solid #a9dfbf;flex:1;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px" onclick="updateStatusModal('${t.id}','Selesai')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Selesaikan Laporan</button>` : ''}
        </div>
      </div>
      ` : ''}
    `;
  };
  fetchAndRender();
}

function updateStatus(id, status) {
  const DB = loadDB();
  const t = DB.tickets.find(x => x.id === id);
  if (t) {
    t.status = status;
    if (window.fbUpdateTicket) window.fbUpdateTicket(id, { status });
  }
  renderSchoolTickets();
  updateSchoolStats();
}

function updateStatusModal(id, status) {
  const notes = document.getElementById('ticketNotes')?.value.trim() || '';
  if (!notes) return alert('Harap isi catatan tindak lanjut sebelum menyimpan.');
  const photoUpdates = followUpPhotoFiles.length ? followUpPhotoFiles : null;
  const DB = loadDB();
  const t = DB.tickets.find(x => x.id === id);
  if (!t) return;
  const hasExistingProcessPhotos = (Array.isArray(t.processPhotos) && t.processPhotos.length > 0)
    || (Array.isArray(t.followUpPhotos) && t.followUpPhotos.length > 0);
  const hasExistingCompletePhotos = Array.isArray(t.completePhotos) && t.completePhotos.length > 0;
  if (status === 'Selesai' && !photoUpdates && !hasExistingProcessPhotos && !hasExistingCompletePhotos) {
    return alert('Harap lampirkan minimal 1 foto tindak lanjut.');
  }
  
  const confirmMsg = status === 'Dalam Proses' 
    ? 'Anda akan mengubah status laporan menjadi "Dalam Proses". Pastikan catatan dan lampiran sudah benar.\n\nLanjutkan?'
    : 'Anda akan menyelesaikan laporan. Status tidak bisa diubah setelah ini.\n\nLanjutkan?';
  
  if (!confirm(confirmMsg)) return;
  
  (async () => {
    t.status = status;

    const updatePayload = { status };

    if (status === 'Dalam Proses') {
      t.processNotes = notes;
      t.notes = notes; // backward compatibility
      updatePayload.processNotes = notes;
      updatePayload.notes = notes;

      if (photoUpdates) {
        t.processPhotos = photoUpdates;
        t.followUpPhotos = photoUpdates; // backward compatibility
        updatePayload.processPhotos = photoUpdates;
        updatePayload.followUpPhotos = photoUpdates;
      }
    }

    if (status === 'Selesai') {
      t.completeNotes = notes;
      t.notes = notes; // backward compatibility
      updatePayload.completeNotes = notes;
      updatePayload.notes = notes;

      if (photoUpdates) {
        t.completePhotos = photoUpdates;
        t.followUpPhotos = photoUpdates; // data terbaru untuk tampilan publik lama
        updatePayload.completePhotos = photoUpdates;
        updatePayload.followUpPhotos = photoUpdates;
      } else if (!hasExistingCompletePhotos && hasExistingProcessPhotos) {
        // Pertahankan snapshot penyelesaian jika sekolah tidak unggah ulang foto saat finalisasi
        const fallbackCompletePhotos = Array.isArray(t.processPhotos) && t.processPhotos.length > 0
          ? t.processPhotos
          : (Array.isArray(t.followUpPhotos) ? t.followUpPhotos : []);
        t.completePhotos = fallbackCompletePhotos;
        updatePayload.completePhotos = fallbackCompletePhotos;
      }
    }

    // Catat timestamp untuk proses dan penyelesaian
    const now = new Date().toISOString();
    if (status === 'Dalam Proses' && !t.processDate) {
      t.processDate = now;
    }
    if (status === 'Selesai' && !t.completeDate) {
      t.completeDate = now;
    }
    updatePayload.processDate = t.processDate;
    updatePayload.completeDate = t.completeDate;
    if (window.fbUpdateTicket) await window.fbUpdateTicket(id, updatePayload);
    followUpPhotoFiles = [];
    closeModal('ticketModal');
    renderSchoolTickets();
    updateSchoolStats();
    alert('Laporan berhasil diperbarui!');
  })();
}

// ====================== CHANGE PASSWORD ======================
function openChangePass() {
  document.getElementById('changePassAlert').innerHTML = '';
  document.getElementById('newPass1').value = '';
  document.getElementById('newPass2').value = '';
  openModal('changePassModal');
}

async function saveNewPassword() {
  const p1 = document.getElementById('newPass1').value;
  const p2 = document.getElementById('newPass2').value;
  if (p1.length < 6) return showAlert('changePassAlert', 'danger', 'Password minimal 6 karakter.');
  if (p1 !== p2) return showAlert('changePassAlert', 'danger', 'Konfirmasi password tidak cocok.');
  const DB = loadDB();
  const s = DB.schools.find(x => x.id === currentUser.school.id);
  if (s) {
    const hash = await hashPassword(p1);
    s.passwordHash = hash;
    s.firstLogin = false;
    if (window.fbUpdateSchool) await window.fbUpdateSchool(s.id, { passwordHash: hash, firstLogin: false });
    currentUser.school = s;
  }
  document.getElementById('firstLoginBanner').classList.add('hidden');
  closeModal('changePassModal');
  alert('Password berhasil diperbarui!');
}

// ====================== SCHOOL CHANGE PASSWORD (MANDIRI) ======================
function openSchoolChangePass() {
  document.getElementById('schoolChangePassAlert').innerHTML = '';
  document.getElementById('schoolOldPass').value = '';
  document.getElementById('schoolNewPass1').value = '';
  document.getElementById('schoolNewPass2').value = '';
  openModal('schoolChangePassModal');
}

async function saveSchoolPassword() {
  const oldPass = document.getElementById('schoolOldPass').value;
  const p1 = document.getElementById('schoolNewPass1').value;
  const p2 = document.getElementById('schoolNewPass2').value;
  const DB = loadDB();
  const school = DB.schools.find(x => x.id === currentUser.school.id);
  if (!school) return showAlert('schoolChangePassAlert', 'danger', 'Data sekolah tidak ditemukan.');
  if (!(await verifyPassword(oldPass, school))) return showAlert('schoolChangePassAlert', 'danger', 'Password saat ini tidak sesuai.');
  if (p1.length < 8) return showAlert('schoolChangePassAlert', 'danger', 'Password baru minimal 8 karakter.');
  if (p1 !== p2) return showAlert('schoolChangePassAlert', 'danger', 'Konfirmasi password tidak cocok.');
  const hash = await hashPassword(p1);
  school.passwordHash = hash;
  school.firstLogin = false;
  if (window.fbUpdateSchool) await window.fbUpdateSchool(school.id, { passwordHash: hash, firstLogin: false });
  currentUser.school = school;
  document.getElementById('firstLoginBanner').classList.add('hidden');
  closeModal('schoolChangePassModal');
  recordActivity('CHANGE_PASSWORD', `School: ${school.name} (${school.id})`);
  alert('Password berhasil diperbarui!');
}

// ====================== RESET PASSWORD (ADMIN) ======================
function openResetPass(npsn, name) {
  resetTargetNPSN = npsn;
  document.getElementById('resetPassContent').innerHTML = `<div class="alert alert-warning"><div class="alert-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div>Reset password untuk: <strong>${name}</strong> (NPSN: ${npsn})</div></div>`;
  document.getElementById('resetPassVal').value = '';
  openModal('resetPassModal');
}

async function doResetPass() {
  const val = document.getElementById('resetPassVal').value.trim();
  const DB = loadDB();
  const s = DB.schools.find(x => x.id === resetTargetNPSN);
  if (s) {
    const newPassword = val || resetTargetNPSN;
    const hash = await hashPassword(newPassword);
    s.passwordHash = hash;
    s.firstLogin = true;
    if (window.fbUpdateSchool) await window.fbUpdateSchool(resetTargetNPSN, { passwordHash: hash, firstLogin: true });
  }
  closeModal('resetPassModal');
  renderUserTable();
  alert('Password berhasil direset! Password baru: ' + (val || resetTargetNPSN));
}

// ====================== CETAK LAPORAN PDF ======================

function _statusLabel(status) {
  return status === 'Baru' ? 'Baru' : status === 'Dalam Proses' ? 'Dalam Proses' : 'Selesai';
}

function _statusColor(status) {
  return status === 'Baru' ? '#1a73e8' : status === 'Dalam Proses' ? '#f57c00' : '#2e7d32';
}

function _statusBg(status) {
  return status === 'Baru' ? '#e8f0fe' : status === 'Dalam Proses' ? '#fff3e0' : '#e8f5e9';
}

function _fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Cetak DAFTAR tiket (admin atau sekolah)
async function printTicketsPDF() {
  const DB = loadDB();
  let tickets = [];
  let judulLaporan = '';
  let subJudul = '';

  if (currentUser && currentUser.type === 'school') {
    tickets = DB.tickets.filter(t => isTicketForSchool(t, currentUser.school.id));
    if (schoolTicketFilter !== 'all') tickets = tickets.filter(t => t.status === schoolTicketFilter);
    judulLaporan = 'Laporan Pengaduan Sekolah';
    subJudul = currentUser.school.name + ' · NPSN: ' + currentUser.school.id;
  } else if (currentUser && currentUser.type === 'admin') {
    tickets = [...DB.tickets];
    if (adminTicketFilter !== 'all') tickets = tickets.filter(t => t.status === adminTicketFilter);
    judulLaporan = 'Rekapitulasi Laporan Pengaduan';
    subJudul = 'Suku Dinas Pendidikan Jakarta Timur I · Administrator';
  } else return;

  tickets.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = tickets.length;
  const baru = tickets.filter(t => t.status === 'Baru').length;
  const proses = tickets.filter(t => t.status === 'Dalam Proses').length;
  const selesai = tickets.filter(t => t.status === 'Selesai').length;
  const filterLabel = adminTicketFilter !== 'all' ? adminTicketFilter : (schoolTicketFilter !== 'all' ? schoolTicketFilter : 'Semua Status');
  const now = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const rows = tickets.map((t, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td><code style="font-family:monospace;font-size:11px">${t.id}</code></td>
      <td>${_fmtDate(t.date)}</td>
      ${currentUser.type === 'admin' ? `<td>${t.schoolName}</td>` : ''}
      <td>${t.topic}</td>
      <td>${t.reporter}</td>
      <td style="text-align:center">
        <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${_statusBg(t.status)};color:${_statusColor(t.status)}">${_statusLabel(t.status)}</span>
      </td>
    </tr>
  `).join('');

  const schoolColHeader = currentUser.type === 'admin' ? '<th>Sekolah</th>' : '';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${judulLaporan}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #222; background: #fff; padding: 24px 32px; }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #1a73e8; padding-bottom:12px; margin-bottom:16px; }
    .header-left .app-name { font-size: 22px; font-weight: 800; color: #1a73e8; letter-spacing: 1px; }
    .header-left .app-sub { font-size: 11px; color: #555; margin-top:2px; }
    .header-right { text-align:right; font-size: 11px; color:#555; }
    h1 { font-size: 16px; font-weight:700; color:#1a73e8; margin-bottom:2px; }
    .sub { font-size:12px; color:#555; margin-bottom:14px; }
    .stats { display:flex; gap:12px; margin-bottom:16px; }
    .stat-box { flex:1; border:1px solid #e0e0e0; border-radius:8px; padding:10px 14px; text-align:center; }
    .stat-box .num { font-size:22px; font-weight:800; }
    .stat-box .lbl { font-size:10px; color:#777; margin-top:2px; }
    .filter-info { font-size:11px; color:#555; margin-bottom:12px; background:#f5f5f5; padding:6px 12px; border-radius:6px; display:inline-block; }
    table { width:100%; border-collapse:collapse; }
    th { background:#1a73e8; color:#fff; padding:8px 10px; text-align:left; font-size:11px; font-weight:700; }
    td { padding:7px 10px; border-bottom:1px solid #eee; vertical-align:top; font-size:11px; }
    tr:nth-child(even) td { background:#f9f9f9; }
    .footer { margin-top:20px; border-top:1px solid #ddd; padding-top:10px; font-size:10px; color:#777; display:flex; justify-content:space-between; }
    @media print {
      body { padding: 12px 18px; }
      @page { margin: 1cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="app-name"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> SiLapor</div>
      <div class="app-sub">Sistem Laporan Sekolah</div>
    </div>
    <div class="header-right">
      <div>Dicetak: ${now}</div>
      <div>Suku Dinas Pendidikan Jakarta Timur I</div>
    </div>
  </div>

  <h1>${judulLaporan}</h1>
  <div class="sub">${subJudul}</div>

  <div class="stats">
    <div class="stat-box"><div class="num" style="color:#333">${total}</div><div class="lbl">Total Laporan</div></div>
    <div class="stat-box"><div class="num" style="color:#1a73e8">${baru}</div><div class="lbl">Baru</div></div>
    <div class="stat-box"><div class="num" style="color:#f57c00">${proses}</div><div class="lbl">Dalam Proses</div></div>
    <div class="stat-box"><div class="num" style="color:#2e7d32">${selesai}</div><div class="lbl">Selesai</div></div>
  </div>

  <div class="filter-info">Filter: ${filterLabel} · Menampilkan ${total} laporan</div>

  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center">No</th>
        <th>No. Tiket</th>
        <th>Tanggal</th>
        ${schoolColHeader}
        <th>Topik</th>
        <th>Pelapor</th>
        <th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888">Tidak ada data laporan</td></tr>'}</tbody>
  </table>

  <div class="footer">
    <span>© 2026 SiLapor — Dikembangkan oleh Penata Kelola Sistem dan Teknologi Informasi, Suku Dinas Pendidikan Jakarta Timur I</span>
    <span>Halaman dicetak otomatis oleh sistem</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return alert('Pop-up diblokir browser. Izinkan pop-up untuk fitur cetak.');
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// Cetak DETAIL satu tiket (dipanggil dari modal detail)
async function printSingleTicketPDF(id) {
  let t = null;
  if (window.fbGetTicketFull) t = await window.fbGetTicketFull(id);
  if (!t) {
    const DB = loadDB();
    t = DB.tickets.find(x => x.id === id);
    if (t) t = { ...t, photos: [], followUpPhotos: [] };
  }
  if (!t) return alert('Data tiket tidak ditemukan.');

  const now = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const tglLapor = _fmtDate(t.date);
  const tglProses = t.processDate ? _fmtDate(t.processDate) : '-';
  const tglSelesai = t.completeDate ? _fmtDate(t.completeDate) : '-';
  const { processNotes, completePhotos, processPhotos } = resolveTicketProgressData(t);

  const photosHTML = t.photos && t.photos.length > 0
    ? `<div class="section-label" style="display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Foto Laporan</div>
       <div class="photo-grid">${t.photos.map(p => `<img src="${p}" class="photo">`).join('')}</div>`
    : '';

  const processPhotosHTML = processPhotos && processPhotos.length > 0
    ? `<div class="section-label" style="color:#2e7d32;display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Foto Tindak Lanjut</div>
       <div class="photo-grid">${processPhotos.map(p => `<img src="${p}" class="photo">`).join('')}</div>`
    : '';

  const completePhotosHTML = completePhotos && completePhotos.length > 0
    ? `<div class="section-label" style="color:#2e7d32;display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Foto Penyelesaian</div>
       <div class="photo-grid">${completePhotos.map(p => `<img src="${p}" class="photo">`).join('')}</div>`
    : '';

  const prosesBlock = (t.status === 'Dalam Proses' || t.status === 'Selesai') ? `
    <div class="block orange">
      <div class="block-title" style="color:#f57c00;display:flex;align-items:center;gap:5px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f57c00" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m5.08 0l4.24 4.24"/></svg> Dalam Proses</div>
      <div class="row-2col">
        <div><div class="lbl">Tanggal Diproses</div><div class="val">${tglProses}</div></div>
        <div><div class="lbl">Catatan Tindak Lanjut</div><div class="val">${processNotes || '(Belum ada catatan)'}</div></div>
      </div>
      ${processPhotosHTML}
    </div>` : '';

  const selesaiBlock = t.status === 'Selesai' ? `
    <div class="block green">
      <div class="block-title" style="color:#2e7d32;display:flex;align-items:center;gap:5px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Selesai</div>
      <div class="lbl">Tanggal Selesai</div>
      <div class="val">${tglSelesai}</div>
      ${completePhotosHTML}
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Detail Laporan ${t.id}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size:12px; color:#222; background:#fff; padding:24px 32px; }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #1a73e8; padding-bottom:12px; margin-bottom:16px; }
    .header-left .app-name { font-size:22px; font-weight:800; color:#1a73e8; }
    .header-left .app-sub { font-size:11px; color:#555; margin-top:2px; }
    .header-right { text-align:right; font-size:11px; color:#555; }
    .ticket-id { font-size:18px; font-weight:800; color:#1a73e8; font-family:monospace; margin-bottom:4px; }
    .status-badge { display:inline-block; padding:3px 14px; border-radius:20px; font-size:12px; font-weight:700; background:${_statusBg(t.status)}; color:${_statusColor(t.status)}; margin-bottom:14px; }
    .block { border-radius:10px; padding:14px 16px; margin-bottom:14px; }
    .block.blue { background:#e8f0fe; border:2px solid #1a73e8; }
    .block.orange { background:#fff3e0; border:2px solid #ffb74d; }
    .block.green { background:#e8f5e9; border:2px solid #81c784; }
    .block-title { font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:10px; }
    .row-2col { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
    .row-4col { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; margin-bottom:10px; }
    .inner { background:#fff; border-radius:6px; padding:10px; }
    .lbl { font-size:10px; color:#777; margin-bottom:3px; }
    .val { font-size:12px; font-weight:600; line-height:1.5; }
    .section-label { font-size:11px; font-weight:700; margin-bottom:6px; margin-top:8px; color:#555; }
    .photo-grid { display:flex; gap:8px; margin-bottom:8px; }
    .photo { width:100px; height:100px; object-fit:cover; border-radius:6px; border:1px solid #ddd; }
    .footer { margin-top:20px; border-top:1px solid #ddd; padding-top:10px; font-size:10px; color:#777; display:flex; justify-content:space-between; }
    @media print {
      body { padding:12px 18px; }
      @page { margin:1cm; size:A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="app-name"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> SiLapor</div>
      <div class="app-sub">Sistem Laporan Sekolah</div>
    </div>
    <div class="header-right">
      <div>Dicetak: ${now}</div>
      <div>Suku Dinas Pendidikan Jakarta Timur I</div>
    </div>
  </div>

  <div class="ticket-id">${t.id}</div>
  <span class="status-badge">${_statusLabel(t.status)}</span>

  <div class="block blue">
    <div class="block-title" style="color:#1a73e8;display:flex;align-items:center;gap:5px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> Laporan Awal — Dilaporkan: ${tglLapor}</div>
    <div class="inner" style="margin-bottom:10px">
      <div class="lbl">Topik</div>
      <div class="val">${t.topic}</div>
    </div>
    <div class="inner" style="margin-bottom:10px">
      <div class="lbl">Deskripsi</div>
      <div class="val" style="font-weight:400;line-height:1.7">${t.desc}</div>
    </div>
    <div class="row-2col">
      <div class="inner">
        <div class="lbl">Pelapor</div>
        <div class="val">${t.reporter}</div>
        <div style="font-size:11px;color:#777;margin-top:2px">${t.wa || ''}</div>
      </div>
      <div class="inner">
        <div class="lbl">Sekolah</div>
        <div class="val">${t.schoolName}</div>
        <div style="font-size:11px;color:#777;margin-top:2px">NPSN: ${t.schoolId}</div>
      </div>
    </div>
    ${photosHTML}
  </div>

  ${prosesBlock}
  ${selesaiBlock}

  <div class="footer">
    <span>© 2026 SiLapor — Penata Kelola Sistem dan Teknologi Informasi, Suku Dinas Pendidikan Jakarta Timur I</span>
    <span>ID: ${t.id}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return alert('Pop-up diblokir browser. Izinkan pop-up untuk fitur cetak.');
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// ====================== LIGHTBOX FOTO ======================
function openPhotoLightbox(src) {
  document.getElementById('photoLightboxImg').src = src;
  document.getElementById('photoLightboxModal').classList.add('show');
}
function closePhotoLightbox() {
  document.getElementById('photoLightboxModal').classList.remove('show');
  document.getElementById('photoLightboxImg').src = '';
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closePhotoLightbox();
});

// ====================== MODAL HELPERS ======================
function openModal(id) { document.getElementById(id).classList.add('show') }
function closeModal(id) { document.getElementById(id).classList.remove('show') }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('show') });
});

// ====================== ALERT ======================
function showAlert(elId, type, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}"><div class="alert-icon">${type === 'success' ? SVGIcons.check : type === 'danger' ? SVGIcons.x : SVGIcons.info}</div><div>${msg}</div></div>`;
  const delay = type === 'success' ? 8000 : 12000;
  setTimeout(() => { el.innerHTML = ''; }, delay);
}

// ====================== FOLLOW-UP PHOTO UPLOAD ======================
function handleFollowUpPhotos(inp) {
  const files = Array.from(inp.files).slice(0, 3);
  if (files.length === 0) return;
  ['followUpPhotoInput', 'followUpPhotoInputCamera', 'followUpPhotoInputGallery'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== inp) el.value = '';
  });
  const prev = document.getElementById('followUpPreview');
  if (!prev) return;
  prev.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:10px;color:var(--text-3);font-size:13px">Mengompresi foto...</div>';

  compressImages(files, 100).then(compressedDataUrls => {
    followUpPhotoFiles = compressedDataUrls;
    prev.innerHTML = '';
    compressedDataUrls.forEach(dataUrl => {
      const img = document.createElement('img');
      img.style.cssText = 'width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border)';
      img.src = dataUrl;
      prev.appendChild(img);
    });
  }).catch(() => {
    prev.innerHTML = '<div style="grid-column:1/-1;color:var(--danger);font-size:13px;display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Gagal memproses foto. Coba lagi.</div>';
  });
}

// ====================== TRACKING ======================
function _setLupaTiketBtnVisible(visible) {
  const wrap = document.getElementById('lupaTiketBtnWrap');
  if (wrap) wrap.style.display = visible ? '' : 'none';
}

function resetTracking() {
  const trackInput = document.getElementById('trackInput');
  const trackResult = document.getElementById('trackResult');
  if (trackInput) trackInput.value = '';
  if (trackResult) trackResult.innerHTML = '';
  _setLupaTiketBtnVisible(true);
}

async function trackReport() {
  const id = document.getElementById('trackInput').value.trim().toUpperCase();
  const el = document.getElementById('trackResult');
  if (!id) { el.innerHTML = '<div class="alert alert-warning"><div class="alert-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div>Masukkan nomor tiket terlebih dahulu.</div></div>'; _setLupaTiketBtnVisible(true); return; }
  el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-3)">Mencari laporan...</div>';

  let t = null;
  if (window.fbGetTicketFull) t = await window.fbGetTicketFull(id);
  if (!t) {
    const DB = loadDB();
    const cached = DB.tickets.find(x => x.id === id);
    if (cached) t = { ...cached, photos: [], followUpPhotos: [] };
  }
  if (!t) { el.innerHTML = `<div class="alert alert-danger"><div class="alert-icon">${SVGIcons.x}</div><div>Nomor tiket <strong>${id}</strong> tidak ditemukan.</div></div>`; _setLupaTiketBtnVisible(true); return; }
  _setLupaTiketBtnVisible(false);

  const fmtDateTime = iso => iso ? new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  const date        = fmtDateTime(t.date);
  const processDate  = fmtDateTime(t.processDate);
  const completeDate = fmtDateTime(t.completeDate);
  const { processNotes, completeNotes, processPhotos, completePhotos } = resolveTicketProgressData(t);

  const statusClass = t.status === 'Baru' ? 'badge-new' : t.status === 'Dalam Proses' ? 'badge-process' : 'badge-done';
  const statusIcon  = t.status === 'Baru' ? '<span style="font-size:11px;font-weight:bold;color:var(--primary)">NEW</span>' : t.status === 'Dalam Proses' ? SVGIcons.gear : SVGIcons.check;

  // Steps status (tanpa sub-label waktu agar tidak duplikatif dengan timeline)
  const steps = [
    { label: 'Laporan Dikirim',  done: true },
    { label: 'Diterima Sekolah', done: t.status !== 'Baru' },
    { label: 'Dalam Proses',     done: t.status === 'Dalam Proses' || t.status === 'Selesai' },
    { label: 'Selesai',          done: t.status === 'Selesai' }
  ];

  const reportPhotosHTML = t.photos && t.photos.length > 0 ? `
    <div style="margin-top:12px">
      <div style="font-size:12px;color:var(--text-3);margin-bottom:6px;font-weight:600;display:flex;align-items:center;gap:5px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Foto Laporan (${t.photos.length})
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${t.photos.map(p => `<img src="${p}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="openPhotoLightbox(this.src)">`).join('')}
      </div>
    </div>` : '';

  const processPhotosHTML = processPhotos && processPhotos.length > 0 ? `
    <div style="margin-top:12px">
      <div style="font-size:12px;color:var(--text-3);margin-bottom:6px;font-weight:600;display:flex;align-items:center;gap:5px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Foto Tindak Lanjut (${processPhotos.length})
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${processPhotos.map(p => `<img src="${p}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="openPhotoLightbox(this.src)">`).join('')}
      </div>
    </div>` : '';

  const completePhotosHTML = completePhotos && completePhotos.length > 0 ? `
    <div style="margin-top:12px">
      <div style="font-size:12px;color:var(--text-3);margin-bottom:6px;font-weight:600;display:flex;align-items:center;gap:5px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Foto Penyelesaian (${completePhotos.length})
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${completePhotos.map(p => `<img src="${p}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="openPhotoLightbox(this.src)">`).join('')}
      </div>
    </div>` : '';

  const reportHistoryBlock = `
    <div style="background:var(--primary-pale);border:2px solid var(--primary);border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="font-size:12px;color:var(--primary);font-weight:700;margin-bottom:8px;text-transform:uppercase;display:flex;align-items:center;gap:5px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
        Laporan Awal
      </div>
      <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Dilaporkan: ${date}</div>
      <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px">
        <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Topik</div>
        <div style="font-weight:600;font-size:14px;word-break:break-word;overflow-wrap:anywhere">${t.topic}</div>
      </div>
      <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px">
        <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Deskripsi</div>
        <div style="line-height:1.6;font-size:13px;word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap">${t.desc || '(Tidak ada deskripsi)'}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:#fff;border-radius:8px;padding:10px;min-width:0">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:3px">Pelapor</div>
          <div style="font-weight:600;font-size:13px;word-break:break-word;overflow-wrap:anywhere">${t.reporter || '-'}</div>
          <div style="font-size:11px;color:var(--text-2);word-break:break-all">${t.wa || '-'}</div>
        </div>
        <div style="background:#fff;border-radius:8px;padding:10px;min-width:0">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:3px">Sekolah</div>
          <div style="font-weight:600;font-size:13px;word-break:break-word;overflow-wrap:anywhere">${t.schoolName}</div>
          <div style="font-size:11px;color:var(--text-2)">NPSN: ${t.schoolId}</div>
        </div>
      </div>
      ${reportPhotosHTML}
    </div>`;

  const processHistoryBlock = (t.status === 'Dalam Proses' || t.status === 'Selesai') ? `
    <div style="background:#fff3e0;border:2px solid #ffb74d;border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="font-size:12px;color:#ff8c00;font-weight:700;margin-bottom:8px;text-transform:uppercase;display:flex;align-items:center;gap:5px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m5.08 0l4.24 4.24"/></svg>
        Dalam Proses
      </div>
      <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Status Diubah: ${processDate || '—'}</div>
      <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px">
        <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">Catatan Tindak Lanjut</div>
        <div style="line-height:1.6;font-size:13px;color:var(--text);word-break:break-word;overflow-wrap:anywhere">${processNotes || '(Belum ada catatan)'}</div>
      </div>
      ${processPhotosHTML}
    </div>` : '';

  const completeHistoryBlock = t.status === 'Selesai' ? `
    <div style="background:var(--success-pale);border:2px solid var(--success);border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="font-size:12px;color:var(--success);font-weight:700;margin-bottom:8px;text-transform:uppercase;display:flex;align-items:center;gap:5px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Selesai
      </div>
      <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Selesai: ${completeDate || '—'}</div>
      <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px;border:1px solid #a9dfbf">
        <div style="font-size:12px;color:var(--success);margin-bottom:4px;font-weight:600">Laporan ini telah selesai ditangani oleh pihak sekolah.</div>
        <div style="line-height:1.6;font-size:13px;color:var(--text);word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap">${completeNotes || '(Tidak ada catatan penyelesaian.)'}</div>
      </div>
      ${completePhotosHTML}
    </div>` : '';

  // Timeline blok waktu — hanya tampil jika status sudah melewati "Baru"
  const timelineHTML = (t.status === 'Dalam Proses' || t.status === 'Selesai') ? `
    <div style="background:#fff;border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="font-size:11px;color:var(--text-3);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:5px">
        ${SVGIcons.clock} Riwayat Waktu Penanganan
      </div>
      <div style="display:flex;flex-direction:column;gap:0">

        <!-- Laporan Dikirim -->
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="display:flex;flex-direction:column;align-items:center;width:20px;flex-shrink:0">
            <div style="width:16px;height:16px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </div>
            <div style="width:2px;flex:1;background:var(--border);min-height:20px;margin-top:2px"></div>
          </div>
          <div style="padding-bottom:14px;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--primary)">Laporan Dikirim</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">${date}</div>
          </div>
        </div>

        <!-- Dalam Proses -->
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="display:flex;flex-direction:column;align-items:center;width:20px;flex-shrink:0">
            <div style="width:16px;height:16px;border-radius:50%;background:#f39c12;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/></svg>
            </div>
            ${t.status === 'Selesai' ? `<div style="width:2px;flex:1;background:var(--border);min-height:20px;margin-top:2px"></div>` : ''}
          </div>
          <div style="padding-bottom:${t.status === 'Selesai' ? '14' : '0'}px;min-width:0">
            <div style="font-size:12px;font-weight:600;color:#f39c12">Dalam Proses</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">${processDate || '—'}</div>
          </div>
        </div>

        ${t.status === 'Selesai' ? `
        <!-- Selesai -->
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="display:flex;flex-direction:column;align-items:center;width:20px;flex-shrink:0">
            <div style="width:16px;height:16px;border-radius:50%;background:var(--success);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--success)">Selesai</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">${completeDate || '—'}</div>
          </div>
        </div>` : ''}

      </div>
    </div>` : '';

  el.innerHTML = `
    <div style="background:var(--primary-pale);border:1px solid #aed6f1;border-radius:12px;padding:16px;margin-top:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div>
          <div style="font-size:11px;color:var(--text-3)">Nomor Tiket</div>
          <div style="font-size:18px;font-weight:700;color:var(--primary);font-family:'Sora',sans-serif">${t.id}</div>
        </div>
        <span class="badge ${statusClass}" style="font-size:13px;padding:6px 14px">${t.status}</span>
      </div>
      <div class="steps" style="margin-bottom:12px">
        ${steps.map(s => `
          <div class="step ${s.done ? 'done' : ''}" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;padding:10px 8px;min-height:64px">
            <span class="step-num">${s.done ? '✓' : ''}</span>
            <span style="font-size:11px;font-weight:600;line-height:1.25;text-align:center">${s.label}</span>
          </div>`).join('')}
      </div>
      ${t.incidentDate ? `<div style="background:#fff7f4;border:1px solid #f5c2b7;border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px;color:var(--danger);display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Tanggal kejadian: <strong>${new Date(t.incidentDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>` : ''}
      ${timelineHTML}
      ${reportHistoryBlock}
      ${processHistoryBlock}
      ${completeHistoryBlock}
      ${t.status === 'Baru' ? '<div style="background:var(--warning-pale);border-radius:8px;padding:12px;border:1px solid #f9e79f;font-size:13px;color:var(--warning)">Laporan Anda sedang menunggu tindak lanjut dari pihak sekolah.</div>' : ''}
    </div>`;
}

// ====================== ADMIN CHANGE PASSWORD ======================
function openAdminChangePass() {
  document.getElementById('adminChangePassAlert').innerHTML = '';
  document.getElementById('adminOldPass').value = '';
  document.getElementById('adminNewPass1').value = '';
  document.getElementById('adminNewPass2').value = '';
  openModal('adminChangePassModal');
}

async function saveAdminPassword() {
  const old = document.getElementById('adminOldPass').value;
  const p1 = document.getElementById('adminNewPass1').value;
  const p2 = document.getElementById('adminNewPass2').value;
  const DB = loadDB();
  if (!(await verifyPassword(old, DB.admin))) return showAlert('adminChangePassAlert', 'danger', 'Password lama tidak sesuai.');
  if (p1.length < 8) return showAlert('adminChangePassAlert', 'danger', 'Password baru minimal 8 karakter.');
  if (p1 !== p2) return showAlert('adminChangePassAlert', 'danger', 'Konfirmasi password tidak cocok.');
  const hash = await hashPassword(p1);
  DB.admin.passwordHash = hash;
  if (window.fbSaveAdmin) await window.fbSaveAdmin({ username: DB.admin.username, passwordHash: hash });
  closeModal('adminChangePassModal');
  alert('Password administrator berhasil diperbarui!');
}

// ====================== TICKET SUCCESS MODAL ======================
function showTicketSuccessModal(ticketId) {
  // Buat modal jika belum ada
  if (!document.getElementById('ticketSuccessModal')) {
    const modal = document.createElement('div');
    modal.id = 'ticketSuccessModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;padding:16px';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:28px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.18)">
        <div style="margin-bottom:8px;display:flex;justify-content:center">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="34" fill="#e8f5e9" stroke="#27ae60" stroke-width="3"/>
            <polyline points="20,37 31,48 52,24" fill="none" stroke="#27ae60" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:6px">Laporan Berhasil Dikirim!</div>
        <div style="font-size:13px;color:var(--text-3);margin-bottom:20px">Simpan nomor tiket ini untuk memantau status laporan Anda.</div>
        <div style="background:var(--primary-pale,#eaf4fb);border:1.5px dashed var(--primary,#2980b9);border-radius:10px;padding:14px 16px;margin-bottom:20px">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:4px;font-weight:600;letter-spacing:.5px">NOMOR TIKET</div>
          <div id="successTicketId" style="font-size:22px;font-weight:800;color:var(--primary,#2980b9);letter-spacing:2px;font-family:'Sora',monospace"></div>
        </div>
        <button id="copyTicketBtn" onclick="copyTicketId()" style="width:100%;padding:12px;background:var(--primary,#2980b9);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px">
          ${SVGIcons.clipboard} Salin Nomor Tiket
        </button>
        <button onclick="closeTicketSuccessModal()" style="width:100%;padding:11px;background:transparent;color:var(--text-3);border:1.5px solid var(--border,#ddd);border-radius:8px;font-size:14px;cursor:pointer">Tutup</button>
      </div>`;
    document.body.appendChild(modal);
  }

  document.getElementById('successTicketId').textContent = ticketId;
  const btn = document.getElementById('copyTicketBtn');
  btn.innerHTML = SVGIcons.clipboard + ' Salin Nomor Tiket';
  btn.style.background = 'var(--primary,#2980b9)';
  document.getElementById('ticketSuccessModal').style.display = 'flex';
}

function closeTicketSuccessModal() {
  const modal = document.getElementById('ticketSuccessModal');
  if (modal) modal.style.display = 'none';
}

function copyTicketId() {
  const id = document.getElementById('successTicketId').textContent;
  if (!id) return;
  navigator.clipboard.writeText(id).then(() => {
    const btn = document.getElementById('copyTicketBtn');
    btn.innerHTML = SVGIcons.check + ' Tersalin!';
    btn.style.background = 'var(--success,#27ae60)';
    setTimeout(() => {
      btn.innerHTML = SVGIcons.clipboard + ' Salin Nomor Tiket';
      btn.style.background = 'var(--primary,#2980b9)';
    }, 2000);
  }).catch(() => {
    // Fallback untuk browser lama
    const tmp = document.createElement('input');
    tmp.value = id;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    document.body.removeChild(tmp);
    const btn = document.getElementById('copyTicketBtn');
    btn.innerHTML = SVGIcons.check + ' Tersalin!';
    btn.style.background = 'var(--success,#27ae60)';
    setTimeout(() => {
      btn.innerHTML = SVGIcons.clipboard + ' Salin Nomor Tiket';
      btn.style.background = 'var(--primary,#2980b9)';
    }, 2000);
  });
}

// ====================== INIT ======================
window.restoreLoginState = restoreLoginState;
window.renderSchoolTickets = typeof renderSchoolTickets !== 'undefined' ? renderSchoolTickets : undefined;
window.updateSchoolStats = typeof updateSchoolStats !== 'undefined' ? updateSchoolStats : undefined;
window.updateAdminStats = typeof updateAdminStats !== 'undefined' ? updateAdminStats : undefined;
window.renderAdminRecent = typeof renderAdminRecent !== 'undefined' ? renderAdminRecent : undefined;
window.renderAdminTickets = typeof renderAdminTickets !== 'undefined' ? renderAdminTickets : undefined;
window.renderSchoolTable = typeof renderSchoolTable !== 'undefined' ? renderSchoolTable : undefined;
window.renderUserTable = typeof renderUserTable !== 'undefined' ? renderUserTable : undefined;
window.currentUser = currentUser;
removeLegacySchoolRefreshButton();
genCaptcha();
document.getElementById('captchaAns').addEventListener('keyup', function(e) {
  if (e.key === 'Enter') checkCaptchaAuto();
});

// ====================== ENTER KEY SHORTCUTS ======================
(function attachEnterListeners() {
  function onEnter(ids, fn) {
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); fn(); }
      });
    });
  }

  // Login sekolah: NPSN & password
  onEnter(['sl_npsn', 'sl_pass'], schoolLogin);

  // Login admin: username & password
  onEnter(['al_user', 'al_pass'], adminLogin);

  // Lacak tiket
  onEnter(['trackInput'], trackReport);
})();

// ====================== LUPA NOMOR TIKET ======================
let ltCaptchaA = 0, ltCaptchaB = 0, ltCaptchaVerified = false;

function openLupaTiket() {
  resetLupaTiket();
  genLupaTiketCaptcha();
  populateLupaTiketSchools();
  document.getElementById('lupaTiketModal').classList.add('show');
}

function closeLupaTiket() {
  document.getElementById('lupaTiketModal').classList.remove('show');
}

function resetLupaTiket() {
  ltCaptchaVerified = false;
  document.getElementById('lt_wa').value = '';
  document.getElementById('lt_email').value = '';
  document.getElementById('lt_schoolSearch').value = '';
  document.getElementById('lt_school_id').value = '';
  document.getElementById('lt_school_name').value = '';
  document.getElementById('lt_schoolDropdown').classList.remove('show');
  document.getElementById('lt_captchaAns').value = '';
  document.getElementById('lt_captchaStatus').textContent = '';
  document.getElementById('lt_captchaAns').style.borderColor = 'var(--border)';
  document.getElementById('lupaTiketAlert').innerHTML = '';
  document.getElementById('lupaTiketStep1').style.display = '';
  document.getElementById('lupaTiketStep2').style.display = 'none';
  document.getElementById('lupaTiketResults').innerHTML = '';
  genLupaTiketCaptcha();
}

function genLupaTiketCaptcha() {
  ltCaptchaA = Math.floor(Math.random() * 10) + 1;
  ltCaptchaB = Math.floor(Math.random() * 10) + 1;
  const q = document.getElementById('lt_captchaQ');
  if (q) q.textContent = ltCaptchaA + ' + ' + ltCaptchaB;
  const ans = document.getElementById('lt_captchaAns');
  if (ans) { ans.value = ''; ans.style.borderColor = 'var(--border)'; }
  ltCaptchaVerified = false;
  const s = document.getElementById('lt_captchaStatus');
  if (s) s.textContent = '';
}

function checkLupaTiketCaptcha() {
  const ans = parseInt(document.getElementById('lt_captchaAns').value);
  const statusEl = document.getElementById('lt_captchaStatus');
  const ansEl = document.getElementById('lt_captchaAns');
  if (ans === ltCaptchaA + ltCaptchaB) {
    ltCaptchaVerified = true;
    statusEl.innerHTML = SVGIcons.check + ' Verifikasi berhasil!';
    statusEl.style.color = 'var(--success)';
    ansEl.style.borderColor = 'var(--success)';
  } else if (document.getElementById('lt_captchaAns').value.length > 0) {
    ltCaptchaVerified = false;
    statusEl.innerHTML = SVGIcons.x + ' Jawaban salah';
    statusEl.style.color = 'var(--danger)';
    ansEl.style.borderColor = 'var(--danger)';
  } else {
    ltCaptchaVerified = false;
    statusEl.textContent = '';
    ansEl.style.borderColor = 'var(--border)';
  }
}

function filterLupaTiketWA(el) {
  let val = el.value;
  // Izinkan '+' hanya di posisi pertama (untuk format +62)
  if (val.startsWith('+')) {
    el.value = '+' + val.slice(1).replace(/[^0-9]/g, '');
  } else {
    el.value = val.replace(/[^0-9]/g, '');
  }
}

function populateLupaTiketSchools() {
  filterLupaTiketSchools();
}

function filterLupaTiketSchools() {
  const q = (document.getElementById('lt_schoolSearch').value || '').toLowerCase();
  const dd = document.getElementById('lt_schoolDropdown');
  const DB = loadDB();
  const matches = q.length === 0
    ? DB.schools.slice(0, 50)
    : DB.schools.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q)).slice(0, 50);

  dd.innerHTML = '';
  if (matches.length === 0) {
    dd.innerHTML = '<div class="dropdown-item" style="color:var(--text-3)">Sekolah tidak ditemukan</div>';
  } else {
    matches.forEach(s => {
      const d = document.createElement('div');
      d.className = 'dropdown-item';
      d.innerHTML = `<strong>${s.name}</strong> <span style="color:var(--text-3);font-size:11px">${s.level} · ${s.city}</span>`;
      d.onclick = () => {
        document.getElementById('lt_schoolSearch').value = s.name;
        document.getElementById('lt_school_id').value = s.id;
        document.getElementById('lt_school_name').value = s.name;
        dd.classList.remove('show');
      };
      dd.appendChild(d);
    });
  }
  dd.classList.add('show');
}

function showLupaTiketDropdown() {
  filterLupaTiketSchools();
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('#lupaTiketModal .search-select')) {
    const dd = document.getElementById('lt_schoolDropdown');
    if (dd) dd.classList.remove('show');
  }
});

function showLupaTiketAlert(type, msg) {
  const el = document.getElementById('lupaTiketAlert');
  el.innerHTML = `<div class="alert alert-${type}" style="margin-bottom:12px">
    <div class="alert-icon">${type === 'danger' ? SVGIcons.x : SVGIcons.info}</div>
    <div>${msg}</div>
  </div>`;
}

async function submitLupaTiket() {
  const alertEl = document.getElementById('lupaTiketAlert');
  alertEl.innerHTML = '';

  const wa = document.getElementById('lt_wa').value.trim();
  const email = document.getElementById('lt_email').value.trim().toLowerCase();
  const schoolId = document.getElementById('lt_school_id').value.trim();
  const schoolName = document.getElementById('lt_school_name').value.trim();

  // Validasi
  if (!wa || wa.length < 9) {
    showLupaTiketAlert('danger', 'Nomor WhatsApp tidak valid. Minimal 9 digit.');
    return;
  }
  if (!schoolId || !schoolName) {
    showLupaTiketAlert('danger', 'Pilih nama sekolah dari daftar.');
    return;
  }
  if (!ltCaptchaVerified) {
    showLupaTiketAlert('danger', 'Selesaikan verifikasi anti-bot terlebih dahulu.');
    return;
  }

  // Normalisasi nomor WA: strip +62 / 62 / 0 di awal, bandingkan digit inti
  function normalizeWA(num) {
    let s = String(num || '').replace(/\D/g, ''); // hapus semua non-digit
    if (s.startsWith('62')) s = s.slice(2);       // strip kode negara Indonesia
    s = s.replace(/^0+/, '');                     // strip leading 0
    return s;
  }
  const waNorm = normalizeWA(wa);

  // Tampilkan loading sementara fetch berjalan
  showLupaTiketAlert('info', 'Sedang mencari tiket, mohon tunggu...');

  // Kumpulkan tiket: gabungkan cache lokal + hasil fetch langsung dari Firestore
  // Fetch langsung diperlukan karena cache (window.DB.tickets) kosong saat mode publik
  const DB = loadDB();
  let tickets = [...(DB.tickets || [])];

  if (window.fbFindTicketsByWA) {
    try {
      const freshTickets = await window.fbFindTicketsByWA({
        schoolId,
        normalizedPhone: waNorm,
        email
      });
      // Merge ke tickets lokal, hindari duplikat
      const existingIds = new Set(tickets.map(t => t.id));
      freshTickets.forEach(t => {
        if (!existingIds.has(t.id)) {
          tickets.push(t);
          existingIds.add(t.id);
        }
      });
    } catch (e) {
      console.error('submitLupaTiket: gagal fetch dari Firestore, fallback ke cache', e);
    }
  }

  // Bersihkan pesan loading
  document.getElementById('lupaTiketAlert').innerHTML = '';

  // Filter dari gabungan cache + hasil fetch
  const found = tickets.filter(t => {
    const ticketSchoolId = String(t.schoolId || t.schoolID || t.npsn || t.schoolNpsn || '').trim();
    if (ticketSchoolId !== schoolId) return false;

    const ticketWA = normalizeWA(t.wa || t.phone || t.whatsapp || '');
    const waMatch = ticketWA && waNorm && (ticketWA === waNorm || ticketWA.endsWith(waNorm) || waNorm.endsWith(ticketWA));

    if (!waMatch) {
      // Coba cocokkan via email jika diisi
      if (email && t.email && t.email.toLowerCase() === email) return true;
      return false;
    }
    return true;
  });

  // Tampilkan hasil
  document.getElementById('lupaTiketStep1').style.display = 'none';
  document.getElementById('lupaTiketStep2').style.display = '';

  const resultsEl = document.getElementById('lupaTiketResults');

  if (found.length === 0) {
    resultsEl.innerHTML = `
      <div class="alert alert-warning">
        <div class="alert-icon">${SVGIcons.info}</div>
        <div>
          <strong>Tiket tidak ditemukan</strong><br>
          Tidak ada laporan yang cocok dengan nomor HP dan sekolah yang Anda masukkan. Pastikan nomor HP dan nama sekolah sesuai dengan yang digunakan saat melapor.
        </div>
      </div>`;
    return;
  }

  const statusBadge = (s) => {
    const styles = { 'Baru': 'background:var(--warning-pale);color:var(--warning)', 'Dalam Proses': 'background:var(--primary-pale);color:var(--primary-light)', 'Selesai': 'background:var(--success-pale);color:var(--success)' };
    const style = styles[s] || styles['Baru'];
    return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;${style}">${s || 'Baru'}</span>`;
  };

  const rows = found.map(t => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-family:monospace;font-size:15px;font-weight:700;color:var(--primary);letter-spacing:0.5px">${t.id}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px">${t.topic || ''} · ${t.date ? new Date(t.date).toLocaleDateString('id-ID') : ''}</div>
        <div style="margin-top:4px">${statusBadge(t.status)}</div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="closeLupaTiketAndTrack('${t.id}')" style="flex-shrink:0">
        ${SVGIcons.search} Lacak
      </button>
    </div>`).join('');

  resultsEl.innerHTML = `
    <div style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span style="font-weight:600;color:var(--success)">Ditemukan ${found.length} laporan</span>
      </div>
      <div style="font-size:12px;color:var(--text-3)">Nomor HP: <strong>${wa}</strong> · Sekolah: <strong>${schoolName}</strong></div>
    </div>
    <div>${rows}</div>`;
}

function closeLupaTiketAndTrack(ticketId) {
  closeLupaTiket();
  // Aktifkan halaman tracking tanpa reset, lalu isi input dan lacak
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-tracking').classList.add('active');
  updateSidebarActive('tracking');
  document.getElementById('trackInput').value = ticketId;
  _setLupaTiketBtnVisible(false);
  setTimeout(() => trackReport(), 100);
}