(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  // Beispiel-Daten (später leicht aus Firestore ersetzbar)
  const workouts = [
    { id:'schulterkreisen', title:'Schulterkreisen', desc:'Sanfte Mobilisation der Schultergelenke',
      emoji:'🏃‍♂️', duration:5, level:'leicht', area:'oberkoerper' },
    { id:'nackendehnung', title:'Nackendehnungen', desc:'Entspannung der Nackenmuskulatur',
      emoji:'🧘‍♀️', duration:8, level:'leicht', area:'oberkoerper' },
    { id:'arm-rotation', title:'Arm-Rotationen', desc:'Kräftigung und Mobilisation',
      emoji:'💪', duration:10, level:'mittel', area:'oberkoerper' },
    { id:'kniebeuge', title:'Kniebeugen (assistiert)', desc:'Grundmobilisation & Kraft',
      emoji:'🦵', duration:7, level:'mittel', area:'unterkoerper' },
    { id:'waage', title:'Standwaage leicht', desc:'Balance & Koordination',
      emoji:'⚖️', duration:6, level:'leicht', area:'rumpf' },
  ];

  const grid = document.getElementById('tp-grid');
  const timeIcon = `<svg class="tp-time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" stroke-width="2"/><path d="M12 7v5l3 2" stroke-width="2"/></svg>`;

  function badge(level){
    const l = (level||'').toLowerCase();
    const cls = l==='mittel' ? 'mittel' : l==='schwer' ? 'schwer' : '';
    const label = l ? l[0].toUpperCase()+l.slice(1) : '–';
    return `<span class="tp-badge ${cls}">${label}</span>`;
  }

  function card(w){
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
      </div>
    </article>`;
  }

  function render(area='oberkoerper'){
    grid.innerHTML = workouts.filter(w=>w.area===area).map(card).join('');
  }

  // Tabs
  $$('.tp-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tp-tab').forEach(b=>{ b.classList.toggle('active', b===btn); b.setAttribute('aria-selected', b===btn) });
      render(btn.dataset.filter);
      // optional: scroll to top of grid
      grid.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // Start-Button (Placeholder – hier kannst du Routing/Timer/etc. starten)
  document.addEventListener('click', (e)=>{
    const b = e.target.closest('.tp-start');
    if(!b) return;
    const id = b.dataset.id;
    // Beispiel: Router zu #tagesprogramm mit Query
    location.hash = `#tagesprogramm`;
    // Oder: alert(`Starte Übung "${id}"`);
  });

  // Initial
  render('oberkoerper');
})();

(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  // Beispiel-Daten inkl. Video-URL (passe Pfade an: /videos/*.mp4 oder CDN)
  const workouts = [
    { id:'schulterkreisen', title:'Schulterkreisen', desc:'Sanfte Mobilisation der Schultergelenke',
      emoji:'🏃‍♂️', duration:5, level:'leicht', area:'oberkoerper',
      videoUrl:'videos/schulterkreisen.mp4' },
    { id:'nackendehnung', title:'Nackendehnungen', desc:'Entspannung der Nackenmuskulatur',
      emoji:'🧘‍♀️', duration:8, level:'leicht', area:'oberkoerper',
      videoUrl:'videos/nackendehnung.mp4' },
    { id:'arm-rotation', title:'Arm-Rotationen', desc:'Kräftigung und Mobilisation',
      emoji:'💪', duration:10, level:'mittel', area:'oberkoerper',
      videoUrl:'videos/arm-rotation.mp4' },
    { id:'kniebeuge', title:'Kniebeugen (assistiert)', desc:'Grundmobilisation & Kraft',
      emoji:'🦵', duration:7, level:'mittel', area:'unterkoerper',
      videoUrl:'videos/kniebeuge-assistiert.mp4' },
    { id:'waage', title:'Standwaage leicht', desc:'Balance & Koordination',
      emoji:'⚖️', duration:6, level:'leicht', area:'rumpf',
      videoUrl:'videos/standwaage-leicht.mp4' },
  ];

  // Lookup für schnellen Zugriff
  const byId = Object.fromEntries(workouts.map(w => [w.id, w]));

  const grid = document.getElementById('tp-grid');
  const timeIcon = `<svg class="tp-time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" stroke-width="2"/><path d="M12 7v5l3 2" stroke-width="2"/></svg>`;

  function badge(level){
    const l = (level||'').toLowerCase();
    const cls = l==='mittel' ? 'mittel' : l==='schwer' ? 'schwer' : '';
    const label = l ? l[0].toUpperCase()+l.slice(1) : '–';
    return `<span class="tp-badge ${cls}">${label}</span>`;
  }

  function card(w){
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

  function render(area='oberkoerper'){
    grid.innerHTML = workouts.filter(w=>w.area===area).map(card).join('');
  }

  // Tabs
  $$('.tp-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tp-tab').forEach(b=>{ b.classList.toggle('active', b===btn); b.setAttribute('aria-selected', b===btn) });
      render(btn.dataset.filter);
      grid.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // ==== Video-Dialog ====
  const videoBackdrop = $('#tp-video');
  const videoEl       = $('#tp-video-el');
  const videoTitle    = $('#tp-video-title');
  const videoCloseBtn = $('#tp-video-close');

  function openVideo(w){
    if(!w?.videoUrl){
      alert('Kein Video hinterlegt.');
      return;
    }
    videoTitle.textContent = w.title;
    videoEl.src = w.videoUrl;
    videoBackdrop.hidden = false;
    // Play erst *nach* sichtbarem Dialog (User-Geste vorhanden)
    videoEl.play().catch(()=>{ /* Autoplay-Policy: ignorieren, controls sind da */ });
  }

  function closeVideo(){
    try { videoEl.pause(); } catch(e){}
    videoEl.removeAttribute('src'); // Stoppt Download-Stream sicher
    videoEl.load();
    videoBackdrop.hidden = true;
  }

  videoCloseBtn.addEventListener('click', closeVideo);
  videoBackdrop.addEventListener('click', (e)=>{
    if(e.target === videoBackdrop) closeVideo(); // Klick außerhalb
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && !videoBackdrop.hidden) closeVideo();
  });

  // Start- & Video-Button
  document.addEventListener('click', (e)=>{
    const startBtn = e.target.closest('.tp-start');
    if(startBtn){
      const w = byId[startBtn.dataset.id];
      // Dein bisheriges Verhalten beibehalten (Routing):
      location.hash = '#tagesprogramm';
      return;
    }
    const vidBtn = e.target.closest('.tp-video-btn');
    if(vidBtn){
      const w = byId[vidBtn.dataset.id];
      openVideo(w);
    }
  });

  // Initial
  render('oberkoerper');
})();
