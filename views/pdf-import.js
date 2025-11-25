(function () {
  if (typeof window.pdfjsLib === "undefined") {
    console.error("pdf.js fehlt.");
    window.PDFImport = { parse: () => [] };
    return;
  }

  // Erkennung für DE/EN Wochentage
  const DAY_NAMES = [
    "Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag",
    "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
  ];

  const RE_DAY_HEADER = new RegExp(
    `(${DAY_NAMES.join("|")})\\s*[–-]\\s*(\\d{2}\\.\\d{2}\\.\\d{4})`
  );

  // Superrobuster Time-Slot: erkennt alles wie „09:00–10:00 Vital werte fassung – 4.“
  const RE_EVENT = /(\\d{2}:\\d{2})\\s*[–-]\\s*(\\d{2}:\\d{2})\\s+(.+)/;

  async function parse(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // PDF.js trennt Wörter chaotisch → alles normalisieren:
      const merged = content.items
        .map(t => t.str.replace(/\s+/g, " "))
        .join(" ");

      text += merged + "\n";
    }

    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    let currentDate = null;
    const events = [];

    for (const line of lines) {

      // 1) Tagesheader erkennen
      const mDay = line.match(RE_DAY_HEADER);
      if (mDay) {
        currentDate = deToIso(mDay[2]);
        continue;
      }

      if (!currentDate) continue;

      // 2) Event in der Zeile erkennen
      const mEv = line.match(RE_EVENT);
      if (!mEv) continue;

      events.push({
        date: currentDate,
        start: mEv[1],
        end: mEv[2],
        description: clean(mEv[3])
      });
    }

    return events;
  }

  function clean(t) {
    // Entfernt PDF-Trennmüll: "Vital werte fassung – 4." → "Vitalwertefassung – 4."
    return t
      .replace(/\s*–\s*/g, " – ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function deToIso(d) {
    const [dd, mm, yyyy] = d.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }

  window.PDFImport = {
    parse,
  };
})();
