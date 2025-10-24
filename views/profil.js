(async function () {
  const auth = window.auth, db = window.db;
  if (!auth || !db) console.warn("auth oder db ist nicht vorhanden.");

  const $ = (id) => document.getElementById(id);
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };

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
    setText("pf-avatar", "U");
    const status = $("pf-status");
    if (status) status.textContent = "— (Bitte anmelden) —";
  } else {
    const display = u.displayName || u.email || ("UID:" + u.uid);

    // Avatar & Basisdaten
    const av = $("pf-avatar");
    if (av) av.textContent = initials(display);

    // Formularfelder vorausfüllen
    setValue("pf-email", u.email || "");
    setValue("pf-phone", u.phoneNumber || "");

    // Profildaten aus Firestore laden
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const snap = await getDoc(doc(db, "profiles", u.uid));
      const d = snap.exists() ? snap.data() : {};

      if (d.firstName) setValue("pf-first", d.firstName);
      if (d.lastName) setValue("pf-last", d.lastName);
      if (d.phone) setValue("pf-phone", d.phone);

      if ($("pf-reminders")) $("pf-reminders").checked = !!d.notifications?.reminders;
      if ($("pf-summary")) $("pf-summary").checked = !!d.notifications?.summary;
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback: pseudo-disabled Buttons blocken
  document.querySelectorAll(".pf-row-btn.is-disabled").forEach(btn => {
    btn.addEventListener("click", e => e.preventDefault());
  });

  // === Einstellungen / Sicherheit (außer Passwort – das kommt unten mit Modal) ===
  on("pf-mfa", () => alert("Zwei-Faktor-Authentifizierung aktivieren – Funktion kommt bald!"));
  on("pf-lang", () => alert("Sprache ändern – Funktion kommt bald!"));
  on("pf-privacy", () => alert("Privatsphäre-Einstellungen – Funktion kommt bald!"));

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
          av.textContent = "";
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
        const status = $("pf-status");
        if (status) status.textContent = "Fehler beim Speichern.";
      }
    });
  }

  // =========================
  // Passwort ändern (mit Re-Auth)
  // =========================

  function createModal(html) {
    if (document.querySelector(".pf-modal")) return null;
    const modal = document.createElement("div");
    modal.className = "pf-modal";
    modal.innerHTML = html;
    document.body.appendChild(modal);
    return modal;
  }

  function showPasswordModal() {
    const modal = createModal(`
      <div class="pf-modal-content">
        <h3>Passwort ändern</h3>
        <p>Bitte gib dein neues Passwort ein:</p>
        <input id="pf-new-pass" type="password" placeholder="Neues Passwort" class="pf-input" />
        <div class="pf-modal-actions">
          <button id="pf-cancel" class="btn ghost">Abbrechen</button>
          <button id="pf-save-pass" class="btn">Speichern</button>
        </div>
        <span id="pf-pass-msg" class="subtle"></span>
      </div>
    `);
    if (!modal) return;

    const msg = document.getElementById("pf-pass-msg");
    document.getElementById("pf-cancel").addEventListener("click", () => modal.remove());

    document.getElementById("pf-save-pass").addEventListener("click", async () => {
      const newPass = document.getElementById("pf-new-pass").value.trim();
      if (newPass.length < 6) { msg.textContent = "Das Passwort muss mindestens 6 Zeichen haben."; return; }

      try {
        const { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } =
          await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
        const user = getAuth().currentUser;
        if (!user) { msg.textContent = "Bitte melde dich erneut an."; return; }

        // Versuch 1: direkt ändern
        try {
          await updatePassword(user, newPass);
          msg.textContent = "✅ Passwort erfolgreich geändert!";
          msg.style.color = "green";
          setTimeout(() => modal.remove(), 1500);
          return;
        } catch (err) {
          // Wenn Re-Auth nötig:
          if (err?.code !== "auth/requires-recent-login") throw err;
        }

        // Re-Auth Dialog anzeigen (nur für E-Mail/Passwort)
        if (!user.email) {
          msg.textContent = "Erneute Anmeldung erforderlich. Bitte melde dich neu an.";
          return;
        }

        // Re-Auth Modal
        const reauthModal = createModal(`
          <div class="pf-modal-content">
            <h3>Erneut anmelden</h3>
            <p>Zur Sicherheit bestätige bitte dein aktuelles Passwort für <b>${user.email}</b>.</p>
            <input id="pf-current-pass" type="password" placeholder="Aktuelles Passwort" class="pf-input" />
            <div class="pf-modal-actions">
              <button id="pf-reauth-cancel" class="btn ghost">Abbrechen</button>
              <button id="pf-reauth-ok" class="btn">Bestätigen</button>
            </div>
            <span id="pf-reauth-msg" class="subtle"></span>
          </div>
        `);
        const reMsg = document.getElementById("pf-reauth-msg");
        document.getElementById("pf-reauth-cancel").addEventListener("click", () => reauthModal?.remove());
        document.getElementById("pf-reauth-ok").addEventListener("click", async () => {
          const currentPass = document.getElementById("pf-current-pass").value;
          if (!currentPass) { reMsg.textContent = "Bitte Passwort eingeben."; return; }
          try {
            const cred = EmailAuthProvider.credential(user.email, currentPass);
            await reauthenticateWithCredential(user, cred);
            await updatePassword(user, newPass);
            reMsg.textContent = "";
            reauthModal?.remove();
            msg.textContent = "✅ Passwort erfolgreich geändert!";
            msg.style.color = "green";
            setTimeout(() => modal.remove(), 1500);
          } catch (e) {
            console.error(e);
            reMsg.textContent = "Re-Auth fehlgeschlagen. Bitte prüfe dein Passwort.";
            reMsg.style.color = "red";
          }
        });

      } catch (err) {
        console.error(err);
        msg.textContent = "Fehler: " + (err?.message || "Passwort konnte nicht geändert werden.");
        msg.style.color = "red";
      }
    });
  }

  // Button verküpfen (ohne doppelten Alert-Listener)
  const passBtn = $("pf-pass");
  if (passBtn) passBtn.addEventListener("click", showPasswordModal);

})();
