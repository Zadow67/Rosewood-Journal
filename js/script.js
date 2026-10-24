const KEY = 'rosewoodJournalV1';
const $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString('en-CA');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
} [c]));
let entries = [];
try {
    entries = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(entries)) entries = [];
} catch {
    entries = [];
}
$('date').value = today();

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
        alert('Could not save. Browser storage may be full.');
    }
}

function render() {
    const list = $('entries');
    $('entryCount').textContent = `${entries.length} ${entries.length===1?'entry':'entries'}`;
    if (!entries.length) {
        list.innerHTML = '<div class="empty">Your journal is empty. Add your first entry above.</div>';
        return;
    }
    list.innerHTML = [...entries].sort((a, b) => b.date.localeCompare(a.date)).map(e => `<article class="entry"><div class="entry-top"><div><h3>${esc(e.title)}</h3><div class="meta">${esc(e.date)}</div></div><button class="danger" data-delete="${esc(e.id)}" aria-label="Delete ${esc(e.title)}">Delete</button></div><p>${esc(e.reflection)}</p></article>`).join('');
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
    entries.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        title,
        reflection,
        date
    });
    save();
    render();
    $('entryForm').reset();
    $('date').value = today();
    $('title').focus();
});
$('entries').addEventListener('click', e => {
    const b = e.target.closest('[data-delete]');
    if (!b) return;
    if (!confirm('Delete this journal entry?')) return;
    entries = entries.filter(x => x.id !== b.dataset.delete);
    save();
    render();
});
render();