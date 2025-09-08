if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("SW registered:", reg))
      .catch(err => console.error("SW registration failed:", err));
  });
}
;
/*
  Patched & cleaned version of app.js
 
*/

// Use local date in YYYY-MM-DD (avoid UTC offset issues)
function localISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Local year-month (YYYY-MM)
function localYearMonth() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

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

/* --- Photo caching with LRU and object URL management --- */
const PHOTO_CACHE_LIMIT = 50;
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
  // reset when leaving
  if (lastView === 'borrow' && id !== 'borrow') {
    resetPhotoFrame('borrowPhotoContainer', 'borrowPhoto', 'borrowPreview');
    if (el('borrowForm')) el('borrowForm').reset();
  }
  if (lastView === 'return' && id !== 'return') {
    resetPhotoFrame('returnPhotoContainer', 'returnPhoto', 'returnPreview');
    if (el('returnForm')) el('returnForm').reset();
  }

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

  const today = localISODate();
  if (id === 'borrow') {
    if (el('borrowDate')) {
      el('borrowDate').value = today;
      el('borrowDate').readOnly = true;
    }
    if (el('expectedReturn')) {
      el('expectedReturn').value = today;
    }
    if (el('borrower')) el('borrower').value = '';
  }
  if (id === 'return') {
    if (el('returnDate')) {
      el('returnDate').value = today;
      el('returnDate').readOnly = true;
    }
  }
  if (id === 'borrow' || id === 'return') populateSelects();

  if (id === 'manage') {
    if (el('manageSearch')) el('manageSearch').value = '';
    manageFilter = 'all';
    renderManage();
  }

  lastView = id;
}


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
      const by = document.createElement('div'); by.className='meta'; by.textContent = `Dipinjam oleh: ${it.borrowedBy} • ${formatDate(it.borrowDate)} ${it.expectedReturn? '• perkiraan: ' + formatDate(it.expectedReturn):''}`;
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
  const d = new Date(h.date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const monthStr = `${yyyy}-${mm}`;
  return monthStr === selectedMonth;
});
  }
  if(historyData.length===0){ historyWrap.innerHTML = '<div class="card"><div class="meta">Tidak ada riwayat untuk bulan ini.</div></div>'; return; }

  const photoIds = historyData.map(h => h.photo || null);
  const blobs = await fetchBlobsInBatches(photoIds, 10);

  const renderFn = (h, idx) => {
    const blob = blobs[idx];
    const c = document.createElement('div'); c.className='card';
    const t = document.createElement('div'); t.className='meta'; t.textContent = `${h.action.toUpperCase()} • ${h.itemName} • ${h.by || h.borrower || ''} • ${formatDate(h.date)}`;
    c.appendChild(t);
    if(blob){
      const pv = document.createElement('div'); pv.className='preview';
      const im = document.createElement('img'); im.loading='lazy';
      const url = getObjectURLFor(h.photo, blob);
      im.src = url || '';
      im.alt='photo'; im.style.maxHeight='180px'; im.style.objectFit='cover';
      im.addEventListener('click', ()=> openImageModal(url));
      pv.appendChild(im); c.appendChild(pv);
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

async function processPhotoInput(file, previewEl) {
  try{
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024) { showToast('Maks 5MB','warning'); return null; }
    const resizedData = await resizeImage(file, 1024, 1024);
    if(!resizedData) return null;
    const blob = await (await fetch(resizedData)).blob();
    const photoId = 'photo_' + uid();
    await putPhoto(photoId, blob);
    // Use object URL for preview and cache both blob & url
    photoCache.set(photoId, blob);
    const url = getObjectURLFor(photoId, blob);
    // fixed: removed broken assignment and set proper img markup
    previewEl.innerHTML = `<img src="${url}" alt="preview">`;
    if (typeof showToast === 'function') { showToast('Foto Ditambahkan', 'success'); }
    previewEl.hidden = false;
    _ensureCacheLimit();
    return photoId;
  }catch(err){
    console.error('processPhotoInput failed', err);
    return null;
  }
}

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
const bDate = localISODate();
const exp = el('expectedReturn').value || '';
const photoInput = el('borrowPhoto');
photoInput.setAttribute('required', 'true'); // 🔒 enforce via HTML5
const photoId = photoInput.dataset.photoId || null;
if (!photoId) { showToast('Harap ambil foto saat meminjam', 'warning'); return; }
const item = state.items.find(x=>x.id===id);
if (!item) return showToast('Barang tidak ditemukan', 'danger');
item.status = 'borrowed'; item.borrowedBy = borrower; item.borrowDate = bDate; item.expectedReturn = exp; item.photo = photoId;
state.history.push({ action: 'borrowed', itemId: id, itemName: item.name, borrower, date: bDate, expectedReturn: exp || '', photo: photoId });
save();
el('borrowForm').reset(); el('borrowPreview').hidden = true;
resetPhotoFrame('borrowPhotoContainer','borrowPhoto','borrowPreview');
populateSelects();
renderStats(); await renderDashboardList(); renderHistoryList();
showView('dashboard');
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
const rDate = localISODate();
const photoInput = el('returnPhoto');
photoInput.setAttribute('required', 'true'); // 🔒 enforce via HTML5
const photoId = photoInput.dataset.photoId || null;
if (!photoId) { showToast('Harap ambil foto saat pengembalian', 'warning'); return; }
const item = state.items.find(x=>x.id===id); if(!item) { showToast('Barang tidak ditemukan', 'danger'); return; }
state.history.push({ action:'returned', itemId:id, itemName:item.name, borrower: item.borrowedBy || null, date:rDate, photo: photoId });
item.status='available'; item.borrowedBy=null; item.borrowDate=null; item.expectedReturn=null; item.photo = photoId;
save();
el('returnForm').reset(); el('returnPreview').hidden=true;
resetPhotoFrame('returnPhotoContainer','returnPhoto','returnPreview');
populateSelects();
renderStats(); await renderDashboardList(); renderHistoryList();
showView('dashboard');
showToast('Pengembalian tercatat');
}catch(err){
console.error(err);
showToast('Gagal mencatat pengembalian','danger');
}
});


