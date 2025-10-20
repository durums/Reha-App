// views/kalender.js
(function () {
  const $ = id => document.getElementById(id);

  // === State: aktuelle Woche (Montag) ===
  const today = new Date();
  let weekStart = startOfWeek(today); // Montag

  function startOfWeek(d){
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Mo=0
    x.setHours(0,0,0,0);
    x.setDate(x.getDate() - day);
    return x;
  }

  // === UI: Buttons / User ===
  $("#userPill").textContent = (window.currentUserName || "Angemeldet");

  $("#prevBtn").addEventListener("click", () => { weekStart.setDate(weekStart.getDate() - 7); render(); });
  $("#nextBtn").addEventListener("click", () => { weekStart.setDate(weekStart.getDate() + 7); render(); });
  $("#todayBtn").addEventListener("click", () => { weekStart = startOfWeek(new Date()); render(); });

  // === Render ===
  function render() {
    renderHeader();
    renderHours();
    renderDays();
    renderRangeLabel();
  }

  function fmtDate(d, opts){ return d.toLocaleDateString("de-DE", opts); }

  function renderHeader(){
    const header = $("#header");
    header.innerHTML = "";
    // linke Zeit-Spalte
    const timeCell = document.createElement("div");
    timeCell.className = "cell time";
    timeCell.textContent = ""; // leer
    header.appendChild(timeCell);

    // 7 Tage
    for (let i=0;i<7;i++){
      const d = new Date(weekStart); d.setDate(weekStart.getDate()+i);
      const cell = document.createElement("div");
      cell.className = "cell";
      const wd = fmtDate(d, { weekday:"short" });
      const dm = fmtDate(d, { day:"2-digit", month:"2-digit" });
      cell.innerHTML = `<strong>${wd}</strong> ${dm}`;
      header.appendChild(cell);
    }
  }

  function renderHours(){
    const hours = $("#hours");
    hours.innerHTML = "";
    for (let h=0; h<24; h++){
      const row = document.createElement("div");
      row.className = "hour";
      row.textContent = String(h).padStart(2,"0")+":00";
      hours.appendChild(row);
    }
  }

  function renderDays(){
    const days = $("#days");
    days.innerHTML = "";

    const now = new Date();
    const isSameDay = (a,b)=> a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

    for (let i=0;i<7;i++){
      const d = new Date(weekStart); d.setDate(weekStart.getDate()+i);

      const col = document.createElement("div");
      col.className = "col" + (isSameDay(d, now) ? " today" : "");
      col.dataset.date = d.toISOString().slice(0,10);

      // 24 Slots pro Tag
      for (let h=0; h<24; h++){
        const slot = document.createElement("div");
        slot.className = "slot free";
        slot.dataset.iso = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h).toISOString();
        slot.textContent = ""; // optional: „frei“
        col.appendChild(slot);
      }
      days.appendChild(col);
    }
  }

  function renderRangeLabel(){
    const start = new Date(weekStart);
    const end   = new Date(weekStart); end.setDate(end.getDate()+6);
    const label =
      `${fmtDate(start,{weekday:"short", day:"2-digit", month:"2-digit"})} – ` +
      `${fmtDate(end,  {weekday:"short", day:"2-digit", month:"2-digit", year:"numeric"})}`;
    $("#rangeLabel").textContent = label;
  }

  // initial
  render();
})();
