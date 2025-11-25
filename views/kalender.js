(() => {

  // ===== Konstanten =====
  const START = 8, END = 17; // Stunden inkl.
  const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

  // ===== State =====
  let store = loadStore();
  let user  = window.currentUserName || "Gast";
  let weekStart = mondayOf(new Date());

  // ===== DOM Helpers =====
  const $ = (id) => document.getElementById(id);
  const header     = () => $("header");
  const hours      = () => $("hours");
  const daysC      = () => $("days");
  const rangeLabel = () => $("rangeLabel");
  const dlg        = () => $("dialog");
  const dlgTitle   = () => $("dlgTitle");
  const dlgList    = () => $("dlgList");

  // ===== Init (robust fürs dynamische Nachladen) =====
  document.addEventListener("DOMContentLoaded", readyOrWait);
  // Falls das Script nachträglich injiziert wird, direkt prüfen:
  readyOrWait();

  function readyOrWait() {
    const ok = header() && hours() && daysC();
    if (ok) {
      bindOnce();
      setTimeout(render, 300); // kleiner Puffer bis Layout steht
    } else {
      // Warten, bis die View im DOM ist
      const t = setInterval(() => {
        if (header() && hours() && daysC()) {
          clearInterval(t);
          bindOnce();
          setTimeout(render, 300);
        }
      }, 120);
    }
  }

  // Nur noch prüfen, ob PDFImport verfügbar ist
  async function ensurePDFImport() {
    // Wenn bereits im globalen Scope, sofort zurück
    if (typeof window.PDFImport !== 'undefined') {
      console.log('✅ PDFImport bereits verfügbar');
      return;
    }
    
    console.log('📦 Lade PDFImport-Modul...');
    
    // 🔧 WICHTIG: Absoluter Pfad vom Root-Verzeichnis
    // Die Datei liegt im selben Ordner wie index.html, NICHT in views/
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '../pdf-import.js'; 
      
      script.onload = () => {
        if (typeof window.PDFImport === 'undefined') {
          reject(new Error('PDFImport-Modul hat sich nicht registriert - Syntaxfehler?'));
        } else {
          console.log('✅ PDFImport-Modul erfolgreich geladen');
          resolve();
        }
      };
      
      script.onerror = () => {
        reject(new Error('❌ pdf-import.js nicht gefunden unter /pdf-import.js - Pfad prüfen!'));
      };
      
      document.head.appendChild(script);
    });
  }

  function bindOnce() {
    $("prevBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart, -7); render(); });
    $("nextBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart,  7); render(); });
    $("todayBtn")?.addEventListener("click", () => { weekStart = mondayOf(new Date()); render(); });

    $("bookBtn")?.addEventListener("click", () => pickFreeSlot(bookPicked));
    $("mineBtn")?.addEventListener("click", showMine);
    $("moveBtn")?.addEventListener("click", moveOrCancel);
    $("exportBtn")?.addEventListener("click", exportAllMyEventsICS);

    // 🔧 KORRIGIERT: PDF-Import Button Event-Handler
    $("pdfImportBtn")?.addEventListener("click", () => {
      $("pdfFileInput").click();
    });
    
    // 🔧 KORRIGIERT: Error-Handling und besserer User-Feedback
    $("pdfFileInput")?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const modal = $("pdfImportModal");
      const preview = $("pdfPreview");
      const confirmBtn = $("pdfConfirmBtn");
      
      try {
        preview.innerHTML = '<div>⏳ Lade PDF-Import-Modul...</div>';
        confirmBtn.style.display = 'none';
        modal.showModal();
        
        // Modul sicher laden
        await ensurePDFImport();
        
        preview.innerHTML = '<div>📄 Parse PDF...</div>';
        const events = await PDFImport.parse(file);
        
        if (events.length === 0) {
          preview.innerHTML = '<div class="pdf-error">⚠️ Keine Termine im PDF gefunden</div>';
          return;
        }
        
        preview.innerHTML = PDFImport.generatePreview(events);
        confirmBtn.style.display = 'inline-block';
        
        // 🔧 KORRIGIERT: Klare Rückmeldung nach Import
        confirmBtn.onclick = () => {
          const result = PDFImport.importToCalendar(events, store, user);
          saveStore();
          modal.close();
          alert(`✅ Import erfolgreich!\n\nImportiert: ${result.imported} Termine\n⚠️ Übersprungen: ${result.conflicts} Konflikte`);
          render();
        };
        
      } catch (error) {
        console.error('❌ PDF-Import Fehler:', error);
        preview.innerHTML = `
          <div class="pdf-error">
            <strong>Fehler:</strong> ${error.message}<br>
            <small>Öffne die Browser-Console (F12) für Details</small>
          </div>`;
        confirmBtn.style.display = 'none';
      }
    });
  }

  // ===== Render =====
  function render(){
    // Kopfzeile
    header().innerHTML = "";
    header().append(cell("time","Zeit"));

    const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
    days.forEach(d => {
      const label = `${DAYS[(d.getDay()+6)%7]} ${d.getDate()}.${d.getMonth()+1}.`;
      header().append(cell("cell", label));
    });
    rangeLabel() && (rangeLabel().textContent = `${fmt(days[0])} – ${fmt(days[6])}`);

    // Stunden links
    hours().innerHTML = "";
    for (let h = START; h <= END; h++) {
      hours().append(div("hour", `${pad(h)}:00`));
    }

    // Grid (Slots)
    daysC().innerHTML = "";
    const today = new Date();
    days.forEach(d => {
      const tag = iso(d);
      const col = div("col" + (sameDate(d, today) ? " today" : ""));
      for (let h = START; h <= END; h++) {
        const slot = `${pad(h)}:00`;
        const who  = (store[tag] || {})[slot];
        const cls  = who ? (who === user ? "own" : "booked") : "free";
        const el   = div(`slot ${cls}`, who ? (who === user ? "Mein Termin" : "Belegt") : "");
        el.dataset.date = tag;
        el.dataset.slot = slot;
        el.onclick = onSlotClick;
        col.append(el);
      }
      daysC().append(col);
    });

  }

  // ===== Klick-Logik =====
  function onSlotClick(e){
    const tag  = e.currentTarget.dataset.date;
    const slot = e.currentTarget.dataset.slot;
    const who  = (store[tag]||{})[slot];

    if (!who) {
      if (!user) return alert("Bitte anmelden, um Termine zu buchen.");
      if (confirm(`Möchtest du ${tag} um ${slot} buchen?`)) {
        book(tag, slot, user);
        alert(`Termin eingetragen: ${tag} ${slot}`);
        render();
      }
      return;
    }

    if (who === user) {
      const rest = daysBetween(new Date(), new Date(tag));
      if (rest < 3) { alert("Verschieben/Absagen nur 3 Tage vor dem Termin möglich."); return; }

      const a = prompt("Eigener Termin: 'v' verschieben, 'a' absagen, 'x' exportieren:");
      if (a === "a") {
        unbook(tag, slot);
        alert("Termin abgesagt.");
        render();
      } else if (a === "v") {
        unbook(tag, slot);
        pickFreeSlot((ntag, nslot) => {
          if (ntag) { book(ntag, nslot, user); alert(`Termin verschoben auf: ${ntag} ${nslot}`); }
          else { alert("Verschieben abgebrochen. Alter Termin wurde entfernt."); }
          render();
        });
      } else if (a === "x") {
        exportSingleEventICS(tag, slot, user);
      } else if (a !== null) {
        alert("Ungültige Eingabe.");
      }
      return;
    }

    alert("Dieser Slot ist bereits belegt.");
  }

  // ===== Dialoge =====
  function pickFreeSlot(cb){
    const items = freeSlotsThisWeek();
    if (items.length === 0) { alert("Keine freien Termine verfügbar (diese Woche)."); return; }
    dlgTitle().textContent = "Freien Termin auswählen";
    dlgList().innerHTML = "";
    for (const [tag,slot] of items) {
      const row = div("item");
      row.append(div("", `${tag} ${slot}`));
      const b = document.createElement("button");
      b.textContent = "Auswählen";
      b.onclick = () => { dlg().close(); cb(tag,slot); };
      row.append(b);
      dlgList().append(row);
    }
    dlg().showModal();
  }

  function bookPicked(tag,slot){
    book(tag,slot,user);
    alert(`Termin eingetragen: ${tag} ${slot}`);
    render();
  }

  function showMine(){
    const mine = mySlots();
    if (mine.length === 0) { alert("Keine Termine gefunden."); return; }
    alert(mine.map(([t,s]) => `${t} ${s}`).join("\n"));
  }

  function moveOrCancel(){
    const mine = mySlots();
    if (mine.length === 0) { alert("Keine Termine gefunden."); return; }
    dlgTitle().textContent = "Eigene Termine";
    dlgList().innerHTML = "";
    for (const [tag,slot] of mine) {
      const row = div("item");
      row.append(div("", `${tag} ${slot}`));
      const b = document.createElement("button");
      b.textContent = "Wählen";
      b.onclick = () => {
        dlg().close();
        const rest = daysBetween(new Date(), new Date(tag));
        if (rest < 3) { alert("Verschieben/Absagen nur 3 Tage vor dem Termin möglich."); return; }
        const a = prompt("Tippe 'v' zum Verschieben, 'a' zum Absagen, 'x' für Export:");
        if (a === "a") { unbook(tag,slot); alert("Termin abgesagt."); render(); }
        else if (a === "v") {
          unbook(tag,slot);
          pickFreeSlot((ntag,nslot) => { if (ntag) { book(ntag,nslot,user); alert(`Termin verschoben auf: ${ntag} ${nslot}`); } render(); });
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
  function loadStore(){ try { return JSON.parse(localStorage.getItem("kal_data")||"{}"); } catch { return {}; } }
  function saveStore(){ localStorage.setItem("kal_data", JSON.stringify(store)); }
  function book(tag,slot,name){ (store[tag] ||= {})[slot] = name; saveStore(); }
  function unbook(tag,slot){
    if (store[tag]) {
      delete store[tag][slot];
      if (Object.keys(store[tag]).length === 0) delete store[tag];
      saveStore();
    }
  }

  // ===== Queries =====
  function mySlots(){
    const out = [];
    Object.entries(store).forEach(([tag,slots]) => {
      Object.entries(slots).forEach(([slot,name]) => { if (name === user) out.push([tag,slot]); });
    });
    out.sort((a,b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
    return out;
  }

  function freeSlotsThisWeek(){
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i), tag = iso(d);
      for (let h = START; h <= END; h++) {
        const slot = `${pad(h)}:00`;
        if (!store[tag] || !store[tag][slot]) out.push([tag,slot]);
      }
    }
    return out;
  }

  // ===== ICS Export =====
  function exportAllMyEventsICS(){
    const mine = mySlots();
    if (mine.length === 0) { alert("Keine eigenen Termine zum Exportieren."); return; }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Reha App//Kalender//DE",
      "CALSCALE:GREGORIAN",
    ];
    const uidBase = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    mine.forEach(([tag, slot], i) => {
      const { dtStart, dtEnd } = toICSTimes(tag, slot, 60);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uidBase}-${i}@reha-app.local`,
        `DTSTAMP:${toICSDateTime(new Date())}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:Reha-Termin (${slot})`,
        `DESCRIPTION:Gebucht über Reha-App`,
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");
    downloadText(lines.join("\r\n"), "reha-termine.ics", "text/calendar");
  }

  function exportSingleEventICS(tag, slot, who){
    const { dtStart, dtEnd } = toICSTimes(tag, slot, 60);
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Reha App//Kalender//DE",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@reha-app.local`,
      `DTSTAMP:${toICSDateTime(new Date())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:Reha-Termin (${slot})`,
      `DESCRIPTION:Gebucht von ${who}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    downloadText(lines.join("\r\n"), `termin-${tag}-${slot.replace(":","")}.ics`, "text/calendar");
  }

  function toICSTimes(tag, slot, minutes){
    const start = new Date(`${tag}T${slot}:00`);         // lokale Zeit
    const end   = new Date(start.getTime() + minutes*60000);
    return { dtStart: toICSDateTime(start), dtEnd: toICSDateTime(end) };
  }

  function toICSDateTime(d){
    // als UTC-Zeitstempel YYYYMMDDTHHMMSSZ
    const z = new Date(d.getTime() - d.getTimezoneOffset()*60000);
    return z.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  function downloadText(txt, filename, mime){
    const blob = new Blob([txt], { type: mime || "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ===== Utils =====
  function mondayOf(d){ const x = new Date(d); const wd = (x.getDay()+6)%7; x.setDate(x.getDate()-wd); x.setHours(0,0,0,0); return x; }
  function addDays(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
  function iso(d){ return d.toISOString().slice(0,10); }
  function pad(n){ return String(n).padStart(2,"0"); }
  function sameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function fmt(d){ return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`; }
  function daysBetween(a,b){ const A = new Date(a.getFullYear(),a.getMonth(),a.getDate()); const B = new Date(b.getFullYear(),b.getMonth(),b.getDate()); return Math.round((B-A)/86400000); }
  function div(cls,txt=""){ const n=document.createElement("div"); if(cls) n.className=cls; if(txt) n.textContent=txt; return n; }
  function cell(cls,txt){ const n=document.createElement("div"); n.className = cls==="time" ? "cell time" : "cell"; n.textContent=txt; return n; }
})();