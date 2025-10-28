// views/termine.js
(() => {
  const UPC = document.getElementById('upcoming');
  const PAST = document.getElementById('past');
  const EMPTY = document.getElementById('emptyState');
  const REFRESH = document.getElementById('refreshBtn');

  const user = window.currentUserName || null;

  function loadStore() {
    try { return JSON.parse(localStorage.getItem('kal_data') || '{}'); }
    catch { return {}; }
  }

  function toDateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function parseISODate(tag) {
    // tag = "YYYY-MM-DD"
    const [y,m,dd] = tag.split('-').map(n=>parseInt(n,10));
    return new Date(y, m-1, dd);
  }

  const DAYS = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  function prettyDate(d) {
    const wd = DAYS[d.getDay()];
    return `${wd}, ${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  }

  function renderItem({tag, slot}) {
    const d = parseISODate(tag);
    const html = `
      <article class="termin">
        <h3 class="title">Gebuchter Termin</h3>
        <p class="meta">📅 ${prettyDate(d)} &nbsp;•&nbsp; ⏰ ${slot}</p>
        <div class="row">
          <span class="badge"><span>👤</span><span class="muted">${user || 'Gast'}</span></span>
          <span class="badge"><span>📍</span><span class="muted">Kalender</span></span>
        </div>
      </article>
    `;
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstElementChild;
  }

  function collectMySlots() {
    const store = loadStore();
    const out = [];
    Object.entries(store).forEach(([tag, slots]) => {
      Object.entries(slots).forEach(([slot, who]) => {
        if (!user) return;            // nur für eingeloggte Nutzer
        if (who === user) out.push({ tag, slot });
      });
    });
    // sort by date then time
    out.sort((a,b) => (a.tag.localeCompare(b.tag)) || (a.slot.localeCompare(b.slot)));
    return out;
  }

  function splitUpcomingPast(items) {
    const today = toDateOnly(new Date());
    const upcoming = [];
    const past = [];
    items.forEach(it => {
      const d = toDateOnly(parseISODate(it.tag));
      if (d >= today) upcoming.push(it); else past.push(it);
    });
    return { upcoming, past };
  }

  function render() {
    UPC.innerHTML = '';
    PAST.innerHTML = '';

    const items = collectMySlots();
    const {upcoming, past} = splitUpcomingPast(items);

    if (upcoming.length === 0 && past.length === 0) {
      EMPTY.hidden = false;
      return;
    }
    EMPTY.hidden = true;

    upcoming.forEach(it => UPC.appendChild(renderItem(it)));
    past.slice().reverse().forEach(it => PAST.appendChild(renderItem(it))); // neueste zuerst unten->oben?
  }

  // refresh button
  REFRESH?.addEventListener('click', render);

  // auto-update, falls Kalender in anderem Tab geändert wird
  window.addEventListener('storage', (e) => {
    if (e.key === 'kal_data') render();
  });

  // kleine Verzögerung, bis window.currentUserName gesetzt wurde
  document.addEventListener('DOMContentLoaded', () => {
    // falls parent-App den Namen etwas später setzt:
    setTimeout(render, 150);
  });
})();
