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

      // 💡 Neu: Wenn Hash #trainingsplan vorhanden → direkt dorthin
      if (location.hash === '#trainingsplan') {
        console.log('Direktaufruf Trainingsplan erkannt → überspringe Login');
        // App initialisieren, falls noch nicht vorhanden
        if (!window.app) {
          appInstance = new RehaScheduleApp();
          window.app = appInstance;
        }
        // showView-Methode deiner App aufrufen (sofern vorhanden)
        if (window.app.showView) {
          window.app.showView('trainingsplan');
        } else {
          console.warn('showView() nicht gefunden – prüfe App-API');
        }
        return; // ⚡ kein weiteres Umschalten (verhindert Login-Flash)
      }

      // Normaler Start (kein spezieller Hash)
      if (!window.app) {
        appInstance = new RehaScheduleApp();
        window.app = appInstance;
      }

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
