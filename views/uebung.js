// Basis relativ zu dieser Datei ermitteln (robust für GitHub Pages)
const ASSET_BASE = (() => {
  const src = document.currentScript && document.currentScript.src;
  try { return new URL('.', src).pathname; } catch { return '/views/'; }
})();

// Lange Inhalte pro Übung (HTML erlaubt)
const LONG_DESC = {
  schulterkreisen: `
    <h4>🌀 Übung: Schulterkreisen</h4>
    <p><strong>Ziel:</strong> Sanfte Mobilisation der Schultergelenke – verbessert Beweglichkeit, Durchblutung und löst Verspannungen.</p>

    <h5>🔹 Ausgangsposition</h5>
    <ul>
      <li>Aufrecht stehen oder mit geradem Rücken auf einen Stuhl setzen.</li>
      <li>Arme hängen locker seitlich am Körper.</li>
      <li>Schultern entspannt, Blick nach vorn.</li>
    </ul>

    <h5>🔹 Durchführung</h5>
    <ol>
      <li>Schultern langsam nach oben Richtung Ohren heben.</li>
      <li>Dann nach hinten führen (Schulterblätter leicht zusammenziehen).</li>
      <li>Nach unten sinken lassen.</li>
      <li>Nach vorne bringen und in die Ausgangsposition zurückkehren.</li>
    </ol>
    <p>→ Das ist eine vollständige Kreisbewegung. Ruhig, gleichmäßig, ohne Schwung.</p>

    <h5>🔹 Wiederholungen</h5>
    <ul>
      <li>10–15 Kreise nach <strong>hinten</strong>.</li>
      <li>Danach 10–15 Kreise nach <strong>vorne</strong>.</li>
      <li>Atmung ruhig weiterführen – kein Pressen.</li>
    </ul>

    <h5>🔹 Wichtige Hinweise</h5>
    <ul>
      <li>Bewegung sanft und schmerzfrei ausführen.</li>
      <li>Bei Ziehen/Schmerz den Bewegungsradius verkleinern.</li>
      <li>Ideal als Aufwärm- oder Lockerungsübung vor weiteren Übungen.</li>
    </ul>
  `
};


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
  q('#u-desc-text').innerHTML = LONG_DESC[w.id] || `<p>${w.desc || ''}</p>`;

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
