// Erwartet: window.auth (Firebase Auth) + optional window.db (Firestore)
(async function () {
  const auth = window.auth, db = window.db;

  const $ = (id) => document.getElementById(id);
  const setVal = (id, v) => { const el = $(id); if (el) el.value = v ?? ""; };
  const setText = (id, v) => { const el = $(id); if (el) el.textContent = v ?? ""; };

  const initials = (nameOrMail) => {
    const s = (nameOrMail || "").trim();
    if (!s) return "U";
    if (s.includes("@")) return s[0].toUpperCase();
    const parts = s.split(/\s+/);
    return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "");
  };

  const u = auth?.currentUser;
  if (!u) {
    setText("pf-status", "Bitte melde dich an.");
    return;
  }

  const display = u.displayName || u.email || ("UID:" + u.uid);
  const av = $("pf-avatar"); if (av) av.textContent = initials(display);
  setVal("pf-email", u.email || "");
  setVal("pf-first", u.displayName?.split(" ")?.[0] || "");
  setVal("pf-last", u.displayName?.split(" ")?.slice(1).join(" ") || "");
  setVal("pf-phone", u.phoneNumber || "");

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
  // Passwort ändern Modal
  // =========================
  const passBtn   = $("pf-pass");
  const dialog    = $("pf-pass-dialog");
  const cancelBtn = $("pf-pass-cancel");
  const saveBtn   = $("pf-pass-save");
  const statusEl  = $("pf-pass-status");
  const oldInp    = $("pf-pass-old");
  const newInp    = $("pf-pass-new");

  const openDialog = () => {
    dialog.style.display = "grid";
    if (statusEl) statusEl.textContent = "";
    if (oldInp) oldInp.value = "";
    if (newInp) newInp.value = "";
    setTimeout(()=> oldInp?.focus(), 0);
  };
  const closeDialog = () => { dialog.style.display = "none"; };

  passBtn?.addEventListener("click", openDialog);
  cancelBtn?.addEventListener("click", closeDialog);
  dialog?.addEventListener("click", (ev) => { if (ev.target === dialog) closeDialog(); });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && dialog?.style.display !== "none") closeDialog();
  });

  saveBtn?.addEventListener("click", async () => {
    const oldPass = oldInp.value.trim();
    const newPass = newInp.value.trim();
    if (!oldPass || !newPass) {
      statusEl.textContent = "Bitte beide Felder ausfüllen.";
      return;
    }
    if (newPass.length < 6) {
      statusEl.textContent = "Das neue Passwort muss mindestens 6 Zeichen lang sein.";
      return;
    }

    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
        await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

      const user = auth.currentUser;
      const cred = EmailAuthProvider.credential(user.email, oldPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);

      statusEl.textContent = "✅ Passwort erfolgreich geändert.";
      setTimeout(closeDialog, 1200);
    } catch (err) {
      console.error(err);
      statusEl.textContent = "❌ Fehler: " + (err.message || "Unbekannt");
    }
  });
})();

// =========================
// Privatsphäre Modal mit Fokussteuerung
// =========================
(() => {
  const trigger = document.getElementById("pf-privacy");
  const dialog  = document.getElementById("pf-privacy-dialog");
  const closeBtn= document.getElementById("pf-privacy-close");
  if (!trigger || !dialog) return;

  let lastFocus = null;

  const getFocusables = (root) =>
    Array.from(root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'
    ));

  const open = () => {
    lastFocus = document.activeElement;
    dialog.style.display = "grid";
    document.body.style.overflow = "hidden";
    const f = getFocusables(dialog);
    (f[0] || closeBtn || dialog).focus();
  };

  const close = () => {
    dialog.style.display = "none";
    document.body.style.overflow = "";
    lastFocus?.focus();
  };

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  document.addEventListener("keydown", (e) => {
    if (dialog.style.display === "none") return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      const f = getFocusables(dialog);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
})();
