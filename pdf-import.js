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
      
      console.log('📄 PDF Text extrahiert:', fullText.substring(0, 500) + '...');
      return extractEvents(fullText);
    } catch (error) {
      console.error("❌ PDF-Fehler:", error);
      throw new Error(`PDF konnte nicht gelesen werden: ${error.message}`);
    }
  }

  // 🔧 VERBESSERTE Event-Extraktion
  function extractEvents(text) {
    const events = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentDate = null;
    let lastLine = ''; // zum Zusammensetzen von Beschreibungen
    
    lines.forEach((line, idx) => {
      console.log(`📄 Zeile ${idx}: "${line}"`); // DEBUG
      
      // 1. SUCHE DATUM (flexibel, nicht nur am Zeilenanfang)
      let dateMatch = null;
      for (const pattern of DATE_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          const day = match[1], month = match[2], year = match[3];
          currentDate = `${year}-${pad(month)}-${pad(day)}`;
          console.log('📅 Datum gefunden:', currentDate);
          lastLine = ''; // Reset bei neuem Datum
          return;
        }
      }
      
      // 2. SUCHE ZEIT + BESCHREIBUNG
      const timeMatch = line.match(TIME_PATTERN);
      if (timeMatch && currentDate) {
        const startTime = `${timeMatch[1]}:${timeMatch[2]}`;
        // Beschreibung ist ALLES nach der Zeit bis zum Ende der Zeile
        let description = line.substring(line.indexOf(timeMatch[0]) + timeMatch[0].length).trim();
        
        // Wenn Beschreibung leer ist, nimm die vorherige Zeile
        if (description.length < 3 && lastLine.length > 3) {
          description = lastLine;
        }
        
        if (description.length > 3) {
          const event = {
            date: currentDate,
            time: startTime + ":00",
            title: description.split(' ').slice(0, 6).join(' '),
            description: description,
            duration: 60
          };
          console.log('✅ Event gefunden:', event);
          events.push(event);
        }
        lastLine = ''; // Reset
        return;
      }
      
      // 3. SPEICHERE Zeile für nächsten Durchgang (falls es eine Beschreibung ist)
      if (line.length > 5 && !line.match(/^\d/) && !line.includes('---')) {
        lastLine = line;
      }
    });
    
    console.log(`📊 Insgesamt ${events.length} Events gefunden`);
    return events;
  }

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function generatePreview(events) {
    if (events.length === 0) {
      return '<div class="pdf-error">⚠️ Keine Termine im PDF gefunden. Die PDF ist möglicherweise gescannt oder schlecht lesbar.</div>';
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

  window.PDFImport = {
    parse: parseTherapyPDF,
    generatePreview: generatePreview,
    importToCalendar: importToCalendar
  };
})();