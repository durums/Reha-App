(function () {
  const $  = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // --- Daten (Video-Pfade anpassen) ---
  const workouts = [
    { id:'schulterkreisen', title:'Schulterkreisen', desc:'Sanfte Mobilisation der Schultergelenke',
      emoji:'🏃‍♂️', duration:5, level:'leicht', area:'oberkoerper',
      videoUrl: '/views/Videos-Training/test_clip.mp4' },
    { id:'nackendehnung', title:'Nackendehnungen', desc:'Entspannung der Nackenmuskulatur',
      emoji:'🧘‍♀️', duration:8, level:'leicht', area:'oberkoerper',
      videoUrl: '/views/Videos-Training/test_clip.mp4' },
    { id:'arm-rotation', title:'Arm-Rotationen', desc:'Kräftigung und Mobilisation',
      emoji:'💪', duration:10, level:'mittel', area:'oberkoerper',
      videoUrl: '/views/Videos-Training/test_clip.mp4' },
    { id:'kniebeuge', title:'Kniebeugen (assistiert)', desc:'Grundmobilisation & Kraft',
      emoji:'🦵', duration:7, level:'mittel', area:'unterkoerper',
      videoUrl: '/views/Videos-Training/test_clip.mp4' },
    { id:'waage', title:'Standwaage leicht', desc:'Balance & Koordination',
      emoji:'⚖️', duration:6, level:'leicht', area:'rumpf',
      videoUrl: '/views/Videos-Training/test_clip.mp4' },
  ];
  const byId = Object.fromEntries(workouts.map(w => [w.id, w]));

  const grid = document.getElementById('tp-grid');
  const timeIcon = `<svg class="tp-time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" stroke-width="2"/><path d="M12 7v5l3 2" stroke-width="2"/></svg>`;

  function badge(level) {
    const l = (level||'').toLowerCase();
    const cls = l==='mittel' ? 'mittel' : l==='schwer' ? 'schwer' : '';
    const label = l ? l[0].toUpperCase()+l.slice(1) : '–';
    return `<span class="tp-badge ${cls}">${label}</span>`;
  }

  function card(w) {
    return `<article class="tp-card" data-area="${w.area}">
      <div class="tp-head">
        <div class="tp-emoji">${w.emoji||'🏃'}</div>
        <div>
          <h3 class="tp-title">${w.title}</h3>
          <div class="tp-sub">${w.desc||''}</div>
        </div>
      </div>
      <div class="tp-meta">
        <span class="dot">${timeIcon} ${w.duration} Min</span>
        ${badge(w.level)}
      </div>
      <div class="tp-actions">
        <button class="tp-start" data-id="${w.id}">
          <span>▶</span> Starten
        </button>
        <button class="tp-video-btn" data-id="${w.id}">
          🎬 Video
        </button>
      </div>
    </article>`;
  }

  function render(area = 'oberkoerper') {
    grid.innerHTML = workouts.filter(w => w.area === area).map(card).join('');
  }

  // Tabs (Bereiche filtern)
  $$('.tp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tp-tab').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn);
      });
      render(btn.dataset.filter);
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ==== Video-Dialog ====
  const videoBackdrop = $('#tp-video');       // <div>
  const videoEl       = $('#tp-video-el');    // <video> ohne src!
  const videoTitle    = $('#tp-video-title'); // <h3>
  const videoCloseBtn = $('#tp-video-close'); // ×

  // --- HART VERSTECKEN BEIM LADEN + SICHERN, DASS KEIN SRC EXISTIERT ---
  videoBackdrop.style.display = 'none';     // verhindert „leeren Player“
  videoBackdrop.hidden = true;              // doppelt hält besser
  videoEl.removeAttribute('src');
  try { videoEl.preload = 'none'; } catch {}

  function showDialog() {
    videoBackdrop.hidden = false;
    videoBackdrop.style.display = 'flex';   // oder 'block' je nach Layout
  }
  function hideDialog() {
    videoBackdrop.hidden = true;
    videoBackdrop.style.display = 'none';
  }

  function openVideo(w) {
    if (!w?.videoUrl) { alert('Kein Video hinterlegt.'); return; }
    videoTitle.textContent = w.title;

    // Quelle erst JETZT setzen
    videoEl.removeAttribute('src');
    videoEl.src = w.videoUrl;

    showDialog();

    // Autoplay nur nach Nutzeraktion; evtl. blockiert -> egal
    videoEl.play().catch(() => {});
  }

  function closeVideo() {
    try { videoEl.pause(); } catch {}
    videoEl.removeAttribute('src'); // Download/Stream abbrechen
    videoEl.load();                 // Puffer verwerfen
    hideDialog();
  }

  videoCloseBtn.addEventListener('click', closeVideo);
  videoBackdrop.addEventListener('click', (e) => {
    if (e.target === videoBackdrop) closeVideo(); // Klick außerhalb schließt
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoBackdrop.style.display !== 'none') closeVideo();
  });

  // Delegation für Start/Video-Buttons
  document.addEventListener('click', (e) => {
    const startBtn = e.target.closest('.tp-start');
    if (startBtn) {
      const w = byId[startBtn.dataset.id];
      openVideo(w);            // Video-Dialog öffnen
      return;                  // keine Hash-Navigation
    }
    const vidBtn = e.target.closest('.tp-video-btn');
    if (vidBtn) {
      const w = byId[vidBtn.dataset.id];
      openVideo(w);
    }
  });

  // Initial-Render
  render('oberkoerper');
})();
