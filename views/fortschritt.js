// views/fortschritt.js
(() => {
  const currentWeek = 4; // 🔧 Beispielpatient: befindet sich ab Woche 4
  const maxWeeks = 12;

  // Phasen-Regeln (einfach anpassen)
  const phases = [
    { range: [0,3],  title: "Frühphase (Woche 0–3)",  goal: "Schwellungsreduktion, schmerzfreie Mobilität starten." },
    { range: [4,6],  title: "Aufbauphase (Woche 4–6)", goal: "Beweglichkeit steigern, leichte Belastung, Technik erlernen." },
    { range: [7,9],  title: "Fortgeschritten (Woche 7–9)", goal: "Kraftzuwachs, funktionelle Muster, Ausdauer erhöhen." },
    { range: [10,12],title: "Rückkehr (Woche 10–12)",  goal: "Sport-/Arbeitsfähigkeit, Belastungstests, Feinschliff." }
  ];

  // Inhalte für die drei Boxen je Phase
  const content = {
    bewegungsumfang: {
      "0-3": [
        "Pendeln, aktive Assistenz in schmerzfreiem Bereich",
        "Ziel: 0–60° (Beispiel), täglich 3–5x mobilisieren"
      ],
      "4-6": [
        "Aktive Bewegungen bis toleriert",
        "Ziel: 0–90°+, Fokus auf sauberer Technik"
      ],
      "7-9": [
        "Voller Bewegungsumfang anstreben",
        "Gelenkspiel/Dehnung nach Verträglichkeit"
      ],
      "10-12": [
        "Feinmotorik & komplexe Bewegungen",
        "Symmetrie im Bewegungsbild"
      ]
    },
    belastung: {
      "0-3": [
        "Teilentlastung, Alltagsaktivitäten dosiert",
        "Eis/Lymphdrainage bei Bedarf"
      ],
      "4-6": [
        "Steigerung bis mittlere Belastung",
        "Einführung Widerstände (leicht)"
      ],
      "7-9": [
        "Progressiv bis hohe Belastung",
        "Funktionelle & kombinierte Aufgaben"
      ],
      "10-12": [
        "Volle Belastung in Testszenarien",
        "Return-to-Activity Leitfäden"
      ]
    },
    techniken: {
      "0-3": [
        "Manuelle Techniken: Weichteil, Lymph",
        "Neuromuskuläre Aktivierung"
      ],
      "4-6": [
        "Isometrie → dynamisch, geschlossene Ketten",
        "Tape/E-Stim nach Indikation"
      ],
      "7-9": [
        "Freie Gewichte, instabile Unterlagen",
        "Koordinations-/Propriozeptionstraining"
      ],
      "10-12": [
        "Sportspezifische Drills, Agility",
        "Belastungstests & Feintuning"
      ]
    }
  };

  // DOM-Refs
  const $ = (id) => document.getElementById(id);
  const timelineEl = $("timeline");
  const phasePill = $("phasePill");
  const phaseDetails = $("phaseDetails");
  const dlBtn = $("downloadPlanBtn");

  const bewegEl = $("bewegungsumfang");
  const belastEl = $("belastung");
  const technikEl = $("techniken");

  function keyForWeek(w){
    if (w <= 3) return "0-3";
    if (w <= 6) return "4-6";
    if (w <= 9) return "7-9";
    return "10-12";
  }

  function buildTimeline(){
    timelineEl.innerHTML = "";
    for(let w=0; w<=maxWeeks; w++){
      const mark = document.createElement("div");
      mark.className = "t-mark" + (w < currentWeek ? " done" : w === currentWeek ? " current" : "");
      const dot = document.createElement("div");
      dot.className = "t-dot";
      const label = document.createElement("div");
      label.className = "t-label";
      label.textContent = `W${w}`;
      mark.appendChild(dot);
      mark.appendChild(label);
      timelineEl.appendChild(mark);
    }
  }

  function fillPhase(){
    // Pill
    phasePill.textContent = `Aktuelle Phase: Woche ${currentWeek}`;

    // Phase Text
    const phaseKey = keyForWeek(currentWeek);
    const phaseMeta = phases.find(p => currentWeek >= p.range[0] && currentWeek <= p.range[1]);

    phaseDetails.innerHTML = `
      <div class="p">
        <h4>${phaseMeta.title}</h4>
        <p>${phaseMeta.goal}</p>
      </div>
      <div class="p">
        <h4>Hinweis</h4>
        <p>Belastung stets symptomgeführt steigern. Bei anhaltendem Schmerz/Schwellung: Dosis anpassen und Rücksprache halten.</p>
      </div>
    `;

    // 3 Boxen
    const lists = {
      bewegungsumfang: bewegEl,
      belastung: belastEl,
      techniken: technikEl
    };
    Object.entries(lists).forEach(([k, ul]) => {
      ul.innerHTML = "";
      (content[k][phaseKey] || []).forEach(txt => {
        const li = document.createElement("li");
        li.textContent = txt;
        ul.appendChild(li);
      });
    });
  }

  // KPI Balken setzen
  function initKPI(){
    document.querySelectorAll(".kpi").forEach(el => {
      const v = Math.max(0, Math.min(100, parseInt(el.dataset.value || "0", 10)));
      el.style.setProperty("--val", v.toString());
    });
  }

  // Termine rechts (aus Kalender)
  function loadStore(){
    try { return JSON.parse(localStorage.getItem("kal_data") || "{}"); }
    catch { return {}; }
  }
  function parseISO(tag){
    const [y,m,d] = tag.split("-").map(x => parseInt(x,10));
    return new Date(y, m-1, d);
  }
  function two(n){ return String(n).padStart(2,"0"); }
  const WD = ["So","Mo","Di","Mi","Do","Fr","Sa"];
  function fmtDate(d){
    return `${WD[d.getDay()]}, ${two(d.getDate())}.${two(d.getMonth()+1)}.${d.getFullYear()}`;
  }

  function nextAppointments(limit=4){
    const user = window.currentUserName || null;
    if(!user) return [];
    const store = loadStore();
    const items = [];
    Object.entries(store).forEach(([tag, slots])=>{
      Object.entries(slots).forEach(([slot,name])=>{
        if(name === user){
          const date = parseISO(tag);
          // Nur heute und Zukunft
          const today = new Date(); today.setHours(0,0,0,0);
          const dd = new Date(date.getFullYear(),date.getMonth(),date.getDate());
          if (dd >= today) items.push({tag, slot, date});
        }
      });
    });
    items.sort((a,b)=> a.tag.localeCompare(b.tag) || a.slot.localeCompare(b.slot));
    return items.slice(0, limit);
  }

  function renderAppointments(){
    const list = document.getElementById("apptList");
    const empty = document.getElementById("apptEmpty");
    list.innerHTML = "";
    const appts = nextAppointments();
    if(appts.length === 0){
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    appts.forEach(a=>{
      const row = document.createElement("div");
      row.className = "appt";
      row.innerHTML = `
        <div class="when">${fmtDate(a.date)} · ${a.slot}</div>
        <div class="meta">
          <span>Kalender</span>
        </div>
      `;
      list.appendChild(row);
    });
  }

  // Download-Button fallback (falls PDF nicht existiert)
  function verifyDownloadLink(){
    const a = document.getElementById("downloadPlanBtn");
    // wir lassen den Link einfach – falls 404 liefert der Server die Seite zurück.
    // Optional: per HEAD prüfen – in static hosting meist nicht möglich. Daher UI-Hinweis:
    a.addEventListener("click", (e)=>{
      // keine Blockade; Hinweis könnte man hier optional nach erfolgreichem dl einblenden
    });
  }

  // Events
  document.getElementById("refreshAppointments")?.addEventListener("click", renderAppointments);
  window.addEventListener("storage", (e)=>{ if(e.key === "kal_data") renderAppointments(); });

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    buildTimeline();
    fillPhase();
    initKPI();
    renderAppointments();
    verifyDownloadLink();
  });
})();
