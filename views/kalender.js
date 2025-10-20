(() => {
  // ---------- Konstanten ----------
  const START = 8, END = 17; // inkl.
  const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

  // ---------- State ----------
  let store = load();                                  // Termine aus localStorage
  let user  = (window.currentUserName || "").toString(); // Name/Email aus Firebase
  let weekStart = mondayOf(new Date());

  // ---------- DOM ----------
  const header     = () => document.getElementById("header");
  const hours      = () => document.getElementById("hours");
  const daysC      = () => document.getElementById("days");
  const rangeLabel = () => document.getElementById("rangeLabel");
  const userPill   = () => document.getElementById("userPill");
  const dialog     = () => document.getElementById("dialog");
  const dlgTitle   = () => document.getElementById("dlgTitle");
  const dlgList    = () => document.getElementById("dlgList");
  const btn        = (id) => document.getElementById(id);

  // ---------- Init ----------
  window.requestAnimationFrame(() => {
    bindOnce();
    render();
  });

  // Optional: falls wir den Usernamen nachträglich ändert
  window.addEventListener("reha-user-refresh", () => {
    user = (window.currentUserName || "").toString();
    render();
  });

  // ---------- Events initialisieren ----------
  function bindOnce() {
    // Navigation
    btn("prevBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart,-7); render(); });
    btn("nextBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart, 7); render(); });
    btn("todayBtn")?.addEventListener("click", () => { weekStart = mondayOf(new Date()); render(); });

    // Aktionen
    btn("bookBtn")?.addEventListener("click", () => pickFreeSlot(bookPicked));
    btn("mineBtn")?.addEventListener("click", showMine);
    btn("moveBtn")?.addEventListener("click", moveOrCancel);
  }

  // ---------- Render ----------
  function render(){
    // Kopf
    header().innerHTML = "";
    header().append(cell("time","Zeit"));
    const ds = [...Array(7)].map((_,i)=> addDays(weekStart,i));
    ds.forEach(d => {
      const lbl = `${DAYS[(d.getDay()+6)%7]} ${d.getDate()}.${d.getMonth()+1}.`;
      header().append(cell("cell", lbl));
    });
    rangeLabel().textContent = `${fmt(ds[0])} – ${fmt(ds[6])}`;

    // Stunden
    hours().innerHTML = "";
    for(let h=START; h<=END; h++){
      hours().append(div("hour", `${pad(h)}:00`));
    }

    // Spalten
    daysC().innerHTML = "";
    const today = new Date();
    ds.forEach(d => {
      const tag = iso(d);
      const col = div("col" + (sameDate(d,today) ? " today" : ""));
      for(let h=START; h<=END; h++){
        const slot = `${pad(h)}:00`;
        const who  = (store[tag]||{})[slot];
        const cls  = who ? (isMe(who) ? "own" : "booked") : "free";
        const el   = div(`slot ${cls}`, who ? (isMe(who) ? "Mein Termin" : "Belegt") : "");
        el.dataset.date = tag;
        el.dataset.slot = slot;
        el.onclick = onSlotClick;
        col.append(el);
      }
      daysC().append(col);
    });

    userPill().textContent = window.currentUserName || ""; // Anzeige oben rechts
  }

  // ---------- Klick-Logik ----------
  function onSlotClick(e){
    const tag  = e.currentTarget.dataset.date;
    const slot = e.currentTarget.dataset.slot;
    const who  = (store[tag]||{})[slot];
    const me   = (window.currentUserName || user || "Gast").toString();

    if(!who){
      if(confirm(`Möchtest du ${tag} um ${slot} buchen?`)){
        book(tag, slot, me);
        alert(`Termin eingetragen: ${tag} ${slot}`);
        render();
      }
      return;
    }

    if(isMe(who)){
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
          if(ntag){ book(ntag,nslot,me); alert(`Termin verschoben auf: ${ntag} ${nslot}`); }
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
    const me = (window.currentUserName || user || "Gast").toString();
    book(tag,slot,me);
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
          const me = (window.currentUserName || user || "Gast").toString();
          pickFreeSlot((ntag,nslot)=>{ if(ntag){ book(ntag,nslot,me); alert(`Termin verschoben auf: ${ntag} ${nslot}`); } render(); });
        } else if(a !== null){ alert("Ungültige Eingabe."); }
      };
      row.append(b);
      dlgList.append(row);
    }
    dialog().showModal();
  }

  // ---------- Speicher ----------
  function load(){ try { return JSON.parse(localStorage.getItem("kal_data")||"{}"); } catch { return {}; } }
  function save(){ localStorage.setItem("kal_data", JSON.stringify(store)); }
  function book(tag,slot,name){ (store[tag] ||= {})[slot] = name; save(); }
  function unbook(tag,slot){
    if(store[tag]){
      delete store[tag][slot];
      if(!Object.keys(store[tag]).length) delete store[tag];
      save();
    }
  }

  // ---------- Helpers ----------
  function isMe(name){ return name === (window.currentUserName || user); }
  function mySlots(){
    const out = [];
    Object.entries(store).forEach(([tag,slots])=>{
      Object.entries(slots).forEach(([slot,name])=>{
        if(isMe(name)) out.push([tag,slot]);
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
