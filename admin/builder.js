/* ============================================================
   Course Builder Logic
   ============================================================ */

let courseId = new URLSearchParams(window.location.search).get('id');
let courseData = null;
let modulesCache = [];
let lessonsCache = [];
let activeLessonId = null;
let isDirty = false;
let editor = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!courseId) {
        alert('No course ID provided');
        window.location.href = '/admin/#courses';
        return;
    }

    // Auth gate: admin or teacher-collaborator only.
    try {
        const sb = window.WebGeniusDB.supabase;
        const { data: { session } } = await sb.auth.getSession();
        if (!session) { window.location.href = '/admin/login.html'; return; }

        const { data: profile } = await sb.from('profiles').select('role').eq('id', session.user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
            window.location.href = '/admin/login.html';
            return;
        }

        if (profile.role === 'teacher') {
            const { data: link } = await sb
                .from('course_collaborators')
                .select('id')
                .eq('course_id', courseId)
                .eq('teacher_id', session.user.id)
                .maybeSingle();
            if (!link) {
                alert('You are not a collaborator on this course.');
                window.location.href = '/admin/#courses';
                return;
            }
        }
    } catch (e) {
        console.error('Auth check failed:', e);
        window.location.href = '/admin/login.html';
        return;
    }

    await loadCourseData();
    initEditor();
});

// Warn on leaving page with unsaved lesson edits
window.addEventListener('beforeunload', (e) => {
    if (isDirty || isSaving) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Ctrl/Cmd+S → flush autosave immediately
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (activeLessonId) {
            e.preventDefault();
            flushSave();
        }
    }
});

/* ----------------------------------------------------------
   Data Loading
   ---------------------------------------------------------- */
async function loadCourseData() {
    const sb = window.WebGeniusDB.supabase;

    // 1. Fetch Course Info
    const { data: course, error: cErr } = await sb
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

    if (cErr) {
        console.error(cErr);
        alert('Failed to load course');
        return;
    }
    courseData = course;
    document.getElementById('courseNameTitle').innerText = course.title;
    document.title = `Builder: ${course.title}`;
    renderStatusBadge();

    // 2. Fetch Modules
    const { data: mods, error: mErr } = await sb
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order');

    if (mErr && mErr.code !== 'PGRST116') { // Ignore if table doesn't exist yet (handle gracefully-ish)
        console.error('Modules load error (table might not exist yet):', mErr);
    }
    modulesCache = mods || [];

    // 3. Fetch Lessons
    const { data: lessons, error: lErr } = await sb
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order');

    if (lErr) console.error(lErr);
    lessonsCache = lessons || [];

    renderStructure();
}

/* ----------------------------------------------------------
   Rendering & Structure
   ---------------------------------------------------------- */
function renderStructure() {
    const container = document.getElementById('courseStructure');
    container.innerHTML = '';
    container.setAttribute('role', 'tree');
    container.setAttribute('aria-label', 'Course structure');

    // 1. Render Modules
    modulesCache.forEach(mod => {
        const modEl = document.createElement('div');
        modEl.className = 'module-item';
        modEl.dataset.id = mod.id;
        modEl.draggable = true;
        modEl.setAttribute('role', 'treeitem');
        modEl.setAttribute('aria-expanded', 'true');
        modEl.setAttribute('aria-label', `Module: ${mod.title}`);
        modEl.ondragstart = window.handleModuleDragStart;
        modEl.ondragover = window.handleModuleDragOver;
        modEl.ondrop = window.handleModuleDrop;

        modEl.innerHTML = `
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:10px">
            <span style="cursor:grab;color:var(--gray-400)" aria-hidden="true">☰</span>
            <span>${esc(mod.title)}</span>
        </div>
        <div style="font-size:0.8rem">
            <button class="btn-sm" onclick="editModule('${mod.id}')" aria-label="Rename module">✏️</button>
            <button class="btn-sm btn-danger" onclick="deleteModule('${mod.id}')" aria-label="Delete module">🗑️</button>
        </div>
      </div>
      <div class="module-lessons" data-module-id="${mod.id}" role="group">
        <!-- Lessons go here -->
      </div>
    `;
        container.appendChild(modEl);
    });

    // 2. Unassigned Module (for lessons without module_id)
    const unassignedLessons = lessonsCache.filter(l => !l.module_id);
    if (unassignedLessons.length > 0 || modulesCache.length === 0) {
        const unassignedEl = document.createElement('div');
        unassignedEl.className = 'module-item';
        unassignedEl.style.borderColor = '#fbbf24';
        unassignedEl.setAttribute('role', 'treeitem');
        unassignedEl.setAttribute('aria-label', 'Unassigned lessons');
        unassignedEl.innerHTML = `
      <div class="module-header" style="background:#fffbeb">
        <span>Unassigned / General</span>
      </div>
      <div class="module-lessons" data-module-id="null" role="group"></div>
    `;
        container.appendChild(unassignedEl);
    }

    // 3. Place Lessons into Modules
    lessonsCache.forEach(lesson => {
        const parentContainer = document.querySelector(`.module-lessons[data-module-id="${lesson.module_id || 'null'}"]`);
        if (parentContainer) {
            const lessonEl = document.createElement('div');
            lessonEl.className = `lesson-node ${activeLessonId === lesson.id ? 'active' : ''}`;
            lessonEl.dataset.id = lesson.id;
            lessonEl.draggable = true;
            lessonEl.setAttribute('role', 'treeitem');
            lessonEl.setAttribute('aria-selected', activeLessonId === lesson.id ? 'true' : 'false');
            lessonEl.setAttribute('aria-label', `Lesson: ${lesson.title}`);
            lessonEl.tabIndex = -1;
            lessonEl.onclick = () => selectLesson(lesson.id);
            lessonEl.ondragstart = handleDragStart;
            lessonEl.onkeydown = handleLessonKey;
            lessonEl.innerHTML = `
        <span class="drag-handle">☰</span>
        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(lesson.title)}</span>
        <span style="font-size:0.75rem;color:var(--gray-400)">${lesson.duration_min}m</span>
        <button class="btn-sm lesson-dup" title="Duplicate lesson"
          style="padding:2px 6px;background:transparent;border:none;color:var(--gray-400);font-size:.85rem"
          onclick="event.stopPropagation(); duplicateLesson('${lesson.id}')">⎘</button>
        <button class="btn-sm lesson-del" title="Delete lesson"
          style="padding:2px 6px;background:transparent;border:none;color:var(--gray-400);font-size:.85rem"
          onclick="event.stopPropagation(); deleteLesson('${lesson.id}')">✕</button>
      `;
            parentContainer.appendChild(lessonEl);
        }
    });

    // Init drag and drop zones
    document.querySelectorAll('.module-lessons').forEach(zone => {
        zone.ondragover = handleDragOver;
        zone.ondrop = handleDrop;
    });

    // Roving tabindex: the active lesson (or the first if none) is the keyboard entry point.
    const all = [...document.querySelectorAll('.lesson-node')];
    if (all.length > 0) {
        const target = all.find(el => el.dataset.id === activeLessonId) || all[0];
        target.tabIndex = 0;
    }
}

