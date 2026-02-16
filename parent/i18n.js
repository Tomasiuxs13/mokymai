/* ============================================================
   Parent Portal — i18n (Internationalization)
   Auto-detects language from userProfile.locale
   ============================================================ */

const parentI18n = {
    en: {
        // Sidebar nav
        'nav.overview': 'Overview',
        'nav.dashboard': 'Dashboard',
        'nav.myChildren': 'My Children',
        'nav.children': 'Children',
        'nav.courseProgress': 'Course Progress',
        'nav.assignments': 'Assignments',
        'nav.schedule': 'Schedule',
        'nav.achievements': 'Achievements',
        'nav.account': 'Account',
        'nav.profile': 'Profile',
        'nav.signOut': 'Sign Out',
        'nav.viewSite': 'View Site ↗',

        // Page titles
        'title.dashboard': 'Dashboard',
        'title.children': 'My Children',
        'title.courses': 'Course Progress',
        'title.assignments': 'Assignments',
        'title.schedule': 'Class Schedule',
        'title.achievements': 'Achievements',
        'title.profile': 'My Profile',

        // Loading
        'loading': 'Loading...',

        // Child switcher
        'switcher.allChildren': 'All Children',

        // Dashboard
        'dash.children': 'Children',
        'dash.activeCourses': 'Active Courses',
        'dash.lessonsCompleted': 'Lessons Completed',
        'dash.pendingAssignments': 'Pending Assignments',
        'dash.diplomasEarned': 'Diplomas Earned',
        'dash.noChildrenLinked': 'No Children Linked',
        'dash.noChildrenDesc': "Your account doesn't have any linked students yet. Please contact the administrator to link your child's account.",
        'dash.announcements': '📢 Announcements',
        'dash.noAnnouncements': 'No announcements at this time.',
        'dash.quickLinks': '⚡ Quick Links',
        'dash.linked': 'linked',
        'dash.trackLearning': 'Track learning',
        'dash.pending': 'pending',

        // Children section
        'children.title': 'My Children',
        'children.noLinked': 'No Children Linked',
        'children.contactAdmin': "Contact the administrator to link your child's account to your parent profile.",
        'children.joined': 'Joined',
        'children.courses': 'Courses',
        'children.lessonsDone': 'Lessons Done',
        'children.diplomas': 'Diplomas',

        // Course progress
        'courses.noChildrenLinked': 'No Children Linked',
        'courses.noActiveCourses': 'No Active Courses',
        'courses.notEnrolledSingle': 'Your child is not enrolled in any courses yet.',
        'courses.notEnrolledMulti': 'Your children are not enrolled in any courses yet.',
        'courses.progressTitle': 'Course Progress',
        'courses.pctComplete': '% Complete',
        'courses.lessons': 'Lessons',
        'courses.backToCourses': '← Back to Courses',
        'courses.noLessonsYet': 'No lessons in this course yet.',
        'courses.loadingCourse': 'Loading course...',
        'courses.done': '✓ Done',
        'courses.notStarted': 'Not started',
        'courses.min': 'min',
        'courses.videoLesson': 'Video Lesson',
        'courses.child': 'Child',
        'courses.allChildren': 'All Children',

        // Assignments
        'assign.noChildrenLinked': 'No Children Linked',
        'assign.noActiveEnrollments': 'No Active Enrollments',
        'assign.childNeedsEnroll': 'Your child needs to be enrolled in a course to see assignments.',
        'assign.noAssignments': 'No Assignments Yet',
        'assign.noAssignmentsDesc': 'No assignments have been created for the enrolled courses.',
        'assign.title': 'Assignments',
        'assign.all': 'All',
        'assign.pendingFilter': 'Pending',
        'assign.submitted': 'Submitted',
        'assign.graded': 'Graded',
        'assign.lesson': 'Lesson',
        'assign.due': 'Due',
        'assign.dueOffset': 'days',
        'assign.noDeadline': 'No deadline',
        'assign.max': 'Max',
        'assign.pts': 'pts',
        'assign.feedback': 'Feedback',
        'assign.submittedOn': 'Submitted',

        // Schedule
        'schedule.title': 'Class Schedule',
        'schedule.today': 'Today',
        'schedule.selectDay': 'Select a day to view sessions.',
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
        'achieve.noChildrenLinked': 'No Children Linked',
        'achieve.title': 'Achievements',
        'achieve.noAchievements': 'No Achievements Yet',
        'achieve.noAchievementsDesc': 'Diplomas and certificates will appear here once your child completes a program.',
        'achieve.diploma': 'Diploma',
        'achieve.issued': 'Issued',
        'achieve.grade': 'Grade',
        'achieve.viewCert': '📄 View Certificate',

        // Profile
        'profile.title': 'My Profile',
        'profile.personalInfo': 'Personal Information',
        'profile.changePhoto': 'Change Photo',
        'profile.fullName': 'Full Name',
        'profile.namePlaceholder': 'Your name',
        'profile.language': 'Language',
        'profile.saveChanges': 'Save Changes',
        'profile.changePassword': 'Change Password',
        'profile.newPassword': 'New Password',
        'profile.newPasswordPlaceholder': 'Min 6 characters',
        'profile.confirmPassword': 'Confirm Password',
        'profile.confirmPasswordPlaceholder': 'Repeat password',
        'profile.updatePassword': 'Update Password',

        // Toasts
        'toast.avatarUpdated': 'Avatar updated!',
        'toast.avatarFailed': 'Failed to upload avatar',
        'toast.fileTooLarge': 'File too large. Max 2MB.',
        'toast.profileUpdated': 'Profile updated!',
        'toast.profileFailed': 'Failed',
        'toast.nameEmpty': 'Name cannot be empty.',
        'toast.passwordChanged': 'Password updated!',
        'toast.passwordFailed': 'Failed',
        'toast.passwordLength': 'Password must be at least 6 characters.',
        'toast.passwordMismatch': 'Passwords do not match.',

        // Page title
        'pageTitle': 'Parent Portal — Web Genius',
    },

    lt: {
        // Sidebar nav
        'nav.overview': 'Apžvalga',
        'nav.dashboard': 'Apžvalga',
        'nav.myChildren': 'Mano vaikai',
        'nav.children': 'Vaikai',
        'nav.courseProgress': 'Kursų eiga',
        'nav.assignments': 'Užduotys',
        'nav.schedule': 'Tvarkaraštis',
        'nav.achievements': 'Pasiekimai',
        'nav.account': 'Paskyra',
        'nav.profile': 'Profilis',
        'nav.signOut': 'Atsijungti',
        'nav.viewSite': 'Svetainė ↗',

        // Page titles
        'title.dashboard': 'Apžvalga',
        'title.children': 'Mano vaikai',
        'title.courses': 'Kursų eiga',
        'title.assignments': 'Užduotys',
        'title.schedule': 'Tvarkaraštis',
        'title.achievements': 'Pasiekimai',
        'title.profile': 'Mano profilis',

        // Loading
        'loading': 'Kraunama...',

        // Child switcher
        'switcher.allChildren': 'Visi vaikai',

        // Dashboard
        'dash.children': 'Vaikai',
        'dash.activeCourses': 'Aktyvūs kursai',
        'dash.lessonsCompleted': 'Baigtos pamokos',
        'dash.pendingAssignments': 'Laukiančios užduotys',
        'dash.diplomasEarned': 'Gauti diplomai',
        'dash.noChildrenLinked': 'Vaikai nesusieti',
        'dash.noChildrenDesc': 'Jūsų paskyra dar neturi susietų mokinių. Susisiekite su administratoriumi, kad susietų vaiko paskyrą.',
        'dash.announcements': '📢 Pranešimai',
        'dash.noAnnouncements': 'Šiuo metu pranešimų nėra.',
        'dash.quickLinks': '⚡ Greitos nuorodos',
        'dash.linked': 'susieti',
        'dash.trackLearning': 'Stebėti mokymąsi',
        'dash.pending': 'laukia',

        // Children section
        'children.title': 'Mano vaikai',
        'children.noLinked': 'Vaikai nesusieti',
        'children.contactAdmin': 'Susisiekite su administratoriumi, kad susietų vaiko paskyrą su jūsų tėvų profiliu.',
        'children.joined': 'Prisijungė',
        'children.courses': 'Kursai',
        'children.lessonsDone': 'Baigtos pamokos',
        'children.diplomas': 'Diplomai',

        // Course progress
        'courses.noChildrenLinked': 'Vaikai nesusieti',
        'courses.noActiveCourses': 'Aktyvių kursų nėra',
        'courses.notEnrolledSingle': 'Jūsų vaikas dar neužsiregistravęs į jokius kursus.',
        'courses.notEnrolledMulti': 'Jūsų vaikai dar neužsiregistravę į jokius kursus.',
        'courses.progressTitle': 'Kursų eiga',
        'courses.pctComplete': '% baigta',
        'courses.lessons': 'Pamokos',
        'courses.backToCourses': '← Grįžti į kursus',
        'courses.noLessonsYet': 'Šiame kurse dar nėra pamokų.',
        'courses.loadingCourse': 'Kraunamas kursas...',
        'courses.done': '✓ Baigta',
        'courses.notStarted': 'Nepradėta',
        'courses.min': 'min',
        'courses.videoLesson': 'Vaizdo pamoka',
        'courses.child': 'Vaikas',
        'courses.allChildren': 'Visi vaikai',

        // Assignments
        'assign.noChildrenLinked': 'Vaikai nesusieti',
        'assign.noActiveEnrollments': 'Nėra aktyvių registracijų',
        'assign.childNeedsEnroll': 'Vaikas turi būti užsiregistravęs į kursą, kad matytų užduotis.',
        'assign.noAssignments': 'Užduočių dar nėra',
        'assign.noAssignmentsDesc': 'Užsiregistruotiems kursams dar nėra sukurtų užduočių.',
        'assign.title': 'Užduotys',
        'assign.all': 'Visos',
        'assign.pendingFilter': 'Laukiančios',
        'assign.submitted': 'Pateiktos',
        'assign.graded': 'Įvertintos',
        'assign.lesson': 'Pamoka',
        'assign.due': 'Terminas',
        'assign.dueOffset': 'dienos',
        'assign.noDeadline': 'Be termino',
        'assign.max': 'Maks.',
        'assign.pts': 'tšk.',
        'assign.feedback': 'Atsiliepimas',
        'assign.submittedOn': 'Pateikta',

        // Schedule
        'schedule.title': 'Pamokų tvarkaraštis',
        'schedule.today': 'Šiandien',
        'schedule.selectDay': 'Pasirinkite dieną, kad pamatytumėte pamokas.',
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
        'achieve.noChildrenLinked': 'Vaikai nesusieti',
        'achieve.title': 'Pasiekimai',
        'achieve.noAchievements': 'Pasiekimų dar nėra',
        'achieve.noAchievementsDesc': 'Diplomai ir sertifikatai atsiras čia, kai vaikas baigs programą.',
        'achieve.diploma': 'Diplomas',
        'achieve.issued': 'Išduotas',
        'achieve.grade': 'Pažymys',
        'achieve.viewCert': '📄 Peržiūrėti sertifikatą',

        // Profile
        'profile.title': 'Mano profilis',
        'profile.personalInfo': 'Asmeninė informacija',
        'profile.changePhoto': 'Keisti nuotrauką',
        'profile.fullName': 'Vardas ir pavardė',
        'profile.namePlaceholder': 'Jūsų vardas ir pavardė',
        'profile.language': 'Kalba',
        'profile.saveChanges': 'Išsaugoti pakeitimus',
        'profile.changePassword': 'Keisti slaptažodį',
        'profile.newPassword': 'Naujas slaptažodis',
        'profile.newPasswordPlaceholder': 'Min. 6 simboliai',
        'profile.confirmPassword': 'Pakartokite slaptažodį',
        'profile.confirmPasswordPlaceholder': 'Pakartokite slaptažodį',
        'profile.updatePassword': 'Atnaujinti slaptažodį',

        // Toasts
        'toast.avatarUpdated': 'Nuotrauka atnaujinta!',
        'toast.avatarFailed': 'Nepavyko įkelti nuotraukos',
        'toast.fileTooLarge': 'Failas per didelis. Maks. 2MB.',
        'toast.profileUpdated': 'Profilis atnaujintas!',
        'toast.profileFailed': 'Nepavyko',
        'toast.nameEmpty': 'Vardas negali būti tuščias.',
        'toast.passwordChanged': 'Slaptažodis atnaujintas!',
        'toast.passwordFailed': 'Nepavyko',
        'toast.passwordLength': 'Slaptažodis turi būti bent 6 simbolių.',
        'toast.passwordMismatch': 'Slaptažodžiai nesutampa.',

        // Page title
        'pageTitle': 'Tėvų skydelis — Web Genius',
    }
};

