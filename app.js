if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(reg => console.log("SW registered:", reg))
      .catch(err => console.error("SW registration failed:", err));
  });
}
;

// Add this code to your app.js file, preferably near the top after the service worker registration

/* PWA Install Notification */
let deferredPrompt;
let installNotificationShown = false;

// Check if app was already installed
function isAppInstalled() {
  // Check if running in standalone mode (already installed)
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Check if user has previously dismissed install prompt
function hasUserDismissedInstall() {
  try {
    return localStorage.getItem('pwa_install_dismissed') === 'true';
  } catch (e) {
    return false;
  }
}

// Mark install prompt as dismissed
function markInstallDismissed() {
  try {
    localStorage.setItem('pwa_install_dismissed', 'true');
  } catch (e) {
    console.error('Failed to save install dismissal', e);
  }
}

// Create and show install notification
function showInstallNotification() {
  if (installNotificationShown || isAppInstalled() || hasUserDismissedInstall()) {
    return;
  }

  installNotificationShown = true;

  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'pwa-install-notification';
  notification.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    padding: 12px 16px;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-size: 14px;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
  `;

  // Notification content
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="font-size: 18px;">📱</div>
      <div>
        <div style="font-weight: 600; margin-bottom: 2px;">Install SiMISA</div>
        <div style="font-size: 12px; opacity: 0.9;">Install aplikasi untuk akses yang lebih cepat</div>
      </div>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button id="pwa-install-btn" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      ">Install</button>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        border: none;
        color: white;
        padding: 6px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s;
      ">&times;</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateY(0)';
  });

  // Handle install button click
  const installBtn = notification.querySelector('#pwa-install-btn');
  const dismissBtn = notification.querySelector('#pwa-dismiss-btn');

  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      // Reset the deferred prompt variable
      deferredPrompt = null;
      
      // Remove notification
      hideInstallNotification();
      
      if (outcome === 'accepted') {
        showToast('App sedang diinstall...', 'success');
      }
    } else {
      // Fallback: show manual install instructions
      showManualInstallInstructions();
    }
  });

  // Handle dismiss button click
  dismissBtn.addEventListener('click', () => {
    markInstallDismissed();
    hideInstallNotification();
  });

  // Auto-hide after 10 seconds if no interaction
  setTimeout(() => {
    if (document.getElementById('pwa-install-notification')) {
      hideInstallNotification();
    }
  }, 10000);
}

// Hide install notification
function hideInstallNotification() {
  const notification = document.getElementById('pwa-install-notification');
  if (notification) {
    notification.style.transform = 'translateY(-100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
}

// Show manual install instructions for browsers that don't support the install prompt
function showManualInstallInstructions() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let instructions = '';
  
  if (isIOS) {
    instructions = `
      <div style="text-align: left; line-height: 1.5;">
        <p><strong>Untuk install di iOS:</strong></p>
        <p>1. Tap tombol Share (📤) di Safari</p>
        <p>2. Pilih "Add to Home Screen"</p>
        <p>3. Tap "Add" untuk confirm</p>
      </div>
    `;
  } else if (isAndroid) {
    instructions = `
      <div style="text-align: left; line-height: 1.5;">
        <p><strong>Untuk install di Android:</strong></p>
        <p>1. Tap menu (⋮) di browser</p>
        <p>2. Pilih "Add to Home screen" atau "Install app"</p>
        <p>3. Tap "Add" atau "Install"</p>
      </div>
    `;
  } else {
    instructions = `
      <div style="text-align: left; line-height: 1.5;">
        <p><strong>Untuk install di desktop:</strong></p>
        <p>1. Cari icon install (⬇️) di address bar</p>
        <p>2. Atau buka menu browser dan pilih "Install SiMISA"</p>
        <p>3. Klik "Install" untuk confirm</p>
      </div>
    `;
  }

  // Create modal for instructions
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 320px;
      width: 90%;
      box-shadow: 0 6px 18px rgba(0,0,0,0.3);
    ">
      <h3 style="margin: 0 0 16px 0; color: #6c5ce7;">Install SiMISA</h3>
      ${instructions}
      <button id="close-instructions" style="
        background: #6c5ce7;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        margin-top: 16px;
      ">Mengerti</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-instructions').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
  
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  
  // Save the event so it can be triggered later
  deferredPrompt = e;
  
  // Show our custom install notification after a short delay
  setTimeout(() => {
    showInstallNotification();
  }, 3000); // Show after 3 seconds of app usage
});

// Listen for app installation
window.addEventListener('appinstalled', (e) => {
  console.log('PWA was installed');
  showToast('App berhasil diinstall!', 'success');
  
  // Hide any visible install notification
  hideInstallNotification();
  
  // Reset the deferred prompt
  deferredPrompt = null;
});

// Check if we should show install notification on load
document.addEventListener('DOMContentLoaded', () => {
  // Don't show immediately, wait for user to interact with the app first
  setTimeout(() => {
    // Only show if the beforeinstallprompt hasn't fired and conditions are met
    if (!deferredPrompt && !isAppInstalled() && !hasUserDismissedInstall()) {
      // For browsers that don't support beforeinstallprompt
      // Show notification after some user interaction
      let interactionCount = 0;
      
      const trackInteraction = () => {
        interactionCount++;
        if (interactionCount >= 3) { // After 3 interactions
          showInstallNotification();
          // Remove listeners after showing notification
          document.removeEventListener('click', trackInteraction);
          document.removeEventListener('touchstart', trackInteraction);
        }
      };
      
      document.addEventListener('click', trackInteraction);
      document.addEventListener('touchstart', trackInteraction);
    }
  }, 5000); // Wait 5 seconds before starting to track interactions
});

// Add manual install button to header (optional)
function addManualInstallButton() {
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !isAppInstalled() && !hasUserDismissedInstall()) {
    const installBtn = document.createElement('button');
    installBtn.className = 'btn primary';
    installBtn.style.cssText = `
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(108, 92, 231, 0.2);
    `;
    installBtn.innerHTML = '<span style="font-size: 14px;">📱</span>Install';
    installBtn.title = 'Install aplikasi ke perangkat Anda';
    
    installBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            showToast('App sedang diinstall...', 'success');
            installBtn.remove(); // Remove button after successful install
          }
          deferredPrompt = null;
        });
      } else {
        showManualInstallInstructions();
      }
    });
    
    headerActions.appendChild(installBtn);
  }
}

// Call this after DOM is loaded
setTimeout(addManualInstallButton, 1000);

/*
  - Penambahan Fitur Tanda Tangan Pada Laporan Bulanan 15/09
  - Perbaikan Bug Data di PDF
*/

const DB_NAME = 'simisa_photos';
const DB_STORE = 'photos';
let db;
function openDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME,1);
    req.onupgradeneeded = e=>{ db = e.target.result; if(!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE); };
    req.onsuccess = e=>{ db = e.target.result; resolve(db); };
    req.onerror = e=> reject(e);
  });
}
async function putPhoto(id, blob){ if(!db) await openDB(); return new Promise((resolve,reject)=>{ const tx = db.transaction(DB_STORE,'readwrite'); tx.objectStore(DB_STORE).put(blob, id); tx.oncomplete = ()=> resolve(id); tx.onerror = e=> reject(e); }); }
async function getPhoto(id){ if(!db) await openDB(); return new Promise((resolve,reject)=>{ const tx = db.transaction(DB_STORE,'readonly'); const req = tx.objectStore(DB_STORE).get(id); req.onsuccess = ()=> resolve(req.result || null); req.onerror = e=> reject(e); }); }

/* --- Photo caching with LRU and object URL management with device ram detection --- */
const PHOTO_CACHE_LIMIT = (navigator.deviceMemory && navigator.deviceMemory > 4) ? 400 : 200;
const photoCache = new Map(); // id -> Blob
const urlCache = new Map();   // id -> objectURL

function _ensureCacheLimit(){
  while(photoCache.size > PHOTO_CACHE_LIMIT){
    const oldestKey = photoCache.keys().next().value;
    photoCache.delete(oldestKey);
    const url = urlCache.get(oldestKey);
    if(url){ try{ URL.revokeObjectURL(url); }catch(e){} urlCache.delete(oldestKey); }
  }
}

async function getCachedPhoto(id){
  if(!id) return null;
  if(photoCache.has(id)){
    const val = photoCache.get(id);
    // move to end (LRU)
    photoCache.delete(id);
    photoCache.set(id, val);
    return val;
  }
  try{
    const blob = await getPhoto(id);
    if(blob){
      photoCache.set(id, blob);
      _ensureCacheLimit();
      return blob;
    }
    return null;
  }catch(err){
    console.error('getCachedPhoto failed', err);
    return null;
  }
}

function getObjectURLFor(id, blob){
  if(!id || !blob) return null;
  if(urlCache.has(id)) return urlCache.get(id);
  try{
    const u = URL.createObjectURL(blob);
    urlCache.set(id, u);
    return u;
  }catch(err){
    console.error('createObjectURL failed', err);
    return null;
  }
}

function clearPhotoCache(){
  for(const u of urlCache.values()){
    try{ URL.revokeObjectURL(u); }catch(e){}
  }
  photoCache.clear();
  urlCache.clear();
}

/* --- Utilities --- */
const $ = sel => document.querySelector(sel);
const el = id => document.getElementById(id);
const STORAGE_KEY = 'simisa_v1';

let state = { items: [], history: [] };

/* safe JSON load */
function load(){ try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) state = JSON.parse(raw); else { state.items = [ { id:'itm-1', name:'MacBook Pro', category:'Electronics', desc:'13-inch', status:'available'}, { id:'itm-2', name:'Cordless Drill', category:'Tools', desc:'Battery powered', status:'borrowed', borrowedBy:'John', borrowDate:'2025-08-05', expectedReturn:'2025-08-10'} ]; state.history = []; save(); } }catch(e){ console.error(e); state = {items:[], history:[]}; } }
function save(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){ console.error('save failed', e); } }

function uid(prefix='id'){ return prefix + '-' + Math.random().toString(36).slice(2,9); }
function formatDate(s){ if(!s) return ''; const d = new Date(s); if(isNaN(d)) return s; return d.toLocaleDateString('id-ID'); }
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function downloadText(filename, text){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:'application/json'})); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); try{ URL.revokeObjectURL(a.href); }catch(e){} }

let lastView = null;

function showView(id) {
  // switch view
  document.querySelectorAll('.view').forEach(v => v.hidden = true);
  const target = document.getElementById(id);
  if (target) {
    target.hidden = false;
    target.classList.add('fade-in');
    setTimeout(() => target.classList.remove('fade-in'), 400);
  }

  // update tabs
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === id)
  );

  if (id === 'manage') {
    if (el('manageSearch')) el('manageSearch').value = '';
    manageFilter = 'all';
    renderManage();
  }

  if (id === 'history') {
    renderHistoryList();
  }

  lastView = id;
}

/* ── Modal helpers ── */
function _resetBorrowModal() {
  const today = new Date().toISOString().split('T')[0];
  if (el('borrowDate')) { el('borrowDate').value = today; el('borrowDate').readOnly = true; }
  if (el('expectedReturn')) el('expectedReturn').value = today;
  if (el('borrower')) el('borrower').value = '';
  resetPhotoFrame('borrowPhotoContainer', 'borrowPhoto', 'borrowPreview');
  if (el('borrowForm')) el('borrowForm').reset();
  try { if (window.__borrowSignPad) window.__borrowSignPad.clear(); } catch(e) {}
  // restore today after reset
  if (el('borrowDate')) el('borrowDate').value = today;
  if (el('expectedReturn')) el('expectedReturn').value = today;
}

function _resetReturnModal() {
  const today = new Date().toISOString().split('T')[0];
  if (el('returnDate')) { el('returnDate').value = today; el('returnDate').readOnly = true; }
  resetPhotoFrame('returnPhotoContainer', 'returnPhoto', 'returnPreview');
  if (el('returnForm')) el('returnForm').reset();
  try { if (window.__returnSignPad) window.__returnSignPad.clear(); } catch(e) {}
  if (el('returnDate')) el('returnDate').value = today;
}

function _openModal(modalId, setupFn) {
  const modal = el(modalId);
  if (!modal) return;
  if (setupFn) setupFn();
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function _closeModal(modalId) {
  const modal = el(modalId);
  if (!modal) return;
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

function openBorrowModal(preSelectId) {
  _openModal('borrowModal', () => {
    populateSelects();
    _resetBorrowModal();
    if (preSelectId && el('borrowSelect')) el('borrowSelect').value = preSelectId;
    // init signature pad lazily
    if (!window.__borrowSignPad && el('borrowSign')) {
      window.__borrowSignPad = makeSignaturePad('borrowSign', 'clearBorrowSign');
    }
  });
}

function closeBorrowModal() { _closeModal('borrowModal'); }

function openReturnModal(preSelectId) {
  _openModal('returnModal', () => {
    populateSelects();
    _resetReturnModal();
    if (preSelectId && el('returnSelect')) el('returnSelect').value = preSelectId;
    if (!window.__returnSignPad && el('returnSign')) {
      window.__returnSignPad = makeSignaturePad('returnSign', 'clearReturnSign');
    }
  });
}

function closeReturnModal() { _closeModal('returnModal'); }


/* --- UI rendering with chunking and cancellation tokens --- */
const renderTokens = {};

function cancelRender(key){
  renderTokens[key] = (renderTokens[key] || 0) + 1;
}

function getRenderToken(key){ return (renderTokens[key] || 0) + 1; }

/* chunked render helper */
async function renderInBatches(key, items, batchSize, renderFn, container){
  const token = getRenderToken(key);
  renderTokens[key] = token;
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(let i=0;i<items.length;i++){
    if(renderTokens[key] !== token) return; // cancelled
    const node = renderFn(items[i], i);
    frag.appendChild(node);
    if((i+1) % batchSize === 0){
      container.appendChild(frag);
      // small pause to keep UI responsive
      await new Promise(r => setTimeout(r, 0));
    }
  }
  if(renderTokens[key] === token) container.appendChild(frag);
}

/* Render parts */
function renderStats(){
  const total = state.items.length;
  const avail = state.items.filter(i=>i.status==='available').length;
  const borrowed = state.items.filter(i=>i.status==='borrowed').length;
  el('totalN').textContent = total;
  el('availN').textContent = avail;
  el('borrowedN').textContent = borrowed;
}

/* helper: fetch blobs in batches (keeps UI responsive & avoids too many concurrent IDB reads) */
async function fetchBlobsInBatches(ids, batchSize = 8){
  const results = new Array(ids.length).fill(null);
  for(let i=0;i<ids.length;i+=batchSize){
    const slice = ids.slice(i, i+batchSize);
    const promises = slice.map(id => id ? getCachedPhoto(id) : Promise.resolve(null));
    try{
      const res = await Promise.all(promises);
      for(let j=0;j<res.length;j++) results[i+j] = res[j];
    }catch(err){
      console.error('batch photo fetch error', err);
      for(let j=0;j<slice.length;j++) results[i+j] = null;
    }
    // yield
    await new Promise(r => setTimeout(r, 0));
  }
  return results;
}

async function renderDashboardList(){
  const itemsWrap = el('items');
  const q = el('q').value.trim().toLowerCase();
  const list = state.items.filter(it => {
    if (dashboardFilter !== 'all' && it.status !== dashboardFilter) return false;
    if(!q) return true;
    return (it.name||'').toLowerCase().includes(q) || (it.category||'').toLowerCase().includes(q) || (it.desc||'').toLowerCase().includes(q) || (it.borrowedBy||'').toLowerCase().includes(q);
  });

  if(list.length===0){
    itemsWrap.innerHTML = '<div class="card"><div class="meta">Tidak ada barang yang ditemukan.</div></div>';
    return;
  }

  // prepare photo fetches in batches
  const photoIds = list.map(it => it.photo || null);
  const blobs = await fetchBlobsInBatches(photoIds, 10);

  const renderFn = (it, idx) => {
    const blob = blobs[idx];
    const card = document.createElement('div'); card.className = 'card ' + (it.status === 'available' ? 'available' : 'borrowed'); card.dataset.id = it.id;
    const top = document.createElement('div'); top.className='top';
    top.appendChild(document.createElement('div')).textContent = it.category || '';
    const badge = document.createElement('div'); badge.className = 'badge ' + (it.status==='available'?'available':'borrowed');
    badge.textContent = it.status==='available' ? 'Tersedia' : 'Dipinjam';
    top.appendChild(badge);
    card.appendChild(top);
    const h = document.createElement('h3'); h.textContent = it.name; card.appendChild(h);
    const p = document.createElement('div'); p.className='meta'; p.textContent = it.desc || ''; card.appendChild(p);

    if(it.status==='borrowed'){
      const by = document.createElement('div'); by.className='meta'; const timeTxt = it.borrowTime ? ` • ${it.borrowTime}` : '';
      by.textContent = `Dipinjam oleh: ${it.borrowedBy} • ${formatDate(it.borrowDate)}${timeTxt}${it.expectedReturn? ' • perkiraan: ' + formatDate(it.expectedReturn):''}`;
      card.appendChild(by);
    }

    if(blob){
      const preview = document.createElement('div'); preview.className='preview';
      const img = document.createElement('img'); img.loading='lazy';
      const url = getObjectURLFor(it.photo, blob);
      img.src = url || '';
      img.alt = it.name + ' photo'; img.style.maxHeight='220px'; img.style.objectFit='cover';
      img.addEventListener('click', ()=> openImageModal(url));
      preview.appendChild(img); card.appendChild(preview);
    }

    const actions = document.createElement('div'); actions.className='actions';

    if(it.status==='available'){
      const borrowBtn = document.createElement('button'); borrowBtn.className='btn primary'; borrowBtn.textContent='Pinjam';
      borrowBtn.dataset.action = 'borrow'; borrowBtn.dataset.id = it.id;
      actions.appendChild(borrowBtn);
    } else {
      const returnBtn = document.createElement('button'); returnBtn.className='btn borrowed-return'; returnBtn.textContent='Tandai dikembalikan';
      returnBtn.dataset.action = 'return'; returnBtn.dataset.id = it.id;
      actions.appendChild(returnBtn);
    }
    card.appendChild(actions);
    return card;
  };

  await renderInBatches('dashboard', list, 20, renderFn, itemsWrap);
}

async function renderHistoryList(){
  const historyWrap = el('historyList'); historyWrap.innerHTML='';
  const selectedMonth = el('historyMonth')?.value || '';
  let historyData = state.history.slice().reverse();
  if (selectedMonth) {
    historyData = historyData.filter(h => {
      const date = new Date(h.date);
      const monthStr = date.toISOString().slice(0, 7);
      return monthStr === selectedMonth;
    });
  }
  if(historyData.length===0){ historyWrap.innerHTML = '<div class="card"><div class="meta">Tidak ada riwayat untuk bulan ini.</div></div>'; return; }

  // collect both photos and signatures
  const photoIds = [];
  historyData.forEach(h => {
    if(h.photo) photoIds.push(h.photo);
    if(h.signPhoto) photoIds.push(h.signPhoto);
  });

  const blobs = await fetchBlobsInBatches(photoIds, 10);

  // map id -> blob
  const blobMap = {};
  for(let i=0;i<photoIds.length;i++){
    blobMap[photoIds[i]] = blobs[i];
  }

  const renderFn = (h, idx) => {
    const c = document.createElement('div'); c.className='card';
    const t = document.createElement('div'); t.className='meta'; const timeTxt = h.time ? ` • ${h.time}` : '';
    t.textContent = `${h.action.toUpperCase()} • ${h.itemName} • ${h.by || h.borrower || ''} • ${formatDate(h.date)}${timeTxt}`;
    c.appendChild(t);

    if(h.photo && blobMap[h.photo]){
      const pv = document.createElement('div'); pv.className='preview';
      const im = document.createElement('img'); im.loading='lazy';
      const url = getObjectURLFor(h.photo, blobMap[h.photo]);
      im.src = url || '';
      im.alt='photo'; im.style.maxHeight='180px'; im.style.objectFit='cover';
      im.addEventListener('click', ()=> openImageModal(url));
      pv.appendChild(im); c.appendChild(pv);
    }

    // signature below photo
    if(h.signPhoto && blobMap[h.signPhoto]){
      const sigWrap = document.createElement('div');
      sigWrap.className = 'meta';
      sigWrap.style.marginTop = '8px';
      sigWrap.style.display = 'flex';
      sigWrap.style.flexDirection = 'column';
      sigWrap.style.gap = '6px';

      const lbl = document.createElement('div');
      lbl.textContent = 'Tanda Tangan:';
      lbl.style.fontSize = '12px';
      lbl.style.color = '#444';
      sigWrap.appendChild(lbl);

      const sigImg = document.createElement('img'); sigImg.loading='lazy';
      sigImg.src = getObjectURLFor(h.signPhoto, blobMap[h.signPhoto]) || '';
      sigImg.alt = 'signature';
      sigImg.style.maxHeight = '80px';
      sigImg.style.objectFit = 'contain';
      sigImg.style.border = '1px solid #eee';
      sigImg.style.borderRadius = '6px';
      sigWrap.appendChild(sigImg);
      c.appendChild(sigWrap);
    }

    return c;
  };

  await renderInBatches('history', historyData, 20, renderFn, historyWrap);
}

function populateSelects(){
  const borrowSel = el('borrowSelect'); if(borrowSel) borrowSel.innerHTML = '<option value="">Pilih barang yang tersedia…</option>';
  const returnSel = el('returnSelect'); if(returnSel) returnSel.innerHTML = '<option value="">Pilih barang yang dipinjam…</option>';
  for(const it of state.items){
    if(it.status==='available' && borrowSel) borrowSel.insertAdjacentHTML('beforeend', `<option value="${it.id}">${escapeHtml(it.name)} ${it.category? ' ('+escapeHtml(it.category)+')':''}</option>`);
    if(it.status==='borrowed' && returnSel) returnSel.insertAdjacentHTML('beforeend', `<option value="${it.id}">${escapeHtml(it.name)} — ${escapeHtml(it.borrowedBy||'')}</option>`);
  }
}

/* Render Manage Items with delegation-friendly buttons */
let manageFilter = 'all';
let dashboardFilter = 'all';
function renderManage(highlightId=null){
  const wrap = el('manageList'); if(!wrap) return;
  wrap.innerHTML='';
  let items = [...state.items];
  if(manageFilter !== 'all') items = items.filter(it => it.status === manageFilter);
  const query = el('manageSearch')?.value.trim().toLowerCase() || '';
  if(query) items = items.filter(it => (it.name || '').toLowerCase().includes(query) || (it.category || '').toLowerCase().includes(query) || (it.desc || '').toLowerCase().includes(query));
  if(items.length === 0){ wrap.innerHTML = '<div class="card"><div class="meta">Tidak ada barang yang ditemukan.</div></div>'; return; }

  const newest = items[items.length - 1];
  const sorted = items.slice(0, -1).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  const finalList = newest ? [newest, ...sorted] : sorted;

  const frag = document.createDocumentFragment();

  for(const it of finalList){
    const card = document.createElement('div'); card.className = 'card ' + (it.status === 'available' ? 'available' : 'borrowed'); card.dataset.id = it.id;
    if(highlightId && it.id === highlightId){ card.style.backgroundColor = '#d1fae5'; setTimeout(()=>{ card.style.backgroundColor=''; }, 3000); }
    const top = document.createElement('div'); top.className='top';
    top.appendChild(document.createElement('div')).textContent = it.category || '';
    const badge = document.createElement('div'); badge.className = 'badge ' + (it.status==='available'?'available':'borrowed');
    badge.textContent = it.status==='available' ? 'Tersedia' : 'Dipinjam';
    top.appendChild(badge); card.appendChild(top);
    const h = document.createElement('h3'); h.textContent = it.name; card.appendChild(h);
    const p = document.createElement('div'); p.className='meta'; p.textContent = it.desc || ''; card.appendChild(p);

    if(it.status === 'available'){
      const actions = document.createElement('div'); actions.className='actions';
      const editBtn = document.createElement('button'); editBtn.className='btn primary'; editBtn.textContent='Ubah'; editBtn.dataset.action='edit'; editBtn.dataset.id = it.id;
      const delBtn = document.createElement('button'); delBtn.className='btn danger'; delBtn.textContent='Hapus'; delBtn.dataset.action='delete'; delBtn.dataset.id = it.id;
      actions.appendChild(editBtn); actions.appendChild(delBtn); card.appendChild(actions);
    }
    frag.appendChild(card);
  }

  wrap.appendChild(frag);
}

/* Photo processing (fixed preview bug) */
function resizeImage(file, maxW, maxH){ return new Promise((resolve)=>{ const img = new Image(); const reader = new FileReader(); reader.onload = e=>{ img.onload = ()=>{ const canvas = document.createElement('canvas'); let { width, height } = img; if (width > maxW || height > maxH){ const scale = Math.min(maxW / width, maxH / height); width *= scale; height *= scale; } canvas.width = width; canvas.height = height; canvas.getContext('2d').drawImage(img, 0, 0, width, height); let quality = 0.8; if (file.size > 2 * 1024 * 1024) quality = 0.6; else if (file.size > 1 * 1024 * 1024) quality = 0.7; resolve(canvas.toDataURL('image/webp', quality)); }; img.onerror = ()=> resolve(null); img.src = e.target.result; }; reader.onerror = ()=> resolve(null); reader.readAsDataURL(file); }); }

// helper: convert dataURL to Blob
function dataURLtoBlob(dataurl) {
  try{
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }catch(e){
    console.error('dataURLtoBlob failed', e);
    return null;
  }
}

async function processPhotoInput(file, previewEl) {
  try{
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) { showToast('Maks 10MB','warning'); return null; }
    const resizedData = await resizeImage(file, 1024, 1024);
    if(!resizedData) return null;
    const blob = dataURLtoBlob(resizedData);
    const photoId = 'photo_' + uid();
    await putPhoto(photoId, blob);
    photoCache.set(photoId, blob);
    const url = getObjectURLFor(photoId, blob);
    previewEl.innerHTML = `<img src="${url}" alt="preview">`;
    if (typeof showToast === 'function') { showToast('Foto Ditambahkan', 'success'); }
    previewEl.hidden = false;
    _ensureCacheLimit();
    return photoId;
  }
  catch(err){
    console.error('processPhotoInput failed', err);
    return null;
  }
}

/* -------------------- Signature pad for borrow & return (auto-injected) -------------------- */

// helper: create signature UI and pad
function makeSignaturePad(canvasId, clearBtnId) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return null;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Sync canvas internal resolution to its CSS rendered size
  function syncSize() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if(!w || !h) return;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.strokeStyle = '#1a1a2e';
  }

  syncSize();

  // Keep in sync if layout changes (orientation, panel resize, etc.)
  if(window.ResizeObserver) {
    new ResizeObserver(() => syncSize()).observe(canvas);
  }

  let drawing = false;
  let points  = [];

  function getPos(e) {
    const r   = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  function startDraw(e) {
    drawing = true;
    const p = getPos(e);
    points  = [p, p];
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function moveDraw(e) {
    if(!drawing) return;
    const p = getPos(e);
    points.push(p);
    if(points.length > 4) points.shift();
    const p1  = points[points.length - 2];
    const p2  = points[points.length - 1];
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);
  }

  function endDraw() {
    if(!drawing) return;
    drawing = false;
    const p = points[points.length - 1];
    if(p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
    points = [];
  }

  canvas.addEventListener('mousedown',  e => { e.preventDefault(); startDraw(e); });
  canvas.addEventListener('mousemove',  e => { e.preventDefault(); moveDraw(e);  });
  canvas.addEventListener('mouseup',        () => endDraw());
  canvas.addEventListener('mouseleave',     () => endDraw());

  canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); moveDraw(e);  }, { passive: false });
  canvas.addEventListener('touchend',   e => { e.preventDefault(); endDraw();    }, { passive: false });

  const clearBtn = document.getElementById(clearBtnId);
  if(clearBtn) clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  function getDataUrl() {
    try {
      const blank = document.createElement('canvas');
      blank.width  = canvas.width;
      blank.height = canvas.height;
      return canvas.toDataURL() === blank.toDataURL() ? '' : canvas.toDataURL();
    } catch(e) { return canvas.toDataURL(); }
  }

  return { getDataUrl, clear: () => ctx.clearRect(0, 0, canvas.width, canvas.height) };
}

// inject signature UI — canvas full width, X button overlaid on top-right corner
function injectSignatureUI(formId, canvasId, clearBtnId) {
  const form = document.getElementById(formId);
  if(!form) return;
  if(form.querySelector('#' + canvasId)) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'sig-wrap';
  wrapper.innerHTML = `
    <div class="field-label" style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-2);font-weight:600;margin-bottom:6px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
      Tanda Tangan (wajib)
    </div>
    <div class="sig-canvas-wrap">
      <canvas id="${canvasId}"></canvas>
      <button type="button" id="${clearBtnId}" class="sig-clear-btn" title="Hapus tanda tangan">✕</button>
    </div>
    <span class="sig-hint">Gunakan jari atau stylus untuk menandatangani</span>
  `;

  // Insert before .modal-actions if present, otherwise before submit button, else append
  const actionsDiv = form.querySelector('.modal-actions');
  const submitBtn = form.querySelector('button[type="submit"]');
  if(actionsDiv) form.insertBefore(wrapper, actionsDiv);
  else if(submitBtn) form.insertBefore(wrapper, submitBtn);
  else form.appendChild(wrapper);
}

// Inject signature UI into modal forms and wire close buttons on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    setTimeout(() => {
      injectSignatureUI('borrowForm', 'borrowSign', 'clearBorrowSign');
      injectSignatureUI('returnForm', 'returnSign', 'clearReturnSign');
      // pads are initialised lazily on first modal open
    }, 200);
  } catch(e) { console.error('Signature UI injection failed', e); }

  // Close buttons
  const closeBorrow = el('closeBorrowModal');
  if (closeBorrow) closeBorrow.addEventListener('click', closeBorrowModal);
  const closeReturn = el('closeReturnModal');
  if (closeReturn) closeReturn.addEventListener('click', closeReturnModal);

  // Batal buttons
  const cancelBorrow = el('cancelBorrowBtn');
  if (cancelBorrow) cancelBorrow.addEventListener('click', closeBorrowModal);
  const cancelReturn = el('cancelReturnBtn');
  if (cancelReturn) cancelReturn.addEventListener('click', closeReturnModal);

  // Backdrop click closes modal
  ['borrowModal','returnModal'].forEach(modalId => {
    const modal = el(modalId);
    if (!modal) return;
    modal.addEventListener('click', e => {
      // Only close if clicking directly on the overlay (not on the card)
      if (e.target === modal) {
        if (modalId === 'borrowModal') closeBorrowModal();
        else closeReturnModal();
      }
    });
  });
});

/* -------------------- end signature helpers -------------------- */

/* --- Event wiring (one-time) --- */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', e=> { showView(t.dataset.tab); }));
if(el('q')) el('q').addEventListener('input', throttle(()=> renderDashboardList(), 180));
if(el('clearSearch')) el('clearSearch').addEventListener('click', ()=> { el('q').value=''; renderDashboardList(); });

// dashboard filters
document.querySelectorAll('#dashboardFilters [data-dash-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    dashboardFilter = btn.dataset.dashFilter;
    document.querySelectorAll('#dashboardFilters .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderDashboardList();
  });
});

if(el('addForm')) el('addForm').addEventListener('submit', e=> { e.preventDefault(); try{ const name = el('name').value.trim(); if(!name) { showToast('Masukkan nama', 'warning'); return; } const item = { id: uid('itm'), name, category: el('category').value.trim(), desc: el('desc').value.trim(), status:'available' }; state.items.unshift(item); save(); el('addForm').reset(); renderManage(item.id); renderStats(); renderDashboardList(); showToast('Barang ditambahkan', 'success'); }catch(err){ console.error(err); showToast('Gagal menambah barang','danger'); } });

/* Borrow/Return forms */
if(el('borrowForm')) el('borrowForm').addEventListener('submit', async e=> {
  e.preventDefault();
  try{
    const id = el('borrowSelect').value; if(!id) return showToast('Pilih barang', 'warning');
    const borrower = el('borrower').value.trim(); if(!borrower) { showToast('Masukkan nama peminjam', 'warning'); return; }
    const now = new Date();
    const bDate = now.toISOString().split('T')[0];
    const bTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const exp = el('expectedReturn').value || '';
    const photoInput = el('borrowPhoto');
    photoInput.setAttribute('required', 'true');
    const photoId = photoInput.dataset.photoId || null;
    if (!photoId) { showToast('Harap ambil foto saat meminjam', 'warning'); return; }

    // signature (wajib)
    const signPad = window.__borrowSignPad;
    const signData = signPad ? signPad.getDataUrl() : '';
    if(!signData || signData.length < 40){ showToast('Harap isi tanda tangan saat meminjam', 'warning'); return; }
    let signId = null;
    try{
      const signBlob = dataURLtoBlob(signData);
      if(signBlob){ signId = 'sign_' + uid(); await putPhoto(signId, signBlob); photoCache.set(signId, signBlob); }
    }catch(err){ console.error('saving sign failed', err); }

    const item = state.items.find(x=>x.id===id);
    if (!item) return showToast('Barang tidak ditemukan', 'danger');
    item.status = 'borrowed';
    item.borrowedBy = borrower;
    item.borrowDate = bDate;
    item.borrowTime = bTime;
    item.expectedReturn = exp;
    item.photo = photoId;
    state.history.push({ action: 'borrowed', itemId: id, itemName: item.name, borrower, date: bDate, time: bTime, expectedReturn: exp || '', photo: photoId, signPhoto: signId || null });
    save();
    el('borrowForm').reset(); el('borrowPreview').hidden = true;
    setTimeout(() => resetPhotoFrame('borrowPhotoContainer','borrowPhoto','borrowPreview'), 250);
    // clear signature pad UI
    try{ if(window.__borrowSignPad) window.__borrowSignPad.clear(); }catch(e){};

    populateSelects();
    renderStats(); await renderDashboardList(); renderHistoryList();
    closeBorrowModal();
    showToast('Peminjaman tercatat');
  }catch(err){
    console.error(err);
    showToast('Gagal mencatat peminjaman','danger');
  }
});

if(el('returnForm')) el('returnForm').addEventListener('submit', async e=> {
  e.preventDefault();
  try{
    const id = el('returnSelect').value; if(!id) return showToast('Pilih barang', 'warning');
    const now = new Date();
    const rDate = now.toISOString().split('T')[0];
    const rTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const photoInput = el('returnPhoto');
    photoInput.setAttribute('required', 'true');
    const photoId = photoInput.dataset.photoId || null;
    if (!photoId) { showToast('Harap ambil foto saat pengembalian', 'warning'); return; }

    // signature (wajib)
    const signPad = window.__returnSignPad;
    const signData = signPad ? signPad.getDataUrl() : '';
    if(!signData || signData.length < 40){ showToast('Harap isi tanda tangan saat pengembalian', 'warning'); return; }
    let signId = null;
    try{
      const signBlob = dataURLtoBlob(signData);
      if(signBlob){ signId = 'sign_' + uid(); await putPhoto(signId, signBlob); photoCache.set(signId, signBlob); }
    }catch(err){ console.error('saving sign failed', err); }

    const item = state.items.find(x=>x.id===id); if(!item) { showToast('Barang tidak ditemukan', 'danger'); return; }
    state.history.push({ action:'returned', itemId:id, itemName:item.name, borrower: item.borrowedBy || null, date:rDate, time: rTime, photo: photoId, signPhoto: signId || null });
    item.status='available';
    item.borrowedBy=null;
    item.borrowDate=null;
    item.borrowTime=null;
    item.expectedReturn=null;
    item.photo = photoId;
    save();
    el('returnForm').reset(); el('returnPreview').hidden=true;
    setTimeout(() => resetPhotoFrame('returnPhotoContainer','returnPhoto','returnPreview'), 250);
    // clear signature pad UI
    try{ if(window.__returnSignPad) window.__returnSignPad.clear(); }catch(e){};

    populateSelects();
    renderStats(); await renderDashboardList(); renderHistoryList();
    closeReturnModal();
    showToast('Pengembalian tercatat');
  }catch(err){
    console.error(err);
    showToast('Gagal mencatat pengembalian','danger');
  }
});

/* Photo inputs */
if(el('borrowPhoto')) el('borrowPhoto').addEventListener('change', async e => {
  const photoId = await processPhotoInput(e.target.files[0], el('borrowPreview'));
  e.target.dataset.photoId = photoId || '';
  const body = el('borrowModal')?.querySelector('.form-modal-body');
  setTimeout(() => { if(body) body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }); }, 300);
});

if(el('returnPhoto')) el('returnPhoto').addEventListener('change', async e => {
  const photoId = await processPhotoInput(e.target.files[0], el('returnPreview'));
  e.target.dataset.photoId = photoId || '';
  const body = el('returnModal')?.querySelector('.form-modal-body');
  setTimeout(() => { if(body) body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }); }, 300);
});

/* history month */

// Event: ubah bulan pada tab Riwayat
if (el('historyMonth')) {
  el('historyMonth').addEventListener('change', () => {
    renderHistoryList();
  });
}
/* Updated PDF Export */
if (el('exportMonthPdf')) el('exportMonthPdf').addEventListener('click', async () => {
  try {
    const selectedMonth = el('historyMonth').value;
    if (!selectedMonth) return showToast("Silakan pilih bulan terlebih dahulu.", "warning");

    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(`${selectedMonth}-01`).toLocaleString('id-ID', { month: 'long' });
    
    // Get school name from input field or use default
    const schoolName = el('schoolName')?.value?.trim() || 'Nama Sekolah';

    const monthData = state.history.filter(h => {
      const date = new Date(h.date);
      return date.toISOString().slice(0, 7) === selectedMonth;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (monthData.length === 0) return showToast("Tidak ada data untuk bulan ini.", "info");

    // Show progress for PDF generation
    showProgress("Menyiapkan PDF...", 10);

    // Group by borrower + item to avoid duplicates
    // Simple approach: Use crypto.randomUUID() for unique keys

// Generate unique transaction groups using crypto UUID
const grouped = {};
const borrowTransactions = new Map(); // Track active borrows

monthData.forEach(h => {
  if (h.action === "borrowed") {
    // Create unique key using crypto UUID
    const uniqueKey = crypto.randomUUID ? crypto.randomUUID() : 
      'uuid-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    
    grouped[uniqueKey] = {
      nama: h.borrower || h.by || '',
      barang: h.itemName,
      tanggalPinjam: h.date,
      jamPinjam: h.time || "",
      tanggalPerkiraan: h.expectedReturn || "",
      tanggalKembali: "",
      jamKembali: "",
      status: "Dipinjam",
      borrowSignPhoto: h.signPhoto,
      returnSignPhoto: null
    };
    
    // Store this borrow for matching with returns
    const borrowKey = `${h.borrower || h.by}_${h.itemName}`;
    if (!borrowTransactions.has(borrowKey)) {
      borrowTransactions.set(borrowKey, []);
    }
    borrowTransactions.get(borrowKey).push(uniqueKey);
    
  } else if (h.action === "returned") {
    // Find matching borrow transaction
    const borrowKey = `${h.borrower || h.by}_${h.itemName}`;
    const borrowKeys = borrowTransactions.get(borrowKey) || [];
    
    // Find the first unreturned borrow for this person/item
    let matchedKey = null;
    for (const key of borrowKeys) {
      if (grouped[key] && grouped[key].status === "Dipinjam") {
        matchedKey = key;
        break;
      }
    }
    
    if (matchedKey) {
      // Update existing borrow with return info
      grouped[matchedKey].tanggalKembali = h.date;
      grouped[matchedKey].jamKembali = h.time || "";
      grouped[matchedKey].status = "Dikembalikan";
      grouped[matchedKey].returnSignPhoto = h.signPhoto;
    } else {
      // Create standalone return entry
      const uniqueKey = crypto.randomUUID ? crypto.randomUUID() : 
        'uuid-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      
      grouped[uniqueKey] = {
        nama: h.borrower || h.by || '',
        barang: h.itemName,
        tanggalPinjam: "",
        jamPinjam: "",
        tanggalPerkiraan: "",
        tanggalKembali: h.date,
        jamKembali: h.time || "",
        status: "Dikembalikan",
        borrowSignPhoto: null,
        returnSignPhoto: h.signPhoto
      };
    }
  }
});

    showProgress("Mengambil gambar tanda tangan...", 30);

    // Collect unique signature photo IDs
    const signatureIds = new Set();
    Object.values(grouped).forEach(item => {
      if (item.borrowSignPhoto) signatureIds.add(item.borrowSignPhoto);
      if (item.returnSignPhoto) signatureIds.add(item.returnSignPhoto);
    });

    const signatureDataUrls = {};
    
    if (signatureIds.size > 0) {
      const idArray = Array.from(signatureIds);
      const blobs = await fetchBlobsInBatches(idArray, 5);
      
      for (let i = 0; i < idArray.length; i++) {
        if (blobs[i]) {
          // Convert blob to data URL for PDF
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blobs[i]);
          });
          signatureDataUrls[idArray[i]] = dataUrl;
        }
        showProgress(`Memproses tanda tangan ${i + 1}/${idArray.length}...`, 30 + (i / idArray.length) * 40);
      }
    }

    showProgress("Membuat PDF...", 80);

    const { jsPDF } = window.jspdf;
    // Create PDF in landscape mode
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Page dimensions for landscape A4
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Multi-line title - centered
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    
    // Title line 1: "Riwayat Peminjaman Barang"
    const title1 = "Riwayat Peminjaman Barang";
    const title1Width = doc.getTextWidth(title1);
    const title1X = (pageWidth - title1Width) / 2;
    doc.text(title1, title1X, 16);
    
    // Title line 2: School name
    doc.setFontSize(16);
    const title2Width = doc.getTextWidth(schoolName);
    const title2X = (pageWidth - title2Width) / 2;
    doc.text(schoolName, title2X, 24);
    
    // Title line 3: "Bulan [Month] [Year]"
    const title3 = `Bulan ${monthName} ${year}`;
    const title3Width = doc.getTextWidth(title3);
    const title3X = (pageWidth - title3Width) / 2;
    doc.text(title3, title3X, 32);

    // Function to format date to dd-mm-yyyy
    const formatDateForPDF = (dateStr) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      } catch (e) {
        return dateStr; // fallback to original if parsing fails
      }
    };

    // Prepare data for autoTable with row numbers
    const tableRows = [];
    const groupedValues = Object.values(grouped);
    
    groupedValues.forEach((item, index) => {
      // Convert signatures to images for the table
      const borrowSignImg = item.borrowSignPhoto && signatureDataUrls[item.borrowSignPhoto] ? 
        { content: '', styles: { halign: 'center' } } : '';
      const returnSignImg = item.returnSignPhoto && signatureDataUrls[item.returnSignPhoto] ? 
        { content: '', styles: { halign: 'center' } } : '';

      tableRows.push([
        (index + 1).toString(), // Row number
        item.nama || '',
        item.barang || '',
        formatDateForPDF(item.tanggalPinjam) || '', // Format date to dd-mm-yyyy
        item.jamPinjam || '',
        borrowSignImg,
        formatDateForPDF(item.tanggalPerkiraan) || '', // Format date to dd-mm-yyyy
        formatDateForPDF(item.tanggalKembali) || '', // Format date to dd-mm-yyyy
        item.jamKembali || '',
        returnSignImg,
        item.status || ''
      ]);
    });

    // Create the table with autoTable
    doc.autoTable({
      startY: 40, // Adjusted start position due to multi-line title
      margin: { left: 15, right: 15 }, // 15mm margins on left and right
      head: [[
        'No', // Added row number column
        'Nama Peminjam', 
        'Nama Barang', 
        'Tgl Pinjam', 
        'Jam Pinjam',
        'TTD Pinjam',
        'Tgl Perkiraan', 
        'Tgl Kembali', 
        'Jam Kembali',
        'TTD Kembali',
        'Status'
      ]],
      body: tableRows,
      theme: 'grid',
      tableWidth: 'auto',
      headStyles: { 
        fillColor: 'gray', 
        textColor: [255, 255, 255], // White text for header
        halign: 'center',
        fontSize: 10,
        fontStyle: 'bold',
        lineColor: [0, 0, 0], // Black lines for header
        lineWidth: 0.2 // Same line width as body
      },
      bodyStyles: { 
        fontSize: 10,
        halign: 'center',
        cellPadding: 3,
        lineColor: [0, 0, 0], // Black lines instead of gray
        lineWidth: 0.2, // Slightly thicker lines
        textColor: [0, 0, 0] // Black text instead of gray
      },
      alternateRowStyles: { 
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0] // Black text for alternate rows too
      },
      didDrawCell: function (data) {
        // Only add signature images to body rows (not header rows)
        if (data.section === 'body' && (data.column.index === 5 || data.column.index === 9)) { // TTD columns (shifted due to No column)
          const rowIndex = data.row.index;
          const item = groupedValues[rowIndex];
          
          if (data.column.index === 5 && item && item.borrowSignPhoto && signatureDataUrls[item.borrowSignPhoto]) {
            // Add borrow signature
            try {
              const imgWidth = 18;
              const imgHeight = 8;
              const imgX = data.cell.x + (data.cell.width - imgWidth) / 2;
              const imgY = data.cell.y + (data.cell.height - imgHeight) / 2;
              
              doc.addImage(
                signatureDataUrls[item.borrowSignPhoto],
                'PNG',
                imgX,
                imgY,
                imgWidth,
                imgHeight
              );
            } catch (e) {
              console.warn('Failed to add borrow signature:', e);
            }
          }
          
          if (data.column.index === 9 && item && item.returnSignPhoto && signatureDataUrls[item.returnSignPhoto]) {
            // Add return signature
            try {
              const imgWidth = 18;
              const imgHeight = 8;
              const imgX = data.cell.x + (data.cell.width - imgWidth) / 2;
              const imgY = data.cell.y + (data.cell.height - imgHeight) / 2;
              
              doc.addImage(
                signatureDataUrls[item.returnSignPhoto],
                'PNG',
                imgX,
                imgY,
                imgWidth,
                imgHeight
              );
            } catch (e) {
              console.warn('Failed to add return signature:', e);
            }
          }
        }
      }
    });

	// === Signature block (auto-adjusts position safely) ===
	const headmasterName = el('headmasterName')?.value?.trim() || 'Nama Kepala Sekolah';
	const headmasterNIP = el('headmasterNIP')?.value?.trim() || '';

	doc.setFontSize(12);
	const pdfPageHeight = doc.internal.pageSize.height;
	const rightMargin = 30; // space from right edge
	let y = doc.lastAutoTable.finalY + 30;

	// If the signature would be off the page, move it to the next page
	if (y + 60 > pdfPageHeight) {
	doc.addPage();
	y = 30;
}

const x = doc.internal.pageSize.width - rightMargin - 80;

doc.text('Mengetahui,', x, y);
doc.text('Kepala Sekolah', x, y + 8);
doc.text('_________________________', x, y + 40);
doc.text(headmasterName, x, y + 50);
if (headmasterNIP) doc.text(`NIP. ${headmasterNIP}`, x, y + 58);


	
    // Add footer with generation timestamp - centered
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    const footerText = `Digenerate pada: ${new Date().toLocaleString('id-ID')}`;
    const footerWidth = doc.getTextWidth(footerText);
    const footerX = (pageWidth - footerWidth) / 2;
    doc.text(footerText, footerX, pageHeight - 10);

    // Save the PDF
    const filename = `Riwayat_${selectedMonth}_dengan_tanda_tangan.pdf`;
    doc.save(filename);

    hideProgress();
    showToast(`PDF berhasil diekspor: ${filename}`, 'success');

  } catch (err) {
    console.error('PDF Export Error:', err);
    hideProgress();
    showToast("Gagal mengekspor PDF: " + (err.message || 'Unknown error'), "danger");
  }
});

/* Full backup (state + IndexedDB photos) */
async function exportFullBackup(){
  try{
    const date = new Date();
    const dd = String(date.getDate()).padStart(2,'0');
    const mm = String(date.getMonth()+1).padStart(2,'0');
    const yyyy = date.getFullYear();
    const filename = `SiMISA_backup_${dd}-${mm}-${yyyy}.json`;

    const ids = new Set();
    state.items.forEach(it => { if(it.photo) ids.add(it.photo); });
    state.history.forEach(h => { if(h.photo) ids.add(h.photo); if(h.signPhoto) ids.add(h.signPhoto); });
    const idList = Array.from(ids);
    const total = idList.length;

    if(total === 0){
      const backupData = { state, photos: {} };
      downloadText(filename, JSON.stringify(backupData));
      showToast('Backup Data Selesai', 'success');
      return;
    }

    const blobPromises = idList.map(id => getCachedPhoto(id));
    const blobs = await Promise.all(blobPromises);

    const toDataURL = blob => new Promise(res => {
      if(!blob){ res(null); return; }
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.readAsDataURL(blob);
    });
    const dataUrls = await Promise.all(blobs.map(b => toDataURL(b)));

    const photos = {};
    for(let i=0;i<idList.length;i++){
      if(dataUrls[i]) photos[idList[i]] = dataUrls[i];
      const percent = Math.round(((i+1)/total) * 100);
      showProgress(`Mencadangkan Foto ${i+1}/${total}`, percent);
      await new Promise(r => setTimeout(r, 0));
    }

    const backupData = { state, photos };
    const sizeMB = (new Blob([JSON.stringify(backupData)]).size / (1024*1024)).toFixed(2);
    downloadText(filename, JSON.stringify(backupData));

    hideProgress();
    showToast(`Backup Data Selesai (Size: ${sizeMB} MB)`, 'success');
  }catch(err){
    console.error('exportFullBackup failed', err);
    hideProgress();
    showToast('Backup Data Gagal', 'danger');
  }
}

async function importFullBackup(){
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json';
  inp.onchange = async e => {
    const f = e.target.files[0];
    if(!f) return;
    const text = await f.text();
    let parsed;
    try{ parsed = JSON.parse(text); } catch(err){ 
      showToast('File JSON Tidak Valid!', 'danger'); 
      return; 
    }
    if(!parsed.state || !parsed.photos){ 
      showToast('File Backup Tidak Valid!', 'danger'); 
      return; 
    }

    // restore state
    state = parsed.state;
    save();

    // restore photos to IndexedDB
    if(!db) await openDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).clear();
    await new Promise(res => { tx.oncomplete = res; tx.onerror = ()=>res(); });

    const entries = Object.entries(parsed.photos || {});
    if(entries.length === 0){
      clearPhotoCache();
      await renderAll();
      showToast('Backup Data (tanpa foto)', 'success');
      return;
    }

    for(let i=0;i<entries.length;i++){
      const [id, dataUrl] = entries[i];
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      await putPhoto(id, blob);
      photoCache.set(id, blob);
      getObjectURLFor(id, blob);

      const percent = Math.round(((i+1)/entries.length) * 100);
      showProgress(`Memulihkan Foto ${i+1}/${entries.length}`, percent);

      await new Promise(r => setTimeout(r, 0));
    }

    clearPhotoCache();
    await renderAll();

    hideProgress();
    showToast('Data Berhasil Dipulihkan', 'success');
  };
  inp.click();
}

/* Wire buttons to new functions (safe rebind) */
try{
  const exp = el('exportBtn');
  if(exp){
    exp.replaceWith(exp.cloneNode(true));
    el('exportBtn').addEventListener('click', exportFullBackup);
  }
  const imp = el('importBtn');
  if(imp){
    imp.replaceWith(imp.cloneNode(true));
    el('importBtn').addEventListener('click', importFullBackup);
  }
} catch(err){
  console.error('Failed to rebind backup buttons', err);
}

if (el('manageSearch')) {
  // keep binding to allow quick filtering
  el('manageSearch').addEventListener('input', () => renderManage());
}
if (el('clearManageSearch')) {
  el('clearManageSearch').addEventListener('click', () => {
    el('manageSearch').value = '';
    renderManage();
  });
}

/* Hapus semua with safe cache cleanup */
if(el('clearAll')) el('clearAll').addEventListener('click', ()=> {
  showConfirm('Apakah Anda yakin ingin menghapus seluruh data?', () => {
    localStorage.removeItem(STORAGE_KEY);
    state = {items:[], history:[]};
    save();
    clearPhotoCache();
    load();
    renderAll();
    showToast('Seluruh Data Berhasil Dihapus', 'danger');
  });
});

/* Event delegation for dashboard and manage lists */
if(el('items')) el('items').addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-action]'); if(!btn) return;
  const action = btn.dataset.action; const id = btn.dataset.id;
  if(action==='borrow') openBorrowModal(id);
  else if(action==='return') openReturnModal(id);
});

/* Consolidated manageList delegation: delete/edit/save-edit/cancel-edit */
if(el('manageList')) el('manageList').addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-action]'); if(!btn) return;
  const action = btn.dataset.action; const id = btn.dataset.id;
  const item = state.items.find(x=>x.id===id);
  if(!item && action !== 'cancel-edit') return;

  if(action==='delete'){
    showConfirm('Apakah Anda yakin ingin menghapus barang ini?', () => {
      state.items = state.items.filter(x=>x.id!==id);
      save();
      renderManage();
      renderStats();
      renderDashboardList();
      showToast('Barang dihapus','danger');
    });
    return;
  }

  // Updated edit form without status field - replace the edit action in manageList event listener

if(action==='edit'){
  // render inline edit form inside the card (without status field)
  const card = btn.closest('.card');
  card.innerHTML = `
    <div class="form">
      <input class="input" id="editName" value="${escapeHtml(item.name)}" placeholder="Nama barang" />
      <input class="input" id="editCategory" value="${escapeHtml(item.category||'')}" placeholder="Kategori" />
      <input class="input" id="editDesc" value="${escapeHtml(item.desc||'')}" placeholder="Deskripsi" />
      <div class="actions">
        <button class="btn primary" data-action="save-edit" data-id="${id}">Simpan</button>
        <button class="btn ghost" data-action="cancel-edit" data-id="${id}">Batal</button>
      </div>
    </div>
  `;
  return;
}

  if(action==='save-edit'){
    const card = btn.closest('.card');
    const newName = card.querySelector('#editName').value.trim();
    if(!newName) return showToast('Nama wajib diisi', 'warning');
    const it = state.items.find(x=>x.id===id); if(!it) return;
    it.name = newName; it.category = card.querySelector('#editCategory').value.trim(); it.desc = card.querySelector('#editDesc').value.trim();
    save(); renderManage(); renderStats(); renderDashboardList(); showToast('Barang diperbarui','success');
    return;
  }

  if(action==='cancel-edit'){
    renderManage();
    return;
  }
});

/* small helpers */
function openImageModal(src){ 
  if(!src) return;
  const modal = document.createElement('div'); modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999';
  const img = document.createElement('img'); img.loading='lazy'; img.src=src; img.style.maxWidth='92%'; img.style.maxHeight='92%'; img.style.borderRadius='10px'; modal.appendChild(img); 
  modal.addEventListener('click', ()=> modal.remove()); 
  document.body.appendChild(modal); 
}

/* ── SiMERY-style notification toast ── */
const _toastIcons = {
  info:    { icon:'ℹ️', cls:'info' },
  success: { icon:'✅', cls:'success' },
  warning: { icon:'⚠️', cls:'warning' },
  danger:  { icon:'❌', cls:'error' },
  error:   { icon:'❌', cls:'error' },
};
let _toastQueue = [];
let _toastActive = false;

function showToast(msg, type = 'info') {
  _toastQueue.push({ msg, type });
  if (!_toastActive) _processToastQueue();
}

function _processToastQueue() {
  if (_toastQueue.length === 0) { _toastActive = false; return; }
  _toastActive = true;
  const { msg, type } = _toastQueue.shift();

  // Remove any existing toast
  document.querySelectorAll('.notification').forEach(n => n.remove());

  const cfg = _toastIcons[type] || _toastIcons.info;
  const el = document.createElement('div');
  el.className = 'notification ' + cfg.cls;
  el.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${cfg.icon}</div>
      <div class="notification-text">
        <div class="notification-title">${msg}</div>
      </div>
      <button class="notification-close" aria-label="Tutup">×</button>
    </div>`;
  document.body.appendChild(el);

  const close = el.querySelector('.notification-close');
  const dismiss = () => {
    el.classList.add('hiding');
    setTimeout(() => { el.remove(); setTimeout(_processToastQueue, 180); }, 240);
  };
  close.addEventListener('click', dismiss);
  setTimeout(dismiss, 3000);
}

