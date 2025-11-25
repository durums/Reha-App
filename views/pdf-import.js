(function () {
  if (typeof window.pdfjsLib === "undefined") {
    console.error("pdf.js fehlt");
    window.PDFImport = { parse: () => [] };
    return;
  }

  const DAY_NAMES = [
    "Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag",
    "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
  ];

  // Tageszeile: Monday – 24.11.2025
  const RE_DAY_HEADER = new RegExp(
    `(${DAY_NAMES.join("|")})\\s*[–-]\\s*(\\d{2}\\.\\d{2}\\.\\d{4})`
  );

  // Event-Zeile: 09:00–10:00 Text
  const RE_EVENT = /(\\d{2}:\\d{2})\\s*[–-]\\s*(\\d{2}:\\d{2})\\s+(.+)/;

  async function parse(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // PDF liefert schon sauberen Text
      const merged = content.items.map(t => t.str).join(" ");
      text += merged + "\n";
    }

    const lines = text.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);

    let events = [];
    let currentDate = null;

    for (const line of lines) {

      // Tageszeile?
      const d = line.match(RE_DAY_HEADER);
      if (d) {
        currentDate = deToIso(d[2]);
        continue;
      }

      if (!currentDate) continue;

      // Eventzeile?
      const ev = line.match(RE_EVENT);
      if (ev) {
        events.push({
          date: currentDate,
          start: ev[1],
          end: ev[2],
          description: ev[3].trim()
        });
      }
    }

    return events;
  }

  function deToIso(ddmmyyyy) {
    const [dd, mm, yyyy] = ddmmyyyy.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }

  window.PDFImport = { parse };
})();
