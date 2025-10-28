document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const terminList = document.getElementById('terminList');

  // Beispieltermine (eine Mischung aus vergangenen & kommenden)
  const termine = [
    { title: 'Physiotherapie – Stabilisation', date: '2025-10-25', time: '10:00' },
    { title: 'Nachuntersuchung', date: '2025-10-28', time: '09:00' },
    { title: 'Training Beinpresse', date: '2025-11-01', time: '11:00' },
  ];

  // Kalender initialisieren
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'de',
    firstDay: 1,
    initialDate: termine[0].date, // zeigt automatisch Monat des 1. Termins
    events: termine.map(t => ({ title: t.title, start: t.date }))
  });
  calendar.render();

  // Liste mit Status (grün/rot) rendern
  const today = new Date();
  terminList.innerHTML = termine.map(t => {
    const date = new Date(`${t.date}T${t.time}`);
    const isPast = date < today;
    const btnClass = isPast ? 'btn-red' : 'btn-green';
    const label = isPast ? 'Abgeschlossen' : 'Anstehend';
    return `
      <li>
        <div>
          <strong>${t.title}</strong><br>
          <small>${t.date} – ${t.time} Uhr</small>
        </div>
        <button class="btn ${btnClass}">${label}</button>
      </li>
    `;
  }).join('');
});
