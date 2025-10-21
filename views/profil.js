(async function () {
  const auth = window.auth, db = window.db;
  const $ = (id)=>document.getElementById(id);
  const set=(id,val)=>{const el=$(id); if(el) el.textContent=val??"–";};
  const fmtDate = (v)=>{
    if(!v) return "–";
    try{const d=v?.toDate?v.toDate():new Date(v); return isNaN(d)? "–" : d.toLocaleDateString("de-DE");}
    catch{ return "–"; }
  };
  const list=(v)=>Array.isArray(v)?(v.length?v.join(", "):"–"):(v||"–");
  const initials=(nameOrMail)=>{
    const s=(nameOrMail||"").trim();
    if(!s) return "U";
    if(s.includes("@")) return s[0].toUpperCase();
    const parts=s.split(/\s+/); return (parts[0]?.[0]||"U").toUpperCase() + (parts[1]?.[0]||"");
  };

  const u = auth.currentUser;
  if(!u){ set("p-name","— (Bitte anmelden) —"); return; }

  const display = u.displayName || u.email || ("UID:" + u.uid);
  set("p-name", display);
  set("p-email", u.email || "–");
  set("p-phone", u.phoneNumber || "–");
  const av=$("p-avatar"); if(av) av.textContent = initials(display);

  try{
    const {doc,getDoc} = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const snap = await getDoc(doc(db,"profiles",u.uid));
    const d = snap.exists()? snap.data(): {};

    set("p-dob", fmtDate(d.dob));
    set("p-emergency", d.emergencyContact || "–");
    set("p-gender", d.gender || "–");

    set("m-dx", list(d.diagnoses));
    set("m-op", fmtDate(d.opDate));
    set("m-reha", `${fmtDate(d.rehaStart)} – ${fmtDate(d.rehaEnd)}`);
    set("m-phase", d.rehaPhase || "–");
    set("m-comorbid", list(d.comorbidities));
    set("m-meds", list(d.medications));
    set("m-allergies", list(d.allergies));

    set("f-mobility", d.mobility || "–");
    set("f-aids", list(d.aids));
    set("f-strength", d.strength || "–");
    set("f-pain", d.painLevel ?? "–");
    set("f-adl", d.adl || "–");
    set("f-balance", d.balance || "–");
    set("f-cognition", d.cognition || "–");
  }catch(e){ console.error(e); }
  
  document.querySelectorAll('.pf-row-btn.is-disabled').forEach(btn => {
    btn.addEventListener('click', e => e.preventDefault());
  });

})();
