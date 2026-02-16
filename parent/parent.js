/* ============================================================
   Web Genius — Parent Portal Logic
   ============================================================ */

/* ----------------------------------------------------------
   TOAST NOTIFICATION SYSTEM
   ---------------------------------------------------------- */
(function initToastContainer() {
    if (!document.querySelector('.toast-container')) {
        const tc = document.createElement('div');
        tc.className = 'toast-container';
        document.body.appendChild(tc);
    }
})();

function showToast(message, type = 'info', duration = 3500) {
    const container = document.querySelector('.toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.classList.add('toast-out');setTimeout(()=>this.parentElement.remove(),300)">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* ----------------------------------------------------------
   GLOBAL STATE
   ---------------------------------------------------------- */
let currentUser = null;
let userProfile = null;
let linkedChildren = [];   // Array of { id, full_name, ... } student profiles
let selectedChildId = null; // Currently selected child (null = all)

const sb = window.WebGeniusDB?.supabase;

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    if (!sb) {
        window.location.href = 'login.html';
        return;
    }

    const { data: { session }, error } = await sb.auth.getSession();
    if (!session || error) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = session.user;

    // Fetch parent profile
    const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (!profile || profile.role !== 'parent') {
        await sb.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    userProfile = profile;

    // Initialize language
    if (typeof initParentLang === 'function') {
        initParentLang(userProfile?.locale);
    }

    // Fetch linked children
    await loadLinkedChildren();

    // Setup UI
    setupUI();

    // Initial Route
    handleRoute();
});

/* ----------------------------------------------------------
   LOAD LINKED CHILDREN
   ---------------------------------------------------------- */
async function loadLinkedChildren() {
    const { data: links } = await sb
        .from('parent_student')
        .select('student_id, profiles!parent_student_student_id_fkey(id, full_name, avatar_url, locale, created_at)')
        .eq('parent_id', currentUser.id);

    linkedChildren = (links || [])
        .map(l => l.profiles)
        .filter(Boolean);

    // Update child switcher dropdown
    updateChildSwitcher();
}

function updateChildSwitcher() {
    const switcher = document.getElementById('childSwitcher');
    if (!switcher) return;

    if (linkedChildren.length <= 1) {
        // If only one child, auto-select and hide switcher
        if (linkedChildren.length === 1) {
            selectedChildId = linkedChildren[0].id;
        }
        switcher.style.display = 'none';
        return;
    }

    switcher.style.display = 'inline-block';
    switcher.innerHTML = `<option value="">${tp('switcher.allChildren')}</option>` +
        linkedChildren.map(c => `<option value="${c.id}" ${selectedChildId === c.id ? 'selected' : ''}>${esc(c.full_name || 'Unnamed')}</option>`).join('');
}

function getActiveChildIds() {
    if (selectedChildId) return [selectedChildId];
    return linkedChildren.map(c => c.id);
}

/* ----------------------------------------------------------
   UI SETUP
   ---------------------------------------------------------- */
function setupUI() {
    // User info
    document.getElementById('userName').textContent = userProfile?.full_name || currentUser.email;
    document.getElementById('userAvatar').textContent = initials(userProfile?.full_name || currentUser.email);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await sb.auth.signOut();
        window.location.href = 'login.html';
    });

    // Mobile menu
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

    // Child switcher
    document.getElementById('childSwitcher').addEventListener('change', (e) => {
        selectedChildId = e.target.value || null;
        handleRoute(); // Re-render current section
    });

    // Navigation
    window.addEventListener('hashchange', handleRoute);
}

/* ----------------------------------------------------------
   ROUTING
   ---------------------------------------------------------- */
const routes = {
    dashboard: loadDashboard,
    children: loadChildren,
    courses: loadCourseProgress,
    assignments: loadAssignments,
    schedule: loadSchedule,
    achievements: loadAchievements,
    profile: loadProfile,
};

/* ==============================================================
   SCHEDULE
   ============================================================== */
let scheduleCache = [];
let currentCalendarDate = new Date();

