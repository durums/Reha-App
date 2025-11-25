(() => {
  // ===== Konstanten =====
  const START = 8;
  const END   = 17;
  const DAYS  = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

  // ===== State =====
  let store     = loadStore();
  let user      = window.currentUserName || "Gast";
  let weekStart = mondayOf(new Date());

  // ===== DOM Helpers =====
  const $          = (id) => document.getElementById(id);
  const header     = () => $("header");
  const hours      = () => $("hours");
  const daysC      = () => $("days");
  const rangeLabel = () => $("rangeLabel");
  const dlg        = () => $("dialog");
  const dlgTitle   = () => $("dlgTitle");
  const dlgList    = () => $("dlgList");

  // ===== Init =====
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!header() || !hours() || !daysC()) {
      const t = setInterval(() => {
        if (header() && hours() && daysC()) {
          clearInterval(t);
          bindOnce();
          render();
        }
      }, 120);
    } else {
      bindOnce();
      render();
    }
  }

  function bindOnce() {
    $("prevBtn")?.addEventListener("click", () => {
      weekStart = addDays(weekStart, -7);
      render();
    });

    $("nextBtn")?.addEventListener("click", () => {
      weekStart = addDays(weekStart, 7);
      render();
    });

    $("todayBtn")?.addEventListener("click", () => {
      weekStart = mondayOf(new Date());
      render();
    });

    $("bookBtn")?.addEventListener("click", bookViaDialog);
    $("mineBtn")?.addEventListener("click", showMine);
    $("moveBtn")?.addEventListener("click", moveOrCancel);
    $("exportBtn")?.addEventListener("click", exportAllMyEventsICS);

    // PDF-Import
    const pdfBtn   = $("importPdfBtn");
    const pdfInput = $("importPdfInput");
    if (pdfBtn && pdfInput) {
      pdfBtn.addEventListener("click", () => pdfInput.click());
      pdfInput.addEventListener("change", onPdfChosen);
    }

    // CSV-Import
    const csvBtn   = $("importCsvBtn");
    const csvInput = $("importCsvInput");
    if (csvBtn && csvInput) {
      csvBtn.addEventListener("click", () => csvInput.click());
      csvInput.addEventListener("change", onCsvChosen);
    } else {
      console.warn("CSV-Buttons wurden nicht gefunden.");
    }
  }

  // ===== Render =====
  function render() {
    header().innerHTML = "";
    header().append(cell("time", "Zeit"));

    const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
    days.forEach((d) => {
      const label = `${DAYS[(d.getDay()+6)%7]} ${d.getDate()}.${d.getMonth()+1}.`;
      header().append(cell("cell", label));
    });

    rangeLabel().textContent = `${fmt(days[0])} – ${fmt(days[6])}`;

    hours().innerHTML = "";
    for (let h = START; h <= END; h++) {
      hours().append(div("hour", `${pad(h)}:00`));
    }

    daysC().innerHTML = "";
    const today = new Date();

    days.forEach((d) => {
      const tag = iso(d);
      const col = div("col" + (sameDate(d,today) ? " today" : ""));

      for (let h=START; h<=END; h++) {
        const slot = `${pad(h)}:00`;
        const who = (store[tag] || {})[slot];
        const cls = who ? (who===user ? "own" : "booked") : "free";
        const el  = div(`slot ${cls}`, who ? (who===user ? "Mein Termin" : "Belegt") : "");

        el.dataset.date = tag;
        el.dataset.slot = slot;
        el.onclick = onSlotClick;

        col.append(el);
      }
      daysC().append(col);
    });
  }

  // ===== Slot-Klick =====
  function onSlotClick(e) {
    const tag  = e.currentTarget.dataset.date;
    const slot = e.currentTarget.dataset.slot;
    const who  = (store[tag] || {})[slot];

    if (!who) {
      if (!user) return alert("Bitte anmelden, um Termine zu buchen.");
      if (confirm(`Termin buchen: ${tag} um ${slot}?`)) {
        book(tag, slot, user);
        render();
      }
      return;
    }

    if (who === user) {
      const rest = daysBetween(new Date(), new Date(tag));
      if (rest < 3) return alert("Verschieben/Absagen nur 3 Tage vorher möglich.");

      const a = prompt("'v' verschieben, 'a' löschen, 'x' exportieren:");
      if (a==="a") { unbook(tag,slot); render(); }
      else if (a==="v") {
        unbook(tag,slot);
        pickFreeSlot((ntag,nslot)=>{ if(ntag) book(ntag,nslot,user); render(); });
      }
      else if (a==="x") exportSingleEventICS(tag,slot,user);
      return;
    }

    alert("Bereits belegt.");
  }

  // ===== Dialoge =====
  function pickFreeSlot(cb) {
    const list = freeSlotsThisWeek();
    if (!list.length) return alert("Diese Woche keine freien Slots.");

    dlgList().innerHTML="";
    dlgTitle().textContent="Freien Slot wählen";

    list.forEach(([tag,slot])=>{
      const row=div("item");
      row.append(div("",`${tag} ${slot}`));
      const b=document.createElement("button");
      b.textContent="OK";
      b.onclick=()=>{ dlg().close(); cb(tag,slot); };
      row.append(b);
      dlgList().append(row);
    });

    dlg().showModal();
  }

  function bookViaDialog(){
    if (!user) return alert("Bitte anmelden.");
    pickFreeSlot((tag,slot)=>{ book(tag,slot,user); render(); });
  }

  function showMine(){
    const mine = mySlots();
    if (!mine.length) return alert("Keine eigenen Termine.");

    dlgList().innerHTML="";
    dlgTitle().textContent="Eigene Termine";

    mine.forEach(([t,s]) => dlgList().append(div("item", `${t} ${s}`)));
    dlg().showModal();
  }

  function moveOrCancel(){
    const mine=mySlots();
    if (!mine.length) return alert("Keine Termine.");

    dlgList().innerHTML="";
    dlgTitle().textContent="Eigene Termine";

    mine.forEach(([tag,slot])=>{
      const row=div("item");
      row.append(div("",`${tag} ${slot}`));

      const b=document.createElement("button");
      b.textContent="OK";
      b.onclick=()=>{
        dlg().close();
        const rest = daysBetween(new Date(), new Date(tag));
        if (rest<3) return alert("Nur 3 Tage vorher möglich.");

        const a = prompt("'v'=verschieben, 'a'=löschen, 'x'=export:");
        if(a==="a"){ unbook(tag,slot); render(); }
        else if(a==="v"){
          unbook(tag,slot);
          pickFreeSlot((ntag,nslot)=>{ if(ntag) book(ntag,nslot,user); render(); });
        }
        else if(a==="x") exportSingleEventICS(tag,slot,user);
      };
      row.append(b);
      dlgList().append(row);
    });
    dlg().showModal();
  }

  // ===== Speicher =====
  function loadStore(){
    try { return JSON.parse(localStorage.getItem("kal_data")||"{}"); }
    catch { return {}; }
  }
  function saveStore(){ localStorage.setItem("kal_data", JSON.stringify(store)); }

  function book(tag,slot,u){ (store[tag] ||= {})[slot] = u; saveStore(); }
  function unbook(tag,slot){
    if(store[tag]){
      delete store[tag][slot];
      if(!Object.keys(store[tag]).length) delete store[tag];
      saveStore();
    }
  }

  function mySlots(){
    const out=[];
    Object.entries(store).forEach(([tag,slots])=>{
      Object.entries(slots).forEach(([slot,name])=>{
        if(name===user) out.push([tag,slot]);
      });
    });
    return out.sort();
  }

  function freeSlotsThisWeek(){
    const out=[];
    for(let i=0;i<7;i++){
      const d=addDays(weekStart,i), tag=iso(d);
      for(let h=START;h<=END;h++){
        const slot=`${pad(h)}:00`;
        if(!store[tag] || !store[tag][slot]) out.push([tag,slot]);
      }
    }
    return out;
  }

  // ===== ICS =====
  function exportAllMyEventsICS(){
    const mine=mySlots();
    if(!mine.length) return alert("Keine Termine.");

    const events=mine.map(([t,s])=>buildICSEvent(t,s,user));
    const ics="BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"+events.join("")+"END:VCALENDAR\r\n";
    downloadICS("termine.ics",ics);
  }

  function exportSingleEventICS(tag,slot,u){
    const ics="BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"+
      buildICSEvent(tag,slot,u)+"END:VCALENDAR\r\n";
    downloadICS(`termin_${tag}_${slot}.ics`,ics);
  }

  function buildICSEvent(tag,slot,u){
    const start=new Date(`${tag}T${slot}:00`);
    const end=new Date(start.getTime()+3600000);
    return (
      "BEGIN:VEVENT\r\n"+
      `UID:${tag}-${slot}@kal\r\n`+
      `DTSTAMP:${formatICSDate(new Date())}\r\n`+
      `DTSTART:${formatICSDate(start)}\r\n`+
      `DTEND:${formatICSDate(end)}\r\n`+
      `SUMMARY:Termin (${slot})\r\n`+
      "END:VEVENT\r\n"
    );
  }

  function formatICSDate(d){
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  }

  function downloadICS(name,data){
    const blob=new Blob([data],{type:"text/calendar"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=name;
    document.body.appendChild(a);
    a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // ===== PDF Import =====
  async function onPdfChosen(evt){
    const file=evt.target.files?.[0];
    if(!file) return;

    try{
      const buf=await file.arrayBuffer();
      const termine=await parsePdfToAppointments(buf);
      termine.forEach(addAppointmentToCalendar);
      render();
      alert(`${termine.length} PDF-Termine importiert.`);
    }
    catch(e){ alert("PDF konnte nicht gelesen werden."); }
    evt.target.value="";
  }

  async function parsePdfToAppointments(arrayBuffer){
    if(!window.pdfjsLib) return [];

    const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise;
    let full="";

    for(let p=1;p<=pdf.numPages;p++){
      const page=await pdf.getPage(p);
      const txt=await page.getTextContent();
      full+=txt.items.map(i=>i.str).join(" ")+"\n";
    }

    full=full
      .replace(/(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\s+(\d{2}\.\d{2}\.\d{4})/g,"\n$1 $2")
      .replace(/(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/g,"\n$1");

    const lines=full.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);

    const reDate=/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\s+(\d{2}\.\d{2}\.\d{4})/;
    const reAppt=/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s+(.+)$/;

    let current=null;
    const out=[];

    for(const line of lines){
      const mDate=line.match(reDate);
      if(mDate){
        current=deDateToIso(mDate[2]);
        continue;
      }

      const m=line.match(reAppt);
      if(m && current){
        const [_,s,e,title]=m;
        const start=new Date(`${current}T${s}:00`);
        const end  =new Date(`${current}T${e}:00`);
        out.push({title,start,end});
      }
    }
    return out;
  }

  function deDateToIso(ddmmyyyy){
    const [dd,mm,yyyy]=ddmmyyyy.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }

  function addAppointmentToCalendar(appt){
    let hour=appt.start.getHours();
    const min=appt.start.getMinutes();
    if(min>=30 && hour<END) hour++;

    if(hour<START || hour>END) return;

    const tag=iso(appt.start);
    const slot=`${pad(hour)}:00`;
    if(store[tag]?.[slot]) return;

    book(tag,slot,user);
  }

  // ===== CSV Import =====
  async function onCsvChosen(evt){
    const file=evt.target.files?.[0];
    if(!file) return;

    try{
      const text = await file.text();
      const termine = parseCsvAppointments(text);
      termine.forEach(addCsvAppointmentToCalendar);
      render();
      alert(`${termine.length} CSV-Termine importiert.`);
    }
    catch(e){ alert("CSV konnte nicht gelesen werden."); }
    evt.target.value="";
  }

  function parseCsvAppointments(text){
    const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const out=[];

    for(let i=1;i<lines.length;i++){
      const line=lines[i];
      const parts=line.split(",");
      if(parts.length<3) continue;

      const datum=parts[0];
      const zeit =parts[1];
      const beschr=parts.slice(2).join(",");

      const isoDate=deDateToIso(datum);
      const start=new Date(`${isoDate}T${zeit}:00`);

      out.push({title:beschr,start});
    }
    return out;
  }

  function addCsvAppointmentToCalendar(appt){
    let hour=appt.start.getHours();
    const min=appt.start.getMinutes();
    if(min>=30 && hour<END) hour++;

    if(hour<START||hour>END) return;

    const tag=iso(appt.start);
    const slot=`${pad(hour)}:00`;

    if(store[tag]?.[slot]) return;

    book(tag,slot,user);
  }

  // ===== Utils =====
  function mondayOf(d){ const x=new Date(d); const wd=(x.getDay()+6)%7; x.setDate(x.getDate()-wd); x.setHours(0,0,0,0); return x; }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function iso(d){ return d.toISOString().slice(0,10); }
  function pad(n){ return String(n).padStart(2,"0"); }
  function sameDate(a,b){ return a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear(); }
  function fmt(d){ return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`; }
  function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
  function div(c,t=""){ const n=document.createElement("div"); n.className=c; n.textContent=t; return n; }
  function cell(c,t){ const n=document.createElement("div"); n.className=c==="time"?"cell time":"cell"; n.textContent=t; return n; }

})();
