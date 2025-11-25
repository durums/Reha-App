// pdf-import.js - PDF Parsing Logik für Reha-App
(() => {
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
      console.error("PDF-Fehler:", error);
      throw new Error("PDF konnte nicht gelesen werden");
    }
  }

  // Extrahiert Termine und Übungen aus dem Text
  function extractEvents(text) {
    const events = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentDate = null;
    
    lines.forEach(line => {
      // Versuche ein Datum zu finden
      const dateMatch = findDate(line);
      if (dateMatch) {
        currentDate = dateMatch;
      }
      
      // Versuche eine Uhrzeit + Beschreibung zu finden
      const timeMatch = findTimeAndEvent(line, currentDate);
      if (timeMatch && currentDate) {
        events.push(timeMatch);
      }
    });
    
    return events;
  }

  // Sucht nach Datum im String
  function findDate(line) {
    for (const pattern of DATE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const parts = pattern.exec(line);
        if (parts) {
          // Versuche beide Formate
          if (parts[3] && parts[3].length === 4) {
            // DD.MM.YYYY
            return `${parts[3]}-${pad(parts[2])}-${pad(parts[1])}`;
          } else if (parts[1] && parts[1].length === 4) {
            // YYYY-MM-DD
            return `${parts[1]}-${pad(parts[2])}-${pad(parts[3])}`;
          }
        }
      }
    }
    return null;
  }

  // Sucht nach Uhrzeit und Event-Beschreibung
  function findTimeAndEvent(line, date) {
    for (const pattern of TIME_PATTERNS) {
      const match = line.match(pattern);
      if (match && date) {
        const time = match[0];
        // Beschreibung ist der Rest der Zeile nach der Uhrzeit
        const description = line.substring(line.indexOf(time) + time.length).trim();
        
        if (description.length > 3) { // Mindestlänge für sinnvolle Beschreibung
          return {
            date: date,
            time: time + ":00", // Format: HH:MM:SS
            title: description.split(' ').slice(0, 4).join(' '), // Erste 4 Wörter als Titel
            description: description,
            duration: 60 // Standard: 1 Stunde
          };
        }
      }
    }
    return null;
  }

  // Hilfsfunktion für Null-Padding
  function pad(num) {
    return String(num).padStart(2, '0');
  }

  // Generiert HTML-Vorschau der gefundenen Events
  function generatePreview(events) {
    if (events.length === 0) {
      return '<div class="pdf-error">Keine Termine im PDF gefunden</div>';
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

  // Mache Funktionen global verfügbar
  window.PDFImport = {
    parse: parseTherapyPDF,
    generatePreview,
    importToCalendar
  };
})();
