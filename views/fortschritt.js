document.addEventListener("DOMContentLoaded", () => {

  /* === PDF direkt öffnen === */
  const pdfBtn = document.getElementById("nbDownloadBtn");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
      window.open("Nachbehandlungsplan.pdf", "_blank");
    });
  }

  /* === Phasen Labels schöner formatieren === */
  function nicePhaseLabel(raw) {
    const s = String(raw || "").toLowerCase().trim();
    const mTag = s.match(/^(\d+)\.\s*tag$/);
    if (mTag) return `Ab ${mTag[1]}. Tag`;
    const mAbTag = s.match(/^ab\s+(\d+)\.\s*tag$/);
    if (mAbTag) return `Ab ${mAbTag[1]}. Tag`;
    const mAbW = s.match(/^ab\s+(\d+)\.\s*woche$/);
    if (mAbW) return `Ab ${mAbW[1]}. Woche`;
    const mRange = s.match(/^ab\s+(\d+)\s*[\–-]\s*(\d+)\.\s*woche$/);
    if (mRange) return `Ab ${mRange[1]}–${mRange[2]}. Woche`;
    const cap = s.replace(/\b\w/g, c => c.toUpperCase());
    return cap.startsWith("Ab ") ? cap : `Ab ${cap}`;
  }

  /* === Phasen + Inhalte === */
  const PHASES = [
    { key: "tag1",  label: "1. TAG" },
    { key: "tag2",  label: "2. TAG" },
    { key: "ab7",   label: "AB 7. TAG" },
    { key: "ab2w",  label: "AB 2. WOCHE" },
    { key: "ab4w",  label: "AB 4. WOCHE" },
    { key: "ab6w",  label: "AB 6–8. WOCHE" },
    { key: "ab20w", label: "AB 20. WOCHE" }
  ];

  const CONTENT = {
    tag1:  { move:["Passive Bewegungen"], load:["Teilbelastung"], treat:["Lymphdrainage"] },
    tag2:  { move:["Gangbild an Krücken"], load:["Belastung steigern"], treat:["Verbandskontrolle"] },
    ab7:   { move:["Aktive Übungen"], load:["Belastung nach Gefühl"], treat:["Gangschule"] },
    ab2w:  { move:["Dehnungen"], load:["Teil ➜ Vollbelastung"], treat:["Physio 2–3×/Woche"] },
    ab4w:  { move:["Winkel steigern"], load:["Vollbelastung"], treat:["Treppentraining"] },
    ab6w:  { move:["Kraftaufbau"], load:["Belastung steigern"], treat:["Stabilisation"] },
    ab20w: { move:["Volle Beweglichkeit"], load:["Sportfreigabe"], treat:["Re-Check"] }
  };

  /* === KPI Setup === */
  const KPIS = { mobility: 75, strength: 25, endurance: 62, pain: 85 };

  const mobVal = document.getElementById("kpi-mobility-val");
  const mobBar = document.getElementById("kpi-mobility-bar");
  const painVal= document.getElementById("kpi-pain-val");
  const painBar= document.getElementById("kpi-pain-bar");

  if (mobVal){ mobVal.textContent = `${KPIS.mobility}%`; mobBar.style.width = `${KPIS.mobility}%`; }
  if (painVal){ painVal.textContent = `${KPIS.pain}%`;    painBar.style.width = `${KPIS.pain}%`; }

  const C = 2 * Math.PI * 48;
  document.querySelectorAll(".donut").forEach(fig => {
    const path = fig.querySelector(".donut-val");
    const pct  = Number(path.dataset.percent || 0);
    path.style.strokeDasharray = C;
    path.style.strokeDashoffset = C * (1 - pct / 100);
    fig.querySelector(".donut-num").textContent = pct;
  });

  /* === Timeline === */
  const ul = document.getElementById("ntMilestones");
  const pin = document.getElementById("ntPin");
  const phaseLbl = document.getElementById("ntPhaseLabel");
  const slider = document.getElementById("ntSlider");
  const prog = document.getElementById("ntProgress");
  const bumps = document.getElementById("ntBumps");

  const listMove  = document.getElementById("list-move");
  const listLoad  = document.getElementById("list-load");
  const listTreat = document.getElementById("list-treat");

  const step = 100 / (PHASES.length - 1);

  ul.innerHTML = "";
  PHASES.forEach((p, i) => {
    const li = document.createElement("li");
    li.style.left = `${i * step}%`;
    const pill = document.createElement("span");
    pill.className = "nt-pill";
    pill.textContent = p.label;
    pill.onclick = () => setPhase(i);
    li.appendChild(pill);
    ul.appendChild(li);
  });

  slider.min = 0;
  slider.max = PHASES.length - 1;
  slider.step = 1;
  slider.value = Number(localStorage.getItem("rehappPhase") || 0);

  function setPhase(i) {
    slider.value = i;

    const pct = i * step;
    prog.style.width = `${pct}%`;
    pin.style.left = `${pct}%`;

    phaseLbl.textContent = nicePhaseLabel(PHASES[i].label);

    ul.querySelectorAll(".nt-pill").forEach((el, idx) =>
      el.classList.toggle("current", idx === i)
    );

    bumps.innerHTML = "";
    for (let x = 1; x <= i; x++) {
      const b = document.createElement("div");
      b.className = "nt-bump";
      b.style.left = `${x * step}%`;
      bumps.appendChild(b);
    }

    const key = PHASES[i].key;
    const data = CONTENT[key];
    listMove.innerHTML  = data.move.map(t => `<li>${t}</li>`).join("");
    listLoad.innerHTML  = data.load.map(t => `<li>${t}</li>`).join("");
    listTreat.innerHTML = data.treat.map(t => `<li>${t}</li>`).join("");

    localStorage.setItem("rehappPhase", i);
  }

  slider.addEventListener("input", () => setPhase(Number(slider.value)));

  setPhase(Number(slider.value));
});
