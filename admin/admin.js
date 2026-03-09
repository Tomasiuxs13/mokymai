/* ============================================================
   Web Genius — Admin Dashboard Logic
   ============================================================ */

/* ----------------------------------------------------------
   ENSURE SUPABASE IS LOADED (fallback for flaky dev server)
   ---------------------------------------------------------- */
async function ensureSupabase() {
  if (typeof getProfile === 'function' && typeof signOut === 'function') return;
  const res = await fetch('../supabase.js');
  const code = await res.text();
  const s = document.createElement('script');
  s.textContent = code;
  document.head.appendChild(s);
  await new Promise(r => setTimeout(r, 150));
}

/* ----------------------------------------------------------
   TOAST NOTIFICATIONS
   ---------------------------------------------------------- */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ----------------------------------------------------------
   MODAL HELPERS
   ---------------------------------------------------------- */
let _modalResolve = null; // for confirmDialog

function openModal(titleText, bodyHTML, onSave) {
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = titleText;
  document.getElementById('modalBody').innerHTML = bodyHTML;

  const saveBtn = document.getElementById('modalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  newSave.id = 'modalSave';
  newSave.textContent = 'Save';
  newSave.disabled = false;
  newSave.addEventListener('click', async () => {
    newSave.textContent = 'Saving…';
    newSave.disabled = true;
    try {
      await onSave();
      closeModal();
      showToast('Saved successfully!');
    } catch (err) {
      showToast(err.message || 'Save failed', 'error');
      newSave.textContent = 'Save';
      newSave.disabled = false;
    }
  });

  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  if (_modalResolve) { _modalResolve(false); _modalResolve = null; }
}

function confirmDialog(message) {
  return new Promise((resolve) => {
    _modalResolve = resolve;
    openModal(
      'Confirm',
      `<p style="color:var(--gray-600);font-size:.95rem;">${message}</p>`,
      async () => { _modalResolve = null; resolve(true); }
    );
    document.getElementById('modalSave').textContent = 'Confirm';
  });
}

/* ----------------------------------------------------------
   SUPABASE REFERENCE
   ---------------------------------------------------------- */
function sb() {
  return window.WebGeniusDB.supabase;
}

/* ----------------------------------------------------------
   PAGINATION HELPER
   ---------------------------------------------------------- */
class Paginator {
  constructor(containerId, renderFn, pageSize = 10) {
    this.containerId = containerId;
    this.renderFn = renderFn;
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.items = [];
    this.filteredItems = [];
    this.sortField = null;
    this.sortOrder = 'asc'; // 'asc' or 'desc'
  }

  init(items, resetPage = true) {
    this.items = items;
    this.filteredItems = [...items]; // Copy to avoid mutating original if needed
    if (resetPage) {
      this.currentPage = 1;
      this.sortField = null;
      this.sortOrder = 'asc';
    } else {
      const totalPages = Math.ceil(this.filteredItems.length / this.pageSize);
      if (this.currentPage > totalPages) this.currentPage = Math.max(1, totalPages);
    }
    this.update();
  }

  // Update data after filtering
  setFilteredItems(items) {
    this.filteredItems = [...items];
    this.currentPage = 1;
    this.update();
  }

  sort(field) {
    if (this.sortField === field) {
      // Toggle order
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.update();
  }

  update() {
    // 1. Sort
    if (this.sortField) {
      this.filteredItems.sort((a, b) => {
        let valA = a[this.sortField];
        let valB = b[this.sortField];

        // Handle nested properties (e.g. cohorts.name)
        if (this.sortField.includes('.')) {
          const parts = this.sortField.split('.');
          valA = parts.reduce((obj, key) => obj?.[key], a);
          valB = parts.reduce((obj, key) => obj?.[key], b);
        }

        // Handle nulls/undefined
        if (valA == null) valA = '';
        if (valB == null) valB = '';

        // Case-insensitive string comparison
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 2. Paginate
    const total = this.filteredItems.length;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, total);
    const slice = this.filteredItems.slice(start, end);

    // 3. Render data
    this.renderFn(slice);

    // 4. Render controls & Update headers
    this.renderControls(total, start, end);
    this.updateHeaders();
  }

  renderControls(total, start, end) {
    const container = document.getElementById(this.containerId);
    if (!container) return; // Should not happen if HTML matches

    if (total === 0) {
      container.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(total / this.pageSize);
    const showingStart = start + 1;
    const showingEnd = end;

    // Page buttons logic
    let pagesHtml = '';
    const maxBtns = 5;
    let btnStart = Math.max(1, this.currentPage - Math.floor(maxBtns / 2));
    let btnEnd = Math.min(totalPages, btnStart + maxBtns - 1);
    if (btnEnd - btnStart + 1 < maxBtns) {
      btnStart = Math.max(1, btnEnd - maxBtns + 1);
    }

    if (btnStart > 1) {
      pagesHtml += `<button onclick="window.paginators['${this.containerId}'].goto(1)">1</button>`;
      if (btnStart > 2) pagesHtml += `<span class="pg-ellipsis">…</span>`;
    }

    for (let i = btnStart; i <= btnEnd; i++) {
      pagesHtml += `<button class="${i === this.currentPage ? 'pg-active' : ''}" onclick="window.paginators['${this.containerId}'].goto(${i})">${i}</button>`;
    }

    if (btnEnd < totalPages) {
      if (btnEnd < totalPages - 1) pagesHtml += `<span class="pg-ellipsis">…</span>`;
      pagesHtml += `<button onclick="window.paginators['${this.containerId}'].goto(${totalPages})">${totalPages}</button>`;
    }

    container.innerHTML = `
      <div class="pagination-bar">
        <div class="pagination-info">Showing ${showingStart}-${showingEnd} of ${total}</div>
        <div class="pagination-pages">
          ${pagesHtml}
        </div>
        <div class="pagination-controls">
          <select onchange="window.paginators['${this.containerId}'].setSize(this.value)">
            <option value="10" ${this.pageSize == 10 ? 'selected' : ''}>10 / pg</option>
            <option value="25" ${this.pageSize == 25 ? 'selected' : ''}>25 / pg</option>
            <option value="50" ${this.pageSize == 50 ? 'selected' : ''}>50 / pg</option>
          </select>
          <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.paginators['${this.containerId}'].prev()">Prev</button>
          <button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.paginators['${this.containerId}'].next()">Next</button>
        </div>
      </div>
    `;
  }

  updateHeaders() {
    // Find the table associated with this paginator.
    // We assume the paginator container is a sibling or near the table.
    // For simplicity, we can pass the table selector or ID to the constructor,
    // OR we can look for .data-table in the same section.
    // A more robust way: let's rely on data-sort attributes in the document
    // that match the current section or table.
    // Actually, distinct paginators are usually unique per table.
    // Let's look for headers with `onclick="window.paginators['...'].sort('...')"`
    // OR, we update ALL headers that point to THIS paginator instance.

    // Better approach: We will attach listeners once. Here we just update classes.
    // We need to know WHICH table headers to update.
    // Let's assume the paginator container is right after the table in the DOM.
    const container = document.getElementById(this.containerId);
    if (!container) return;
    const section = container.closest('.admin-section'); // or .data-table-wrap
    if (!section) return;

    const headers = section.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
      const field = th.dataset.sort;
      th.classList.remove('sort-asc', 'sort-desc');
      if (field === this.sortField) {
        th.classList.add(this.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
        // Add icon
        let icon = th.querySelector('.sort-icon');
        if (!icon) {
          icon = document.createElement('span');
          icon.className = 'sort-icon';
          th.appendChild(icon);
        }
        icon.textContent = this.sortOrder === 'asc' ? ' ↑' : ' ↓';
      } else {
        // Clear icon
        const icon = th.querySelector('.sort-icon');
        if (icon) icon.textContent = '';
      }
    });
  }

  attachSorting() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    const section = container.closest('.admin-section') || container.closest('.data-table-wrap');
    // Fallback to data-table-wrap if section is not found (e.g. nested tables) or general close parent
    if (!section) return;

    const headers = section.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
      th.style.cursor = 'cursor';
      th.style.userSelect = 'none';
      th.onclick = () => {
        this.sort(th.dataset.sort);
      };
      // Add hover effect via class if needed, or inline style
      th.onmouseover = () => th.style.color = 'var(--primary-600)';
      th.onmouseout = () => th.style.color = '';
    });
  }

  goto(page) {
    this.currentPage = page;
    this.update();
  }

  prev() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.update();
    }
  }

  next() {
    const totalPages = Math.ceil(this.filteredItems.length / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.update();
    }
  }

  setSize(size) {
    this.pageSize = parseInt(size);
    this.currentPage = 1;
    this.update();
  }
}

window.paginators = {}; // Registry for global access


/* ----------------------------------------------------------
   ROUTING (hash-based)
   ---------------------------------------------------------- */
const sections = ['dashboard', 'registrations', 'cohorts', 'courses', 'lessons', 'assignments', 'schedule', 'students', 'parents', 'diplomas', 'progress', 'announcements', 'settings'];


function navigate(section) {
  window.location.hash = section;
}

function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const section = sections.includes(hash) ? hash : 'dashboard';

  // Toggle active section
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${section}`);
  if (target) target.classList.add('active');

  // Toggle active nav link
  document.querySelectorAll('.sidebar-nav a[data-section]').forEach(a => {
    a.classList.toggle('active', a.dataset.section === section);
  });

  // Update topbar title
  const titles = {
    dashboard: 'Dashboard',
    registrations: 'Course Registrations (Leads)',
    cohorts: 'Cohort Management',
    courses: 'Courses & Lessons',
    assignments: 'Assignments',
    schedule: 'Class Schedule',
    students: 'Student Management',
    parents: 'Parent Management',
    diplomas: 'Diploma Management',
    progress: 'Progress Overview',
    announcements: 'Announcements',
    settings: 'Platform Settings',
  };
  document.getElementById('topbarTitle').textContent = titles[section] || 'Dashboard';

  // Load section data
  loadSectionData(section);
}

async function loadSectionData(section) {
  try {
    switch (section) {
      case 'dashboard': await loadDashboard(); break;
      case 'registrations': await loadRegistrations(); break;
      case 'cohorts': await loadCohorts(); break;
      case 'courses': await loadCourses(); break;
      case 'assignments': await loadAssignments(); break;
      case 'schedule': await loadSchedule(); break;
      case 'students': await loadStudents(); break;
      case 'parents': await loadParents(); break;
      case 'diplomas': await loadDiplomas(); break;
      case 'progress': await loadProgress(); break;
      case 'announcements': await loadAnnouncements(); break;
      case 'settings': await loadSettings(); break;
    }
  } catch (err) {
    console.error(`Error loading ${section}:`, err);
    showToast(`Failed to load ${section}: ${err.message}`, 'error');
  }
}

/* ----------------------------------------------------------
   DASHBOARD
   ---------------------------------------------------------- */
async function loadDashboard() {
  const [studentsRes, parentsRes, cohortsRes, enrollmentsRes] = await Promise.all([
    sb().from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    sb().from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
    sb().from('cohorts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    sb().from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  document.getElementById('statStudents').textContent = studentsRes.count ?? 0;
  document.getElementById('statParents').textContent = parentsRes.count ?? 0;
  document.getElementById('statCohorts').textContent = cohortsRes.count ?? 0;
  document.getElementById('statEnrollments').textContent = enrollmentsRes.count ?? 0;

  // Load Charts & Widgets
  loadDashboardCharts();
  loadPendingSubmissions();
}

async function loadDashboardCharts() {
  // 1. Student Growth (Last 6 months)
  // We need created_at from profiles
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Start of month

  const { data: profiles } = await sb().from('profiles')
    .select('created_at')
    .eq('role', 'student')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at');

  // Process for chart
  const months = {};
  // Init last 6 months
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('default', { month: 'short' });
    months[key] = 0;
  }

  if (profiles) {
    profiles.forEach(p => {
      const d = new Date(p.created_at);
      const key = d.toLocaleString('default', { month: 'short' });
      if (months[key] !== undefined) months[key]++;
    });
  }

  // Sort months chronologically
  const labels = Object.keys(months).reverse(); // This might be wrong order if we iterated backwards.
  // Actually, let's build labels array correctly
  const chartLabels = [];
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('default', { month: 'short' });
    chartLabels.push(key);
    chartData.push(months[key] || 0);
  }

  renderStudentGrowthChart(chartLabels, chartData);


  // 2. Course Completion
  // We need enrollment completion stats? Or lesson_progress?
  // Simplest: Avg progress_pct from lesson_progress grouped by course... wait, lesson_progress is by lesson.
  // We can join lessons -> course.
  // Ideally we use a view or RPC, but let's do client-side agg for now (dataset is small).
  const { data: progress } = await sb().from('lesson_progress').select('progress_pct, lessons(course_id, courses(title))');

  const courseStats = {}; // { 'Course Title': { total: 0, count: 0 } }

  if (progress) {
    progress.forEach(p => {
      const course = p.lessons?.courses;
      if (course) {
        if (!courseStats[course.title]) courseStats[course.title] = { total: 0, count: 0 };
        courseStats[course.title].total += (p.progress_pct || 0);
        courseStats[course.title].count++;
      }
    });
  }

  const courseLabels = Object.keys(courseStats);
  const courseData = courseLabels.map(l => Math.round(courseStats[l].total / courseStats[l].count));

  renderCompletionChart(courseLabels, courseData);
}

let growthChart = null;
let completionChart = null;

function renderStudentGrowthChart(labels, data) {
  const ctx = document.getElementById('chartStudentGrowth').getContext('2d');
  if (growthChart) growthChart.destroy();

  growthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'New Students',
        data: data,
        borderColor: '#7C3AED', // purple
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

function renderCompletionChart(labels, data) {
  const ctx = document.getElementById('chartCompletion').getContext('2d');
  if (completionChart) completionChart.destroy();

  completionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Avg Completion %',
        data: data,
        backgroundColor: '#60A5FA', // blue-light
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

// 3. Pending Submissions Widget
async function loadPendingSubmissions() {
  const container = document.getElementById('pendingGradingList');

  // Fetch submissions without grade
  const { data: subs, error } = await sb()
    .from('submissions')
    .select('*, assignments(title), profiles(full_name)')
    .is('grade', null)
    .order('submitted_at', { ascending: false })
    .limit(10);

  if (error || !subs || subs.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:var(--space-md);font-size:.9rem"><p>${error ? 'Error loading' : 'All caught up! No pending submissions.'}</p></div>`;
    return;
  }

  container.innerHTML = subs.map(s => `
    <div style="padding: .8rem; border-bottom: 1px solid var(--gray-50); display: flex; justify-content: space-between; align-items: center; transition: background .2s" class="hover-bg">
      <div>
        <div style="font-weight: 600; font-size: .9rem; color: var(--gray-900)">${esc(s.assignments?.title)}</div>
        <div style="font-size: .8rem; color: var(--gray-500)">
          by ${esc(s.profiles?.full_name || 'Unknown')} • ${formatDate(s.submitted_at)}
        </div>
      </div>
      <button class="btn-sm btn-edit" onclick="navigate('assignments'); setTimeout(()=>openGradingModal('${s.id}'), 500)">Grade</button>
    </div>
  `).join('');
}

