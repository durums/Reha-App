// schedule-data.js - Zentrale Datenstruktur für Reha-Programm

// -------------------------------------------------------
// Allgemeine Reha-Konfiguration
// -------------------------------------------------------
window.REHA_CONFIG = {
    rehaStartDate: new Date(2025, 5, 30), // 30. Juni 2025 (Monat ist 0-indexed)
    maxDays: 15,
    serverUrl: null // null = nur lokaler Modus
};

// -------------------------------------------------------
// STANDARD REHA-PLAN für 15 WERKTAGE
// (Text-basierter Tagesplan, wie bisher genutzt)
// -------------------------------------------------------
window.DEFAULT_SCHEDULE = {

    // Montag (30.06.2025) – Tag 0 – leer / Anreisetag
    0: ``,
    
    // Dienstag (01.07.2025) – Tag 1
    1: `12:30 - 13:00 | Atemtherapie Gruppe | Gruppenraum 3/3.OG | Herr Stertkamp
13:00 - 13:30 | Essen EG | | Herr Pauser für Essen
14:00 - 14:45 | Seminar Psychologe 1 (4. Etage) | Seminarraum 1/4.OG | Frau Thomanek
15:00 - 15:30 | Fango (4. Etage) | | Passive Leistung
15:30 - 16:00 | Seminar Entspannung 1 (4. Etage) | Seminarraum 1/4.OG | Frau Thomanek`,

    // Mittwoch (02.07.2025) – Tag 2
    2: `09:00 - 09:30 | Atemtherapie Gruppe | Gruppenraum 3/3.OG | Frau Kranauge
09:30 - 10:00 | Krankengymnastik (4. Etage) | | Frau Herrmann
10:30 - 11:30 | Trainingseinweisung (3. Etage) | | Herr Lee
12:00 - 12:30 | Essen EG | | Herr Pauser
12:30 - 13:20 | Krankengymnastik Gruppe | Turnraum-Kinder/2.OG | Frau Flock
13:20 - 13:35 | Heißluft (4. Etage) | | Passive Leistung
13:35 - 13:50 | Klassische Massage (4. Etage) | | Frau Rahmen
14:00 - 15:00 | Seminar Arzt 1 (4. Etage) | Seminarraum 1/4.OG | Herr Sachs`,

    // Donnerstag (03.07.2025) – Tag 3
    3: `11:30 - 12:30 | Trainingseinweisung (3. Etage) | | Herr Heimann
13:00 - 13:30 | Essen EG | | Herr Pauser
13:30 - 14:20 | Krankengymnastik Gruppe | Turnraum-Kinder/2.OG | Frau Herrmann
14:30 - 15:00 | Lymphdrainage (4. Etage) | | Frau Thomé
15:00 - 16:00 | Seminar Entspannung 2 (4. Etage) | Seminarraum 1/4.OG | Frau Matjasko`,

    // Freitag (04.07.2025) – Tag 4
    4: `10:30 - 11:00 | Arzt Zwischenuntersuchung (4. Etage) | | Herr Sachs
11:30 - 11:50 | EKG (4. Etage) | | Frau Reimann
12:00 - 12:50 | Krankengymnastik Gruppe | Turnraum-Kinder/2.OG | Herr Stertkamp
13:00 - 14:00 | Trainingseinweisung (3. Etage) | | Frau Im
14:00 - 14:30 | Krankengymnastik (4. Etage) | | Herr Stertkamp
14:30 - 15:00 | Essen EG | | Herr Pauser
15:00 - 15:30 | Fango (4. Etage) | | Passive Leistung`,

    // Montag (07.07.2025) – Tag 5
    5: `08:30 - 09:00 | Atemtherapie Gruppe | Gruppenraum 3/3.OG | Frau Herrmann
09:00 - 10:30 | Trainingstherapie (3. Etage) | Reha 2 | 
10:30 - 11:00 | Fango (4. Etage) | | Passive Leistung
11:00 - 11:30 | Krankengymnastik (4. Etage) | | Frau Flock
11:30 - 11:50 | Essen EG | | Herr Pauser
12:00 - 12:50 | Krankengymnastik Gruppe | Turnraum-Kinder/2.OG | Frau Thom
13:00 - 14:00 | Seminar Ernährung 1 | Seminarraum 1/4.OG | Frau Kling`,

    // Dienstag (08.07.2025) – Tag 6
    6: `10:00 - 10:30 | Atemtherapie Gruppe | Turnraum-Kinder/2.OG | Herr Stertkamp`,

    // Mittwoch (09.07.2025) – Tag 7
    7: ``,

    // Donnerstag (10.07.2025) – Tag 8
    8: ``,

    // Freitag (11.07.2025) – Tag 9
    9: ``,

    // Montag (14.07.2025) – Tag 10
    10: ``,

    // Dienstag (15.07.2025) – Tag 11
    11: ``,

    // Mittwoch (16.07.2025) – Tag 12
    12: ``,

    // Donnerstag (17.07.2025) – Tag 13
    13: ``,

    // Freitag (18.07.2025) – Tag 14
    14: ``
};


// -------------------------------------------------------
// Strukturierter Kalender 2.0 – Reha Plan (Zeitblöcke)
// -------------------------------------------------------
window.REHA_PLAN_EVENTS = [

    // Montag 30.06.2025
    { date: "2025-06-30", start: "09:00", end: "09:30", title: "Vitalwerterfassung",       location: "4. Etage" },
    { date: "2025-06-30", start: "09:30", end: "10:30", title: "Rehaeinführung",            location: "4. Etage" },
    { date: "2025-06-30", start: "10:30", end: "11:00", title: "Lymphdrainage",             location: "4. Etage" },
    { date: "2025-06-30", start: "11:00", end: "11:30", title: "Krankengymnastik",          location: "4. Etage" },
    { date: "2025-06-30", start: "11:30", end: "12:00", title: "Essen",                     location: "EG" },
    { date: "2025-06-30", start: "12:00", end: "13:00", title: "Arzt Eingangsuntersuchung", location: "4. Etage" },

    // 👉 Hier kannst du ALLE weiteren Termine aus deinem PDF hinzufügen.
];

console.log(
    "Schedule data loaded:",
    Object.keys(window.DEFAULT_SCHEDULE).length,
    "days configured"
);
