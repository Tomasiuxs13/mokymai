/* Student Dashboard Logic */

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

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Global state
let currentUser = null;

let userProfile = null;

// Supabase client instance
const sb = window.WebGeniusDB?.supabase;

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {

    // Check Auth
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

    // Fetch Profile
    const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    userProfile = profile;

    // Initialize language based on profile locale
    if (typeof initStudentLang === 'function') {
        initStudentLang(userProfile?.locale);
    }

    // Setup UI
    setupUI();

    // Initial Route
    handleRoute();
});

/* ----------------------------------------------------------
   UI SETUP
   ---------------------------------------------------------- */
function setupUI() {
    // User Info
    document.getElementById('userName').textContent = userProfile?.full_name || currentUser.email;
    document.getElementById('userAvatar').textContent = (userProfile?.full_name || currentUser.email).charAt(0).toUpperCase();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await sb.auth.signOut();
        window.location.href = 'login.html';
    });

    // Mobile Menu
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Navigation
    window.addEventListener('hashchange', handleRoute);
}

/* ----------------------------------------------------------
   ROUTING
   ---------------------------------------------------------- */
const routes = {
    dashboard: loadDashboardOverview,
    courses: loadCourses,
    course: loadCourseDetail,
    lesson: loadLessonDetail,
    assignments: loadAssignments,
    assignment: loadAssignmentDetail,
    schedule: loadSchedule,
    achievements: loadAchievements,
    profile: loadProfile
};

async function handleRoute() {
    const fullHash = window.location.hash.replace('#', '') || 'dashboard';
    const [section, query] = fullHash.split('?');
    const params = new URLSearchParams(query);

    const handler = routes[section] || routes.dashboard;

    // Update active nav
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        const navSection = a.dataset.section;
        if (navSection === section) {
            a.classList.add('active');
        } else if (section === 'course' || section === 'lesson') {
            a.classList.toggle('active', navSection === 'courses');
        } else {
            a.classList.remove('active');
        }
    });

    const titles = {
        dashboard: t('title.dashboard'),
        courses: t('title.courses'),
        course: t('title.courseDetail'),
        lesson: t('title.lesson'),
        assignments: t('title.assignments'),
        achievements: t('title.achievements'),
        profile: t('title.profile')
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Web Genius';

    const container = document.getElementById('contentArea');
    container.innerHTML = `<div class="loading-state">${t('loading')}</div>`;

    try {
        await handler(container, params);
    } catch (err) {
        console.error('Route Error:', err);
        container.innerHTML = `<div style="color:red">Error loading content: ${err.message}</div>`;
    }
}

/* ----------------------------------------------------------
   SECTIONS
   ---------------------------------------------------------- */

/* ----------------------------------------------------------
   DASHBOARD OVERVIEW
   ---------------------------------------------------------- */