let _parentLang = 'en';

function initParentLang(locale) {
    _parentLang = (locale === 'lt') ? 'lt' : 'en';
    document.documentElement.lang = _parentLang;
    document.title = tp('pageTitle');
    localStorage.setItem('wg_lang', _parentLang);
    translateParentStaticUI();
}

function tp(key) {
    return parentI18n[_parentLang]?.[key] || parentI18n.en[key] || key;
}

function translateParentStaticUI() {
    // Sidebar nav labels
    const navLabels = document.querySelectorAll('.nav-section-label');
    if (navLabels.length >= 3) {
        navLabels[0].textContent = tp('nav.overview');
        navLabels[1].textContent = tp('nav.myChildren');
        navLabels[2].textContent = tp('nav.account');
    }

    // Sidebar nav links
    const navMap = {
        dashboard: 'nav.dashboard',
        children: 'nav.children',
        courses: 'nav.courseProgress',
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
            a.innerHTML = iconHtml + ' ' + tp(navMap[section]);
        }
    });

    // Sign out
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.textContent = tp('nav.signOut');

    // Role label
    const roleLabel = document.querySelector('.sidebar-footer .admin-role');
    if (roleLabel) roleLabel.textContent = _parentLang === 'lt' ? 'Tėvas/Mama' : 'Parent';

    // View Site link
    const viewSiteLink = document.querySelector('.topbar-actions .btn-sm');
    if (viewSiteLink) viewSiteLink.textContent = tp('nav.viewSite');
}
