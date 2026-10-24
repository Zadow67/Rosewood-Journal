const KEY = 'rosewoodJournalV2';
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
let searchTerm = '',
    sortMode = 'newest';
$('date').value = today();

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
        alert('Could not save. Browser storage may be full.');
    }
}

function render() {
    let filtered = entries.filter(e => [e.title, e.reflection, e.mood, ...e.tags].join(' ').toLowerCase().includes(searchTerm.toLowerCase()));
    filtered.sort((a, b) => sortMode === 'oldest' ? a.date.localeCompare(b.date) : sortMode === 'favorites' ? Number(b.favorite) - Number(a.favorite) || b.date.localeCompare(a.date) : b.date.localeCompare(a.date));
    $('entryCount').textContent = `${filtered.length} shown · ${entries.length} total`;
    $('entries').innerHTML = filtered.length ? filtered.map(e => `<article class="entry"><div class="entry-top"><div><h3>${esc(e.title)}</h3><div class="meta">${esc(e.date)} · ${esc(e.mood)}${e.favorite?' · Favorite':''}</div></div><div class="entry-actions"><button class="secondary" data-fav="${esc(e.id)}" aria-label="Toggle favorite">${e.favorite?'♥':'♡'}</button><button class="danger" data-delete="${esc(e.id)}">Delete</button></div></div><p>${esc(e.reflection)}</p><div>${e.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></article>`).join('') : '<div class="empty">No entries match. Try another search or write a new entry.</div>';
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
    entries.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
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
    $('mood').value = 'Calm';
});
$('search').addEventListener('input', e => {
    searchTerm = e.target.value;
    render();
});
$('sort').addEventListener('change', e => {
    sortMode = e.target.value;
    render();
});
$('entries').addEventListener('click', e => {
    const fav = e.target.closest('[data-fav]'),
        del = e.target.closest('[data-delete]');
    if (fav) {
        const item = entries.find(x => x.id === fav.dataset.fav);
        if (item) item.favorite = !item.favorite;
        save();
        render();
    }
    if (del) {
        if (!confirm('Delete this journal entry?')) return;
        entries = entries.filter(x => x.id !== del.dataset.delete);
        save();
        render();
    }
});
$('exportCsv').addEventListener('click', () => {
    const quote = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = [
        ['Title', 'Date', 'Mood', 'Reflection', 'Tags', 'Favorite'], ...entries.map(e => [e.title, e.date, e.mood, e.reflection, e.tags.join(', '), e.favorite ? 'Yes' : 'No'])
    ];
    const blob = new Blob([rows.map(r => r.map(quote).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob),
        a = document.createElement('a');
    a.href = url;
    a.download = 'rosewood-journal.csv';
    a.click();
    URL.revokeObjectURL(url);
});
render();