(() => {
  // ===== Konstanten =====
  const START = 8;   // Start-Stunde (inklusive)
  const END   = 17;  // End-Stunde (inklusive)
  const DAYS  = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

  // ===== State =====
  let store     = loadStore();
  let user      = window.currentUserName || "Gast";
  let weekStart = mondayOf(new Date());

  // ===== DOM Helpers =====
  const $          = (id) => document.getElementById(id);
  const header     = () => $("header");
  const hours      = () => $("hours");
  const daysC      = () => $("days");
  const rangeLabel = () => $("rangeLabel");
  const dlg        = () => $("dialog");
  const dlgTitle   = () => $("dlgTitle");
  const dlgList    = () => $("dlgList");

  // ===== Init =====
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!header() || !hours() || !daysC()) {
      // Falls Script vor dem DOM geladen wurde, minimaler Fallback
      const t = setInterval(() => {
        if (header() && hours() && daysC()) {
          clearInterval(t);
          bindOnce();
          render();
        }
      }, 120);
    } else {
      bindOnce();
      render();
    }
  }

  function bindOnce() {
    $("prevBtn")?.addEventListener("click", () => {
      weekStart = addDays(weekStart, -7);
      render();
    });

    $("nextBtn")?.addEventListener("click", () => {
      weekStart = addDays(weekStart, 7);
      render();
    });

    $("todayBtn")?.addEventListener("click", () => {
      weekStart = mondayOf(new Date());
      render();
    });

    $("bookBtn")?.addEventListener("click", bookViaDialog);
    $("mineBtn")?.addEventListener("click", showMine);
    $("moveBtn")?.addEventListener("click", moveOrCancel);
    $("exportBtn")?.addEventListener("click", exportAllMyEventsICS);

    // PDF-Import
    const importBtn   = $("importPdfBtn");
    const importInput = $("importPdfInput");
    if (importBtn && importInput) {
      importBtn.addEventListener("click", () => importInput.click());
      importInput.addEventListener("change", onPdfChosen);
    }
  }

    // CSV-Import
    const csvBtn   = $("importCsvBtn");
    const csvInput = $("importCsvInput");
    
    if (csvBtn && csvInput) {
      csvBtn.addEventListener("click", () => csvInput.click());
      csvInput.addEventListener("change", onCsvChosen);
    } else {
      console.warn("CSV-Buttons wurden nicht gefunden.");
    }


  // ===== Render =====
  function render() {
    // Kopfzeile (Tage)
    header().innerHTML = "";
    header().append(cell("time", "Zeit"));

    const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
    days.forEach((d) => {
      const label = `${DAYS[(d.getDay() + 6) % 7]} ${d.getDate()}.${d.getMonth() + 1}.`;
      header().append(cell("cell", label));
    });

    rangeLabel() &&
      (rangeLabel().textContent = `${fmt(days[0])} – ${fmt(days[6])}`);

    // Stunden-Spalte
    hours().innerHTML = "";
    for (let h = START; h <= END; h++) {
      hours().append(div("hour", `${pad(h)}:00`));
    }

    // Tages-Spalten mit Slots
    daysC().innerHTML = "";
    const today = new Date();

    days.forEach((d) => {
      const tag = iso(d);
      const col = div(
        "col" + (sameDate(d, today) ? " today" : "")
      );

      for (let h = START; h <= END; h++) {
        const slot = `${pad(h)}:00`;
        const who  = (store[tag] || {})[slot];
        const cls  = who ? (who === user ? "own" : "booked") : "free";
        const el   = div(
          `slot ${cls}`,
          who ? (who === user ? "Mein Termin" : "Belegt") : ""
        );

        el.dataset.date = tag;
        el.dataset.slot = slot;
        el.onclick = onSlotClick;

        col.append(el);
      }

      daysC().append(col);
    });
  }

  // ===== Klick-Logik auf einzelne Slots =====
  function onSlotClick(e) {
    const tag  = e.currentTarget.dataset.date;
    const slot = e.currentTarget.dataset.slot;
    const who  = (store[tag] || {})[slot];

    // Slot frei → Termin buchen
    if (!who) {
      if (!user) {
        alert("Bitte anmelden, um Termine zu buchen.");
        return;
      }
      if (confirm(`Möchtest du ${tag} um ${slot} buchen?`)) {
        book(tag, slot, user);
        alert(`Termin eingetragen: ${tag} ${slot}`);
        render();
      }
      return;
    }

    // Eigener Termin
    if (who === user) {
      const rest = daysBetween(new Date(), new Date(tag));
      if (rest < 3) {
        alert("Verschieben/Absagen nur 3 Tage vor dem Termin möglich.");
        return;
      }

      const a = prompt(
        "Eigener Termin: 'v' verschieben, 'a' absagen, 'x' exportieren:"
      );

      if (a === "a") {
        unbook(tag, slot);
        alert("Termin abgesagt.");
        render();
      } else if (a === "v") {
        unbook(tag, slot);
        pickFreeSlot((ntag, nslot) => {
          if (ntag) {
            book(ntag, nslot, user);
            alert(`Termin verschoben auf: ${ntag} ${nslot}`);
          } else {
            alert(
              "Verschieben abgebrochen. Alter Termin wurde entfernt."
            );
          }
          render();
        });
      } else if (a === "x") {
        exportSingleEventICS(tag, slot, user);
      } else if (a !== null) {
        alert("Ungültige Eingabe.");
      }
      return;
    }

    // Fremder Termin
    alert("Dieser Slot ist bereits belegt.");
  }

  // ===== Dialoge =====
  function pickFreeSlot(cb) {
    const items = freeSlotsThisWeek();
    if (items.length === 0) {
      alert("Keine freien Termine verfügbar (diese Woche).");
      return;
    }

    dlgTitle().textContent = "Freien Termin auswählen";
    dlgList().innerHTML = "";

    for (const [tag, slot] of items) {
      const row = div("item");
      row.append(div("", `${tag} ${slot}`));
      const b = document.createElement("button");
      b.textContent = "Auswählen";
      b.onclick = () => {
        dlg().close();
        cb(tag, slot);
      };
      row.append(b);
      dlgList().append(row);
    }

    dlg().showModal();
  }

  function bookViaDialog() {
    if (!user) {
      alert("Bitte anmelden, um Termine zu buchen.");
      return;
    }
    pickFreeSlot((tag, slot) => {
      if (!tag) return;
      book(tag, slot, user);
      alert(`Termin eingetragen: ${tag} ${slot}`);
      render();
    });
  }

  function showMine() {
    const mine = mySlots();
    if (mine.length === 0) {
      alert("Keine eigenen Termine gefunden.");
      return;
    }

    dlgTitle().textContent = "Eigene Termine";
    dlgList().innerHTML = "";

    mine.forEach(([tag, slot]) => {
      const row = div("item");
      row.append(div("", `${tag} ${slot}`));
      dlgList().append(row);
    });

    dlg().showModal();
  }

  function moveOrCancel() {
    const mine = mySlots();
    if (mine.length === 0) {
      alert("Keine Termine gefunden.");
      return;
    }

    dlgTitle().textContent = "Eigene Termine";
    dlgList().innerHTML = "";

    for (const [tag, slot] of mine) {
      const row = div("item");
      row.append(div("", `${tag} ${slot}`));
      const b = document.createElement("button");
      b.textContent = "Wählen";
      b.onclick = () => {
        dlg().close();

        const rest = daysBetween(new Date(), new Date(tag));
        if (rest < 3) {
          alert("Verschieben/Absagen nur 3 Tage vor dem Termin möglich.");
          return;
        }

        const a = prompt(
          "Tippe 'v' zum Verschieben, 'a' zum Absagen, 'x' für Export:"
        );

        if (a === "a") {
          unbook(tag, slot);
          alert("Termin abgesagt.");
          render();
        } else if (a === "v") {
          unbook(tag, slot);
          pickFreeSlot((ntag, nslot) => {
            if (ntag) {
              book(ntag, nslot, user);
              alert(`Termin verschoben auf: ${ntag} ${nslot}`);
            }
            render();
          });
        } else if (a === "x") {
          exportSingleEventICS(tag, slot, user);
        } else if (a !== null) {
          alert("Ungültige Eingabe.");
        }
      };
      row.append(b);
      dlgList().append(row);
    }

    dlg().showModal();
  }

  // ===== Speicher =====
  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem("kal_data") || "{}");
    } catch {
      return {};
    }
  }

  function saveStore() {
    localStorage.setItem("kal_data", JSON.stringify(store));
  }

  function book(tag, slot, name) {
    (store[tag] ||= {})[slot] = name;
    saveStore();
  }

  function unbook(tag, slot) {
    if (store[tag]) {
      delete store[tag][slot];
      if (Object.keys(store[tag]).length === 0) {
        delete store[tag];
      }
      saveStore();
    }
  }

  // ===== Queries =====
  function mySlots() {
    const out = [];
    Object.entries(store).forEach(([tag, slots]) => {
      Object.entries(slots).forEach(([slot, name]) => {
        if (name === user) out.push([tag, slot]);
      });
    });
    return out.sort();
  }

  function freeSlotsThisWeek() {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d   = addDays(weekStart, i);
      const tag = iso(d);
      for (let h = START; h <= END; h++) {
        const slot = `${pad(h)}:00`;
        if (!store[tag] || !store[tag][slot]) {
          out.push([tag, slot]);
        }
      }
    }
    return out;
  }

  // ===== ICS Export =====
  function exportAllMyEventsICS() {
    const mine = mySlots();
    if (mine.length === 0) {
      alert("Keine Termine zum Exportieren.");
      return;
    }

    const events = mine.map(([tag, slot]) =>
      buildICSEvent(tag, slot, user)
    );

    const ics =
      "BEGIN:VCALENDAR\r\n" +
      "VERSION:2.0\r\n" +
      "PRODID:-//TherapieKalender//DE\r\n" +
      events.join("") +
      "END:VCALENDAR\r\n";

    downloadICS("termine.ics", ics);
  }

  function exportSingleEventICS(tag, slot, userName) {
    const ics =
      "BEGIN:VCALENDAR\r\n" +
      "VERSION:2.0\r\n" +
      "PRODID:-//TherapieKalender//DE\r\n" +
      buildICSEvent(tag, slot, userName) +
      "END:VCALENDAR\r\n";

    downloadICS(`termin_${tag}_${slot}.ics`, ics);
  }

  function buildICSEvent(tag, slot, userName) {
    // Tag im Format "YYYY-MM-DD", Slot "HH:MM"
    const start = new Date(`${tag}T${slot}:00`);
    const end   = new Date(start.getTime() + 60 * 60 * 1000); // +1h

    const dtStart = formatICSDate(start);
    const dtEnd   = formatICSDate(end);
    const uid     = `${tag}-${slot}-${userName}@therapiekalender`;

    return (
      "BEGIN:VEVENT\r\n" +
      `UID:${uid}\r\n` +
      `DTSTAMP:${formatICSDate(new Date())}\r\n` +
      `DTSTART:${dtStart}\r\n` +
      `DTEND:${dtEnd}\r\n` +
      `SUMMARY:Termin mit ${userName}\r\n` +
      "END:VEVENT\r\n"
    );
  }

  function formatICSDate(d) {
    const YYYY = d.getFullYear();
    const MM   = pad(d.getMonth() + 1);
    const DD   = pad(d.getDate());
    const hh   = pad(d.getHours());
    const mm   = pad(d.getMinutes());
    const ss   = pad(d.getSeconds());
    // als "floating time" ohne Zeitzone
    return `${YYYY}${MM}${DD}T${hh}${mm}${ss}`;
  }

  function downloadICS(filename, data) {
    const blob = new Blob([data], { type: "text/calendar" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ===== PDF-Import =====
  async function onPdfChosen(evt) {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const termine     = await parsePdfToAppointments(arrayBuffer);

      if (!termine.length) {
        alert("In der PDF wurden keine Termine erkannt.");
        return;
      }

      termine.forEach(addAppointmentToCalendar);
      render();

      alert(`${termine.length} Termine aus der PDF importiert.`);
    } catch (err) {
      console.error("PDF-Import fehlgeschlagen:", err);
      alert("PDF konnte nicht gelesen werden.");
    } finally {
      evt.target.value = "";
    }
  }

  // **Hier ist die gefixte Version**
  async function parsePdfToAppointments(arrayBuffer) {
    if (!window.pdfjsLib) {
      console.error("pdfjsLib ist nicht geladen.");
      return [];
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    // 1) PDF in einen großen Text-String konvertieren
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page    = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      fullText += strings.join(" ") + "\n";
    }

    // 2) künstliche Zeilenumbrüche einfügen,
    //    weil das PDF alles in eine Zeile packt

    // Vor jedem "Wochentag DD.MM.YYYY" einen Zeilenumbruch
    const withDateBreaks = fullText.replace(
      /(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\s+(\d{2}\.\d{2}\.\d{4})/g,
      "\n$1 $2"
    );

    // Vor jeder Zeitspanne "HH:MM - HH:MM" einen Zeilenumbruch
    const withApptBreaks = withDateBreaks.replace(
      /(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/g,
      "\n$1"
    );

    // 3) Jetzt in echte Zeilen aufteilen
    const lines = withApptBreaks
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const termine = [];
    let currentDateIso = null;

    const reDate =
      /^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\s+(\d{2}\.\d{2}\.\d{4})/;

    const reAppt =
      /^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s+(.+)$/;

    for (const line of lines) {
      // Datum-Zeilen, z.B. "Montag 30.06.2025"
      const mDate = line.match(reDate);
      if (mDate) {
        const [, , dateStr] = mDate;
        currentDateIso = deDateToIso(dateStr);
        continue;
      }

      // Termin-Zeilen, z.B. "09:00 - 09:30 Vitalwerterfassung"
      const mAppt = line.match(reAppt);
      if (mAppt && currentDateIso) {
        const [, startStr, endStr, title] = mAppt;

        const start = new Date(`${currentDateIso}T${startStr}:00`);
        const end   = new Date(`${currentDateIso}T${endStr}:00`);

        termine.push({
          title: title.trim(),
          start,
          end,
        });
      }
    }

    console.log("Gefundene Termine aus PDF:", termine);
    return termine;
  }

  function deDateToIso(ddmmyyyy) {
    const [dd, mm, yyyy] = ddmmyyyy.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }

  function addAppointmentToCalendar(appt) {
    let hour = appt.start.getHours();
    const minute = appt.start.getMinutes();

    // Ab :30 auf die nächste volle Stunde runden
    if (minute >= 30 && hour < END) {
      hour += 1;
    }

    if (hour < START || hour > END) {
      console.warn("Termin liegt außerhalb der Kalenderzeit:", appt);
      return;
    }

    const tag  = iso(appt.start);
    const slot = `${pad(hour)}:00`;

    if (store[tag] && store[tag][slot]) {
      console.warn("Slot bereits belegt, übersprungen:", tag, slot);
      return;
    }

    book(tag, slot, user);
  }

  // ===== Utils =====
  function mondayOf(d) {
    const x  = new Date(d);
    const wd = (x.getDay() + 6) % 7; // Montag=0
    x.setDate(x.getDate() - wd);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function iso(d) {
    return d.toISOString().slice(0, 10);
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function sameDate(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function fmt(d) {
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  }

  function daysBetween(a, b) {
    const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((B - A) / 86400000);
  }

  function div(cls, txt = "") {
    const n = document.createElement("div");
    if (cls) n.className = cls;
    if (txt) n.textContent = txt;
    return n;
  }

  function cell(cls, txt) {
    const n = document.createElement("div");
    n.className = cls === "time" ? "cell time" : "cell";
    n.textContent = txt;
    return n;
  }
})();