function handleLessonKey(e) {
    const nodes = [...document.querySelectorAll('.lesson-node')];
    const idx = nodes.indexOf(e.currentTarget);
    if (idx === -1) return;

    let targetIdx = -1;
    switch (e.key) {
        case 'ArrowDown': targetIdx = Math.min(idx + 1, nodes.length - 1); break;
        case 'ArrowUp':   targetIdx = Math.max(idx - 1, 0); break;
        case 'Home':      targetIdx = 0; break;
        case 'End':       targetIdx = nodes.length - 1; break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            selectLesson(e.currentTarget.dataset.id);
            return;
        default: return;
    }
    if (targetIdx !== -1 && targetIdx !== idx) {
        e.preventDefault();
        nodes.forEach(n => n.tabIndex = -1);
        nodes[targetIdx].tabIndex = 0;
        nodes[targetIdx].focus();
    }
}

/* ----------------------------------------------------------
   Selection & Editing
   ---------------------------------------------------------- */
async function selectLesson(id) {
    if (id === activeLessonId) return;
    // Flush any pending autosave for the outgoing lesson before switching.
    if (isDirty && activeLessonId) {
        await flushSave();
    }

    activeLessonId = id;
    const lesson = lessonsCache.find(l => l.id === id);
    if (!lesson) return;

    // UI Updates
    document.querySelectorAll('.lesson-node').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.lesson-node[data-id="${id}"]`);
    if (activeEl) activeEl.classList.add('active');

    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('editorArea').style.display = 'block';

    // Form Population
    document.getElementById('editTitle').value = lesson.title || '';
    document.getElementById('editVideoUrl').value = lesson.video_url || '';
    document.getElementById('editDuration').value = lesson.duration_min || '';
    document.getElementById('editIsFree').checked = !!lesson.is_free;

    // Editor Content (emitUpdate=false so we don't mark dirty on load)
    if (editor) {
        const content = lesson.content?.html || '<p></p>';
        editor.commands.setContent(content, false);
    }

    isDirty = false;
    lastSavedAt = null;
    setSaveStatus('idle');

    // Refresh assignments panel if it's visible
    lessonAssignmentsCache = [];
    updateAssignCountBadge();
    const assignTab = document.getElementById('tab-assignments');
    if (assignTab && assignTab.style.display !== 'none') loadAssignmentsForLesson();
    else document.getElementById('assignmentsList').innerHTML = '';

    // Attachments always visible in Settings tab — load fresh
    attachmentsCache = [];
    loadAttachmentsForLesson();
}

const AUTOSAVE_DELAY_MS = 1500;
let autosaveTimer = null;
let isSaving = false;
let lastSavedAt = null;

function markDirty() {
    isDirty = true;
    setSaveStatus('dirty');
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => { flushSave(); }, AUTOSAVE_DELAY_MS);
}

function setSaveStatus(state, detail = '') {
    const el = document.getElementById('saveStatus');
    if (!el) return;
    if (state === 'saving') {
        el.textContent = 'Saving…';
        el.style.color = 'var(--gray-500)';
    } else if (state === 'saved') {
        el.textContent = detail || 'Saved';
        el.style.color = 'var(--gray-400)';
    } else if (state === 'dirty') {
        el.textContent = 'Unsaved';
        el.style.color = '#b45309';
    } else if (state === 'error') {
        el.textContent = detail || 'Save failed — retrying';
        el.style.color = '#dc2626';
    } else {
        el.textContent = '';
    }
}

function refreshSavedAtLabel() {
    if (!lastSavedAt || isDirty || isSaving) return;
    const secs = Math.round((Date.now() - lastSavedAt) / 1000);
    let label;
    if (secs < 5) label = 'Saved just now';
    else if (secs < 60) label = `Saved ${secs}s ago`;
    else if (secs < 3600) label = `Saved ${Math.floor(secs / 60)}m ago`;
    else label = `Saved at ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setSaveStatus('saved', label);
}
setInterval(refreshSavedAtLabel, 15000);

