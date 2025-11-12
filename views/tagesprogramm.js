(() => {
  const $ = (id) => document.getElementById(id);
  const dayNames = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

  /* Datum */
  function loadDayDate() {
    const now = new Date();
    const el = $("dayDate");
    if (el) el.textContent = `${dayNames[now.getDay()]}, ${now.toLocaleDateString("de-DE")}`;
  }

  /* Trainingsplan (checkbar + Progress) */
  function loadTraining() {
    const now = new Date();
    const plans = [
      [
        { title: "Dehnung & Aufwärmen", meta: "15 Min." },
        { title: "Kraft Oberkörper",     meta: "30 Min." },
        { title: "Cool Down",            meta: "10 Min." }
      ],
      [
        { title: "Ergometer",            meta: "25 Min." },
        { title: "Atemübungen",          meta: "15 Min." },
        { title: "Dehnung",              meta: "10 Min." }
      ],
      [
        { title: "Ruhetag – Spaziergang", meta: "frei" },
        { title: "Leichte Mobilisation",  meta: "10 Min." }
      ],
    ];
    const plan = plans[now.getDay() % plans.length];

    const mount = $("trainingToday");
    if (!mount) return;

    mount.innerHTML = plan.map((p, idx) => `
      <label class="item">
        <input type="checkbox" data-idx="${idx}" />
        <div class="title">${p.title}</div>
        <div class="meta">${p.meta}</div>
      </label>
    `).join("");

    // Restore from localStorage (pro Tag)
    const key = `rehapp:training:${new Date().toISOString().slice(0,10)}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      saved.forEach(i => {
        const cb = mount.querySelector(`input[data-idx="${i}"]`);
        if (cb) cb.checked = true;
      });
    } catch {}

    // Events
    mount.addEventListener("change", (e) => {
      const cb = e.target.closest('input[type="checkbox"]');
      if (!cb) return;
      // speichern
      const all = [...mount.querySelectorAll('input[type="checkbox"]')];
      const checkedIdx = all.reduce((acc, el, i) => (el.checked && acc.push(i), acc), []);
      try { localStorage.setItem(key, JSON.stringify(checkedIdx)); } catch {}
      updateProgress(all);
    });

    // initial Progress
    updateProgress(mount.querySelectorAll('input[type="checkbox"]'));
  }

  function updateProgress(nodeList) {
    const list = Array.from(nodeList);
    const total = list.length || 1;
    const done  = list.filter(el => el.checked).length;
    const pct   = Math.round((done / total) * 100);

    const bar   = $("progressBar");
    const label = $("progressLabel");
    if (bar)   bar.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}% erledigt`;
  }

  /* Termine aus Kalender-LS */
  function loadAppointments() {
    const list = $("todayAppointments");
    if (!list) return;
    list.innerHTML = "";

    try {
      const store = JSON.parse(localStorage.getItem("kal_data") || "{}");
      const today = new Date().toISOString().slice(0,10);
      const user  = window.currentUserName || "Gast";

      const entries = store[today] ? Object.entries(store[today]) : [];
      const mine    = entries.filter(([_, name]) => name === user);

      if (!store[today] || entries.length === 0) {
        list.innerHTML = `<li><span class="badge-time">—</span> Keine Termine heute.</li>`;
        return;
      }
      if (mine.length === 0) {
        list.innerHTML = `<li><span class="badge-time">—</span> Keine eigenen Termine heute.</li>`;
        return;
      }

      mine
        .sort(([a], [b]) => a.localeCompare(b, "de"))
        .forEach(([time, name]) => {
          const li = document.createElement("li");
          li.innerHTML = `<span class="badge-time">${time}</span> ${name}`;
          list.appendChild(li);
        });
    } catch (e) {
      list.innerHTML = `<li><span class="badge-time">!</span> Fehler beim Laden der Termine.</li>`;
      console.error(e);
    }
  }

  /* Motivation: deterministisch pro Tag */
  function loadMotivation() {
    const texts = [
      "💪 Super! Bleib dran – du machst tolle Fortschritte.",
      "🌟 Jeder Tag zählt – mach heute den Unterschied!",
      "🚀 Stark! Nur wer weitermacht, kommt ans Ziel.",
      "🧘‍♀️ Ruhe, Atmung und Bewegung – dein perfektes Gleichgewicht."
    ];
    const el = $("motivationText");
    if (!el) return;
    const d = new Date();
    const idx = (d.getFullYear() * 366 + d.getMonth() * 32 + d.getDate()) % texts.length;
    el.textContent = texts[idx];
  }

  /* Newsletter */
  function loadNewsletter() {
    const news = [
      "Heute geöffnet. Nächster Feiertag: 24.12.2025.<br><strong>Aktion:</strong> 10% Rabatt auf Massage-Termine im November!",
      "Am Freitag, 10.11., bleibt die Praxis geschlossen.",
      "Neue Rückenkurse ab Dezember – jetzt anmelden!",
      "Praxis-Jubiläum: Gewinnspiel läuft diese Woche!",
      "Hinweis: Neue Öffnungszeiten ab Januar.",
      "Schon gewusst? Wir haben jetzt auch Online-Beratung!"
    ];
    const el = $("newsletterBox");
    if (el) el.innerHTML = news[Math.floor(Math.random() * news.length)];
  }

  /* Boot */
  loadDayDate();
  loadTraining();
  loadAppointments();
  loadMotivation();
  loadNewsletter();

  // Re-Exports bei SPA
  window.loadMotivation = loadMotivation;
  window.loadNewsletter = loadNewsletter;
})();
