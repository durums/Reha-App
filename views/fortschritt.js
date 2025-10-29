// fortschritt.js
document.addEventListener("DOMContentLoaded", () => {
  const MILESTONES = [
    "1. TAG", "2. TAG", "AB 7. TAG", "AB 2. WOCHE",
    "AB 4. WOCHE", "AB 6–8. WOCHE", "AB 20. WOCHE"
  ];
  const CURRENT = "AB 4. WOCHE";

  const ul = document.getElementById("ntMilestones");
  const fill = document.getElementById("ntFill");
  const pin = document.getElementById("ntPin");
  const label = document.getElementById("ntPhaseLabel");

  if (!ul || !fill || !pin) return;

  const step = 100 / (MILESTONES.length - 1);
  let currentIndex = 0;

  MILESTONES.forEach((text, i) => {
    const li = document.createElement("li");
    li.style.left = `${i * step}%`;

    const pill = document.createElement("span");
    pill.textContent = text;
    pill.className = "nt-pill";
    if (text === CURRENT) {
      pill.classList.add("current");
      currentIndex = i;
    }

    li.appendChild(pill);
    ul.appendChild(li);
  });

  // Fortschritt + Pin
  const width = step * currentIndex;
  fill.style.width = `${width}%`;
  pin.style.left = `${width}%`;
  label.textContent = CURRENT;

  // Donuts berechnen
  const c = 2 * Math.PI * 48;
  document.querySelectorAll(".donut").forEach(fig => {
    const val = fig.querySelector(".donut-val");
    const txt = fig.querySelector("figcaption")?.textContent || "";
    const m = txt.match(/(\d+)%/);
    const p = m ? parseInt(m[1], 10) : 0;
    val.style.strokeDasharray = c;
    val.style.strokeDashoffset = c * (1 - p / 100);
  });
});