/* throttle util */
function throttle(fn, wait){ let last=0, t; return (...args)=>{ const now = Date.now(); if(now - last > wait){ last = now; fn(...args); } else { clearTimeout(t); t = setTimeout(()=>{ last = Date.now(); fn(...args); }, wait - (now - last)); } }; }

/* top-level renderAll that calls the parts */
async function renderAll(){ try{ renderStats(); await renderDashboardList(); await renderHistoryList(); populateSelects(); renderManage(); }catch(err){ console.error('renderAll failed', err); } }

/* initial boot */
load();
renderAll();
showView('dashboard');

/* Set default month & dates */
const thisMonth = new Date().toISOString().slice(0, 7);
if (el('historyMonth')) el('historyMonth').value = thisMonth;

// centralize expectedReturn min logic
function setExpectedReturnMin() {
  const today = new Date().toISOString().split('T')[0];
  if (el('borrowDate')) el('borrowDate').value = today;
  if (el('expectedReturn')) {
    el('expectedReturn').value = el('expectedReturn').value || today;
    el('expectedReturn').min = today;
    // keep a manual-change flag when user edits it
    el('expectedReturn').addEventListener('change', () => { el('expectedReturn').dataset.manualChange = '1'; });
  }
  if (el('returnDate')) el('returnDate').value = today;
}
setExpectedReturnMin();

