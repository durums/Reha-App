(function () {
  if (!window.pdfjsLib) {
    console.error("pdf.js fehlt.");
    window.PDFImport = { parse: () => [] };
    return;
  }

  // Format in PDF:
  // Datum,Zeit,Beschreibung
  // 24.11.2025,09:00,10:00 Lymphdrainage – 4. Etage – Frau Herrmann

  async function parse(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

    let lines = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const merged = content.items.map(t => t.str).join(" ");
      lines.push(...merged.split(/[\r\n]+/));
    }

    const events = [];

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("Datum")) continue;

      const parts = line.split(",");
      if (parts.length < 3) continue;

      const datum = parts[0].trim();
      const start = parts[1].trim();
      const rest = parts.slice(2).join(",").trim();

      // rest beginnt z. B. mit "10:00 Vitalwerterfassung – 4. Etage – Frau Bick"
      const m = rest.match(/^(\d{2}:\d{2})\s+(.*)$/);
      if (!m) continue;

      const end   = m[1];
      const descr = m[2];

      events.push({
        date: deToIso(datum),
        start,
        end,
        description: descr
      });
    }

    return events;
  }

  function deToIso(d) {
    const [dd, mm, yyyy] = d.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }

  window.PDFImport = { parse };

})();
