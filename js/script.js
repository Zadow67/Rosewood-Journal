const KEY = 'rosewoodJournalV3';
const $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString('en-CA');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
} [c]));
const defaults = () => ({
    entries: [],
    tasks: [],
    habits: [],
    theme: 'light'
});
let data = defaults(),
    searchTerm = '',
    sortMode = 'newest';
try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (parsed && typeof parsed === 'object') {
        data = {
            ...defaults(),
            ...parsed
        };
        for (const k of ['entries', 'tasks', 'habits'])
            if (!Array.isArray(data[k])) data[k] = [];
    }
} catch {
    data = defaults();
}
$('date').value = today();

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
        alert('Could not save. Export a backup and clear some browser storage.');
    }
}

function renderEntries() {
    let items = data.entries.filter(e => [e.title, e.reflection, e.mood, ...e.tags].join(' ').toLowerCase().includes(searchTerm.toLowerCase()));
    items.sort((a, b) => sortMode === 'oldest' ? a.date.localeCompare(b.date) : sortMode === 'favorites' ? Number(b.favorite) - Number(a.favorite) || b.date.localeCompare(a.date) : b.date.localeCompare(a.date));
    $('entryCount').textContent = `${items.length} shown · ${data.entries.length} total`;
    $('entries').innerHTML = items.length ? items.map(e => `<article class="entry"><div class="entry-top"><div><h3>${esc(e.title)}</h3><div class="meta">${esc(e.date)} · ${esc(e.mood)}${e.favorite?' · Favorite':''}</div></div><div class="entry-actions"><button class="secondary" data-fav="${esc(e.id)}">${e.favorite?'♥':'♡'}</button><button class="danger" data-delete="${esc(e.id)}">Delete</button></div></div><p>${esc(e.reflection)}</p><div>${e.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></article>`).join('') : '<div class="empty">No entries match. Try another search or write a new entry.</div>';
}

function renderTasks() {
    $('tasks').innerHTML = data.tasks.length ? data.tasks.map(t => `<div class="task ${t.done?'done':''}"><input type="checkbox" data-task="${esc(t.id)}" ${t.done?'checked':''} aria-label="Mark ${esc(t.text)} complete"><span>${esc(t.text)}</span><button class="danger" data-task-delete="${esc(t.id)}">×</button></div>`).join('') : '<div class="empty">Your task list is clear.</div>';
    const done = data.tasks.filter(t => t.done).length;
    $('totalTasks').textContent = `${done}/${data.tasks.length}`;
}

function renderHabits() {
    $('habits').innerHTML = data.habits.length ? data.habits.map(h => `<div class="task"><input type="checkbox" data-habit="${esc(h.id)}" ${h.doneDates.includes(today())?'checked':''} aria-label="Mark ${esc(h.name)} done today"><span>${esc(h.name)}</span><button class="danger" data-habit-delete="${esc(h.id)}">×</button></div>`).join('') : '<div class="empty">Add one habit you want to make room for.</div>';
}

