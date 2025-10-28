<script>
(() => {
  // Beispielwerte (wie im Mockup)
  const currentIndex = 4; // 0..6  -> "AB 4. WOCHE"
  const kpis = { mobility:75, strength:25, endurance:62, pain:85 };

  // Timeline-Fortschritt (Füllbreite bis aktuelle Kachel)
  const slots = document.querySelectorAll('.rp-timeline .slot');
  const progress = document.getElementById('track-progress');
  if (slots.length) {
    const pct = ((currentIndex + 1) / slots.length) * 100;
    progress.style.width = pct + '%';
    slots.forEach((el,i)=> el.classList.toggle('current', i===currentIndex));
  }

  // KPI-Balken
  document.getElementById('kpi-mobility-val').textContent = kpis.mobility + '%';
  document.getElementById('kpi-mobility-bar').style.width = kpis.mobility + '%';
  document.getElementById('kpi-pain-val').textContent = kpis.pain + '%';
  document.getElementById('kpi-pain-bar').style.width = kpis.pain + '%';

  // Donuts (SVG Stroke)
  const CIRC = 2 * Math.PI * 48; // r=48
  const setDonut = (id,val,outId) => {
    const c = document.getElementById(id);
    if (!c) return;
    const off = CIRC * (1 - val/100);
    c.style.strokeDashoffset = off;
    if (outId) document.getElementById(outId).textContent = val + '%';
  };
  setDonut('donut-strength', kpis.strength, 'kpi-strength-val');
  setDonut('donut-endurance', kpis.endurance, 'kpi-endurance-val');
})();
</script>
