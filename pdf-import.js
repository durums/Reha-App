function extractEvents(text) {
  const events = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentDate = null;
  let lastLineWasTime = false;
  let pendingTime = null;

  // Hilfsfunktion: Prüft, ob Zeile eine Beschreibung ist (kein Datum/Zeit/Meta)
  function isDescription(line) {
    if (line.length < 3) return false;
    if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(line)) return false; // Datum
    if (TIME_PATTERN.test(line)) return false; // Zeit
    if (/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)$/i.test(line)) return false; // Wochentag
    if (/^(Herr|Frau|Dr\.)\s+\w+/i.test(line)) return false; // Mitarbeiter
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
        break;
      }
    }
    if (dateFound) continue;

    // 2. ZEIT SUCHEN
    const timeMatch = line.match(TIME_PATTERN);
    if (timeMatch && currentDate) {
      const startTime = `${timeMatch[1]}:${timeMatch[2]}`;
      
      // Versuche Beschreibung aus aktueller Zeile zu extrahieren
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

    // 4. RESET ZUSTAND
    lastLineWasTime = false;
    pendingTime = null;
  }
  
  console.log(`📊 Insgesamt ${events.length} Events gefunden`);
  return events;
}

// Hilfsfunktion: Erstellt Event-Objekt
function createEvent(date, startTime, description) {
  const event = {
    date: date,
    time: startTime + ":00",
    title: description.split(' ').slice(0, 6).join(' '),
    description: description,
    duration: 60
  };
  console.log('✅ Event gefunden:', event);
  return event;
}