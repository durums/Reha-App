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
