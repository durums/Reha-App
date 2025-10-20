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
