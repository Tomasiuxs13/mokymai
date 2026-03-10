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

    await loadCourseData();
    initEditor();
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

    // 1. Render Modules
    modulesCache.forEach(mod => {
        const modEl = document.createElement('div');
        modEl.className = 'module-item';
        modEl.dataset.id = mod.id;
        modEl.draggable = true;
        modEl.ondragstart = window.handleModuleDragStart;
        modEl.ondragover = window.handleModuleDragOver; // Allow dropping other modules here to reorder
        modEl.ondrop = window.handleModuleDrop;

        modEl.innerHTML = `
      <div class="module-header">
        <div style="display:flex;align-items:center;gap:10px">
            <span style="cursor:grab;color:var(--gray-400)">☰</span>
            <span>${esc(mod.title)}</span>
        </div>
        <div style="font-size:0.8rem">
            <button class="btn-sm" onclick="editModule('${mod.id}')">✏️</button>
            <button class="btn-sm btn-danger" onclick="deleteModule('${mod.id}')">🗑️</button>
        </div>
      </div>
      <div class="module-lessons" data-module-id="${mod.id}">
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
        unassignedEl.style.borderColor = '#fbbf24'; // Amber
        unassignedEl.innerHTML = `
      <div class="module-header" style="background:#fffbeb">
        <span>Unassigned / General</span>
      </div>
      <div class="module-lessons" data-module-id="null"></div>
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
            lessonEl.onclick = () => selectLesson(lesson.id);
            lessonEl.ondragstart = handleDragStart;
            lessonEl.innerHTML = `
        <span class="drag-handle">☰</span>
        <span style="flex:1">${esc(lesson.title)}</span>
        <span style="font-size:0.75rem;color:var(--gray-400)">${lesson.duration_min}m</span>
      `;
            parentContainer.appendChild(lessonEl);
        }
    });

    // Init drag and drop zones
    document.querySelectorAll('.module-lessons').forEach(zone => {
        zone.ondragover = handleDragOver;
        zone.ondrop = handleDrop;
    });
}

/* ----------------------------------------------------------
   Selection & Editing
   ---------------------------------------------------------- */
function selectLesson(id) {
    if (isDirty) {
        if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    isDirty = false;
    updateSaveBar();

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

    // Editor Content
    if (editor) {
        const content = lesson.content?.html || '<p></p>';
        editor.commands.setContent(content);
    }
}

function markDirty() {
    isDirty = true;
    updateSaveBar();
}

function updateSaveBar() {
    const bar = document.getElementById('saveBar');
    if (isDirty) bar.classList.add('visible');
    else bar.classList.remove('visible');
}

async function saveCurrent() {
    if (!activeLessonId) return;

    const title = document.getElementById('editTitle').value;
    const video_url = document.getElementById('editVideoUrl').value;
    const duration_min = parseInt(document.getElementById('editDuration').value) || 0;
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

    const sb = window.WebGeniusDB.supabase;
    const { error } = await sb.from('lessons').update(updates).eq('id', activeLessonId);

    if (error) {
        alert('Error saving: ' + error.message);
        return;
    }

    // Update Cache
    const idx = lessonsCache.findIndex(l => l.id === activeLessonId);
    if (idx !== -1) {
        Object.assign(lessonsCache[idx], updates);
    }

    isDirty = false;
    updateSaveBar();
    renderStructure(); // Refresh titles etc
}

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

    // Move in DOM
    zone.appendChild(draggedItem);

    // Update Data
    const lessonId = draggedItem.dataset.id;
    const moduleId = zone.dataset.moduleId === 'null' ? null : zone.dataset.moduleId;

    // Update local cache
    const lesson = lessonsCache.find(l => l.id === lessonId);
    if (lesson) {
        lesson.module_id = moduleId;
    }

    // Persist Move
    const sb = window.WebGeniusDB.supabase;
    await sb.from('lessons').update({ module_id: moduleId }).eq('id', lessonId);
}

/* ----------------------------------------------------------
   Module Management
   ---------------------------------------------------------- */
async function addModule() {
    const title = prompt('Module Title:');
    if (!title) return;

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
            Link,
            Image,
        ],
        content: '<p>Loading editor...</p>',
        onUpdate: () => {
            markDirty();
        }
    });
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

    // Find the clicked tab element by text content logic or passed event (simplifying here)
    // Actually easier to just select by onclick attrib match or ID
    const tabs = document.querySelectorAll('.tab');
    if (tabName === 'content') tabs[0].classList.add('active');
    if (tabName === 'settings') tabs[1].classList.add('active');

    document.getElementById(`tab-${tabName}`).style.display = 'block';
}

window.addModule = addModule;
window.addLesson = addLesson;
window.editModule = async (id) => {
    const mod = modulesCache.find(m => m.id === id);
    const newTitle = prompt('Rename Module:', mod.title);
    if (newTitle && newTitle !== mod.title) {
        const sb = window.WebGeniusDB.supabase;
        await sb.from('modules').update({ title: newTitle }).eq('id', id);
        mod.title = newTitle;
        renderStructure();
    }
}
window.deleteModule = async (id) => {
    if (!confirm('Delete this module? Lessons will be unassigned.')) return;
    const sb = window.WebGeniusDB.supabase;
    await sb.from('modules').delete().eq('id', id);
    modulesCache = modulesCache.filter(m => m.id !== id);
    // Move lessons in cache to unassigned
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
    const title = document.getElementById('setCourseTitle').value;
    const thumbnail = document.getElementById('setCourseThumb').value;
    const description = document.getElementById('setCourseDesc').value;

    if (!title) return alert('Title is required');

    const sb = window.WebGeniusDB.supabase;
    const { error } = await sb.from('courses').update({
        title, thumbnail, description, updated_at: new Date().toISOString()
    }).eq('id', courseId);

    if (error) {
        alert('Error saving settings: ' + error.message);
        return;
    }

    // Update local data
    courseData.title = title;
    courseData.thumbnail = thumbnail;
    courseData.description = description;

    document.getElementById('courseNameTitle').innerText = title;
    document.title = `Builder: ${title}`;

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
