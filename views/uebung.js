// Basis relativ zu dieser Datei ermitteln (robust für GitHub Pages)
const ASSET_BASE = (() => {
  const src = document.currentScript && document.currentScript.src;
  try { return new URL('.', src).pathname; } catch { return '/views/'; }
})();

// (Pragmatisch) kleine Datenbasis lokal – später gern zentral auslagern
const WORKOUTS = [
  { id:'schulterkreisen', title:'Schulterkreisen', desc:'Sanfte Mobilisation der Schultergelenke.',
    emoji:'🏃‍♂️', duration:5, level:'leicht', area:'Oberkörper',
    videoUrl: ASSET_BASE + 'Videos-Training/test_clip.mp4' },
  { id:'nackendehnung', title:'Nackendehnungen', desc:'Entspannung der Nackenmuskulatur.',
    emoji:'🧘‍♀️', duration:8, level:'leicht', area:'Oberkörper',
    videoUrl: ASSET_BASE + 'Videos-Training/test_clip.mp4' },
  { id:'arm-rotation', title:'Arm-Rotationen', desc:'Kräftigung und Mobilisation.',
    emoji:'💪', duration:10, level:'mittel', area:'Oberkörper',
    videoUrl: ASSET_BASE + 'Videos-Training/test_clip.mp4' },
  { id:'kniebeuge', title:'Kniebeugen (assistiert)', desc:'Grundmobilisation & Kraft.',
    emoji:'🦵', duration:7, level:'mittel', area:'Unterkörper',
    videoUrl: ASSET_BASE + 'Videos-Training/test_clip.mp4' },
  { id:'waage', title:'Standwaage leicht', desc:'Balance & Koordination.',
    emoji:'⚖️', duration:6, level:'leicht', area:'Rumpf',
    videoUrl: ASSET_BASE + 'Videos-Training/test_clip.mp4' },
];

function q(sel){return document.querySelector(sel)}
function getId(){return new URLSearchParams(location.search).get('id')}
function fmtMMSS(sec){const m=String(Math.floor(sec/60)).padStart(2,'0');const s=String(sec%60).padStart(2,'0');return `${m}:${s}`}

(function init(){
  const id = getId();
  const w = WORKOUTS.find(x => x.id === id);
  if(!w){ alert('Übung nicht gefunden.'); location.href = 'trainingsplan.html'; return; }

  // Render
  q('#u-title').textContent = w.title;
  q('#u-subtitle').textContent = w.desc || '';
  q('#u-emoji').textContent = w.emoji || '🏃';
  q('#u-duration').textContent = `${w.duration} Min`;
  q('#u-level').textContent = w.level ? (w.level[0].toUpperCase()+w.level.slice(1)) : '–';
  q('#u-area').textContent = w.area || '–';
  q('#u-desc-text').textContent = w.desc || '';

  // Video erst beim Bedarf laden (kein Autoload)
  const vid = q('#u-video');
  vid.removeAttribute('src');
  vid.preload = 'none';
  if (w.videoUrl) {
    // Ladequelle erst, wenn Nutzer das Video sichtbar hat (schon gegeben) – aber noch kein Autoplay
    vid.src = w.videoUrl;
  }
  vid.addEventListener('error', () => {
    console.error('Video-Fehler', vid.error);
    alert('Video konnte nicht geladen werden (Pfad prüfen).');
  });

  // Simple Timer (Countdown von Dauer in Minuten; mit Reset)
  let total = (w.duration||5) * 60; // Sekunden
  let left  = total;
  let tId   = null;

  function renderTime(){ q('#u-timer-display').textContent = fmtMMSS(left); }
  function tick(){
    if(left > 0){ left -= 1; renderTime(); }
    if(left <= 0){ clearInterval(tId); tId=null; left=0; renderTime(); /* optional: Sound/Notification */ }
  }

  q('#u-start').addEventListener('click', () => {
    if (tId) return; // bereits laufend
    tId = setInterval(tick, 1000);
  });
  q('#u-pause').addEventListener('click', () => {
    if (!tId) return;
    clearInterval(tId); tId=null;
  });
  q('#u-reset').addEventListener('click', () => {
    clearInterval(tId); tId=null; left = total; renderTime();
  });

  renderTime();
})();