async function loadDashboardOverview(container) {
    container.innerHTML = `<div class="loading-state">${t('loading.dashboard')}</div>`;

    try {
        // Fetch all data in parallel
        const [enrollRes, progressRes, diplomaRes, announcementRes] = await Promise.all([
            sb.from('enrollments')
                .select('*, courses(*), cohorts(id, name, courses(*))')
                .eq('student_id', currentUser.id)
                .eq('status', 'active'),
            sb.from('lesson_progress')
                .select('lesson_id, completed')
                .eq('student_id', currentUser.id)
                .eq('completed', true),
            sb.from('diplomas')
                .select('id')
                .eq('student_id', currentUser.id),
            sb.from('announcements')
                .select('*')
                .lte('published_at', new Date().toISOString())
                .order('published_at', { ascending: false })
                .limit(5)
        ]);

        const enrollments = enrollRes.data || [];
        const completedLessons = progressRes.data || [];
        const diplomas = diplomaRes.data || [];
        const announcements = announcementRes.data || [];

        // Aggregate courses
        const courseMap = new Map();
        for (const enroll of enrollments) {
            if (enroll.courses) courseMap.set(enroll.courses.id, enroll.courses);
            if (enroll.cohorts?.courses && Array.isArray(enroll.cohorts.courses)) {
                for (const c of enroll.cohorts.courses) courseMap.set(c.id, c);
            }
        }
        const allCourses = Array.from(courseMap.values());

        // Count pending assignments
        let pendingAssignments = 0;
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
                        .eq('student_id', currentUser.id)
                        .in('assignment_id', assignIds);
                    const submittedSet = new Set(submissions?.map(s => s.assignment_id));
                    pendingAssignments = assignIds.filter(id => !submittedSet.has(id)).length;
                }
            }
        }

        // Find first incomplete course for "Continue Learning"
        let continueHtml = '';
        if (allCourses.length > 0) {
            const completedSet = new Set(completedLessons.map(p => p.lesson_id));
            for (const course of allCourses) {
                const { count: totalLessons } = await sb.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', course.id);
                const { data: cLessons } = await sb.from('lessons').select('id').eq('course_id', course.id);
                const done = cLessons?.filter(l => completedSet.has(l.id)).length || 0;
                if (done < (totalLessons || 0)) {
                    const pct = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
                    continueHtml = `
                        <div class="continue-card">
                            <h3>${t('dash.continueLearning')}</h3>
                            <a href="#course?id=${course.id}" class="continue-course">
                                <div class="continue-course-icon">
                                    ${course.thumbnail ? `<img src="${course.thumbnail}" alt>` : '📚'}
                                </div>
                                <div class="continue-course-info">
                                    <div class="cc-title">${course.title}</div>
                                    <div class="cc-progress">${pct}% ${t('dash.complete')} · ${done}/${totalLessons} ${t('dash.lessons')}</div>
                                </div>
                                <span class="cc-arrow">→</span>
                            </a>
                        </div>`;
                    break;
                }
            }
        }

        // Announcements
        let announcementsHtml = '';
        if (announcements.length > 0) {
            let items = '';
            for (const a of announcements) {
                const dateStr = new Date(a.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const priorityBadge = a.priority !== 'normal'
                    ? `<span class="priority-badge priority-${a.priority}">${a.priority}</span>`
                    : '';
                items += `
                    <div class="announcement-item">
                        <div class="announcement-title">${a.title} ${priorityBadge}</div>
                        <div class="announcement-body">${a.body}</div>
                        <div class="announcement-date">${dateStr}</div>
                    </div>`;
            }
            announcementsHtml = `
                <div class="announcements-card">
                    <h3>${t('dash.announcements')}</h3>
                    ${items}
                </div>`;
        }

        container.innerHTML = `
            <div class="dashboard-overview">
                <div class="dash-stats">
                    <div class="dash-stat">
                        <div class="dash-stat-icon blue">📚</div>
                        <div class="dash-stat-value">${allCourses.length}</div>
                        <div class="dash-stat-label">${t('dash.activeCourses')}</div>
                    </div>
                    <div class="dash-stat">
                        <div class="dash-stat-icon green">✅</div>
                        <div class="dash-stat-value">${completedLessons.length}</div>
                        <div class="dash-stat-label">${t('dash.lessonsCompleted')}</div>
                    </div>
                    <div class="dash-stat">
                        <div class="dash-stat-icon amber">📝</div>
                        <div class="dash-stat-value">${pendingAssignments}</div>
                        <div class="dash-stat-label">${t('dash.pendingAssignments')}</div>
                    </div>
                    <div class="dash-stat">
                        <div class="dash-stat-icon purple">🎓</div>
                        <div class="dash-stat-value">${diplomas.length}</div>
                        <div class="dash-stat-label">${t('dash.diplomasEarned')}</div>
                    </div>
                </div>

                ${continueHtml}

                <div class="dash-two-col">
                    ${announcementsHtml || `<div class="announcements-card"><h3>${t('dash.announcements')}</h3><div class="empty-state" style="text-align:center;padding:2rem;color:var(--gray-400)"><div style="font-size:2rem;margin-bottom:0.5rem">📭</div><p>${t('dash.noAnnouncements')}</p></div></div>`}
                    <div class="continue-card">
                        <h3>${t('dash.quickLinks')}</h3>
                        <div style="display:flex;flex-direction:column;gap:0.5rem">
                            <a href="#courses" class="continue-course"><span class="continue-course-icon">📚</span><div class="continue-course-info"><div class="cc-title">${t('nav.myCourses')}</div><div class="cc-progress">${t('dash.viewAllCourses')}</div></div><span class="cc-arrow">→</span></a>
                            <a href="#assignments" class="continue-course"><span class="continue-course-icon">📝</span><div class="continue-course-info"><div class="cc-title">${t('nav.assignments')}</div><div class="cc-progress">${pendingAssignments} ${t('dash.pending')}</div></div><span class="cc-arrow">→</span></a>
                            <a href="#achievements" class="continue-course"><span class="continue-course-icon">🏆</span><div class="continue-course-info"><div class="cc-title">${t('nav.achievements')}</div><div class="cc-progress">${diplomas.length} ${diplomas.length !== 1 ? t('dash.diplomas') : t('dash.diploma')}</div></div><span class="cc-arrow">→</span></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Dashboard error:', err);
        container.innerHTML = `<div class="error">Error loading dashboard: ${err.message}</div>`;
    }
}

async function loadCourses(container) {
    console.log('Loading courses for user:', currentUser.id);
    container.innerHTML = `<div class="loading-state">${t('loading.courses')}</div>`;

    // Fetch enrollments with both direct course info AND cohort info (including cohort's courses)
    const { data: enrollments, error } = await sb
        .from('enrollments')
        .select(`
            *,
            courses (*),
            cohorts (
                id, name,
                courses (*)
            )
        `)
        .eq('student_id', currentUser.id)
        .eq('status', 'active');

    if (error) {
        console.error('Error loading enrollments:', error);
        container.innerHTML = `<div class="error">Error loading courses: ${error.message}</div>`;
        return;
    }

    console.log('Enrollments found:', enrollments);

    // Aggregate unique courses from all enrollments
    const courseMap = new Map();

    if (enrollments && enrollments.length > 0) {
        for (const enroll of enrollments) {
            // 1. Direct course enrollment
            if (enroll.courses) {
                courseMap.set(enroll.courses.id, enroll.courses);
            }
            // 2. Cohort enrollment (includes all courses linked to that cohort)
            if (enroll.cohorts && enroll.cohorts.courses && Array.isArray(enroll.cohorts.courses)) {
                for (const c of enroll.cohorts.courses) {
                    courseMap.set(c.id, c);
                }
            }
        }
    }

    const allCourses = Array.from(courseMap.values());

    if (allCourses.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 3rem;">
                <h3>${t('courses.noCourses')}</h3>
                <p>${t('courses.notEnrolled')}</p>
                <a href="../index.html#paths" class="btn btn-primary">${t('courses.browsePrograms')}</a>
            </div>
        `;
        return;
    }

    let html = '<div class="card-grid">';

    // Sort by sort_order
    allCourses.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    for (const course of allCourses) {
        // Fetch total lesson count for this course
        const { count: totalLessons } = await sb
            .from('lessons')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', course.id);

        let completed = 0;

        // Get IDs of lessons in this course to check progress
        const { data: lessonIds } = await sb.from('lessons').select('id').eq('course_id', course.id);

        if (lessonIds && lessonIds.length > 0) {
            const ids = lessonIds.map(l => l.id);
            const { count } = await sb
                .from('lesson_progress')
                .select('id', { count: 'exact', head: true })
                .eq('student_id', currentUser.id)
                .eq('completed', true)
                .in('lesson_id', ids);
            completed = count || 0;
        }

        const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

        html += `
            <a href="#course?id=${course.id}" class="course-card">
                <div class="course-thumb">
                    ${course.thumbnail
                ? `<img src="${course.thumbnail}" alt="${course.title}">`
                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;background:#eee;color:#333;">📚</div>`
            }
                </div>
                <div class="course-body">
                    <div class="course-title">${course.title}</div>
                    <div style="font-size:0.9rem; color:var(--gray-500); height: 2.7em; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                        ${course.description || ''}
                    </div>
                    
                    <div class="progress-bar-wrap">
                        <div class="progress-bar" style="width: ${pct}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${pct}${t('courses.pctComplete')}</span>
                        <span>${completed}/${totalLessons || 0} ${t('courses.lessonsCount')}</span>
                    </div>
                </div>
            </a>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

