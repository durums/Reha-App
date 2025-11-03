(() => {
  // Dynamisch Firestore-Funktionen laden (nutzt window.db aus index)
  let fs = {};
  const loadFS = async () => {
    if (fs.collection) return fs;
    fs = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    return fs;
  };

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const grid = q("#rezepteGrid");
  const empty = q("#rezepteEmpty");
  const searchInput = q("#rezepteSearch");
  const filterPills = qa(".filter-pill");

  const modal = q("#rezepteModal");
  const modalTitle = q("#modalTitle");
  const btnAdd = q("#btnAddRecipe");
  const btnEmptyAdd = q("#btnEmptyAdd");
  const btnDelete = q("#btnDelete");
  const btnCancel = q("#btnCancel");
  const btnSave = q("#btnSave");
  const btnClose = q("#modalClose");

  // Form-Felder
  const fType = q("#fType");
  const fTitle = q("#fTitle");
  const fReason = q("#fReason");
  const fValidUntil = q("#fValidUntil");
  const fUnitsTotal = q("#fUnitsTotal");
  const fUnitsUsed = q("#fUnitsUsed");
  const fDescription = q("#fDescription");
  const fRedeemed = q("#fRedeemed");

  // State
  let currentId = null;
  let items = [];   // rohe Daten aus Firestore
  let filter = "all";
  let search = "";

  function todayMidnight() {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }
  function parseDateInput(v) {
    if (!v) return null;
    const [y,m,d] = v.split("-").map(n=>parseInt(n,10));
    return new Date(y, m-1, d);
  }
  function fmtDate(d) {
    if (!d) return "—";
    const dd = (n) => String(n).padStart(2,"0");
    return `${dd(d.getDate())}.${dd(d.getMonth()+1)}.${d.getFullYear()}`;
  }

  // Statusberechnung:
  // - redeemed -> "redeemed"
  // - sonst, wenn validUntil in Vergangenheit ODER unitsTotal>0 && unitsUsed>=unitsTotal -> "expired"
  // - sonst -> "valid"
  function computeStatus(doc) {
    if (doc.redeemed) return "redeemed";
    const now = todayMidnight();
    const expiredByDate = doc.validUntil ? (doc.validUntil < now) : false;
    const expiredByUnits = (doc.unitsTotal ?? 0) > 0 && (doc.unitsUsed ?? 0) >= (doc.unitsTotal ?? 0);
    if (expiredByDate || expiredByUnits) return "expired";
    return "valid";
  }

  function computeProgress(doc) {
    const total = Math.max(0, parseInt(doc.unitsTotal ?? 0, 10));
    const used  = Math.max(0, Math.min(total, parseInt(doc.unitsUsed ?? 0, 10)));
    if (!total) return 0;
    return Math.round((used / total) * 100);
  }

  function matchesFilterStatus(doc) {
    const st = computeStatus(doc);
    if (filter === "all") return true;
    return st === filter;
  }

  function matchesSearch(doc) {
    if (!search) return true;
    const s = search.toLowerCase();
    return [
      doc.title, doc.reason, doc.description, doc.type
    ].filter(Boolean).some(v => String(v).toLowerCase().includes(s));
  }

  function render() {
    const view = items
      .filter(matchesFilterStatus)
      .filter(matchesSearch)
      .sort((a,b) => {
        // Sortierung: gültig zuerst, dann redeemed, expired am Ende, danach gültig-bis aufsteigend
        const rank = (d) => ({valid:0, redeemed:1, expired:2})[computeStatus(d)] ?? 3;
        const r = rank(a) - rank(b);
        if (r !== 0) return r;
        const da = a.validUntil?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
        const db = b.validUntil?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
        return da - db;
      });

    grid.innerHTML = "";
    if (view.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    view.forEach(doc => {
      const st = computeStatus(doc);
      const prog = computeProgress(doc);
      const daysLeft = doc.validUntil ? Math.ceil((doc.validUntil - todayMidnight()) / (24*3600*1000)) : null;

      const card = document.createElement("article");
      card.className = "recipe-card";

      const head = document.createElement("div");
      head.className = "recipe-head";
      head.innerHTML = `
        <div class="recipe-title">${escapeHTML(doc.title || "(ohne Titel)")}</div>
        <div class="badges">
          <span class="badge type">${escapeHTML(doc.type || "—")}</span>
          ${st === "valid" ? `<span class="badge status-valid">Gültig${daysLeft!==null ? ` · ${daysLeft} Tage` : ""}</span>` : ""}
          ${st === "expired" ? `<span class="badge status-expired">Abgelaufen</span>` : ""}
          ${st === "redeemed" ? `<span class="badge status-redeemed">Eingelöst</span>` : ""}
        </div>
      `;

      const meta = document.createElement("div");
      meta.className = "recipe-meta";
      meta.innerHTML = `
        <div class="meta-item">
          <div class="label">Grund</div>
          <div class="value">${escapeHTML(doc.reason || "—")}</div>
        </div>
        <div class="meta-item">
          <div class="label">Gültig bis</div>
          <div class="value">${doc.validUntil ? fmtDate(doc.validUntil) : "—"}</div>
        </div>
      `;

      const desc = document.createElement("div");
      desc.className = "recipe-desc";
      desc.textContent = doc.description || "—";

      const foot = document.createElement("div");
      foot.className = "recipe-foot";
      foot.innerHTML = `
        <div class="progress-wrap"><div class="progress-fill" style="width:${prog}%"></div></div>
        <div class="card-actions">
          <button class="btn-ghost small" data-act="edit">Bearbeiten</button>
          <button class="btn-ghost small" data-act="toggleRedeemed">${doc.redeemed ? "Als offen markieren" : "Als eingelöst markieren"}</button>
        </div>
      `;

      card.append(head, meta, desc, foot);
      grid.appendChild(card);

      // Actions
      card.querySelector('[data-act="edit"]').addEventListener("click", () => openForEdit(doc.id));
      card.querySelector('[data-act="toggleRedeemed"]').addEventListener("click", () => toggleRedeemed(doc.id, !doc.redeemed));
    });
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  /* ---------- Modal-Logik ---------- */
  function resetForm() {
    fType.value = "Rezept";
    fTitle.value = "";
    fReason.value = "";
    fValidUntil.value = "";
    fUnitsTotal.value = "";
    fUnitsUsed.value = "";
    fDescription.value = "";
    fRedeemed.checked = false;
  }

  function setFormFromDoc(doc) {
    fType.value = doc.type || "Rezept";
    fTitle.value = doc.title || "";
    fReason.value = doc.reason || "";
    fValidUntil.value = doc.validUntil ? toInputDate(doc.validUntil) : "";
    fUnitsTotal.value = doc.unitsTotal ?? "";
    fUnitsUsed.value = doc.unitsUsed ?? "";
    fDescription.value = doc.description ?? "";
    fRedeemed.checked = !!doc.redeemed;
  }

  function toInputDate(d) {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }

  function openForCreate() {
    currentId = null;
    modalTitle.textContent = "Neue Verordnung";
    btnDelete.hidden = true;
    resetForm();
    modal.showModal();
  }

  async function openForEdit(id) {
    const doc = items.find(x => x.id === id);
    if (!doc) return;
    currentId = id;
    modalTitle.textContent = "Verordnung bearbeiten";
    btnDelete.hidden = false;
    setFormFromDoc(doc);
    modal.showModal();
  }

  function closeModal() {
    modal.close();
  }

  /* ---------- Datenhaltung (Firestore) ---------- */
  async function fetchAll() {
    const uid = window.currentUserId;
    if (!uid || !window.db) return;

    await loadFS();
    const { collection, query, orderBy, getDocs } = fs;

    const col = collection(window.db, "users", uid, "rezepte");
    // Sortierung: nach redeemed, dann validUntil
    const qy = query(col, orderBy("redeemed","asc"), orderBy("validUntil","asc"));
    const snap = await getDocs(qy);

    items = snap.docs.map(d => {
      const data = d.data() || {};
      return {
        id: d.id,
        type: data.type || "Rezept",
        title: data.title || "",
        reason: data.reason || "",
        description: data.description || "",
        unitsTotal: (data.unitsTotal ?? null),
        unitsUsed: (data.unitsUsed ?? null),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        redeemed: !!data.redeemed,
        createdAt: data.createdAt ? new Date(data.createdAt) : null
      };
    });

    render();
  }

  async function saveCurrent() {
    const uid = window.currentUserId;
    if (!uid || !window.db) { alert("Nicht angemeldet."); return; }

    await loadFS();
    const { collection, addDoc, doc, updateDoc, serverTimestamp } = fs;

    const payload = {
      type: fType.value.trim() || "Rezept",
      title: fTitle.value.trim(),
      reason: fReason.value.trim(),
      description: fDescription.value.trim(),
      unitsTotal: fUnitsTotal.value ? parseInt(fUnitsTotal.value, 10) : null,
      unitsUsed: fUnitsUsed.value ? parseInt(fUnitsUsed.value, 10) : null,
      validUntil: fValidUntil.value ? parseDateInput(fValidUntil.value).toISOString() : null,
      redeemed: !!fRedeemed.checked,
      updatedAt: serverTimestamp()
    };

    // kleine Plausis
    if (!payload.title) { alert("Name/Bezeichnung ist erforderlich."); return; }
    if ((payload.unitsTotal ?? 0) < (payload.unitsUsed ?? 0)) {
      alert("Einheiten genutzt darf Einheiten gesamt nicht überschreiten.");
      return;
    }

    if (currentId) {
      const ref = fs.doc(window.db, "users", uid, "rezepte", currentId);
      await updateDoc(ref, payload);
    } else {
      const col = collection(window.db, "users", uid, "rezepte");
      await addDoc(col, {
        ...payload,
        createdAt: serverTimestamp()
      });
    }
    closeModal();
    await fetchAll();
  }

  async function removeCurrent() {
    if (!currentId) return;
    const uid = window.currentUserId;
    if (!uid || !window.db) return;

    if (!confirm("Diese Verordnung wirklich löschen?")) return;

    await loadFS();
    const { doc, deleteDoc } = fs;
    const ref = doc(window.db, "users", uid, "rezepte", currentId);
    await deleteDoc(ref);
    closeModal();
    await fetchAll();
  }

  async function toggleRedeemed(id, to) {
    const uid = window.currentUserId;
    if (!uid || !window.db) return;
    await loadFS();
    const { doc, updateDoc, serverTimestamp } = fs;
    await updateDoc(doc(window.db, "users", uid, "rezepte", id), {
      redeemed: !!to, updatedAt: serverTimestamp()
    });
    await fetchAll();
  }

  /* ---------- Events ---------- */
  btnAdd?.addEventListener("click", openForCreate);
  btnEmptyAdd?.addEventListener("click", openForCreate);
  btnClose?.addEventListener("click", closeModal);
  btnCancel?.addEventListener("click", closeModal);
  btnDelete?.addEventListener("click", removeCurrent);

  // Formular speichern (submit)
  q("#rezepteModal form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveCurrent();
  });

  // Filter
  filterPills.forEach(p => p.addEventListener("click", () => {
    filterPills.forEach(x => x.classList.remove("active"));
    p.classList.add("active");
    filter = p.dataset.filter || "all";
    render();
  }));

  // Suche
  searchInput?.addEventListener("input", () => {
    search = searchInput.value.trim();
    render();
  });

  // Beim Laden Daten ziehen
  document.addEventListener("DOMContentLoaded", fetchAll);
  window.addEventListener("hashchange", () => {
    // Wenn man von anderer View zurückkommt und #rezepte aktiv ist: refresh
    if (location.hash === "#rezepte") fetchAll();
  });
})();
