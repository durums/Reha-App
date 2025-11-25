// Optimierte PDF-Parsing-Version für die gegebene plan_full_hours.pdf
// Fokus: Deutschsprachige Wochentage + Struktur wie in der Beispiel-PDF
// Zielt auf stabile Erkennung der Tagesblöcke & Zeiträume

(function () {
  if (typeof window.pdfjsLib === "undefined") {
    console.error("pdf.js fehlt");
    window.PDFImport = {
      parse: () => { throw new Error("pdf.js fehlt"); }
    };
    return;
  }

  const DAY_NAMES = [
    "Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"
  ];

  // Regex: z. B. "Monday – 24.11.2025" ODER "Montag – 24.11.2025"
  const RE_DAY_HEADER = new RegExp(
    `(${DAY_NAMES.join("|")}|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*[–-]\s*(\\d{2}\\.\\d{2}\\.\\d{4})`
  );

  // Regex: "09:00–10:00 Text ..."
  const RE_EVENT = /(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})\s+(.+)/;

  async function parse(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(t => t.str).join(" ") + "\n";
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const events = [];
    let currentDate = null;

    for (const line of lines) {
      const dayMatch = line.match(RE_DAY_HEADER);
      if (dayMatch) {
        currentDate = deToIso(dayMatch[2]);
        continue;
      }

      if (!currentDate) continue;

      const ev = line.match(RE_EVENT);
      if (!ev) continue;

      const start = ev[1];
      const end   = ev[2];
      const desc  = ev[3].trim();

      events.push({
        date: currentDate,
        start,
        end,
        description: desc
      });
    }

    return events;
  }

  function deToIso(d) {
    const [dd, mm, yyyy] = d.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }

  window.PDFImport = {
    parse
  };
})();
