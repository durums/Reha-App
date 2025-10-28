// --- Auth-UI (Login/Logout-Steuerung) ---
function initAuthUI() {
  const userInfo   = document.getElementById('user-info');
  const signOutBtn = document.getElementById('sign-out');
  const menuToggle = document.querySelector('.menu-toggle'); // Menü-Button
  const sidebar    = document.getElementById('sidebar');

  if (!userInfo || !signOutBtn) {
    console.warn('Auth-UI: #user-info oder #sign-out nicht gefunden.');
    return;
  }

  // Beobachte Auth-Status
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const name = user.displayName || user.email || ("UID: " + user.uid);
      userInfo.textContent = `Angemeldet: ${name}`;
      signOutBtn.style.display = 'inline-block';
      window.currentUser = user;

      // Menü-Button anzeigen
      if (menuToggle) menuToggle.style.display = 'block';

      // 💡 Direktstart bei Hash #trainingsplan
      if (location.hash === '#trainingsplan') {
        console.log('Direktaufruf Trainingsplan erkannt → überspringe Login');
        if (!window.app) {
          window.app = new RehaScheduleApp();
        }
        if (window.app.showView) {
          window.app.showView('trainingsplan');
        } else {
          console.warn('showView() nicht gefunden – prüfe App-API');
        }
        return;
      }

      // Normaler Start
      if (!window.app) {
        window.app = new RehaScheduleApp();
      }

    } else {
      // ❌ Benutzer ausgeloggt
      userInfo.textContent = 'Nicht angemeldet';
      signOutBtn.style.display = 'none';
      window.currentUser = null;

      // Menü-Button & Sidebar ausblenden
      if (menuToggle) menuToggle.style.display = 'none';
      if (sidebar) sidebar.classList.remove('active');
    }
  });

    // --- Logout-Button ---
  signOutBtn.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
  
    if (!sidebar) return;
  
    // Sidebar schließen (Animation starten)
    sidebar.classList.remove('active');
    menuToggle?.classList.remove('active');
  
    // 🎯 Warte, bis Transition fertig ist (oder 300 ms Fallback)
    const transitionHandler = async () => {
      sidebar.removeEventListener('transitionend', transitionHandler);
      try {
        await signOut(auth);
        console.log('✅ Erfolgreich abgemeldet.');
      } catch (err) {
        console.error('Sign-out error', err);
        alert('Abmelden fehlgeschlagen – bitte erneut versuchen.');
      }
    };
  
    sidebar.addEventListener('transitionend', transitionHandler, { once: true });
  
    // Sicherheitsfallback (falls Transition nicht feuert)
    setTimeout(() => {
      if (sidebar.classList.contains('active')) return; // schon offen → abbrechen
      transitionHandler();
    }, 400);
  });
