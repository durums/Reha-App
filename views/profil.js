(async function () {
  // Sicherstellen, dass Auth/DB da sind
  const auth = window.auth;
  const db   = window.db;
  if (!auth || !db) {
    console.warn("Firebase-Instanzen nicht gefunden.");
    return;
  }

  // Helfer
  const $ = (id) => document.getElementById(id);
  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val ?? "–"; };
  const fmtDate = (v) => {
    if (!v) return "–";
    try {
      // unterstützt: JS-Date, millis, Firestore Timestamp
      const d = v.toDate ? v.toDate() : (typeof v === "number" ? new Date(v) : new Date(v));
      return isNaN(d) ? "–" : d.toLocaleDateString("de-DE");
    } catch { return "–"; }
  };
  const join = (v) => Array.isArray(v) ? (v.length ? v.join(", ") : "–") : (v || "–");

  // Wenn nicht eingeloggt → Info anzeigen
  const user = auth.currentUser;
  if (!user) {
    setText("p-name",   "— (Bitte anmelden) —");
    setText("p-email",  "—");
    return;
  }

  // Auth-Basisdaten
  setText("p-name",  user.displayName || user.email || ("UID:" + user.uid));
  setText("p-email", user.email || "–");
  setText("p-phone", user.phoneNumber || "–");

  // Profildaten aus Firestore
  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const ref  = doc(db, "profiles", user.uid);
    const snap = await getDoc(ref);

    const data = snap.exists() ? snap.data() : {};

    // Persönlich
    setText("p-dob",        fmtDate(data.dob));
    setText("p-emergency",  data.emergencyContact || "–");
    setText("p-gender",     data.gender || "–");

    // Medizinisch
    setText("m-dx",         join(data.diagnoses));
    setText("m-op",         fmtDate(data.opDate));
    setText("m-reha",       (fmtDate(data.rehaStart) + " – " + fmtDate(data.rehaEnd)).replace("– – –", "–"));
    setText("m-phase",      data.rehaPhase || "–");
    setText("m-comorbid",   join(data.comorbidities));
    setText("m-meds",       join(data.medications));
    setText("m-allergies",  join(data.allergies));

    // Funktionell
    setText("f-mobility",   data.mobility || "–");
    setText("f-aids",       join(data.aids));
    setText("f-strength",   data.strength || "–");
    setText("f-pain",       (data.painLevel ?? "–"));
    setText("f-adl",        data.adl || "–");
    setText("f-balance",    data.balance || "–");
    setText("f-cognition",  data.cognition || "–");

  } catch (e) {
    console.error("Profil laden fehlgeschlagen:", e);
  }
})();
