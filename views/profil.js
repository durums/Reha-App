(async function () {
  const auth = window.auth, db = window.db;
  if (!auth || !db) {
    console.warn("auth oder db ist nicht vorhanden.");
  }

  const $ = (id) => document.getElementById(id);

  // Helpers
  const setText = (id, val) => { const el = $(id); if (el) el.textContent = (val ?? "–"); };
  const setValue = (id, val) => { const el = $(id); if (el) el.value = (val ?? ""); };
  const fmtDate = (v) => {
    if (!v) return "–";
    try {
      const d = v?.toDate ? v.toDate() : new Date(v);
      return isNaN(d) ? "–" : d.toLocaleDateString("de-DE");
    } catch { return "–"; }
  };
  const list = (v) => Array.isArray(v) ? (v.length ? v.join(", ") : "–") : (v || "–");
  const initials = (nameOrMail) => {
    const s = (nameOrMail || "").trim();
    if (!s) return "U";
    if (s.includes("@")) return s[0].toUpperCase();
    const parts = s.split(/\s+/);
    return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "");
  };

  // Aktueller User
  const u = auth?.currentUser;
  if (!u) {
    // Auf dieser Profil-Seite existieren keine p-* Felder – wir setzen nur Avatar falls vorhanden.
    setText("pf-avatar", "U");
    const status = $("pf-status");
    if (status) status.textContent = "— (Bitte anmelden) —";
    // Ohne User kein Laden/Speichern
  } else {
    const display = u.displayName || u.email || ("UID:" + u.uid);

    // Avatar & Basisdaten
    const av = $("pf-avatar");
    if (av) av.textContent = initials(display);

    // Formularfelder vorausfüllen (falls vorhanden)
    setValue("pf-email", u.email || "");
    setValue("pf-phone", u.phoneNumber || "");

    // Profildaten aus Firestore laden
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const snap = await getDoc(doc(db, "profiles", u.uid));
      const d = snap.exists() ? snap.data() : {};

      // Vor-/Nachname (falls gespeichert)
      if (d.firstName) setValue("pf-first", d.firstName);
      if (d.lastName) setValue("pf-last", d.lastName);
      if (d.phone) setValue("pf-phone", d.phone);

      // Benachrichtigungen
      if ($("pf-reminders")) $("pf-reminders").checked = !!d.notifications?.reminders;
      if ($("pf-summary")) $("pf-summary").checked = !!d.notifications?.summary;

      // (Andere Felder – nur Beispiel; existieren auf dieser Seite nicht)
      // fmtDate(d.dob) etc. bei Bedarf nutzen.
    } catch (e) {
      console.error(e);
    }
  }

  // Deaktivierte Buttons (Fallback): nun nicht mehr nötig, aber falls im Markup irgendwo .is-disabled bleibt:
  document.querySelectorAll(".pf-row-btn.is-disabled").forEach(btn => {
    btn.addEventListener("click", e => e.preventDefault());
  });

  // === Sicherheit ===
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };

  on("pf-pass", () => {
    alert("Passwort ändern – Funktion kommt bald!");
    // Beispiel: window.location.href = "/passwort.html";
  });

  on("pf-mfa", () => {
    alert("Zwei-Faktor-Authentifizierung aktivieren – Funktion kommt bald!");
  });

  // === Einstellungen ===
  on("pf-lang", () => {
    alert("Sprache ändern – Funktion kommt bald!");
  });

  on("pf-privacy", () => {
    alert("Privatsphäre-Einstellungen – Funktion kommt bald!");
  });

  // === Foto-Upload: Avatar-Preview ===
  const fileInput = $("pf-photo");
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const av = $("pf-avatar");
        if (av) {
          av.style.backgroundImage = `url('${reader.result}')`;
          av.style.backgroundSize = "cover";
          av.style.backgroundPosition = "center";
          av.textContent = ""; // Initialen ausblenden, wenn Foto da
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // === Speichern: schreibt Basisdaten in Firestore (merge) ===
  const saveBtn = $("pf-save");
  if (saveBtn && auth?.currentUser) {
    saveBtn.addEventListener("click", async () => {
      const status = $("pf-status");
      try {
        const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

        const payload = {
          firstName: $("pf-first")?.value?.trim() || null,
          lastName: $("pf-last")?.value?.trim() || null,
          phone: $("pf-phone")?.value?.trim() || null,
          notifications: {
            reminders: !!$("pf-reminders")?.checked,
            summary: !!$("pf-summary")?.checked,
          },
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "profiles", auth.currentUser.uid), payload, { merge: true });

        if (status) status.textContent = "Gespeichert!";
        saveBtn.disabled = true;
        setTimeout(() => {
          saveBtn.disabled = false;
          if (status) status.textContent = "";
        }, 1200);
      } catch (e) {
        console.error(e);
        if (status) status.textContent = "Fehler beim Speichern.";
      }
    });
  }

})();