async function flushSave() {
    if (autosaveTimer) { clearTimeout(autosaveTimer); autosaveTimer = null; }
    if (!activeLessonId || !isDirty || isSaving) return;

    const title = document.getElementById('editTitle').value.trim();
    if (!title) {
        setSaveStatus('error', 'Title is required');
        return;
    }

    const video_url = document.getElementById('editVideoUrl').value.trim();
    if (video_url && !isValidHttpUrl(video_url)) {
        setSaveStatus('error', 'Invalid video URL');
        return;
    }
    const duration_min = parseInt(document.getElementById('editDuration').value) || 0;
    if (duration_min < 0) {
        setSaveStatus('error', 'Duration cannot be negative');
        return;
    }
    const is_free = document.getElementById('editIsFree').checked;
    const html = editor ? editor.getHTML() : '';

    const updates = {
        title,
        video_url,
        duration_min,
        is_free,
        content: { html },
        updated_at: new Date().toISOString()
    };

    isSaving = true;
    setSaveStatus('saving');
    const savingLessonId = activeLessonId;

    try {
        const sb = window.WebGeniusDB.supabase;
        const { error } = await sb.from('lessons').update(updates).eq('id', savingLessonId);
        if (error) {
            setSaveStatus('error', 'Save failed: ' + error.message);
            // Retry in 5s if the lesson is still active and still dirty.
            setTimeout(() => { if (isDirty && activeLessonId === savingLessonId) flushSave(); }, 5000);
            return;
        }

        const idx = lessonsCache.findIndex(l => l.id === savingLessonId);
        if (idx !== -1) Object.assign(lessonsCache[idx], updates);

        if (savingLessonId === activeLessonId) isDirty = false;
        lastSavedAt = Date.now();
        refreshSavedAtLabel();
        renderStructure();

        // Snapshot for revision history (best-effort, non-blocking).
        snapshotLessonRevision(savingLessonId, updates).catch(err => console.warn('Snapshot failed:', err));
    } finally {
        isSaving = false;
    }
}

// Legacy name kept in case anything still references it.
const saveCurrent = flushSave;
window.saveCurrent = saveCurrent;

/* ----------------------------------------------------------
   Drag & Drop Logic
   ---------------------------------------------------------- */
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItem.dataset.id);
    requestAnimationFrame(() => draggedItem.classList.add('dragging'));
}