// resetPhotoFrame now also clears dataset.photoId
function resetPhotoFrame(containerId, inputId, previewId) {
const container = document.getElementById(containerId);
const inputEl = document.getElementById(inputId);
const previewEl = document.getElementById(previewId);
if(inputEl) {
inputEl.value = '';
inputEl.dataset.photoId = '';
inputEl.removeAttribute('required'); // reset required state after submit
}
if(previewEl) previewEl.innerHTML = '';
if(container) container.classList.remove('has-image');
const btn = container ? container.querySelector('.btn-remove-photo') : null;
if (btn) btn.remove();
}

/* Photo inputs */
if(el('borrowPhoto')) el('borrowPhoto').addEventListener('change', async e => {
  const photoId = await processPhotoInput(e.target.files[0], el('borrowPreview'));
  e.target.dataset.photoId = photoId || '';
  // scroll into view in a safe way
  const btn = document.querySelector('#borrowForm button[type="submit"]');
  const img = el('borrowPreview')?.querySelector('img');
  const doScroll = () => {
    if (btn) { try { btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); } }
  };
  if (img) {
    if (img.complete) doScroll();
    else {
      img.addEventListener('load', doScroll, { once: true });
      setTimeout(doScroll, 500);
    }
  } else { setTimeout(doScroll, 200); }
});

