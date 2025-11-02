(() => {
  const $ = (id) => document.getElementById(id);

  const dayNames = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
  const now = new Date();
  $("dayDate").textContent = `${dayNames[now.getDay()]}, ${now.toLocaleDateString("de-DE")}`;

  // --- Trainingsplan simuliert ---
  function loadTraining() {
    const plans = [
      ["Dehnung & Aufwärmen (15 Min.)", "Kraftübungen Oberkörper (30 Min.)", "Cool Down (10 Min.)"],
      ["Ergometer (25 Min.)", "Atemübungen (15 Min.)", "Dehnung (10 Min.)"],
      ["Ruhetag – Spaziergang empfohlen", "Leichte Mobilisation (10 Min.)"],
    ];
    const plan = plans[now.getDay() % plans.length];
    $("trainingToday").innerHTML = `<ul>${plan.map(p => `<li>${p}</li>`).join("")}</ul>`;
  }

  // --- Termine aus Kalender übernehmen ---
  function loadAppointments() {
    const list = $("todayAppointments");
    list.innerHTML = "";
    try {
      const store = JSON.parse(localStorage.getItem("kal_data") || "{}");
      const today = new Date().toISOString().slice(0,10);
      const user = window.currentUserName || "Gast";

      if (!store[today]) {
        list.innerHTML = "<li>Keine Termine heute.</li>";
        return;
      }

      const my = Object.entries(store[today]).filter(([_, name]) => name === user);
      if (my.length === 0) {
        list.innerHTML = "<li>Keine eigenen Termine heute.</li>";
        return;
      }

      my.forEach(([time, name]) => {
        const li = document.createElement("li");
        li.textContent = `${time} – ${name}`;
        list.appendChild(li);
      });
    } catch (e) {
      list.innerHTML = "<li>Fehler beim Laden der Termine.</li>";
      console.error(e);
    }
  }

  // --- Motivationstext ---
  function loadMotivation() {
    const texts = [
      "💪 Super! Bleib dran – du machst tolle Fortschritte.",
      "🌟 Jeder Tag zählt – mach heute den Unterschied!",
      "🚀 Stark! Nur wer weitermacht, kommt ans Ziel.",
      "🧘‍♀️ Ruhe, Atmung und Bewegung – dein perfektes Gleichgewicht.",
    ];
    const el = $("motivationText");
    if (el) el.textContent = texts[Math.floor(Math.random() * texts.length)];
  }

  // --- Newsletter dynamisch ---
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

  document.addEventListener("DOMContentLoaded", () => {
    loadTraining();
    loadAppointments();
    loadMotivation();
    loadNewsletter();
  });
})();