function handleDragOver(e) {
    if (!draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

async function handleDrop(e) {
    if (!draggedItem) return;
    e.preventDefault();
    const zone = e.currentTarget; // .module-lessons
    draggedItem.classList.remove('dragging');

    if (!zone.classList.contains('module-lessons')) return;

    const lessonId = draggedItem.dataset.id;
    const moduleId = zone.dataset.moduleId === 'null' ? null : zone.dataset.moduleId;

    // Snapshot for rollback in case the DB call fails.
    const snapshot = lessonsCache.map(l => ({ id: l.id, module_id: l.module_id, sort_order: l.sort_order }));

    zone.appendChild(draggedItem);

    const movedLesson = lessonsCache.find(l => l.id === lessonId);
    if (movedLesson) movedLesson.module_id = moduleId;

    const newOrderIds = [...zone.querySelectorAll('.lesson-node')].map(el => el.dataset.id);
    newOrderIds.forEach((id, idx) => {
        const l = lessonsCache.find(x => x.id === id);
        if (l) l.sort_order = idx;
    });

    const sb = window.WebGeniusDB.supabase;
    const updates = newOrderIds.map((id, idx) => ({
        id,
        module_id: moduleId,
        sort_order: idx,
        updated_at: new Date().toISOString()
    }));

    const { error } = await sb.from('lessons').upsert(updates);
    if (error) {
        toast('Could not save new order: ' + error.message, 'error');
        snapshot.forEach(snap => {
            const l = lessonsCache.find(x => x.id === snap.id);
            if (l) { l.module_id = snap.module_id; l.sort_order = snap.sort_order; }
        });
        renderStructure();
    }
}

/* ----------------------------------------------------------
   Module Management
   ---------------------------------------------------------- */
async function addModule() {
    const raw = prompt('Module Title:');
    if (raw === null) return;
    const title = raw.trim();
    if (!title) { alert('Module title cannot be empty.'); return; }
    if (title.length > 255) { alert('Module title is too long (max 255 characters).'); return; }

    const sb = window.WebGeniusDB.supabase;
    const { data, error } = await sb.from('modules').insert({
        course_id: courseId,
        title: title,
        sort_order: modulesCache.length
    }).select().single();

    if (error) {
        alert(error.message);
        return;
    }

    modulesCache.push(data);
    renderStructure();
}

window.duplicateLesson = async function (sourceId) {
    const src = lessonsCache.find(l => l.id === sourceId);
    if (!src) return;
    // Flush any pending edits on the source lesson first so we clone the latest content.
    if (isDirty && activeLessonId === sourceId) await flushSave();
    const fresh = lessonsCache.find(l => l.id === sourceId) || src;

    const sb = window.WebGeniusDB.supabase;
    const payload = {
        course_id: courseId,
        module_id: fresh.module_id || null,
        title: (fresh.title || 'Untitled') + ' (copy)',
        description: fresh.description || null,
        video_url: fresh.video_url || null,
        content: fresh.content || {},
        duration_min: fresh.duration_min || 0,
        is_free: !!fresh.is_free,
        sort_order: lessonsCache.length
    };

    const { data: newLesson, error } = await sb.from('lessons').insert(payload).select().single();
    if (error) { toast('Duplicate failed: ' + error.message, 'error'); return; }

    // Copy assignments (best-effort).
    const { data: srcAssignments } = await sb.from('assignments').select('*').eq('lesson_id', sourceId);
    if (srcAssignments?.length) {
        const copies = srcAssignments.map(a => ({
            lesson_id: newLesson.id,
            title: a.title,
            description: a.description,
            due_offset_days: a.due_offset_days,
            max_points: a.max_points
        }));
        const { error: aErr } = await sb.from('assignments').insert(copies);
        if (aErr) console.warn('Assignment copy failed:', aErr);
    }

    lessonsCache.push(newLesson);
    renderStructure();
    selectLesson(newLesson.id);
    toast('Lesson duplicated.', 'success');
}

window.deleteLesson = async function (id) {
    const lesson = lessonsCache.find(l => l.id === id);
    if (!lesson) return;
    if (!confirm(`Delete lesson "${lesson.title}"? Assignments and submissions for this lesson will also be deleted.`)) return;

    const sb = window.WebGeniusDB.supabase;
    const { error } = await sb.from('lessons').delete().eq('id', id);
    if (error) { toast('Delete failed: ' + error.message, 'error'); return; }

    lessonsCache = lessonsCache.filter(l => l.id !== id);
    if (activeLessonId === id) {
        activeLessonId = null;
        isDirty = false;
        document.getElementById('editorArea').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }
    renderStructure();
    toast('Lesson deleted.');
}

async function addLesson() {
    // Default to first module or null
    const moduleId = modulesCache.length > 0 ? modulesCache[0].id : null;

    const sb = window.WebGeniusDB.supabase;
    const { data, error } = await sb.from('lessons').insert({
        course_id: courseId,
        module_id: moduleId,
        title: 'New Lesson',
        sort_order: lessonsCache.length
    }).select().single();

    if (error) {
        alert(error.message);
        return;
    }

    lessonsCache.push(data);
    renderStructure();
    selectLesson(data.id);
}

/* ----------------------------------------------------------
   TipTap Init
   ---------------------------------------------------------- */
function initEditor() {
    if (!window.TipTap) {
        setTimeout(initEditor, 100);
        return;
    }

    const { Editor, StarterKit, Link, Image } = window.TipTap;

    editor = new Editor({
        element: document.querySelector('#tiptapEditor'),
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            Image,
        ],
        content: '<p></p>',
        onUpdate: () => {
            markDirty();
            updateToolbarState();
        },
        onSelectionUpdate: () => updateToolbarState()
    });

    buildToolbar();
    updateToolbarState();
}

const TOOLBAR_ITEMS = [
    { label: 'B', title: 'Bold (Ctrl+B)', cmd: e => e.chain().focus().toggleBold().run(), active: e => e.isActive('bold'), style: 'font-weight:700' },
    { label: 'I', title: 'Italic (Ctrl+I)', cmd: e => e.chain().focus().toggleItalic().run(), active: e => e.isActive('italic'), style: 'font-style:italic' },
    { label: 'S', title: 'Strikethrough', cmd: e => e.chain().focus().toggleStrike().run(), active: e => e.isActive('strike'), style: 'text-decoration:line-through' },
    { sep: true },
    { label: 'H1', title: 'Heading 1', cmd: e => e.chain().focus().toggleHeading({ level: 1 }).run(), active: e => e.isActive('heading', { level: 1 }) },
    { label: 'H2', title: 'Heading 2', cmd: e => e.chain().focus().toggleHeading({ level: 2 }).run(), active: e => e.isActive('heading', { level: 2 }) },
    { label: 'H3', title: 'Heading 3', cmd: e => e.chain().focus().toggleHeading({ level: 3 }).run(), active: e => e.isActive('heading', { level: 3 }) },
    { label: '¶', title: 'Paragraph', cmd: e => e.chain().focus().setParagraph().run(), active: e => e.isActive('paragraph') },
    { sep: true },
    { label: '• List', title: 'Bulleted list', cmd: e => e.chain().focus().toggleBulletList().run(), active: e => e.isActive('bulletList') },
    { label: '1. List', title: 'Numbered list', cmd: e => e.chain().focus().toggleOrderedList().run(), active: e => e.isActive('orderedList') },
    { label: '❝', title: 'Blockquote', cmd: e => e.chain().focus().toggleBlockquote().run(), active: e => e.isActive('blockquote') },
    { label: '</>', title: 'Code block', cmd: e => e.chain().focus().toggleCodeBlock().run(), active: e => e.isActive('codeBlock') },
    { sep: true },
    { label: '🔗', title: 'Insert link', cmd: () => insertLink(), active: e => e.isActive('link') },
    { label: '🖼', title: 'Insert image by URL', cmd: () => insertImage() },
    { label: '—', title: 'Horizontal rule', cmd: e => e.chain().focus().setHorizontalRule().run() },
    { sep: true },
    { label: '↶', title: 'Undo', cmd: e => e.chain().focus().undo().run() },
    { label: '↷', title: 'Redo', cmd: e => e.chain().focus().redo().run() }
];

function buildToolbar() {
    const host = document.getElementById('editorToolbar');
    if (!host) return;
    host.innerHTML = '';
    TOOLBAR_ITEMS.forEach((item, idx) => {
        if (item.sep) {
            const s = document.createElement('span');
            s.className = 'sep';
            host.appendChild(s);
            return;
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = item.label;
        btn.title = item.title || item.label;
        btn.dataset.idx = String(idx);
        if (item.style) btn.setAttribute('style', item.style);
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => {
            if (!editor) return;
            item.cmd(editor);
            updateToolbarState();
        });
        host.appendChild(btn);
    });
}

function updateToolbarState() {
    if (!editor) return;
    const host = document.getElementById('editorToolbar');
    if (!host) return;
    host.querySelectorAll('button[data-idx]').forEach(btn => {
        const item = TOOLBAR_ITEMS[Number(btn.dataset.idx)];
        if (item?.active) {
            btn.classList.toggle('is-active', !!item.active(editor));
        }
    });
}

function insertLink() {
    if (!editor) return;
    const prev = editor.getAttributes('link')?.href || '';
    const url = prompt('Link URL (leave blank to remove):', prev);
    if (url === null) return;
    if (url === '') {
        editor.chain().focus().unsetLink().run();
        return;
    }
    if (!isValidHttpUrl(url)) { alert('Link must start with http:// or https://'); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

function insertImage() {
    if (!editor) return;
    const url = prompt('Image URL:');
    if (!url) return;
    if (!isValidHttpUrl(url)) { alert('Image URL must start with http:// or https://'); return; }
    editor.chain().focus().setImage({ src: url }).run();
}

function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ----------------------------------------------------------
   Helpers
   ---------------------------------------------------------- */
window.switchTab = function (tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

    const tabs = document.querySelectorAll('.tab');
    const order = { content: 0, settings: 1, assignments: 2 };
    const idx = order[tabName];
    if (idx != null && tabs[idx]) tabs[idx].classList.add('active');

    document.getElementById(`tab-${tabName}`).style.display = 'block';

    if (tabName === 'assignments') loadAssignmentsForLesson();
}

window.addModule = addModule;
window.addLesson = addLesson;
window.editModule = async (id) => {
    const mod = modulesCache.find(m => m.id === id);
    if (!mod) return;
    const raw = prompt('Rename Module:', mod.title);
    if (raw === null) return;
    const newTitle = raw.trim();
    if (!newTitle) { alert('Module title cannot be empty.'); return; }
    if (newTitle.length > 255) { alert('Module title is too long (max 255 characters).'); return; }
    if (newTitle === mod.title) return;

    const sb = window.WebGeniusDB.supabase;
    const { error } = await sb.from('modules').update({ title: newTitle }).eq('id', id);
    if (error) { alert('Error renaming module: ' + error.message); return; }
    mod.title = newTitle;
    renderStructure();
}
window.deleteModule = async (id) => {
    const lessonCount = lessonsCache.filter(l => l.module_id === id).length;
    const msg = lessonCount === 0
        ? 'Delete this module? It has no lessons.'
        : `Delete this module? ${lessonCount} lesson${lessonCount === 1 ? '' : 's'} will be moved to "Unassigned / General".`;
    if (!confirm(msg)) return;
    const sb = window.WebGeniusDB.supabase;
    const { error } = await sb.from('modules').delete().eq('id', id);
    if (error) { alert('Error deleting module: ' + error.message); return; }
    modulesCache = modulesCache.filter(m => m.id !== id);
    lessonsCache.forEach(l => { if (l.module_id === id) l.module_id = null; });
    renderStructure();
}

/* ----------------------------------------------------------
   Settings Modal
   ---------------------------------------------------------- */
window.openCourseSettings = function () {
    if (!courseData) return;
    document.getElementById('setCourseTitle').value = courseData.title || '';
    document.getElementById('setCourseThumb').value = courseData.thumbnail || '';
    document.getElementById('setCourseDesc').value = courseData.description || '';

    document.getElementById('settingsModalOverlay').classList.add('open');
}

window.closeSettingsModal = function () {
    document.getElementById('settingsModalOverlay').classList.remove('open');
}

window.saveCourseSettings = async function () {
    const title = document.getElementById('setCourseTitle').value.trim();
    const thumbnail = document.getElementById('setCourseThumb').value.trim();
    const description = document.getElementById('setCourseDesc').value;

    if (!title) return alert('Title is required');
    if (title.length > 255) return alert('Title is too long (max 255 characters).');
    if (thumbnail && !isValidHttpUrl(thumbnail)) return alert('Thumbnail URL must start with http:// or https://');

    const sb = window.WebGeniusDB.supabase;
    const { error } = await sb.from('courses').update({
        title, thumbnail, description, updated_at: new Date().toISOString()
    }).eq('id', courseId);

    if (error) {
        alert('Error saving settings: ' + error.message);
        return;
    }

    courseData.title = title;
    courseData.thumbnail = thumbnail;
    courseData.description = description;

    document.getElementById('courseNameTitle').innerText = title;
    document.title = `Builder: ${title}`;
    renderStatusBadge();

    closeSettingsModal();
}

/* ----------------------------------------------------------
   Module Drag & Drop
   ---------------------------------------------------------- */
let draggedModule = null;

window.handleModuleDragStart = function (e) {
    draggedModule = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedModule.dataset.id);
    draggedModule.classList.add('dragging');
}

window.handleModuleDragOver = function (e) {
    if (!draggedModule) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const container = document.getElementById('courseStructure');
    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
        container.appendChild(draggedModule);
    } else {
        container.insertBefore(draggedModule, afterElement);
    }
}

window.handleModuleDrop = async function (e) {
    if (!draggedModule) return;
    e.preventDefault();
    draggedModule.classList.remove('dragging');
    draggedModule = null; // Clear it

    // Save new order
    const container = document.getElementById('courseStructure');
    const modulesResponse = [...container.querySelectorAll('.module-item')];

    // Filter out unassigned if present (it shouldn't be draggable usually, but let's be safe)
    const validModules = modulesResponse.filter(el => el.dataset.id && el.dataset.id !== 'undefined');

    // Update cache order
    const newOrderIds = validModules.map(el => el.dataset.id);

    // Optimistic update
    const updates = newOrderIds.map((id, index) => ({
        id,
        sort_order: index,
        updated_at: new Date().toISOString()
    }));

    const sb = window.WebGeniusDB.supabase;
    await sb.from('modules').upsert(updates);

    // Update local cache sort
    modulesCache.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
}


/* ----------------------------------------------------------
   Publish / Preview / Status
   ---------------------------------------------------------- */
function renderStatusBadge() {
    const badge = document.getElementById('courseStatusBadge');
    const btn = document.getElementById('publishBtn');
    if (!badge || !courseData) return;
    const status = courseData.status || 'draft';
    if (status === 'published') {
        badge.textContent = 'Published';
        badge.style.background = 'var(--success-100, #dcfce7)';
        badge.style.color = 'var(--success-700, #166534)';
        if (btn) btn.textContent = 'Unpublish';
    } else if (status === 'archived') {
        badge.textContent = 'Archived';
        badge.style.background = 'var(--gray-200)';
        badge.style.color = 'var(--gray-700)';
        if (btn) btn.textContent = 'Publish…';
    } else {
        badge.textContent = 'Draft';
        badge.style.background = '#fef3c7';
        badge.style.color = '#92400e';
        if (btn) btn.textContent = 'Publish…';
    }
}

window.togglePublish = async function () {
    if (!courseData) return;
    const sb = window.WebGeniusDB.supabase;

    if (courseData.status === 'published') {
        if (!confirm('Unpublish this course? Students will lose access.')) return;
        const { error } = await sb.from('courses').update({ status: 'draft' }).eq('id', courseId);
        if (error) { toast('Failed: ' + error.message, 'error'); return; }
        courseData.status = 'draft';
        renderStatusBadge();
        toast('Course unpublished (now Draft).');
        return;
    }

    const issues = prePublishCheck();
    if (issues.length > 0) {
        alert('Cannot publish yet:\n\n• ' + issues.join('\n• '));
        return;
    }
    if (!confirm('Publish this course? It will become visible to enrolled students.')) return;
    const { error } = await sb.from('courses').update({ status: 'published' }).eq('id', courseId);
    if (error) { toast('Failed: ' + error.message, 'error'); return; }
    courseData.status = 'published';
    renderStatusBadge();
    toast('Course published.');
}

function prePublishCheck() {
    const issues = [];
    if (!courseData?.title?.trim()) issues.push('Course title is missing.');
    if (!courseData?.description?.trim()) issues.push('Course description is missing.');
    if (!courseData?.thumbnail) issues.push('Course thumbnail is missing.');
    if (lessonsCache.length === 0) issues.push('Course has no lessons.');
    const emptyLessons = lessonsCache.filter(l => !l.title || l.title === 'New Lesson');
    if (emptyLessons.length > 0) issues.push(`${emptyLessons.length} lesson(s) still have placeholder titles.`);
    return issues;
}

window.openPreview = function () {
    window.open(`/student/#course?id=${courseId}&preview=1`, '_blank');
}

/* ----------------------------------------------------------
   Small helpers
   ---------------------------------------------------------- */
function isValidHttpUrl(value) {
    try {
        const u = new URL(value);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
}

function toast(msg, type = 'info') {
    let host = document.getElementById('builderToastHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'builderToastHost';
        host.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:340px';
        document.body.appendChild(host);
    }
    const el = document.createElement('div');
    const bg = type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#e0f2fe';
    const fg = type === 'error' ? '#991b1b' : type === 'success' ? '#166534' : '#075985';
    el.style.cssText = `background:${bg};color:${fg};padding:10px 14px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.1);font-size:.9rem`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3500);
}

/* ----------------------------------------------------------
   Lesson Assignments (per-lesson CRUD inside builder)
   ---------------------------------------------------------- */
let lessonAssignmentsCache = [];
let editingAssignmentId = null;

async function loadAssignmentsForLesson() {
    const list = document.getElementById('assignmentsList');
    if (!activeLessonId) {
        list.innerHTML = '<p style="color:var(--gray-500)">Select a lesson first.</p>';
        return;
    }
    list.innerHTML = '<p style="color:var(--gray-400)">Loading…</p>';

    const sb = window.WebGeniusDB.supabase;
    const { data, error } = await sb
        .from('assignments')
        .select('*')
        .eq('lesson_id', activeLessonId)
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<p style="color:var(--error-600,#dc2626)">Failed to load: ${esc(error.message)}</p>`;
        return;
    }
    lessonAssignmentsCache = data || [];
    renderAssignmentsList();
    updateAssignCountBadge();
}

function renderAssignmentsList() {
    const list = document.getElementById('assignmentsList');
    if (lessonAssignmentsCache.length === 0) {
        list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:var(--space-lg) 0">No assignments for this lesson yet.</p>';
        return;
    }
    list.innerHTML = lessonAssignmentsCache.map(a => `
        <div style="border:1px solid var(--gray-200);border-radius:6px;padding:var(--space-md);margin-bottom:var(--space-sm);background:#fff">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-md)">
                <div style="flex:1;min-width:0">
                    <div style="font-weight:600;color:var(--gray-900)">${esc(a.title)}</div>
                    ${a.description ? `<div style="color:var(--gray-600);font-size:.88rem;margin-top:4px;white-space:pre-wrap">${esc(a.description)}</div>` : ''}
                    <div style="margin-top:8px;display:flex;gap:10px;font-size:.78rem;color:var(--gray-500)">
                        <span>Due +${a.due_offset_days ?? 7}d</span>
                        <span>${a.max_points ?? 100} pts</span>
                    </div>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0">
                    <button class="btn-sm btn-edit" onclick="openAssignmentEditor('${a.id}')">Edit</button>
                    <button class="btn-sm btn-danger" onclick="deleteAssignment('${a.id}')">🗑</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateAssignCountBadge() {
    const badge = document.getElementById('assignCountBadge');
    if (!badge) return;
    if (lessonAssignmentsCache.length > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = String(lessonAssignmentsCache.length);
    } else {
        badge.style.display = 'none';
    }
}

window.openAssignmentEditor = function (id = null) {
    if (!activeLessonId) { alert('Select a lesson first.'); return; }
    editingAssignmentId = id;
    const a = id ? lessonAssignmentsCache.find(x => x.id === id) : null;
    document.getElementById('assignModalTitle').textContent = a ? 'Edit Assignment' : 'New Assignment';
    document.getElementById('assignTitle').value = a?.title || '';
    document.getElementById('assignDesc').value = a?.description || '';
    document.getElementById('assignDue').value = a?.due_offset_days ?? 7;
    document.getElementById('assignPoints').value = a?.max_points ?? 100;
    document.getElementById('assignModalOverlay').classList.add('open');
    setTimeout(() => document.getElementById('assignTitle').focus(), 50);
}

window.closeAssignmentEditor = function () {
    document.getElementById('assignModalOverlay').classList.remove('open');
    editingAssignmentId = null;
}

window.saveAssignmentEditor = async function () {
    const title = document.getElementById('assignTitle').value.trim();
    if (!title) { alert('Title is required.'); return; }
    if (title.length > 255) { alert('Title is too long (max 255 characters).'); return; }

    const due = parseInt(document.getElementById('assignDue').value);
    const pts = parseInt(document.getElementById('assignPoints').value);
    if (isNaN(due) || due < 0) { alert('Due offset must be 0 or greater.'); return; }
    if (isNaN(pts) || pts < 0) { alert('Max points must be 0 or greater.'); return; }

    const payload = {
        title,
        description: document.getElementById('assignDesc').value.trim(),
        due_offset_days: due,
        max_points: pts
    };

    const sb = window.WebGeniusDB.supabase;
    if (editingAssignmentId) {
        const { error } = await sb.from('assignments').update(payload).eq('id', editingAssignmentId);
        if (error) { toast('Failed: ' + error.message, 'error'); return; }
        const idx = lessonAssignmentsCache.findIndex(a => a.id === editingAssignmentId);
        if (idx !== -1) Object.assign(lessonAssignmentsCache[idx], payload);
    } else {
        payload.lesson_id = activeLessonId;
        const { data, error } = await sb.from('assignments').insert(payload).select().single();
        if (error) { toast('Failed: ' + error.message, 'error'); return; }
        lessonAssignmentsCache.unshift(data);
    }
    closeAssignmentEditor();
    renderAssignmentsList();
    updateAssignCountBadge();
    toast('Assignment saved.', 'success');
}

window.deleteAssignment = async function (id) {
    if (!confirm('Delete this assignment? All student submissions will also be deleted.')) return;
    const sb = window.WebGeniusDB.supabase;
    const { error } = await sb.from('assignments').delete().eq('id', id);
    if (error) { toast('Failed: ' + error.message, 'error'); return; }
    lessonAssignmentsCache = lessonAssignmentsCache.filter(a => a.id !== id);
    renderAssignmentsList();
    updateAssignCountBadge();
    toast('Assignment deleted.');
}

/* ----------------------------------------------------------
   Lesson Revision History
   ---------------------------------------------------------- */
const SNAPSHOT_MIN_INTERVAL_MS = 60 * 1000;
const lastSnapshotAt = new Map(); // lessonId -> timestamp

async function snapshotLessonRevision(lessonId, updates) {
    const prev = lastSnapshotAt.get(lessonId) || 0;
    if (Date.now() - prev < SNAPSHOT_MIN_INTERVAL_MS) return;

    const sb = window.WebGeniusDB.supabase;
    const { data: session } = await sb.auth.getUser();
    const userId = session?.user?.id || null;

    const payload = {
        lesson_id: lessonId,
        title: updates.title,
        video_url: updates.video_url || null,
        duration_min: updates.duration_min || 0,
        is_free: !!updates.is_free,
        content: updates.content || {},
        edited_by: userId
    };

    const { error } = await sb.from('lesson_revisions').insert(payload);
    if (!error) lastSnapshotAt.set(lessonId, Date.now());
}

window.openRevisionHistory = async function () {
    if (!activeLessonId) { alert('Select a lesson first.'); return; }
    const overlay = document.getElementById('revisionsModalOverlay');
    const body = document.getElementById('revisionsList');
    overlay.classList.add('open');
    body.innerHTML = '<p style="color:var(--gray-400)">Loading…</p>';

    const sb = window.WebGeniusDB.supabase;
    const { data, error } = await sb
        .from('lesson_revisions')
        .select('*, profiles:edited_by(full_name)')
        .eq('lesson_id', activeLessonId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        body.innerHTML = `<p style="color:#dc2626">Failed to load: ${esc(error.message)}</p>`;
        return;
    }
    if (!data?.length) {
        body.innerHTML = '<p style="color:var(--gray-500)">No revisions yet. Snapshots are created automatically when you edit a lesson.</p>';
        return;
    }

    body.innerHTML = data.map(r => {
        const date = new Date(r.created_at).toLocaleString();
        const author = r.profiles?.full_name || 'Unknown';
        return `
        <div style="border:1px solid var(--gray-200);border-radius:6px;padding:var(--space-sm) var(--space-md);margin-bottom:var(--space-xs);display:flex;justify-content:space-between;align-items:center;gap:var(--space-md)">
            <div style="flex:1;min-width:0">
                <div style="font-weight:600;color:var(--gray-800);font-size:.9rem">${esc(r.title || '(untitled)')}</div>
                <div style="font-size:.75rem;color:var(--gray-500)">${esc(date)} · ${esc(author)} · ${r.duration_min || 0}m${r.is_free ? ' · free' : ''}</div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
                <button class="btn-sm btn-edit" onclick="previewRevision('${r.id}')">Preview</button>
                <button class="btn-sm btn-primary" onclick="restoreRevision('${r.id}')">Restore</button>
            </div>
        </div>`;
    }).join('');
}

window.closeRevisionHistory = function () {
    document.getElementById('revisionsModalOverlay').classList.remove('open');
    const preview = document.getElementById('revisionPreview');
    if (preview) preview.innerHTML = '';
}

window.previewRevision = async function (id) {
    const sb = window.WebGeniusDB.supabase;
    const { data, error } = await sb.from('lesson_revisions').select('*').eq('id', id).single();
    if (error) { toast('Preview failed: ' + error.message, 'error'); return; }
    const host = document.getElementById('revisionPreview');
    host.innerHTML = `
        <h4 style="margin:0 0 var(--space-sm)">${esc(data.title || '(untitled)')}</h4>
        <div style="border:1px solid var(--gray-200);border-radius:6px;padding:var(--space-md);max-height:400px;overflow-y:auto;background:#fff">${data.content?.html || '<p style="color:var(--gray-400)">(empty)</p>'}</div>
    `;
}

window.restoreRevision = async function (id) {
    if (!confirm('Restore this revision? The current lesson content will be overwritten. A snapshot of the current state will be taken first.')) return;
    const sb = window.WebGeniusDB.supabase;

    // Force a snapshot of the current state so this action is reversible.
    lastSnapshotAt.delete(activeLessonId);
    if (isDirty) await flushSave();

    const { data: rev, error: rErr } = await sb.from('lesson_revisions').select('*').eq('id', id).single();
    if (rErr) { toast('Restore failed: ' + rErr.message, 'error'); return; }

    const updates = {
        title: rev.title || 'Untitled',
        video_url: rev.video_url || null,
        duration_min: rev.duration_min || 0,
        is_free: !!rev.is_free,
        content: rev.content || {},
        updated_at: new Date().toISOString()
    };

    const { error } = await sb.from('lessons').update(updates).eq('id', activeLessonId);
    if (error) { toast('Restore failed: ' + error.message, 'error'); return; }

    const idx = lessonsCache.findIndex(l => l.id === activeLessonId);
    if (idx !== -1) Object.assign(lessonsCache[idx], updates);

    // Re-populate the editor UI in place.
    document.getElementById('editTitle').value = updates.title;
    document.getElementById('editVideoUrl').value = updates.video_url || '';
    document.getElementById('editDuration').value = updates.duration_min || '';
    document.getElementById('editIsFree').checked = !!updates.is_free;
    if (editor) editor.commands.setContent(updates.content?.html || '<p></p>', false);

    isDirty = false;
    lastSavedAt = Date.now();
    refreshSavedAtLabel();
    renderStructure();
    closeRevisionHistory();
    toast('Revision restored.', 'success');
}

/* ----------------------------------------------------------
   Lesson Attachments
   ---------------------------------------------------------- */
let attachmentsCache = [];

async function loadAttachmentsForLesson() {
    const list = document.getElementById('attachmentsList');
    if (!list) return;
    if (!activeLessonId) { list.innerHTML = ''; return; }

    list.innerHTML = '<p style="color:var(--gray-400);font-size:.85rem">Loading…</p>';
    const sb = window.WebGeniusDB.supabase;
    const { data, error } = await sb
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', activeLessonId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        list.innerHTML = `<p style="color:#dc2626;font-size:.85rem">Failed to load attachments: ${esc(error.message)}</p>`;
        return;
    }
    attachmentsCache = data || [];
    renderAttachmentsList();
}

