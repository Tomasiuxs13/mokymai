/* ============================================================
   Student Portal — i18n (Internationalization)
   Auto-detects language from userProfile.locale
   ============================================================ */

const studentI18n = {
    en: {
        // Sidebar nav
        'nav.main': 'Main',
        'nav.dashboard': 'Dashboard',
        'nav.myCourses': 'My Courses',
        'nav.learning': 'Learning',
        'nav.assignments': 'Assignments',
        'nav.schedule': 'Schedule',
        'nav.achievements': 'Achievements',
        'nav.account': 'Account',
        'nav.profile': 'Profile',
        'nav.signOut': 'Sign Out',
        'nav.viewSite': 'View Site ↗',

        // Page titles
        'title.dashboard': 'Dashboard',
        'title.courses': 'My Courses',
        'title.courseDetail': 'Course Details',
        'title.lesson': 'Lesson View',
        'title.assignments': 'Assignments',
        'title.schedule': 'Class Schedule',
        'title.achievements': 'Achievements',
        'title.profile': 'My Profile',

        // Dashboard
        'dash.activeCourses': 'Active Courses',
        'dash.lessonsCompleted': 'Lessons Completed',
        'dash.pendingAssignments': 'Pending Assignments',
        'dash.diplomasEarned': 'Diplomas Earned',
        'dash.continueLearning': '📖 Continue Learning',
        'dash.complete': 'complete',
        'dash.lessons': 'lessons',
        'dash.announcements': '📢 Announcements',
        'dash.noAnnouncements': 'No announcements at this time.',
        'dash.quickLinks': '⚡ Quick Links',
        'dash.viewAllCourses': 'View all enrolled courses',
        'dash.pending': 'pending',
        'dash.diploma': 'diploma',
        'dash.diplomas': 'diplomas',

        // Loading
        'loading': 'Loading...',
        'loading.dashboard': 'Loading dashboard...',
        'loading.courses': 'Loading your courses...',
        'loading.assignments': 'Loading assignments...',
        'loading.achievements': 'Loading achievements...',
        'loading.assignment': 'Loading assignment...',

        // Courses
        'courses.noCourses': 'No active courses found.',
        'courses.notEnrolled': 'You are not enrolled in any courses yet.',
        'courses.browsePrograms': 'Browse Programs',
        'courses.pctComplete': '% Complete',
        'courses.lessonsCount': 'Lessons',

        // Course detail
        'course.backToCourses': '← Back to Courses',
        'course.noLessons': 'No lessons available yet.',

        // Lesson
        'lesson.backTo': '← Back to',
        'lesson.noVideo': 'No video content',
        'lesson.markComplete': 'Mark as Complete',
        'lesson.completed': '✓ Completed',
        'lesson.nextLesson': 'Next Lesson →',
        'lesson.videoLesson': 'Video Lesson',
        'lesson.min': 'min',

        // Assignments
        'assign.myAssignments': 'My Assignments',
        'assign.all': 'All',
        'assign.pendingFilter': 'Pending',
        'assign.submitted': 'Submitted',
        'assign.graded': 'Graded',
        'assign.noEnrollments': 'No Active Enrollments',
        'assign.needEnrolled': 'You need to be enrolled in a course to see assignments.',
        'assign.browseCourses': 'Browse Courses',
        'assign.noAssignments': 'No Assignments Yet',
        'assign.noAssignmentsCourses': "Your courses don't have any assignments at the moment.",
        'assign.noFound': 'No assignments found.',
        'assign.lesson': 'Lesson',
        'assign.due': 'Due',
        'assign.dueOffset': 'days',
        'assign.noDeadline': 'No deadline',
        'assign.maxPoints': 'Max Points',
        'assign.feedback': 'Feedback',
        'assign.viewSubmission': 'View Submission',
        'assign.startView': 'Start/View Assignment',
        'assign.backToAssignments': '← Back to Assignments',
        'assign.gradedSubmission': '✅ Graded Submission',
        'assign.yourSubmission': '📤 Your Submission',
        'assign.submittedOn': 'Submitted',
        'assign.noTextContent': 'No text content submitted.',
        'assign.downloadFile': '📎 Download Attached File',
        'assign.score': 'Score',
        'assign.instructorFeedback': 'Instructor Feedback',
        'assign.resubmit': '🔄 Resubmit',
        'assign.submitWork': '📥 Submit Your Work',
        'assign.textPlaceholder': 'Write your answer or notes here...',
        'assign.uploadFile': 'Click to upload a file (optional)',
        'assign.back': '← Back',
        'assign.resubmitBtn': 'Resubmit',
        'assign.submitBtn': 'Submit Assignment',

        // Schedule
        'schedule.title': 'Class Schedule',
        'schedule.today': 'Today',
        'schedule.noSessions': 'No sessions scheduled for this day.',
        'schedule.join': 'Join Class',
        'schedule.noLink': 'No Link',
        'days.mon': 'Mon',
        'days.tue': 'Tue',
        'days.wed': 'Wed',
        'days.thu': 'Thu',
        'days.fri': 'Fri',
        'days.sat': 'Sat',
        'days.sun': 'Sun',

        // Achievements
        'achieve.noAchievements': 'No Achievements Yet',
        'achieve.completeToEarn': 'Complete courses to earn diplomas and badges!',
        'achieve.goToCourses': 'Go to Courses',
        'achieve.myAchievements': 'My Achievements',
        'achieve.subtitle': 'Certificates and badges earned from your courses.',
        'achieve.diplomaTitle': 'Diploma of Completion',
        'achieve.issued': 'Issued',
        'achieve.finalGrade': 'Final Grade',
        'achieve.downloadCert': 'Download Certificate',
        'achieve.certPending': 'Certificate Pending',

        // Profile
        'profile.title': 'My Profile',
        'profile.subtitle': 'Manage your account settings and preferences.',
        'profile.studentAccount': 'Student Account',
        'profile.fullName': 'Full Name',
        'profile.namePlaceholder': 'Enter your full name',
        'profile.email': 'Email Address',
        'profile.emailHint': 'Contact support to change email',
        'profile.timezone': 'Timezone',
        'profile.timezoneHint': 'Used for live class schedules and assignment deadlines.',
        'profile.saveChanges': 'Save Changes',
        'profile.changePassword': '🔒 Change Password',
        'profile.newPassword': 'New Password',
        'profile.newPasswordPlaceholder': 'Min. 6 characters',
        'profile.confirmPassword': 'Confirm Password',
        'profile.confirmPasswordPlaceholder': 'Re-enter password',
        'profile.updatePassword': 'Update Password',
        'profile.changePhoto': 'Change Photo',

        // Toasts
        'toast.profileUpdated': 'Profile updated successfully!',
        'toast.profileError': 'Error updating profile',
        'toast.passwordChanged': 'Password changed successfully!',
        'toast.passwordFailed': 'Failed to change password',
        'toast.passwordLength': 'Password must be at least 6 characters.',
        'toast.passwordMismatch': 'Passwords do not match.',
        'toast.photoUpdated': 'Profile photo updated!',
        'toast.photoError': 'Error uploading avatar',
        'toast.photoSize': 'File size must be less than 2MB',
        'toast.lessonComplete': 'Lesson marked as complete!',
        'toast.lessonFailed': 'Failed to update progress',
        'toast.submitting': 'Submitting...',
        'toast.submitted': 'Assignment submitted successfully!',
        'toast.submitFailed': 'Failed to submit',
        'toast.submitEmpty': 'Please enter text or upload a file.',
        'toast.downloadFailed': 'Failed to download file',

        // Page title suffix
        'pageTitle': 'Student Dashboard — Web Genius',
    },

    lt: {
        // Sidebar nav
        'nav.main': 'Pagrindinis',
        'nav.dashboard': 'Apžvalga',
        'nav.myCourses': 'Mano kursai',
        'nav.learning': 'Mokymasis',
        'nav.assignments': 'Užduotys',
        'nav.schedule': 'Tvarkaraštis',
        'nav.achievements': 'Pasiekimai',
        'nav.account': 'Paskyra',
        'nav.profile': 'Profilis',
        'nav.signOut': 'Atsijungti',
        'nav.viewSite': 'Svetainė ↗',

        // Page titles
        'title.dashboard': 'Apžvalga',
        'title.courses': 'Mano kursai',
        'title.courseDetail': 'Kurso informacija',
        'title.lesson': 'Pamoka',
        'title.assignments': 'Užduotys',
        'title.schedule': 'Tvarkaraštis',
        'title.achievements': 'Pasiekimai',
        'title.profile': 'Mano profilis',

        // Dashboard
        'dash.activeCourses': 'Aktyvūs kursai',
        'dash.lessonsCompleted': 'Baigtos pamokos',
        'dash.pendingAssignments': 'Laukiančios užduotys',
        'dash.diplomasEarned': 'Gauti diplomai',
        'dash.continueLearning': '📖 Tęsti mokymąsi',
        'dash.complete': 'baigta',
        'dash.lessons': 'pamokos',
        'dash.announcements': '📢 Pranešimai',
        'dash.noAnnouncements': 'Šiuo metu pranešimų nėra.',
        'dash.quickLinks': '⚡ Greitos nuorodos',
        'dash.viewAllCourses': 'Peržiūrėti visus kursus',
        'dash.pending': 'laukia',
        'dash.diploma': 'diplomas',
        'dash.diplomas': 'diplomai',

        // Loading
        'loading': 'Kraunama...',
        'loading.dashboard': 'Kraunama apžvalga...',
        'loading.courses': 'Kraunami kursai...',
        'loading.assignments': 'Kraunamos užduotys...',
        'loading.achievements': 'Kraunami pasiekimai...',
        'loading.assignment': 'Kraunama užduotis...',

        // Courses
        'courses.noCourses': 'Aktyvių kursų nerasta.',
        'courses.notEnrolled': 'Jūs dar nesate užsiregistravę į jokius kursus.',
        'courses.browsePrograms': 'Naršyti programas',
        'courses.pctComplete': '% baigta',
        'courses.lessonsCount': 'Pamokos',

        // Course detail
        'course.backToCourses': '← Grįžti į kursus',
        'course.noLessons': 'Pamokų kol kas nėra.',

        // Lesson
        'lesson.backTo': '← Grįžti į',
        'lesson.noVideo': 'Vaizdo įrašo nėra',
        'lesson.markComplete': 'Pažymėti kaip baigtą',
        'lesson.completed': '✓ Baigta',
        'lesson.nextLesson': 'Kita pamoka →',
        'lesson.videoLesson': 'Vaizdo pamoka',
        'lesson.min': 'min',

        // Assignments
        'assign.myAssignments': 'Mano užduotys',
        'assign.all': 'Visos',
        'assign.pendingFilter': 'Laukiančios',
        'assign.submitted': 'Pateiktos',
        'assign.graded': 'Įvertintos',
        'assign.noEnrollments': 'Nėra aktyvių registracijų',
        'assign.needEnrolled': 'Norėdami matyti užduotis, turite būti užsiregistravę į kursą.',
        'assign.browseCourses': 'Naršyti kursus',
        'assign.noAssignments': 'Užduočių dar nėra',
        'assign.noAssignmentsCourses': 'Jūsų kursuose šiuo metu nėra užduočių.',
        'assign.noFound': 'Užduočių nerasta.',
        'assign.lesson': 'Pamoka',
        'assign.due': 'Terminas',
        'assign.dueOffset': 'dienos',
        'assign.noDeadline': 'Be termino',
        'assign.maxPoints': 'Maks. taškai',
        'assign.feedback': 'Atsiliepimas',
        'assign.viewSubmission': 'Peržiūrėti pateikimą',
        'assign.startView': 'Pradėti / peržiūrėti užduotį',
        'assign.backToAssignments': '← Grįžti į užduotis',
        'assign.gradedSubmission': '✅ Įvertintas pateikimas',
        'assign.yourSubmission': '📤 Jūsų pateikimas',
        'assign.submittedOn': 'Pateikta',
        'assign.noTextContent': 'Tekstas nepateiktas.',
        'assign.downloadFile': '📎 Atsisiųsti priedą',
        'assign.score': 'Balas',
        'assign.instructorFeedback': 'Dėstytojo atsiliepimas',
        'assign.resubmit': '🔄 Pateikti iš naujo',
        'assign.submitWork': '📥 Pateikti darbą',
        'assign.textPlaceholder': 'Rašykite atsakymą arba pastabas čia...',
        'assign.uploadFile': 'Spustelėkite, norėdami įkelti failą (neprivaloma)',
        'assign.back': '← Atgal',
        'assign.resubmitBtn': 'Pateikti iš naujo',
        'assign.submitBtn': 'Pateikti užduotį',

        // Schedule
        'schedule.title': 'Pamokų Tvarkaraštis',
        'schedule.today': 'Šiandien',
        'schedule.noSessions': 'Šiai dienai pamokų nėra.',
        'schedule.join': 'Prisijungti',
        'schedule.noLink': 'Nuorodos nėra',
        'days.mon': 'Pir',
        'days.tue': 'Ant',
        'days.wed': 'Tre',
        'days.thu': 'Ket',
        'days.fri': 'Pen',
        'days.sat': 'Šeš',
        'days.sun': 'Sek',

        // Achievements
        'achieve.noAchievements': 'Pasiekimų dar nėra',
        'achieve.completeToEarn': 'Baigkite kursus, kad gautumėte diplomus!',
        'achieve.goToCourses': 'Eiti į kursus',
        'achieve.myAchievements': 'Mano pasiekimai',
        'achieve.subtitle': 'Sertifikatai ir ženkleliai, gauti už kursus.',
        'achieve.diplomaTitle': 'Baigimo diplomas',
        'achieve.issued': 'Išduotas',
        'achieve.finalGrade': 'Galutinis pažymys',
        'achieve.downloadCert': 'Atsisiųsti sertifikatą',
        'achieve.certPending': 'Sertifikatas ruošiamas',

        // Profile
        'profile.title': 'Mano profilis',
        'profile.subtitle': 'Tvarkykite savo paskyros nustatymus ir parinktis.',
        'profile.studentAccount': 'Mokinio paskyra',
        'profile.fullName': 'Vardas ir pavardė',
        'profile.namePlaceholder': 'Įveskite savo vardą',
        'profile.email': 'El. pašto adresas',
        'profile.emailHint': 'Susisiekite su palaikymu, norėdami pakeisti el. paštą',
        'profile.timezone': 'Laiko juosta',
        'profile.timezoneHint': 'Naudojama gyvų pamokų tvarkaraščiui.',
        'profile.saveChanges': 'Išsaugoti pakeitimus',
        'profile.changePassword': '🔒 Keisti slaptažodį',
        'profile.newPassword': 'Naujas slaptažodis',
        'profile.newPasswordPlaceholder': 'Min. 6 simboliai',
        'profile.confirmPassword': 'Pakartokite slaptažodį',
        'profile.confirmPasswordPlaceholder': 'Įveskite slaptažodį dar kartą',
        'profile.updatePassword': 'Atnaujinti slaptažodį',
        'profile.changePhoto': 'Keisti nuotrauką',

        // Toasts
        'toast.profileUpdated': 'Profilis atnaujintas!',
        'toast.profileError': 'Klaida atnaujinant profilį',
        'toast.passwordChanged': 'Slaptažodis pakeistas!',
        'toast.passwordFailed': 'Nepavyko pakeisti slaptažodžio',
        'toast.passwordLength': 'Slaptažodis turi būti bent 6 simbolių.',
        'toast.passwordMismatch': 'Slaptažodžiai nesutampa.',
        'toast.photoUpdated': 'Profilio nuotrauka atnaujinta!',
        'toast.photoError': 'Klaida įkeliant nuotrauką',
        'toast.photoSize': 'Failas turi būti mažesnis nei 2MB',
        'toast.lessonComplete': 'Pamoka pažymėta kaip baigta!',
        'toast.lessonFailed': 'Nepavyko atnaujinti progreso',
        'toast.submitting': 'Pateikiama...',
        'toast.submitted': 'Užduotis pateikta sėkmingai!',
        'toast.submitFailed': 'Nepavyko pateikti',
        'toast.submitEmpty': 'Įveskite tekstą arba įkelkite failą.',
        'toast.downloadFailed': 'Nepavyko atsisiųsti failo',

        // Page title suffix
        'pageTitle': 'Mokinio skydelis — Web Genius',
    }
};