if(el('borrowDate')) el('borrowDate').addEventListener('change', e => {
  const ex = el('expectedReturn');
  if (ex && !ex.dataset.manualChange) {
    ex.value = e.target.value;
    ex.min = e.target.value;
  }
});

// Enhance preview after processPhotoInput by adding remove button
function enhancePhotoPreview(containerId, inputId, previewId) {
    const container = document.getElementById(containerId);
    const inputEl = document.getElementById(inputId);
    const previewEl = document.getElementById(previewId);
    if(!container || !inputEl || !previewEl) return;

    const observer = new MutationObserver(() => {
        if (previewEl.querySelector('img')) {
            container.classList.add('has-image');
            if (!container.querySelector('.btn-remove-photo')) {
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-remove-photo';
                removeBtn.innerHTML = '&times;';
                removeBtn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    inputEl.value = '';
                    inputEl.dataset.photoId = ''; // clear stored photo reference
                    previewEl.innerHTML = '';
                    container.classList.remove('has-image');
                });
                container.appendChild(removeBtn);
            }
        } else {
            container.classList.remove('has-image');
            const btn = container.querySelector('.btn-remove-photo');
            if (btn) btn.remove();
        }
    });
    observer.observe(previewEl, { childList: true });
}

function resetPhotoFrame(containerId, inputId, previewId) {
    const container = document.getElementById(containerId);
    const inputEl = document.getElementById(inputId);
    const previewEl = document.getElementById(previewId);
    if(inputEl) {
        try{ inputEl.value = ''; }catch(e){}
        try{ inputEl.dataset.photoId = ''; }catch(e){}
        try{ inputEl.removeAttribute('required'); }catch(e){}
    }
    if(previewEl) previewEl.innerHTML = '';
    if(container) container.classList.remove('has-image');
    const btn = container ? container.querySelector('.btn-remove-photo') : null;
    if (btn) btn.remove();
}