if(el('returnPhoto')) el('returnPhoto').addEventListener('change', async e => {
  const photoId = await processPhotoInput(e.target.files[0], el('returnPreview'));
  e.target.dataset.photoId = photoId || '';
  const btn = document.querySelector('#returnForm button[type="submit"]');
  const img = el('returnPreview')?.querySelector('img');
  const doScroll = () => {
    if (btn) { try { btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); } }
  };
  if (img) {
    if (img.complete) doScroll();
    else {
      img.addEventListener('load', doScroll, { once: true });
      setTimeout(doScroll, 500);
    }
  } else { setTimeout(doScroll, 200); }
});

/* history month */
if(el('historyMonth')) el('historyMonth').addEventListener('input', ()=> { renderHistoryList(); });

/* export/import/clear (improved backup handling) */

if (el('exportMonthPdf')) el('exportMonthPdf').addEventListener('click', () => {
  try {
    const selectedMonth = el('historyMonth').value;
    if (!selectedMonth) return showToast("Silakan pilih bulan terlebih dahulu.", "warning");

    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(`${selectedMonth}-01`).toLocaleString('id-ID', { month: 'long' });
    const titleText = `Riwayat Peminjaman Barang — ${monthName} ${year}`;

    const monthData = state.history.filter(h => {
    const d = new Date(h.date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const monthStr = `${yyyy}-${mm}`;
    return monthStr === selectedMonth;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (monthData.length === 0) return showToast("Tidak ada data untuk bulan ini.", "info");

    // 🔥 Group by borrower + item
    const grouped = {};
    monthData.forEach(h => {
      const key = (h.borrower || h.by || '') + "_" + h.itemName;
      if (!grouped[key]) {
        grouped[key] = {
          nama: h.borrower || h.by || '',
          barang: h.itemName,
          tanggalPinjam: h.action === "borrowed" ? h.date : "",
          tanggalPerkiraan: h.expectedReturn || "",
          tanggalKembali: h.action === "returned" ? h.date : "",
          status: h.action === "returned" ? "Dikembalikan" : "Dipinjam"
        };
      } else {
        if (h.action === "returned") {
          grouped[key].tanggalKembali = h.date;
          grouped[key].status = "Dikembalikan";
        }
      }
    });

    const rows = Object.values(grouped).map(r => [
      r.nama,
      r.barang,
      r.tanggalPinjam,
      r.tanggalPerkiraan,
      r.tanggalKembali,
      r.status
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(titleText, 14, 20);

    // Styled Table
    doc.autoTable({
      startY: 30,
      head: [['Nama', 'Barang', 'Tanggal Pinjam', 'Perkiraan', 'Tanggal Kembali', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [108, 92, 231], textColor: 255, halign: 'center' },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`Riwayat_${selectedMonth}.pdf`);
  } catch (err) {
    console.error(err);
    showToast("Gagal Mengekspor PDF", "danger");
  }
});


if(el('exportBtn')) el('exportBtn').addEventListener('click', ()=> { try{ const data = JSON.stringify(state, null, 2); downloadText('simisa-export.json', data); showToast('Berhasil mengekspor JSON', 'success'); }catch(err){ console.error(err); showToast('Gagal mengekspor','danger'); } });

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
    state.history.forEach(h => { if(h.photo) ids.add(h.photo); });
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
  if(action==='borrow'){ showView('borrow'); el('borrowSelect').value = id; }
  else if(action==='return'){ showView('return'); el('returnSelect').value = id; }
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


if(action==='edit'){
// render inline edit form inside the card
const card = btn.closest('.card');
card.innerHTML = `
<div class="form">
<input class="input" id="editName" value="${escapeHtml(item.name)}" placeholder="Nama barang" />
<input class="input" id="editCategory" value="${escapeHtml(item.category||'')}" placeholder="Kategori" />
<input class="input" id="editDesc" value="${escapeHtml(item.desc||'')}" placeholder="Deskripsi" />
<select class="select" id="editStatus" disabled>
<option value="available" ${item.status==='available'?'selected':''}>Tersedia</option>
<option value="borrowed" ${item.status==='borrowed'?'selected':''}>Dipinjam</option>
</select>
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

function showToast(msg, type = "info") {
  const styles = { info: { bg: "linear-gradient(90deg, var(--accent-1), var(--accent-2))", icon: "ℹ️" }, success: { bg: "linear-gradient(90deg, var(--success), #34d399)", icon: "✅" }, warning: { bg: "linear-gradient(90deg, var(--warning), #f97316)", icon: "⚠️" }, danger: { bg: "linear-gradient(90deg, var(--danger), #b91c1c)", icon: "❌" } };
  const t = document.createElement("div");
  t.innerHTML = `<span style="margin-right:8px">${styles[type]?.icon || styles.info.icon}</span>${msg}`;
  t.style.cssText = `position: fixed; left: 50%; transform: translateX(-50%) translateY(20px); bottom: 24px; background: ${styles[type]?.bg || styles.info.bg}; color: white; padding: 12px 18px; border-radius: 999px; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; box-shadow: 0 6px 18px rgba(0,0,0,0.25); z-index: 9999; opacity: 0; transition: all 0.35s ease; letter-spacing: 0.3px;`;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = 1; t.style.transform = "translateX(-50%) translateY(0)"; });
  setTimeout(() => { t.style.opacity = 0; t.style.transform = "translateX(-50%) translateY(20px)"; setTimeout(() => t.remove(), 5000); }, 2000);
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
const thisMonth = localYearMonth();
if (el('historyMonth')) el('historyMonth').value = thisMonth;

// centralize expectedReturn min logic
function setExpectedReturnMin() {
  const today = localISODate();
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
    if(inputEl) inputEl.value = '';
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

// Restrict Perkiraan pengembalian Date to today or later (already handled in setExpectedReturnMin)

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


/* Confirmation Modal */
function showConfirm(message, onConfirm) {
const overlay = document.createElement('div');
overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10000;';


const box = document.createElement('div');
box.style.cssText = 'background:#fff;padding:20px;border-radius:12px;max-width:320px;width:90%;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,0.3);';


const msg = document.createElement('div');
msg.textContent = message;
msg.style.marginBottom = '16px';


const actions = document.createElement('div');
actions.style.display = 'flex';
actions.style.justifyContent = 'space-around';


const yesBtn = document.createElement('button');
yesBtn.className = 'btn danger';
yesBtn.textContent = 'Ya';
yesBtn.onclick = () => {
overlay.remove();
if (typeof onConfirm === 'function') onConfirm();
};


const noBtn = document.createElement('button');
noBtn.className = 'btn ghost';
noBtn.textContent = 'Batal';
noBtn.onclick = () => overlay.remove();


actions.appendChild(yesBtn);
actions.appendChild(noBtn);
box.appendChild(msg);
box.appendChild(actions);
overlay.appendChild(box);
document.body.appendChild(overlay);
}

/* Tombol tandai dikembalikan di dashboard */
if (it.status === 'borrowed') {
  html += `<button class="btn borrowed-return" data-action="return" data-id="${it.id}">Kembalikan</button>`;
}

/* --- PWA Install Prompt --- */
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Create install button
  const installBtn = document.createElement("button");
  installBtn.textContent = "📲 Pasang SiMISA";
  installBtn.className = "btn primary";
  installBtn.style.position = "fixed";
  installBtn.style.bottom = "20px";
  installBtn.style.right = "20px";
  installBtn.style.zIndex = "9999";
  document.body.appendChild(installBtn);

  // Handle click
  installBtn.addEventListener("click", async () => {
    installBtn.remove();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    deferredPrompt = null;

    if (outcome === "accepted") {
      showToast("Aplikasi dipasang ✔️", "success");
    } else {
      showToast("Pemasangan dibatalkan ❌", "warning");
    }
  });
});

// Optional: detect if already installed
window.addEventListener("appinstalled", () => {
  console.log("PWA installed");
  showToast("Aplikasi berhasil dipasang 🎉", "success");
});






























