(() => {
  // Aktueller Slot im Zahlenstrahl (0..6) – Beispiel: "AB 4. WOCHE"
  const currentIndex = 4;

  // KPI Beispielwerte
  const kpis = { mobility: 75, strength: 25, endurance: 62, pain: 85 };

  // --- Timeline -------------------------------------------------------------
  const slotsWrap = document.getElementById('tl-slots');
  const slots = [...slotsWrap.querySelectorAll('.slot')];
  slots.forEach((el, i) => el.classList.toggle('current', i === currentIndex));

  const progressEl = document.getElementById('track-progress');
  const marksEl = document.getElementById('tl-marks');

  function updateMarksAndProgress() {
    const wrapRect = slotsWrap.getBoundingClientRect();
    marksEl.innerHTML = '';

    // Marker exakt unter die Mitte jedes Slots setzen
    slots.forEach((slot) => {
      const r = slot.getBoundingClientRect();
      const center = ((r.left + r.right) / 2) - wrapRect.left;
      const m = document.createElement('i');
      m.className = 'm';
      m.style.left = (center / wrapRect.width * 100) + '%';
      marksEl.appendChild(m);
    });

    // Fortschrittsbreite bis zum rechten Rand des aktuellen Slots
    const slotRect = slots[currentIndex].getBoundingClientRect();
    const right = slotRect.right - wrapRect.left;
    const pct = Math.max(0, Math.min(100, (right / wrapRect.width) * 100));
    progressEl.style.width = pct + '%';
  }

  updateMarksAndProgress();
  window.addEventListener('resize', updateMarksAndProgress);

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
