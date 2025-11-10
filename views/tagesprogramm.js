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

    // === Firestore-State laden & schreiben ===
    const dayKey = new Date().toISOString().slice(0,10);  // YYYY-MM-DD
    const uid    = (window.firebaseAuth?.currentUser?.uid) || "guest";
    const userId = window.currentUserName || uid;

    (async () => {
      try {
        const { getFirestore, doc, setDoc, onSnapshot, serverTimestamp }
          = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");

        const db      = window.firebaseDb || getFirestore();
        const docRef  = doc(db, "users", userId, "training", dayKey);

        // Live-Updates aus Firebase übernehmen (mehrgerätefähig)
        onSnapshot(docRef, (snap) => {
          const data = snap.data() || {};
          const saved = Array.isArray(data.checkedIdx) ? data.checkedIdx : [];

          // Erst alles deaktivieren, dann gespeicherte aktivieren
          mount.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
          saved.forEach(i => {
            const cb = mount.querySelector(`input[data-idx="${i}"]`);
            if (cb) cb.checked = true;
          });

          updateProgress(mount.querySelectorAll('input[type="checkbox"]'));
        });

        // Änderungen speichern
        mount.addEventListener("change", async (e) => {
          const cb = e.target.closest('input[type="checkbox"]');
          if (!cb) return;
          const all = [...mount.querySelectorAll('input[type="checkbox"]')];
          const checkedIdx = all.reduce((acc, el, i) => (el.checked && acc.push(i), acc), []);
          updateProgress(all);
          await setDoc(docRef, { checkedIdx, updatedAt: serverTimestamp() }, { merge: true });
        });

        // Falls kein Snapshot kommt (neuer Tag): Progress initialisieren
        updateProgress(mount.querySelectorAll('input[type="checkbox"]'));
      } catch (err) {
        console.error("Firebase (Training) Fehler:", err);
        // Fallback: lokales Verhalten beibehalten, wenn Firestore nicht verfügbar ist
        const all = mount.querySelectorAll('input[type="checkbox"]');
        updateProgress(all);
      }
    })();
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

  /* Termine aus Firestore (nur heute) */
  function loadAppointments() {
    const list = $("todayAppointments");
    if (!list) return;
    list.innerHTML = "";

    const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
    const user  = window.currentUserName || "Gast";      // optionaler Filter

    (async () => {
      try {
        const { getFirestore, collection, query, where, orderBy, getDocs }
          = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");

        const db = window.firebaseDb || getFirestore();

        // Wenn du NICHT nach Benutzer filtern willst, kommentiere die assignedTo-Where-Klausel aus.
        const q = query(
          collection(db, "termine"),
          where("date", "==", today),
          where("assignedTo", "==", user),   // <-- optional
          orderBy("time", "asc")
        );

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
        console.error("Firebase (Termine) Fehler:", e);
        list.innerHTML = `<li><span class="badge-time">!</span> Fehler beim Laden der Termine.</li>`;
      }
    })();
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
