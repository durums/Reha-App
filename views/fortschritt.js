<script>
(() => {
  // ---- Beispiel-Setup ----
  const steps = [
    "1. TAG","2. TAG","AB 7. TAG","AB 2. WOCHE","AB 4. WOCHE","AB 6 – 8. WOCHE","AB 20. WOCHE"
  ];
  const currentIndex = 4; // 0-basiert -> "AB 4. WOCHE"
  const kpis = { mobility:75, strength:25, endurance:62, pain:85 };

  // ---- Timeline rendern ----
  const stepsEl = document.getElementById('rp-steps');
  steps.forEach((label,i)=>{
    const el = document.createElement('div');
    el.className = 'step' + (i===currentIndex?' current':'') + (i<currentIndex?' active':'');
    el.textContent = label;
    stepsEl.appendChild(el);
  });

  const progress = document.getElementById('rp-progress');
  const pct = ((currentIndex+1) / steps.length) * 100; // grob: bis aktuelle Kachel
  progress.style.width = pct + '%';

  // ---- KPIs setzen ----
  document.getElementById('kpi-mobility-val').textContent = kpis.mobility + '%';
  document.getElementById('kpi-mobility-bar').style.width = kpis.mobility + '%';
  document.getElementById('kpi-pain-val').textContent = kpis.pain + '%';
  document.getElementById('kpi-pain-bar').style.width = kpis.pain + '%';

  document.querySelectorAll('.donut').forEach(d=>{
    const v = parseInt(d.dataset.val || '0', 10);
    d.style.setProperty('--v', v);
  });
})();
</script>
