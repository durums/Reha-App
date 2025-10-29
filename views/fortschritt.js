(() => {
  // Aktueller Slot im Zahlenstrahl (0..6) – Beispiel: "AB 4. WOCHE"
  const currentIndex = 4;

  // KPI Beispielwerte
  const kpis = { mobility: 75, strength: 25, endurance: 62, pain: 85 };

/* ====== Zahlenstrahl (NEU) ====== */
(() => {
  // Milestones in Reihenfolge (du kannst Bezeichnungen jederzeit ändern)
  const milestones = [
    "1. TAG",
    "2. TAG",
    "AB 7. TAG",
    "AB 2. WOCHE",
    "AB 4. WOCHE",
    "AB 6–8. WOCHE",
    "AB 20. WOCHE"
  ];

  // Welche Phase ist aktiv? (Index 0..milestones.length-1)
  const currentIndex = 4; // ← Beispiel: AB 4. WOCHE

  const list = document.getElementById("nt-milestones");
  const fill = document.getElementById("nt-fill");
  const pin  = document.getElementById("nt-pin");
  const pinLabel = document.getElementById("nt-pin-label");

  function buildMilestones(){
    list.innerHTML = "";
    const n = milestones.length - 1;
    milestones.forEach((label, i) => {
      const li = document.createElement("li");
      li.style.left = (i / n * 100) + "%";
      li.innerHTML = `<div class="nt-pill ${i===currentIndex?'current':''}">${label}</div>`;
      list.appendChild(li);
    });
    pinLabel.textContent = milestones[currentIndex];
  }

  function positionPinAndFill(){
    const n = milestones.length - 1;
    const pct = (currentIndex / n) * 100;
    fill.style.width = pct + "%";

    const bar = document.querySelector(".nt-bar");
    const rect = bar.getBoundingClientRect();
    const x = rect.left + rect.width * (pct / 100);
    const leftPct = ((x - rect.left) / rect.width) * 100;
    pin.style.left = leftPct + "%";
  }

  function initTimeline(){
    buildMilestones();
    positionPinAndFill();
  }

  window.addEventListener("resize", positionPinAndFill);
  document.addEventListener("DOMContentLoaded", initTimeline);
  if (document.readyState !== "loading") initTimeline();
})();
  
  // --- KPI Balken -----------------------------------------------------------
  const setBar = (idText, idBar, val) => {
    const t = document.getElementById(idText);
    const b = document.getElementById(idBar);
    if (t) t.textContent = val + '%';
    if (b) b.style.width = val + '%';
  };

  setBar('kpi-mobility-val', 'kpi-mobility-bar', kpis.mobility);
  setBar('kpi-pain-val', 'kpi-pain-bar', kpis.pain);

  // --- KPI Donuts -----------------------------------------------------------
  const CIRC = 2 * Math.PI * 48; // r = 48 → Umfang ~301.59
  function setDonut(idCircle, val, idText) {
    const c = document.getElementById(idCircle);
    if (!c) return;
    const off = CIRC * (1 - val / 100);
    c.style.strokeDashoffset = off;
    if (idText) {
      const t = document.getElementById(idText);
      if (t) t.textContent = val + '%';
    }
  }

  setDonut('donut-strength', kpis.strength, 'kpi-strength-val');
  setDonut('donut-endurance', kpis.endurance, 'kpi-endurance-val');
})();
