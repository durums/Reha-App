// views/kalender.js

(function () {
  // Tabs umschalten: Kalender 1.0 / Kalender 2.0
  const tabButtons = document.querySelectorAll(".kalender-tab-btn");
  const tabs       = document.querySelectorAll(".kalender-tab");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
      tabs.forEach((t) =>
        t.classList.toggle("active", t.id === "kalender-" + tabName)
      );
    });
  });

  // -------------------------------
  // Kalender 2.0 – Reha-Plan
  // -------------------------------
  const monthLabel   = document.getElementById("kal2-month-label");
  const bodyEl       = document.getElementById("kal2-body");
  const prevBtn      = document.getElementById("kal2-prev-month");
  const nextBtn      = document.getElementById("kal2-next-month");
  const dayTitleEl   = document.getElementById("kal2-day-title");
  const dayEventsEl  = document.getElementById("kal2-day-events");

  if (!monthLabel || !bodyEl) {
    // Kalender 2.0 ist auf dieser View nicht aktiv
    return;
  }

  const REHA_EVENTS = Array.isArray(window.REHA_PLAN_EVENTS)
    ? window.REHA_PLAN_EVENTS
    : [];

  // Startmonat: erster Termin im Rehaplan oder aktueller Monat
  let current = (function () {
    if (REHA_EVENTS.length > 0) {
      const [y, m] = REHA_EVENTS[0].date.split("-").map((x) => parseInt(x, 10));
      return new Date(y, m - 1, 1);
    }
    return new Date();
  })();

  let selectedDateStr = null;

  function formatMonthLabel(date) {
    const Monate = [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];
    return `${Monate[date.getMonth()]} ${date.getFullYear()}`;
  }

  function dateToStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }

  function getEventsForDate(dateStr) {
    return REHA_EVENTS
      .filter((ev) => ev.date === dateStr)
      .sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  }

  function renderDayDetails(dateStr) {
    const evts = getEventsForDate(dateStr);
    const [y, m, d] = dateStr.split("-");
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));

    const Wochentage = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const wd = Wochentage[dateObj.getDay()];
    dayTitleEl.textContent = `${wd} ${d}.${m}.${y}`;

    if (!evts.length) {
      dayEventsEl.classList.add("kal2-events-empty");
      dayEventsEl.innerHTML = "Für diesen Tag sind im Rehaplan keine Termine eingetragen.";
      return;
    }

    dayEventsEl.classList.remove("kal2-events-empty");
    dayEventsEl.innerHTML = "";
    evts.forEach((ev) => {
      const div = document.createElement("div");
      div.className = "kal2-event";

      div.innerHTML = `
        <div class="kal2-event-time">${ev.start || ""} – ${ev.end || ""}</div>
        <div class="kal2-event-title">${ev.title || ""}</div>
        ${
          ev.location
            ? `<div class="kal2-event-location">${ev.location}</div>`
            : ""
        }
      `;
      dayEventsEl.appendChild(div);
    });
  }

  function renderCalendar() {
    monthLabel.textContent = formatMonthLabel(current);
    bodyEl.innerHTML = "";

    const year  = current.getFullYear();
    const month = current.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Montag = 0, ..., Sonntag = 6
    let startWeekday = firstDay.getDay(); // 0=So
    startWeekday = (startWeekday + 6) % 7;

    let day = 1 - startWeekday;

    for (let row = 0; row < 6; row++) {
      const tr = document.createElement("tr");

      for (let col = 0; col < 7; col++, day++) {
        const td = document.createElement("td");
        const cellDiv = document.createElement("div");
        cellDiv.className = "kal2-day";

        const cellDate = new Date(year, month, day);
        const isThisMonth = cellDate.getMonth() === month;

        if (!isThisMonth) {
          cellDiv.classList.add("disabled");
          cellDiv.textContent = cellDate.getDate();
        } else {
          const dateStr = dateToStr(cellDate);
          cellDiv.textContent = cellDate.getDate();

          const hasEvents = getEventsForDate(dateStr).length > 0;
          if (hasEvents) {
            cellDiv.classList.add("has-events");
          }

          if (selectedDateStr === dateStr) {
            cellDiv.classList.add("selected");
          }

          cellDiv.addEventListener("click", () => {
            selectedDateStr = dateStr;
            renderCalendar();          // neu zeichnen, damit Auswahl markiert wird
            renderDayDetails(dateStr); // rechts die Details des Rehaplans anzeigen
          });
        }

        td.appendChild(cellDiv);
        tr.appendChild(td);
      }

      bodyEl.appendChild(tr);
    }
  }

  prevBtn.addEventListener("click", () => {
    current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    renderCalendar();
  });

  nextBtn.addEventListener("click", () => {
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    renderCalendar();
  });

  // Initial: wenn es Reha-Termine gibt, wähle den ersten Tag
  if (REHA_EVENTS.length > 0) {
    selectedDateStr = REHA_EVENTS[0].date;
    renderCalendar();
    renderDayDetails(selectedDateStr);
  } else {
    renderCalendar();
  }
})();
