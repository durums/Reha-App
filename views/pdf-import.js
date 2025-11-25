// pdf-import.js - PDF Parsing Logik für Reha-App

(() => {
  // Prüfe, ob pdf.js verfügbar ist
  if (typeof window.pdfjsLib === 'undefined') {
    console.error('❌ pdf.js ist nicht geladen. Stelle sicher, dass pdf.min.js VOR diesem Script geladen wird.');
    // Mache Fehler sichtbar für den User
    window.PDFImport = {
      parse: () => { throw new Error('PDF.js Bibliothek fehlt. Bitte lade pdf.min.js vorher.'); },
      generatePreview: () => '<div class="pdf-error">PDF.js Bibliothek nicht geladen</div>',
      importToCalendar: () => ({ imported: 0, conflicts: 0 })
    };
    return; // Stoppe weitere Ausführung
  }

  // Konfiguration für PDF Parsing
  const DATE_PATTERNS = [
    /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g,  // 15.11.2025
    /\b(\d{4})-(\d{2})-(\d{2})\b/g,        // 2025-11-15
  ];
  
  const TIME_PATTERNS = [
    /\b(\d{1,2}):(\d{2})\b/g,              // 14:30
  ];

  // Hauptfunktion: Parst PDF und gibt strukturierte Daten zurück
  async function parseTherapyPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      
      // Alle Seiten durchgehen
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(" ");
        fullText += text + "\n";
      }
      
      return extractEvents(fullText);
    } catch (error) {
      console.error("❌ PDF-Fehler:", error);
      throw new Error(`PDF konnte nicht gelesen werden: ${error.message}`);
    }
  }

  // Extrahiert Termine und Übungen aus dem Text
  function extractEvents(text) {
    const events = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentDate = null;
    
    lines.forEach(line => {
      // 1. Suche nach Datum + Wochentag (z.B. "30.06.2025 Montag")
      const dateLineMatch = line.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+\w+/);
      if (dateLineMatch) {
        const day = dateLineMatch[1];
        const month = dateLineMatch[2];
        const year = dateLineMatch[3];
        currentDate = `${year}-${pad(month)}-${pad(day)}`;
        return; // Nächste Zeile
      }
      
      // 2. Suche nach Uhrzeit-Bereich (z.B. "09:00-09:30")
      const timeRangeMatch = line.match(/\b(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\b/);
      if (timeRangeMatch && currentDate) {
        const startTime = `${timeRangeMatch[1]}:${timeRangeMatch[2]}`;
        const description = line.substring(line.indexOf(timeRangeMatch[0]) + timeRangeMatch[0].length).trim();
        
        if (description.length > 3) {
          events.push({
            date: currentDate,
            time: startTime + ":00", // Nur Startzeit nehmen
            title: description.split(' ').slice(0, 6).join(' '), // Erste 6 Wörter
            description: description,
            duration: 60 // Standard 1 Stunde
          });
        }
        return;
      }
      
      // 3. Fallback: Einzelne Uhrzeit (falls vorhanden)
      const singleTimeMatch = line.match(/\b(\d{1,2}):(\d{2})\b/);
      if (singleTimeMatch && currentDate && line.length > 10) {
        const description = line.substring(line.indexOf(singleTimeMatch[0]) + singleTimeMatch[0].length).trim();
        if (description.length > 3) {
          events.push({
            date: currentDate,
            time: singleTimeMatch[0] + ":00",
            title: description.split(' ').slice(0, 6).join(' '),
            description: description,
            duration: 60
          });
        }
      }
    });
    
    return events;
  }

  // Hilfsfunktion für Null-Padding
  function pad(num) {
    return String(num).padStart(2, '0');
  }

  // Generiert HTML-Vorschau der gefundenen Events
  function generatePreview(events) {
    if (events.length === 0) {
      return '<div class="pdf-error">⚠️ Keine Termine im PDF gefunden</div>';
    }
    
    let html = `<p><strong>${events.length} Termine gefunden:</strong></p>`;
    events.forEach(event => {
      html += `
        <div class="pdf-event-item">
          <strong>${event.date} ${event.time}</strong><br>
          ${event.description}
        </div>
      `;
    });
    return html;
  }

  // Exportiert Events in den bestehenden Kalender-Speicher
  function importToCalendar(events, store, user) {
    let imported = 0;
    let conflicts = 0;
    
    events.forEach(event => {
      const slot = event.time.substring(0, 5); // HH:MM
      const existing = (store[event.date] || {})[slot];
      
      if (!existing) {
        // Termin eintragen
        if (!store[event.date]) store[event.date] = {};
        store[event.date][slot] = `Therapie: ${event.title}`;
        imported++;
      } else {
        conflicts++;
      }
    });
    
    return { imported, conflicts };
  }

  // 🔧 KORRIGIERT: Mache Funktionen global verfügbar
  window.PDFImport = {
    parse: parseTherapyPDF,
    generatePreview: generatePreview,
    importToCalendar: importToCalendar
  };
})();