function render() {
    renderEntries();
    renderTasks();
    renderHabits();
    $('totalEntries').textContent = data.entries.length;
    $('totalFavorites').textContent = data.entries.filter(e => e.favorite).length;
    document.body.classList.toggle('dark', data.theme === 'dark');
    $('theme').textContent = data.theme === 'dark' ? 'Use light mode' : 'Use dark mode';
}
$('entryForm').addEventListener('submit', e => {
    e.preventDefault();
    const title = $('title').value.trim(),
        reflection = $('reflection').value.trim(),
        date = $('date').value;
    if (!title || !reflection || !date) {
        alert('Please fill in the title, date, and reflection.');
        return;
    }
    const tags = [...new Set($('tags').value.split(',').map(t => t.trim()).filter(Boolean))];
    data.entries.push({
        id: uid(),
        title,
        reflection,
        date,
        mood: $('mood').value,
        tags,
        favorite: false
    });
    save();
    render();
    $('entryForm').reset();
    $('date').value = today();
});
$('search').addEventListener('input', e => {
    searchTerm = e.target.value;
    renderEntries();
});
$('sort').addEventListener('change', e => {
    sortMode = e.target.value;
    renderEntries();
});
$('entries').addEventListener('click', e => {
    const fav = e.target.closest('[data-fav]'),
        del = e.target.closest('[data-delete]');
    if (fav) {
        const item = data.entries.find(x => x.id === fav.dataset.fav);
        if (item) item.favorite = !item.favorite;
    }
    if (del) {
        if (!confirm('Delete this journal entry?')) return;
        data.entries = data.entries.filter(x => x.id !== del.dataset.delete);
    }
    save();
    render();
});
$('taskForm').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('taskText').value.trim();
    if (!text) return;
    data.tasks.push({
        id: uid(),
        text,
        done: false
    });
    save();
    renderTasks();
    $('taskText').value = '';
});
$('tasks').addEventListener('change', e => {
    const id = e.target.dataset.task;
    if (!id) return;
    const task = data.tasks.find(t => t.id === id);
    if (task) task.done = e.target.checked;
    save();
    renderTasks();
});
$('tasks').addEventListener('click', e => {
    const b = e.target.closest('[data-task-delete]');
    if (!b) return;
    data.tasks = data.tasks.filter(t => t.id !== b.dataset.taskDelete);
    save();
    renderTasks();
});
$('habitForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('habitName').value.trim();
    if (!name) return;
    data.habits.push({
        id: uid(),
        name,
        doneDates: []
    });
    save();
    renderHabits();
    $('habitName').value = '';
});
$('habits').addEventListener('change', e => {
    const id = e.target.dataset.habit;
    if (!id) return;
    const habit = data.habits.find(h => h.id === id);
    if (!habit) return;
    habit.doneDates = habit.doneDates.filter(d => d !== today());
    if (e.target.checked) habit.doneDates.push(today());
    save();
    renderHabits();
});
$('habits').addEventListener('click', e => {
    const b = e.target.closest('[data-habit-delete]');
    if (!b) return;
    data.habits = data.habits.filter(h => h.id !== b.dataset.habitDelete);
    save();
    renderHabits();
});
$('theme').addEventListener('click', () => {
    data.theme = data.theme === 'dark' ? 'light' : 'dark';
    save();
    render();
});

function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], {
            type
        })),
        a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('exportCsv').addEventListener('click', () => {
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = [
        ['Title', 'Date', 'Mood', 'Reflection', 'Tags', 'Favorite'], ...data.entries.map(e => [e.title, e.date, e.mood, e.reflection, e.tags.join(', '), e.favorite ? 'Yes' : 'No'])
    ];
    download('rosewood-journal.csv', rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv;charset=utf-8;');
});
$('exportJson').addEventListener('click', () => download('rosewood-journal-backup.json', JSON.stringify(data, null, 2), 'application/json'));
$('importJson').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.habits)) throw new Error('This file does not look like a Rosewood backup.');
        if (!confirm('Replace your current journal, tasks, and habits with this backup?')) return;
        data = {
            ...defaults(),
            ...parsed
        };
        save();
        render();
    } catch (err) {
        alert('Could not import backup: ' + err.message);
    } finally {
        e.target.value = '';
    }
});
render();


const journalPrompts = ["What made today a little softer?", "What is one small thing you handled well?", "What feeling deserves a little space today?", "What can you let go of before tomorrow?", "What would 'enough' look like today?"];
let promptIndex = -1;
document.getElementById('newPrompt')?.addEventListener('click', () => {
    promptIndex = (promptIndex + 1) % journalPrompts.length;
    document.getElementById('promptText').textContent = journalPrompts[promptIndex];
});


