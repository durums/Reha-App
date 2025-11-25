window.PDFImport = {

  async parse(file) {
    const text = await file.text();   // Bei echten PDFs später pdf.js nutzen
    const lines = text.split("\n");

    let events = [];

    const dateRegex = /(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\s+[–-]\s+(\d{2}\.\d{2}\.\d{4})/;
    const entryRegex = /(\d{2}:\d{2})–(\d{2}:\d{2})\s+(.*?)\s+–\s+(.*?)\s+–\s+(.*)/;

    let currentDate = null;

    for (const line of lines) {
      const d = dateRegex.exec(line);
      if (d) {
        const realDate = d[2].split(".").reverse().join("-");
        currentDate = realDate;
        continue;
      }

      const e = entryRegex.exec(line);
      if (e && currentDate) {
        events.push({
          date: currentDate,
          start: e[1],
          end: e[2],
          title: e[3],
          room: e[4],
          person: e[5]
        });
      }
    }

    return events;
  },

  generatePreview(events) {
    return events.map(ev => `
      <div class="pdf-event-item">
        <strong>${ev.date}</strong><br>
        ${ev.start}–${ev.end}<br>
        ${ev.title}<br>
        <em>${ev.room} – ${ev.person}</em>
      </div>
    `).join("");
  },

  importToCalendar(events, store, user) {
    let imported = 0, conflicts = 0;

    for (const ev of events) {
      const slot = ev.start;
      store[ev.date] ??= {};

      if (!store[ev.date][slot]) {
        store[ev.date][slot] = user;
        imported++;
      } else {
        conflicts++;
      }
    }

    return { imported, conflicts };
  }
};