/* ----------------------------------------------------------
   COHORTS
   ---------------------------------------------------------- */
let cohortsCache = [];

async function loadCohorts() {
  const { data, error } = await sb().from('cohorts').select('*').order('starts_at', { ascending: false });
  if (error) throw error;
  cohortsCache = data || [];

  if (!window.paginators['cohortsPagination']) {
    window.paginators['cohortsPagination'] = new Paginator('cohortsPagination', renderCohorts, 10);
    window.paginators['cohortsPagination'].attachSorting();
  }
  window.paginators['cohortsPagination'].init(cohortsCache);
}

function renderCohorts(cohorts) {
  const tbody = document.getElementById('cohortsTableBody');
  if (!cohorts.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><p>No cohorts yet. Create your first one!</p></td></tr>`;
    return;
  }
  tbody.innerHTML = cohorts.map(c => {
    const langBadge = c.language === 'lt'
      ? '<span class="lang-badge lang-badge-lt">🇱🇹 LT</span>'
      : '<span class="lang-badge lang-badge-en">🇺🇸 EN</span>';

    // Type Badge
    let typeBadge = '';
    if (c.is_recurring) {
      typeBadge = '<span class="badge" style="background:var(--purple-100);color:var(--purple-700);margin-right:0.3rem">🔄 Recurring</span>';
    }

    let actions = `
        <button class="btn-sm btn-edit" onclick="editCohort('${c.id}')">Edit</button>
        <button class="btn-sm btn-danger" onclick="deleteCohort('${c.id}')">Delete</button>
    `;

    if (c.is_recurring) {
      actions = `
            <button class="btn-sm" style="background:var(--purple-100);color:var(--purple-700);margin-right:4px" onclick="generateCohortSessions('${c.id}')">Generate Schedule</button>
            ${actions}
        `;
    }

    return `
    <tr>
      <td>${typeBadge}<strong style="color:var(--gray-900)">${esc(c.name)}</strong></td>
      <td>${langBadge}</td>
      <td>${formatDate(c.starts_at)}</td>
      <td>${formatDate(c.ends_at)}</td>
      <td>${c.max_seats}</td>
      <td>$${c.price_usd} / €${c.price_eur}</td>
      <td><span class="badge badge-${c.status}">${c.status}</span></td>
      <td class="actions-cell">
        ${actions}
      </td>
    </tr>
  `;
  }).join('');
}

let cohortLangFilter = 'all';
function filterCohortsByLang(lang) {
  cohortLangFilter = lang;
  document.querySelectorAll('#cohortLangFilter .lang-tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`#cohortLangFilter .lang-tab[onclick="filterCohortsByLang('${lang}')"]`).classList.add('active');
  const filtered = lang === 'all' ? cohortsCache : cohortsCache.filter(c => (c.language || 'en') === lang);
  if (window.paginators['cohortsPagination']) {
    window.paginators['cohortsPagination'].setFilteredItems(filtered);
  } else {
    renderCohorts(filtered);
  }
}

function openCohortModal(cohort = null) {
  const isEdit = !!cohort;

  // Parse existing schedule pattern or default
  const pattern = cohort?.schedule_pattern || {};
  const defaultDay = pattern.days ? pattern.days[0] : 'Monday';
  const defaultTime = pattern.time || '18:00';
  const defaultDuration = pattern.duration_minutes || 60;

  openModal(
    isEdit ? 'Edit Cohort' : 'Create Cohort',
    `
      <div class="form-row">
        <div class="form-group">
          <label>Cohort Name</label>
          <input id="mCohortName" value="${esc(cohort?.name || '')}" placeholder="e.g. Spring 2026 or Robotics Club" />
        </div>
        <div class="form-group">
          <label>Language</label>
          <select id="mCohortLang">
            <option value="en" ${(cohort?.language || 'en') === 'en' ? 'selected' : ''}>🇺🇸 English</option>
            <option value="lt" ${cohort?.language === 'lt' ? 'selected' : ''}>🇱🇹 Lietuvių</option>
          </select>
        </div>
      </div>

       <div id="recurringWrapper" class="recurring-wrapper ${cohort?.is_recurring ? 'active' : ''}">
        <div class="recurring-header">
            <div class="recurring-info">
                <span class="recurring-title">Recurring Class? (Būrelis)</span>
                <span class="recurring-desc">Enable weekly schedule pattern (replaces fixed dates)</span>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" id="mCohortRecurring" ${cohort?.is_recurring ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        </div>

        <div id="scheduleFields" class="recurring-schedule" style="display:${cohort?.is_recurring ? 'block' : 'none'};">
            <h4 style="font-size:0.75rem;margin-bottom:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--purple-600);font-weight:700">Weekly Schedule Pattern</h4>
            <div class="form-row">
                <div class="form-group">
                    <label>Day of Week</label>
                    <select id="mSchedDay">
                        <option value="Monday" ${defaultDay === 'Monday' ? 'selected' : ''}>Monday</option>
                        <option value="Tuesday" ${defaultDay === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
                        <option value="Wednesday" ${defaultDay === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
                        <option value="Thursday" ${defaultDay === 'Thursday' ? 'selected' : ''}>Thursday</option>
                        <option value="Friday" ${defaultDay === 'Friday' ? 'selected' : ''}>Friday</option>
                        <option value="Saturday" ${defaultDay === 'Saturday' ? 'selected' : ''}>Saturday</option>
                        <option value="Sunday" ${defaultDay === 'Sunday' ? 'selected' : ''}>Sunday</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <input type="time" id="mSchedTime" value="${defaultTime}" />
                </div>
                <div class="form-group">
                    <label>Duration (min)</label>
                    <input type="number" id="mSchedDuration" value="${defaultDuration}" />
                </div>
            </div>
        </div>
      </div>

       <div class="form-row">
        <div class="form-group">
          <label id="lblStart">Start Date (First Session)</label>
          <input type="date" id="mCohortStart" value="${cohort?.starts_at?.slice(0, 10) || ''}" />
        </div>
        <div class="form-group">
          <label id="lblEnd">End Date (Last Session)</label>
          <input type="date" id="mCohortEnd" value="${cohort?.ends_at?.slice(0, 10) || ''}" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Max Seats</label>
          <input type="number" id="mCohortSeats" value="${cohort?.max_seats ?? 30}" />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="mCohortStatus">
            <option value="upcoming" ${cohort?.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
            <option value="active" ${cohort?.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="completed" ${cohort?.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Price (USD)</label>
          <input type="number" step="0.01" id="mCohortUSD" value="${cohort?.price_usd ?? 750}" />
        </div>
        <div class="form-group">
          <label>Price (EUR)</label>
          <input type="number" step="0.01" id="mCohortEUR" value="${cohort?.price_eur ?? 360}" />
        </div>
      </div>
    `,
    async () => {
      const isRecurring = document.getElementById('mCohortRecurring').checked;

      let schedulePattern = {};
      if (isRecurring) {
        schedulePattern = {
          days: [document.getElementById('mSchedDay').value],
          time: document.getElementById('mSchedTime').value,
          duration_minutes: parseInt(document.getElementById('mSchedDuration').value) || 60,
          frequency: 'weekly'
        };
      }

      const payload = {
        name: document.getElementById('mCohortName').value.trim(),
        language: document.getElementById('mCohortLang').value,
        starts_at: document.getElementById('mCohortStart').value,
        ends_at: document.getElementById('mCohortEnd').value,
        max_seats: parseInt(document.getElementById('mCohortSeats').value) || 30,
        status: document.getElementById('mCohortStatus').value,
        price_usd: parseFloat(document.getElementById('mCohortUSD').value) || 750,
        price_eur: parseFloat(document.getElementById('mCohortEUR').value) || 360,
        is_recurring: isRecurring,
        schedule_pattern: schedulePattern
      };

      if (!payload.name) throw new Error('Name is required');
      if (!payload.starts_at || !payload.ends_at) throw new Error('Start and end dates are required');

      if (isEdit) {
        const { error } = await sb().from('cohorts').update(payload).eq('id', cohort.id);
        if (error) throw error;
      } else {
        const { error } = await sb().from('cohorts').insert(payload);
        if (error) throw error;
      }
      await loadCohorts();
    }
  );

  // robust event listener attachment
  setTimeout(() => {
    const cb = document.getElementById('mCohortRecurring');
    if (cb) {
      // Use the new function name
      cb.removeEventListener('change', window.updateScheduleUI);
      cb.addEventListener('change', window.updateScheduleUI);
      window.updateScheduleUI(); // Initial state
    }
  }, 100);
}

// Global function (renamed)
window.updateScheduleUI = function () {
  const checkbox = document.getElementById('mCohortRecurring');
  if (!checkbox) return;

  const isRecurring = checkbox.checked;
  const wrapper = document.getElementById('recurringWrapper');
  const fields = document.getElementById('scheduleFields');
  const lblStart = document.getElementById('lblStart');
  const lblEnd = document.getElementById('lblEnd');

  if (wrapper) {
    if (isRecurring) wrapper.classList.add('active');
    else wrapper.classList.remove('active');
  }

  if (fields) {
    fields.style.display = isRecurring ? 'block' : 'none';
  }

  if (lblStart) lblStart.textContent = isRecurring ? 'Term Start (First Class)' : 'Start Date (First Session)';
  if (lblEnd) lblEnd.textContent = isRecurring ? 'Term End (Last Class)' : 'End Date (Last Session)';
};

function editCohort(id) {
  const c = cohortsCache.find(x => x.id === id);
  if (c) openCohortModal(c);
}

async function deleteCohort(id) {
  const ok = await confirmDialog('Are you sure you want to delete this cohort? All linked enrollments will be affected.');
  if (!ok) return;
  const { error } = await sb().from('cohorts').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Cohort deleted');
  await loadCohorts();
}

async function generateCohortSessions(cohortId) {
  const cohort = cohortsCache.find(c => c.id === cohortId);
  if (!cohort || !cohort.is_recurring) return;

  const pattern = cohort.schedule_pattern;
  if (!pattern || !pattern.days || !pattern.days.length || !pattern.time) {
    showToast('Invalid schedule pattern. Please edit the cohort.', 'error');
    return;
  }

  const confirm = await confirmDialog(`Generate sessions for ${cohort.name}? This will create weekly sessions from ${cohort.starts_at} to ${cohort.ends_at}.`);
  if (!confirm) return;

  // Logic to generate dates
  const start = new Date(cohort.starts_at);
  const end = new Date(cohort.ends_at);
  const timeParts = pattern.time.split(':');
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);
  const duration = pattern.duration_minutes || 60;

  // Map day names to 0-6 (Sun-Sat)
  const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
  const targetDays = pattern.days.map(d => dayMap[d]);

  const sessions = [];
  let current = new Date(start);

  // Loop through dates
  while (current <= end) {
    if (targetDays.includes(current.getDay())) {
      // Found a match
      const sessionStart = new Date(current);
      sessionStart.setHours(hour, minute, 0, 0);

      const sessionEnd = new Date(sessionStart);
      sessionEnd.setMinutes(sessionEnd.getMinutes() + duration);

      sessions.push({
        cohort_id: cohort.id,
        title: `${cohort.name} - Weekly Class`,
        description: `Weekly recurring class.`,
        start_time: sessionStart.toISOString(),
        end_time: sessionEnd.toISOString(),
        status: 'scheduled'
      });
    }
    current.setDate(current.getDate() + 1);
  }

  if (sessions.length === 0) {
    showToast('No sessions generated. Check date range and days.', 'warning');
    return;
  }

  // Insert batches
  const { error } = await sb().from('scheduled_sessions').insert(sessions);
  if (error) {
    console.error(error);
    showToast('Error generating sessions: ' + error.message, 'error');
  } else {
    showToast(`Successfully created ${sessions.length} sessions!`);
    // Optionally switch to Schedule tab to see them
  }
}

/* ----------------------------------------------------------
   COURSES & LESSONS
   ---------------------------------------------------------- */
let coursesCache = [];
let selectedCourseId = null;

async function loadCourses() {
  const { data, error } = await sb().from('courses').select('*, cohorts(name)').order('sort_order');
  if (error) throw error;
  coursesCache = data || [];

  if (!window.paginators['coursesPagination']) {
    window.paginators['coursesPagination'] = new Paginator('coursesPagination', renderCourses, 10);
    window.paginators['coursesPagination'].attachSorting();
  }
  // If we are reloading (e.g. after edit), try to keep page. 
  // For initial load, it starts at 1.
  // Actually, loadCourses() is usually called after mutations. Let's keep it simple: reset to 1.
  // But wait, if I edit a course and save, loadCourses runs. If I was on page 2, I want to stay on page 2.
  // Let's pass false to init if we already have a paginator.
  // Actually, I'll just rely on my new optional init arg.
  const hasPaginator = !!window.paginators['coursesPagination'].items.length;
  window.paginators['coursesPagination'].init(coursesCache, !hasPaginator);

  // If a course was previously selected, reload its lessons
  if (selectedCourseId && coursesCache.find(c => c.id === selectedCourseId)) {
    await loadLessons(selectedCourseId);
  } else {
    selectedCourseId = null;
    document.getElementById('lessonPanel').innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><p>Select a course to view its lessons</p></div>';
  }
}

