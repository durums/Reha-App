document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const terminList = document.getElementById('terminList');

  // Beispieltermine
  const termine = [
    { title: 'Physiotherapie – Stabilisation', date: '2025-10-25', time: '10:00' },
    { title: 'Nachuntersuchung', date: '2025-10-28', time: '09:00' },
    { title: 'Training Beinpresse', date: '2025-11-01', time: '11:00' },
  ];

  // Kalender anzeigen
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'de',
    firstDay: 1,
    initialDate: termine[0].date,
    events: termine.map(t => ({ title: t.title, start: t.date }))
  });
  calendar.render();

  // Terminliste mit Download-Button rendern
  terminList.innerHTML = termine.map((t, i) => `
    <li>
      <div>
        <strong>${t.title}</strong><br>
        <small>${t.date} – ${t.time} Uhr</small>
      </div>
      <button class="btn" onclick="exportTermin(${i})">📅 Exportieren</button>
    </li>
  `).join('');

  // Exportfunktion als .ics-Datei
  window.exportTermin = function(index) {
    const t = termine[index];
    const start = new Date(`${t.date}T${t.time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 Stunde
    const dtStart = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtEnd = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Reha App//DE
BEGIN:VEVENT
UID:${Date.now()}@reha-app
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${t.title}
DESCRIPTION:Reha-Termin
END:VEVENT
END:VCALENDAR
    `.trim();

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
});
