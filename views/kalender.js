(() => {
  // ---------- Konstanten ----------
  const START = 8, END = 17;
  const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
  const STORAGE_KEY = "kal_data";

  // ---------- User (vom Host / index.html gesetzt) ----------
  const userId   = window.currentUserId   || "guest";
  const userName = window.currentUserName || "Gast";

  // ---------- State ----------
  let store = load();
  let weekStart = mondayOf(new Date());

  // ---------- DOM Shortcuts ----------
  const el         = (id) => document.getElementById(id);
  const header     = () => el("header");
  const hours      = () => el("hours");
  const daysC      = () => el("days");
  const rangeLabel = () => el("rangeLabel");
  const userPill   = () => el("userPill");
  const dialog     = () => el("dialog");
  const dlgTitle   = () => el("dlgTitle");
  const dlgList    = () => el("dlgList");
  const btn        = (id) => el(id);

  // ---------- ROBUSTER INIT (für dynamische Views) ----------
  function initCalendar() {
    const ok = header() && hours() && daysC();
    if (!ok) {
      const t = setInterval(() => {
        if (header() && hours() && daysC()) {
          clearInterval(t);
          bindOnce();
          setTimeout(render, 50);
        }
      }, 50);
      return;
    }
    bindOnce();
    setTimeout(render, 50);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalendar);
  } else {
    initCalendar();
  }

  // ---------- Events ----------
  function bindOnce() {
    btn("prevBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart,-7); render(); });
    btn("nextBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart, 7); render(); });
    btn("todayBtn")?.addEventListener("click", () => { weekStart = mondayOf(new Date()); render(); });

    btn("bookBtn")?.addEventListener("click", () => pickFreeSlot(bookPicked));
    btn("mineBtn")?.addEventListener("click", showMine);
    btn("moveBtn")?.addEventListener("click", moveOrCancel);
  }

  // ---------- Render ----------
  function render(){
    // Kopf (Wochentage)
    header().innerHTML = "";
    header().append(cell("time","Zeit"));
    const ds = [...Array(7)].map((_,i)=> addDays(weekStart,i));
    ds.forEach(d => {
      const lbl = `${DAYS[(d.getDay()+6)%7]} ${d.getDate()}.${d.getMonth()+1}.`;
      header().append(cell("cell", lbl));
    });
    if (rangeLabel()) rangeLabel().textContent = `${fmt(ds[0])} – ${fmt(ds[6])}`;

    // Stunden links
    hours().innerHTML = "";
    for(let h=START; h<=END; h++){
      hours().append(div("hour", `${pad(h)}:00`));
    }

    // Tages-Spalten
    daysC().innerHTML = "";
    const today = new Date();
    ds.forEach(d => {
      const tag = iso(d);
      const col = div("col" + (sameDate(d,today) ? " today" : ""));
      for(let h=START; h<=END; h++){
        const slot = `${pad(h)}:00`;
        const who = (store[tag]||{})[slot];

        // Abwärtskompatibilität: who kann String ODER Objekt {uid,name} sein
        const whoName = typeof who === "string" ? who : who?.name;
        const whoUid  = typeof who === "string" ? null : who?.uid;
        const isMine  = whoUid ? (whoUid === userId) : (whoName === userName);

        const cls = who ? (isMine ? "own" : "booked") : "free";
        const el  = div(`slot ${cls}`, who ? (isMine ? "Mein Termin" : "Belegt") : "");
        el.dataset.date = tag;
        el.dataset.slot = slot;
        el.onclick = onSlotClick;
        col.append(el);
      }
      daysC().append(col);
    });

    if (userPill()) userPill().textContent = userName || "Gast";
  }

  // ---------- Klick-Logik ----------
  function onSlotClick(e){
    const tag = e.currentTarget.dataset.date;
    const slot = e.currentTarget.dataset.slot;
    const who = (store[tag]||{})[slot];

    if(!who){
      if(confirm(`Möchtest du ${tag} um ${slot} buchen?`)){
        book(tag, slot);
        alert(`Termin eingetragen: ${tag} ${slot}`);
        render();
      }
      return;
    }

    // Abwärtskompatibel prüfen, ob eigener Termin
    const whoName = typeof who === "string" ? who : who?.name;
    const whoUid  = typeof who === "string" ? null : who?.uid;
    const isMine  = whoUid ? (whoUid === userId) : (whoName === userName);

    if(isMine){
      const rest = daysBetween(new Date(), new Date(tag));
      if(rest < 3){ alert("Verschieben/Absagen nur 3 Tage vor dem Termin möglich."); return; }
      const a = prompt("Eigener Termin: Tippe 'v' zum Verschieben, 'a' zum Absagen:");
      if(a === "a"){
        unbook(tag, slot);
        alert("Termin abgesagt.");
        render();
      } else if (a === "v"){
        unbook(tag, slot);
        pickFreeSlot((ntag,nslot)=>{
          if(ntag){ book(ntag,nslot); alert(`Termin verschoben auf: ${ntag} ${nslot}`); }
          else { alert("Verschieben abgebrochen. Alter Termin wurde entfernt."); }
          render();
        });
      } else if (a !== null) {
        alert("Ungültige Eingabe.");
      }
      return;
    }

    alert("Dieser Slot ist bereits belegt.");
  }

  // ---------- Dialoge ----------
  function pickFreeSlot(cb){
    const items = freeSlotsThisWeek();
    if(items.length===0){ alert("Keine freien Termine verfügbar (diese Woche)."); return; }
    dlgTitle().textContent = "Freien Termin auswählen";
    dlgList().innerHTML = "";
    for(const [tag,slot] of items){
      const row = div("item");
      row.append(div("", `${tag} ${slot}`));
      const b = document.createElement("button");
      b.textContent = "Auswählen";
      b.onclick = () => { dialog().close(); cb(tag,slot); };
      row.append(b);
      dlgList().append(row);
    }
    dialog().showModal();
  }

  function bookPicked(tag,slot){
    book(tag,slot);
    alert(`Termin eingetragen: ${tag} ${slot}`);
    render();
  }

  function showMine(){
    const mine = mySlots();
    if(mine.length===0){ alert("Keine Termine gefunden."); return; }
    alert(mine.map(([t,s])=>`${t} ${s}`).join("\n"));
  }

  function moveOrCancel(){
    const mine = mySlots();
    if(mine.length===0){ alert("Keine Termine gefunden."); return; }
    dlgTitle().textContent = "Eigene Termine";
    dlgList().innerHTML = "";
    for(const [tag,slot] of mine){
      const row = div("item");
      row.append(div("", `${tag} ${slot}`));
      const b = document.createElement("button");
      b.textContent = "Wählen";
      b.onclick = () => {
        dialog().close();
        const rest = daysBetween(new Date(), new Date(tag));
        if(rest < 3){ alert("Verschieben/Absagen nur 3 Tage vor dem Termin möglich."); return; }
        const a = prompt("Tippe 'v' um zu verschieben, 'a' um abzusagen:");
        if(a === "a"){ unbook(tag,slot); alert("Termin abgesagt."); render(); }
        else if(a === "v"){
          unbook(tag,slot);
          pickFreeSlot((ntag,nslot)=>{ if(ntag){ book(ntag,nslot); alert(`Termin verschoben auf: ${ntag} ${nslot}`); } render(); });
        } else if(a !== null){ alert("Ungültige Eingabe."); }
      };
      row.append(b);
      dlgList().append(row);
    }
    dialog().showModal();
  }

  // ---------- Speicher ----------
  function load(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"); } catch { return {}; } }
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }

  function book(tag,slot){
    if(!store[tag]) store[tag] = {};
    store[tag][slot] = { uid: userId, name: userName }; // NEU: objekt statt string
    save();
  }
  function unbook(tag,slot){
    if(store[tag]){
      delete store[tag][slot];
      if(Object.keys(store[tag]).length===0) delete store[tag];
      save();
    }
  }

  // ---------- Helpers ----------
  function mySlots(){
    const out = [];
    Object.entries(store).forEach(([tag,slots])=>{
      Object.entries(slots).forEach(([slot,who])=>{
        const uid = typeof who === "string" ? null : who?.uid;
        const nm  = typeof who === "string" ? who : who?.name;
        if (uid ? (uid === userId) : (nm === userName)) out.push([tag,slot]);
      });
    });
    out.sort((a,b)=> a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
    return out;
  }

  function freeSlotsThisWeek(){
    const out = [];
    for(let i=0;i<7;i++){
      const d = addDays(weekStart,i), tag = iso(d);
      for(let h=START; h<=END; h++){
        const slot = `${pad(h)}:00`;
        if(!store[tag] || !store[tag][slot]) out.push([tag,slot]);
      }
    }
    return out;
  }

  function mondayOf(d){ const x = new Date(d); const wd = (x.getDay()+6)%7; x.setDate(x.getDate()-wd); x.setHours(0,0,0,0); return x; }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function iso(d){ return d.toISOString().slice(0,10); }
  function pad(n){ return String(n).padStart(2,"0"); }
  function sameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function fmt(d){ return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`; }
  function daysBetween(a,b){ const A=new Date(a.getFullYear(),a.getMonth(),a.getDate()); const B=new Date(b.getFullYear(),b.getMonth(),b.getDate()); return Math.round((B-A)/(1000*60*60*24)); }
  function div(cls,txt=""){ const n=document.createElement("div"); if(cls) n.className=cls; if(txt) n.textContent=txt; return n; }
  function cell(cls,txt){ const n=document.createElement("div"); n.className = cls==="time" ? "cell time" : "cell"; n.textContent=txt; return n; }
})();
