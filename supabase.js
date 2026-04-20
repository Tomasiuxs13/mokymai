/* ============================================================
   Web Genius — Supabase Client Configuration
   ============================================================ */

console.log('✅ supabase.js: Loading...');

var SUPABASE_URL = 'https://ewaumwxqnnuuxbplbphb.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_sKeupj8V8zl1yTWjs4HR0w_opoiezFG';

// Check for Supabase library
if (typeof window.supabase === 'undefined') {
    console.error('❌ supabase.js: Supabase library not found on window object!');
}

// Initialize the Supabase client (loaded via CDN in HTML)
var supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ supabase.js: Client initialized');
} catch (err) {
    console.error('❌ supabase.js: Failed to initialize client:', err);
}

/* ----------------------------------------------------------
   Auth Helpers
   ---------------------------------------------------------- */

/**
 * Sign up a new user with email/password
 * @param {string} email
 * @param {string} password
 * @param {object} meta - { full_name, role }
 */
async function signUp(email, password, meta = {}) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: meta.full_name || '',
                role: meta.role || 'student',
            },
        },
    });
    if (error) throw error;
    return data;
}

/**
 * Sign in with email/password
 */
async function signIn(email, password) {
    console.log('🔑 signIn called for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        console.error('❌ signIn error:', error);
        throw error;
    }
    console.log('✅ signIn success:', data);
    return data;
}

/**
 * Sign out the current user
 */
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get the current session
 */
async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
}

/**
 * Get the current user's profile
 */
async function getProfile() {
    const session = await getSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
    if (error) throw error;
    return data;
}

/**
 * Update user profile
 */
