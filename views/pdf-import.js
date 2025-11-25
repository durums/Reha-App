(() => {
  // ================================
  // 1) PDF.js vorhanden?
  // ================================
  if (typeof window.pdfjsLib === "undefined") {
    console.error("❌ pdf.js ist nicht geladen.");

    window.PDFImport = {
      parse: () => { throw new Error("PDF.js Bibliothek fehlt."); },
      generatePreview: () => '<div class="pdf-error">PDF.js Bibliothek nicht geladen</div>',
      importToCalendar: () => ({ imported: 0, conflicts: 0 })
    };
    return;
  }

  // ================================
  // 2) ERWEITERTE DATUMS-MUSTER
  // ================================
  const DATE_PATTERNS = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+\w+/,         // 30.06.2025 Montag
    /\w+\s+(\d{1,2})\.(\d{1,2})\.(\d{4})/,         // Montag 30.06.2025
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/                // 30.06.2025
  ];

  // ================================
  // 3) HAUPT-EVENT-REGEX
  // ================================
  const EVENT_PATTERN =
    /(\d{1,2})\.(\d{1,2})\.(\d{4})[\s\S]{0,40}?(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+([^\n\r]+)/g;

  // ================================
  // 4) PDF EINLESEN → TEXT
  // ================================
  async function parseTherapyPDF(file) {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const txt = await page.getTextContent();
      const merged = txt.items.map(t => t.str).join(" ");
      fullText += merged + "\n";
    }

    console.log("📄 PDF-Gesamttext (erste 500 Zeichen):");
    console.log(fullText.slice(0, 500));

    const events = extractEvents(fullText);
    console.log("📊 Termine extrahiert:", events);

    return events;
  }

  // ================================
  // 5) EVENT EXTRAKTION
  // ================================
  function extractEvents(text) {
    const events = [];
    let match;

    while ((match = EVENT_PATTERN.exec(text)) !== null) {
      let [_, d, m, y, start, end, descRaw] = match;

      // Datum + Uhrzeit sauber formatieren
      const date = `${y}-${pad(m)}-${pad(d)}`;
      const time = `${start}:00`;
      const description = descRaw.trim();
      const title = description.split(" ").slice(0, 6).join(" ");

      events.push({
        date,
        time,
        title,
        description,
        duration: 60
      });
    }

    return events;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // ================================
  // 6) VORSCHAU FÜR POPUP
  // ================================
  function generatePreview(events) {
    if (!events.length)
      return `<div class="pdf-error">⚠️ In der PDF wurden keine Termine gefunden.</div>`;

    let html = `<p><strong>${events.length} Termine gefunden:</strong></p>`;

    for (const ev of events) {
      html += `
        <div class="pdf-event-item">
          <strong>${ev.date} ${ev.time.slice(0, 5)}</strong><br>
          ${ev.description}
        </div>`;
    }

    return html;
  }

  // ================================
  // 7) TERMIN-IMPORT IN KALENDER
  // ================================
  function importToCalendar(events, store, user) {
    let imported = 0;
    let conflicts = 0;

    for (const ev of events) {
      const tag = ev.date;
      const slot = ev.time.slice(0, 5);

      if (!store[tag]) store[tag] = {};

      if (!store[tag][slot]) {
        store[tag][slot] = user || ev.title;
        imported++;
      } else {
        conflicts++;
      }
    }

    return { imported, conflicts };
  }

  // ================================
  // 8) EXPORTIERTES MODUL
  // ================================
  window.PDFImport = {
    parse: parseTherapyPDF,
    generatePreview,
    importToCalendar
  };

})();
