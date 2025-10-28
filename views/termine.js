document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const terminList = document.getElementById("terminList");

  // Beispieltermine (kannst du später durch Firestore-Daten ersetzen)
  const termine = [
    { title: "Physiotherapie – Stabilisation", date: "2025-10-25", time: "10:00" },
    { title: "Nachuntersuchung", date: "2025-10-28", time: "09:00" },
    { title: "Training Beinpresse", date: "2025-11-01", time: "11:00" },
    { title: "Erstuntersuchung", date: "2025-10-10", time: "08:00" },
  ];

  // Kalender initialisieren
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "de",
    firstDay: 1,
    events: termine.map((t) => ({
      title: t.title,
      start: t.date,
    })),
  });

  calendar.render();

  // Terminliste dynamisch generieren
  const today = new Date();

  terminList.innerHTML = termine
    .map((t) => {
      const date = new Date(`${t.date}T${t.time}`);
      const isPast = date < today;
      return `
        <article class="termin ${isPast ? "past" : ""}">
          <h3>${t.title}</h3>
          <p><strong>Datum:</strong> ${t.date} – ${t.time} Uhr</p>
          <p><strong>Status:</strong> ${isPast ? "Abgeschlossen" : "Anstehend"}</p>
        </article>
      `;
    })
    .join("");
});
