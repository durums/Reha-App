window.PDFImport = {

  async parse(file) {
    const txt = await file.text();
    const lines = txt.split(/\r?\n/);

    const events = [];
    let currentDate = null;

    const dateRegex = /^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\s+–\s+(\d{2}\.\d{2}\.\d{4})$/;

    const entryRegex = /^•\s*(\d{2}:\d{2})–(\d{2}:\d{2})\s+(.*?)\s+–\s+(.*?)\s+–\s+(.*)$/;

    for (let raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // --- DATUM ERKENNEN ---
      let m = dateRegex.exec(line);
      if (m) {
        const [_, wtag, dateStr] = m;
        const iso = dateStr.split(".").reverse().join("-");
        currentDate = iso;
        continue;
      }

      // --- TERMINZEILE ERKENNEN ---
      let e = entryRegex.exec(line);
      if (e && currentDate) {
        const [_, start, end, title, room, person] = e;

        events.push({
          date: currentDate,
          start: start,
          end: end,
          title: title.trim(),
          room: room.trim(),
          person: person.trim()
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
    let imported = 0;
    let conflicts = 0;

    for (const ev of events) {
      store[ev.date] ??= {};

      const slot = ev.start;

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
