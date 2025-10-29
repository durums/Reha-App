// views/fortschritt.js
(() => {
  // --- Meilensteine & aktuelle Phase ---
  const MILESTONES = [
    { key: "1. TAG",        label: "1. TAG" },
    { key: "2. TAG",        label: "2. TAG" },
    { key: "AB 7. TAG",     label: "AB 7. TAG" },
    { key: "AB 2. WOCHE",   label: "AB 2. WOCHE" },
    { key: "AB 4. WOCHE",   label: "AB 4. WOCHE" }, // Beispiel: aktuelle Phase
    { key: "AB 6–8. WOCHE", label: "AB 6–8. WOCHE" },
    { key: "AB 20. WOCHE",  label: "AB 20. WOCHE" }
  ];
  const CURRENT_KEY = "AB 4. WOCHE";

  const $ = sel => document.querySelector(sel);
  const positions = n => n < 2 ? [0] : Array.from({length:n},(_,i)=> +(i*(100/(n-1))).toFixed(2));

  function buildTimeline(){
    const ul  = $("#ntMilestones");
    const fill= $("#ntFill");
    const pin = $("#ntPin");
    const pinLabel = $("#ntPhaseLabel");
    if(!ul || !fill || !pin || !pinLabel) return;

    ul.innerHTML = "";
    const pos = positions(MILESTONES.length);
    let currentIndex = 0;

    MILESTONES.forEach((m,i)=>{
      const li = document.createElement("li");
      li.style.left = pos[i] + "%";

      const pill = document.createElement("span");
      pill.className = "nt-pill" + (m.key===CURRENT_KEY ? " current" : "");
      pill.textContent = m.label;
      pill.title = m.label;

      li.appendChild(pill);
      ul.appendChild(li);
      if(m.key===CURRENT_KEY) currentIndex = i;
    });

    const pct = pos[currentIndex];
    fill.style.width = pct + "%";
    pin.style.left = pct + "%";
    pinLabel.textContent = CURRENT_KEY;
  }

  function initDonuts(){
    document.querySelectorAll(".donut").forEach(fig=>{
      const cap = fig.querySelector("figcaption")?.textContent || "";
      const m = cap.match(/(\d+)\s*%/);
      const p = m ? Math.max(0,Math.min(100,parseInt(m[1],10))) : 0;
      const c = 2*Math.PI*48; // 301.59
      fig.querySelector(".donut-val").style.strokeDashoffset = (c*(1-p/100)).toFixed(2);
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{ buildTimeline(); initDonuts(); });
})();
