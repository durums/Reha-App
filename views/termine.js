(() => {
  const LIST = document.getElementById("termineList");
  const FILTER_BTNS = document.querySelectorAll('.termine-toolbar .filters button');

  // aus Kalender wiederverwenden
  const START = 8, END = 17;
  const storageKey = "kal_data";
  const user = window.currentUserName || "Gast";

  // --- Utilities ---
  const pad = n => String(n).padStart(2,"0");
  const dOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const ymd = d => d.toISOString().slice(0,10);
  const parseYmd = s => new Date(s + "T00:00:00");
  const fmtDate = d => d.toLocaleDateString("de-DE",{weekday:"short", day:"2-digit", month:"long", year:"numeric"});
  const fmtTime = s => s; // "08:00" etc.

  function loadStore(){
    try { return JSON.parse(localStorage.getItem(storageKey)||"{}"); }
    catch { return {}; }
  }

  function allMyAppointments(){
    const store = loadStore();
    const out = [];
    for (const [date, slots] of Object.entries(store)) {
      for (const [slot, who] of Object.entries(slots)) {
        if (who === user) out.push({ date, slot });
      }
    }
    // sort desc by date+time
    out.sort((a,b)=> (a.date.localeCompare(b.date)) || (a.slot.localeCompare(b.slot)));
    return out;
  }

  // --- Render ---
  function render(filter="upcoming"){
    if (!LIST) return;

    const now = dOnly(new Date());
    const mine = allMyAppointments();
    const filtered = mine.filter(x => {
      const d = dOnly(parseYmd(x.date));
      if (filter === "upcoming")  return d >= now;
      if (filter === "past")      return d <  now;
      return true;
    });

    // gruppieren nach Tag
    const groups = new Map();
    for (const ap of filtered) {
      if (!groups.has(ap.date)) groups.set(ap.date, []);
      groups.get(ap.date).push(ap);
    }

    LIST.innerHTML = "";

    if (filtered.length === 0) {
      LIST.innerHTML = `<div class="termine-card">Keine Termine für diese Auswahl.</div>`;
      return;
    }

    // Ausgabe in Tag-Gruppen
    [...groups.keys()].sort().forEach(date => {
      const day = parseYmd(date);
      const isPast = dOnly(day) < now;

      const dayLabel = document.createElement("div");
      dayLabel.className = "termine-day";
      dayLabel.textContent = fmtDate(day);
      LIST.append(dayLabel);

      groups.get(date).forEach(ap => {
        const card = document.createElement("div");
        card.className = "termine-card";

        card.innerHTML = `
          <div class="termine-row">
            <div class="termine-time">${fmtTime(ap.slot)}</div>
            <div class="termine-title">Reha-Termin</div>
            <div class="termine-badge ${isPast ? "past" : "upcoming"}">
              ${isPast ? "abgeschlossen" : "anstehend"}
            </div>
          </div>
          <div class="termine-meta">Datum: ${date}</div>
          <div class="termine-actions">
            ${!isPast ? `<button class="primary" data-act="move" data-date="${date}" data-slot="${ap.slot}">Verschieben</button>` : ""}
            <button data-act="cancel" data-date="${date}" data-slot="${ap.slot}">Absagen</button>
          </div>
        `;
        LIST.append(card);
      });
    });
  }

  // --- Actions (verschieben/absagen) ---
  LIST?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const act  = btn.dataset.act;
    const date = btn.dataset.date;
    const slot = btn.dataset.slot;

    if (act === "cancel") {
      const store = loadStore();
      if (store[date] && store[date][slot] === user) {
        delete store[date][slot];
        if (Object.keys(store[date]).length === 0) delete store[date];
        localStorage.setItem(storageKey, JSON.stringify(store));
        render(currentFilter());
      } else {
        alert("Termin kann nicht storniert werden.");
      }
    }

    if (act === "move") {
      // simple: neue Zeit eingeben
      const ns = prompt("Neue Uhrzeit (z. B. 14:00)?");
      if (!ns || !/^\d{2}:\d{2}$/.test(ns)) return;
      const store = loadStore();
      if (!store[date]) store[date] = {};
      if (store[date][ns]) return alert("Slot ist belegt.");
      // alten löschen, neuen setzen
      delete store[date][slot];
      store[date][ns] = user;
      localStorage.setItem(storageKey, JSON.stringify(store));
      render(currentFilter());
    }
  });

  // --- Filter oben ---
  function currentFilter(){
    const active = document.querySelector('.termine-toolbar .filters button.active');
    return active?.dataset.filter || "upcoming";
  }

  FILTER_BTNS.forEach(b=>{
    b.addEventListener("click", ()=>{
      FILTER_BTNS.forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      render(b.dataset.filter);
    });
  });

  // --- Start ---
  // robust, auch wenn die View dynamisch eingefügt wurde
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ()=> render("upcoming"));
  } else {
    render("upcoming");
  }
})();
