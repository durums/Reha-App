// schedule-data.js - Zentrale Datenstruktur für Reha-Programm

window.REHA_CONFIG = {
    rehaStartDate: new Date(2025, 5, 30), // June 30, 2025 (month is 0-indexed)
    maxDays: 15,
    serverUrl: null // null = nur lokaler Modus, für Server echte URL eintragen
};

// Default schedule template
window.DEFAULT_SCHEDULE = {
    // Montag (30.06.2025) - Tag 0 - leer da Anreisetag
    0: ``,
    
    // Dienstag (01.07.2025) - Tag 2
    1: `12:30 - 13:00 | Atemtherapie Gruppe | Gruppenraum 3/ 3.OG | Herr Stertkamp
13:00 - 13:30 | Essen EG | | Herr Pauser für Essen
14:00 - 14:45 | Seminar Psychologe 1 4.Etage | Seminarraum 1/4.OG | Frau Thomanek
15:00 - 15:30 | Fango 4.Etage | | Herr Passive-Leistung
15:30 - 16:00 | Seminar Entspannung 1 4.Etage | Seminarraum 1/4.OG | Frau Thomanek`,

    // Mittwoch (02.07.2025) - Tag 3
    2: `09:00 - 09:30 | Atemtherapie Gruppe | Gruppenraum 3/ 3.OG | Frau Kranauge
09:30 - 10:00 | Krankengymnastik 4.Etage | | Frau Herrmann
10:30 - 11:30 | Training Einweisung 3.Etage | | Herr Lee
12:00 - 12:30 | Essen EG | | Herr Pauser für Essen
12:30 - 13:20 | Krankengymnastik Gruppe | Turnraum-Kinder/ 2.OG | Frau Flock
13:20 - 13:35 | Heißluft 4.Etage | | Herr Passive-Leistung
13:35 - 13:50 | Klassische Massage 4.Etage | | Frau Rahmen
14:00 - 15:00 | Seminar Arzt 1 4.Etage | Seminarraum 1/4.OG | Herr Sachs`,

    // Donnerstag (03.07.2025) - Tag 4
    3: `11:30 - 12:30 | Training Einweisung 3.Etage | | Herr Heimann
13:00 - 13:30 | Essen EG | | Herr Pauser für Essen
13:30 - 14:20 | Krankengymnastik Gruppe | Turnraum-Kinder/ 2.OG | Frau Herrmann
14:30 - 15:00 | Lymphdrainage 4.Etage | | Frau Thomé
15:00 - 16:00 | Seminar Entspannung 2 4.Etage | Seminarraum 1/4.OG | Frau Matjasko`,

    // Freitag (04.07.2025) - Tag 5
    4: `10:30 - 11:00 | Arzt Zwischenunters. 30 Min 4.Etage | | Herr Sachs
11:30 - 11:50 | EKG 4.Etage | | Frau Reimann
12:00 - 12:50 | Krankengymnastik Gruppe | Turnraum-Kinder/ 2.OG | Herr Stertkamp
13:00 - 14:00 | Training Einweisung 3.Etage | | Frau Im
14:00 - 14:30 | Krankengymnastik 4.Etage | | Herr Stertkamp
14:30 - 15:00 | Essen EG | | Herr Pauser für Essen
15:00 - 15:30 | Fango 4.Etage | | Herr Passive-Leistung`,

    // Montag (07.07.2025) - Tag 6
    5: `08:30 - 09:00 | Atemtherapie Gruppe 3. Etage Gruppenraum 3/ 3.OG | | Frau Herrmann
09:00 - 10:30 | Trainingstherapie 3. Etage Sporttherapie Reha 2/ 3.OG | | 
10:30 - 11:00 | Fango 4. Etage | | Herr Passive-Leistung
11:00 - 11:30 | Krankengymnastik 4. Etage | | Frau Flock
11:30 - 11:50 | Essen EG | | Herr Pauser für Essen
12:00 - 12:50 | Krankengymnastik Gruppe | Turnraum-Kinder/ 2.OG | Frau Thom
13:00 - 14:00 | Seminar Ernährung 1 Seminarraum 1/ 4.OG | | Frau Kling`,

    // Dienstag (08.07.2025) - Tag 7
    6: `10:00 - 10:30 | Atemtherapie Gruppe | Turnraum-Kinder/ 2.OG | Herr Stertkamp`,

    // Weitere Tage können hier ergänzt werden...
};

console.log('Schedule data loaded:', Object.keys(window.DEFAULT_SCHEDULE).length, 'days configured');