function renderAttachmentsList() {
    const list = document.getElementById('attachmentsList');
    if (!list) return;
    if (attachmentsCache.length === 0) {
        list.innerHTML = '<p style="color:var(--gray-500);font-size:.85rem">No attachments yet.</p>';
        return;
    }
    list.innerHTML = attachmentsCache.map(a => `
        <div style="display:flex;align-items:center;gap:.6rem;padding:.5rem .7rem;border:1px solid var(--gray-200);border-radius:6px;margin-bottom:6px;background:#fff">
            <span style="font-size:1.1rem">${fileIcon(a.mime_type)}</span>
            <div style="flex:1;min-width:0">
                <div style="font-size:.88rem;color:var(--gray-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.file_name)}</div>
                <div style="font-size:.72rem;color:var(--gray-500)">${formatBytes(a.file_size)}</div>
            </div>
            <button class="btn-sm btn-edit" onclick="downloadAttachment('${a.id}')">⬇</button>
            <button class="btn-sm btn-danger" onclick="deleteAttachment('${a.id}')">✕</button>
        </div>
    `).join('');
}

window.handleAttachmentUpload = async function (input) {
    if (!activeLessonId) { alert('Select a lesson first.'); input.value = ''; return; }
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('File must be under 50 MB.'); input.value = ''; return; }

    const host = input.closest('label');
    const prev = host ? host.innerHTML : null;
    if (host) host.innerHTML = 'Uploading…';

    try {
        const uploaded = await window.uploadLessonAttachment(file, activeLessonId);
        const sb = window.WebGeniusDB.supabase;
        const { data, error } = await sb.from('lesson_attachments').insert({
            lesson_id: activeLessonId,
            file_path: uploaded.path,
            file_name: uploaded.file_name,
            file_size: uploaded.file_size,
            mime_type: uploaded.mime_type,
            sort_order: attachmentsCache.length
        }).select().single();

        if (error) {
            await window.deleteLessonAttachment(uploaded.path).catch(() => { });
            throw error;
        }
        attachmentsCache.push(data);
        renderAttachmentsList();
        toast('Attachment uploaded.', 'success');
    } catch (e) {
        toast('Upload failed: ' + (e?.message || 'unknown'), 'error');
    } finally {
        if (host && prev) host.innerHTML = prev;
        input.value = '';
    }
}

