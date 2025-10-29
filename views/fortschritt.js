(() => {
  // --------- Einstellungen / Beispielwerte ----------
  const CURRENT_WEEK = 4;  // Patient befindet sich "ab 4. Woche"
  // Milestones in Reihenfolge:
  const MILESTONES = [
    { key: "1. TAG",         label: "1. TAG" },
    { key: "2. TAG",         label: "2. TAG" },
    { key: "AB 7. TAG",      label: "AB 7. TAG" },
    { key: "AB 2. WOCHE",    label: "AB 2. WOCHE" },
    { key: "AB 4. WOCHE",    label: "AB 4. WOCHE" }, // ← aktuelle Phase
    { key: "AB 6–8. WOCHE",  label: "AB 6–8. WOCHE" },
    { key: "AB 20. WOCHE",   label: "AB 20. WOCHE" }
  ];
  const CURRENT_KEY = "AB 4. WOCHE";

  // --------- Hilfen ----------
  const $ = (sel) => document.querySelector(sel);

  // Gleichmäßig verteilte Positionen (0..100%)
  function positions(count){
    if (count < 2) return [0];
    const step = 100/(count-1);
    return Array.from({length:count}, (_,i)=> Math.round(i*step*100)/100);
  }

  // --------- Timeline rendern ----------
  function buildTimeline(){
    const ul = $("#ntMilestones");
    const fill = $("#ntFill");
    const pin = $("#ntPin");
    const pinLabel = $("#ntPhaseLabel");

    if(!ul || !fill || !pin || !pinLabel) return;

    ul.innerHTML = "";
    const pos = positions(MILESTONES.length);

    let currentIndex = 0;

    MILESTONES.forEach((m, i) => {
      const li = document.createElement("li");
      li.style.left = pos[i] + "%";

      const span = document.createElement("span");
      span.className = "nt-pill" + (m.key === CURRENT_KEY ? " current" : "");
      span.textContent = m.label;

      li.appendChild(span);
      ul.appendChild(li);

      if (m.key === CURRENT_KEY) currentIndex = i;
    });

    // Füllung bis zur aktuellen Marke
    const pct = pos[currentIndex];
    fill.style.width = pct + "%";

    // Pin an aktuelle Marke
    pin.style.left = pct + "%";
    pinLabel.textContent = CURRENT_KEY;
  }

  // --------- KPI-Donuts animieren (optional) ----------
  function initDonuts(){
    document.querySelectorAll(".donut").forEach(fig => {
      const valCircle = fig.querySelector(".donut-val");
      if(!valCircle) return;

      // Prozent aus Caption lesen
      const cap = fig.querySelector("figcaption")?.textContent || "";
      const match = cap.match(/(\d+)\s*%/);
      const p = match ? Math.max(0, Math.min(100, parseInt(match[1], 10))) : 0;

      const circumference = 2 * Math.PI * 48; // r=48
      const offset = circumference * (1 - p/100);
      valCircle.style.strokeDashoffset = offset.toFixed(2);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildTimeline();
    initDonuts();
  });
})();
