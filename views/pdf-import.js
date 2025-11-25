(() => {
  "use strict";

  // ================================
  // 1) Fallback, wenn pdf.js fehlt
  // ================================
  if (typeof window.pdfjsLib === "undefined") {
    console.error("❌ pdf.js ist nicht geladen. Binde z. B. das CDN ein, bevor dieses Script läuft.");

    window.PDFImport = {
      async parse() {
        throw new Error("PDF.js Bibliothek fehlt.");
      },
      generatePreview() {
        return '<div class="pdf-error">PDF.js Bibliothek nicht geladen.</div>';
      },
      importToCalendar() {
        return { imported: 0, conflicts: 0 };
      }
    };
    return;
  }

  // ================================
  // 2) HAUPT-EVENT-REGEX
  //    Format:
  //    DD.MM.YYYY ... HH:MM - HH:MM <Beschreibung>
  //    z.B.:
  //    30.06.2025 Montag 10:00 - 11:00 Sitzung XY
  // ================================
  const EVENT_PATTERN =
    /(\d{1,2})\.(\d{1,2})\.(\d{4})[\s\S]{0,40}?(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+([^\n\r]+)/g;

  // ================================
  // 3) PDF EINLESEN → TEXT → EVENTS
  // ================================
  async function parseTherapyPDF(file) {
    if (!file) {
      throw new Error("Keine Datei übergeben.");
    }

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const line = content.items.map(i => i.str).join(" ");
      fullText += line + "\n";
    }

    console.log("📄 PDF-Gesamttext (erste 500 Zeichen):", fullText.slice(0, 500));

    const events = extractEvents(fullText);
    console.log("📊 Termine extrahiert:", events);

    return events;
  }

  // ================================
  // 4) TEXT → EVENT-OBJEKTE
  // ================================
  function extractEvents(text) {
    const events = [];
    let match;

    while ((match = EVENT_PATTERN.exec(text)) !== null) {
      const [, d, m, y, start, end, descRaw] = match;

      const date = `${y}-${pad(m)}-${pad(d)}`;        // YYYY-MM-DD
      const time = normalizeTime(start);             // HH:MM:SS
      const description = descRaw.trim().replace(/\s+/g, " ");
      const title = description.split(" ").slice(0, 6).join(" ");
      const duration = calcDurationMinutes(start, end);

      events.push({
        date,          // "2025-06-30"
        time,          // "10:00:00"
        title,         // Kurzfassung
        description,   // Volltext nach der Zeitspanne
        duration       // in Minuten
      });
    }

    return events;
  }

  // ================================
  // 5) HELFER
  // ================================
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function normalizeTime(t) {
    const [hRaw, mRaw] = (t || "").split(":");
    const h = pad(Number(hRaw || 0));
    const m = pad(Number(mRaw || 0));
    return `${h}:${m}:00`;
  }

  function calcDurationMinutes(start, end) {
    const [sh, sm] = (start || "0:0").split(":").map(Number);
    const [eh, em] = (end || "0:0").split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    // Fallback 60 Minuten, falls PDF komische Zeiten liefert
    return diff > 0 ? diff : 60;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ================================
  // 6) VORSCHAU FÜR POPUP
  // ================================
  function generatePreview(events) {
    if (!Array.isArray(events) || !events.length) {
      return `<div class="pdf-error">⚠️ In der PDF wurden keine Termine gefunden.</div>`;
    }

    let html = `<p><strong>${events.length} Termine gefunden:</strong></p>`;

    for (const ev of events) {
      const date = ev.date || "";
      const time = (ev.time || "").slice(0, 5); // HH:MM
      const description = ev.description || ev.title || "";

      html += `
        <div class="pdf-event-item">
          <strong>${date} ${time}</strong><br>
          ${escapeHtml(description)}
        </div>`;
    }

    return html;
  }

  // ================================
  // 7) IMPORT IN DEIN KALENDER-STORE
  //    store-Struktur:
  //    store[YYYY-MM-DD][HH:MM] = { ...Event }
  // ================================
  function importToCalendar(events, store, user) {
    if (!Array.isArray(events)) events = [];
    if (typeof store !== "object" || !store) store = {};

    let imported = 0;
    let conflicts = 0;

    for (const ev of events) {
      const dateKey = ev.date;
      const slotKey = (ev.time || "").slice(0, 5); // HH:MM

      if (!dateKey || !slotKey) continue;

      if (!store[dateKey]) {
        store[dateKey] = {};
      }

      if (!store[dateKey][slotKey]) {
        // Vollständiges Objekt speichern – zukunftssicher
        store[dateKey][slotKey] = {
          user: user || null,
          title: ev.title,
          description: ev.description,
          duration: ev.duration,
          raw: ev
        };
        imported++;
      } else {
        conflicts++;
      }
    }

    return { imported, conflicts };
  }

  // ================================
  // 8) GLOBALER EXPORT
  // ================================
  window.PDFImport = {
    parse: parseTherapyPDF,
    generatePreview,
    importToCalendar
  };

})();
