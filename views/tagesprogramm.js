(async () => {
  const DEBUG = true;
  const $ = (id) => document.getElementById(id);
  const dayNames = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

  // --- Utils ---
  function localDateKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }
  function log(...args){ if(DEBUG) console.log("[TP]", ...args); }
  function warn(...args){ console.warn("[TP]", ...args); }
  function err(...args){ console.error("[TP]", ...args); }

  // Warten bis window.firebaseDb & anonyme Auth stehen
  async function waitFirebaseReady(ms = 8000) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (window.firebaseDb && window.firebaseAuth && window.firebaseAuth.currentUser) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  // --- Datum ---
  function loadDayDate() {
    const now = new Date();
    const el = $("dayDate");
    if (el) el.textContent = `${dayNames[now.getDay()]}, ${now.toLocaleDateString("de-DE")}`;
  }

  // --- Training ---
  async function loadTraining() {
    const now = new Date();
    const plans = [
      [{ title: "Dehnung & Aufwärmen", meta: "15 Min." },
       { title: "Kraft Oberkörper",     meta: "30 Min." },
       { title: "Cool Down",            meta: "10 Min." }],
      [{ title: "Ergometer",            meta: "25 Min." },
       { title: "Atemübungen",          meta: "15 Min." },
       { title: "Dehnung",              meta: "10 Min." }],
      [{ title: "Ruhetag – Spaziergang", meta: "frei" },
       { title: "Leichte Mobilisation",  meta: "10 Min." }],
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

    const dayKey = localDateKey();
    const uid    = (window.firebaseAuth?.currentUser?.uid) || "guest";
    const userId = window.currentUserName || uid;

    // Falls Firebase nicht bereit, nur lokale Progress-Anzeige
    if (!window.firebaseDb) {
      warn("Firebase nicht initialisiert. Prüfe HTML-Init vor dieser JS.");
      updateProgress(mount.querySelectorAll('input[type="checkbox"]'));
      return;
    }

    try {
      const { getFirestore, doc, setDoc, onSnapshot, serverTimestamp }
        = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");

      const db     = window.firebaseDb || getFirestore();
      const docRef = doc(db, "users", userId, "training", dayKey);

      onSnapshot(docRef, (snap) => {
        const data = snap.data() || {};
        const saved = Array.isArray(data.checkedIdx) ? data.checkedIdx : [];
        // Reset + setzen
        mount.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
        saved.forEach(i => {
          const cb = mount.querySelector(`input[data-idx="${i}"]`);
          if (cb) cb.checked = true;
        });
        updateProgress(mount.querySelectorAll('input[type="checkbox"]'));
      }, (e) => {
        err("Snapshot-Fehler (Training):", e);
      });

      let saveTimer;
      mount.addEventListener("change", async (e) => {
        const cb = e.target.closest('input[type="checkbox"]');
        if (!cb) return;
        const all = [...mount.querySelectorAll('input[type="checkbox"]')];
        const checkedIdx = all.reduce((acc, el, i) => (el.checked && acc.push(i), acc), []);
        updateProgress(all);
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          try {
            await setDoc(docRef, { checkedIdx, updatedAt: serverTimestamp() }, { merge: true });
            log("Training gespeichert:", { userId, dayKey, checkedIdx });
          } catch (e) {
            err("Speichern fehlgeschlagen (Training):", e);
          }
        }, 200);
      });

      // initial
      updateProgress(mount.querySelectorAll('input[type="checkbox"]'));
    } catch (e) {
      err("Firebase (Training) Fehler:", e);
      updateProgress(mount.querySelectorAll('input[type="checkbox"]'));
    }
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

  // --- Termine (nur heute) ---
  async function loadAppointments() {
    const list = $("todayAppointments");
    if (!list) return;
    list.innerHTML = "";

    const today = localDateKey();
    const user  = window.currentUserName || "Gast";   // setze false unten, wenn du ohne Userfilter willst
    const USE_USER_FILTER = true;                     // <--- hier steuern

    if (!window.firebaseDb) {
      warn("Firebase nicht initialisiert (Termine).");
      list.innerHTML = `<li><span class="badge-time">!</span> Termine nicht geladen (Firebase fehlt).</li>`;
      return;
    }

    try {
      const { getFirestore, collection, query, where, orderBy, getDocs }
        = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");

      const db = window.firebaseDb || getFirestore();
      const base = [ collection(db, "termine"), where("date","==", today) ];
      if (USE_USER_FILTER) base.push(where("assignedTo","==", user));
      base.push(orderBy("time","asc"));

      const q = query(...base);
      const snap = await getDocs(q);

      if (snap.empty) {
        list.innerHTML = `<li><span class="badge-time">—</span> Keine Termine heute.</li>`;
        return;
      }

      snap.forEach(docSnap => {
        const { time = "—", title = "", assignedTo = "" } = docSnap.data();
        const li = document.createElement("li");
        const label = title || assignedTo || "";
        li.innerHTML = `<span class="badge-time">${time}</span> ${label}`;
        list.appendChild(li);
      });
    } catch (e) {
      err("Firebase (Termine) Fehler:", e);
      list.innerHTML = `<li><span class="badge-time">!</span> Fehler beim Laden der Termine.</li>`;
      // Häufig: Composite-Index nötig. Firestore-Konsole verlinkt in der Fehlermeldung.
    }
  }

  // --- Motivation / Newsletter (wie gehabt) ---
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

  // --- Boot ---
  loadDayDate();

  const ready = await waitFirebaseReady();
  if (!ready) {
    warn("Firebase nicht bereit (kein init oder keine Auth). Training/Termine laufen ohne Cloud.");
  }
  await loadTraining();
  await loadAppointments();
  loadMotivation();
  loadNewsletter();

  // Re-Exports bei SPA
  window.loadMotivation = loadMotivation;
  window.loadNewsletter = loadNewsletter;
})();