// Current language
let _studentLang = 'en';

/**
 * Initialize language — call after userProfile is loaded
 */
function initStudentLang(locale) {
    _studentLang = (locale === 'lt') ? 'lt' : 'en';
    document.documentElement.lang = _studentLang;
    document.title = t('pageTitle');
    localStorage.setItem('wg_lang', _studentLang);
    translateStaticUI();
}

/**
 * Translate a key
 */
function t(key) {
    return studentI18n[_studentLang]?.[key] || studentI18n.en[key] || key;
}

/**
 * Scan document for data-i18n and update text
 */
function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    translateStaticUI();
}


/**
 * Translate static sidebar and topbar elements
 */
function translateStaticUI() {
    // Sidebar nav labels
    const navLabels = document.querySelectorAll('.nav-section-label');
    if (navLabels.length >= 3) {
        navLabels[0].textContent = t('nav.main');
        navLabels[1].textContent = t('nav.learning');
        navLabels[2].textContent = t('nav.account');
    }

    // Sidebar nav links by data-section
    const navMap = {
        dashboard: 'nav.dashboard',
        courses: 'nav.myCourses',
        assignments: 'nav.assignments',
        schedule: 'nav.schedule',
        achievements: 'nav.achievements',
        profile: 'nav.profile',
    };
    document.querySelectorAll('.sidebar-nav a[data-section]').forEach(a => {
        const section = a.dataset.section;
        if (navMap[section]) {
            const icon = a.querySelector('.nav-icon');
            const iconHtml = icon ? icon.outerHTML : '';
            a.innerHTML = iconHtml + ' ' + t(navMap[section]);
        }
    });

    // Sign out button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.textContent = t('nav.signOut');

    // Role label
    const roleLabel = document.querySelector('.sidebar-footer .admin-role');
    if (roleLabel) roleLabel.textContent = _studentLang === 'lt' ? 'Mokinys' : 'Student';

    // View Site link
    const viewSiteLink = document.querySelector('.topbar-actions .btn-sm');
    if (viewSiteLink) viewSiteLink.textContent = t('nav.viewSite');
}
