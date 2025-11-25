(() => {
  // 1. Prüfen, ob pdf.js da ist
  if (typeof window.pdfjsLib === "undefined") {
    console.error("❌ pdf.js ist nicht geladen.");
    window.PDFImport = {
      parse: () => { throw new Error("PDF.js Bibliothek fehlt."); },
      generatePreview: () => '<div class="pdf-error">PDF.js Bibliothek nicht geladen</div>',
      importToCalendar: () => ({ imported: 0, conflicts: 0 })
    };
    return;
  }

  // 2. EIN globaler Regex über den gesamten Text:
  //    TT.MM.JJJJ [irgendwas] HH:MM - HH:MM [Titel bis zum Zeilenende]
  const EVENT_PATTERN =
    /(\d{1,2})\.(\d{1,2})\.(\d{4})[\s\S]{0,40}?(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+([^\n\r]+)/g;

  // -------- Hauptfunktion: PDF -> Eventliste --------
  async function parseTherapyPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((it) => it.str).join(" ");
      fullText += text + "\n";
    }

    console.log("📄 PDF-Gesamttext (erste 500 Zeichen):", fullText.slice(0, 500));
    const events = extractEvents(fullText);
    console.log("📊 Events aus PDF:", events);
    return events;
  }

  // -------- Text mit Regex nach Terminen durchsuchen --------
  function extractEvents(text) {
    const events = [];
    let match;

    while ((match = EVENT_PATTERN.exec(text)) !== null) {
      const [_, d, m, y, start, end, descRaw] = match;
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

  // -------- Vorschau-HTML für den Dialog --------
  function generatePreview(events) {
    if (!events.length) {
      return '<div class="pdf-error">⚠️ In der PDF wurden keine Termine gefunden.</div>';
    }
    let html = `<p><strong>${events.length} Termine gefunden:</strong></p>`;
    for (const ev of events) {
      html += `
        <div class="pdf-event-item">
          <strong>${ev.date} ${ev.time.slice(0,5)}</strong><br>
          ${ev.description}
        </div>`;
    }
    return html;
  }

  // -------- Termine in deinen Kalender-Store schreiben --------
  function importToCalendar(events, store, user) {
    let imported = 0;
    let conflicts = 0;

    for (const ev of events) {
      const tag  = ev.date;           // z.B. "2025-06-30"
      const slot = ev.time.slice(0,5) + ":00".slice(5); // "HH:MM"
      const existing = (store[tag] || {})[slot];

      if (!existing) {
        if (!store[tag]) store[tag] = {};
        // als Besitzer kannst du auch user nehmen:
        store[tag][slot] = user || `Therapie: ${ev.title}`;
        imported++;
      } else {
        conflicts++;
      }
    }
    return { imported, conflicts };
  }

  // Modul nach außen geben
  window.PDFImport = {
    parse: parseTherapyPDF,
    generatePreview,
    importToCalendar
  };
})();
