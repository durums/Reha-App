// fortschritt.js
document.addEventListener("DOMContentLoaded", () => {
  // ---- Daten (kannst du später aus Firestore/LS füllen) ----
  const KPIS = {
    mobility: 75,   // Beweglichkeit
    strength: 25,   // Kraft
    endurance: 62,  // Ausdauer
    pain: 85        // Schmerzreduktion
  };

  const MILESTONES = [
    "1. TAG", "2. TAG", "AB 7. TAG", "AB 2. WOCHE",
    "AB 4. WOCHE", "AB 6–8. WOCHE", "AB 20. WOCHE"
  ];
  const CURRENT = "AB 4. WOCHE";

  // ---- KPIs setzen ----
  const mobVal = document.getElementById("kpi-mobility-val");
  const mobBar = document.getElementById("kpi-mobility-bar");
  const painVal= document.getElementById("kpi-pain-val");
  const painBar= document.getElementById("kpi-pain-bar");

  if (mobVal && mobBar) {
    mobVal.textContent = `${KPIS.mobility}%`;
    mobBar.style.width = `${KPIS.mobility}%`;
    mobBar.parentElement?.setAttribute("aria-valuenow", String(KPIS.mobility));
  }
  if (painVal && painBar) {
    painVal.textContent = `${KPIS.pain}%`;
    painBar.style.width = `${KPIS.pain}%`;
    painBar.parentElement?.setAttribute("aria-valuenow", String(KPIS.pain));
  }

  // Donuts (Kraft / Ausdauer)
  const C = 2 * Math.PI * 48; // Umfang
  document.querySelectorAll(".donut").forEach(fig => {
    const path = fig.querySelector(".donut-val");
    const centerNum = fig.querySelector(".donut-num");
    const pct = Number(path?.getAttribute("data-percent") || 0);
    if (path) {
      path.style.strokeDasharray = C;
      path.style.strokeDashoffset = C * (1 - pct / 100);
    }
    if (centerNum) centerNum.textContent = String(pct);
  });

  // ---- Timeline ----
  const ul      = document.getElementById("ntMilestones");
  const rail    = document.querySelector(".nt-rail");
  const prog    = document.getElementById("ntProgress");
  const bumpsEl = document.getElementById("ntBumps");
  const pin     = document.getElementById("ntPin");
  const label   = document.getElementById("ntPhaseLabel");
  if (!ul || !rail || !prog || !bumpsEl || !pin || !label) return;
  
  const step = 100 / (MILESTONES.length - 1);
  let currentIndex = 0;
  
  MILESTONES.forEach((text, i) => {
    const li = document.createElement("li");
    li.style.left = `${i * step}%`;
    const pill = document.createElement("span");
    pill.textContent = text;
    pill.className = "nt-pill";
    if (text === CURRENT) { pill.classList.add("current"); currentIndex = i; }
    li.appendChild(pill);
    ul.appendChild(li);
  });
  
  const widthPct = step * currentIndex;
  prog.style.width = `${widthPct}%`;
  pin.style.left = `${widthPct}%`;
  label.textContent = CURRENT;
  
  bumpsEl.innerHTML = "";
  for (let i = 1; i <= currentIndex; i++) {
    const bump = document.createElement("div");
    bump.className = "nt-bump";
    bump.style.left = `${i * step}%`;
    bumpsEl.appendChild(bump);
  }


  const width = step * currentIndex;
  fill.style.width = `${width}%`;
  pin.style.left = `${width}%`;
  label.textContent = CURRENT;
});
