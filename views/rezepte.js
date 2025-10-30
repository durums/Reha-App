(() => {
  /* ===== Helpers ===== */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const uid = window.currentUserId || "local";
  const KEY = `rx_store_${uid}`;

  const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
  const toISO = d => d ? new Date(d).toISOString().slice(0,10) : "";
  const parse = s => s ? new Date(s) : null;

  const byId = id => state.items.find(x => x.id === id);

  function uid8(){ return Math.random().toString(36).slice(2,10); }

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)) || seed(); }
    catch { return seed(); }
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }

  // kleine Beispiel-Daten beim ersten Start
  function seed(){
    const base = {
      items: [
        {
          id: uid8(), type: "PHYSIO", title: "Krankengymnastik",
          issued: toISO(new Date()),
          validUntil: toISO(new Date(Date.now() + 1000*60*60*24*28)),
          doctor: "Dr. Müller", ref: "KG-2025-001",
          units: 6, freq: "2×/Woche", status: "OFFEN",
          note: "Nach VKB-OP, Fokus ROM, Gangschule.",
          file: null
        },
        {
          id: uid8(), type: "MEDI", title: "Ibuprofen 400 mg",
          issued: toISO(new Date()),
          validUntil: toISO(new Date(Date.now() + 1000*60*60*24*10)),
          doctor: "Klinik", ref: "RX-IBU",
          units: 30, freq: "bei Bedarf", status: "OFFEN",
          note: "", file: null
        },
        {
          id: uid8(), type: "AU", title: "Arbeitsunfähigkeit",
          issued: toISO(new Date(Date.now() - 1000*60*60*24*7)),
          validUntil: toISO(new Date(Date.now() + 1000*60*60*24*7)),
          doctor: "Orthopädie", ref: "AU-2025-10", units: null, freq: "",
          status: "OFFEN", note: "Kontrolle in Woche 2.", file: null
        }
      ],
      last: Date.now()
    };
    localStorage.setItem(KEY, JSON.stringify(base));
    return base;
  }

  function daysLeft(validUntil){
    if (!validUntil) return null;
    const t = today();
    const v = new Date(validUntil); v.setHours(0,0,0,0);
    return Math.ceil((v - t) / 86400000);
  }

  function typeLabel(t){
    return ({
      PHYSIO:"Physio", MT:"Manuelle Therapie", LD:"Lymphdrainage", REHA:"Reha",
      MEDI:"Medikament", AU:"Arbeitsunfähigkeit", SONSTIGES:"Sonstiges"
    }[t] || t);
  }

  function statusBadge(item){
    const dl = daysLeft(item.validUntil);
    if (item.status === "EINGELOEST")
      return `<span class="badge ok">Eingelöst</span>`;
    if (item.type === "AU")
      return `<span class="badge au">AU</span>`;
    if (dl !== null && dl < 0)
      return `<span class="badge bad">Abgelaufen</span>`;
    if (dl !== null && dl <= 5)
      return `<span class="badge warn">läuft in ${Math.max(dl,0)} Tagen ab</span>`;
    return `<span class="badge ok">Gültig</span>`;
  }

  /* ===== State & DOM ===== */
  let state = load();

  const listEl   = $("#rxList");
  const emptyEl  = $("#rxEmpty");
  const filterEl = $("#rxFilter");
  const searchEl = $("#rxSearch");

  const modal    = $("#rxModal");
  const form     = $("#rxForm");
  const titleEl  = $("#rxModalTitle");
  const delBtn   = $("#rxDelete");
  const closeBtn = $("#rxClose");
  const cancelBtn= $("#rxCancel");

  /* ===== Render ===== */
  function card(item){
    const dl = daysLeft(item.validUntil);
    const daysTxt = item.validUntil ? (dl < 0 ? `seit ${Math.abs(dl)} Tagen abgelaufen` : `${dl} Tage verbleibend`) : "kein Ablaufdatum";

    return `
    <article class="rx-card card" data-id="${item.id}">
      <div>
        <div class="rx-title">${item.title || typeLabel(item.type)}</div>
        <div class="rx-sub">${typeLabel(item.type)} • Ausgestellt: <strong>${item.issued || "–"}</strong> • Gültig bis: <strong>${item.validUntil || "–"}</strong></div>
        <div class="rx-meta">Arzt/Stelle: <strong>${item.doctor || "–"}</strong> • Nr.: <strong>${item.ref || "–"}</strong> • Einheiten: <strong>${item.units ?? "–"}</strong> • Frequenz: <strong>${item.freq || "–"}</strong></div>
      </div>
      <div class="rx-badges">
        <span class="badge type">${typeLabel(item.type)}</span>
        ${statusBadge(item)}
        <span class="badge">${daysTxt}</span>
      </div>
      <div class="rx-actions">
        ${item.file ? `<a class="btn btn-light" href="${item.file}" target="_blank">Anhang</a>` : ""}
        <button class="btn btn-light" data-act="edit">Bearbeiten</button>
        <button class="btn btn-primary" data-act="toggle">${item.status==="EINGELOEST"?"Als gültig markieren":"Als eingelöst markieren"}</button>
      </div>
    </article>`;
  }

  function applyFilter(items){
    const f = filterEl.value;
    const q = (searchEl.value || "").toLowerCase();
    let out = items;

    if (f === "OFFEN") out = out.filter(i => i.status!=="EINGELOEST" && (daysLeft(i.validUntil)===null || daysLeft(i.validUntil)>=0));
    if (f === "EINGELOEST") out = out.filter(i => i.status==="EINGELOEST");
    if (f === "ABGELAUFEN") out = out.filter(i => (daysLeft(i.validUntil)??1) < 0);
    if (f === "AU") out = out.filter(i => i.type==="AU");

    if (q) {
      out = out.filter(i =>
        (i.title||"").toLowerCase().includes(q) ||
        (i.doctor||"").toLowerCase().includes(q) ||
        (i.ref||"").toLowerCase().includes(q) ||
        (i.note||"").toLowerCase().includes(q) ||
        typeLabel(i.type).toLowerCase().includes(q)
      );
    }

    // sort: AU oben, dann Ablaufdatum, dann erstellt
    out.sort((a,b)=>{
      if (a.type==="AU" && b.type!=="AU") return -1;
      if (b.type==="AU" && a.type!=="AU") return 1;
      const da = a.validUntil ? new Date(a.validUntil).getTime() : 9e15;
      const db = b.validUntil ? new Date(b.validUntil).getTime() : 9e15;
      return da-db;
    });

    return out;
  }

  function render(){
    const items = applyFilter(state.items);
    listEl.innerHTML = items.map(card).join("");
    emptyEl.style.display = items.length ? "none" : "block";
  }

  /* ===== CRUD ===== */
  function openModal(item){
    titleEl.textContent = item ? "Verordnung bearbeiten" : "Neue Verordnung";
    delBtn.style.display = item ? "inline-flex" : "none";

    form.type.value       = item?.type || "PHYSIO";
    form.issued.value     = item?.issued || toISO(new Date());
    form.validUntil.value = item?.validUntil || "";
    form.doctor.value     = item?.doctor || "";
    form.ref.value        = item?.ref || "";
    form.units.value      = item?.units ?? "";
    form.freq.value       = item?.freq || "";
    form.status.value     = item?.status || "OFFEN";
    form.note.value       = item?.note || "";
    form.id.value         = item?.id || "";

    modal.showModal();
  }

  async function readFileAsDataURL(file){
    if (!file) return null;
    return new Promise((res,rej)=>{
      const rd = new FileReader();
      rd.onload = () => res(rd.result);
      rd.onerror = rej;
      rd.readAsDataURL(file);
    });
  }

  /* Events: Toolbar */
  $("#rxAddBtn").addEventListener("click", () => openModal(null));
  $("#rxExportBtn").addEventListener("click", () => exportCSV());
  filterEl.addEventListener("change", render);
  searchEl.addEventListener("input", render);

  /* Events: Liste */
  listEl.addEventListener("click", (e)=>{
    const card = e.target.closest(".rx-card");
    if (!card) return;
    const id = card.dataset.id;
    const actBtn = e.target.closest("[data-act]");
    if (!actBtn) return;

    if (actBtn.dataset.act === "edit"){
      openModal(byId(id));
    } else if (actBtn.dataset.act === "toggle"){
      const it = byId(id);
      it.status = it.status === "EINGELOEST" ? "OFFEN" : "EINGELOEST";
      save(); render();
    }
  });

  /* Modal Buttons */
  closeBtn.addEventListener("click", ()=> modal.close());
  cancelBtn.addEventListener("click", ()=> modal.close());
  delBtn.addEventListener("click", ()=>{
    const id = form.id.value;
    if (id){
      state.items = state.items.filter(x => x.id !== id);
      save(); render(); modal.close();
    }
  });

  /* Form Submit */
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const file = form.file.files?.[0] || null;
    const fileData = file ? await readFileAsDataURL(file) : undefined;

    const item = {
      id: data.id || uid8(),
      type: data.type,
      title: data.type === "MEDI" ? (data.title || "Medikament") : (data.title || typeLabel(data.type)),
      issued: data.issued || null,
      validUntil: data.validUntil || null,
      doctor: data.doctor || "",
      ref: data.ref || "",
      units: data.units ? parseInt(data.units,10) : null,
      freq:
