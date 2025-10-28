(() => {
  const LIST = document.getElementById("termineList");
  const FILTER_BTNS = document.querySelectorAll('.termine-toolbar .filters button');

  const STORAGE_KEY = "kal_data";
  const userId   = window.currentUserId   || "guest";
  const userName = window.currentUserName || "Gast";

  // --- Utils ---
  const dOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const ymd = d => d.toISOString().slice(0,10);
  const parseYmd = s => new Date(s + "T00:00:00");
  const fmtDate = d => d.toLocaleDateString("de-DE",{weekday:"short", day:"2-digit", month:"long", year:"numeric"});

  function loadStore(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"); }
    catch { return {}; }
  }

  // Alle Termine (nur eigene, es sei denn includeOthers=true)
  function allAppointments(includeOthers=false){
    const store = loadStore();
    const out = [];
    for (const [date, slots] of Object.entries(store)) {
      for (const [slot, who] of Object.entries(slots)) {
        const uid = typeof who === "string" ? null : who?.uid;
        const nm  = typeof who === "string" ? who : who?.name;
        const isMine = uid ? (uid === userId) : (nm === userName);
        if (includeOthers || isMine) out.push({ date, slot, name:nm, uid });
      }
    }
    return out.sort((a,b)=> (a.date.localeCompare(b.date)) || (a.slot.localeCompare(b.slot)));
  }

  function render(filter="upcoming"){
    if (!LIST) return;

    const now = dOnly(new Date());
    const mine = allAppointments(false); // nur eigene
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
            <div class="termine-time">${ap.slot}</div>
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

  // Aktionen
  LIST?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const act  = b.dataset.act;
    const date = b.dataset.date;
    const slot = b.dataset.slot;

    const store = loadStore();
    if (!store[date] || !store[date][slot]) return;

    // Nur eigene Termine bearbeiten (UID bevorzugt)
    const who = store[date][slot];
    const uid = typeof who === "string" ? null : who?.uid;
    const nm  = typeof who === "string" ? who : who?.name;
    const isMine = uid ? (uid === userId) : (nm === userName);
    if (!isMine) return alert("Du kannst nur deine eigenen Termine ändern.");

    if (act === "cancel") {
      delete store[date][slot];
      if (Object.keys(store[date]).length === 0) delete store[date];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      render(currentFilter());
    }

    if (act === "move") {
      const ns = prompt("Neue Uhrzeit (z. B. 14:00)?");
      if (!ns || !/^\d{2}:\d{2}$/.test(ns)) return;
      if (store[date] && store[date][ns]) return alert("Slot ist belegt.");
      // verschieben
      delete store[date][slot];
      if (!store[date]) store[date] = {};
      store[date][ns] = { uid: userId, name: userName }; // auf neues Schema setzen
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      render(currentFilter());
    }
  });

  // Filter-Buttons
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

  // Start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ()=> render("upcoming"));
  } else {
    render("upcoming");
  }
})();