// wire up enhancements
document.addEventListener('DOMContentLoaded', () => {
    enhancePhotoPreview('borrowPhotoContainer', 'borrowPhoto', 'borrowPreview');
    enhancePhotoPreview('returnPhotoContainer', 'returnPhoto', 'returnPreview');
    hideProgress();
});

function showProgress(message, percent) {
  const overlay = el('progressOverlay');
  const bar = el('progressBar');
  const text = el('progressText');
  if (overlay && bar && text) {
    overlay.style.display = 'flex';
    text.textContent = message;
    bar.style.width = percent + '%';
  }
}

function hideProgress() {
  const overlay = el('progressOverlay');
  if (overlay) overlay.style.display = 'none';
}

// expose some helpers for debugging in console if needed
window.simisaHelpers = { clearPhotoCache, getCachedPhoto };

/* Confirmation Modal — SiMERY style */
function showConfirm(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(7,89,133,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px;backdrop-filter:blur(6px);';

  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;padding:24px;border-radius:20px;max-width:320px;width:100%;text-align:center;box-shadow:0 16px 48px rgba(14,165,233,0.2);';

  const icon = document.createElement('div');
  icon.style.cssText = 'width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#fef2f2,#fee2e2);border:2px solid #fecaca;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 16px;';
  icon.textContent = '⚠️';

  const msg = document.createElement('div');
  msg.textContent = message;
  msg.style.cssText = 'margin-bottom:20px;font-weight:600;color:#0f172a;line-height:1.5;font-size:14px;';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:10px;';

  const yesBtn = document.createElement('button');
  yesBtn.className = 'btn danger';
  yesBtn.style.flex = '1';
  yesBtn.textContent = 'Ya, Hapus';
  yesBtn.onclick = () => { overlay.remove(); if (typeof onConfirm === 'function') onConfirm(); };

  const noBtn = document.createElement('button');
  noBtn.className = 'btn ghost';
  noBtn.style.flex = '1';
  noBtn.textContent = 'Batal';
  noBtn.onclick = () => overlay.remove();

  actions.appendChild(noBtn);
  actions.appendChild(yesBtn);
  box.appendChild(icon);
  box.appendChild(msg);
  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// Save school data when it changes
function saveSchoolData() {
  try {
    const schoolName = el('schoolName')?.value?.trim() || '';
    const headmasterName = el('headmasterName')?.value?.trim() || '';
    const headmasterNIP = el('headmasterNIP')?.value?.trim() || '';
    localStorage.setItem('simisa_school_name', schoolName);
    localStorage.setItem('simisa_headmaster_name', headmasterName);
    localStorage.setItem('simisa_headmaster_nip', headmasterNIP);
  } catch (e) {
    console.error('Failed to save school data', e);
  }
}

// Load school data on startup
function loadSchoolData() {
  try {
    const savedName = localStorage.getItem('simisa_school_name') || '';
    const savedHeadmaster = localStorage.getItem('simisa_headmaster_name') || '';
    const savedNIP = localStorage.getItem('simisa_headmaster_nip') || '';
    if (el('schoolName')) {
      el('schoolName').value = savedName;
    }
    if (el('headmasterName')) {
      el('headmasterName').value = savedHeadmaster;
    }
    if (el('headmasterNIP')) {
      el('headmasterNIP').value = savedNIP;
    }
  } catch (e) {
    console.error('Failed to load school data', e);
  }
}

// Wire up the school data input fields
document.addEventListener('DOMContentLoaded', () => {
  // Load school data when page loads
  setTimeout(() => {
    loadSchoolData();
    
    // Save school data when inputs change
    if (el('schoolName')) {
      el('schoolName').addEventListener('input', throttle(saveSchoolData, 500));
    }
    if (el('headmasterName')) {
      el('headmasterName').addEventListener('input', throttle(saveSchoolData, 500));
    }
    if (el('headmasterNIP')) {
      el('headmasterNIP').addEventListener('input', throttle(saveSchoolData, 500));
    }
  }, 100);
});

// Manage tab filters event listeners
document.querySelectorAll('#manage [data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    manageFilter = btn.dataset.filter;
    // Update active state for manage filters only
    document.querySelectorAll('#manage [data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderManage();
  });
});

// Also need to set the initial active state for "Semua" button in manage tab
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Set initial active state for manage filters
    const manageAllBtn = document.querySelector('#manage [data-filter="all"]');
    if (manageAllBtn) {
      manageAllBtn.classList.add('active');
    }
  }, 100);
});