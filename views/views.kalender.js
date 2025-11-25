// views/kalender.js

(function () {
  // Tabs umschalten: Kalender 1.0 / Kalender 2.0
  const tabButtons = document.querySelectorAll(".kalender-tab-btn");
  const tabs       = document.querySelectorAll(".kalender-tab");

  function activateTab(tabName) {
    tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    tabs.forEach((t) => {
      t.classList.toggle("active", t.id === "kalender-" + tabName);
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      activateTab(tabName);
    });
  });

  // von loadView gesetzter Default-Tab: "basic" oder "reha"
  const defaultTab = window.DEFAULT_KALENDER_TAB || "basic";
  activateTab(defaultTab);

  // -------------------------------
  // Kalender 2.0 – Reha-Plan
  // -------------------------------
  const monthLabel   = document.getElementById("kal2-month-label");
  const bodyEl       = document.getElementById("kal2-body");
  const dayTitleEl   = document.getElementById("kal2-day-title");
  const dayEventsEl  = document.getElementById("kal2-day-events");

  const prevBtn      = document.getElementById("kal2-prev-month");
  const nextBtn      = document.getElementById("kal2-next-month");

  const layoutEl      = document.querySelector(".kalender2-layout");
  const listContainer = document.getElementById("kalender-reha-list");
  const listEl        = document.getElementById("kal2-pdf-list");

  // Daten aus schedule-data.js
  const REHA_EVENTS = Array.isArray(window.REHA_PLAN_EVENTS)
    ? window.REHA_PLAN_EVENTS
    : [];

  // Bullet-Liste (Kalender 2.0 Listenmodus)
  function renderPdfBulletList() {
    if (!listEl) return;

    listEl.innerHTML = "";

    if (!REHA_EVENTS.length) {
      const li = document.createElement("li");
      li.textContent = "Keine Reha-Termine aus dem Plan gefunden.";
      listEl.appendChild(li);
      return;
    }

    const sorted = [...REHA_EVENTS].sort((a, b) => {
      const da = (a.date || "").localeCompare(b.date || "");
      if (da !== 0) return da;
      return (a.start || "").localeCompare(b.start || "");
    });

    sorted.forEach((ev) => {
      const li = document.createElement("li");

      let dateLabel = ev.date || "";
      if (ev.date && /^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
        const [y, m, d] = ev.date.split("-");
        dateLabel = `${d}.${m}.${y}`;
      }

      const parts = [];

      if (dateLabel) {
        parts.push(`<span class="kal2-list-date">${dateLabel}</span>`);
      }

      const timePart = [ev.start, ev.end].filter(Boolean).join("–");
      if (timePart) {
        parts.push(`<span class="kal2-list-time">${timePart}</span>`);
      }

      if (ev.title) {
        parts.push(`<span class="kal2-list-title">${ev.title}</span>`);
      }

      if (ev.location) {
        parts.push(
          `<span class="kal2-list-location">(${ev.location})</span>`
        );
      }

      li.innerHTML = parts.join(" ");
      listEl.appendChild(li);
    });
  }

  // 👉 prüfen, ob wir im "Listenmodus" sind (Kalender 2.0 in der Sidebar)
  const isListMode = window.KALENDER2_MODE === "list";

  if (isListMode) {
    if (layoutEl) layoutEl.style.display = "none";
    if (listContainer) listContainer.style.display = "block";
    renderPdfBulletList();
    return; // kein Monatskalender in diesem Modus
  } else {
    if (listContainer) listContainer.style.display = "none";
    if (layoutEl) layoutEl.style.display = ""; // normales Layout
  }

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
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function getEventsForDate(dateStr) {
    return REHA_EVENTS.filter(ev => ev.date === dateStr);
  }

  function renderDayDetails(dateStr) {
    const events = getEventsForDate(dateStr);
    selectedDateStr = dateStr;

    if (!dayTitleEl || !dayEventsEl) return;

    // Datum nett darstellen
    let label = dateStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-");
      label = `${d}.${m}.${y}`;
    }

    dayTitleEl.textContent = `Reha-Termine am ${label}`;

    if (!events.length) {
      dayEventsEl.classList.add("kal2-events-empty");
      dayEventsEl.innerHTML = "Keine Termine für diesen Tag.";
      return;
    }

    dayEventsEl.classList.remove("kal2-events-empty");
    dayEventsEl.innerHTML = "";

    events.forEach(ev => {
      const div = document.createElement("div");
      div.className = "kal2-event-item";

      const timeSpan = document.createElement("span");
      timeSpan.className = "kal2-event-time";
      const timeText = [ev.start, ev.end].filter(Boolean).join("–");
      timeSpan.textContent = timeText ? `${timeText} ` : "";

      const titleSpan = document.createElement("span");
      titleSpan.className = "kal2-event-title";
      titleSpan.textContent = ev.title || "Reha-Termin";

      const locSpan = document.createElement("span");
      locSpan.className = "kal2-event-location";
      if (ev.location) {
        locSpan.textContent = ` (${ev.location})`;
      }

      div.appendChild(timeSpan);
      div.appendChild(titleSpan);
      if (ev.location) div.appendChild(locSpan);

      dayEventsEl.appendChild(div);
    });
  }

  const today = new Date();
  let current = new Date(today.getFullYear(), today.getMonth(), 1);

  function renderCalendar() {
    if (!bodyEl || !monthLabel) return;

    monthLabel.textContent = formatMonthLabel(current);
    bodyEl.innerHTML = "";

    const firstDayOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
    const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek);

    for (let week = 0; week < 6; week++) {
      const row = document.createElement("tr");

      for (let i = 0; i < 7; i++) {
        const cell = document.createElement("td");
        const cellDiv = document.createElement("div");
        cellDiv.className = "kal2-day-cell";

        const daySpan = document.createElement("span");
        daySpan.className = "kal2-day-number";

        const day = startDate.getDate();
        const month = startDate.getMonth();
        const year  = startDate.getFullYear();

        const cellDate = new Date(year, month, day);
        const isThisMonth = cellDate.getMonth() === current.getMonth();

        const dateStr = dateToStr(cellDate);
        daySpan.textContent = day;

        if (!isThisMonth) {
          cellDiv.classList.add("disabled");
        } else {
          const hasEvents = getEventsForDate(dateStr).length > 0;
          if (hasEvents) {
            cellDiv.classList.add("has-events");
          }

          const isToday =
            cellDate.getDate() === today.getDate() &&
            cellDate.getMonth() === today.getMonth() &&
            cellDate.getFullYear() === today.getFullYear();

          if (isToday) {
            cellDiv.classList.add("today");
          }

          cellDiv.addEventListener("click", () => {
            renderDayDetails(dateStr);
          });
        }

        cellDiv.appendChild(daySpan);
        cell.appendChild(cellDiv);
        row.appendChild(cell);

        startDate.setDate(startDate.getDate() + 1);
      }

      bodyEl.appendChild(row);
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  // Initial: wenn es Reha-Termine gibt, wähle den ersten Tag
  if (REHA_EVENTS.length > 0) {
    selectedDateStr = REHA_EVENTS[0].date;
    renderCalendar();
    renderDayDetails(selectedDateStr);
  } else {
    renderCalendar();
  }
})();
