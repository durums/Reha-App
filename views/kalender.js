// views/kalender.js
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const START_HOUR = 8;
  const END_HOUR = 17;
  const today = new Date();
  let weekStart = getMonday(today);

  function getMonday(d) {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Montag=0
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - day);
    return x;
  }

  $("#userPill").textContent = window.currentUserName || "Angemeldet";

  $("#prevBtn").addEventListener("click", () => {
    weekStart.setDate(weekStart.getDate() - 7);
    render();
  });
  $("#nextBtn").addEventListener("click", () => {
    weekStart.setDate(weekStart.getDate() + 7);
    render();
  });
  $("#todayBtn").addEventListener("click", () => {
    weekStart = getMonday(new Date());
    render();
  });

  function render() {
    renderHeader();
    renderHours();
    renderDays();
    renderRangeLabel();
  }

  function fmt(d, opts) {
    return d.toLocaleDateString("de-DE", opts);
  }

  function renderHeader() {
    const header = $("#header");
    header.innerHTML = "";

    const timeCell = document.createElement("div");
    timeCell.className = "cell time";
    header.appendChild(timeCell);

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const c = document.createElement("div");
      c.className = "cell";
      c.innerHTML = `<strong>${fmt(d, { weekday: "short" })}</strong> ${fmt(d, {
        day: "2-digit",
        month: "2-digit",
      })}`;
      header.appendChild(c);
    }
  }

  function renderHours() {
    const hours = $("#hours");
    hours.innerHTML = "";
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const el = document.createElement("div");
      el.className = "hour";
      el.textContent = `${String(h).padStart(2, "0")}:00`;
      hours.appendChild(el);
    }
  }

  function renderDays() {
    const days = $("#days");
    days.innerHTML = "";
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);

      const col = document.createElement("div");
      col.className = "col" + (isSameDay(d, now) ? " today" : "");
      col.dataset.date = d.toISOString().slice(0, 10);

      for (let h = START_HOUR; h <= END_HOUR; h++) {
        const slot = document.createElement("div");
        slot.className = "slot free";
        col.appendChild(slot);
      }

      days.appendChild(col);
    }
  }

  function renderRangeLabel() {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    $("#rangeLabel").textContent =
      `${fmt(start, { day: "2-digit", month: "2-digit" })} – ` +
      `${fmt(end, { day: "2-digit", month: "2-digit", year: "numeric" })}`;
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  render();
});
