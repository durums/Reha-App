// views/fortschritt.js
(function () {
  /* ---------- Demo-KPIs/Recent ---------- */
  const weekCount = 4, weekTotal = 15, activeDays = 2, totalPct = 5, badges = 1;
  byId('kpi-week-count').textContent = weekCount;
  byId('kpi-week-bar').style.width = Math.min(100, (weekCount / weekTotal) * 100) + '%';
  byId('kpi-days').textContent = activeDays;
  byId('kpi-days-bar').style.width = (activeDays / 7) * 100 + '%';
  byId('kpi-total').textContent = totalPct + '%';
  byId('kpi-total-bar').style.width = totalPct + '%';
  byId('kpi-badges').textContent = badges;
  byId('kpi-badges-bar').style.width = Math.min(100, badges * 10) + '%';

  const recent = [
    { name: 'Schulterkreisen', at: 'Heute, 09:16', dur: '5 Min' },
    { name: 'Nackendehnungen', at: 'Heute, 09:11', dur: '8 Min' },
    { name: 'Rückenstreckung', at: 'Gestern, 10:46', dur: '10 Min' },
    { name: 'Knie-Beugungen', at: 'Gestern, 10:16', dur: '12 Min' },
    { name: 'Beckenlift', at: 'So., 26.10., 09:16', dur: '8 Min' },
  ];
  const recentList = byId('recentList');
  recent.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${r.name}</strong><br><small>${r.at}</small></div><small>${r.dur}</small>`;
    recentList.appendChild(li);
  });

  /* ---------- Nachbehandlungs-Daten ---------- */
  const PLAN_VKB = [
    { id:'tag1',  title:'1. Tag', window:'Ruhigstellung 0–0° (1 Woche, Tag & Nacht)',
      load:'15 kg Teilbelastung, 2 Gehstützen',
      scope:'Passive Mobilisation, Schwellungsmanagement',
      tasks:[
        { id:'redon', label:'Redon-Entfernung' },
        { id:'quad', label:'Elektrostimulation Quadrizeps (isometrisch)' },
        { id:'pnf',  label:'Bewegungsübungen (PNF), schmerzfrei' },
      ],
      techniques:['Cryo-Cuff/Kühlung','Thromboseprophylaxe']
    },
    { id:'tag2',  title:'2. Tag', window:'weiter 15 kg Teilbelastung',
      load:'0–0–90° (passiv, Rückenlage)',
      scope:'Frühe Aktivierung',
      tasks:[
        { id:'fort-oben', label:'Forcierter Ober-in-Sitz' },
        { id:'koko', label:'Ko-Kontraktion (Brunow)' },
      ],
      techniques:['Lymphdrainage bei Erguss']
    },
    { id:'ab1w', title:'ab 1. Woche (Hartschiene)',
      window:'Bewegungslimit 0°→0°→90° (4 Wochen)',
      load:'Teilbelastung; Orthese tagsüber',
      scope:'Bewegungserweiterung & Patellagleiten',
      tasks:[
        { id:'passiv',   label:'Passive Beugung 0–0–90° (Rückenlage)' },
        { id:'quad-iso', label:'Quadrizeps isometrisch (mehrmals/Tag)' },
        { id:'patella',  label:'Patellamobilisation' },
      ],
      techniques:['Hochlagerung in Streckung']
    },
    { id:'ab2w', title:'ab 2. Woche',
      window:'bis halbes Körpergewicht (ohne Stützen, wenn sicher)',
      load:'Stabilisation + Gangschule',
      scope:'Kraft & Propriozeption',
      tasks:[
        { id:'kette-geschl', label:'Geschlossene Kette (Mini-Squat 0–45°)' },
        { id:'offene-kette', label:'Offene Kette (Quadrizeps, schmerzfrei)' },
        { id:'balance',      label:'Propriozeption (Wackelbrett/Pad)' },
      ],
      techniques:['Lymphdrainage bei Erguss']
    },
    { id:'ab4w', title:'ab 4. Woche',
      window:'Vollbelastung bei normalem Gangbild',
      load:'Quadrizeps ≥ 80 %, Flexion > 110°',
      scope:'Funktionelles Training & Gangbild',
      tasks:[
        { id:'treppe', label:'Gangschule (Treppentraining)' },
        { id:'quad80', label:'Kraft Quadrizeps (~80 %) aufbauen' },
        { id:'koord',  label:'Koordination (Brunow)' },
      ],
      techniques:[]
    },
    { id:'w6-8', title:'ab 6.–8. Woche',
      window:'Trainingsintensivierung',
      load:'Reaktion/Kraft, Laufen erlaubt (wenn frei)',
      scope:'Return-to-Run',
      tasks:[
        { id:'lauf',    label:'Laufbeginn (Laufband), locker/Intervall' },
        { id:'beinpres',label:'Beinpresse (geschlossene Kette)' },
        { id:'sidestep',label:'Sidesteps / kleine Sprünge' },
      ],
      techniques:[]
    },
    { id:'ab20w', title:'ab 20. Woche',
      window:'Sportspezifisches Training',
      load:'Quadrizeps ≥ 85 %, stabil & schmerzfrei',
      scope:'Return-to-Sport',
      tasks:[
        { id:'sport',    label:'Sportspezifisches Training steigern' },
        { id:'clearance',label:'Abschluss-Check/Arzt – Freigabe' },
      ],
      techniques:[]
    },
  ];

  /* ---------- Storage für Häkchen ---------- */
  const uid = (window.currentUserId || 'anon') + ':rehabV1';
  const STORE_KEY = 'rehabPlan:' + uid;
  const state = loadState();

  function loadState(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); }catch(_){ return {}; } }
  function saveState(s){ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

  /* ---------- Renderer: Checklisten-Timeline ---------- */
  const tl = byId('rehabTimeline');

  function phaseHTML(p) {
    const done = (p.tasks||[]).filter(t => state[p.id+':'+t.id]).length;
    const total = (p.tasks||[]).length;
    return `
      <li class="phase" data-id="${p.id}">
        <button class="phase-header" type="button" aria-expanded="false">
          <div class="phase-title">${p.title}</div>
          <div class="phase-meta">
            <span class="pill">${p.window}</span>
            <span class="pill">Belastung/Ziel: ${p.load}</span>
            ${p.techniques?.length ? `<span class="pill">Techniken: ${p.techniques.join(', ')}</span>` : ''}
            <span class="pill" data-counter>${done}/${total} erledigt</span>
          </div>
        </button>
        <div class="phase-body">
          ${(p.tasks||[]).map(t=>{
            const id = p.id+':'+t.id, chk = state[id] ? 'checked' : '';
            return `
              <div class="task">
                <input type="checkbox" id="${id}" ${chk}/>
                <label for="${id}">${t.label}${t.detail?`<small>${t.detail}</small>`:''}</label>
              </div>`;
          }).join('')}
        </div>
      </li>
    `;
  }

  function renderChecklist(plan){
    if (!tl) return;
    tl.innerHTML = plan.map(phaseHTML).join('');
    // Toggle
    tl.querySelectorAll('.phase-header').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const li = btn.closest('.phase');
        const open = li.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true':'false');
      });
    });
    // Save checks
    tl.querySelectorAll('.task input[type="checkbox"]').forEach(cb=>{
      cb.addEventListener('change',()=>{
        state[cb.id] = cb.checked;
        saveState(state);
        refreshCounter(cb.closest('.phase'));
      });
    });
  }

  function refreshCounter(li){
    const checks = [...li.querySelectorAll('.task input[type="checkbox"]')];
    const done = checks.filter(c=>c.checked).length;
    const total = checks.length;
    const pill = li.querySelector('[data-counter]');
    if (pill) pill.textContent = `${done}/${total} erledigt`;
  }

  /* ---------- Zahlenstrahl / Info-Kacheln ---------- */
  const stepsUl = byId('phaseSteps');
  const progressBar = byId('railProgress');
  const infoBox = byId('phaseInfo');

  // Beispiel: Patient aktuell in "ab 4. Woche"
  let currentPhaseId = 'ab4w';

  function renderTrack(plan){
    stepsUl.innerHTML = plan.map(p => `
      <li class="step" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.title}">
        <div class="dot"></div>
        <label>${p.title}</label>
        <small>${p.window}</small>
      </li>`).join('');

    stepsUl.querySelectorAll('.step').forEach((el, idx)=>{
      el.addEventListener('click', ()=> setCurrent(plan[idx].id));
      el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') setCurrent(plan[idx].id); });
    });

    setCurrent(currentPhaseId);
  }

  function setCurrent(phaseId){
    currentPhaseId = phaseId;
    const plan = PLAN_VKB;
    const idx = plan.findIndex(p=>p.id===phaseId);
    // Markierung
    stepsUl.querySelectorAll('.step').forEach((el,i)=>el.classList.toggle('active', i<=idx));
    // Progressbreite
    const count = plan.length;
    const percent = (idx<=0) ? 0 : (idx/(count-1))*100;
    progressBar.style.width = `calc(${percent}% - 0px)`;

    // Info-Kacheln
    const ph = plan[idx];
    infoBox.innerHTML = `
      <h3>${ph.title}</h3>
      <div class="info-grid">
        <div class="info-tile">
          <h4>Bewegungsumfang</h4>
          <div>${ph.window}</div>
        </div>
        <div class="info-tile">
          <h4>Belastung / Ziel</h4>
          <div>${ph.load}</div>
        </div>
        <div class="info-tile">
          <h4>Nachbehandlung & Techniken</h4>
          <div>${(ph.techniques && ph.techniques.length)? ph.techniques.join(', ') : '—'}</div>
        </div>
        <div class="info-tile">
          <h4>Schwerpunkt</h4>
          <div>${ph.scope||'—'}</div>
        </div>
      </div>
    `;
  }

  /* ---------- Buttons & Schema ---------- */
  byId('expandAll')?.addEventListener('click',()=>{
    tl?.querySelectorAll('.phase').forEach(li=>{
      li.classList.add('open'); li.querySelector('.phase-header')?.setAttribute('aria-expanded','true');
    });
  });
  byId('collapseAll')?.addEventListener('click',()=>{
    tl?.querySelectorAll('.phase').forEach(li=>{
      li.classList.remove('open'); li.querySelector('.phase-header')?.setAttribute('aria-expanded','false');
    });
  });

  // PDF via Druckdialog
  byId('downloadPdf')?.addEventListener('click', ()=> window.print());

  byId('schemaSelect')?.addEventListener('change', ()=>{
    renderChecklist(PLAN_VKB);
    renderTrack(PLAN_VKB);
  });

  /* ---------- Initial ---------- */
  renderChecklist(PLAN_VKB);
  renderTrack(PLAN_VKB);

  /* Helpers */
  function byId(id){ return document.getElementById(id); }
})();
