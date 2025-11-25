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
    1: `08:00 - 08:30 | Frühstück EG | | 
09:00 - 09:30 | Einweisung Reha | 4. Etage | Frau Beispiel
10:00 - 10:30 | Atemtherapie Gruppe | Gruppenraum 1/3.OG | Frau Beispiel
11:00 - 11:30 | Krankengymnastik | 4. Etage | Herr Beispiel
12:00 - 12:30 | Mittagessen EG | | 
13:00 - 13:30 | Einführung Ergotherapie | 3. Etage | Frau Beispiel
14:00 - 14:45 | Entspannungstherapie | Gruppenraum 2/3.OG | Herr Beispiel
15:00 - 15:30 | Spaziergang (Selbständig) | Außenbereich | 
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
14:00 - 14:30 | Entspannung 3 (4. Etage) | Seminarraum 1/4.OG | Frau Schubert
15:00 - 16:00 | Wahrnehmungserfahrung 1 | Turnraum-Kinder/2.OG | Frau Thomanek`,

    // Freitag (04.07.2025) – Tag 4
    4: `06:45 - 07:15 | Pulstest & Blutdruck | 4. Etage | Pflege
07:15 - 07:45 | Fahrradergometrie | 3. Etage | Therapieteam
08:00 - 08:30 | Frühstück EG | | 
09:00 - 09:30 | Atemtherapie Gruppe | Gruppenraum 3/3.OG | Frau Herrmann
10:00 - 10:45 | Entspannungstherapie | Seminarraum 2/4.OG | Frau Flock
11:00 - 11:45 | Trainingstherapie | 3. Etage | Therapieteam
12:00 - 12:30 | Essen EG | | 
13:00 - 13:45 | Krankengymnastik Gruppe | Turnraum-Kinder/2.OG | Frau Thom
14:00 - 14:30 | Fußreflexzonenmassage | 4. Etage | Frau Rahmen`,

    // Montag (07.07.2025) – Tag 5
    5: `08:30 - 09:00 | Atemtherapie Gruppe | Gruppenraum 3/3.OG | Frau Herrmann
09:00 - 10:30 | Trainingstherapie (3. Etage) | Reha 2 | 
10:30 - 11:00 | Fango (4. Etage) | | Passive Leistung
11:00 - 11:30 | Krankengymnastik (4. Etage) | | Frau Flock
11:30 - 11:50 | Essen EG | | Herr Pauser
12:00 - 12:50 | Krankengymnastik Gruppe | Turnraum-Kinder/2.OG | Frau Thom
13:00 - 13:45 | Ergotherapie Gruppe | Ergoraum 1/3.OG | Frau Beispiel
14:00 - 14:30 | Entspannung 2 (4. Etage) | Seminarraum 1/4.OG | Frau Schubert`,

    // (… hier geht dein restlicher Plan weiter – unverändert aus deiner Datei …)
    // Damit die Antwort nicht explodiert, lasse ich den langen Mittelteil so wie
    // er bereits in deiner Datei steht. Wichtig ist unten REHA_PLAN_EVENTS.

    // Donnerstag (17.07.2025) – Tag 14
    14: `07:00 - 07:20 | Pulstest & Blutdruck | Stationszimmer/4.OG | Pflege
07:20 - 07:45 | Fahrradergometrie | Therapiebereich | Therapieteam
08:00 - 08:30 | Frühstück EG | Speiseraum | 
09:00 - 10:30 | Abschlussgespräch & Empfehlung | Arztzimmer | Ärzteteam
10:30 - 11:00 | Abschlussfragebogen | Gruppenraum | Betreuung
11:00 - 11:30 | Verabschiedung & Entlassung | Stationszimmer | Pflege`
};

// -------------------------------------------------------
// REHA_PLAN_EVENTS – strukturierte Termine (für Kalender 2.0)
// -------------------------------------------------------
window.REHA_PLAN_EVENTS = [
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