let activeJournalTag = '';
const originalRenderEntries = renderEntries;
renderEntries = function () {
    const previous = data.entries;
    if (activeJournalTag) data.entries = previous.filter(e => (e.tags || []).includes(activeJournalTag));
    originalRenderEntries();
    data.entries = previous;
    const tags = [...new Set(data.entries.flatMap(e => e.tags || []))].sort();
    const wrap = document.getElementById('tagFilters');
    if (wrap) wrap.innerHTML = '<button class="secondary" data-tag-filter="">All tags</button>' + tags.map(t => '<button class="secondary" data-tag-filter="' + esc(t) + '">' + esc(t) + '</button>').join('');
};
document.getElementById('tagFilters')?.addEventListener('click', e => {
    const b = e.target.closest('[data-tag-filter]');
    if (!b) return;
    activeJournalTag = b.dataset.tagFilter;
    renderEntries();
});


const PRIORITY_KEY = 'rosewoodPrioritiesV1';
let priorities = [];
try {
    priorities = JSON.parse(localStorage.getItem(PRIORITY_KEY) || '[]');
    if (!Array.isArray(priorities)) priorities = [];
} catch {
    priorities = [];
}

function renderPriorities() {
    const el = document.getElementById('priorityList');
    if (!el) return;
    el.innerHTML = priorities.length ? priorities.map(p => '<div class="task ' + (p.done ? 'done' : '') + '"><input type="checkbox" data-priority-done="' + esc(p.id) + '" ' + (p.done ? 'checked' : '') + '><span>' + esc(p.text) + '</span><button class="danger" data-priority-delete="' + esc(p.id) + '">×</button></div>').join('') : '<div class="empty">Add one meaningful priority.</div>';
}
document.getElementById('priorityForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const text = document.getElementById('priorityText').value.trim();
    if (!text) return;
    priorities.push({
        id: uid(),
        text,
        done: false
    });
    localStorage.setItem(PRIORITY_KEY, JSON.stringify(priorities));
    e.target.reset();
    renderPriorities();
});
document.getElementById('priorityList')?.addEventListener('change', e => {
    const id = e.target.dataset.priorityDone;
    if (!id) return;
    const p = priorities.find(x => x.id === id);
    if (p) p.done = e.target.checked;
    localStorage.setItem(PRIORITY_KEY, JSON.stringify(priorities));
    renderPriorities();
});
document.getElementById('priorityList')?.addEventListener('click', e => {
    const b = e.target.closest('[data-priority-delete]');
    if (!b) return;
    priorities = priorities.filter(x => x.id !== b.dataset.priorityDelete);
    localStorage.setItem(PRIORITY_KEY, JSON.stringify(priorities));
    renderPriorities();
});
renderPriorities();


const REMINDER_KEY = 'rosewoodRemindersV1';
let reminders = [];
try {
    reminders = JSON.parse(localStorage.getItem(REMINDER_KEY) || '[]');
    if (!Array.isArray(reminders)) reminders = [];
} catch {}

function renderReminders() {
    const el = document.getElementById('reminderList');
    if (!el) return;
    el.innerHTML = reminders.length ? reminders.sort((a, b) => a.date.localeCompare(b.date)).map(r => '<div class="task"><span><strong>' + esc(r.text) + '</strong><small class="meta"> · Due ' + esc(r.date) + '</small></span><button class="danger" data-reminder-delete="' + esc(r.id) + '">×</button></div>').join('') : '<div class="empty">No reminders yet.</div>';
}
document.getElementById('reminderForm')?.addEventListener('submit', e => {
    e.preventDefault();
    reminders.push({
        id: uid(),
        text: document.getElementById('reminderText').value.trim(),
        date: document.getElementById('reminderDate').value
    });
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
    e.target.reset();
    renderReminders();
});
document.getElementById('reminderList')?.addEventListener('click', e => {
    const b = e.target.closest('[data-reminder-delete]');
    if (!b) return;
    reminders = reminders.filter(r => r.id !== b.dataset.reminderDelete);
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
    renderReminders();
});
renderReminders();