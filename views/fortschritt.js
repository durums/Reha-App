// views/fortschritt.js
(() => {
  const currentWeek = 4; // 🔧 Beispielpatient befindet sich in Woche 4
  const maxWeeks = 12;

/* --- Beispiel-Daten aus dem Formular (werden automatisch eingelesen) --- */
const exampleFormData = {
  "4-6": {
    weekKey: "4-6",
    phase: {
      title: "Aufbauphase (Woche 4–6) – Formular",
      goal: "ROM steigern auf 0–100°, Technik schulen, Beginn leichter Widerstände."
    },
    bewegungsumfang: [
      "Aktiv-assistiv bis Schmerzgrenze, 2–3×/Tag",
      "Ziel: 0–100°, Fokus Endgrad-Kontrolle"
    ],
    belastung: [
      "Leichte Widerstände (Theraband Stufe 1–2)",
      "Alltag: Steigerung Gehstrecke bis 4–5k Schritte/Tag"
    ],
    techniken: [
      "Closed-Chain Üb.: Mini-Squats, Step-ups niedrig",
      "Manuelle Mobilisation Grad I–II nach Bedarf"
    ]
  }
};

// Diese Beispiel-Daten automatisch im LocalStorage speichern, falls leer
if (!localStorage.getItem("phase_form_data")) {
  localStorage.setItem("phase_form_data", JSON.stringify(exampleFormData));
}  

  // Default-Phasen (werden durch Formulardaten überschrieben, falls vorhanden)
  const phasesDefault = [
    { range: [0,3],  title: "Frühphase (Woche 0–3)",  goal: "Schwellungsreduktion, schmerzfreie Mobilität starten." },
    { range: [4,6],  title: "Aufbauphase (Woche 4–6)", goal: "Beweglichkeit steigern, leichte Belastung, Technik erlernen." },
    { range: [7,9],  title: "Fortgeschritten (Woche 7–9)", goal: "Kraftzuwachs, funktionelle Muster, Ausdauer erhöhen." },
    { range: [10,12],title: "Rückkehr (Woche 10–12)",  goal: "Sport-/Arbeitsfähigkeit, Belastungstests, Feinschliff." }
  ];

  // Default-Inhalte (werden pro Phase durch Formulardaten überschrieben, falls vorhanden)
  const contentDefault = {
    bewegungsumfang: {
      "0-3": ["Pendeln, aktive Assistenz in schmerzfreiem Bereich","Ziel: 0–60°, täglich 3–5× mobilisieren"],
      "4-6": ["Aktive Bewegungen bis toleriert","Ziel: 0–90°+, Fokus auf saubere Technik"],
      "7-9": ["Voller Bewegungsumfang anstreben","Gelenkspiel/Dehnung nach Verträglichkeit"],
      "10-12": ["Feinmotorik & komplexe Bewegungen","Symmetrie im Bewegungsbild"]
    },
    belastung: {
      "0-3": ["Teilentlastung, Alltagsaktivitäten dosiert","Eis/Lymphdrainage bei Bedarf"],
      "4-6": ["Steigerung bis mittlere Belastung","Einführung Widerstände (leicht)"],
      "7-9": ["Progressiv bis hohe Belastung","Funktionelle & kombinierte Aufgaben"],
      "10-12": ["Volle Belastung in Testszenarien","Return-to-Activity Leitfäden"]
    },
    techniken: {
      "0-3": ["Manuelle Techniken: Weichteil, Lymph","Neuromuskuläre Aktivierung"],
      "4-6": ["Isometrie → dynamisch, geschlossene Ketten","Tape/E-Stim nach Indikation"],
      "7-9": ["Freie Gewichte, instabile Unterlagen","Propriozeption/Koordination"],
      "10-12": ["Sportspezifische Drills, Agility","Belastungstests & Feintuning"]
    }
  };

  /* -------------------- Formular-Daten laden (Beispiel: localStorage) -------------------- */
  /**
   * Erwartete Struktur im localStorage unter "phase_form_data":
   * {
   *   "weekKey": "4-6",
   *   "phase": { "title": "...", "goal": "..." },
   *   "bewegungsumfang": ["...","..."],
   *   "belastung": ["...","..."],
   *   "techniken": ["...","..."]
   * }
   * Optional: du kannst auch mehrere Phasen speichern:
   * {
   *   "0-3": { ...wie oben... },
   *   "4-6": { ... },
   *   ...
   * }
   */
  function loadPhaseFormData() {
    try {
      const raw = localStorage.getItem("phase_form_data");
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      // Falls die Daten als Mapping je Phase kommen (empfohlen)
      if (parsed["0-3"] || parsed["4-6"] || parsed["7-9"] || parsed["10-12"]) {
        return parsed;
      }

      // Falls nur eine Phase drinsteht, normalisieren wir auf Mapping
      if (parsed.weekKey) {
        return { [parsed.weekKey]: parsed };
      }

      return null;
    } catch {
      return null;
    }
  }

  function keyForWeek(w){
    if (w <= 3) return "0-3";
    if (w <= 6) return "4-6";
    if (w <= 9) return "7-9";
    return "10-12";
  }

  // DOM
  const $ = (id) => document.getElementById(id);
  const timelineEl = $("timeline");
  const phasePill = $("phasePill");
  const phaseDetails = $("phaseDetails");
  const bewegEl = $("bewegungsumfang");
  const belastEl = $("belastung");
  const technikEl = $("techniken");

  /* -------------------- Timeline -------------------- */
  function buildTimeline(){
    timelineEl.innerHTML = "";
    for(let w=0; w<=maxWeeks; w++){
      const mark = document.createElement("div");
      mark.className = "t-mark" + (w < currentWeek ? " done" : w === currentWeek ? " current" : "");
      const dot = document.createElement("div"); dot.className = "t-dot";
      const label = document.createElement("div"); label.className = "t-label"; label.textContent = `W${w}`;
      mark.append(dot,label);
      timelineEl.appendChild(mark);
    }
  }

  /* -------------------- Inhalte mergen & rendern -------------------- */
  function arrays(v){ return Array.isArray(v) ? v : (v ? [String(v)] : []); }

  function fillPhase(){
    const weekKey = keyForWeek(currentWeek);
    const formMap = loadPhaseFormData(); // Mapping oder null

    // 1) Phase-Headline/Goal bestimmen (Formular > Defaults)
    const phases = structuredClone(phasesDefault);
    const phaseMetaDefault = phases.find(p => currentWeek >= p.range[0] && currentWeek <= p.range[1]);
    let title = phaseMetaDefault.title;
    let goal  = phaseMetaDefault.goal;

    if (formMap && formMap[weekKey] && formMap[weekKey].phase) {
      if (formMap[weekKey].phase.title) title = formMap[weekKey].phase.title;
      if (formMap[weekKey].phase.goal)  goal  = formMap[weekKey].phase.goal;
    }

    phasePill.textContent = `Aktuelle Phase: Woche ${currentWeek}`;
    phaseDetails.innerHTML = `
      <div class="p">
        <h4>${title}</h4>
        <p>${goal}</p>
      </div>
      <div class="p">
        <h4>Hinweis</h4>
        <p>Belastung stets symptomgeführt steigern. Bei anhaltendem Schmerz/Schwellung: Dosis anpassen und Rücksprache halten.</p>
      </div>
    `;

    // 2) Boxen mergen: Formular > Defaults
    const merged = {
      bewegungsumfang: [...(contentDefault.bewegungsumfang[weekKey] || [])],
      belastung:       [...(contentDefault.belastung[weekKey] || [])],
      techniken:       [...(contentDefault.techniken[weekKey] || [])],
    };

    if (formMap && formMap[weekKey]) {
      const f = formMap[weekKey];
      if (f.bewegungsumfang && f.bewegungsumfang.length) merged.bewegungsumfang = arrays(f.bewegungsumfang);
      if (f.belastung && f.belastung.length)               merged.belastung       = arrays(f.belastung);
      if (f.techniken && f.techniken.length)               merged.techniken       = arrays(f.techniken);
    }

    // Rendern
    const lists = { bewegungsumfang: bewegEl, belastung: belastEl, techniken: technikEl };
    Object.entries(lists).forEach(([key, ul]) => {
      ul.innerHTML = "";
      merged[key].forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
    });
  }

  /* -------------------- KPI -------------------- */
  function initKPI(){
    document.querySelectorAll(".kpi").forEach(el => {
      const v = Math.max(0, Math.min(100, parseInt(el.dataset.value || "0", 10)));
      el.style.setProperty("--val", v.toString());
    });
  }

  /* -------------------- Termine rechts (aus Kalender) -------------------- */
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
    if(appts.length === 0){ empty.hidden = false; return; }
    empty.hidden = true;
    appts.forEach(a=>{
      const row = document.createElement("div");
      row.className = "appt";
      row.innerHTML = `
        <div class="when">${fmtDate(a.date)} · ${a.slot}</div>
        <div class="meta"><span>Kalender</span></div>
      `;
      list.appendChild(row);
    });
  }

  /* -------------------- Events & Init -------------------- */
  document.getElementById("refreshAppointments")?.addEventListener("click", renderAppointments);
  window.addEventListener("storage", (e)=>{ if(e.key === "kal_data" || e.key === "phase_form_data") { fillPhase(); } });

  document.addEventListener("DOMContentLoaded", () => {
    buildTimeline();
    fillPhase();
    initKPI();
    renderAppointments();
  });
})();
