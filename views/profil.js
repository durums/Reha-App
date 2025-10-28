// Erwartet: window.auth (Firebase Auth) + optional window.db (Firestore)
// Firebase SDKs müssen bereits im Host-Projekt geladen sein.

(async function () {
  const auth = window.auth, db = window.db;

  // Kurzhelfer
  const $ = (id) => document.getElementById(id);
  const setVal = (id, v) => { const el = $(id); if (el) el.value = v ?? ""; };
  const setText = (id, v) => { const el = $(id); if (el) el.textContent = v ?? ""; };

  // Initials für Avatar
  const initials = (nameOrMail) => {
    const s = (nameOrMail || "").trim();
    if (!s) return "U";
    if (s.includes("@")) return s[0].toUpperCase();
    const parts = s.split(/\s+/);
    return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "");
  };

  // Aktuellen User holen
  const u = auth?.currentUser;
  if (!u) {
    setText("pf-status", "Bitte melde dich an.");
    return;
  }

  // Basisdaten anzeigen
  const display = u.displayName || u.email || ("UID:" + u.uid);
  const av = $("pf-avatar"); if (av) av.textContent = initials(display);
  setVal("pf-email", u.email || "");
  setVal("pf-first", u.displayName?.split(" ")?.[0] || "");
  setVal("pf-last", u.displayName?.split(" ")?.slice(1).join(" ") || "");
  setVal("pf-phone", u.phoneNumber || "");

  // Profildaten aus Firestore (optional)
  try {
    if (db) {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const snap = await getDoc(doc(db, "profiles", u.uid));
      if (snap.exists()) {
        const d = snap.data() || {};
        if (!$("#pf-first").value) setVal("pf-first", d.firstName || "");
        if (!$("#pf-last").value)  setVal("pf-last",  d.lastName  || "");
        if (!$("#pf-phone").value) setVal("pf-phone", d.phone     || "");
      }
    }
  } catch (e) {
    console.error("Profile load failed:", e);
  }

  // Änderungen speichern (einfaches Beispiel: Namen/Telefon in Firestore)
  $("#pf-save")?.addEventListener("click", async () => {
    const status = $("pf-status");
    try {
      if (!db) {
        status.textContent = "Gespeichert (lokal) – Firestore nicht konfiguriert.";
        return;
      }
      const first = $("#pf-first")?.value?.trim() || "";
      const last  = $("#pf-last")?.value?.trim()  || "";
      const phone = $("#pf-phone")?.value?.trim() || "";

      const { doc, setDoc, serverTimestamp } =
        await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

      await setDoc(doc(db, "profiles", u.uid), {
        firstName: first,
        lastName: last,
        phone,
        updatedAt: serverTimestamp()
      }, { merge: true });

      status.textContent = "✅ Änderungen gespeichert.";
      setTimeout(()=> status.textContent = "", 1500);
    } catch (e) {
      console.error(e);
      status.textContent = "❌ Konnte nicht speichern.";
    }
  });

  // =========================
  // Passwort ändern (Modal)
  // =========================
  const passBtn   = $("pf-pass");
  const dialog    = $("pf-pass-dialog");
  const cancelBtn = $("pf-pass-cancel");
  const saveBtn   = $("pf-pass-save");
  const statusEl  = $("pf-pass-status");
  const oldInp    = $("pf-pass-old");
  const newInp    = $("pf-pass-new");

  const openDialog = () => {
    if (!dialog) return;
    dialog.style.display = "grid";
    if (statusEl) statusEl.textContent = "";
    if (oldInp) oldInp.value = "";
    if (newInp) newInp.value = "";
    setTimeout(()=> oldInp?.focus(), 0);
  };
  const closeDialog = () => { if (dialog) dialog.style.display = "none"; };

  passBtn?.addEventListener("click", openDialog);
  cancelBtn?.addEventListener("click", closeDialog);

  // Click außerhalb schließt
  dialog?.addEventListener("click", (ev) => { if (ev.target === dialog) closeDialog(); });
  // ESC schließt
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && dialog?.style.display !== "none") closeDialog();
  });

  // Speichern: Reauth + Update
  saveBtn?.addEventListener("click", async () => {
    if (!auth?.currentUser) return;
    const oldPass = (oldInp?.value || "").trim();
    const newPass = (newInp?.value || "").trim();
    if (statusEl) statusEl.textContent = "";

    if (!oldPass || !newPass) {
      if (statusEl) statusEl.textContent = "Bitte beide Felder ausfüllen.";
      return;
    }
    if (newPass.length < 6) {
      if (statusEl) statusEl.textContent = "Das neue Passwort muss mindestens 6 Zeichen lang sein.";
      return;
    }

    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
        await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

      const user = auth.currentUser;
      // Reauth mit altem Passwort
      const cred = EmailAuthProvider.credential(user.email, oldPass);
      await reauthenticateWithCredential(user, cred);

      // Neues Passwort setzen
      await updatePassword(user, newPass);

      if (statusEl) statusEl.textContent = "✅ Passwort erfolgreich geändert.";
      setTimeout(closeDialog, 1200);
    } catch (err) {
      console.error(err);
      // Häufige Fehlertexte etwas freundlicher machen:
      const msg = String(err?.message || "")
        .replace("Firebase:", "")
        .replace(/\(auth\/[^\)]+\)/, "")
        .trim() || "Änderung fehlgeschlagen.";
      if (statusEl) statusEl.textContent = "❌ " + msg;
    }
  });
})();
// =========================
// Privatsphäre Modal
// =========================
const privacyBtn = document.getElementById("pf-privacy");
const privacyDialog = document.getElementById("pf-privacy-dialog");
const privacyClose = document.getElementById("pf-privacy-close");

if (privacyBtn && privacyDialog) {
  const openPrivacy = () => {
    privacyDialog.style.display = "grid";
  };
  const closePrivacy = () => {
    privacyDialog.style.display = "none";
  };

  privacyBtn.addEventListener("click", openPrivacy);
  privacyClose?.addEventListener("click", closePrivacy);

  // Schließen bei Klick außerhalb
  privacyDialog.addEventListener("click", (e) => {
    if (e.target === privacyDialog) closePrivacy();
  });

  // Schließen mit ESC-Taste
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && privacyDialog.style.display !== "none") closePrivacy();
  });
}
