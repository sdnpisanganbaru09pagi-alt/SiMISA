/* ══════════════════════════════════════════════════════════════════
   members.js — Modul Data Warga Sekolah untuk SiMISA
   Fitur:
   • CRUD data warga (Nama, NIP, Jabatan)
   • Import dari Excel (.xlsx)
   • Download template Excel
   • Dropdown + search peminjam pada form Peminjaman
   ══════════════════════════════════════════════════════════════════ */

const MEMBERS_KEY = 'simisa_members_v1';

/* ── State ── */
let membersState = { members: [] };

function loadMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (raw) membersState = JSON.parse(raw);
    else membersState = { members: [] };
  } catch (e) {
    console.error('loadMembers failed', e);
    membersState = { members: [] };
  }
}

function saveMembers() {
  try {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(membersState));
  } catch (e) {
    console.error('saveMembers failed', e);
  }
}

function memberUid() {
  return 'mbr-' + Math.random().toString(36).slice(2, 9);
}

/* ── CRUD ── */
function addMember(nama, nip, jabatan) {
  if (!nama.trim()) return null;
  const member = {
    id: memberUid(),
    nama: nama.trim(),
    nip: (nip || '').trim(),
    jabatan: (jabatan || 'Guru').trim(),
    createdAt: new Date().toISOString()
  };
  membersState.members.unshift(member);
  saveMembers();
  return member;
}

function updateMember(id, nama, nip, jabatan) {
  const m = membersState.members.find(x => x.id === id);
  if (!m) return false;
  m.nama = nama.trim();
  m.nip = (nip || '').trim();
  m.jabatan = (jabatan || 'Guru').trim();
  saveMembers();
  return true;
}

function deleteMember(id) {
  membersState.members = membersState.members.filter(x => x.id !== id);
  saveMembers();
}

function getMembersSorted(query = '', jabatanFilter = 'all') {
  let list = [...membersState.members];
  if (jabatanFilter !== 'all') {
    list = list.filter(m => m.jabatan === jabatanFilter);
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(m =>
      m.nama.toLowerCase().includes(q) ||
      (m.nip || '').toLowerCase().includes(q) ||
      (m.jabatan || '').toLowerCase().includes(q)
    );
  }
  return list.sort((a, b) => a.nama.localeCompare(b.nama));
}

/* ══════════════════════════════════════════════════════════════════
   Excel Import / Export
   Menggunakan SheetJS yang di-load dari CDN (via <script> di index.html)
   Fallback: parse CSV sederhana jika SheetJS tidak tersedia
   ══════════════════════════════════════════════════════════════════ */

/* Download template Excel */
function downloadMemberTemplate() {
  const XLSX = window.XLSX;
  if (XLSX) {
    _downloadTemplateXLSX(XLSX);
  } else {
    _downloadTemplateCSV();
  }
}

function _downloadTemplateXLSX(XLSX) {
  const ws_data = [
    ['Nama', 'NIP', 'Jabatan'],
    ['Contoh: Ahmad Suryadi', '198501012010011001', 'Guru'],
    ['Contoh: Siti Rahayu', '197803152005012002', 'Staff'],
    ['Contoh: Budi Santoso', '', 'Guru'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Set column widths
  ws['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 12 }];

  // Style header row (cell format)
  ['A1','B1','C1'].forEach(addr => {
    if (!ws[addr]) return;
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '6C5CE7' } },
      alignment: { horizontal: 'center' }
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Warga Sekolah');
  XLSX.writeFile(wb, 'Template_Warga_Sekolah.xlsx');
}

function _downloadTemplateCSV() {
  const csv = 'Nama,NIP,Jabatan\n"Contoh: Ahmad Suryadi","198501012010011001","Guru"\n"Contoh: Siti Rahayu","197803152005012002","Staff"\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'Template_Warga_Sekolah.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/* Import dari Excel / CSV */
function importMembersFromExcel() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls,.csv';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const XLSX = window.XLSX;
      if (XLSX) {
        await _importXLSX(file, XLSX);
      } else {
        await _importCSV(file);
      }
    } catch (err) {
      console.error('Import failed', err);
      showToast('Gagal mengimpor file: ' + (err.message || err), 'danger');
    }
  };
  input.click();
}

async function _importXLSX(file, XLSX) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  _processImportedRows(rows);
}

