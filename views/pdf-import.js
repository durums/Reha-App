window.PDFImport = {

  async parse(file) {
    const txt = await file.text();
    const lines = txt.split(/\r?\n/);

    const events = [];
    let currentDate = null;

    // Datumszeile: Montag – 24.11.2025
    const dateRegex = /^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\s+–\s+(\d{2}\.\d{2}\.\d{4})$/;

    // Terminzeile: 09:00–10:00 Titel – Ort – Person
    const entryRegex = /^(\d{2}:\d{2})–(\d{2}:\d{2})\s+(.*?)\s+–\s+(.*?)\s+–\s+(.*)$/;

    for (let raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // Datum erkennen
      const d = dateRegex.exec(line);
      if (d) {
        const iso = d[2].split('.').reverse().join('-');
        currentDate = iso;
        continue;
      }

      // Termin erkennen
      const e = entryRegex.exec(line);
      if (!e || !currentDate) continue;

      const [, start, end, title, room, person] = e;

      // Auf volle Stunde runden:
      const sh = start.split(':')[0] + ":00";
      let eh = end.split(':')[0];
      if (end.split(':')[1] !== "00") eh = String(Number(eh) + 1).padStart(2,'0');
      eh += ":00";

      events.push({
        date: currentDate,
        start: sh,
        end: eh,
        title: title.trim(),
        room: room.trim(),
        person: person.trim()
      });
    }

    return events;
  },


  generatePreview(events) {
    return events.map(e => `
      <div class="pdf-event-item">
        <strong>${e.date}</strong><br>
        ${e.start}–${e.end}<br>
        ${e.title}<br>
        <em>${e.room} – ${e.person}</em>
      </div>
    `).join("");
  },


  importToCalendar(events, store, user) {
    let imported = 0, conflicts = 0;

    for (const ev of events) {
      store[ev.date] ||= {};

      if (!store[ev.date][ev.start]) {
        store[ev.date][ev.start] = ev.title;   // sichtbarer Titel im Kalender
        imported++;
      } else {
        conflicts++;
      }
    }

    return { imported, conflicts };
  }
};