async function loadSchedule(container) {
    const childIds = getActiveChildIds();
    if (childIds.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>${tp('children.noLinked')}</h3></div>`;
        return;
    }

    container.innerHTML = `
    <div class="header-row">
      <h2>${tp('title.schedule')}</h2>
    </div>
    <div class="schedule-container">
      <div class="calendar-controls">
        <button class="btn-icon" onclick="changeMonth(-1)">‹</button>
        <h3 id="calendarMonthLabel">Month Year</h3>
        <button class="btn-icon" onclick="changeMonth(1)">›</button>
        <button class="btn-sm btn-secondary" onclick="jumpToToday()">${tp('schedule.today')}</button>
      </div>
      
      <div class="calendar-grid-header">
        <div>${tp('days.mon')}</div>
        <div>${tp('days.tue')}</div>
        <div>${tp('days.wed')}</div>
        <div>${tp('days.thu')}</div>
        <div>${tp('days.fri')}</div>
        <div>${tp('days.sat')}</div>
        <div>${tp('days.sun')}</div>
      </div>
      <div id="calendarGrid" class="calendar-grid">
        <!-- Days injected here -->
      </div>
      
      <div id="selectedDaySessions" class="sessions-list">
        <div class="empty-state" style="padding:1rem">${tp('schedule.selectDay')}</div>
      </div>
    </div>
  `;

    // Fetch sessions for all children's enrolled cohorts
    const { data: enrollments } = await sb.from('enrollments')
        .select('cohort_id, student_id')
        .in('student_id', childIds)
        .eq('status', 'active');

    if (enrollments && enrollments.length > 0) {
        const cohortIds = enrollments.map(e => e.cohort_id);
        const { data: sessions, error } = await sb
            .from('scheduled_sessions')
            .select('*, cohorts(name, id), lessons(title)')
            .in('cohort_id', cohortIds)
            .neq('status', 'cancelled')
            .order('start_time');

        if (!error) {
            // Map sessions to include which child it's for?
            // A session belongs to a cohort. We know which child is in which cohort.
            scheduleCache = (sessions || []).map(s => {
                const studentIds = enrollments.filter(e => e.cohort_id === s.cohort_id && childIds.includes(e.student_id)).map(e => e.student_id);
                return { ...s, studentIds };
            });
        }
    } else {
        scheduleCache = [];
    }

    renderCalendar();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    selectDay(`${y}-${m}-${d}`);
}


window.changeMonth = (delta) => {
    currentCalendarDate.setDate(1);
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
};


window.jumpToToday = () => {
    currentCalendarDate = new Date();
    renderCalendar();
    const y = currentCalendarDate.getFullYear();
    const m = String(currentCalendarDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentCalendarDate.getDate()).padStart(2, '0');
    selectDay(`${y}-${m}-${d}`);
};


function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('calendarMonthLabel');
    if (!grid) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const currentLang = userProfile?.locale === 'lt' ? 'lt-LT' : 'en-US';
    const monthName = new Date(year, month).toLocaleString(currentLang, { month: 'long', year: 'numeric' });
    monthLabel.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    let html = '';

    for (let i = 0; i < startDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    for (let d = 1; d <= daysInMonth; d++) {
        const localDate = new Date(year, month, d);
        const yyyy = localDate.getFullYear();
        const mm = String(localDate.getMonth() + 1).padStart(2, '0');
        const dd = String(localDate.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;

        const daySessions = scheduleCache.filter(s => s.start_time.startsWith(isoDate));
        const hasSession = daySessions.length > 0;
        const isToday = isoDate === todayStr;

        html += `
      <div class="calendar-day ${hasSession ? 'has-session' : ''} ${isToday ? 'today' : ''}" 
           onclick="selectDay('${isoDate}')">
        <div class="day-number">${d}</div>
        ${hasSession ? '<div class="session-dot"></div>' : ''}
      </div>
    `;
    }

    grid.innerHTML = html;
}

window.selectDay = (dateStr) => {
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
    const list = document.getElementById('selectedDaySessions');
    const daySessions = scheduleCache.filter(s => s.start_time.startsWith(dateStr));

    const dateObj = new Date(dateStr);
    const currentLang = userProfile?.locale === 'lt' ? 'lt-LT' : 'en-US';
    const niceDate = dateObj.toLocaleDateString(currentLang, { weekday: 'long', month: 'long', day: 'numeric' });

    if (daySessions.length === 0) {
        list.innerHTML = `
      <div style="margin-bottom:1rem;font-weight:600;color:var(--gray-500)">${niceDate}</div>
      <div class="empty-state">${tp('schedule.noSessions')}</div>
    `;
    } else {
        list.innerHTML = `
      <div style="margin-bottom:1rem;font-weight:600;color:var(--gray-900)">${niceDate}</div>
      ${daySessions.map(s => {
            const start = new Date(s.start_time);
            const end = new Date(s.end_time);
            const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            // Find which children this applies to
            const involvedChildren = linkedChildren.filter(c => s.studentIds.includes(c.id));
            const childBadges = involvedChildren.map(c => `<span class="course-tag" style="font-size:.7rem;padding:.1rem .4rem">${esc(c.full_name)}</span>`).join('');

            return `
          <div class="session-card">
            <div class="session-time">${timeStr}</div>
            <div class="session-info">
              <div class="session-title">${esc(s.title)} ${childBadges}</div>
              ${s.lessons?.title ? `<div class="session-lesson">${esc(s.lessons.title)}</div>` : ''}
              ${s.description ? `<div class="session-desc">${esc(s.description)}</div>` : ''}
              <div class="session-cohort" style="font-size:.75rem;color:var(--gray-400)">${esc(s.cohorts?.name || '')}</div>
            </div>
            ${s.meeting_url
                    ? `<a href="${esc(s.meeting_url)}" target="_blank" class="btn btn-primary btn-sm">${tp('schedule.join')}</a>`
                    : `<button disabled class="btn btn-secondary btn-sm">${tp('schedule.noLink')}</button>`}
          </div>
        `;
        }).join('')}
    `;
    }
};


async function handleRoute() {
    const fullHash = window.location.hash.replace('#', '') || 'dashboard';
    const [section] = fullHash.split('?');
    const handler = routes[section] || routes.dashboard;

    // Update active nav
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.section === section);
    });

    const titles = {
        dashboard: tp('title.dashboard'),
        children: tp('title.children'),
        courses: tp('title.courses'),
        assignments: tp('title.assignments'),
        schedule: tp('title.schedule'),
        achievements: tp('title.achievements'),

        profile: tp('title.profile'),
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Parent Portal';

    const container = document.getElementById('contentArea');
    container.innerHTML = `<div class="loading-state">${tp('loading')}</div>`;

    try {
        await handler(container);
    } catch (err) {
        console.error('Route Error:', err);
        container.innerHTML = `<div style="color:red;padding:2rem;">Error loading content: ${err.message}</div>`;
    }
}

/* ==============================================================
   DASHBOARD
   ============================================================== */
async function loadDashboard(container) {
    if (linkedChildren.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍👧‍👦</div>
                <h3>${tp('dash.noChildrenLinked')}</h3>
                <p>${tp('dash.noChildrenDesc')}</p>
            </div>`;
        return;
    }

    const childIds = getActiveChildIds();

    // Fetch data in parallel
    const [enrollRes, progressRes, diplomaRes, announcementRes] = await Promise.all([
        sb.from('enrollments')
            .select('*, courses(*), cohorts(id, name, courses(*))')
            .in('student_id', childIds)
            .eq('status', 'active'),
        sb.from('lesson_progress')
            .select('lesson_id, completed')
            .in('student_id', childIds)
            .eq('completed', true),
        sb.from('diplomas')
            .select('id')
            .in('student_id', childIds),
        sb.from('announcements')
            .select('*')
            .in('audience', ['all', 'parents'])
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false })
            .limit(5),
    ]);

    const enrollments = enrollRes.data || [];
    const completedLessons = progressRes.data || [];
    const diplomas = diplomaRes.data || [];
    const announcements = announcementRes.data || [];

    // Aggregate unique courses
    const courseMap = new Map();
    for (const e of enrollments) {
        if (e.courses) courseMap.set(e.courses.id, e.courses);
        if (e.cohorts?.courses && Array.isArray(e.cohorts.courses)) {
            for (const c of e.cohorts.courses) courseMap.set(c.id, c);
        }
    }
    const courseCount = courseMap.size;

    // Count pending assignments
    let pendingCount = 0;
    const allCourses = Array.from(courseMap.values());
    if (allCourses.length > 0) {
        const courseIds = allCourses.map(c => c.id);
        const { data: lessons } = await sb.from('lessons').select('id').in('course_id', courseIds);
        const lessonIds = lessons?.map(l => l.id) || [];
        if (lessonIds.length > 0) {
            const { data: assignments } = await sb.from('assignments').select('id').in('lesson_id', lessonIds);
            const assignIds = assignments?.map(a => a.id) || [];
            if (assignIds.length > 0) {
                const { data: submissions } = await sb.from('submissions')
                    .select('assignment_id')
                    .in('student_id', childIds)
                    .in('assignment_id', assignIds);
                const submittedSet = new Set(submissions?.map(s => s.assignment_id));
                pendingCount = assignIds.filter(id => !submittedSet.has(id)).length;
            }
        }
    }

    // Announcements HTML
    let announcementsHtml = '';
    if (announcements.length > 0) {
        let items = '';
        for (const a of announcements) {
            const dateStr = formatDate(a.published_at);
            const priorityBadge = a.priority !== 'normal'
                ? `<span class="priority-badge priority-${a.priority}">${a.priority}</span>`
                : '';
            items += `
                <div class="announcement-item">
                    <div class="announcement-title">${esc(a.title)} ${priorityBadge}</div>
                    <div class="announcement-body">${esc(a.body)}</div>
                    <div class="announcement-date">${dateStr}</div>
                </div>`;
        }
        announcementsHtml = `
            <div class="announcements-card">
                <h3>${tp('dash.announcements')}</h3>
                ${items}
            </div>`;
    } else {
        announcementsHtml = `
            <div class="announcements-card">
                <h3>${tp('dash.announcements')}</h3>
                <div class="empty-state" style="padding:1.5rem;"><div style="font-size:2rem;margin-bottom:.5rem">📭</div><p>${tp('dash.noAnnouncements')}</p></div>
            </div>`;
    }

    // Quick links
    const quickLinksHtml = `
        <div class="announcements-card">
            <h3>${tp('dash.quickLinks')}</h3>
            <div style="display:flex;flex-direction:column;gap:.5rem;">
                <a href="#children" style="display:flex;align-items:center;gap:.75rem;padding:.6rem .8rem;border-radius:var(--radius-sm);border:1px solid var(--gray-100);text-decoration:none;color:inherit;transition:all .2s;">
                    <span style="font-size:1.3rem;">👨‍👧‍👦</span>
                    <div style="flex:1"><div style="font-weight:600;color:var(--gray-800);">${tp('nav.myChildren')}</div><div style="font-size:.78rem;color:var(--gray-400);">${linkedChildren.length} ${tp('dash.linked')}</div></div>
                    <span style="color:var(--gray-300);">→</span>
                </a>
                <a href="#courses" style="display:flex;align-items:center;gap:.75rem;padding:.6rem .8rem;border-radius:var(--radius-sm);border:1px solid var(--gray-100);text-decoration:none;color:inherit;transition:all .2s;">
                    <span style="font-size:1.3rem;">📚</span>
                    <div style="flex:1"><div style="font-weight:600;color:var(--gray-800);">${tp('nav.courseProgress')}</div><div style="font-size:.78rem;color:var(--gray-400);">${tp('dash.trackLearning')}</div></div>
                    <span style="color:var(--gray-300);">→</span>
                </a>
                <a href="#assignments" style="display:flex;align-items:center;gap:.75rem;padding:.6rem .8rem;border-radius:var(--radius-sm);border:1px solid var(--gray-100);text-decoration:none;color:inherit;transition:all .2s;">
                    <span style="font-size:1.3rem;">📝</span>
                    <div style="flex:1"><div style="font-weight:600;color:var(--gray-800);">${tp('nav.assignments')}</div><div style="font-size:.78rem;color:var(--gray-400);">${pendingCount} ${tp('dash.pending')}</div></div>
                    <span style="color:var(--gray-300);">→</span>
                </a>
            </div>
        </div>`;

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon teal">👨‍👧‍👦</div>
                <div class="stat-value">${linkedChildren.length}</div>
                <div class="stat-label">${tp('dash.children')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">📚</div>
                <div class="stat-value">${courseCount}</div>
                <div class="stat-label">${tp('dash.activeCourses')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">✅</div>
                <div class="stat-value">${completedLessons.length}</div>
                <div class="stat-label">${tp('dash.lessonsCompleted')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon amber">📝</div>
                <div class="stat-value">${pendingCount}</div>
                <div class="stat-label">${tp('dash.pendingAssignments')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">🎓</div>
                <div class="stat-value">${diplomas.length}</div>
                <div class="stat-label">${tp('dash.diplomasEarned')}</div>
            </div>
        </div>

        <div class="dash-two-col">
            ${announcementsHtml}
            ${quickLinksHtml}
        </div>
    `;
}

/* ==============================================================
   CHILDREN
   ============================================================== */
async function loadChildren(container) {
    if (linkedChildren.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍👧‍👦</div>
                <h3>${tp('children.noLinked')}</h3>
                <p>${tp('children.contactAdmin')}</p>
            </div>`;
        return;
    }

    // Fetch stats per child
    const childIds = linkedChildren.map(c => c.id);

    const [enrollRes, progressRes, diplomaRes] = await Promise.all([
        sb.from('enrollments').select('student_id, id, status, cohorts(name)').in('student_id', childIds).eq('status', 'active'),
        sb.from('lesson_progress').select('student_id, completed').in('student_id', childIds).eq('completed', true),
        sb.from('diplomas').select('student_id, id').in('student_id', childIds),
    ]);

    const enrollments = enrollRes.data || [];
    const progress = progressRes.data || [];
    const diplomas = diplomaRes.data || [];

    // Group by child
    const enrollByChild = {};
    enrollments.forEach(e => {
        if (!enrollByChild[e.student_id]) enrollByChild[e.student_id] = [];
        enrollByChild[e.student_id].push(e);
    });

    const progByChild = {};
    progress.forEach(p => {
        progByChild[p.student_id] = (progByChild[p.student_id] || 0) + 1;
    });

    const dipByChild = {};
    diplomas.forEach(d => {
        dipByChild[d.student_id] = (dipByChild[d.student_id] || 0) + 1;
    });

    let html = `
        <div class="section-header">
            <h2>${tp('children.title')}</h2>
        </div>
        <div class="children-grid">
    `;

    for (const child of linkedChildren) {
        const enrollCount = (enrollByChild[child.id] || []).length;
        const lessonsCompleted = progByChild[child.id] || 0;
        const diplomaCount = dipByChild[child.id] || 0;
        const cohortNames = (enrollByChild[child.id] || []).map(e => e.cohorts?.name).filter(Boolean);

        html += `
            <div class="child-card ${selectedChildId === child.id ? 'selected' : ''}" onclick="selectChild('${child.id}')">
                <div class="child-card-header">
                    <div class="child-avatar">${initials(child.full_name)}</div>
                    <div>
                        <div class="child-name">${esc(child.full_name || 'Unnamed')}</div>
                        <div class="child-joined">${tp('children.joined')} ${formatDate(child.created_at)}</div>
                    </div>
                </div>
                ${cohortNames.length
                ? `<div style="margin-bottom:.75rem;">${cohortNames.map(n => `<span class="course-tag" style="margin-right:.3rem">${esc(n)}</span>`).join('')}</div>`
                : ''}
                <div class="child-stats">
                    <div class="child-stat">
                        <div class="child-stat-value">${enrollCount}</div>
                        <div class="child-stat-label">${tp('children.courses')}</div>
                    </div>
                    <div class="child-stat">
                        <div class="child-stat-value">${lessonsCompleted}</div>
                        <div class="child-stat-label">${tp('children.lessonsDone')}</div>
                    </div>
                    <div class="child-stat">
                        <div class="child-stat-value">${diplomaCount}</div>
                        <div class="child-stat-label">${tp('children.diplomas')}</div>
                    </div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

window.selectChild = function (childId) {
    selectedChildId = selectedChildId === childId ? null : childId;
    updateChildSwitcher();
    handleRoute();
};

/* ==============================================================
   COURSE PROGRESS
   ============================================================== */
async function loadCourseProgress(container) {
    const childIds = getActiveChildIds();
    if (childIds.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><h3>${tp('courses.noChildrenLinked')}</h3></div>`;
        return;
    }

    // Fetch enrollments for children
    const { data: enrollments } = await sb.from('enrollments')
        .select('*, courses(*), cohorts(id, name, courses(*))')
        .in('student_id', childIds)
        .eq('status', 'active');

    // Aggregate unique courses
    const courseMap = new Map();
    (enrollments || []).forEach(e => {
        if (e.courses) courseMap.set(e.courses.id, e.courses);
        if (e.cohorts?.courses && Array.isArray(e.cohorts.courses)) {
            e.cohorts.courses.forEach(c => courseMap.set(c.id, c));
        }
    });

    const allCourses = Array.from(courseMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    if (allCourses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>${tp('courses.noActiveCourses')}</h3>
                <p>${childIds.length > 1 ? tp('courses.notEnrolledMulti') : tp('courses.notEnrolledSingle')}</p>
            </div>`;
        return;
    }

    // Fetch lesson progress for all children
    const { data: allProgress } = await sb.from('lesson_progress')
        .select('lesson_id, completed, student_id')
        .in('student_id', childIds);

    const completedSet = new Set((allProgress || []).filter(p => p.completed).map(p => p.lesson_id));

    // Get selected child name for header
    const childLabel = selectedChildId
        ? (linkedChildren.find(c => c.id === selectedChildId)?.full_name || tp('courses.child'))
        : tp('courses.allChildren');

    let html = `
        <div class="section-header">
            <h2>${tp('courses.progressTitle')} — ${esc(childLabel)}</h2>
        </div>
        <div class="card-grid">
    `;

    for (const course of allCourses) {
        const { data: lessons } = await sb.from('lessons')
            .select('id, title, sort_order, duration_min')
            .eq('course_id', course.id)
            .order('sort_order');

        const total = lessons?.length || 0;
        const done = lessons?.filter(l => completedSet.has(l.id)).length || 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        html += `
            <div class="course-card" onclick="viewCourseDetail('${course.id}')">
                <div class="course-thumb">
                    ${course.thumbnail
                ? `<img src="${course.thumbnail}" alt="${esc(course.title)}">`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;background:var(--gray-100);color:var(--gray-400);">📚</div>`}
                </div>
                <div class="course-body">
                    <div class="course-title">${esc(course.title)}</div>
                    <div style="font-size:.85rem;color:var(--gray-500);height:2.5em;overflow:hidden;">${esc(course.description || '')}</div>
                    <div class="progress-bar-wrap">
                        <div class="progress-bar" style="width:${pct}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${pct}${tp('courses.pctComplete')}</span>
                        <span>${done}/${total} ${tp('courses.lessons')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

/* Course detail — lesson-by-lesson breakdown */
window.viewCourseDetail = async function (courseId) {
    const container = document.getElementById('contentArea');
    container.innerHTML = `<div class="loading-state">${tp('courses.loadingCourse')}</div>`;

    const childIds = getActiveChildIds();

    const { data: course } = await sb.from('courses').select('*').eq('id', courseId).single();
    const { data: lessons } = await sb.from('lessons')
        .select('id, title, sort_order, duration_min')
        .eq('course_id', courseId)
        .order('sort_order');

    const { data: progress } = await sb.from('lesson_progress')
        .select('lesson_id, completed')
        .in('student_id', childIds);

    const completedSet = new Set((progress || []).filter(p => p.completed).map(p => p.lesson_id));
    const total = lessons?.length || 0;
    const done = lessons?.filter(l => completedSet.has(l.id)).length || 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    let html = `
        <a href="#courses" class="back-link">${tp('courses.backToCourses')}</a>
        <div style="background:white;padding:1.5rem;border-radius:var(--radius-lg);border:1px solid var(--gray-200);margin-bottom:1.5rem;">
            <h2 style="font-family:var(--font-heading);font-weight:700;font-size:1.4rem;color:var(--gray-900);margin-bottom:.3rem;">${esc(course?.title)}</h2>
            <p style="color:var(--gray-500);font-size:.9rem;margin-bottom:1rem;">${esc(course?.description || '')}</p>
            <div class="progress-bar-wrap" style="height:8px;">
                <div class="progress-bar" style="width:${pct}%"></div>
            </div>
            <div class="progress-text" style="margin-top:.4rem;">
                <span>${pct}${tp('courses.pctComplete')}</span>
                <span>${done}/${total} ${tp('courses.lessons')}</span>
            </div>
        </div>

        <div class="lesson-list">
    `;

    if (!lessons || lessons.length === 0) {
        html += `<div class="empty-state"><p>${tp('courses.noLessonsYet')}</p></div>`;
    } else {
        lessons.forEach((lesson, idx) => {
            const isCompleted = completedSet.has(lesson.id);
            html += `
                <div class="lesson-item ${isCompleted ? 'completed' : ''}">
                    <div class="lesson-status-icon">${isCompleted ? '✓' : (idx + 1)}</div>
                    <div class="lesson-info">
                        <div class="lesson-title">${esc(lesson.title)}</div>
                        <div class="lesson-meta">${lesson.duration_min ? lesson.duration_min + ' ' + tp('courses.min') : tp('courses.videoLesson')}</div>
                    </div>
                    <div style="color:${isCompleted ? 'var(--primary-600)' : 'var(--gray-300)'}; font-weight:600; font-size:.85rem;">
                        ${isCompleted ? tp('courses.done') : tp('courses.notStarted')}
                    </div>
                </div>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
};

/* ==============================================================
   ASSIGNMENTS
   ============================================================== */
async function loadAssignments(container) {
    const childIds = getActiveChildIds();
    if (childIds.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><h3>${tp('assign.noChildrenLinked')}</h3></div>`;
        return;
    }

    // 1. Get enrollments
    const { data: enrollments } = await sb.from('enrollments')
        .select('course_id, cohort_id, student_id')
        .in('student_id', childIds)
        .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = `
            <div class="empty-state"><div class="empty-icon">📝</div>
            <h3>${tp('assign.noActiveEnrollments')}</h3>
            <p>${tp('assign.childNeedsEnroll')}</p></div>`;
        return;
    }

    // 2. Aggregate course IDs
    const courseIds = new Set();
    const cohortIds = new Set();
    enrollments.forEach(e => {
        if (e.course_id) courseIds.add(e.course_id);
        if (e.cohort_id) cohortIds.add(e.cohort_id);
    });

    if (cohortIds.size > 0) {
        const { data: cc } = await sb.from('courses').select('id').in('cohort_id', Array.from(cohortIds));
        cc?.forEach(c => courseIds.add(c.id));
    }

    if (courseIds.size === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><h3>${tp('assign.noAssignments')}</h3></div>`;
        return;
    }

    // 3. Get lessons + assignments
    const { data: lessons } = await sb.from('lessons').select('id, title, course_id, courses(title)').in('course_id', Array.from(courseIds));
    const lessonIds = lessons?.map(l => l.id) || [];
    if (lessonIds.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><h3>${tp('assign.noAssignments')}</h3></div>`;
        return;
    }

    const { data: assignments } = await sb.from('assignments').select('*').in('lesson_id', lessonIds).order('created_at', { ascending: false });
    if (!assignments || assignments.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><h3>${tp('assign.noAssignments')}</h3><p>${tp('assign.noAssignmentsDesc')}</p></div>`;
        return;
    }

    // 4. Get submissions for these assignments from the children
    const { data: submissions } = await sb.from('submissions')
        .select('*, profiles!submissions_student_id_fkey(full_name)')
        .in('student_id', childIds)
        .in('assignment_id', assignments.map(a => a.id));

    // Map: assignmentId -> { childId -> submission }
    const subMap = {};
    (submissions || []).forEach(s => {
        if (!subMap[s.assignment_id]) subMap[s.assignment_id] = {};
        subMap[s.assignment_id][s.student_id] = s;
    });

    const childLabel = selectedChildId
        ? (linkedChildren.find(c => c.id === selectedChildId)?.full_name || tp('courses.child'))
        : tp('courses.allChildren');

    let html = `
        <div class="section-header">
            <h2>${tp('assign.title')} — ${esc(childLabel)}</h2>
            <div class="filter-controls">
                <button class="filter-btn active" onclick="filterParentAssignments('all')">${tp('assign.all')}</button>
                <button class="filter-btn" onclick="filterParentAssignments('pending')">${tp('assign.pendingFilter')}</button>
                <button class="filter-btn" onclick="filterParentAssignments('submitted')">${tp('assign.submitted')}</button>
                <button class="filter-btn" onclick="filterParentAssignments('graded')">${tp('assign.graded')}</button>
            </div>
        </div>
        <div class="assignments-grid">
    `;

    for (const assign of assignments) {
        const lesson = lessons.find(l => l.id === assign.lesson_id);
        const childSubs = subMap[assign.id] || {};

        // For each relevant child
        for (const cId of childIds) {
            const sub = childSubs[cId];
            const child = linkedChildren.find(c => c.id === cId);
            const status = sub ? (sub.grade !== null ? 'graded' : 'submitted') : 'pending';
            const statusLabel = sub ? (sub.grade !== null ? `${tp('assign.graded')}: ${sub.grade}/${assign.max_points}` : tp('assign.submitted')) : tp('assign.pendingFilter');
            const statusClass = `status-${status}`;

            html += `
                <div class="assignment-card" data-status="${status}">
                    <div class="assign-header">
                        <span class="course-tag">${esc(lesson?.courses?.title || 'Course')}</span>
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <h3 class="assign-title">${esc(assign.title)}</h3>
                    <p class="assign-lesson">${tp('assign.lesson')}: ${esc(lesson?.title || '')}</p>
                    ${childIds.length > 1 ? `<p style="font-size:.82rem;color:var(--primary-700);font-weight:600;margin-bottom:.4rem;">👤 ${esc(child?.full_name || tp('courses.child'))}</p>` : ''}
                    <div class="assign-meta">
                        <span>${tp('assign.due')}: ${assign.due_offset_days ? `+${assign.due_offset_days} ${tp('assign.dueOffset')}` : tp('assign.noDeadline')}</span>
                        <span>${tp('assign.max')}: ${assign.max_points} ${tp('assign.pts')}</span>
                    </div>
                    ${sub?.feedback ? `<div class="assign-feedback"><strong>${tp('assign.feedback')}:</strong> ${esc(sub.feedback)}</div>` : ''}
                    ${sub?.submitted_at ? `<div style="font-size:.78rem;color:var(--gray-400);">${tp('assign.submittedOn')} ${formatDate(sub.submitted_at)}</div>` : ''}
                </div>
            `;
        }
    }

    html += '</div>';
    container.innerHTML = html;
}

window.filterParentAssignments = function (filter) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.filter-btn[onclick="filterParentAssignments('${filter}')"]`)?.classList.add('active');

    document.querySelectorAll('.assignment-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.status === filter) ? 'block' : 'none';
    });
};

/* ==============================================================
   ACHIEVEMENTS
   ============================================================== */
async function loadAchievements(container) {
    const childIds = getActiveChildIds();
    if (childIds.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><h3>${tp('achieve.noChildrenLinked')}</h3></div>`;
        return;
    }

    const { data: diplomas } = await sb.from('diplomas')
        .select('*, profiles!diplomas_student_id_fkey(full_name), cohorts(name)')
        .in('student_id', childIds)
        .order('issued_at', { ascending: false });

    const childLabel = selectedChildId
        ? (linkedChildren.find(c => c.id === selectedChildId)?.full_name || tp('courses.child'))
        : tp('courses.allChildren');

    if (!diplomas || diplomas.length === 0) {
        container.innerHTML = `
            <div class="section-header"><h2>${tp('achieve.title')} — ${esc(childLabel)}</h2></div>
            <div class="empty-state">
                <div class="empty-icon">🏆</div>
                <h3>${tp('achieve.noAchievements')}</h3>
                <p>${tp('achieve.noAchievementsDesc')}</p>
            </div>`;
        return;
    }

    let html = `
        <div class="section-header"><h2>${tp('achieve.title')} — ${esc(childLabel)}</h2></div>
        <div class="achievements-grid">
    `;

    for (const d of diplomas) {
        const studentName = d.profiles?.full_name || 'Student';
        const cohortName = d.cohorts?.name || 'Program';
        const gradeDisplay = d.final_grade != null
            ? `<span class="grade-badge">${tp('achieve.grade')}: ${parseFloat(d.final_grade).toFixed(1)}%</span>`
            : '';
        const certLink = d.certificate_url
            ? `<a href="${esc(d.certificate_url)}" target="_blank" class="btn-sm btn-primary" style="text-decoration:none;color:white;margin-top:.5rem;display:inline-block;">${tp('achieve.viewCert')}</a>`
            : '';

        html += `
            <div class="achievement-card">
                <div class="achievement-badge-icon">🎓</div>
                <div class="achievement-content">
                    <h3>${esc(cohortName)} ${tp('achieve.diploma')}</h3>
                    <div style="font-size:.85rem;color:var(--primary-600);font-weight:500;margin-bottom:.2rem;">👤 ${esc(studentName)}</div>
                    <div style="font-size:.8rem;color:var(--gray-400);margin-bottom:.5rem;">${tp('achieve.issued')} ${formatDate(d.issued_at)}</div>
                    ${gradeDisplay}
                    ${certLink}
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

/* ==============================================================
   PROFILE
   ============================================================== */
async function loadProfile(container) {
    container.innerHTML = `
        <div class="section-header"><h2>${tp('profile.title')}</h2></div>
        <div class="profile-grid">
            <div class="profile-card">
                <h3>${tp('profile.personalInfo')}</h3>
                <div class="avatar-section">
                    <div class="avatar-preview" id="avatarPreview">
                        ${userProfile?.avatar_url
            ? `<img src="${userProfile.avatar_url}" alt="Avatar">`
            : initials(userProfile?.full_name || currentUser.email)}
                    </div>
                    <div>
                        <input type="file" id="avatarInput" accept="image/*" style="display:none;" onchange="uploadParentAvatar(this)">
                        <button class="btn-sm btn-primary" onclick="document.getElementById('avatarInput').click()">${tp('profile.changePhoto')}</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>${tp('profile.fullName')}</label>
                    <input id="profileName" value="${esc(userProfile?.full_name || '')}" placeholder="${tp('profile.namePlaceholder')}" />
                </div>
                <div class="form-group">
                    <label>${tp('profile.language')}</label>
                    <select id="profileLocale">
                        <option value="en" ${userProfile?.locale === 'en' ? 'selected' : ''}>🇺🇸 English</option>
                        <option value="lt" ${userProfile?.locale === 'lt' ? 'selected' : ''}>🇱🇹 Lietuvių</option>
                    </select>
                </div>
                <button class="btn-sm btn-primary" onclick="updateParentProfile()" style="margin-top:.5rem;">${tp('profile.saveChanges')}</button>
            </div>
            <div class="profile-card">
                <h3>${tp('profile.changePassword')}</h3>
                <div class="form-group">
                    <label>${tp('profile.newPassword')}</label>
                    <input type="password" id="newPassword" placeholder="${tp('profile.newPasswordPlaceholder')}" />
                </div>
                <div class="form-group">
                    <label>${tp('profile.confirmPassword')}</label>
                    <input type="password" id="confirmPassword" placeholder="${tp('profile.confirmPasswordPlaceholder')}" />
                </div>
                <button class="btn-sm btn-primary" onclick="changeParentPassword()" style="margin-top:.5rem;">${tp('profile.updatePassword')}</button>
            </div>
        </div>
    `;
}

window.uploadParentAvatar = async function (input) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showToast(tp('toast.fileTooLarge'), 'error');
        return;
    }

    try {
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${currentUser.id}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await sb.storage.from('avatars').upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = sb.storage.from('avatars').getPublicUrl(filePath);
        const avatarUrl = urlData.publicUrl;

        await sb.from('profiles').update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
        userProfile.avatar_url = avatarUrl;

        const preview = document.getElementById('avatarPreview');
        preview.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;

        showToast(tp('toast.avatarUpdated'), 'success');
    } catch (err) {
        showToast(tp('toast.avatarFailed') + ': ' + err.message, 'error');
    }
};

window.updateParentProfile = async function () {
    const name = document.getElementById('profileName').value.trim();
    const locale = document.getElementById('profileLocale').value;

    if (!name) {
        showToast(tp('toast.nameEmpty'), 'error');
        return;
    }

    try {
        const { error } = await sb.from('profiles')
            .update({ full_name: name, locale, updated_at: new Date().toISOString() })
            .eq('id', currentUser.id);
        if (error) throw error;

        userProfile.full_name = name;
        userProfile.locale = locale;
        document.getElementById('userName').textContent = name;
        document.getElementById('userAvatar').textContent = initials(name);

        showToast(tp('toast.profileUpdated'), 'success');
    } catch (err) {
        showToast(tp('toast.profileFailed') + ': ' + err.message, 'error');
    }
};

window.changeParentPassword = async function () {
    const pw = document.getElementById('newPassword').value;
    const pw2 = document.getElementById('confirmPassword').value;

    if (!pw || pw.length < 6) {
        showToast(tp('toast.passwordLength'), 'error');
        return;
    }
    if (pw !== pw2) {
        showToast(tp('toast.passwordMismatch'), 'error');
        return;
    }

    try {
        const { error } = await sb.auth.updateUser({ password: pw });
        if (error) throw error;
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        showToast(tp('toast.passwordChanged'), 'success');
    } catch (err) {
        showToast(tp('toast.passwordFailed') + ': ' + err.message, 'error');
    }
};