function renderCourses(courses) {
  const tbody = document.getElementById('coursesTableBody');
  if (!courses.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><p>No courses yet. Create one to get started!</p></td></tr>`;
    return;
  }
  tbody.innerHTML = courses.map(c => {
    const thumb = c.thumbnail
      ? `<img src="${esc(c.thumbnail)}" alt="" style="width:36px;height:36px;border-radius:var(--radius-sm);object-fit:cover;margin-right:.6rem;vertical-align:middle">`
      : `<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:var(--radius-sm);background:var(--gray-100);color:var(--gray-400);font-size:1rem;margin-right:.6rem;vertical-align:middle">📚</span>`;
    const langBadge = (c.language || 'en') === 'lt'
      ? '<span class="lang-badge lang-badge-lt">🇱🇹 LT</span>'
      : '<span class="lang-badge lang-badge-en">🇺🇸 EN</span>';
    return `
    <tr class="${selectedCourseId === c.id ? 'selected-row' : ''}" style="cursor:pointer" onclick="selectCourse('${c.id}')">
      <td>
        <div style="display:flex;align-items:center">
          ${thumb}
          <strong style="color:var(--gray-900)">${esc(c.title)}</strong>
        </div>
      </td>
      <td>${langBadge}</td>
      <td><span class="badge badge-${c.type === 'live' ? 'active' : 'upcoming'}">${c.type}</span></td>
      <td>${c.cohorts?.name || '—'}</td>
      <td>${c.month ? 'Month ' + c.month : '—'}</td>
      <td class="actions-cell">
        <button class="btn-sm" style="background:var(--primary-100);color:var(--primary-700);margin-right:4px" onclick="event.stopPropagation(); window.location.href='builder.html?id=${c.id}'">Builder</button>
        <button class="btn-sm btn-edit" onclick="event.stopPropagation(); editCourse('${c.id}')">Edit</button>
        <button class="btn-sm btn-danger" onclick="event.stopPropagation(); deleteCourse('${c.id}')">Delete</button>
      </td>
    </tr>
  `;
  }).join('');
}

