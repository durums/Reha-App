(() => {
  const START = 8, END = 17;
  const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

  let store = load();
  let user = window.currentUserName || "Gast";
  let weekStart = mondayOf(new Date());

  const header = () => document.getElementById("header");
  const hours = () => document.getElementById("hours");
  const daysC = () => document.getElementById("days");
  const rangeLabel = () => document.getElementById("rangeLabel");
  const userPill = () => document.getElementById("userPill");
  const dialog = () => document.getElementById("dialog");
  const dlgTitle = () => document.getElementById("dlgTitle");
  const dlgList = () => document.getElementById("dlgList");
  const btn = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", () => {
    const checkInterval = setInterval(() => {
      if (document.getElementById("header")) {
        clearInterval(checkInterval);
        bindOnce();
        setTimeout(() => render(), 300);
      }
    }, 100);
  });

  function bindOnce() {
    btn("prevBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart,-7); render(); });
    btn("nextBtn")?.addEventListener("click", () => { weekStart = addDays(weekStart, 7); render(); });
    btn("todayBtn")?.addEventListener("click", () => { weekStart = mondayOf(new Date()); render(); });
    btn("bookBtn")?.addEventListener("click", () => pickFreeSlot(bookPicked));
    btn("mineBtn")?.addEventListener("click", showMine);
    btn("moveBtn")?.addEventListener("click", moveOrCancel);
    btn("exportBtn")?.addEventListener("click", exportAllICS);
  }

  function render(){
    header().innerHTML = "";
    header().append(cell("time","Zeit"));
    const ds = [...Array(7)].map((_,i)=> addDays(weekStart,i));
    ds.forEach(d => {
      const lbl = `${DAYS[(d.getDay()+6)%7]} ${d.getDate()}.${d.getMonth()+1}.`;
      header().append(cell("cell", lbl));
    });
    rangeLabel().textContent = `${fmt(ds[0])} – ${fmt(ds[6])}`;

    hours().innerHTML = "";
    for(let h=START; h<=END; h++){
      hours().append(div("hour", `${pad(h)}:00`));
    }

    daysC().innerHTML = "";
    const today = new Date();
    ds.forEach(d => {
      const tag = iso(d);
      const col = div("col" + (sameDate(d,today) ? " today" : ""));
      for(let h=START; h<=END; h++){
        const slot = `${pad(h)}:00`;
        const who = (store[tag]||{})[slot];
        const cls = who ? (who===user ? "own" : "booked") : "free";
        const el = div(`slot ${cls}`, who ? (who===user ? "Mein Termin" : "Belegt") : "");
        el.dataset.date = tag;
        el.dataset.slot = slot;
        el.onclick = onSlotClick;
        col.append(el);
      }
      daysC().append(col);
    });

    userPill().textContent = user || "Gast";
  }

  function onSlotClick(e){
    const tag = e.currentTarget.dataset.date;
    const slot = e.currentTarget.dataset.slot;
    const who = (store[tag]||{})[slot];

    if(!who){
      if(!user) return alert("Bitte anmelden, um Termine zu buchen.");
      if(confirm(`Möchtest du ${tag} um ${slot} buchen?`)){
        book(tag, slot, user);
        alert(`Termin eingetragen: ${tag} ${slot}`);
        render();

        // 🗓️ Nach Buchung export anbieten
        if (confirm("Möchtest du diesen Termin in deinen Kalender exportieren?")) {
          exportSingleICS(tag, slot);
        }
      }
      return;
    }

    if(who === user){
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
          if(ntag){ book(ntag,nslot,user); alert(`Termin verschoben auf: ${ntag} ${nslot}`); }
          render();
        });
      } else if (a !== null) {
        alert("Ungültige Eingabe.");
      }
      return;
    }

    alert("Dieser Slot ist bereits belegt.");
  }

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
    book(tag,slot,user);
    alert(`Termin eingetragen: ${tag} ${slot}`);
    render();
    if (confirm("Möchtest du diesen Termin in deinen Kalender exportieren?")) {
      exportSingleICS(tag, slot);
    }
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
          pickFreeSlot((ntag,nslot)=>{ if(ntag){ book(ntag,nslot,user); alert(`Termin verschoben auf: ${ntag} ${nslot}`); } render(); });
        } else if(a !== null){ alert("Ungültige Eingabe."); }
      };
      row.append(b);
      dlgList().append(row);
    }
    dialog().showModal();
  }

  // --- ICS Export Funktionen ---
  function exportSingleICS(tag, slot){
    const start = new Date(`${tag}T${slot}`);
    const end = new Date(start.getTime() + 60*60*1000);
    const ics = buildICS([{ tag, slot, title: "Reha-Termin", start, end }]);
    downloadICS(ics, `termin_${tag}_${slot}.ics`);
  }

  function exportAllICS(){
    const mine = mySlots();
    if(mine.length===0){ alert("Keine eigenen Termine gefunden."); return; }
    const events = mine.map(([tag,slot])=>{
      const start = new Date(`${tag}T${slot}`);
      const end = new Date(start.getTime()+60*60*1000);
      return { tag, slot, title:"Reha-Termin", start, end };
    });
    const ics = buildICS(events);
    downloadICS(ics, "meine_reha_termine.ics");
  }

  function buildICS(events){
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Reha-App//Kalender Export//DE"
    ];
    for(const ev of events){
      const startStr = ev.start.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
      const endStr   = ev.end.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
      lines.push(
        "BEGIN:VEVENT",
        `UID:${ev.tag}-${ev.slot}@rehaapp`,
        `DTSTAMP:${startStr}`,
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:${ev.title}`,
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function downloadICS(content, filename){
    const blob = new Blob([content], {type:"text/calendar"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Helper-Funktionen ---
  function load(){ try { return JSON.parse(localStorage.getItem("kal_data")||"{}"); } catch { return {}; } }
  function save(){ localStorage.setItem("kal_data", JSON.stringify(store)); }
  function book(tag,slot,name){ if(!store[tag]) store[tag] = {}; store[tag][slot] = name; save(); }
  function unbook(tag,slot){ if(store[tag]){ delete store[tag][slot]; if(Object.keys(store[tag]).length===0) delete store[tag]; save(); } }
  function mySlots(){ const out=[]; Object.entries(store).forEach(([tag,slots])=>Object.entries(slots).forEach(([slot,name])=>{ if(name===user) out.push([tag,slot]); })); return out; }
  function freeSlotsThisWeek(){ const out=[]; for(let i=0;i<7;i++){ const d=addDays(weekStart,i), tag=iso(d); for(let h=START; h<=END; h++){ const slot=`${pad(h)}:00`; if(!store[tag] || !store[tag][slot]) out.push([tag,slot]); } } return out; }
  function mondayOf(d){ const x=new Date(d); const wd=(x.getDay()+6)%7; x.setDate(x.getDate()-wd); x.setHours(0,0,0,0); return x; }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function iso(d){ return d.toISOString().slice(0,10); }
  function pad(n){ return String(n).padStart(2,"0"); }
  function sameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function fmt(d){ return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`; }
  function daysBetween(a,b){ const A=new Date(a.getFullYear(),a.getMonth(),a.getDate()); const B=new Date(b.getFullYear(),b.getMonth(),b.getDate()); return Math.round((B-A)/(1000*60*60*24)); }
  function div(cls,txt=""){ const n=document.createElement("div"); if(cls) n.className=cls; if(txt) n.textContent=txt; return n; }
  function cell(cls,txt){ const n=document.createElement("div"); n.className = cls==="time" ? "cell time" : "cell"; n.textContent=txt; return n; }
})();
