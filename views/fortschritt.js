(() => {
  // Milestones in Prozent (0–100) entlang des Balkens
  const milestones = [
    { label: "1. TAG", pos: 5 },
    { label: "2. TAG", pos: 20 },
    { label: "AB 7. TAG", pos: 35 },
    { label: "AB 2. WOCHE", pos: 50 },
    { label: "AB 4. WOCHE", pos: 65 },          // ← aktuelle Phase
    { label: "AB 6–8. WOCHE", pos: 82 },
    { label: "AB 20. WOCHE", pos: 98 }
  ];
  const currentIndex = 4; // „AB 4. WOCHE“

  const ul = document.getElementById("ntMilestones");
  const fill = document.getElementById("ntFill");
  const pin  = document.getElementById("ntPin");
  const pinLabel = document.getElementById("ntPhaseLabel");

  // render milestones
  milestones.forEach((m, i) => {
    const li = document.createElement("li");
    li.style.left = m.pos + "%";
    li.innerHTML = `<div class="nt-pill ${i===currentIndex?'current':''}">${m.label}</div>`;
    ul.appendChild(li);
  });

  // set fill + pin
  const cur = milestones[currentIndex];
  fill.style.width = cur.pos + "%";
  pin.style.left = cur.pos + "%";
  pinLabel.textContent = cur.label;

  // Donut-Kreise korrekt füllen (falls du echte Werte animieren willst)
  document.querySelectorAll(".donut").forEach((fig) => {
    const circle = fig.querySelector(".donut-val");
    const text = fig.querySelector("figcaption")?.textContent || "";
    const match = text.match(/(\d+)%/);
    if (!circle || !match) return;
    const p = Math.max(0, Math.min(100, parseInt(match[1], 10))) / 100;
    const C = 2 * Math.PI * 48; // r=48
    circle.style.strokeDasharray = C.toFixed(2);
    circle.style.strokeDashoffset = (C * (1 - p)).toFixed(2);
  });
})();