let courseLangFilter = 'all';
function filterCoursesByLang(lang) {
  courseLangFilter = lang;
  document.querySelectorAll('#courseLangFilter .lang-tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`#courseLangFilter .lang-tab[onclick="filterCoursesByLang('${lang}')"]`).classList.add('active');
  const filtered = lang === 'all' ? coursesCache : coursesCache.filter(c => (c.language || 'en') === lang);
  if (window.paginators['coursesPagination']) {
    window.paginators['coursesPagination'].setFilteredItems(filtered);
  } else {
    renderCourses(filtered);
  }
}

function openCourseModal(course = null) {
  const isEdit = !!course;
  const cohortOptions = cohortsCache.length
    ? cohortsCache.map(c => `<option value="${c.id}" ${course?.cohort_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')
    : '';

  openModal(
    isEdit ? 'Edit Course' : 'Create Course',
    `
      <div class="form-row">
        <div class="form-group">
          <label>Title</label>
          <input id="mCourseTitle" value="${esc(course?.title || '')}" placeholder="e.g. AI Art & Storytelling" />
        </div>
        <div class="form-group">
          <label>Language</label>
          <select id="mCourseLang">
            <option value="en" ${(course?.language || 'en') === 'en' ? 'selected' : ''}>🇺🇸 English</option>
            <option value="lt" ${course?.language === 'lt' ? 'selected' : ''}>🇱🇹 Lietuvių</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="mCourseDesc">${esc(course?.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Thumbnail</label>
        <div style="display:flex;gap:var(--space-md);align-items:flex-start">
          <div style="flex:1">
            <input id="mCourseThumbUrl" value="${esc(course?.thumbnail || '')}" placeholder="Image URL or upload below" oninput="updateThumbPreview()" />
            <div style="margin-top:.5rem">
              <label for="mCourseThumbFile" style="display:inline-flex;align-items:center;gap:.3rem;padding:.4rem .8rem;border-radius:var(--radius-sm);background:var(--primary-50);color:var(--primary-700);font-size:.82rem;font-weight:600;cursor:pointer;border:1px dashed var(--primary-200)">
                📤 Upload Image
              </label>
              <input type="file" id="mCourseThumbFile" accept="image/*" style="display:none" onchange="handleThumbFileSelect(this)" />
              <span id="mCourseThumbFileName" style="font-size:.78rem;color:var(--gray-400);margin-left:.5rem"></span>
            </div>
          </div>
          <div id="mCourseThumbPreview" style="width:80px;height:80px;border-radius:var(--radius-sm);background:var(--gray-100);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">
            ${course?.thumbnail
      ? `<img src="${esc(course.thumbnail)}" style="width:100%;height:100%;object-fit:cover" />`
      : '<span style="color:var(--gray-300);font-size:1.5rem">🖼</span>'}
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Type</label>
          <select id="mCourseType">
            <option value="self_paced" ${course?.type === 'self_paced' ? 'selected' : ''}>Self-Paced</option>
            <option value="live" ${course?.type === 'live' ? 'selected' : ''}>Live</option>
          </select>
        </div>
        <div class="form-group">
          <label>Month (live only)</label>
          <input type="number" id="mCourseMonth" min="1" max="12" value="${course?.month || ''}" placeholder="1-3" />
        </div>
      </div>
      <div class="form-group">
        <label>Cohort</label>
        <select id="mCourseCohort">
          <option value="">— None (Self-Paced) —</option>
          ${cohortOptions}
        </select>
      </div>
    `,
    async () => {
      const payload = {
        title: document.getElementById('mCourseTitle').value.trim(),
        language: document.getElementById('mCourseLang').value,
        description: document.getElementById('mCourseDesc').value.trim(),
        type: document.getElementById('mCourseType').value,
        month: parseInt(document.getElementById('mCourseMonth').value) || null,
        cohort_id: document.getElementById('mCourseCohort').value || null,
      };
      if (!payload.title) throw new Error('Title is required');

      // Handle thumbnail - check for pending file upload
      const fileInput = document.getElementById('mCourseThumbFile');
      const thumbUrl = document.getElementById('mCourseThumbUrl').value.trim();

      if (fileInput.files.length > 0) {
        // Upload file first
        const courseId = isEdit ? course.id : 'temp-' + Date.now();
        try {
          payload.thumbnail = await uploadCourseThumbnail(fileInput.files[0], courseId);
        } catch (e) {
          console.error('Thumbnail upload failed:', e);
          // Fall back to URL if upload fails
          payload.thumbnail = thumbUrl || null;
        }
      } else {
        payload.thumbnail = thumbUrl || null;
      }

      if (isEdit) {
        const { error } = await sb().from('courses').update(payload).eq('id', course.id);
        if (error) throw error;
      } else {
        payload.sort_order = coursesCache.length;
        const { data, error } = await sb().from('courses').insert(payload).select().single();
        if (error) throw error;

        // Redirect to builder
        window.location.href = `builder.html?id=${data.id}`;
        return; // Stop here, page will unload
      }
      await loadCourses();

      // If it was a new course, redirect to builder
      if (!isEdit && !error) {
        // We need the ID of the new course
        // The insert call above didn't return data. Let's fix that.
        // OR we can just query for the latest course, OR change the insert to select().

        // PROPER WAY: Update the insert call to return the new record.
      }
    }
  );
}

function editCourse(id) {
  const c = coursesCache.find(x => x.id === id);
  if (c) openCourseModal(c);
}

function updateThumbPreview() {
  const url = document.getElementById('mCourseThumbUrl').value.trim();
  const preview = document.getElementById('mCourseThumbPreview');
  if (url) {
    preview.innerHTML = `<img src="${esc(url)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=\\'color:var(--gray-300);font-size:1.5rem\\'>⚠️</span>'" />`;
  } else {
    preview.innerHTML = '<span style="color:var(--gray-300);font-size:1.5rem">\ud83d\uddbc</span>';
  }
}

function handleThumbFileSelect(input) {
  const file = input.files[0];
  const nameEl = document.getElementById('mCourseThumbFileName');
  if (!file) { nameEl.textContent = ''; return; }

  nameEl.textContent = file.name;

  // Show local preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('mCourseThumbPreview').innerHTML =
      `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover" />`;
    // Clear URL field since file takes priority
    document.getElementById('mCourseThumbUrl').value = '';
  };
  reader.readAsDataURL(file);
}

async function deleteCourse(id) {
  const ok = await confirmDialog('Delete this course and all its lessons?');
  if (!ok) return;
  const { error } = await sb().from('courses').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Course deleted');
  if (selectedCourseId === id) selectedCourseId = null;
  await loadCourses();
}

async function selectCourse(id) {
  selectedCourseId = id;
  // Re-render current page to update highlights
  if (window.paginators['coursesPagination']) {
    window.paginators['coursesPagination'].update();
  } else {
    renderCourses(coursesCache);
  }
  loadLessons(id);
}

/* ——— Lessons ——— */
let lessonsCache = [];

async function loadLessons(courseId) {
  const { data, error } = await sb().from('lessons').select('*').eq('course_id', courseId).order('sort_order');
  if (error) throw error;
  lessonsCache = data || [];
  renderLessons();
}

function renderLessons() {
  const panel = document.getElementById('lessonPanel');
  const course = coursesCache.find(c => c.id === selectedCourseId);
  const title = course ? esc(course.title) : 'Lessons';

  let html = `
    <div class="table-header" style="margin-bottom:var(--space-md)">
      <h2>${title} — Lessons</h2>
      <button class="btn-sm btn-edit" onclick="openLessonModal()">+ Add Lesson</button>
    </div>
  `;

  if (!lessonsCache.length) {
    html += '<div class="empty-state"><p>No lessons yet. Add the first one!</p></div>';
  } else {
    html += '<div class="lesson-list" id="lessonList">';
    lessonsCache.forEach((l, i) => {
      const hasContent = l.content?.html && l.content.html.trim().length > 10;
      html += `
        <div class="lesson-item" draggable="true" data-id="${l.id}" ondragstart="handleDragStart(event)" ondragover="handleDragOver(event)" ondrop="handleDrop(event)" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)">
          <div class="lesson-info">
            <span class="lesson-drag-handle" style="cursor:grab;margin-right:10px;color:var(--gray-400)">☰</span>
            <span class="lesson-order">${i + 1}</span>
            <div>
              <div class="lesson-title">
                ${esc(l.title)}
                ${hasContent ? '<span class="lesson-content-badge">✅ Content</span>' : ''}
              </div>
              <div class="lesson-meta">${l.duration_min || 0} min · ${l.is_free ? '🆓 Free' : '🔒 Premium'}</div>
            </div>
          </div>
          <div class="actions-cell">
            <button class="btn-sm" style="background:var(--primary-50);color:var(--primary-700)" onclick="openContentEditor('${l.id}')">📝 Content</button>
            <button class="btn-sm btn-edit" onclick="editLesson('${l.id}')">Edit</button>
            <button class="btn-sm btn-danger" onclick="deleteLesson('${l.id}')">Delete</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }
  panel.innerHTML = html;
}

let draggedItem = null;

function handleDragStart(e) {
  draggedItem = e.currentTarget;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', draggedItem.innerHTML);
  draggedItem.classList.add('dragging');
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop.
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  // e.target is the current hover target.
  const targetItem = e.target.closest('.lesson-item');
  if (targetItem && targetItem !== draggedItem) {
    targetItem.classList.add('over');
  }
}

function handleDragLeave(e) {
  const targetItem = e.target.closest('.lesson-item');
  if (targetItem && targetItem !== draggedItem) {
    targetItem.classList.remove('over');
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }

  const targetItem = e.target.closest('.lesson-item');

  if (draggedItem && targetItem && draggedItem !== targetItem) {
    const list = document.getElementById('lessonList');
    const items = [...list.querySelectorAll('.lesson-item')];
    const draggedIndex = items.indexOf(draggedItem);
    const targetIndex = items.indexOf(targetItem);

    if (draggedIndex < targetIndex) {
      targetItem.after(draggedItem);
    } else {
      targetItem.before(draggedItem);
    }

    // Update visual order numbers
    updateVisualOrder();

    // Save new order
    saveLessonOrder();
  }

  draggedItem.classList.remove('dragging');

  // Cleanup 'over' class from all items
  document.querySelectorAll('.lesson-item').forEach(item => item.classList.remove('over'));

  return false;
}

function updateVisualOrder() {
  const items = document.querySelectorAll('.lesson-item');
  items.forEach((item, index) => {
    const orderSpan = item.querySelector('.lesson-order');
    if (orderSpan) orderSpan.textContent = index + 1;
  });
}

async function saveLessonOrder() {
  const list = document.getElementById('lessonList');
  if (!list) return;

  const items = [...list.querySelectorAll('.lesson-item')];
  const updates = items.map((item, index) => ({
    id: item.dataset.id,
    sort_order: index,
    updated_at: new Date().toISOString()
  }));

  // Optimistic update locally? 
  // We can just send the updates.

  try {
    const { error } = await sb().from('lessons').upsert(updates);
    if (error) throw error;
    showToast('Order saved');

    // Update cache to reflect new order without reloading from DB optionally
    // But reloading ensures consistency.
    // Let's update cache manually to avoid flicker
    // We need to re-sort lessonsCache. 
    // Actually simplicity: just reload lessons in background or do nothing if successful.
    // The problem is if we don't update cache, next renderLessons call (e.g. after edit) will revert order.

    // Update cache
    updates.forEach(u => {
      const lesson = lessonsCache.find(l => l.id === u.id);
      if (lesson) lesson.sort_order = u.sort_order;
    });
    lessonsCache.sort((a, b) => a.sort_order - b.sort_order);

  } catch (err) {
    console.error('Failed to save order:', err);
    showToast('Failed to save order', 'error');
  }
}

function openLessonModal(lesson = null) {
  const isEdit = !!lesson;
  openModal(
    isEdit ? 'Edit Lesson' : 'Add Lesson',
    `
      <div class="form-group">
        <label>Title</label>
        <input id="mLessonTitle" value="${esc(lesson?.title || '')}" placeholder="e.g. Introduction to AI Art" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="mLessonDesc">${esc(lesson?.description || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Video URL</label>
          <input id="mLessonVideo" value="${esc(lesson?.video_url || '')}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label>Duration (min)</label>
          <input type="number" id="mLessonDuration" value="${lesson?.duration_min || ''}" placeholder="30" />
        </div>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:.6rem">
        <input type="checkbox" id="mLessonFree" ${lesson?.is_free ? 'checked' : ''} style="width:auto" />
        <label for="mLessonFree" style="margin:0;font-weight:500">Free preview lesson</label>
      </div>
    `,
    async () => {
      const payload = {
        title: document.getElementById('mLessonTitle').value.trim(),
        description: document.getElementById('mLessonDesc').value.trim(),
        video_url: document.getElementById('mLessonVideo').value.trim() || null,
        duration_min: parseInt(document.getElementById('mLessonDuration').value) || 0,
        is_free: document.getElementById('mLessonFree').checked,
        course_id: selectedCourseId,
      };
      if (!payload.title) throw new Error('Title is required');

      if (isEdit) {
        const { error } = await sb().from('lessons').update(payload).eq('id', lesson.id);
        if (error) throw error;
      } else {
        payload.sort_order = lessonsCache.length;
        payload.content = { html: '' };
        const { error } = await sb().from('lessons').insert(payload);
        if (error) throw error;
      }
      await loadLessons(selectedCourseId);
    }
  );
}

function editLesson(id) {
  const l = lessonsCache.find(x => x.id === id);
  if (l) openLessonModal(l);
}

async function deleteLesson(id) {
  const ok = await confirmDialog('Delete this lesson?');
  if (!ok) return;
  const { error } = await sb().from('lessons').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Lesson deleted');
  await loadLessons(selectedCourseId);
}

/* ——— Lesson Content Editor ——— */
function openContentEditor(lessonId) {
  const lesson = lessonsCache.find(l => l.id === lessonId);
  if (!lesson) return;

  const existingHtml = lesson.content?.html || '';

  // Use wider modal
  const modalEl = document.querySelector('.modal');
  modalEl.classList.add('modal-wide');

  openModal(
    `Edit Content: ${lesson.title}`,
    `
      <div class="rte-toolbar" id="rteToolbar">
        <button type="button" onclick="rteExec('bold')" title="Bold"><b>B</b></button>
        <button type="button" onclick="rteExec('italic')" title="Italic"><i>I</i></button>
        <button type="button" onclick="rteExec('underline')" title="Underline"><u>U</u></button>
        <button type="button" onclick="rteExec('strikeThrough')" title="Strikethrough"><s>S</s></button>
        <div class="rte-sep"></div>
        <button type="button" onclick="rteExec('formatBlock', 'h1')" title="Heading 1">H1</button>
        <button type="button" onclick="rteExec('formatBlock', 'h2')" title="Heading 2">H2</button>
        <button type="button" onclick="rteExec('formatBlock', 'h3')" title="Heading 3">H3</button>
        <button type="button" onclick="rteExec('formatBlock', 'p')" title="Paragraph">¶</button>
        <div class="rte-sep"></div>
        <button type="button" onclick="rteExec('insertUnorderedList')" title="Bullet List">•</button>
        <button type="button" onclick="rteExec('insertOrderedList')" title="Numbered List">1.</button>
        <button type="button" onclick="rteExec('formatBlock', 'blockquote')" title="Quote">“</button>
        <div class="rte-sep"></div>
        <button type="button" onclick="rteInsertCode()" title="Code Block">&lt;/&gt;</button>
        <button type="button" onclick="rteInsertLink()" title="Link">🔗</button>
        <button type="button" onclick="rteExec('insertHorizontalRule')" title="Divider">—</button>
        <div class="rte-sep"></div>
        <button type="button" onclick="rteExec('removeFormat')" title="Clear Formatting">🚫</button>
        <button type="button" onclick="rteExec('undo')" title="Undo">↩</button>
        <button type="button" onclick="rteExec('redo')" title="Redo">↪</button>
      </div>
      <div class="rte-editor" contenteditable="true" id="rteEditorArea">${existingHtml}</div>
    `,
    async () => {
      const html = document.getElementById('rteEditorArea').innerHTML;
      const { error } = await sb()
        .from('lessons')
        .update({ content: { html } })
        .eq('id', lessonId);
      if (error) throw error;

      // Update local cache
      const idx = lessonsCache.findIndex(l => l.id === lessonId);
      if (idx !== -1) lessonsCache[idx].content = { html };

      modalEl.classList.remove('modal-wide');
      showToast('Content saved');
      renderLessons();
    }
  );

  // Remove wide class when modal is closed by cancel / X
  const overlay = document.getElementById('modalOverlay');
  const observer = new MutationObserver(() => {
    if (!overlay.classList.contains('open')) {
      modalEl.classList.remove('modal-wide');
      observer.disconnect();
    }
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
}

function rteExec(command, value = null) {
  document.getElementById('rteEditorArea').focus();
  if (command === 'formatBlock' && value) {
    document.execCommand('formatBlock', false, `<${value}>`);
  } else {
    document.execCommand(command, false, value);
  }
}

function rteInsertLink() {
  const url = prompt('Enter URL:');
  if (url) {
    document.getElementById('rteEditorArea').focus();
    document.execCommand('createLink', false, url);
  }
}

function rteInsertCode() {
  const editor = document.getElementById('rteEditorArea');
  editor.focus();
  const code = document.getSelection().toString();
  if (code) {
    // Wrap selection in <pre><code>...</code></pre>
    document.execCommand('insertHTML', false, `<pre><code>${esc(code)}</code></pre>`);
  } else {
    document.execCommand('insertHTML', false, '<pre><code>// your code here</code></pre><p><br></p>');
  }
}

/* ----------------------------------------------------------
   ASSIGNMENTS
   ---------------------------------------------------------- */
let assignmentsCache = [];

async function loadAssignments() {
  const { data, error } = await sb()
    .from('assignments')
    .select('*, lessons(title, course_id, courses(title))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  assignmentsCache = data || [];

  if (!window.paginators['assignmentsPagination']) {
    window.paginators['assignmentsPagination'] = new Paginator('assignmentsPagination', renderAssignments, 10);
    window.paginators['assignmentsPagination'].attachSorting();
  }
  window.paginators['assignmentsPagination'].init(assignmentsCache);
}

function renderAssignments(assignments) {
  const tbody = document.getElementById('assignmentsTableBody');
  if (!assignments.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><p>No assignments yet. Create one!</p></td></tr>`;
    return;
  }
  tbody.innerHTML = assignments.map(a => `
    <tr>
      <td><strong style="color:var(--gray-900)">${esc(a.title)}</strong></td>
      <td>
        <div style="font-size:.9rem">${esc(a.lessons?.title || 'Unknown Lesson')}</div>
        <div style="font-size:.75rem;color:var(--gray-400)">${esc(a.lessons?.courses?.title || '')}</div>
      </td>
      <td>${a.due_offset_days} days</td>
      <td>${a.max_points} pts</td>
      <td class="actions-cell">
        <button class="btn-sm" style="background:var(--primary-100);color:var(--primary-700)" onclick="viewAssignmentSubmissions('${a.id}')">Submissions</button>
        <button class="btn-sm btn-edit" onclick="editAssignment('${a.id}')">Edit</button>
        <button class="btn-sm btn-danger" onclick="deleteAssignment('${a.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function viewAssignmentSubmissions(assignmentId) {
  const assignment = assignmentsCache.find(a => a.id === assignmentId);
  if (!assignment) return;

  const { data: submissions, error } = await sb()
    .from('submissions')
    .select('*, profiles!submissions_student_id_fkey(full_name)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  if (error) { showToast('Failed to load submissions', 'error'); return; }

  const panel = document.getElementById('detailPanel');
  const body = document.getElementById('detailPanelBody');

  document.getElementById('detailPanelTitle').textContent = `Submissions: ${assignment.title}`;

  if (!submissions.length) {
    body.innerHTML = `<div class="empty-state"><p>No submissions for this assignment yet.</p></div>`;
  } else {
    body.innerHTML = submissions.map(s => {
      const fileSection = s.file_url
        ? `<div style="display:flex;align-items:center;gap:.5rem;margin-top:.5rem">
             <span style="font-size:1.2rem">📎</span>
             <span style="font-size:.85rem;color:var(--gray-600)">${esc(s.file_url.split('/').pop())}</span>
             <button class="btn-sm btn-edit" onclick="downloadSubmissionFile('${esc(s.file_url)}')">Download</button>
             <button class="btn-sm btn-danger" style="font-size:.75rem" onclick="removeSubmissionFile('${s.id}', '${esc(s.file_url)}', '${assignmentId}')">✕</button>
           </div>`
        : `<div style="margin-top:.5rem">
             <label class="btn-sm btn-edit" style="cursor:pointer;display:inline-flex;align-items:center;gap:.3rem">
               📤 Attach File
               <input type="file" style="display:none" onchange="handleAdminFileUpload(this, '${s.id}', '${s.student_id || ''}', '${assignmentId}')" />
             </label>
           </div>`;

      return `
        <div class="lesson-item" style="flex-direction:column;align-items:flex-start;gap:.5rem">
          <div style="display:flex;justify-content:space-between;width:100%">
            <div class="lesson-info">
              <div class="admin-avatar" style="width:32px;height:32px;font-size:.8rem">${initials(s.profiles?.full_name)}</div>
              <div>
                <div class="lesson-title">${esc(s.profiles?.full_name || 'Unknown')}</div>
                <div class="lesson-meta">${formatDate(s.submitted_at)}</div>
              </div>
            </div>
            <div style="text-align:right">
              ${s.grade ? `<span class="badge badge-active">${s.grade} / ${assignment.max_points}</span>` : '<span class="badge badge-upcoming">Needs Grading</span>'}
            </div>
          </div>
          
          <div style="background:var(--gray-50);padding:.8rem;border-radius:6px;width:100%;font-size:.9rem">
            ${s.content?.text ? `<p>${esc(s.content.text)}</p>` : '<p style="color:var(--gray-400);font-style:italic">No text content</p>'}
            ${fileSection}
          </div>

          <div style="display:flex;gap:.5rem;width:100%;margin-top:.5rem">
             <button class="btn-sm btn-primary" onclick="openGradingModal('${s.id}', '${assignmentId}', ${assignment.max_points}, ${s.grade || 'null'}, '${esc(s.feedback || '')}')">
               ${s.grade ? 'Edit Grade' : 'Grade Submission'}
             </button>
          </div>
        </div>
      `;
    }).join('');
  }

  panel.classList.add('open');
}

/** Download a submission file via signed URL */
async function downloadSubmissionFile(filePath) {
  try {
    const signedUrl = await getSubmissionFileUrl(filePath);
    window.open(signedUrl, '_blank');
  } catch (err) {
    // Fallback: try as a direct URL (for legacy/already-public URLs)
    if (filePath.startsWith('http')) {
      window.open(filePath, '_blank');
    } else {
      showToast('Could not generate download link: ' + err.message, 'error');
    }
  }
}

/** Admin: Upload a file and attach it to an existing submission */
async function handleAdminFileUpload(input, submissionId, studentId, assignmentId) {
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showToast('File too large. Maximum size is 10 MB.', 'error');
    return;
  }

  try {
    showToast('Uploading…');
    const uploaded = await uploadSubmissionFile(file, assignmentId, studentId);

    // Update the submission record with the file path
    const { error } = await sb()
      .from('submissions')
      .update({ file_url: uploaded.path })
      .eq('id', submissionId);

    if (error) throw error;

    showToast('File attached successfully');
    await viewAssignmentSubmissions(assignmentId);
  } catch (err) {
    showToast('Upload failed: ' + err.message, 'error');
  }
}

/** Admin: Remove a file from a submission */
async function removeSubmissionFile(submissionId, filePath, assignmentId) {
  try {
    // Delete from storage
    await deleteSubmissionFile(filePath);
  } catch (e) {
    // File may already be gone from storage, continue to clear the DB reference
  }

  // Clear file_url in the submission record
  const { error } = await sb()
    .from('submissions')
    .update({ file_url: null })
    .eq('id', submissionId);

  if (error) { showToast(error.message, 'error'); return; }

  showToast('File removed');
  await viewAssignmentSubmissions(assignmentId);
}

function openGradingModal(submissionId, assignmentId, maxPoints, currentGrade, currentFeedback) {
  openModal(
    'Grade Submission',
    `
      <div class="form-group">
        <label>Grade (Max ${maxPoints})</label>
        <input type="number" id="mGradePoints" value="${currentGrade !== null ? currentGrade : ''}" max="${maxPoints}" />
      </div>
      <div class="form-group">
        <label>Feedback</label>
        <textarea id="mGradeFeedback" style="height:100px">${currentFeedback || ''}</textarea>
      </div>
    `,
    async () => {
      const grade = parseInt(document.getElementById('mGradePoints').value);
      const feedback = document.getElementById('mGradeFeedback').value.trim();

      if (isNaN(grade)) throw new Error('Grade is required');
      if (grade < 0 || grade > maxPoints) throw new Error(`Grade must be between 0 and ${maxPoints}`);

      const { error } = await sb().from('submissions').update({
        grade,
        feedback,
        graded_at: new Date().toISOString(),
        graded_by: (await sb().auth.getUser()).data.user.id
      }).eq('id', submissionId);

      if (error) throw error;

      showToast('Graded successfully');
      viewAssignmentSubmissions(assignmentId);
    }
  );
}

async function openAssignmentModal(assignment = null) {
  const isEdit = !!assignment;

  // Need to fetch courses & lessons to populate dropdowns if not already cached
  // For simplicity, let's fetch all lessons grouped by course
  const { data: lessons } = await sb()
    .from('lessons')
    .select('id, title, course_id, courses(title)')
    .order('course_id');

  if (!lessons) { showToast('Failed to load lessons', 'error'); return; }

  const lessonOptions = lessons.map(l =>
    `<option value="${l.id}" ${assignment?.lesson_id === l.id ? 'selected' : ''}>
      ${esc(l.courses?.title)}: ${esc(l.title)}
    </option>`
  ).join('');

  openModal(
    isEdit ? 'Edit Assignment' : 'Create Assignment',
    `
      <div class="form-group">
        <label>Title</label>
        <input id="mAssignTitle" value="${esc(assignment?.title || '')}" placeholder="e.g. Build a Portfolio Page" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="mAssignDesc" style="height:100px">${esc(assignment?.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Link to Lesson</label>
        <select id="mAssignLesson">
          <option value="">— Select Lesson —</option>
          ${lessonOptions}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Due Offset (Days from start)</label>
          <input type="number" id="mAssignDue" value="${assignment?.due_offset_days ?? 7}" />
        </div>
        <div class="form-group">
          <label>Max Points</label>
          <input type="number" id="mAssignPoints" value="${assignment?.max_points ?? 100}" />
        </div>
      </div>
    `,
    async () => {
      const payload = {
        title: document.getElementById('mAssignTitle').value.trim(),
        description: document.getElementById('mAssignDesc').value.trim(),
        lesson_id: document.getElementById('mAssignLesson').value,
        due_offset_days: parseInt(document.getElementById('mAssignDue').value) || 7,
        max_points: parseInt(document.getElementById('mAssignPoints').value) || 100,
      };

      if (!payload.title) throw new Error('Title is required');
      if (!payload.lesson_id) throw new Error('Lesson is required');

      if (isEdit) {
        const { error } = await sb().from('assignments').update(payload).eq('id', assignment.id);
        if (error) throw error;
      } else {
        const { error } = await sb().from('assignments').insert(payload);
        if (error) throw error;
      }
      await loadAssignments();
    }
  );
}

function editAssignment(id) {
  const a = assignmentsCache.find(x => x.id === id);
  if (a) openAssignmentModal(a);
}

async function deleteAssignment(id) {
  const ok = await confirmDialog('Delete this assignment? Submissions will also be deleted.');
  if (!ok) return;
  const { error } = await sb().from('assignments').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Assignment deleted');
  await loadAssignments();
}

/* ----------------------------------------------------------
   REGISTRATIONS (LEADS)
   ---------------------------------------------------------- */
let registrationsCache = [];
async function loadRegistrations() {
  const { data, error, count } = await sb()
    .from('course_registrations')
    .select('*, cohorts(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load registrations', 'error');
    console.error(error);
    return;
  }

  registrationsCache = data || [];
  document.getElementById('statTotalRegistrations').textContent = count ?? 0;

  if (!window.paginators['registrationsPagination']) {
    window.paginators['registrationsPagination'] = new Paginator('registrationsPagination', renderRegistrations, 15);
    window.paginators['registrationsPagination'].attachSorting();
  }
  window.paginators['registrationsPagination'].init(registrationsCache);
}

function renderRegistrations(registrations) {
  const tbody = document.getElementById('registrationsTableBody');
  if (!registrations.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><p>No leads yet. Share your website to get some!</p></td></tr>`;
    return;
  }

  tbody.innerHTML = registrations.map(r => {
    // Generate Status Badge
    let statusBadge = '';
    const s = r.status || 'new';
    if (s === 'new') statusBadge = `<span class="status-badge" style="background:#fefce8;color:#a16207;border:1px solid #fef08a">New</span>`;
    else if (s === 'contacted') statusBadge = `<span class="status-badge" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe">Contacted</span>`;
    else if (s === 'enrolled') statusBadge = `<span class="status-badge" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0">Enrolled</span>`;
    else if (s === 'lost') statusBadge = `<span class="status-badge" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca">Lost</span>`;

    // Notes Indicator
    const hasNotes = (r.notes && r.notes.trim() !== '') ? '<span title="Has Notes" style="cursor:help;margin-left:5px">📝</span>' : '';

    return `
      <tr>
        <td class="primary-col">${esc(r.email)}</td>
        <td><span class="status-badge" style="background:var(--blue-50);color:var(--blue-700)">${esc(r.cohorts?.name || 'Any / Unknown')}</span></td>
        <td><div class="date-cell">${formatDate(r.created_at)}</div></td>
        <td>${statusBadge}${hasNotes}</td>
        <td class="actions-cell">
          <button class="btn-sm btn-edit" onclick="navigator.clipboard.writeText('${esc(r.email)}');showToast('Email copied!')">Copy</button>
          <button class="btn-sm btn-edit" onclick="openRegistrationModal('${r.id}')">Edit</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openRegistrationModal(id) {
  const lead = registrationsCache.find(x => x.id === id);
  if (!lead) return;

  openModal(
    'Edit Lead: ' + esc(lead.email),
    `
      <div class="form-group">
        <label>Status</label>
        <select id="mLeadStatus">
          <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
          <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
          <option value="enrolled" ${lead.status === 'enrolled' ? 'selected' : ''}>Enrolled</option>
          <option value="lost" ${lead.status === 'lost' ? 'selected' : ''}>Lost</option>
        </select>
      </div>
      <div class="form-group">
        <label>Internal Notes</label>
        <textarea id="mLeadNotes" placeholder="e.g. Sent introductory email on Tuesday, waiting for reply...">${esc(lead.notes || '')}</textarea>
      </div>
    `,
    async () => {
      const payload = {
        status: document.getElementById('mLeadStatus').value,
        notes: document.getElementById('mLeadNotes').value.trim()
      };

      const { error } = await sb().from('course_registrations').update(payload).eq('id', id);
      if (error) throw error;

      showToast('Lead updated');
      await loadRegistrations();
      await loadRegistrationsBadge(); // Update the notification badge
    }
  );
}

function filterRegistrations(query) {
  query = query.toLowerCase();
  const filtered = registrationsCache.filter(r => r.email.toLowerCase().includes(query));
  window.paginators['registrationsPagination'].init(filtered);
}

/* ----------------------------------------------------------
   STUDENTS
   ---------------------------------------------------------- */
let studentsCache = [];

async function loadStudents() {
  const { data, error } = await sb()
    .from('profiles')
    .select('*, enrollments(id, status, enrolled_at, cohort_id, cohorts(name))')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  if (error) throw error;
  studentsCache = data || [];

  if (!window.paginators['studentsPagination']) {
    window.paginators['studentsPagination'] = new Paginator('studentsPagination', renderStudents, 10);
    window.paginators['studentsPagination'].attachSorting();
  }
  window.paginators['studentsPagination'].init(studentsCache);
}

function renderStudents(students) {
  const tbody = document.getElementById('studentsTableBody');
  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><p>No students registered yet.</p></td></tr>`;
    return;
  }
  tbody.innerHTML = students.map(s => {
    const enrollments = s.enrollments || [];
    const enrollBadges = enrollments.length
      ? enrollments.map(e => `<span class="badge badge-${e.status}">${esc(e.cohorts?.name || 'Course')}</span>`).join(' ')
      : '<span style="color:var(--gray-400)">None</span>';
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.7rem">
            <div class="admin-avatar">${initials(s.full_name)}</div>
            <div>
              <div style="font-weight:600;color:var(--gray-900)">${esc(s.full_name || 'Unnamed')}</div>
              <div style="font-size:.78rem;color:var(--gray-400)">${s.id.slice(0, 8)}…</div>
            </div>
          </div>
        </td>
        <td>${formatDate(s.created_at)}</td>
        <td>${enrollBadges}</td>
        <td>${s.locale === 'lt' ? '🇱🇹 LT' : '🇺🇸 EN'}</td>
        <td class="actions-cell">
          <button class="btn-sm btn-edit" onclick="enrollStudent('${s.id}')">Enroll</button>
          <button class="btn-sm btn-success" onclick="viewStudentDetail('${s.id}')">View</button>
          <button class="btn-sm btn-edit" onclick="editStudent('${s.id}')">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteStudent('${s.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

let studentLangFilter = 'all';
let studentSearchQuery = '';

function applyStudentFilters() {
  let filtered = studentsCache;
  if (studentLangFilter !== 'all') {
    filtered = filtered.filter(s => (s.locale || 'en') === studentLangFilter);
  }
  if (studentSearchQuery) {
    const q = studentSearchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      (s.full_name || '').toLowerCase().includes(q) || s.id.includes(q)
    );
  }
  if (window.paginators['studentsPagination']) {
    window.paginators['studentsPagination'].setFilteredItems(filtered);
  } else {
    renderStudents(filtered);
  }
}

function filterStudents(query) {
  studentSearchQuery = query;
  applyStudentFilters();
}

function filterStudentsByLang(lang) {
  studentLangFilter = lang;
  document.querySelectorAll('#studentLangFilter .lang-tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`#studentLangFilter .lang-tab[onclick="filterStudentsByLang('${lang}')"]`).classList.add('active');
  applyStudentFilters();
}

async function enrollStudent(studentId) {
  const { data: cohorts } = await sb().from('cohorts').select('*').order('starts_at', { ascending: false });
  if (!cohorts?.length) { showToast('No cohorts available. Create one first.', 'error'); return; }

  openModal(
    'Enroll Student',
    `
      <div class="form-group">
        <label>Select Cohort</label>
        <select id="mEnrollCohort">
          ${cohorts.map(c => `<option value="${c.id}">${esc(c.name)} (${c.status})</option>`).join('')}
        </select>
      </div>
    `,
    async () => {
      const cohortId = document.getElementById('mEnrollCohort').value;
      const { error } = await sb().from('enrollments').insert({
        student_id: studentId,
        cohort_id: cohortId,
        status: 'active',
      });
      if (error) throw error;
      await loadStudents();
    }
  );
}

async function viewStudentDetail(studentId) {
  const student = studentsCache.find(s => s.id === studentId);
  if (!student) return;

  // Fetch lesson progress for this student
  const { data: progress } = await sb()
    .from('lesson_progress')
    .select('*, lessons(title, course_id, courses(title))')
    .eq('student_id', studentId)
    .order('last_watched_at', { ascending: false });

  const panel = document.getElementById('detailPanel');
  const body = document.getElementById('detailPanelBody');

  // Enrollments block
  let enrollmentsHTML = '<p style="color:var(--gray-400)">No enrollments</p>';
  if (student.enrollments?.length) {
    enrollmentsHTML = student.enrollments.map(e => {
      // Build status action buttons based on current status
      let statusActions = '';
      if (e.status === 'active') {
        statusActions = `
          <button class="btn-sm" style="background:var(--primary-100);color:var(--primary-700);font-size:.75rem" onclick="changeEnrollmentStatus('${e.id}', 'completed', '${studentId}')">✓ Complete</button>
          <button class="btn-sm" style="background:#fef3c7;color:#92400e;font-size:.75rem" onclick="changeEnrollmentStatus('${e.id}', 'cancelled', '${studentId}')">Cancel</button>
        `;
      } else if (e.status === 'completed') {
        statusActions = `
          <button class="btn-sm" style="background:var(--primary-100);color:var(--primary-700);font-size:.75rem" onclick="changeEnrollmentStatus('${e.id}', 'active', '${studentId}')">↩ Reactivate</button>
        `;
      } else if (e.status === 'cancelled') {
        statusActions = `
          <button class="btn-sm" style="background:var(--primary-100);color:var(--primary-700);font-size:.75rem" onclick="changeEnrollmentStatus('${e.id}', 'active', '${studentId}')">↩ Reactivate</button>
        `;
      }

      return `
        <div class="lesson-item" style="margin-bottom:var(--space-md);flex-wrap:wrap;gap:.5rem">
          <div class="lesson-info" style="flex:1;min-width:0">
            <span class="badge badge-${e.status}">${e.status}</span>
            <span class="lesson-title">${esc(e.cohorts?.name || 'Unknown')}</span>
          </div>
          <div style="display:flex;align-items:center;gap:.4rem;flex-shrink:0">
            <span class="lesson-meta" style="white-space:nowrap">${formatDate(e.enrolled_at)}</span>
            ${statusActions}
            <button class="btn-sm btn-danger" style="font-size:.75rem" onclick="unenrollStudent('${e.id}', '${studentId}')">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Progress block
  let progressHTML = '<p style="color:var(--gray-400)">No progress tracked yet</p>';
  if (progress?.length) {
    progressHTML = progress.map(p => `
      <div class="lesson-item" style="margin-bottom:var(--space-sm)">
        <div class="lesson-info">
          <span class="lesson-order" style="font-size:.65rem">${p.completed ? '✓' : `${p.progress_pct}%`}</span>
          <div>
            <div class="lesson-title">${esc(p.lessons?.title || 'Lesson')}</div>
            <div class="lesson-meta">${esc(p.lessons?.courses?.title || '')} · ${formatDate(p.last_watched_at)}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-lg);margin-bottom:var(--space-2xl)">
      <div class="admin-avatar" style="width:56px;height:56px;font-size:1.1rem">${initials(student.full_name)}</div>
      <div>
        <h3 style="font-family:var(--font-heading);font-weight:700;color:var(--gray-900)">${esc(student.full_name || 'Unnamed')}</h3>
        <p style="font-size:.85rem;color:var(--gray-400)">Joined ${formatDate(student.created_at)} · ${student.locale === 'lt' ? '🇱🇹 Lithuania' : '🇺🇸 USA'}</p>
      </div>
    </div>

    <h4 style="font-family:var(--font-heading);font-weight:700;margin-bottom:var(--space-md)">Enrollments</h4>
    ${enrollmentsHTML}
    <div style="margin-top:var(--space-md)">
      <button class="btn-sm btn-edit" onclick="enrollStudent('${studentId}')">+ Add Enrollment</button>
    </div>

    <h4 style="font-family:var(--font-heading);font-weight:700;margin:var(--space-xl) 0 var(--space-md)">Lesson Progress</h4>
    ${progressHTML}
  `;

  document.getElementById('detailPanelTitle').textContent = 'Student Details';
  panel.classList.add('open');
}

/** Change an enrollment's status (active, completed, cancelled) */
async function changeEnrollmentStatus(enrollmentId, newStatus, studentId) {
  try {
    const { error } = await sb()
      .from('enrollments')
      .update({ status: newStatus })
      .eq('id', enrollmentId);
    if (error) throw error;

    showToast(`Enrollment ${newStatus}`);
    // Refresh both the student list (badge changes) and the detail panel
    await loadStudents();
    await viewStudentDetail(studentId);
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
}

/** Remove an enrollment entirely */
async function unenrollStudent(enrollmentId, studentId) {
  const ok = await confirmDialog('Remove this enrollment? This cannot be undone.');
  if (!ok) return;

  try {
    const { error } = await sb()
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);
    if (error) throw error;

    showToast('Student unenrolled');
    await loadStudents();
    await viewStudentDetail(studentId);
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
}

function closeDetailPanel() {
  document.getElementById('detailPanel').classList.remove('open');
}

/** Open modal to add or edit a student */
async function openStudentModal(student = null) {
  const isEdit = !!student;

  openModal(
    isEdit ? 'Edit Student' : 'Add New Student',
    `
      <div class="form-group">
        <label>Full Name</label>
        <input id="mStudentName" value="${esc(student?.full_name || '')}" placeholder="e.g. Jonas Jonaitis" />
      </div>
      ${!isEdit ? `
        <div class="form-group">
          <label>Email</label>
          <input id="mStudentEmail" type="email" placeholder="student@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input id="mStudentPassword" type="password" placeholder="Minimum 6 characters" />
        </div>
      ` : ''}
      <div class="form-group">
        <label>Language</label>
        <select id="mStudentLocale">
          <option value="en" ${(!student || student?.locale === 'en') ? 'selected' : ''}>🇺🇸 English</option>
          <option value="lt" ${student?.locale === 'lt' ? 'selected' : ''}>🇱🇹 Lietuvių</option>
        </select>
      </div>
    `,
    async () => {
      const fullName = document.getElementById('mStudentName').value.trim();
      const locale = document.getElementById('mStudentLocale').value;

      if (!fullName) throw new Error('Full name is required');

      if (isEdit) {
        // Update existing student
        await adminUpdateProfile(student.id, { full_name: fullName, locale });
        showToast('Student updated');
      } else {
        // Create new student
        const email = document.getElementById('mStudentEmail').value.trim();
        const password = document.getElementById('mStudentPassword').value;

        if (!email) throw new Error('Email is required');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

        await adminCreateUser(email, password, {
          full_name: fullName,
          role: 'student',
          locale,
        });
        showToast('Student created successfully');
      }
      await loadStudents();
    }
  );
}

function editStudent(id) {
  const s = studentsCache.find(x => x.id === id);
  if (s) openStudentModal(s);
}

async function deleteStudent(id) {
  const student = studentsCache.find(s => s.id === id);
  const name = student?.full_name || 'this student';
  const ok = await confirmDialog(`Delete ${name}? This will remove all their enrollments, submissions, and progress. This cannot be undone.`);
  if (!ok) return;

  try {
    await adminDeleteProfile(id);
    showToast('Student deleted');
    closeDetailPanel();
    await loadStudents();
  } catch (err) {
    showToast('Failed to delete: ' + err.message, 'error');
  }
}

/* ----------------------------------------------------------
   PARENTS
   ---------------------------------------------------------- */
let parentsCache = [];

async function loadParents() {
  // Step 1: fetch parent profiles
  const { data: parents, error } = await sb()
    .from('profiles')
    .select('*')
    .eq('role', 'parent')
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Step 2: fetch all parent-student links with student names
  const parentIds = (parents || []).map(p => p.id);
  let linksMap = {};
  if (parentIds.length) {
    const { data: links } = await sb()
      .from('parent_student')
      .select('parent_id, student_id, profiles!parent_student_student_id_fkey(full_name)')
      .in('parent_id', parentIds);
    (links || []).forEach(link => {
      if (!linksMap[link.parent_id]) linksMap[link.parent_id] = [];
      linksMap[link.parent_id].push(link.profiles?.full_name || 'Unknown');
    });
  }

  // Merge
  parentsCache = (parents || []).map(p => ({
    ...p,
    _children: linksMap[p.id] || [],
  }));

  if (!window.paginators['parentsPagination']) {
    window.paginators['parentsPagination'] = new Paginator('parentsPagination', renderParents, 10);
    window.paginators['parentsPagination'].attachSorting();
  }
  window.paginators['parentsPagination'].init(parentsCache);
}

function renderParents(parents) {
  const tbody = document.getElementById('parentsTableBody');
  if (!parents.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><p>No parents registered yet.</p></td></tr>`;
    return;
  }
  tbody.innerHTML = parents.map(p => {
    const children = p._children.map(n => esc(n)).join(', ');
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.7rem">
            <div class="admin-avatar">${initials(p.full_name)}</div>
            <strong style="color:var(--gray-900)">${esc(p.full_name || 'Unnamed')}</strong>
          </div>
        </td>
        <td>${formatDate(p.created_at)}</td>
        <td>${children || '<span style="color:var(--gray-400)">None linked</span>'}</td>
        <td class="actions-cell">
          <button class="btn-sm btn-edit" onclick="linkParentToStudent('${p.id}')">Link</button>
          <button class="btn-sm btn-edit" onclick="editParent('${p.id}')">Edit</button>
          <button class="btn-sm btn-danger" onclick="unlinkParentStudents('${p.id}')">Unlink All</button>
          <button class="btn-sm btn-danger" onclick="deleteParent('${p.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterParents(query) {
  const q = query.toLowerCase();
  const filtered = parentsCache.filter(p => (p.full_name || '').toLowerCase().includes(q));

  if (window.paginators['parentsPagination']) {
    window.paginators['parentsPagination'].setFilteredItems(filtered);
  } else {
    renderParents(filtered);
  }
}

async function linkParentToStudent(parentId) {
  const { data: students } = await sb().from('profiles').select('id, full_name').eq('role', 'student').order('full_name');
  if (!students?.length) { showToast('No students available', 'error'); return; }

  openModal(
    'Link Student to Parent',
    `
      <div class="form-group">
        <label>Select Student</label>
        <select id="mLinkStudent">
          ${students.map(s => `<option value="${s.id}">${esc(s.full_name || s.id.slice(0, 8))}</option>`).join('')}
        </select>
      </div>
    `,
    async () => {
      const studentId = document.getElementById('mLinkStudent').value;
      const { error } = await sb().from('parent_student').insert({
        parent_id: parentId,
        student_id: studentId,
      });
      if (error) {
        if (error.code === '23505') throw new Error('This student is already linked to this parent');
        throw error;
      }
      await loadParents();
    }
  );
}

async function unlinkParentStudents(parentId) {
  const ok = await confirmDialog('Remove all student links for this parent?');
  if (!ok) return;
  const { error } = await sb().from('parent_student').delete().eq('parent_id', parentId);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Links removed');
  await loadParents();
}

/** Open modal to add or edit a parent */
async function openParentModal(parent = null) {
  const isEdit = !!parent;

  openModal(
    isEdit ? 'Edit Parent' : 'Add New Parent',
    `
      <div class="form-group">
        <label>Full Name</label>
        <input id="mParentName" value="${esc(parent?.full_name || '')}" placeholder="e.g. Petras Petraitis" />
      </div>
      ${!isEdit ? `
        <div class="form-group">
          <label>Email</label>
          <input id="mParentEmail" type="email" placeholder="parent@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input id="mParentPassword" type="password" placeholder="Minimum 6 characters" />
        </div>
      ` : ''}
      <div class="form-group">
        <label>Language</label>
        <select id="mParentLocale">
          <option value="en" ${(!parent || parent?.locale === 'en') ? 'selected' : ''}>🇺🇸 English</option>
          <option value="lt" ${parent?.locale === 'lt' ? 'selected' : ''}>🇱🇹 Lietuvių</option>
        </select>
      </div>
    `,
    async () => {
      const fullName = document.getElementById('mParentName').value.trim();
      const locale = document.getElementById('mParentLocale').value;

      if (!fullName) throw new Error('Full name is required');

      if (isEdit) {
        await adminUpdateProfile(parent.id, { full_name: fullName, locale });
        showToast('Parent updated');
      } else {
        const email = document.getElementById('mParentEmail').value.trim();
        const password = document.getElementById('mParentPassword').value;

        if (!email) throw new Error('Email is required');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');

        await adminCreateUser(email, password, {
          full_name: fullName,
          role: 'parent',
          locale,
        });
        showToast('Parent created successfully');
      }
      await loadParents();
    }
  );
}

function editParent(id) {
  const p = parentsCache.find(x => x.id === id);
  if (p) openParentModal(p);
}

async function deleteParent(id) {
  const parent = parentsCache.find(p => p.id === id);
  const name = parent?.full_name || 'this parent';
  const ok = await confirmDialog(`Delete ${name}? This will remove their account and all linked student associations. This cannot be undone.`);
  if (!ok) return;

  try {
    await adminDeleteProfile(id);
    showToast('Parent deleted');
    await loadParents();
  } catch (err) {
    showToast('Failed to delete: ' + err.message, 'error');
  }
}

/* ----------------------------------------------------------
   DIPLOMAS / CERTIFICATES
   ---------------------------------------------------------- */
let diplomasCache = [];

async function loadDiplomas() {
  const { data, error } = await sb()
    .from('diplomas')
    .select('*, profiles!diplomas_student_id_fkey(full_name), cohorts(name)')
    .order('issued_at', { ascending: false });
  if (error) throw error;
  diplomasCache = data || [];

  if (!window.paginators['diplomasPagination']) {
    window.paginators['diplomasPagination'] = new Paginator('diplomasPagination', renderDiplomas, 10);
    window.paginators['diplomasPagination'].attachSorting();
  }
  window.paginators['diplomasPagination'].init(diplomasCache);

  updateDiplomaStats(diplomasCache);
}

function updateDiplomaStats(diplomas) {
  document.getElementById('statDiplomas').textContent = diplomas.length;

  const graded = diplomas.filter(d => d.final_grade != null);
  const avg = graded.length
    ? (graded.reduce((sum, d) => sum + parseFloat(d.final_grade), 0) / graded.length).toFixed(1)
    : '—';
  document.getElementById('statAvgGrade').textContent = avg;

  const now = new Date();
  const thisMonth = diplomas.filter(d => {
    const dt = new Date(d.issued_at);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  }).length;
  document.getElementById('statRecentDiplomas').textContent = thisMonth;
}

function renderDiplomas(diplomas) {
  const tbody = document.getElementById('diplomasTableBody');
  if (!diplomas.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="empty-icon">🏆</div><p>No diplomas issued yet. Issue the first one!</p></td></tr>`;
    return;
  }
  tbody.innerHTML = diplomas.map(d => {
    const studentName = d.profiles?.full_name || 'Unknown';
    const cohortName = d.cohorts?.name || '—';
    const gradeDisplay = d.final_grade != null
      ? `<span class="badge badge-active">${parseFloat(d.final_grade).toFixed(1)}%</span>`
      : '<span style="color:var(--gray-400)">—</span>';
    const certLink = d.certificate_url
      ? `<a href="${esc(d.certificate_url)}" target="_blank" class="btn-sm btn-edit">View 📄</a>`
      : '<span style="color:var(--gray-400)">None</span>';
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.7rem">
            <div class="admin-avatar">${initials(studentName)}</div>
            <strong style="color:var(--gray-900)">${esc(studentName)}</strong>
          </div>
        </td>
        <td>${esc(cohortName)}</td>
        <td>${formatDate(d.issued_at)}</td>
        <td>${gradeDisplay}</td>
        <td>${certLink}</td>
        <td class="actions-cell">
          <button class="btn-sm btn-edit" onclick="editDiploma('${d.id}')">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteDiploma('${d.id}')">Revoke</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function openDiplomaModal(diploma = null) {
  const isEdit = !!diploma;

  // Fetch students and cohorts for dropdowns
  const [studentsRes, cohortsRes] = await Promise.all([
    sb().from('profiles').select('id, full_name').eq('role', 'student').order('full_name'),
    sb().from('cohorts').select('id, name').order('starts_at', { ascending: false }),
  ]);

  const students = studentsRes.data || [];
  const cohorts = cohortsRes.data || [];

  if (!students.length) { showToast('No students available', 'error'); return; }
  if (!cohorts.length) { showToast('No cohorts available. Create one first.', 'error'); return; }

  const studentOptions = students.map(s =>
    `<option value="${s.id}" ${diploma?.student_id === s.id ? 'selected' : ''}>${esc(s.full_name || s.id.slice(0, 8))}</option>`
  ).join('');

  const cohortOptions = cohorts.map(c =>
    `<option value="${c.id}" ${diploma?.cohort_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`
  ).join('');

  const issuedDate = diploma?.issued_at
    ? new Date(diploma.issued_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  openModal(
    isEdit ? 'Edit Diploma' : 'Issue Diploma',
    `
      <div class="form-group">
        <label>Student</label>
        <select id="mDiplomaStudent" ${isEdit ? 'disabled style="opacity:.6"' : ''}>
          ${studentOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Cohort</label>
        <select id="mDiplomaCohort">
          ${cohortOptions}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Issue Date</label>
          <input type="date" id="mDiplomaDate" value="${issuedDate}" />
        </div>
        <div class="form-group">
          <label>Final Grade (%)</label>
          <input type="number" id="mDiplomaGrade" min="0" max="100" step="0.1" value="${diploma?.final_grade ?? ''}" placeholder="e.g. 92.5" />
        </div>
      </div>
      <div class="form-group">
        <label>Certificate URL (optional)</label>
        <input id="mDiplomaCertUrl" value="${esc(diploma?.certificate_url || '')}" placeholder="https://..." />
      </div>
    `,
    async () => {
      const payload = {
        student_id: document.getElementById('mDiplomaStudent').value,
        cohort_id: document.getElementById('mDiplomaCohort').value,
        issued_at: document.getElementById('mDiplomaDate').value || new Date().toISOString(),
        final_grade: parseFloat(document.getElementById('mDiplomaGrade').value) || null,
        certificate_url: document.getElementById('mDiplomaCertUrl').value.trim() || null,
      };

      if (!payload.student_id) throw new Error('Student is required');
      if (!payload.cohort_id) throw new Error('Cohort is required');

      if (isEdit) {
        // Don't update student_id on edit
        delete payload.student_id;
        const { error } = await sb().from('diplomas').update(payload).eq('id', diploma.id);
        if (error) throw error;
      } else {
        const { error } = await sb().from('diplomas').insert(payload);
        if (error) {
          if (error.code === '23505') throw new Error('This student already has a diploma for this cohort');
          throw error;
        }
      }
      await loadDiplomas();
    }
  );
}

function editDiploma(id) {
  const d = diplomasCache.find(x => x.id === id);
  if (d) openDiplomaModal(d);
}

async function deleteDiploma(id) {
  const ok = await confirmDialog('Are you sure you want to revoke this diploma? This action cannot be undone.');
  if (!ok) return;
  const { error } = await sb().from('diplomas').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Diploma revoked');
  await loadDiplomas();
}

/* ----------------------------------------------------------
   PROGRESS OVERVIEW
   ---------------------------------------------------------- */
let progressSelectedCourse = null;

async function loadProgress() {
  const cohortFilter = document.getElementById('progressCohortFilter')?.value || '';

  // Fetch all data in parallel
  const [coursesRes, lessonsRes, progressRes, enrollmentsRes, cohortsRes] = await Promise.all([
    sb().from('courses').select('id, title, cohort_id, sort_order').order('sort_order'),
    sb().from('lessons').select('id, title, course_id, sort_order').order('sort_order'),
    sb().from('lesson_progress').select('id, student_id, lesson_id, progress_pct, completed'),
    sb().from('enrollments').select('id, student_id, cohort_id, status').eq('status', 'active'),
    sb().from('cohorts').select('id, name').order('starts_at', { ascending: false }),
  ]);

  const courses = coursesRes.data || [];
  const lessons = lessonsRes.data || [];
  const allProgress = progressRes.data || [];
  const enrollments = enrollmentsRes.data || [];
  const cohorts = cohortsRes.data || [];

  // Populate cohort filter dropdown (once)
  const filterEl = document.getElementById('progressCohortFilter');
  if (filterEl && filterEl.options.length <= 1) {
    cohorts.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      filterEl.appendChild(opt);
    });
    if (cohortFilter) filterEl.value = cohortFilter;
  }

  // Determine which students are in scope (based on cohort filter)
  let activeStudentIds;
  if (cohortFilter) {
    activeStudentIds = new Set(enrollments.filter(e => e.cohort_id === cohortFilter).map(e => e.student_id));
  } else {
    activeStudentIds = new Set(enrollments.map(e => e.student_id));
  }

  // Filter courses by cohort if selected
  const filteredCourses = cohortFilter
    ? courses.filter(c => c.cohort_id === cohortFilter)
    : courses;

  // Filter progress to only include active students
  const scopedProgress = allProgress.filter(p => activeStudentIds.has(p.student_id));

  // Build lesson map: lessonId -> { title, courseId }
  const lessonMap = new Map();
  lessons.forEach(l => lessonMap.set(l.id, l));

  // Build course aggregates
  const courseAggregates = filteredCourses.map(course => {
    const courseLessons = lessons.filter(l => l.course_id === course.id);
    const lessonIds = new Set(courseLessons.map(l => l.id));

    // Progress entries for this course's lessons, scoped to active students
    const courseProgress = scopedProgress.filter(p => lessonIds.has(p.lesson_id));

    // Total possible = courseLessons × activeStudents in this course's cohort (or all)
    const studentsInCourse = activeStudentIds.size;
    const totalPossible = courseLessons.length * studentsInCourse;
    const completedCount = courseProgress.filter(p => p.completed).length;
    const avgPct = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;

    // Per-lesson breakdown
    const lessonBreakdowns = courseLessons.map(lesson => {
      const lessonProg = courseProgress.filter(p => p.lesson_id === lesson.id);
      const lessonCompleted = lessonProg.filter(p => p.completed).length;
      const lessonPct = studentsInCourse > 0 ? Math.round((lessonCompleted / studentsInCourse) * 100) : 0;
      return {
        id: lesson.id,
        title: lesson.title,
        completed: lessonCompleted,
        total: studentsInCourse,
        pct: lessonPct,
      };
    });

    return {
      id: course.id,
      title: course.title,
      lessonCount: courseLessons.length,
      completedLessons: completedCount,
      avgPct,
      lessons: lessonBreakdowns,
    };
  });

  // Summary stats
  const totalLessonsCompleted = scopedProgress.filter(p => p.completed).length;
  const totalLessonEntries = lessons.length;
  const overallAvg = courseAggregates.length
    ? Math.round(courseAggregates.reduce((sum, c) => sum + c.avgPct, 0) / courseAggregates.length)
    : 0;

  document.getElementById('progStatStudents').textContent = activeStudentIds.size;
  document.getElementById('progStatCompleted').textContent = totalLessonsCompleted;
  document.getElementById('progStatAvg').textContent = overallAvg + '%';
  document.getElementById('progStatLessons').textContent = totalLessonEntries;

  // Render course cards
  renderProgressCourses(courseAggregates);

  // Render lesson breakdown if a course was selected
  if (progressSelectedCourse) {
    const selected = courseAggregates.find(c => c.id === progressSelectedCourse);
    if (selected) renderProgressLessonBreakdown(selected);
    else document.getElementById('progressLessonBreakdown').innerHTML = '';
  }
}

function progressBarClass(pct) {
  if (pct >= 70) return 'high';
  if (pct >= 40) return 'mid';
  return 'low';
}

function renderProgressCourses(courseAggregates) {
  const grid = document.getElementById('progressCoursesGrid');

  if (!courseAggregates.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><p>No courses found. Create courses to track progress.</p></div>`;
    return;
  }

  grid.innerHTML = `<div class="progress-courses-grid">${courseAggregates.map(c => `
    <div class="progress-course-card ${progressSelectedCourse === c.id ? 'active' : ''}" onclick="selectProgressCourse('${c.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-md)">
        <div>
          <h3 style="font-family:var(--font-heading);font-weight:700;font-size:1rem;color:var(--gray-900);margin-bottom:.2rem">${esc(c.title)}</h3>
          <p style="font-size:.8rem;color:var(--gray-400)">${c.lessonCount} lesson${c.lessonCount !== 1 ? 's' : ''}</p>
        </div>
        <span style="font-size:1.5rem;font-weight:800;color:var(--primary-600)">${c.avgPct}%</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill ${progressBarClass(c.avgPct)}" style="width:${c.avgPct}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:var(--space-sm);font-size:.75rem;color:var(--gray-400)">
        <span>${c.completedLessons} completed</span>
        <span>Click for details</span>
      </div>
    </div>
  `).join('')}</div>`;
}

function selectProgressCourse(courseId) {
  progressSelectedCourse = progressSelectedCourse === courseId ? null : courseId;
  // Re-render with selection state
  loadProgress();
}

function renderProgressLessonBreakdown(courseAggregate) {
  const container = document.getElementById('progressLessonBreakdown');

  if (!courseAggregate.lessons.length) {
    container.innerHTML = `<p style="color:var(--gray-400)">No lessons in this course.</p>`;
    return;
  }

  container.innerHTML = `
    <div style="background:white;border:1px solid var(--gray-100);border-radius:var(--radius-md);padding:var(--space-xl)">
      <h3 style="font-family:var(--font-heading);font-weight:700;font-size:1rem;color:var(--gray-900);margin-bottom:var(--space-lg)">
        📖 ${esc(courseAggregate.title)} — Lesson Breakdown
      </h3>
      ${courseAggregate.lessons.map(l => `
        <div class="progress-lesson-row">
          <div class="progress-lesson-name" title="${esc(l.title)}">${esc(l.title)}</div>
          <div class="progress-lesson-bar">
            <div class="progress-bar-track">
              <div class="progress-bar-fill ${progressBarClass(l.pct)}" style="width:${l.pct}%"></div>
            </div>
          </div>
          <div class="progress-lesson-pct">${l.pct}%</div>
          <div style="flex:0 0 80px;font-size:.75rem;color:var(--gray-400);text-align:right">${l.completed}/${l.total}</div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ----------------------------------------------------------
   ANNOUNCEMENTS
   ---------------------------------------------------------- */
let announcementsCache = [];

async function loadAnnouncements() {
  const { data, error } = await sb()
    .from('announcements')
    .select('*, profiles!announcements_created_by_fkey(full_name), cohorts(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  announcementsCache = data || [];

  if (!window.paginators['announcementsPagination']) {
    window.paginators['announcementsPagination'] = new Paginator('announcementsPagination', renderAnnouncements, 10);
    window.paginators['announcementsPagination'].attachSorting();
  }
  window.paginators['announcementsPagination'].init(announcementsCache);

  updateAnnouncementStats(announcementsCache);
}

function updateAnnouncementStats(announcements) {
  const now = new Date();
  const active = announcements.filter(a => {
    const pub = new Date(a.published_at);
    const notExpired = !a.expires_at || new Date(a.expires_at) > now;
    return pub <= now && notExpired;
  });
  const urgent = announcements.filter(a => a.priority === 'urgent');

  document.getElementById('statTotalAnnouncements').textContent = announcements.length;
  document.getElementById('statActiveAnnouncements').textContent = active.length;
  document.getElementById('statUrgentAnnouncements').textContent = urgent.length;
}

function isAnnouncementActive(a) {
  const now = new Date();
  return new Date(a.published_at) <= now && (!a.expires_at || new Date(a.expires_at) > now);
}

function renderAnnouncements(announcements) {
  const tbody = document.getElementById('announcementsTableBody');
  if (!announcements.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><p>No announcements yet. Create your first one!</p></td></tr>`;
    return;
  }

  const priorityBadge = (p) => {
    const map = {
      normal: 'badge-active',
      important: 'badge-upcoming',
      urgent: 'badge-cancelled',
    };
    return `<span class="badge ${map[p] || 'badge-active'}">${p}</span>`;
  };

  const audienceLabel = (a) => {
    if (a.cohort_id && a.cohorts?.name) return `🎯 ${esc(a.cohorts.name)}`;
    const map = { all: '🌐 Everyone', students: '🎓 Students', parents: '👨\u200D👩\u200D👧 Parents' };
    return map[a.audience] || a.audience;
  };

  tbody.innerHTML = announcements.map(a => {
    const active = isAnnouncementActive(a);
    const statusDot = active
      ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;margin-right:.5rem" title="Active"></span>'
      : '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--gray-300);margin-right:.5rem" title="Inactive"></span>';

    return `
      <tr style="${!active ? 'opacity:.55' : ''}">
        <td>
          <div style="display:flex;align-items:center">
            ${statusDot}
            <div>
              <strong style="color:var(--gray-900)">${esc(a.title)}</strong>
              ${a.body ? `<div style="font-size:.78rem;color:var(--gray-400);max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.body)}</div>` : ''}
            </div>
          </div>
        </td>
        <td>${audienceLabel(a)}</td>
        <td>${priorityBadge(a.priority)}</td>
        <td>${formatDate(a.published_at)}</td>
        <td>${a.expires_at ? formatDate(a.expires_at) : '<span style="color:var(--gray-300)">—</span>'}</td>
        <td class="actions-cell">
          <button class="btn-sm btn-edit" onclick="editAnnouncement('${a.id}')">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteAnnouncement('${a.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterAnnouncements() {
  const audience = document.getElementById('announcementAudienceFilter').value;
  const filtered = audience
    ? announcementsCache.filter(a => a.audience === audience)
    : announcementsCache;

  if (window.paginators['announcementsPagination']) {
    window.paginators['announcementsPagination'].setFilteredItems(filtered);
  } else {
    renderAnnouncements(filtered);
  }
}

async function openAnnouncementModal(editId = null) {
  const editing = editId ? announcementsCache.find(a => a.id === editId) : null;

  // Fetch cohorts for optional targeting
  const { data: cohorts } = await sb().from('cohorts').select('id, name').order('starts_at', { ascending: false });

  const today = new Date().toISOString().slice(0, 16);

  openModal(
    editing ? 'Edit Announcement' : 'New Announcement',
    `
      <div class="form-group">
        <label>Title *</label>
        <input type="text" id="mAnnTitle" value="${editing ? esc(editing.title) : ''}" placeholder="Announcement title" />
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea id="mAnnBody" style="height:100px" placeholder="Write your announcement message…">${editing ? esc(editing.body) : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Audience</label>
          <select id="mAnnAudience">
            <option value="all" ${editing?.audience === 'all' ? 'selected' : ''}>🌐 Everyone</option>
            <option value="students" ${editing?.audience === 'students' ? 'selected' : ''}>🎓 Students Only</option>
            <option value="parents" ${editing?.audience === 'parents' ? 'selected' : ''}>👨\u200D👩\u200D👧 Parents Only</option>
          </select>
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select id="mAnnPriority">
            <option value="normal" ${editing?.priority === 'normal' ? 'selected' : ''}>✅ Normal</option>
            <option value="important" ${editing?.priority === 'important' ? 'selected' : ''}>⚠️ Important</option>
            <option value="urgent" ${editing?.priority === 'urgent' ? 'selected' : ''}>🚨 Urgent</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Target Cohort (optional — overrides audience)</label>
        <select id="mAnnCohort">
          <option value="">None — use audience above</option>
          ${(cohorts || []).map(c => `<option value="${c.id}" ${editing?.cohort_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Publish Date/Time</label>
          <input type="datetime-local" id="mAnnPublish" value="${editing ? editing.published_at.slice(0, 16) : today}" />
        </div>
        <div class="form-group">
          <label>Expires (optional)</label>
          <input type="datetime-local" id="mAnnExpires" value="${editing?.expires_at ? editing.expires_at.slice(0, 16) : ''}" />
        </div>
      </div>
    `,
    async () => {
      const title = document.getElementById('mAnnTitle').value.trim();
      if (!title) throw new Error('Title is required');

      const payload = {
        title,
        body: document.getElementById('mAnnBody').value.trim(),
        audience: document.getElementById('mAnnAudience').value,
        priority: document.getElementById('mAnnPriority').value,
        cohort_id: document.getElementById('mAnnCohort').value || null,
        published_at: new Date(document.getElementById('mAnnPublish').value).toISOString(),
        expires_at: document.getElementById('mAnnExpires').value
          ? new Date(document.getElementById('mAnnExpires').value).toISOString()
          : null,
      };

      if (editing) {
        const { error } = await sb().from('announcements').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        payload.created_by = (await sb().auth.getUser()).data.user.id;
        const { error } = await sb().from('announcements').insert(payload);
        if (error) throw error;
      }

      showToast(editing ? 'Announcement updated' : 'Announcement created');
      await loadAnnouncements();
    }
  );
}

function editAnnouncement(id) {
  openAnnouncementModal(id);
}

async function deleteAnnouncement(id) {
  const ok = await confirmDialog('Delete this announcement? This cannot be undone.');
  if (!ok) return;

  const { error } = await sb().from('announcements').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }

  showToast('Announcement deleted');
  await loadAnnouncements();
}

/* ----------------------------------------------------------
   SETTINGS
   ---------------------------------------------------------- */
async function loadSettings() {
  const { data, error } = await sb().from('platform_settings').select('*').single();
  if (error) {
    console.error('Error loading settings:', error);
    // If no row exists or error, inputs stay empty or use placeholders
    return;
  }

  document.getElementById('setSiteName').value = data.site_name || '';
  document.getElementById('setPriceUSD').value = data.price_usd || '';
  document.getElementById('setPriceEUR').value = data.price_eur || '';
  document.getElementById('setContactEmail').value = data.contact_email || '';
}

async function saveSettings() {
  const payload = {
    site_name: document.getElementById('setSiteName').value.trim(),
    price_usd: parseFloat(document.getElementById('setPriceUSD').value) || 0,
    price_eur: parseFloat(document.getElementById('setPriceEUR').value) || 0,
    contact_email: document.getElementById('setContactEmail').value.trim(),
    updated_at: new Date().toISOString()
  };

  // Simple validation
  if (!payload.site_name) return showToast('Site Name is required', 'error');

  // We assume ID=1 is the singleton row
  try {
    // Check if row exists first? 
    // Actually upsert with id=1 is safest
    const { error } = await sb().from('platform_settings').upsert({ id: 1, ...payload });
    if (error) throw error;
    showToast('Settings saved successfully');
  } catch (err) {
    console.error('Failed to save settings:', err);
    showToast('Failed to save settings: ' + err.message, 'error');
  }
}

window.saveSettings = saveSettings;

/* ----------------------------------------------------------
   UTILITIES
   ---------------------------------------------------------- */
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ----------------------------------------------------------
   INITIALIZATION
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  try {
    await ensureSupabase();
    const profile = await getProfile();
    if (!profile || profile.role !== 'admin') {
      window.location.href = 'login.html';
      return;
    }
    // Set admin name in sidebar
    document.getElementById('adminName').textContent = profile.full_name || 'Admin';
    document.getElementById('adminInitials').textContent = initials(profile.full_name);
  } catch (e) {
    window.location.href = 'login.html';
    return;
  }

  // Sidebar navigation
  document.querySelectorAll('.sidebar-nav a[data-section]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.dataset.section);
      // Close mobile sidebar
      document.querySelector('.sidebar').classList.remove('open');
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await ensureSupabase(); await signOut(); } catch (e) { /* ignore */ }
    window.location.href = 'login.html';
  });

  // Modal close events
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);

  // Detail panel close
  document.getElementById('detailPanelClose').addEventListener('click', closeDetailPanel);

  // Mobile sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
  }

  // Pre-load cohorts for the course modal dropdown
  try {
    const { data } = await sb().from('cohorts').select('*').order('starts_at', { ascending: false });
    cohortsCache = data || [];
  } catch (e) { /* noop */ }

  // Load notification badge
  loadRegistrationsBadge();

  // Route
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
});

async function loadRegistrationsBadge() {
  try {
    const { count, error } = await sb()
      .from('course_registrations')
      .select('id', { count: 'exact', head: true })
      .or('status.eq.new,status.is.null');

    const badge = document.getElementById('registrationsBadge');
    if (!badge) return;

    if (!error && count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
      badge.textContent = '0';
    }
  } catch (e) { /* ignore */ }
}

/* ----------------------------------------------------------
   SCHEDULE
   ---------------------------------------------------------- */
let scheduleCache = [];
let scheduleCohortFilter = '';
let calendar = null;
let currentScheduleView = 'list';

function toggleScheduleView(view) {
  currentScheduleView = view;
  document.getElementById('viewListBtn').classList.toggle('active', view === 'list');
  document.getElementById('viewCalendarBtn').classList.toggle('active', view === 'calendar');

  document.getElementById('scheduleListView').style.display = view === 'list' ? 'block' : 'none';
  document.getElementById('scheduleCalendarView').style.display = view === 'calendar' ? 'block' : 'none';

  if (view === 'calendar') {
    if (!calendar) initCalendar();
    else {
      calendar.render();
      calendar.updateSize(); // Fix potential sizing issues
    }
  }
}

function initCalendar() {
  const calendarEl = document.getElementById('fullCalendar');
  if (!calendarEl) return;

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    navLinks: true,
    editable: true, // Allow drag and drop
    dayMaxEvents: true, // Allow "more" link when too many events
    events: translateEvents(scheduleCache),
    eventClick: function (info) {
      editSession(info.event.id);
    },
    dateClick: function (info) {
      // Pre-fill modal with clicked date
      // We need to construct a "fake" session object or just pass dates
      const date = new Date(info.dateStr);
      // Set to 10:00 AM by default if whole day clicked, or use time if provided
      if (info.allDay) date.setHours(10, 0, 0, 0);

      const sessionStub = {
        start_time: date.toISOString(),
        end_time: new Date(date.getTime() + 90 * 60000).toISOString() // +90 mins
      };
      openSessionModal(sessionStub);
    },
    eventDrop: async function (info) {
      // Handle drag and drop reschedule
      const { error } = await sb().from('scheduled_sessions').update({
        start_time: info.event.start.toISOString(),
        end_time: info.event.end ? info.event.end.toISOString() : new Date(info.event.start.getTime() + 90 * 60000).toISOString()
      }).eq('id', info.event.id);

      if (error) {
        showToast('Failed to move event: ' + error.message, 'error');
        info.revert();
      } else {
        showToast('Event rescheduled');
        // Update local cache
        const s = scheduleCache.find(x => x.id === info.event.id);
        if (s) {
          s.start_time = info.event.start.toISOString();
          s.end_time = info.event.end ? info.event.end.toISOString() : new Date(info.event.start.getTime() + 90 * 60000).toISOString();
        }
        // Refresh list view nicely
        filterSchedule();
      }
    }
  });
  calendar.render();
}

function translateEvents(sessions) {
  // Filter if needed
  let items = sessions;
  if (scheduleCohortFilter) {
    items = items.filter(s => s.cohort_id === scheduleCohortFilter);
  }

  return items.map(s => {
    let color = '#3B82F6'; // blue
    if (s.status === 'cancelled') color = '#EF4444'; // red
    if (s.status === 'completed') color = '#10B981'; // green

    return {
      id: s.id,
      title: `${s.title} (${s.cohorts?.name || '?'})`,
      start: s.start_time,
      end: s.end_time,
      backgroundColor: color,
      borderColor: color
    };
  });
}

function updateCalendarEvents() {
  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(translateEvents(scheduleCache));
  }
}

async function loadSchedule() {
  // We need cohort options for the filter too
  if (cohortsCache.length === 0) {
    const { data } = await sb().from('cohorts').select('id, name').order('starts_at', { ascending: false });
    cohortsCache = data || [];
  }

  // Populate filter dropdown if empty
  const filterSelect = document.getElementById('scheduleCohortFilter');
  if (filterSelect && filterSelect.options.length <= 1) {
    filterSelect.innerHTML = '<option value="">All Cohorts</option>' +
      cohortsCache.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  }

  const { data, error } = await sb()
    .from('scheduled_sessions')
    .select('*, cohorts(name), lessons(title)')
    .order('start_time', { ascending: true }); // Show upcoming first usually? Or desc for management. Let's do Asc to see next classes.

  if (error) throw error;
  scheduleCache = data || [];

  if (!window.paginators['schedulePagination']) {
    window.paginators['schedulePagination'] = new Paginator('schedulePagination', renderSchedule, 10);
    window.paginators['schedulePagination'].attachSorting();
  }
  window.paginators['schedulePagination'].init(scheduleCache);

  // Apply existing filter if any
  if (scheduleCohortFilter) {
    document.getElementById('scheduleCohortFilter').value = scheduleCohortFilter;
  }
  filterSchedule();
}

function renderSchedule(items) {
  const tbody = document.getElementById('scheduleTableBody');
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><p>No sessions scheduled.</p></td></tr>`;
    return;
  }

  const now = new Date();

  tbody.innerHTML = items.map(s => {
    const start = new Date(s.start_time);
    const end = new Date(s.end_time);

    // Status color
    let statusClass = 'upcoming';
    if (s.status === 'cancelled') statusClass = 'cancelled';
    else if (s.status === 'completed' || end < now) statusClass = 'completed'; // Auto-complete visually if past
    else if (start <= now && end >= now) statusClass = 'active'; // In progress

    // Link button
    const linkBtn = s.meeting_url
      ? `<a href="${esc(s.meeting_url)}" target="_blank" class="btn-sm btn-primary" style="text-decoration:none;padding:.3rem .6rem">Join</a>`
      : '<span style="color:var(--gray-400)">—</span>';

    return `
      <tr>
        <td>
          <div style="font-weight:600;color:var(--gray-900)">${esc(s.title)}</div>
          ${s.lessons?.title ? `<div style="font-size:.8rem;color:var(--gray-500)">Lesson: ${esc(s.lessons.title)}</div>` : ''}
        </td>
        <td>${esc(s.cohorts?.name || 'Unknown')}</td>
        <td>
          <div style="font-variant-numeric:tabular-nums">
            <div>${start.toLocaleDateString()}</div>
            <div style="color:var(--gray-500);font-size:.85rem">
              ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – 
              ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </td>
        <td><span class="badge badge-${statusClass}">${s.status}</span></td>
        <td>${linkBtn}</td>
        <td class="actions-cell">
          <button class="btn-sm btn-edit" onclick="editSession('${s.id}')">Edit</button>
          <button class="btn-sm btn-danger" onclick="deleteSession('${s.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterSchedule() {
  scheduleCohortFilter = document.getElementById('scheduleCohortFilter').value;
  const filtered = scheduleCohortFilter
    ? scheduleCache.filter(s => s.cohort_id === scheduleCohortFilter)
    : scheduleCache;

  if (window.paginators['schedulePagination']) {
    window.paginators['schedulePagination'].setFilteredItems(filtered);
  } else {
    renderSchedule(filtered);
  }

  updateCalendarEvents();
}

async function openSessionModal(session = null) {
  const isEdit = !!(session && session.id);

  // Ensure we have cohorts and courses/lessons loaded for pickers
  if (cohortsCache.length === 0) {
    const { data } = await sb().from('cohorts').select('id, name').order('starts_at', { ascending: false });
    cohortsCache = data || [];
  }

  // We need lessons for the dropdown. Let's fetch all lessons or fetch dynamically.
  // Fetching all lessons might be heavy if many courses. 
  // Let's just fetch simplified list: id, title, course_id, courses(title)
  // Or better: load lessons when cohort is selected? 
  // For simplicity, let's load all lessons now (assuming < 1000).
  const { data: allLessons } = await sb().from('lessons').select('id, title, course_id, courses(title, cohort_id)');

  // Helper to filter lessons by cohort
  const getLessonsForCohort = (cId) => {
    if (!allLessons) return [];
    return allLessons.filter(l => l.courses?.cohort_id === cId || !l.courses?.cohort_id);
    // ^ Loose matching: if course has no cohort, maybe it's general? 
    // Actually our schema links course->cohort. So strictly filter by course->cohort_id.
  };

  const currentCohortId = session?.cohort_id || cohortsCache[0]?.id || '';

  // Pre-calculate start/end strings for datetime-local (YYYY-MM-DDTHH:mm)
  const toLocalISO = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0); // next full hour
  defaultStart.setHours(defaultStart.getHours() + 1);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setMinutes(90); // +1.5h

  const startVal = session ? toLocalISO(session.start_time || session.start) : toLocalISO(defaultStart);
  const endVal = session ? toLocalISO(session.end_time || session.end) : toLocalISO(defaultEnd);

  // Handle case where we pass a raw object from calendar click which might just have start_time/end_time props
  // The original code was fine if `session` matches standard structure. 
  // But my dateClick handler passes { start_time, end_time }.

  openModal(
    isEdit ? 'Edit Session' : 'Schedule Session',
    `
      <div class="form-row">
        <div class="form-group">
          <label>Cohort</label>
          <select id="mSessCohort" onchange="updateLessonOptions(this.value)">
            ${cohortsCache.map(c => `<option value="${c.id}" ${c.id === currentCohortId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="mSessStatus">
            <option value="scheduled" ${session?.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
            <option value="cancelled" ${session?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            <option value="completed" ${session?.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label>Title</label>
        <input id="mSessTitle" value="${esc(session?.title || '')}" placeholder="e.g. Weekly Q&A" />
      </div>

      <div class="form-group">
        <label>Linked Lesson (Optional)</label>
        <select id="mSessLesson">
          <option value="">— No linked lesson —</option>
          <!-- Options populated by JS -->
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Start Time</label>
          <input type="datetime-local" id="mSessStart" value="${startVal}" />
        </div>
        <div class="form-group">
          <label>End Time</label>
          <input type="datetime-local" id="mSessEnd" value="${endVal}" />
        </div>
      </div>

      <div class="form-group">
        <label>Meeting Link (Zoom / Meet)</label>
        <input id="mSessLink" value="${esc(session?.meeting_url || '')}" placeholder="https://..." />
      </div>
      
      <div class="form-group">
        <label>Description / Notes</label>
        <textarea id="mSessDesc" rows="3">${esc(session?.description || '')}</textarea>
      </div>
    `,
    async () => {
      const payload = {
        cohort_id: document.getElementById('mSessCohort').value,
        title: document.getElementById('mSessTitle').value.trim(),
        lesson_id: document.getElementById('mSessLesson').value || null,
        start_time: new Date(document.getElementById('mSessStart').value).toISOString(),
        end_time: new Date(document.getElementById('mSessEnd').value).toISOString(),
        meeting_url: document.getElementById('mSessLink').value.trim() || null,
        description: document.getElementById('mSessDesc').value.trim() || null,
        status: document.getElementById('mSessStatus').value,
      };

      if (!payload.title) throw new Error('Title is required');
      if (!payload.cohort_id) throw new Error('Cohort is required');
      if (!payload.start_time || !payload.end_time) throw new Error('Times are required');

      if (new Date(payload.end_time) <= new Date(payload.start_time)) {
        throw new Error('End time must be after start time');
      }

      if (isEdit) {
        const { error } = await sb().from('scheduled_sessions').update(payload).eq('id', session.id);
        if (error) throw error;
      } else {
        const { error } = await sb().from('scheduled_sessions').insert(payload);
        if (error) throw error;
      }
      await loadSchedule();
    }
  );

  // Helper to populate lesson select
  window.updateLessonOptions = (cId) => {
    const lessonSelect = document.getElementById('mSessLesson');
    if (!lessonSelect) return;

    // Filter courses that belong to this cohort
    // This logic relies on `allLessons` which we already fetched.
    // NOTE: This window function hack is a bit dirty, but effective for the modal scope.
    const relevantLessons = (allLessons || []).filter(l =>
      l.courses?.cohort_id === cId // direct match
    );

    lessonSelect.innerHTML = '<option value="">— No linked lesson —</option>' +
      relevantLessons.map(l => {
        const courseTitle = l.courses?.title || 'Unknown Course';
        return `<option value="${l.id}" ${session?.lesson_id === l.id ? 'selected' : ''}>${esc(courseTitle)}: ${esc(l.title)}</option>`;
      }).join('');
  };

  // Init lessons for currently selected cohort
  window.updateLessonOptions(currentCohortId);
}

function editSession(id) {
  const s = scheduleCache.find(x => x.id === id);
  if (s) openSessionModal(s);
}

async function deleteSession(id) {
  const ok = await confirmDialog('Delete this session?');
  if (!ok) return;
  const { error } = await sb().from('scheduled_sessions').delete().eq('id', id);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Session deleted');
  await loadSchedule();
}
