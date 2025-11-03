/* views/rezepte.js */
(() => {
  // ---- Guard: Firebase + User vorhanden? ----
  const auth = window.auth;
  const db   = window.db;
  const uid  = window.currentUserId;

  if (!auth || !db) {
    console.warn("Rezepte: Firebase nicht bereit.");
    return;
  }
  if (!uid) {
    console.warn("Rezepte: kein User eingeloggt.");
    return;
  }

  // ---- Firestore (v10 modular) ----
  const {
    collection, addDoc, updateDoc, deleteDoc, doc,
    getDocs, query, orderBy, where, serverTimestamp
  } = window.firebaseFirestore || await (async () => {
    const m = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    // Kleiner Adapter, damit wir obige Namen leicht nutzen können
    window.firebaseFirestore = m;
    return m;
  })();

  // ---- DOM refs ----
  const wrap         = document.querySelector(".rezepte-wrap");
  const grid         = document.getElementById("rxGrid");
  const emptyBox     = document.getElementById("rxEmpty");
  const addBtn       = document.getElementById("rxAddBtn");
  const modal        = document.getElementById("rxModal");
  const modalTitle   = document.getElementById("rxModalTitle");
  const form         = document.getElementById("rxForm");
  const closeBtns    = modal?.querySelectorAll("[data-close]");
  const filterBar    = document.getElementById("rxFilters");
  const searchInput  = document.getElementById("rxSearch");

  // Formularfelder
  const fId         = document.getElementById("rxId");          // hidden
  const fType       = document.getElementById("rxType");        // Rezept / AU / …
  const fName       = document.getElementById("rxName");
  const fReason     = document.getElementById("rxReason");
  const fDesc       = document.getElementById("rxDesc");
  const fStart      = document.getElementById("rxStart");       // yyyy-mm-dd
  const fEnd        = document.getElementById("rxEnd");         // yyyy-mm-dd (optional)
  const fUnits      = document.getElementById("rxUnits");       // z.B. 6 Einheiten
  const fRedeemed   = document.getElementById("rxRedeemed");    // checkbox „eingelöst“

  // Datenpuffer
  let ALL = [];            // alle Datensätze aus DB
  let currentFilter = "alle";
  let searchTerm = "";

  // ---- Hilfen ----
  const colRef = collection(db, `users/${uid}/prescriptions`);

  const fmt = (dstr) => {
    if (!dstr) return "";
    const d = new Date(dstr + "T00:00:00");
    return d.toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" });
  };

  function computeStatus(item) {
    if (item.redeemed) return "eingeloest";
    if (item.endDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const end   = new Date(item.endDate + "T00:00:00");
      if (end < today) return "abgelaufen";
    }
    return "gueltig";
  }

  function closeModal() {
    modal?.classList.remove("open");
    form?.reset();
    fId.value = "";
  }

  function openModal(mode, values = null) {
    modal?.classList.add("open");
    modalTitle.textContent = (mode === "edit") ? "Verordnung bearbeiten" : "Neue Verordnung";
    if (values) {
      fId.value       = values.id || "";
      fType.value     = values.type || "Rezept";
      fName.value     = values.name || "";
      fReason.value   = values.reason || "";
      fDesc.value     = values.description || "";
      fStart.value    = values.startDate || "";
      fEnd.value      = values.endDate || "";
      fUnits.value    = values.units || "";
      fRedeemed.checked = !!values.redeemed;
    } else {
      form.reset();
      fId.value = "";
      fType.value = "Rezept";
    }
  }

  function cardHTML(x) {
    const status = computeStatus(x);
    const badge = {
      gueltig:     "badge-ok",
      abgelaufen:  "badge-expired",
      eingelöst:   "badge-done",
      eingelost:   "badge-done",     // falls ohne Umlaut gespeichert
      eingeloest:  "badge-done"
    }[status] || "badge-ok";

    const statusLabel = {
      gueltig: "Gültig",
      abgelaufen: "Abgelaufen",
      eingelöst: "Eingelöst",
      eingelost: "Eingelöst",
      eingeloest: "Eingelöst"
    }[status] || "Gültig";

    return `
      <article class="rx-card card">
        <div class="rx-top">
          <span class="rx-type">${x.type || "Rezept"}</span>
          <span class="rx-badge ${badge}">${statusLabel}</span>
        </div>
        <h4 class="rx-name">${x.name || "—"}</h4>
        <div class="rx-meta">
          <div><strong>Grund:</strong> ${x.reason || "—"}</div>
          <div><strong>Zeitraum:</strong> ${fmt(x.startDate)} ${x.endDate ? "– " + fmt(x.endDate) : ""}</div>
          <div><strong>Länge:</strong> ${x.units || "—"}</div>
        </div>
        <p class="rx-desc">${x.description ? x.description : ""}</p>
        <div class="rx-actions">
          <button class="btn btn-light" data-edit="${x.id}">Bearbeiten</button>
          <button class="btn btn-light" data-redeem="${x.id}" ${x.redeemed ? "disabled" : ""}>Einlösen</button>
          <button class="btn btn-outline" data-delete="${x.id}">Löschen</button>
        </div>
      </article>
    `;
  }

  function applyFilterAndSearch(list) {
    let out = list;
    if (currentFilter !== "alle") {
      out = out.filter(x => computeStatus(x) === currentFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      out = out.filter(x =>
        (x.name || "").toLowerCase().includes(q) ||
        (x.reason || "").toLowerCase().includes(q) ||
        (x.description || "").toLowerCase().includes(q)
      );
    }
    return out;
  }

  function render() {
    const items = applyFilterAndSearch(ALL);
    if (!items.length) {
      emptyBox.style.display = "flex";
      grid.innerHTML = "";
      return;
    }
    emptyBox.style.display = "none";
    grid.innerHTML = items.map(cardHTML).join("");
  }

  async function loadAll() {
    const qy = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    ALL = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }

  // ---- Events ----
  addBtn?.addEventListener("click", () => openModal("new"));
  closeBtns?.forEach(btn => btn.addEventListener("click", closeModal));
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  filterBar?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if (!b) return;
    document.querySelectorAll("#rxFilters [data-filter]").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    currentFilter = b.dataset.filter;   // 'alle' | 'gueltig' | 'abgelaufen' | 'eingeloest'
    render();
  });

  searchInput?.addEventListener("input", (e) => {
    searchTerm = e.target.value || "";
    render();
  });

  grid?.addEventListener("click", async (e) => {
    const btnEdit = e.target.closest("[data-edit]");
    const btnDel  = e.target.closest("[data-delete]");
    const btnRed  = e.target.closest("[data-redeem]");

    if (btnEdit) {
      const id = btnEdit.dataset.edit;
      const item = ALL.find(x => x.id === id);
      if (item) openModal("edit", item);
      return;
    }
    if (btnDel) {
      const id = btnDel.dataset.delete;
      if (confirm("Verordnung wirklich löschen?")) {
        await deleteDoc(doc(db, `users/${uid}/prescriptions/${id}`));
        await loadAll();
      }
      return;
    }
    if (btnRed) {
      const id = btnRed.dataset.redeem;
      const ref = doc(db, `users/${uid}/prescriptions/${id}`);
      await updateDoc(ref, { redeemed: true, updatedAt: serverTimestamp() });
      await loadAll();
      return;
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // einfache Validierung
    if (!fName.value.trim()) { alert("Bitte Name der Verordnung angeben."); return; }

    const payload = {
      type:        fType.value || "Rezept",
      name:        fName.value.trim(),
      reason:      fReason.value.trim(),
      description: fDesc.value.trim(),
      startDate:   fStart.value || null,
      endDate:     fEnd.value || null,
      units:       fUnits.value.trim(),
      redeemed:    !!fRedeemed.checked,
      updatedAt:   serverTimestamp()
    };

    const id = fId.value;

    try {
      if (id) {
        const ref = doc(db, `users/${uid}/prescriptions/${id}`);
        await updateDoc(ref, payload);
      } else {
        await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
      }
      closeModal();
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Speichern fehlgeschlagen.");
    }
  });

  // Init
  loadAll().catch(console.error);
})();