async function _importCSV(file) {
  const text = await file.text();
  const rows = text.split('\n').map(line =>
    line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
  );
  _processImportedRows(rows);
}

function _processImportedRows(rows) {
  if (!rows || rows.length < 2) {
    showToast('File kosong atau format tidak dikenali', 'warning');
    return;
  }

  // Detect header row
  const header = rows[0].map(h => (h || '').toLowerCase().trim());
  const namaIdx    = header.findIndex(h => h.includes('nama'));
  const nipIdx     = header.findIndex(h => h.includes('nip'));
  const jabatanIdx = header.findIndex(h => h.includes('jabatan'));

  if (namaIdx === -1) {
    showToast('Kolom "Nama" tidak ditemukan. Pastikan menggunakan template yang benar.', 'warning');
    return;
  }

  let added = 0, skipped = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const nama = (row[namaIdx] || '').toString().trim();
    if (!nama || nama.toLowerCase().startsWith('contoh')) { skipped++; continue; }

    const nip     = nipIdx     !== -1 ? (row[nipIdx]     || '').toString().trim() : '';
    const jabatan = jabatanIdx !== -1 ? (row[jabatanIdx] || '').toString().trim() : 'Guru';

    // Avoid duplicates by nama+nip
    const exists = membersState.members.some(
      m => m.nama.toLowerCase() === nama.toLowerCase() && m.nip === nip
    );
    if (exists) { skipped++; continue; }

    addMember(nama, nip, jabatan);
    added++;
  }

  renderMembersList();
  refreshBorrowerDropdown();
  if (added > 0) showToast(`${added} data berhasil diimpor${skipped ? `, ${skipped} dilewati` : ''}`, 'success');
  else showToast(`Tidak ada data baru. ${skipped} baris dilewati (duplikat/kosong).`, 'warning');
}

/* ══════════════════════════════════════════════════════════════════
   Dropdown + Search Peminjam
   Mengganti <input id="borrower"> dengan komponen custom dropdown
   ══════════════════════════════════════════════════════════════════ */

let _dropdownOpen = false;
let _dropdownQuery = '';
let _selectedMember = null;

function _buildBorrowerDropdown() {
  const existingInput = document.getElementById('borrower');
  if (!existingInput) return;

  // Sudah pernah diupgrade
  if (document.getElementById('borrowerDropdownWrapper')) return;

  const label = existingInput.closest('label');
  if (!label) return;

  // Buat wrapper
  const wrapper = document.createElement('div');
  wrapper.id = 'borrowerDropdownWrapper';
  wrapper.className = 'borrower-dropdown-wrapper';
  wrapper.innerHTML = `
    <div class="borrower-search-box" id="borrowerSearchBox" tabindex="0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="borrower-search-icon">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
      <input
        type="text"
        id="borrowerSearchInput"
        class="borrower-search-input"
        placeholder="Ketik nama atau pilih dari daftar…"
        autocomplete="off"
        spellcheck="false"
      />
      <button type="button" id="borrowerClearBtn" class="borrower-clear-btn" title="Hapus pilihan" style="display:none;">✕</button>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="borrower-chevron" id="borrowerChevron">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
    </div>
    <div class="borrower-dropdown-list" id="borrowerDropdownList" style="display:none;"></div>
  `;

  // Sembunyikan input asli (tetap ada untuk validasi form)
  existingInput.style.display = 'none';
  existingInput.removeAttribute('required'); // Validasi manual

  label.insertBefore(wrapper, existingInput);

  _wireDropdownEvents();
}

