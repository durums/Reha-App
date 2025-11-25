(() => {
  // Defensive Prüfung
  if (typeof window.pdfjsLib === 'undefined') {
    console.error('❌ pdf.js ist nicht geladen.');
    window.PDFImport = {
      parse: () => { throw new Error('PDF.js Bibliothek fehlt.'); },
      generatePreview: () => '<div class="pdf-error">PDF.js Bibliothek nicht geladen</div>',
      importToCalendar: () => ({ imported: 0, conflicts: 0 })
    };
    return;
  }

  // 🔧 FLEXIBLERE PATTERNS für gescannte PDFs
  const DATE_PATTERNS = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+\w+/,          // 30.06.2025 Montag
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,                // 30.06.2025
  ];
  
  const TIME_PATTERN = /\b(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;  // 09:00-09:30

  // Hauptfunktion: Parst PDF und gibt strukturierte Daten zurück
  async function parseTherapyPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(" ");
        fullText += text + "\n";
      }
      
      console.log('📄 PDF Text extrahiert (erste 500 Zeichen):', fullText.substring(0, 500));
      return extractEvents(fullText);
    } catch (error) {
      console.error("❌ PDF-Fehler:", error);
      throw new Error(`PDF konnte nicht gelesen werden: ${error.message}`);
    }
  }

  // 🔧 KORRIGIERTE Event-Extraktion für PDF-Struktur
  function extractEvents(text) {
    const events = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentDate = null;
    let lastLineWasTime = false;
    let pendingTime = null;

    // Hilfsfunktion: Prüft, ob Zeile eine Beschreibung ist
    function isDescription(line) {
      if (line.length < 3) return false;
      if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(line)) return false; // Datum
      if (TIME_PATTERN.test(line)) return false; // Zeit
      if (/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)$/i.test(line)) return false; // Wochentag
      if (/^(Herr|Frau|Dr\.)\s+\w+/i.test(line)) return false; // Mitarbeiter
      if (/^(Essen|Gruppenraum|Turnraum|Seminarraum|Training|Sporttherapie)/i.test(line)) return false; // Orte
      return true;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`📄 Zeile ${i}: "${line}"`);

      // 1. DATUM SUCHEN
      let dateFound = false;
      for (const pattern of DATE_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          const day = match[1], month = match[2], year = match[3];
          currentDate = `${year}-${pad(month)}-${pad(day)}`;
          console.log('📅 Datum gefunden:', currentDate);
          dateFound = true;
          lastLineWasTime = false;
          pendingTime = null;
          break;
        }
      }
      if (dateFound) continue;

      // 2. ZEIT SUCHEN
      const timeMatch = line.match(TIME_PATTERN);
      if (timeMatch && currentDate) {
        const startTime = `${pad(timeMatch[1])}:${pad(timeMatch[2])}`;
        
        // Versuche Beschreibung aus aktueller Zeile zu extrahieren (nach der Zeit)
        let description = line.substring(line.indexOf(timeMatch[0]) + timeMatch[0].length).trim();
        
        // Wenn keine Beschreibung da ist, markiere für nächste Zeile
        if (description.length < 3) {
          pendingTime = { date: currentDate, time: startTime };
          lastLineWasTime = true;
          continue;
        }
        
        // Beschreibung war in derselben Zeile
        events.push(createEvent(currentDate, startTime, description));
        lastLineWasTime = false;
        continue;
      }

      // 3. BESCHREIBUNG FÜR PENDENTE ZEIT
      if (lastLineWasTime && pendingTime && isDescription(line)) {
        events.push(createEvent(pendingTime.date, pendingTime.time, line));
        pendingTime = null;
        lastLineWasTime = false;
        continue;
      }

      // 4. RESET ZUSTAND wenn nichts passt
      lastLineWasTime = false;
      pendingTime = null;
    }
    
    console.log(`📊 Insgesamt ${events.length} Events gefunden`);
    return events;
  }

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function createEvent(date, startTime, description) {
    return {
      date: date,
      time: startTime + ":00",
      title: description.split(' ').slice(0, 6).join(' '),
      description: description,
      duration: 60
    };
  }

  function generatePreview(events) {
    if (events.length === 0) {
      return '<div class="pdf-error">⚠️ Keine Termine im PDF gefunden.</div>';
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

  function importToCalendar(events, store, user) {
    let imported = 0;
    let conflicts = 0;
    
    events.forEach(event => {
      const slot = event.time.substring(0, 5);
      const existing = (store[event.date] || {})[slot];
      
      if (!existing) {
        if (!store[event.date]) store[event.date] = {};
        store[event.date][slot] = `Therapie: ${event.title}`;
        imported++;
      } else {
        conflicts++;
      }
    });
    
    return { imported, conflicts };
  }

  // Modul exportieren
  window.PDFImport = {
    parse: parseTherapyPDF,
    generatePreview: generatePreview,
    importToCalendar: importToCalendar
  };
})();