window.downloadAttachment = async function (id) {
    const a = attachmentsCache.find(x => x.id === id);
    if (!a) return;
    try {
        const url = await window.getLessonAttachmentUrl(a.file_path, 300);
        window.open(url, '_blank');
    } catch (e) {
        toast('Could not open file: ' + (e?.message || 'unknown'), 'error');
    }
}

window.deleteAttachment = async function (id) {
    const a = attachmentsCache.find(x => x.id === id);
    if (!a) return;
    if (!confirm(`Delete "${a.file_name}"?`)) return;

    const sb = window.WebGeniusDB.supabase;
    try {
        await window.deleteLessonAttachment(a.file_path);
    } catch (e) {
        console.warn('Storage delete failed (continuing):', e);
    }
    const { error } = await sb.from('lesson_attachments').delete().eq('id', id);
    if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
    attachmentsCache = attachmentsCache.filter(x => x.id !== id);
    renderAttachmentsList();
    toast('Attachment deleted.');
}

function fileIcon(mime) {
    if (!mime) return '📎';
    if (mime.startsWith('image/')) return '🖼';
    if (mime === 'application/pdf') return '📕';
    if (mime.includes('zip')) return '🗜';
    if (mime.includes('word')) return '📄';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊';
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return '📈';
    if (mime.startsWith('text/')) return '📝';
    return '📎';
}

function formatBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.module-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
