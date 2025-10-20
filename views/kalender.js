(async function(){
  const auth = window.auth, db = window.db;
  if(!auth?.currentUser) return;

  const $ = id => document.getElementById(id);
  const setStatus = (msg,type="ok")=>{
    const el = $("pf-status");
    el.textContent = msg || "";
    el.style.color = type==="err" ? "#b00020" : "var(--muted)";
  };
  const initials = (nameOrMail)=>{
    const s=(nameOrMail||"").trim(); if(!s) return "U";
    if(s.includes("@")) return s[0].toUpperCase();
    const p=s.split(/\s+/); return (p[0]?.[0]||"U").toUpperCase()+(p[1]?.[0]||"");
  };

  // Prefill aus Auth + Firestore
  const user = auth.currentUser;
  const display = user.displayName || "";
  const [first,last] = display.split(" ");
  $("pf-first").value = first || "";
  $("pf-last").value  = last  || "";
  $("pf-email").value = user.email || "";
  $("pf-avatar").textContent = initials(display || user.email);

  try{
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const snap = await getDoc(doc(db,"profiles",user.uid));
    const data = snap.exists() ? snap.data() : {};
    $("pf-phone").value = data.phone || "";
    $("pf-reminders").checked = !!data.remindersEnabled;
    $("pf-summary").checked   = !!data.weeklySummaryEnabled;
  }catch(e){ console.warn(e); }

  // Foto (optional: als DataURL speichern)
  $("pf-photo").addEventListener("change", async (e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ $("pf-avatar").textContent=""; $("pf-avatar").style.backgroundImage=`url(${reader.result})`; $("pf-avatar").style.backgroundSize="cover"; };
    reader.readAsDataURL(file);
    // Tipp: für echtes Hosting -> Firebase Storage nutzen und URL in profiles speichern.
  });

  // Speichern
  $("pf-save").addEventListener("click", async ()=>{
    setStatus("Speichere…");
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const first = $("pf-first").value.trim(), last = $("pf-last").value.trim();
    const phone = $("pf-phone").value.trim();
    const reminders = $("pf-reminders").checked;
    const summary   = $("pf-summary").checked;

    try{
      // Auth-DisplayName aktualisieren
      const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
      await updateProfile(user, { displayName: (first||last)? `${first} ${last}`.trim() : null });

      // Firestore-Profil mergen
      await setDoc(doc(db,"profiles",user.uid), {
        phone, remindersEnabled: reminders, weeklySummaryEnabled: summary
      }, { merge:true });

      // UI
      $("pf-avatar").textContent = initials(first ? `${first} ${last}` : (user.email||""));
      setStatus("Gespeichert.");
    }catch(err){
      console.error(err);
      setStatus("Speichern fehlgeschlagen.", "err");
    }
  });

  // Passwort ändern (Reset-Mail)
  $("pf-pass").addEventListener("click", async ()=>{
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    try{
      await sendPasswordResetEmail(auth, user.email);
      alert("E-Mail zum Zurücksetzen des Passworts wurde gesendet.");
    }catch(e){
      alert("Konnte E-Mail nicht senden: " + (e?.code || e));
    }
  });

  // (MFA Placeholder)
  $("pf-mfa").addEventListener("click", ()=>{ /* disabled */ });
})();
