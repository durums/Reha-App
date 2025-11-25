(() => {
  // ===== Konstanten =====
  const START = 8, END = 17;
  const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

  // ===== State =====
  let store = loadStore();
  let user  = window.currentUserName || "Gast";
  let weekStart = mondayOf(new Date());

  // ===== DOM Helpers =====
  const $ = (id) => document.getElementById(id);

  // ===== Init =====
  document.addEventListener("DOMContentLoaded", readyOrWait);
  readyOrWait();

  function readyOrWait() {
    const ok = $("header") && $("hours") && $("days");
    if (ok) {
      bindOnce();
      setTimeout(render, 300);
    } else {
      const t = setInterval(() => {
        if ($("header") && $("hours") && $("days")) {
          clearInterval(t);
          bindOnce();
          setTimeout(render, 300);
        }
      }, 120);
    }
  }

  function bindOnce() {
    $("prevBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart, -7); render(); });
    $("nextBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart,  7); render(); });
    $("todayBtn")?.addEventListener("click", () => { weekStart = mondayOf(new Date()); render(); });
    $("bookBtn")?.addEventListener("click", () => pickFreeSlot(bookPicked));
    $("mineBtn")?.addEventListener("click", showMine);
    $("moveBtn")?.addEventListener("click", moveOrCancel);
    $("exportBtn")?.addEventListener("click", exportAllMyEventsICS);

    // PDF-Import
    const pdfBtn = $("pdfImportBtn");
    const pdfInput = $("pdfFileInput");
    if (pdfBtn && pdfInput) {
      pdfBtn.addEventListener("click", () => pdfInput.click());
      pdfInput.addEventListener("change", onPdfChosen);
    }
  }

  // ... (alle anderen Funktionen bleiben gleich) ...

  // ===== PDF-Import (KORRIGIERT) =====
  async function onPdfChosen(evt) {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;

    const modal = $("pdfImportModal");
    const preview = $("pdfPreview");
    const confirmBtn = $("pdfConfirmBtn");
    
    try {
      if (typeof window.PDFImport === 'undefined') {
        await loadPdfImportModule();
      }
      
      preview.innerHTML = '<div>⏳ Parse PDF...</div>';
      confirmBtn.style.display = 'none';
      modal.showModal();

      const events = await window.PDFImport.parse(file);
      
      if (events.length === 0) {
        preview.innerHTML = '<div class="pdf-error">⚠️ Keine Termine im PDF gefunden.</div>';
        return;
      }
      
      preview.innerHTML = window.PDFImport.generatePreview(events);
      confirmBtn.style.display = 'inline-block';
      
      confirmBtn.onclick = () => {
        const result = window.PDFImport.importToCalendar(events, store, user);
        saveStore();
        modal.close();
        alert(`✅ Import erfolgreich!\n\nImportiert: ${result.imported} Termine\n⚠️ Übersprungen: ${result.conflicts} Konflikte`);
        render();
      };
      
    } catch (error) {
      console.error('❌ PDF-Import Fehler:', error);
      preview.innerHTML = `<div class="pdf-error"><strong>Fehler:</strong> ${error.message}</div>`;
      confirmBtn.style.display = 'none';
    } finally {
      evt.target.value = "";
    }
  }

  // Hilfsfunktion: Lädt pdf-import.js dynamisch
  function loadPdfImportModule() {
    return new Promise((resolve, reject) => {
      if (typeof window.PDFImport !== 'undefined') {
        resolve();
        return;
      }
      
      console.log('📦 Lade PDFImport-Modul...');
      const script = document.createElement('script');
      
      // 🔧 WICHTIG: Pfad an Ihre Struktur anpassen!
      // Wenn kalender.js im 'views/' Ordner ist und pdf-import.js im Root:
      script.src = '../pdf-import.js';
      
      // Wenn beide im gleichen Ordner sind (nicht Ihr Fall):
      // script.src = './pdf-import.js';
      
      script.onload = () => {
        if (typeof window.PDFImport === 'undefined') {
          reject(new Error('PDFImport-Modul hat sich nicht registriert'));
        } else {
          console.log('✅ PDFImport-Modul geladen');
          resolve();
        }
      };
      
      script.onerror = () => reject(new Error(`❌ pdf-import.js nicht gefunden unter ${script.src} - Pfad prüfen!`));
      document.head.appendChild(script);
    });
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