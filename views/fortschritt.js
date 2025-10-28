// views/fortschritt.js

(function () {
  // -------- Dummy KPI + Recent (kannst du später mit echten Daten ersetzen)
  const weekCount = 4, weekTotal = 15, activeDays = 2, totalPct = 5, badges = 1;
  document.getElementById('kpi-week-count').textContent = weekCount;
  document.getElementById('kpi-week-bar').style.width = Math.min(100, (weekCount / weekTotal) * 100) + '%';
  document.getElementById('kpi-days').textContent = activeDays;
  document.getElementById('kpi-days-bar').style.width = (activeDays / 7) * 100 + '%';
  document.getElementById('kpi-total').textContent = totalPct + '%';
  document.getElementById('kpi-total-bar').style.width = totalPct + '%';
  document.getElementById('kpi-badges').textContent = badges;
  document.getElementById('kpi-badges-bar').style.width = Math.min(100, badges * 10) + '%';

  const recent = [
    { name: 'Schulterkreisen', at: 'Heute, 09:16', dur: '5 Min' },
    { name: 'Nackendehnungen', at: 'Heute, 09:11', dur: '8 Min' },
    { name: 'Rückenstreckung', at: 'Gestern, 10:46', dur: '10 Min' },
    { name: 'Knie-Beugungen', at: 'Gestern, 10:16', dur: '12 Min' },
    { name: 'Beckenlift', at: 'So., 26.10., 09:16', dur: '8 Min' },
  ];
  const recentList = document.getElementById('recentList');
  recent.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${r.name}</strong><br><small>${r.at}</small></div><small>${r.dur}</small>`;
    recentList.appendChild(li);
  });

  // -------- Nachbehandlungs-Daten (VKB – zusammengefasst aus deinem Bogen)
  /** Jede Phase:
   *  id, title, window, load, notes, tasks[{id,label,detail}]
   */
  const PLAN_VKB = [
    {
      id: 'tag1',
      title: '1. Tag',
      window: 'Ruhigstellung 0–0° (Tag & Nacht, 1 Woche)',
      load: '15 kg Teilbelastung, 2 Gehstützen',
      notes: 'Kühlung (Cryo Cuff), Thromboseprophylaxe',
      tasks: [
        { id: 'redon', label: 'Redon-Entfernung', detail: '' },
        { id: 'quad', label: 'Elektrostimulation Quadrizeps (isometrisch)', detail: '' },
        { id: 'pnf', label: 'Bewegungsübungen (PNF)', detail: 'sanft, schmerzfrei' },
      ],
    },
    {
      id: 'tag2',
      title: '2. Tag',
      window: 'weiter 15 kg Teilbelastung, 2 Gehstützen',
      load: '0–0–90° in Rückenlage (passiv)',
      notes: 'Lymphdrainage bei Erguss',
      tasks: [
        { id: 'fort-oben', label: 'Forcierter Ober-in-Sitz', detail: '' },
        { id: 'koko', label: 'Kokontraktion (Brunow)', detail: '' },
      ],
    },
    {
      id: 'ab1w',
      title: 'ab 1. Woche (Hartschiene)',
      window: 'Bewegungs-Limit 0°→0°→90° (4 Wochen)',
      load: 'Teilbelastung; Orthese tagsüber',
      notes: 'Knie in Streckung lagern',
      tasks: [
        { id: 'passiv', label: 'Passive Beugung 0–0–90°', detail: 'Rückenlage' },
        { id: 'quad-iso', label: 'Quadrizeps isometrisch', detail: 'mehrmals täglich' },
        { id: 'patella', label: 'Patellamobilisation', detail: '' },
      ],
    },
    {
      id: 'ab2w',
      title: 'ab 2. Woche',
      window: 'bis halbes Körpergewicht (ohne Stützen, wenn sicher)',
      load: 'Stabilisation & Gangschule',
      notes: 'Lymphdrainage bei Erguss',
      tasks: [
        { id: 'kette-geschl', label: 'Geschlossene Kette', detail: 'Mini-Kniebeuge 0–45°' },
        { id: 'offene-kette', label: 'Offene Kette', detail: 'nur Quadrizeps im Schmerzfrei-Bereich' },
        { id: 'balance', label: 'Propriozeption', detail: 'Wackelbrett/Pad' },
      ],
    },
    {
      id: 'ab4w',
      title: 'ab 4. Woche',
      window: 'Vollbelastung ohne Stützen bei normalem Gangbild',
      load: 'Quadrizepskraft ≥80%, Flexion > 110°',
      notes: '',
      tasks: [
        { id: 'treppe', label: 'Gangschule (Treppentraining)', detail: '' },
        { id: 'quad80', label: 'Kraft Quadrizeps ~80%', detail: 'Aufbau' },
        { id: 'koord', label: 'Koordination', detail: 'Brunow-Schema' },
      ],
    },
    {
      id: 'w6-8',
      title: 'ab 6.–8. Woche',
      window: 'Trainingsintensivierung',
      load: 'Reaktions-/Krafttraining, Laufen erlaubt (wenn frei)',
      notes: '',
      tasks: [
        { id: 'lauf', label: 'Laufbeginn (Laufband)', detail: 'locker, Intervall' },
        { id: 'beinpres', label: 'Beinpresse', detail: 'geschl. Kette' },
        { id: 'sidestep', label: 'Sidesteps / kleine Sprünge', detail: 'Reaktion' },
      ],
    },
    {
      id: 'ab20w',
      title: 'ab 20. Woche',
      window: 'Rückkehr zum sportartspezifischen Training',
      load: 'Quadrizepskraft ≥85%, stabil, schmerzfrei',
      notes: 'Freigabe durch Sportsprechstunde',
      tasks: [
        { id: 'sport', label: 'Sportspezifisches Training', detail: 'steigern' },
        { id: 'clearance', label: 'Abschluss-Check/Arzt', detail: 'Freigabe' },
      ],
    },
  ];

  // -------- Storage-Helpers (lokal pro Nutzer)
  const uid = (window.currentUserId || 'anon') + ':rehabV1';
  const STORE_KEY = 'rehabPlan:' + uid;

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch(_) { return {}; }
  }
  function saveState(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  // -------- Renderer
  const tl = document.getElementById('rehabTimeline');
  const state = loadState(); // { [taskId]: true }

  function phaseHTML(p) {
    const doneCount = (p.tasks || []).filter(t => state[p.id + ':' + t.id]).length;
    const total = (p.tasks || []).length;

    return `
      <li class="phase" data-id="${p.id}">
        <button class="phase-header" type="button" aria-expanded="false">
          <div class="phase-title">${p.title}</div>
          <div class="phase-meta">
            <span class="pill">${p.window}</span>
            <span class="pill">Belastung / Ziel: ${p.load}</span>
            ${p.notes ? `<span class="pill">Hinweis: ${p.notes}</span>` : ''}
            <span class="pill" data-counter>${doneCount}/${total} erledigt</span>
          </div>
        </button>
        <div class="phase-body">
          ${(p.tasks||[]).map(t => {
            const tid = `${p.id}:${t.id}`;
            const checked = state[tid] ? 'checked' : '';
            return `
              <div class="task">
                <input type="checkbox" id="${tid}" ${checked} />
                <label for="${tid}">${t.label}${t.detail ? `<small>${t.detail}</small>`:''}</label>
              </div>
            `;
          }).join('')}
        </div>
      </li>
    `;
  }

  function render(plan) {
    tl.innerHTML = plan.map(phaseHTML).join('');
    attachInteractions();
  }

  function refreshCounters(li) {
    const checks = [...li.querySelectorAll('.task input[type="checkbox"]')];
    const done = checks.filter(c => c.checked).length;
    const total = checks.length;
    const counter = li.querySelector('[data-counter]');
    if (counter) counter.textContent = `${done}/${total} erledigt`;
  }

  function attachInteractions() {
    // Auf-/Zuklappen
    tl.querySelectorAll('.phase-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const li = btn.closest('.phase');
        const isOpen = li.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });

    // Haken speichern
    tl.querySelectorAll('.task input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        state[cb.id] = cb.checked;
        saveState(state);
        refreshCounters(cb.closest('.phase'));
      });
    });
  }

  // Buttons
  document.getElementById('expandAll').addEventListener('click', () => {
    tl.querySelectorAll('.phase').forEach(li => {
      li.classList.add('open');
      li.querySelector('.phase-header').setAttribute('aria-expanded','true');
    });
  });
  document.getElementById('collapseAll').addEventListener('click', () => {
    tl.querySelectorAll('.phase').forEach(li => {
      li.classList.remove('open');
      li.querySelector('.phase-header').setAttribute('aria-expanded','false');
    });
  });

  // „Export“ = schöner Druck (nutzt @media print)
  document.getElementById('exportPlan').addEventListener('click', () => {
    window.print();
  });

  // Schema-Wechsler (hier nur 1 Schema hinterlegt)
  document.getElementById('schemaSelect').addEventListener('change', e => {
    const val = e.target.value;
    if (val === 'VKB') render(PLAN_VKB);
    // Platz für weitere Pläne
  });

  // Initial render
  render(PLAN_VKB);
})();