async function updateProfile(updates) {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/* ----------------------------------------------------------
   Data Helpers
   ---------------------------------------------------------- */

/** Fetch all available cohorts */
async function getCohorts() {
    console.log('📥 getCohorts called');
    const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .order('starts_at', { ascending: true });
    if (error) throw error;
    return data;
}

/** Fetch courses (optionally filtered by cohort) */
async function getCourses(cohortId = null) {
    let query = supabase.from('courses').select('*').order('sort_order');
    if (cohortId) query = query.eq('cohort_id', cohortId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/** Fetch lessons for a course */
async function getLessons(courseId) {
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order');
    if (error) throw error;
    return data;
}

/** Get student's enrollments */
async function getMyEnrollments() {
    const { data, error } = await supabase
        .from('enrollments')
        .select('*, cohorts(*), courses(*)')
        .order('enrolled_at', { ascending: false });
    if (error) throw error;
    return data;
}

/** Track lesson progress */
async function updateLessonProgress(lessonId, progressPct, completed = false) {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
            student_id: session.user.id,
            lesson_id: lessonId,
            progress_pct: progressPct,
            completed,
            last_watched_at: new Date().toISOString(),
        }, { onConflict: 'student_id,lesson_id' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

/* ----------------------------------------------------------
   Storage Helpers — Submission File Uploads
   ---------------------------------------------------------- */

/**
 * Upload a file to the submissions storage bucket.
 * Files are stored under: submissions/{studentId}/{assignmentId}/{timestamp}_{filename}
 * @param {File} file - The File object to upload
 * @param {string} assignmentId - Assignment UUID
 * @param {string} [studentId] - Student UUID (defaults to current user)
 * @returns {object} { path, fullPath }
 */
async function uploadSubmissionFile(file, assignmentId, studentId = null) {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    const userId = studentId || session.user.id;
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${assignmentId}/${timestamp}_${safeName}`;

    const { data, error } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) throw error;
    return { path: data.path, fullPath: data.fullPath };
}

/**
 * Get a signed download URL for a submission file.
 * @param {string} filePath - The storage path (from file_url column)
 * @param {number} [expiresIn=3600] - URL expiry in seconds (default 1 hour)
 * @returns {string} Signed download URL
 */
async function getSubmissionFileUrl(filePath, expiresIn = 3600) {
    const { data, error } = await supabase.storage
        .from('submissions')
        .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
}

/**
 * Delete a file from submissions storage.
 * @param {string} filePath - The storage path to delete
 */
async function deleteSubmissionFile(filePath) {
    const { error } = await supabase.storage
        .from('submissions')
        .remove([filePath]);
    if (error) throw error;
}

/**
 * Submit an assignment with optional file upload.
 * @param {string} assignmentId
 * @param {object} opts - { text, file }
 * @returns {object} The created submission record
 */
async function submitAssignment(assignmentId, { text = '', file = null } = {}) {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    let fileUrl = null;
    if (file) {
        const uploaded = await uploadSubmissionFile(file, assignmentId);
        fileUrl = uploaded.path;
    }

    const { data, error } = await supabase
        .from('submissions')
        .insert({
            assignment_id: assignmentId,
            student_id: session.user.id,
            content: text ? { text } : {},
            file_url: fileUrl,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/* ----------------------------------------------------------
   Storage Helpers — Course Thumbnails
   ---------------------------------------------------------- */

/**
 * Upload a course thumbnail image.
 * @param {File} file - Image file to upload
 * @param {string} courseId - Course UUID
 * @returns {string} Public URL of the uploaded thumbnail
 */
async function uploadCourseThumbnail(file, courseId) {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${courseId}/${timestamp}.${ext}`;

    const { data, error } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) throw error;

    // Get public URL (bucket is public)
    const { data: urlData } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

/**
 * Delete a course thumbnail from storage.
 * @param {string} publicUrl - The full public URL
 */
async function deleteCourseThumbnail(publicUrl) {
    // Extract path from public URL
    const marker = '/object/public/course-thumbnails/';
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const filePath = publicUrl.substring(idx + marker.length);

    const { error } = await supabase.storage
        .from('course-thumbnails')
        .remove([filePath]);
    if (error) throw error;
}

/* ----------------------------------------------------------
   Lesson Attachment Helpers (admin-only upload; signed read)
   ---------------------------------------------------------- */

async function uploadLessonAttachment(file, lessonId) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${lessonId}/${timestamp}_${safeName}`;

    const { data, error } = await supabase.storage
        .from('lesson-files')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream'
        });
    if (error) throw error;

    return {
        path: data.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null
    };
}

async function getLessonAttachmentUrl(filePath, expiresInSeconds = 3600) {
    const { data, error } = await supabase.storage
        .from('lesson-files')
        .createSignedUrl(filePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
}

async function deleteLessonAttachment(filePath) {
    const { error } = await supabase.storage
        .from('lesson-files')
        .remove([filePath]);
    if (error) throw error;
}

/* ----------------------------------------------------------
   Admin User Management Helpers
   ---------------------------------------------------------- */

/**
 * Create a new user from the admin panel without disrupting the admin's session.
 * Uses a secondary Supabase client so the admin stays logged in.
 * @param {string} email
 * @param {string} password
 * @param {object} meta - { full_name, role }
 * @returns {object} The created user data
 */
async function adminCreateUser(email, password, meta = {}) {
    // Create a separate client so the signUp doesn't replace the admin's session
    const tempClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
    });

    const { data, error } = await tempClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: meta.full_name || '',
                role: meta.role || 'student',
            },
        },
    });

    if (error) throw error;
    if (!data.user) throw new Error('User creation failed — no user returned');

    // Update profile fields that aren't handled by the trigger (e.g. locale)
    if (meta.locale) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ locale: meta.locale })
            .eq('id', data.user.id);
        if (profileError) console.warn('Could not set locale:', profileError.message);
    }

    return data;
}

/**
 * Update any user's profile (admin-only, relies on RLS).
 * @param {string} userId
 * @param {object} updates - { full_name, locale, ... }
 */
async function adminUpdateProfile(userId, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * Delete a user's profile (admin-only). The profiles FK cascades to enrollments,
 * submissions, progress, etc. Note: This deletes the profile row but NOT the
 * auth.users row (that requires service_role). The user won't be able to log in
 * if they have no profile.
 * @param {string} userId
 */
async function adminDeleteProfile(userId) {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
    if (error) throw error;
}

// Ensure global functions are available
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.getSession = getSession;
window.getProfile = getProfile;
window.updateProfile = updateProfile;
window.getCohorts = getCohorts;
window.getCourses = getCourses;
window.getLessons = getLessons;
window.getMyEnrollments = getMyEnrollments;
window.updateLessonProgress = updateLessonProgress;
window.uploadSubmissionFile = uploadSubmissionFile;
window.getSubmissionFileUrl = getSubmissionFileUrl;
window.deleteSubmissionFile = deleteSubmissionFile;
window.submitAssignment = submitAssignment;
window.uploadCourseThumbnail = uploadCourseThumbnail;
window.deleteCourseThumbnail = deleteCourseThumbnail;
window.uploadLessonAttachment = uploadLessonAttachment;
window.getLessonAttachmentUrl = getLessonAttachmentUrl;
window.deleteLessonAttachment = deleteLessonAttachment;
window.adminCreateUser = adminCreateUser;
window.adminUpdateProfile = adminUpdateProfile;
window.adminDeleteProfile = adminDeleteProfile;

// Export for use in other scripts
window.WebGeniusDB = {
    supabase,
    signUp,
    signIn,
    signOut,
    getSession,
    getProfile,
    updateProfile,
    getCohorts,
    getCourses,
    getLessons,
    getMyEnrollments,
    updateLessonProgress,
    uploadSubmissionFile,
    getSubmissionFileUrl,
    deleteSubmissionFile,
    submitAssignment,
    uploadCourseThumbnail,
    deleteCourseThumbnail,
    uploadLessonAttachment,
    getLessonAttachmentUrl,
    deleteLessonAttachment,
    adminCreateUser,
    adminUpdateProfile,
    adminDeleteProfile,
};

console.log('✅ supabase.js: Loaded successfully');