function _wireDropdownEvents() {
  const searchInput = document.getElementById('borrowerSearchInput');
  const listEl      = document.getElementById('borrowerDropdownList');
  const clearBtn    = document.getElementById('borrowerClearBtn');
  const searchBox   = document.getElementById('borrowerSearchBox');
  const chevron     = document.getElementById('borrowerChevron');

  if (!searchInput || !listEl) return;

  function openDropdown() {
    _dropdownOpen = true;
    listEl.style.display = 'block';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    _renderDropdownList();
    searchInput.focus();
  }

  function closeDropdown() {
    _dropdownOpen = false;
    listEl.style.display = 'none';
    if (chevron) chevron.style.transform = '';
  }

  function selectMember(member) {
    _selectedMember = member;
    searchInput.value = member
      ? `${member.nama}${member.nip ? ' — ' + member.nip : ''}${member.jabatan ? ' ('+member.jabatan+')' : ''}`
      : '';
    _dropdownQuery = '';
    // Sync ke input asli
    const borrowerInput = document.getElementById('borrower');
    if (borrowerInput) borrowerInput.value = member ? member.nama : '';
    if (clearBtn) clearBtn.style.display = member ? '' : 'none';
    closeDropdown();
  }

  function selectManual(namaText) {
    _selectedMember = null;
    const borrowerInput = document.getElementById('borrower');
    if (borrowerInput) borrowerInput.value = namaText.trim();
    if (clearBtn) clearBtn.style.display = namaText.trim() ? '' : 'none';
  }

  searchInput.addEventListener('focus', () => {
    if (!_dropdownOpen) openDropdown();
  });

  searchInput.addEventListener('input', () => {
    _dropdownQuery = searchInput.value.trim();
    // Jika user mengetik bebas, sync ke borrower input
    selectManual(searchInput.value);
    _renderDropdownList();
    if (!_dropdownOpen) openDropdown();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
    if (e.key === 'Enter') {
      // Pilih item pertama jika ada
      const firstItem = listEl.querySelector('.borrower-dropdown-item:not(.borrower-dropdown-header)');
      if (firstItem) firstItem.click();
    }
  });

  clearBtn && clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectMember(null);
    searchInput.value = '';
    _dropdownQuery = '';
    searchInput.focus();
    openDropdown();
  });

  // Tutup saat klik di luar
  document.addEventListener('mousedown', (e) => {
    const wrapper = document.getElementById('borrowerDropdownWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  // Render list
  window._renderDropdownList = _renderDropdownList;
}

function _renderDropdownList() {
  const listEl = document.getElementById('borrowerDropdownList');
  if (!listEl) return;

  const q = _dropdownQuery.toLowerCase();
  let filtered = membersState.members.filter(m => {
    if (!q) return true;
    return m.nama.toLowerCase().includes(q) || (m.nip||'').includes(q) || (m.jabatan||'').toLowerCase().includes(q);
  });

  // Pisahkan berdasarkan jabatan
  const guru  = filtered.filter(m => m.jabatan === 'Guru').sort((a,b) => a.nama.localeCompare(b.nama));
  const staff = filtered.filter(m => m.jabatan === 'Staff').sort((a,b) => a.nama.localeCompare(b.nama));
  const lain  = filtered.filter(m => m.jabatan !== 'Guru' && m.jabatan !== 'Staff').sort((a,b) => a.nama.localeCompare(b.nama));

  listEl.innerHTML = '';

  if (filtered.length === 0 && membersState.members.length === 0) {
    listEl.innerHTML = `
      <div class="borrower-dropdown-empty">
        <span>Belum ada data warga sekolah.</span>
        <br>
        <small>Tambahkan di tab <strong>Warga Sekolah</strong>.</small>
      </div>`;
    return;
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="borrower-dropdown-empty">
        <span>Tidak ditemukan "<strong>${escapeHtml(_dropdownQuery)}</strong>"</span>
        <br>
        <small>Nama ini akan dicatat apa adanya.</small>
      </div>`;
    return;
  }

  function renderGroup(label, members) {
    if (members.length === 0) return;
    const header = document.createElement('div');
    header.className = 'borrower-dropdown-header';
    header.textContent = label;
    listEl.appendChild(header);
    members.forEach(m => {
      const item = document.createElement('div');
      item.className = 'borrower-dropdown-item';
      item.dataset.id = m.id;
      item.innerHTML = `
        <div class="borrower-item-name">${escapeHtml(m.nama)}</div>
        <div class="borrower-item-meta">${m.nip ? escapeHtml(m.nip) + ' · ' : ''}${escapeHtml(m.jabatan)}</div>
      `;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectMemberById(m.id);
      });
      listEl.appendChild(item);
    });
  }

  renderGroup('Guru', guru);
  renderGroup('Staff', staff);
  if (lain.length) renderGroup('Lainnya', lain);
}

function selectMemberById(id) {
  const m = membersState.members.find(x => x.id === id);
  if (!m) return;
  const searchInput = document.getElementById('borrowerSearchInput');
  const clearBtn    = document.getElementById('borrowerClearBtn');
  const listEl      = document.getElementById('borrowerDropdownList');
  const chevron     = document.getElementById('borrowerChevron');

  _selectedMember = m;
  if (searchInput) searchInput.value = `${m.nama}${m.nip ? ' — ' + m.nip : ''}${m.jabatan ? ' ('+m.jabatan+')' : ''}`;
  const borrowerInput = document.getElementById('borrower');
  if (borrowerInput) borrowerInput.value = m.nama;
  if (clearBtn) clearBtn.style.display = '';
  if (listEl) listEl.style.display = 'none';
  if (chevron) chevron.style.transform = '';
  _dropdownOpen = false;
  _dropdownQuery = '';
}

/* Reset dropdown saat modal ditutup */
function resetBorrowerDropdown() {
  _selectedMember = null;
  _dropdownQuery = '';
  const searchInput = document.getElementById('borrowerSearchInput');
  const clearBtn    = document.getElementById('borrowerClearBtn');
  const listEl      = document.getElementById('borrowerDropdownList');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (listEl) listEl.style.display = 'none';
  _dropdownOpen = false;
}

/* Refresh dropdown list ketika data members berubah */
function refreshBorrowerDropdown() {
  if (_dropdownOpen) _renderDropdownList();
}

/* ══════════════════════════════════════════════════════════════════
   Render Tab Warga Sekolah
   ══════════════════════════════════════════════════════════════════ */

let membersFilter = 'all';
let membersSearchQuery = '';

function renderMembersList() {
  const wrap = document.getElementById('membersList');
  if (!wrap) return;

  const list = getMembersSorted(membersSearchQuery, membersFilter);

  if (list.length === 0) {
    wrap.innerHTML = `
      <div class="card">
        <div class="meta">
          ${membersState.members.length === 0
            ? 'Belum ada data warga sekolah. Tambahkan manual atau impor dari Excel.'
            : 'Tidak ada data yang cocok dengan filter.'}
        </div>
      </div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card member-card';
    card.dataset.id = m.id;
    card.innerHTML = `
      <div class="top">
        <div class="member-jabatan-badge ${m.jabatan === 'Guru' ? 'badge-guru' : m.jabatan === 'Staff' ? 'badge-staff' : 'badge-other'}">
          ${escapeHtml(m.jabatan || 'Lainnya')}
        </div>
      </div>
      <h3 class="member-name">${escapeHtml(m.nama)}</h3>
      ${m.nip ? `<div class="meta">NIP: ${escapeHtml(m.nip)}</div>` : '<div class="meta" style="color:var(--text-3)">Tanpa NIP</div>'}
      <div class="actions">
        <button class="btn primary" data-action="edit-member" data-id="${m.id}">Ubah</button>
        <button class="btn danger"  data-action="delete-member" data-id="${m.id}">Hapus</button>
      </div>
    `;
    frag.appendChild(card);
  });
  wrap.innerHTML = '';
  wrap.appendChild(frag);

  // Update counter
  const counter = document.getElementById('membersCount');
  if (counter) counter.textContent = `${membersState.members.length} warga`;
}

/* ══════════════════════════════════════════════════════════════════
   Inject Tab & UI ke DOM
   ══════════════════════════════════════════════════════════════════ */

function injectMembersTab() {
  // 1. Tambah tab button
  const tabNav = document.querySelector('nav.tabs');
  if (tabNav && !document.querySelector('[data-tab="members"]')) {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.tab = 'members';
    btn.setAttribute('role', 'tab');
    btn.innerHTML = `
      <span class="tab-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      </span>
      <span class="tab-label">Warga<br>Sekolah</span>
    `;
    btn.addEventListener('click', () => {
      if (typeof showView === 'function') showView('members');
    });
    tabNav.appendChild(btn);
  }

  // 2. Tambah section view
  const main = document.querySelector('main.main');
  if (main && !document.getElementById('members')) {
    const section = document.createElement('section');
    section.className = 'view';
    section.id = 'members';
    section.hidden = true;
    section.setAttribute('role', 'tabpanel');
    section.innerHTML = `
      <!-- Add member form -->
      <div class="section-box">
        <div class="section-title"><svg class="title-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.2 0-8 2.1-8 5v1h16v-1c0-2.9-3.8-5-8-5Z"/></svg> Tambah Warga Sekolah</div>
        <div class="form" id="addMemberForm">
          <div>
            <label for="memberNama">Nama Lengkap</label>
            <input class="input" id="memberNama" placeholder="Contoh: Ahmad Suryadi" type="text"/>
          </div>
          <div>
            <label for="memberNip">NIP <span style="font-weight:400;color:var(--text-3)">(opsional)</span></label>
            <input class="input" id="memberNip" placeholder="Nomor Induk Pegawai" type="text" inputmode="numeric"/>
          </div>
          <div>
            <label for="memberJabatan">Jabatan</label>
            <select class="select" id="memberJabatan">
              <option value="Guru">Guru</option>
              <option value="Staff">Staff</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div class="hr"></div>
          <button class="btn primary" type="button" id="addMemberBtn">Tambah Warga</button>
        </div>
      </div>

      <!-- Import / Template -->
      <div class="section-box members-import-box">
        <div class="section-title"><svg class="title-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3h1ZM4 18h16v2H4z"/></svg> Import dari Excel</div>
        <p class="meta" style="margin-bottom:12px;">Download template, isi data, lalu import kembali.</p>
        <div class="actions" style="flex-wrap:wrap;gap:8px;">
          <button class="btn ghost" type="button" id="downloadTemplateMemberBtn">
            Download Template Excel
          </button>
          <button class="btn primary" type="button" id="importMemberBtn">
            <svg class="inline-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4 8 6H4a2 2 0 0 0-2 2v8h2V8h4.8l2-2H20v4h2V6a2 2 0 0 0-2-2h-10Zm2 6v4H8l4 4 4-4h-4v-4h-2ZM2 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4h-2v4H4v-4H2v4Z"/></svg> Import dari Excel
          </button>
        </div>
      </div>

      <!-- Filter & Search -->
      <div class="search">
        <input id="membersSearch" class="input" placeholder="Cari nama, NIP, jabatan…" type="search"/>
        <button class="btn ghost" id="clearMembersSearch">Bersihkan</button>
      </div>
      <div class="actions chips" id="membersFilters">
        <button class="btn ghost active" data-members-filter="all"   type="button">Semua</button>
        <button class="btn ghost"        data-members-filter="Guru"  type="button">Guru</button>
        <button class="btn ghost"        data-members-filter="Staff" type="button">Staff</button>
      </div>

      <!-- Counter -->
      <div style="font-size:12px;color:var(--text-3);padding:0 4px 6px;" id="membersCount"></div>

      <!-- List -->
      <div class="list" id="membersList"></div>
    `;
    main.appendChild(section);

    _wireMembersUI(section);
  }
}

function _wireMembersUI(section) {
  // Add member
  document.getElementById('addMemberBtn').addEventListener('click', () => {
    const nama    = document.getElementById('memberNama').value.trim();
    const nip     = document.getElementById('memberNip').value.trim();
    const jabatan = document.getElementById('memberJabatan').value;
    if (!nama) { showToast('Nama wajib diisi', 'warning'); return; }
    addMember(nama, nip, jabatan);
    document.getElementById('memberNama').value = '';
    document.getElementById('memberNip').value  = '';
    renderMembersList();
    refreshBorrowerDropdown();
    showToast('Warga sekolah ditambahkan', 'success');
  });

  // Enter key on input
  ['memberNama','memberNip'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('addMemberBtn').click();
    });
  });

  // Download template
  document.getElementById('downloadTemplateMemberBtn').addEventListener('click', () => {
    downloadMemberTemplate();
    showToast('Template Excel diunduh', 'info');
  });

  // Import
  document.getElementById('importMemberBtn').addEventListener('click', importMembersFromExcel);

  // Search
  document.getElementById('membersSearch').addEventListener('input', (e) => {
    membersSearchQuery = e.target.value.trim();
    renderMembersList();
  });
  document.getElementById('clearMembersSearch').addEventListener('click', () => {
    document.getElementById('membersSearch').value = '';
    membersSearchQuery = '';
    renderMembersList();
  });

  // Filter chips
  section.querySelectorAll('[data-members-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      membersFilter = btn.dataset.membersFilter;
      section.querySelectorAll('[data-members-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMembersList();
    });
  });

  // Delegasi edit/delete
  document.getElementById('membersList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;

    if (action === 'delete-member') {
      showConfirm('Hapus data warga ini?', () => {
        deleteMember(id);
        renderMembersList();
        refreshBorrowerDropdown();
        showToast('Data warga dihapus', 'danger');
      });
    }

    if (action === 'edit-member') {
      const m = membersState.members.find(x => x.id === id);
      if (!m) return;
      const card = btn.closest('.card');
      card.innerHTML = `
        <div class="form" style="gap:8px;">
          <input class="input" id="editMemberNama"    value="${escapeHtml(m.nama)}"    placeholder="Nama lengkap"/>
          <input class="input" id="editMemberNip"     value="${escapeHtml(m.nip||'')}"  placeholder="NIP (opsional)" inputmode="numeric"/>
          <select class="select" id="editMemberJabatan">
            <option value="Guru"    ${m.jabatan==='Guru'   ?'selected':''}>Guru</option>
            <option value="Staff"   ${m.jabatan==='Staff'  ?'selected':''}>Staff</option>
            <option value="Lainnya" ${m.jabatan==='Lainnya'?'selected':''}>Lainnya</option>
          </select>
          <div class="actions">
            <button class="btn primary"  data-action="save-member"   data-id="${id}">Simpan</button>
            <button class="btn ghost"    data-action="cancel-member" data-id="${id}">Batal</button>
          </div>
        </div>
      `;
    }

    if (action === 'save-member') {
      const card    = btn.closest('.card');
      const nama    = card.querySelector('#editMemberNama').value.trim();
      const nip     = card.querySelector('#editMemberNip').value.trim();
      const jabatan = card.querySelector('#editMemberJabatan').value;
      if (!nama) { showToast('Nama wajib diisi', 'warning'); return; }
      updateMember(id, nama, nip, jabatan);
      renderMembersList();
      refreshBorrowerDropdown();
      showToast('Data warga diperbarui', 'success');
    }

    if (action === 'cancel-member') {
      renderMembersList();
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   Patch: Reset dropdown ketika borrow modal ditutup/reset
   ══════════════════════════════════════════════════════════════════ */
(function patchBorrowReset() {
  const _origClose = window.closeBorrowModal;
  window.closeBorrowModal = function () {
    resetBorrowerDropdown();
    if (_origClose) _origClose();
  };
})();

/* ══════════════════════════════════════════════════════════════════
   Init
   ══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadMembers();

  // Inject tab UI terlebih dahulu
  injectMembersTab();

  // Render list awal
  renderMembersList();

  // Build dropdown setelah modal ada di DOM
  // Modal borrowForm sudah ada di HTML, jadi langsung build
  setTimeout(() => {
    _buildBorrowerDropdown();
  }, 300);

  // Patch showView agar tab members bisa di-handle
  const _origShowView = window.showView;
  window.showView = function (id) {
    if (_origShowView) _origShowView(id);
    if (id === 'members') {
      renderMembersList();
    }
  };
});