/* ----------------------------------------------------------
   COURSE DETAIL
   ---------------------------------------------------------- */
async function loadCourseDetail(container, params) {
    const courseId = params.get('id');
    if (!courseId) throw new Error('Course ID missing');

    const { data: course, error: cErr } = await sb
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
    if (cErr) throw cErr;

    const { data: lessons, error: lErr } = await sb
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });
    if (lErr) throw lErr;

    const { data: progress } = await sb
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('student_id', currentUser.id);

    const completedSet = new Set(progress?.filter(p => p.completed).map(p => p.lesson_id));

    let html = `
        <div class="course-header-banner">
            <a href="#courses" class="back-link">${t('course.backToCourses')}</a>
            <h1>${course.title}</h1>
            <p>${course.description || ''}</p>
        </div>
        
        <div class="lesson-list">
    `;

    if (lessons.length === 0) {
        html += `<p style="padding:2rem;color:var(--gray-500)">${t('course.noLessons')}</p>`;
    } else {
        lessons.forEach((lesson, index) => {
            const isCompleted = completedSet.has(lesson.id);
            html += `
                <a href="#lesson?id=${lesson.id}" class="lesson-item ${isCompleted ? 'completed' : ''}">
                    <div class="lesson-status-icon">${isCompleted ? '✓' : (index + 1)}</div>
                    <div class="lesson-info">
                        <div class="lesson-title">${lesson.title}</div>
                        <div class="lesson-meta">${lesson.duration_min ? lesson.duration_min + ' ' + t('lesson.min') : t('lesson.videoLesson')}</div>
                    </div>
                    <div class="lesson-arrow">→</div>
                </a>
            `;
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

/* ----------------------------------------------------------
   LESSON PLAYER
   ---------------------------------------------------------- */
async function loadLessonDetail(container, params) {
    const lessonId = params.get('id');
    if (!lessonId) throw new Error('Lesson ID missing');

    const { data: lesson, error: lErr } = await sb
        .from('lessons')
        .select('*, courses(id, title)')
        .eq('id', lessonId)
        .single();
    if (lErr) throw lErr;

    const { data: nextLesson } = await sb
        .from('lessons')
        .select('id')
        .eq('course_id', lesson.course_id)
        .gt('sort_order', lesson.sort_order)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

    const { data: prog } = await sb
        .from('lesson_progress')
        .select('completed')
        .eq('lesson_id', lessonId)
        .eq('student_id', currentUser.id)
        .single();

    const isCompleted = prog?.completed || false;

    let videoEmbed = '';
    if (lesson.video_url) {
        if (lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be')) {
            let vId = '';
            if (lesson.video_url.includes('v=')) vId = lesson.video_url.split('v=')[1].split('&')[0];
            else vId = lesson.video_url.split('/').pop();

            videoEmbed = `
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed/${vId}" frameborder="0" allowfullscreen></iframe>
                </div>
            `;
        } else {
            videoEmbed = `
                <div class="video-container">
                    <video src="${lesson.video_url}" controls></video>
                </div>
            `;
        }
    } else {
        videoEmbed = `<div style="padding:2rem;background:#eee;border-radius:var(--radius-lg);text-align:center;margin:1.5rem 0 2rem;">${t('lesson.noVideo')}</div>`;
    }

    container.innerHTML = `
        <div class="lesson-layout">
            <div class="lesson-header-nav">
                <a href="#course?id=${lesson.course_id}">${t('lesson.backTo')} ${lesson.courses?.title}</a>
            </div>
            
            <h1>${lesson.title}</h1>
            
            ${videoEmbed}
            
            <div class="lesson-content">
                ${lesson.description ? `<p class="lesson-desc">${lesson.description}</p>` : ''}
                ${lesson.content ? `<div class="rich-content" style="background:#fff;padding:1rem;border-radius:var(--radius-md);border:1px solid #eee;">${typeof lesson.content === 'string' ? lesson.content : JSON.stringify(lesson.content)}</div>` : ''} 
            </div>
            
            <div class="lesson-actions">
                <button class="btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}" 
                    id="btnMarkComplete" onclick="toggleLessonComplete('${lesson.id}', ${!isCompleted})">
                    ${isCompleted ? t('lesson.completed') : t('lesson.markComplete')}
                </button>
                
                ${nextLesson ? `<a href="#lesson?id=${nextLesson.id}" class="btn btn-outline">${t('lesson.nextLesson')}</a>` : ''}
            </div>
        </div>
    `;
}

window.toggleLessonComplete = async function (lessonId, setComplete) {
    const btn = document.getElementById('btnMarkComplete');
    btn.disabled = true;

    const { error } = await sb.from('lesson_progress').upsert({
        student_id: currentUser.id,
        lesson_id: lessonId,
        completed: setComplete,
        updated_at: new Date()
    }, { onConflict: 'student_id, lesson_id' });

    if (error) {
        showToast(t('toast.lessonFailed'), 'error');
        btn.disabled = false;
        return;
    }

    if (setComplete) {
        btn.className = 'btn btn-secondary';
        btn.innerHTML = t('lesson.completed');
        btn.onclick = () => toggleLessonComplete(lessonId, false);
        showToast(t('toast.lessonComplete'), 'success');
    } else {
        btn.className = 'btn btn-primary';
        btn.innerHTML = t('lesson.markComplete');
        btn.onclick = () => toggleLessonComplete(lessonId, true);
    }
    btn.disabled = false;
}

/* ----------------------------------------------------------
   ASSIGNMENTS
   ---------------------------------------------------------- */
async function loadAssignments(container) {
    container.innerHTML = `<div class="loading-state">${t('loading.assignments')}</div>`;

    // 1. Get enrollments to know which courses student is in
    const { data: enrollments, error: enErr } = await sb
        .from('enrollments')
        .select('course_id, cohort_id')
        .eq('student_id', currentUser.id)
        .eq('status', 'active');

    if (enErr) {
        container.innerHTML = `<div class="error">Error loading enrollments: ${enErr.message}</div>`;
        return;
    }

    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>${t('assign.noEnrollments')}</h3>
                <p>${t('assign.needEnrolled')}</p>
                <a href="#courses" class="btn btn-primary">${t('assign.browseCourses')}</a>
            </div>`;
        return;
    }

    // Combine direct course IDs and courses from cohorts
    const allCourseIds = new Set();
    const cohortIds = new Set();

    enrollments.forEach(e => {
        if (e.course_id) allCourseIds.add(e.course_id);
        if (e.cohort_id) cohortIds.add(e.cohort_id);
    });

    // Fetch courses for cohorts if any
    if (cohortIds.size > 0) {
        const { data: cohortCourses } = await sb
            .from('courses')
            .select('id')
            .in('cohort_id', Array.from(cohortIds));

        cohortCourses?.forEach(c => allCourseIds.add(c.id));
    }

    const courseIds = Array.from(allCourseIds);

    if (courseIds.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>${t('assign.noAssignments')}</h3>
                <p>${t('assign.noAssignmentsCourses')}</p>
            </div>`;
        return;
    }

    // 2. Get assignments for lessons in those courses
    const { data: lessons } = await sb
        .from('lessons')
        .select('id, title, course_id, courses(title)')
        .in('course_id', courseIds);

    const lessonIds = lessons?.map(l => l.id) || [];

    if (lessonIds.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>${t('assign.noAssignments')}</h3>
                <p>${t('assign.noAssignmentsCourses')}</p>
            </div>`;
        return;
    }

    // Now get assignments
    const { data: assignments, error: azErr } = await sb
        .from('assignments')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

    if (azErr) {
        container.innerHTML = `<div class="error">Error loading assignments: ${azErr.message}</div>`;
        return;
    }

    // Get submissions for these assignments
    const { data: submissions } = await sb
        .from('submissions')
        .select('*')
        .eq('student_id', currentUser.id)
        .in('assignment_id', assignments.map(a => a.id));

    const subMap = new Map();
    submissions?.forEach(s => subMap.set(s.assignment_id, s));

    // Render
    let html = `
        <div class="section-header">
            <h2>${t('assign.myAssignments')}</h2>
            <div class="filter-controls">
                <button class="filter-btn active" onclick="filterAssignments('all')">${t('assign.all')}</button>
                <button class="filter-btn" onclick="filterAssignments('pending')">${t('assign.pendingFilter')}</button>
                <button class="filter-btn" onclick="filterAssignments('submitted')">${t('assign.submitted')}</button>
                <button class="filter-btn" onclick="filterAssignments('graded')">${t('assign.graded')}</button>
            </div>
        </div>
        <div class="assignments-grid">
    `;

    if (assignments.length === 0) {
        html += `<p class="no-data">${t('assign.noFound')}</p>`;
    } else {
        for (const assign of assignments) {
            const lesson = lessons.find(l => l.id === assign.lesson_id);
            const sub = subMap.get(assign.id);
            const status = sub ? (sub.grade !== null ? 'graded' : 'submitted') : 'pending';
            const statusLabel = sub ? (sub.grade !== null ? `${t('assign.graded')}: ${sub.grade}/${assign.max_points}` : t('assign.submitted')) : t('assign.pendingFilter');
            const statusClass = sub ? (sub.grade !== null ? 'status-graded' : 'status-submitted') : 'status-pending';

            html += `
                <div class="assignment-card" data-status="${status}">
                    <div class="assign-header">
                        <span class="course-tag">${lesson?.courses?.title || 'Course'}</span>
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <h3 class="assign-title">${assign.title}</h3>
                    <p class="assign-lesson">${t('assign.lesson')}: ${lesson?.title}</p>
                    <div class="assign-meta">
                        <span>${t('assign.due')}: ${assign.due_offset_days ? `+${assign.due_offset_days} ${t('assign.dueOffset')}` : t('assign.noDeadline')}</span>
                        <span>${t('assign.maxPoints')}: ${assign.max_points}</span>
                    </div>
                    ${sub && sub.feedback ? `<div class="assign-feedback"><strong>${t('assign.feedback')}:</strong> ${sub.feedback}</div>` : ''}
                    <div class="assign-actions">
                        <button class="btn btn-sm btn-outline" onclick="viewAssignment('${assign.id}')">
                            ${sub ? t('assign.viewSubmission') : t('assign.startView')}
                        </button>
                    </div>
                </div>
            `;
        }
    }

    html += '</div>';
    container.innerHTML = html;

    // Attach filter logic
    window.filterAssignments = (filter) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.filter-btn[onclick="filterAssignments('${filter}')"]`).classList.add('active');

        document.querySelectorAll('.assignment-card').forEach(card => {
            if (filter === 'all' || card.dataset.status === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };
}

window.viewAssignment = function (id) {
    window.location.hash = `#assignment?id=${id}`;
}

/* ----------------------------------------------------------
   ASSIGNMENT DETAIL + SUBMISSION
   ---------------------------------------------------------- */
async function loadAssignmentDetail(container, params) {
    const assignId = params.get('id');
    if (!assignId) throw new Error('Assignment ID missing');

    container.innerHTML = `<div class="loading-state">${t('loading.assignment')}</div>`;

    // Fetch assignment
    const { data: assign, error: aErr } = await sb
        .from('assignments')
        .select('*, lessons(id, title, course_id, courses(title))')
        .eq('id', assignId)
        .single();
    if (aErr) throw aErr;

    // Fetch existing submission
    const { data: submission } = await sb
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignId)
        .eq('student_id', currentUser.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

    const isGraded = submission?.grade !== null && submission?.grade !== undefined;
    const hasSubmission = !!submission;

    // Build submission section
    let submissionHtml = '';

    if (hasSubmission) {
        const subDate = new Date(submission.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const subText = submission.content?.text || '';

        submissionHtml += `
            <div class="submission-section">
                <h3>${isGraded ? t('assign.gradedSubmission') : t('assign.yourSubmission')}</h3>
                <div class="existing-submission">
                    <div class="sub-label">${t('assign.submittedOn')} ${subDate}</div>
                    ${subText ? `<div class="sub-text">${subText}</div>` : `<div class="sub-text" style="color:var(--gray-400)">${t('assign.noTextContent')}</div>`}
                    ${submission.file_url ? `<div style="margin-top:0.75rem"><a href="#" onclick="downloadSubmissionFile('${submission.file_url}');return false" class="btn btn-sm btn-outline">${t('assign.downloadFile')}</a></div>` : ''}
                </div>`;

        if (isGraded) {
            const pct = Math.round((submission.grade / assign.max_points) * 100);
            const gradeClass = pct >= 70 ? 'good' : pct >= 50 ? 'ok' : 'bad';
            submissionHtml += `
                <div class="grade-display">
                    <div class="grade-circle ${gradeClass}">${pct}%</div>
                    <div class="grade-info">
                        <div class="grade-label">${t('assign.score')}</div>
                        <div class="grade-value">${submission.grade} / ${assign.max_points}</div>
                    </div>
                </div>`;
            if (submission.feedback) {
                submissionHtml += `
                    <div class="feedback-box">
                        <div class="fb-label">${t('assign.instructorFeedback')}</div>
                        <div class="fb-text">${submission.feedback}</div>
                    </div>`;
            }
        }
        submissionHtml += '</div>';
    }

    // Show submission form only if not graded
    if (!isGraded) {
        submissionHtml += `
            <div class="submission-section" style="margin-top:1.5rem">
                <h3>${hasSubmission ? t('assign.resubmit') : t('assign.submitWork')}</h3>
                <div class="submission-form">
                    <textarea id="submissionText" placeholder="${t('assign.textPlaceholder')}">${hasSubmission && submission.content?.text ? submission.content.text : ''}</textarea>
                    <div class="file-upload-area" onclick="document.getElementById('submissionFile').click()">
                        <div class="upload-icon">📁</div>
                        <p id="fileLabel">${t('assign.uploadFile')}</p>
                    </div>
                    <input type="file" id="submissionFile" style="display:none" onchange="document.getElementById('fileLabel').innerHTML='<span class=file-name>'+this.files[0].name+'</span>'">
                    <div class="submission-form-actions">
                        <a href="#assignments" class="btn btn-outline">${t('assign.back')}</a>
                        <button class="btn btn-primary" style="padding:0.6rem 1.5rem" onclick="handleSubmit('${assign.id}')">
                            ${hasSubmission ? t('assign.resubmitBtn') : t('assign.submitBtn')}
                        </button>
                    </div>
                </div>
            </div>`;
    }

    container.innerHTML = `
        <div class="assignment-detail">
            <a href="#assignments" class="back-link">${t('assign.backToAssignments')}</a>
            <div class="assignment-desc">
                <h2>${assign.title}</h2>
                ${assign.description ? `<p style="color:var(--gray-600);line-height:1.6">${assign.description}</p>` : ''}
                <div class="assignment-info-row">
                    <span>📚 ${assign.lessons?.courses?.title || 'Course'}</span>
                    <span>📖 ${t('assign.lesson')}: ${assign.lessons?.title || 'N/A'}</span>
                    <span>🏆 ${t('assign.maxPoints')}: ${assign.max_points}</span>
                    <span>📅 ${t('assign.due')}: ${assign.due_offset_days ? `+${assign.due_offset_days} ${t('assign.dueOffset')}` : t('assign.noDeadline')}</span>
                </div>
            </div>
            ${submissionHtml}
        </div>
    `;
}

window.handleSubmit = async function (assignmentId) {
    const text = document.getElementById('submissionText').value;
    const fileInput = document.getElementById('submissionFile');
    const file = fileInput?.files?.[0] || null;

    if (!text.trim() && !file) {
        showToast(t('toast.submitEmpty'), 'error');
        return;
    }

    try {
        showToast(t('toast.submitting'), 'info');
        await window.submitAssignment(assignmentId, { text, file });
        showToast(t('toast.submitted'), 'success');
        // Reload assignment detail
        window.location.hash = `#assignment?id=${assignmentId}`;
        handleRoute();
    } catch (err) {
        console.error('Submission error:', err);
        showToast(t('toast.submitFailed') + ': ' + err.message, 'error');
    }
}

window.downloadSubmissionFile = async function (filePath) {
    try {
        const url = await window.getSubmissionFileUrl(filePath);
        window.open(url, '_blank');
    } catch (err) {
        showToast(t('toast.downloadFailed') + ': ' + err.message, 'error');
    }
}

/* ----------------------------------------------------------
   ACHIEVEMENTS
   ---------------------------------------------------------- */
async function loadAchievements(container) {
    container.innerHTML = `<div class="loading-state">${t('loading.achievements')}</div>`;

    const { data: diplomas, error } = await sb
        .from('diplomas')
        .select(`
            *,
            cohorts ( name )
        `)
        .eq('student_id', currentUser.id)
        .order('issued_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        return;
    }

    if (!diplomas || diplomas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏆</div>
                <h3>${t('achieve.noAchievements')}</h3>
                <p>${t('achieve.completeToEarn')}</p>
                <a href="#courses" class="btn btn-primary">${t('achieve.goToCourses')}</a>
            </div>
        `;
        return;
    }

    let html = `
        <div class="page-header">
            <h2>${t('achieve.myAchievements')}</h2>
            <p class="subtitle">${t('achieve.subtitle')}</p>
        </div>
        <div class="achievements-grid">
    `;

    for (const d of diplomas) {
        const dateStr = new Date(d.issued_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        html += `
            <div class="achievement-card">
                <div class="achievement-badge-icon">
                    <span>🎓</span>
                </div>
                <div class="achievement-content">
                    <h3>${t('achieve.diplomaTitle')}</h3>
                    <div class="achievement-meta">
                        <span class="cohort-name">${d.cohorts?.name || 'Web Genius Academy'}</span>
                        <span class="issue-date">${t('achieve.issued')}: ${dateStr}</span>
                    </div>
                    
                    ${d.final_grade
                ? `<div class="grade-badge">${t('achieve.finalGrade')}: <strong>${d.final_grade}%</strong></div>`
                : ''}

                    <div class="achievement-actions">
                        ${d.certificate_url
                ? `<a href="${d.certificate_url}" target="_blank" class="btn btn-sm btn-primary download-btn">
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                 </svg>
                                 ${t('achieve.downloadCert')}
                               </a>`
                : `<span class="disabled-text">${t('achieve.certPending')}</span>`}
                    </div>
                </div>
                <div class="decorative-circle"></div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

/* ----------------------------------------------------------
   PROFILE
   ---------------------------------------------------------- */
async function loadProfile(container) {
    const avatarUrl = userProfile?.avatar_url || null;
    const initials = (userProfile?.full_name || currentUser.email || 'U').charAt(0).toUpperCase();

    // Setup avatar preview logic
    window.previewAvatar = function (input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                const img = document.getElementById('profileAvatarImg');
                const placeholder = document.getElementById('profileAvatarPlaceholder');

                if (img) {
                    img.src = e.target.result;
                } else if (placeholder) {
                    // Replace placeholder with img
                    const newImg = document.createElement('img');
                    newImg.src = e.target.result;
                    newImg.id = 'profileAvatarImg';
                    newImg.className = 'profile-avatar-img';
                    newImg.alt = 'Profile';
                    placeholder.parentNode.replaceChild(newImg, placeholder);
                }
            }
            reader.readAsDataURL(input.files[0]);

            // Auto-upload
            window.uploadAvatar(input);
        }
    }

    container.innerHTML = `
        <div class="page-header">
            <h2>${t('profile.title')}</h2>
            <p class="subtitle">${t('profile.subtitle')}</p>
        </div>

        <div class="profile-layout">
            <div class="profile-card">
                <div class="profile-header-section">
                     <div class="avatar-upload-container">
                        <div class="avatar-wrapper">
                            ${avatarUrl
            ? `<img src="${avatarUrl}" class="profile-avatar-img" id="profileAvatarImg" alt="Profile">`
            : `<div class="profile-avatar-placeholder" id="profileAvatarPlaceholder">${initials}</div>`
        }
                            <label for="avatarInput" class="avatar-overlay">
                                <span class="overlay-icon">📷</span>
                                <span class="overlay-text">${t('profile.changePhoto')}</span>
                            </label>
                        </div>
                        <input type="file" id="avatarInput" accept="image/*" style="display:none" onchange="previewAvatar(this)">
                    </div>
                
                    <div class="profile-title-block">
                        <h3 id="displayFullName">${userProfile?.full_name || 'Student'}</h3>
                        <span class="role-badge">${t('profile.studentAccount')}</span>
                    </div>
                </div>

                <form id="profileForm" class="profile-form">
                    <div class="form-row">
                        <div class="form-group half">
                            <label>${t('profile.fullName')}</label>
                            <input type="text" id="pName" value="${userProfile?.full_name || ''}" class="form-input" placeholder="${t('profile.namePlaceholder')}">
                        </div>
                        <div class="form-group half">
                            <label>${t('profile.email')}</label>
                            <input type="email" value="${currentUser.email}" disabled class="form-input disabled" title="${t('profile.emailHint')}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>${t('profile.timezone')}</label>
                        <div class="select-wrapper">
                            <select id="pTimezone" class="form-input">
                                <option value="UTC" ${userProfile?.timezone === 'UTC' ? 'selected' : ''}>UTC (Coordinated Universal Time)</option>
                                <option value="America/New_York" ${userProfile?.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time (US & Canada)</option>
                                <option value="Europe/London" ${userProfile?.timezone === 'Europe/London' ? 'selected' : ''}>London (UK)</option>
                                <option value="Europe/Vilnius" ${userProfile?.timezone === 'Europe/Vilnius' ? 'selected' : ''}>Vilnius (Lithuania)</option>
                                <option value="Europe/Berlin" ${userProfile?.timezone === 'Europe/Berlin' ? 'selected' : ''}>Berlin (Germany)</option>
                            </select>
                        </div>
                        <small class="form-hint">${t('profile.timezoneHint')}</small>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-primary" type="button" onclick="updateProfile()">${t('profile.saveChanges')}</button>
                    </div>
                </form>

                <div class="password-section">
                    <h4>${t('profile.changePassword')}</h4>
                    <div class="form-row">
                        <div class="form-group" style="flex:1">
                            <label>${t('profile.newPassword')}</label>
                            <input type="password" id="newPassword" class="form-input" placeholder="${t('profile.newPasswordPlaceholder')}">
                        </div>
                        <div class="form-group" style="flex:1">
                            <label>${t('profile.confirmPassword')}</label>
                            <input type="password" id="confirmPassword" class="form-input" placeholder="${t('profile.confirmPasswordPlaceholder')}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" type="button" onclick="changePassword()">${t('profile.updatePassword')}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.uploadAvatar = async function (input) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showToast(t('toast.photoSize'), 'error');
        return;
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await sb.storage
            .from('avatars')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = sb.storage
            .from('avatars')
            .getPublicUrl(fileName);

        const { error: updateError } = await sb
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', currentUser.id);

        if (updateError) throw updateError;

        userProfile.avatar_url = publicUrl;
        showToast(t('toast.photoUpdated'), 'success');

    } catch (error) {
        console.error('Error uploading avatar:', error);
        showToast(t('toast.photoError') + ': ' + error.message, 'error');
    }
}

window.updateProfile = async function () {
    const newName = document.getElementById('pName').value;
    const newTimezone = document.getElementById('pTimezone').value;

    const { error } = await sb
        .from('profiles')
        .update({
            full_name: newName,
            timezone: newTimezone,
            updated_at: new Date()
        })
        .eq('id', currentUser.id);

    if (error) {
        showToast(t('toast.profileError') + ': ' + error.message, 'error');
    } else {
        showToast(t('toast.profileUpdated'), 'success');
        userProfile.full_name = newName;
        userProfile.timezone = newTimezone;

        document.getElementById('userName').textContent = newName;
        document.getElementById('displayFullName').textContent = newName;

        if (!userProfile.avatar_url) {
            document.getElementById('userAvatar').textContent = newName.charAt(0).toUpperCase();
        }
    }
}

window.changePassword = async function () {
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (!newPass || newPass.length < 6) {
        showToast(t('toast.passwordLength'), 'error');
        return;
    }
    if (newPass !== confirmPass) {
        showToast(t('toast.passwordMismatch'), 'error');
        return;
    }

    try {
        const { error } = await sb.auth.updateUser({ password: newPass });
        if (error) throw error;
        showToast(t('toast.passwordChanged'), 'success');
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } catch (err) {
        showToast(t('toast.passwordFailed') + ': ' + err.message, 'error');
    }
}

/* -------------------------------------------------------------
   SCHEDULE (CALENDAR VIEW)
   ------------------------------------------------------------- */
let scheduleCache = [];
let currentCalendarDate = new Date();

async function loadSchedule(container) {
    // state.currentPage = 'schedule'; // Not used in student.js structure

    container.innerHTML = `
    <div class="header-row">
      <h2 data-i18n="schedule.title">Class Schedule</h2>
    </div>
    <div class="schedule-container">
      <div class="calendar-controls">
        <button class="btn-icon" onclick="changeMonth(-1)">‹</button>
        <h3 id="calendarMonthLabel">Month Year</h3>
        <button class="btn-icon" onclick="changeMonth(1)">›</button>
        <button class="btn-sm btn-secondary" onclick="jumpToToday()" data-i18n="schedule.today">Today</button>
      </div>
      
      <div class="calendar-grid-header">
        <div data-i18n="days.mon">Mon</div>
        <div data-i18n="days.tue">Tue</div>
        <div data-i18n="days.wed">Wed</div>
        <div data-i18n="days.thu">Thu</div>
        <div data-i18n="days.fri">Fri</div>
        <div data-i18n="days.sat">Sat</div>
        <div data-i18n="days.sun">Sun</div>
      </div>
      <div id="calendarGrid" class="calendar-grid">
        <!-- Days injected here -->
      </div>
      
      <div id="selectedDaySessions" class="sessions-list">
        <div class="empty-state" style="padding:1rem">Select a day to view sessions.</div>
      </div>
    </div>
  `;

    // Fetch sessions for student's enrolled cohorts
    // 1. Get my cohorts
    // 1. Get my cohorts
    const { data: enrollments } = await sb.from('enrollments')
        .select('cohort_id')
        .eq('student_id', currentUser.id)
        .eq('status', 'active');


    if (enrollments && enrollments.length > 0) {
        const cohortIds = enrollments.map(e => e.cohort_id);

        // 2. Fetch sessions
        const { data: sessions, error } = await sb
            .from('scheduled_sessions')
            .select('*, cohorts(name), lessons(title)')
            .in('cohort_id', cohortIds)
            .neq('status', 'cancelled') // Filter cancelled? Or show them crossed out? Let's hide for now.
            .order('start_time');


        if (!error) scheduleCache = sessions || [];
    } else {
        scheduleCache = [];
    }

    renderCalendar();
    // Select today if it has sessions, otherwise do nothing
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

    // Update header using i18n
    const currentLang = document.documentElement.lang || 'en';
    const monthName = new Date(year, month).toLocaleString(currentLang === 'lt' ? 'lt-LT' : 'en-US', { month: 'long', year: 'numeric' });

    monthLabel.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Calendar logic
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Adjust for Monday start (0=Sun, 1=Mon) -> we want 0=Mon, 6=Sun
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    let html = '';

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = new Date(year, month, d + 1).toISOString().slice(0, 10);
        // ^ +1 because Date constructor is local but ISO is UTC. 
        // Actually safer:
        const localDate = new Date(year, month, d);
        const yyyy = localDate.getFullYear();
        const mm = String(localDate.getMonth() + 1).padStart(2, '0');
        const dd = String(localDate.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;

        // Check sessions
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
    // Highlight selected in UI
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
    // Find the element? Hard without ID. Re-render might be overkill.
    // Let's just render the list.

    const list = document.getElementById('selectedDaySessions');
    const daySessions = scheduleCache.filter(s => s.start_time.startsWith(dateStr));

    const dateObj = new Date(dateStr);
    const currentLang = document.documentElement.lang || 'en';
    const niceDate = dateObj.toLocaleDateString(currentLang === 'lt' ? 'lt-LT' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });


    if (daySessions.length === 0) {
        list.innerHTML = `
      <div style="margin-bottom:1rem;font-weight:600;color:var(--gray-500)">${niceDate}</div>
      <div class="empty-state" data-i18n="schedule.noSessions">No sessions scheduled for this day.</div>
    `;
    } else {
        list.innerHTML = `
      <div style="margin-bottom:1rem;font-weight:600;color:var(--gray-900)">${niceDate}</div>
      ${daySessions.map(s => {
            const start = new Date(s.start_time);
            const end = new Date(s.end_time);
            const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            return `
          <div class="session-card">
            <div class="session-time">${timeStr}</div>
            <div class="session-info">
              <div class="session-title">${esc(s.title)}</div>
              ${s.lessons?.title ? `<div class="session-lesson">${esc(s.lessons.title)}</div>` : ''}
              ${s.description ? `<div class="session-desc">${esc(s.description)}</div>` : ''}
            </div>
            ${s.meeting_url
                    ? `<a href="${esc(s.meeting_url)}" target="_blank" class="btn btn-primary btn-sm" data-i18n="schedule.join">Join</a>`
                    : `<button disabled class="btn btn-secondary btn-sm" data-i18n="schedule.noLink">No Link</button>`}
          </div>
        `;
        }).join('')}
    `;
    }

    updateTranslations(); // Translate the dynamic content
};
