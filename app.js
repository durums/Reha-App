// app.js - Hauptlogik für Reha Tagesprogramm
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Bereits initialisierte Firebase-App wiederverwenden (Index hat init gemacht)
const app = getApp();
const auth = getAuth(app);

// --- Auth-UI (falls gewünscht hier) ---
function initAuthUI() {
  const userInfo  = document.getElementById('user-info');
  const signOutBtn= document.getElementById('sign-out');

  if (!userInfo || !signOutBtn) {
    console.warn('Auth-UI: #user-info oder #sign-out nicht gefunden.');
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const name = user.displayName || user.email || ("UID: " + user.uid);
      userInfo.textContent = `Angemeldet: ${name}`;
      signOutBtn.style.display = 'inline-block';
      window.currentUser = user;
    } else {
      userInfo.textContent = 'Nicht angemeldet';
      signOutBtn.style.display = 'none';
      window.currentUser = null;
    }
  });

  signOutBtn.addEventListener('click', async () => {
    try { await signOut(auth); }
    catch (err) { console.error('Sign-out error', err); alert('Abmelden fehlgeschlagen — Konsole prüfen.'); }
  });
}

// --- Deine App-Klasse (unverändert) ---
class RehaScheduleApp {
  /* ... dein ganzer vorhandener Code der Klasse ... */
}

// --- Sichere Initialisierung auch wenn DOMContentLoaded schon vorbei ist ---
let appInstance;
function boot() {
  console.log('Booting RehaScheduleApp...');
  initAuthUI();                         // optional, wenn UI hier gesteuert werden soll
  appInstance = new RehaScheduleApp();
  window.app = appInstance;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  // DOM ist bereits bereit (weil app.js dynamisch nach Login geladen wurde)
  boot();
}

// --- Service Worker robust registrieren ---
if ('serviceWorker' in navigator) {
  function registerSW() {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker: Registration successful', registration.scope);
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('ServiceWorker: New content available');
                window.app?.showSyncStatus?.('App-Update verfügbar - Seite neu laden', 'info');
              } else {
                console.log('ServiceWorker: Content cached for offline use');
                window.app?.showSyncStatus?.('App ist jetzt offline verfügbar', 'success');
              }
            }
          });
        });
        registration.update();
      })
      .catch(err => console.error('ServiceWorker: Registration failed', err));
  }

  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
} else {
  console.log('ServiceWorker: Not supported in this browser');
}
