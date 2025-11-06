// fortschritt.js
document.addEventListener("DOMContentLoaded", () => {
// === Ergänzung am ENDE des bestehenden DOMContentLoaded-Handlers ===
  // Download + Consent
  const nbBtn   = document.getElementById("nbDownloadBtn");
  const dialog  = document.getElementById("nbConsentDialog");

  async function downloadPlanAsHTML() {
    const res  = await fetch("Nachbehandlungsplan.html", { cache: "no-store" });
    if (!res.ok) throw new Error("Nachbehandlungsplan nicht gefunden.");
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);

    // 1) Download auslösen
    const a = document.createElement("a");
    a.href = url;
    a.download = "Nachbehandlungsplan.html";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // 2) Zusätzlich in neuem Tab ANZEIGEN
    window.open(url, "_blank", "noopener,noreferrer");

    // Nach kurzer Zeit wieder freigeben
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function openConsent() {
    if (typeof dialog?.showModal === "function") {
      dialog.showModal();
    } else {
      // Fallback ohne <dialog>-Support
      const ok = confirm("Darf der Nachbehandlungsplan heruntergeladen und angezeigt werden?");
      if (ok) downloadPlanAsHTML().catch(err => alert(err.message));
    }
  }

  if (nbBtn) {
    nbBtn.addEventListener("click", openConsent);
  }
  if (dialog) {
    dialog.addEventListener("close", () => {
      if (dialog.returnValue === "ok") {
        downloadPlanAsHTML().catch(err => alert(err.message));
      }
    });
  }
// === Ende der Ergänzung ===

function nicePhaseLabel(raw) {
  // alles klein, dann gezielt formatieren
  const s = String(raw || "").toLowerCase().trim();

  // "1. tag" / "2. tag" -> "Ab 1. Tag" / "Ab 2. Tag"
  const mTag = s.match(/^(\d+)\.\s*tag$/i);
  if (mTag) return `Ab ${mTag[1]}. Tag`;


  // "ab 7. tag" -> "Ab 7. Tag"
  const mAbTag = s.match(/^ab\s+(\d+)\.\s*tag$/i);
  if (mAbTag) return `Ab ${mAbTag[1]}. Tag`;

  // "ab 2. woche" -> "Ab 2. Woche"
  const mAbWoche = s.match(/^ab\s+(\d+)\.\s*woche$/i);
  if (mAbWoche) return `Ab ${mAbWoche[1]}. Woche`;

  // "ab 6–8. woche" / "ab 6-8. woche" -> "Ab 6–8. Woche"
  const mRangeWoche = s.match(/^ab\s+(\d+)\s*[\-–]\s*(\d+)\.\s*woche$/i);
  if (mRangeWoche) return `Ab ${mRangeWoche[1]}–${mRangeWoche[2]}. Woche`;

  // Fallback: erster Buchstabe groß + "Ab " sicherstellen
  const cap = s.replace(/\b\w/g, ch => ch.toUpperCase()).replace("–", "–");
  return cap.startsWith("Ab ") ? cap : `Ab ${cap}`;
}

  
  /* ===== Phasen & Inhalte ===== */
  const PHASES = [
    { key: "tag1",  label: "1. TAG" },
    { key: "tag2",  label: "2. TAG" },
    { key: "ab7",   label: "AB 7. TAG" },
    { key: "ab2w",  label: "AB 2. WOCHE" },
    { key: "ab4w",  label: "AB 4. WOCHE" },
    { key: "ab6w",  label: "AB 6–8. WOCHE" },
    { key: "ab20w", label: "AB 20. WOCHE" }
  ];
  // Beispielinhalte – hier kannst du später echte Daten quellen (Firestore/LS)
  const CONTENT = {
    tag1:  {
      move: ["Passive Bewegungen im schmerzfreien Bereich", "Fuß- und Zehenbewegungen aktiv"],
      load: ["Teilbelastung nach Absprache", "Bein hochlagern, Kühlung"],
      treat:["Lymphdrainage", "Schmerzmanagement", "Atemübungen"]
    },
    tag2:  {
      move: ["Anbahnung normaler Gangzyklus an Gehstützen", "Sanfte Mobilisation"],
      load: ["Teilbelastung steigern (nach Rückmeldung)", "Schwellung beobachten"],
      treat:["Verbandskontrolle", "Physiotherapie – Anleitung Heimübungen"]
    },
    ab7:   {
      move: ["Aktive Bewegungsübungen", "Bewegungsumfang täglich erweitern"],
      load: ["Belastung nach Verträglichkeit erhöhen"],
      treat:["Gangschule (flach)", "Lymphdrainage bei Bedarf"]
    },
    ab2w:  {
      move: ["Gezielte Dehnungen", "Kraft- & Koordinationsanbahnung"],
      load: ["Teil- ➜ Vollbelastung anstreben (ärztl. Freigabe)"],
      treat:["Physiotherapie 2–3×/Woche", "Ergometer (niedrige Last)"]
    },
    ab4w:  {
      move: ["Gelenkwinkel schrittweise erhöhen (Zielwerte)", "Bewegungsabläufe verfeinern"],
      load: ["Volles Körpergewicht ohne Gehhilfen"],
      treat:["Gangschule (Treppen)", "Lymphdrainage"]
    },
    ab6w:  {
      move: ["Aufbau Kraft (Ober-/Unterkörper spezifisch)", "Ausdauer moderat steigern"],
      load: ["Belastung langsam steigern, Schmerzen/Schwellung beobachten"],
      treat:["Funktionelles Training", "Stabilisationsübungen"]
    },
    ab20w: {
      move: ["Volle Bewegungsfreiheit anstreben", "Sportartspezifische Übungen"],
      load: ["Rückkehr zu Alltags-/Sportbelastung (freigegeben)"],
      treat:["Eigenprogramm Pflege", "Re-Check / Abschlussbefund"]
    }
  };

  /* ===== KPI Demo (optional) ===== */
  const KPIS = { mobility: 75, strength: 25, endurance: 62, pain: 85 };
  const mobVal = document.getElementById("kpi-mobility-val");
  const mobBar = document.getElementById("kpi-mobility-bar");
  const painVal= document.getElementById("kpi-pain-val");
  const painBar= document.getElementById("kpi-pain-bar");
  if (mobVal && mobBar){ mobVal.textContent = `${KPIS.mobility}%`; mobBar.style.width = `${KPIS.mobility}%`; mobBar.parentElement?.setAttribute("aria-valuenow", String(KPIS.mobility)); }
  if (painVal && painBar){ painVal.textContent = `${KPIS.pain}%`;    painBar.style.width = `${KPIS.pain}%`;    painBar.parentElement?.setAttribute("aria-valuenow", String(KPIS.pain)); }
  const C = 2 * Math.PI * 48; // Donut
  document.querySelectorAll(".donut").forEach(fig => {
    const path = fig.querySelector(".donut-val"); const num = fig.querySelector(".donut-num");
    const pct = Number(path?.getAttribute("data-percent") || 0);
    if (path){ path.style.strokeDasharray = C; path.style.strokeDashoffset = C * (1 - pct/100); }
    if (num){ num.textContent = String(pct); }
  });

  /* ===== Timeline + Slider ===== */
  const ul       = document.getElementById("ntMilestones");
  const pin      = document.getElementById("ntPin");
  const phaseLbl = document.getElementById("ntPhaseLabel");
  const slider   = document.getElementById("ntSlider");
  
  // Fortschrittsbalken: neu ODER alt unterstützen
  const prog     = document.getElementById("ntProgress") || document.getElementById("ntFill"); // <= wichtig
  const bumpsEl  = document.getElementById("ntBumps"); // optional
  
  // Bubbles
  const listMove = document.getElementById("list-move");
  const listLoad = document.getElementById("list-load");
  const listTreat= document.getElementById("list-treat");
  
  // Nur das Minimum verlangen – NICHT auf Rail/Bumps bestehen
  if (!ul || !pin || !phaseLbl || !slider) {
    console.warn("[fortschritt] required elements missing");
    return;
  }
  
  const step = 100 / (PHASES.length - 1);
  
  // Meilensteine rendern
  ul.innerHTML = "";
  PHASES.forEach((p, i) => {
    const li = document.createElement("li");
    li.style.left = `${i * step}%`;
    const pill = document.createElement("span");
    pill.textContent = p.label;
    pill.className = "nt-pill";
    pill.addEventListener("click", () => setPhase(i));
    li.appendChild(pill);
    ul.appendChild(li);
  });
  
  // Slider Setup
  slider.min = "0";
  slider.max = String(PHASES.length - 1);
  slider.step = "1";
  const lastIndex = Number(localStorage.getItem("rehapp:progressPhase") || "0");
  slider.value = String(Math.min(PHASES.length - 1, Math.max(0, lastIndex)));
  
  function setPhase(index){
    index = Math.min(PHASES.length - 1, Math.max(0, index));
    slider.value = String(index);
  
    const widthPct = step * index;
  
    // Fortschritt zeichnen (neu ODER alt, falls vorhanden)
    if (prog) prog.style.width = `${widthPct}%`;
  
    // Pin + Label
    pin.style.left = `${widthPct}%`;
    phaseLbl.textContent = nicePhaseLabel(PHASES[index].label); // <= setzt "Ab 1. Tag" etc.
    pin.setAttribute("aria-label", phaseLbl.textContent);
  
    // Milestone-Highlight
    ul.querySelectorAll(".nt-pill").forEach((el, i) => {
      el.classList.toggle("current", i === index);
    });
  
    // Bumps nur, wenn Container da (neue Version)
    if (bumpsEl) {
      bumpsEl.innerHTML = "";
      for (let i = 1; i <= index; i++){
        const bump = document.createElement("div");
        bump.className = "nt-bump";
        bump.style.left = `${i * step}%`;
        bumpsEl.appendChild(bump);
      }
    }
  
    // Inhalte für die Bubbles
    const key  = PHASES[index].key;
    const data = CONTENT[key] || { move:[], load:[], treat:[] };
    fillList(listMove,  data.move);
    fillList(listLoad,  data.load);
    fillList(listTreat, data.treat);
  
    try { localStorage.setItem("rehapp:progressPhase", String(index)); } catch {}
  }
  
  function fillList(target, items){
    if (!target) return;
    target.innerHTML = items && items.length
      ? items.map(t => `<li>${t}</li>`).join("")
      : `<li><em>Keine Angaben</em></li>`;
  }
  
  // Slider-Events
  slider.addEventListener("input",  () => setPhase(Number(slider.value)));
  slider.addEventListener("change", () => setPhase(Number(slider.value)));
  
  // Init
  setPhase(Number(slider.value));
});
