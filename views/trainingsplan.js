(function () {
  const $  = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // --- Daten ---
  const workouts = [
  { id:'schulterkreisen', title:'Schulterkreisen', desc:'Sanfte Mobilisation der Schultergelenke',
    emoji:'🏃‍♂️', duration:5, level:'leicht', area:'oberkoerper',
    videoUrl: 'https://www.youtube.com/embed/ANOTHER_VIDEO_ID' }, // echte videos noch einfügen 
    
  { id:'nackendehnung', title:'Nackendehnungen', desc:'Entspannung der Nackenmuskulatur',
    emoji:'🧘‍♀️', duration:8, level:'leicht', area:'oberkoerper',
    videoUrl: 'https://www.youtube.com/embed/ANOTHER_VIDEO_ID' },
    
  { id:'armrotation', title:'Arm-Rotationen', desc:'Kräftigung und Mobilisation',
    emoji:'💪', duration:10, level:'mittel', area:'oberkoerper',
    videoUrl: 'https://www.youtube.com/embed/YET_ANOTHER_ID' },
    
  { id:'kniebeuge', title:'Kniebeugen (assistiert)', desc:'Grundmobilisation & Kraft',
    emoji:'🦵', duration:7, level:'mittel', area:'unterkoerper',
    videoUrl: 'https://www.youtube.com/embed/EXAMPLE_ID' },
    
  { id:'waage', title:'Standwaage leicht', desc:'Balance & Koordination',
    emoji:'⚖️', duration:6, level:'leicht', area:'rumpf',
    videoUrl: 'https://www.youtube.com/embed/LAST_EXAMPLE_ID' },
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
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      render(btn.dataset.filter);
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ==== Video-Dialog ====
  const videoBackdrop = $('#tp-video');
  const videoEl       = $('#tp-video-el');
  const videoTitle    = $('#tp-video-title');
  const videoCloseBtn = $('#tp-video-close');

  function showDialog() {
    videoBackdrop.hidden = false;
    videoBackdrop.style.display = 'flex';
  }
  
  function hideDialog() {
    videoBackdrop.hidden = true;
    videoBackdrop.style.display = 'none';
  }

  // Video öffnen
  function openVideo(w) {
    if (!w?.videoUrl) { alert('Kein Video hinterlegt.'); return; }
    videoTitle.textContent = w.title;
    
    // Container leeren
    videoEl.innerHTML = '';
    
    // Neuen iframe erstellen
    const iframe = document.createElement('iframe');
    iframe.src = w.videoUrl + '?autoplay=1';
    iframe.allowFullscreen = true;
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    
    videoEl.appendChild(iframe);
    showDialog();
  }

  // Video schließen
  function closeVideo() {
    videoEl.innerHTML = ''; // iframe entfernen
    hideDialog();
  }

  // Event-Listener
  videoCloseBtn.addEventListener('click', closeVideo);
  videoBackdrop.addEventListener('click', (e) => {
    if (e.target === videoBackdrop) closeVideo();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoBackdrop.style.display !== 'none') closeVideo();
  });

  // Delegation für Start/Video-Buttons
  document.addEventListener('click', (e) => {
    const startBtn = e.target.closest('.tp-start');
    if (startBtn) {
      const id = startBtn.dataset.id;
      window.location.href = `/Reha-App/views/uebung.html?id=${encodeURIComponent(id)}`;
      return;
    }
    const vidBtn = e.target.closest('.tp-video-btn');
    if (vidBtn) {
      const w = byId[vidBtn.dataset.id];
      openVideo(w);
    }
  });

  // Initial-Render
  render('oberkoerper');

  // === Add-on: KPI & Tab-Counter ==========================
  function calcStats(arr){
    const total = arr.length;
    const sum = arr.reduce((a,b)=> a + (Number(b.duration)||0), 0);
    const avg = total ? Math.round((sum/total)*10)/10 : 0;
    return { total, sum, avg };
  }

  // KPI füllen
  (function updateKpis(){
    const {total, sum, avg} = calcStats(workouts);
    const $total = document.getElementById('tp-kpi-total');
    const $sum   = document.getElementById('tp-kpi-sum');
    const $avg   = document.getElementById('tp-kpi-avg');
    if($total) $total.textContent = String(total);
    if($sum)   $sum.textContent   = `${sum} Min`;
    if($avg)   $avg.textContent   = `${avg} Min`;
  })();

  // Tab-Zähler injizieren
  (function addTabCounts(){
    const countByArea = workouts.reduce((acc,w)=>{
      acc[w.area]=(acc[w.area]||0)+1; return acc;
    }, {});
    $$('.tp-tab').forEach(btn=>{
      const area = btn.dataset.filter;
      const n = countByArea[area] || 0;
      const existing = btn.querySelector('.tp-count');
      if(!existing){
        const pill = document.createElement('span');
        pill.className = 'tp-count';
        pill.textContent = n;
        btn.appendChild(pill);
      } else {
        existing.textContent = n;
      }
    });
  })();

  // CTA-Button (optional)
  (function bindCta(){
    const btn = document.getElementById('tp-build-plan');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      window.location.href = '/Reha-App/views/plan-builder.html';
    });
  })();
})();