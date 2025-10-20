(async function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  // ---------- Datenquelle ----------
  const useFirestore = false; // <- auf true setzen, wenn du Firestore nutzen willst
  const auth = window.auth, db = window.db;

  // Demo-Daten (ersetzen bei Firestore)
  let activities = [
    // {title, date: ISO, durationMin, area}
    { title:"Schulterkreisen",   date:new Date(),                 durationMin:5,  area:"oberkoerper" },
    { title:"Nackendehnungen",   date:new Date(Date.now()-5*60e3),durationMin:8,  area:"oberkoerper" },
    { title:"Knie-Beugungen",    date:new Date(Date.now()-24*60*60e3+ 60*60e3), durationMin:12, area:"unterkoerper" },
    { title:"Rückenstreckung",   date:new Date(Date.now()-24*60*60e3+ 90*60e3), durationMin:10, area:"rumpf" },
    { title:"Beckenlift",        date:new Date(Date.now()-2*24*60*60e3), durationMin:8,  area:"rumpf" },
  ];
  const weeklyTarget = 15;     // Ziel-Übungen/Woche
  const programTotal  = 100;   // fiktive Gesamteinheiten

  if(useFirestore){
    if(!auth?.currentUser){ return; }
    const { collection, query, where, orderBy, limit, getDocs, doc, getDoc } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    // Aktivitäten (z. B. letzte 30)
    const q = query(
      collection(db, "users", auth.currentUser.uid, "activities"),
      orderBy("date","desc"),
      limit(30)
    );
    const snap = await getDocs(q);
    activities = snap.docs.map(d=>({
      title: d.data().title,
      date:  d.data().date?.toDate?.() ?? new Date(d.data().date),
      durationMin: d.data().durationMin ?? 0,
      area: d.data().area || ""
    }));

    // Zielwerte optional aus Profil
    const prof = await getDoc(doc(db,"profiles",auth.currentUser.uid));
    if(prof.exists()){
      const p = prof.data();
      if(typeof p.weeklyTarget === "number") window.__weeklyTarget = p.weeklyTarget;
      if(typeof p.programTotal  === "number") window.__programTotal  = p.programTotal;
    }
  }

  // ---------- Berechnungen ----------
  const startOfWeek = (()=>{ const d=new Date(); const day=(d.getDay()+6)%7; d.setHours(0,0,0,0); d.setDate(d.getDate()-day); return d; })();
  const endOfWeek   = (()=>{ const d=new Date(startOfWeek); d.setDate(d.getDate()+7); return d; })();

  const inWeek = activities.filter(a => a.date>=startOfWeek && a.date<endOfWeek);
  const weekDone = inWeek.length;
  const weekTarget = window.__weeklyTarget ?? weeklyTarget;

  const daysActive = new Set(inWeek.map(a => (new Date(a.date)).toDateString())).size;

  const totalDone  = activities.length; // Demo: einfach Anzahl; ersetze durch kumulative Programm-Logik
  const totalPct   = Math.min(100, Math.round((totalDone / (window.__programTotal ?? programTotal)) * 100));

  const achievements = [
    weekDone >= 3, weekDone >= 7, totalDone >= 20, daysActive >= 5
  ].filter(Boolean).length;

  // ---------- Render KPIs ----------
  $("#kpi-week-done").textContent = weekDone;
  $("#kpi-week-target").textContent = weekTarget;
  $("#bar-week").style.width = Math.min(100, Math.round(weekDone / Math.max(1,weekTarget) * 100)) + "%";

  $("#kpi-days-active").textContent = daysActive;
  $("#bar-days").style.width = Math.min(100, Math.round(daysActive/7*100)) + "%";

  $("#kpi-total-pct").textContent = totalPct + "%";
  $("#bar-total").style.width = totalPct + "%";

  $("#kpi-achievements").textContent = achievements;
  $("#bar-achv").style.width = Math.min(100, achievements/8*100) + "%";

  // ---------- Render Aktivitäten ----------
  const list = $("#fp-activities");
  const fmtDate = (d)=>{
    const now = new Date(); const today = now.toDateString();
    const ds = d.toDateString();
    if(ds===today) return `Heute, ${d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`;
    const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
    if(ds===yesterday.toDateString()) return `Gestern, ${d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`;
    return d.toLocaleDateString('de-DE',{weekday:'short', day:'2-digit', month:'2-digit'}) + ", " +
           d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  };

  list.innerHTML = activities
    .sort((a,b)=>b.date-a.date)
    .slice(0,20)
    .map(a=>`
      <div class="fp-row">
        <div class="fp-left">
          <div class="fp-title">${a.title}</div>
          <div class="fp-sub">${fmtDate(new Date(a.date))}</div>
        </div>
        <div class="fp-duration">${a.durationMin} Min</div>
      </div>
    `).join("");

})();
