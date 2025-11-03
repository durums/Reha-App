(() => {
  // ---- DOM ----
  const grid = document.getElementById('rezepteGrid');
  const empty = document.getElementById('rezepteEmpty');
  const btnAdd = document.getElementById('btnAddRecipe');
  const btnEmptyAdd = document.getElementById('btnEmptyAdd');
  const search = document.getElementById('rezepteSearch');
  const filterButtons = document.querySelectorAll('.filter-pill');
  const dlg = document.getElementById('rezepteModal');
  const modalClose = document.getElementById('modalClose');
  const btnCancel = document.getElementById('btnCancel');
  const btnDelete = document.getElementById('btnDelete');
  const form = dlg.querySelector('form');
  const modalTitle = document.getElementById('modalTitle');

  const fType = document.getElementById('fType');
  const fTitle = document.getElementById('fTitle');
  const fReason = document.getElementById('fReason');
  const fValidUntil = document.getElementById('fValidUntil');
  const fUnitsTotal = document.getElementById('fUnitsTotal');
  const fUnitsUsed = document.getElementById('fUnitsUsed');
  const fDescription = document.getElementById('fDescription');
  const fRedeemed = document.getElementById('fRedeemed');

  // ---- State ----
  let items = [];
  let currentId = null;
  let currentFilter = 'all';
  let q = '';

  // ---- Storage ----
  const LS_KEY = 'rezepte_items_v1';
  const loadLocal = () => {
    try { items = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { items = []; }
  };
  const saveLocal = () => localStorage.setItem(LS_KEY, JSON.stringify(items));

  // ---- Helpers ----
  const fmtDate = dStr => {
    if (!dStr) return '—';
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE');
  };
  const statusOf = it => {
    if (it.redeemed) return 'redeemed';
    if (it.validUntil) {
      const t = new Date(); t.setHours(0,0,0,0);
      const vd = new Date(it.validUntil + 'T00:00:00');
      if (vd < t) return 'expired';
    }
    return 'valid';
  };
  const usedPct = it => {
    const t = parseInt(it.unitsTotal||0,10);
    const u = parseInt(it.unitsUsed||0,10);
    return t>0 ? Math.min(100,Math.round((u/t)*100)) : 0;
  };

  // ---- Rendering ----
  const render = () => {
    const filtered = items.filter(it => {
      const s = statusOf(it);
      const m = q ? `${it.title}${it.reason}${it.description}${it.type}`.toLowerCase().includes(q) : true;
      return (currentFilter==='all'||s===currentFilter) && m;
    });
    grid.innerHTML = '';
    empty.hidden = filtered.length > 0;
    filtered.forEach(it => {
      const st = statusOf(it);
      const pct = usedPct(it);
      const card = document.createElement('article');
      card.className = 'rx-card card';
      card.innerHTML = `
        <div class="rx-head">
          <span class="rx-type">${it.type||'—'}</span>
          <span class="rx-status rx-${st}">${st==='valid'?'Gültig':st==='expired'?'Abgelaufen':'Eingelöst'}</span>
        </div>
        <h3 class="rx-title">${it.title||'Ohne Titel'}</h3>
        <div class="rx-meta">
          ${it.reason?`<div><strong>Grund:</strong> ${it.reason}</div>`:''}
          <div><strong>Gültig bis:</strong> ${fmtDate(it.validUntil)}</div>
          <div><strong>Einheiten:</strong> ${it.unitsUsed||0}/${it.unitsTotal||0}</div>
          <div class="rx-bar"><span style="width:${pct}%"></span></div>
        </div>
        ${it.description?`<p class="rx-desc">${it.description}</p>`:''}
        <div class="rx-actions">
          <button class="btn-ghost" data-act="edit">Bearbeiten</button>
          <button class="btn-ghost danger" data-act="del">Löschen</button>
        </div>`;
      card.querySelectorAll('button').forEach(b => 
        b.addEventListener('click', e => {
          e.stopPropagation();
          if (b.dataset.act==='edit') openEdit(it.id);
          if (b.dataset.act==='del') delItem(it.id);
        })
      );
      grid.appendChild(card);
    });
  };

  // ---- Modal ----
  const resetForm = () => {
    currentId = null; form.reset(); fType.value='Rezept';
    btnDelete.hidden = true; modalTitle.textContent='Verordnung';
  };
  const fillForm = it => {
    fType.value=it.type; fTitle.value=it.title; fReason.value=it.reason;
    fValidUntil.value=it.validUntil; fUnitsTotal.value=it.unitsTotal;
    fUnitsUsed.value=it.unitsUsed; fDescription.value=it.description;
    fRedeemed.checked=it.redeemed;
  };
  const openNew = ()=>{resetForm(); modalTitle.textContent='Neue Verordnung'; dlg.showModal();};
  const openEdit = id=>{
    const it=items.find(x=>x.id===id); if(!it)return;
    resetForm(); currentId=id; btnDelete.hidden=false;
    modalTitle.textContent='Verordnung bearbeiten'; fillForm(it); dlg.showModal();
  };
  const closeDlg=()=>dlg.close();

  // ---- CRUD ----
  const readForm = ()=>({
    type:fType.value.trim(), title:fTitle.value.trim(), reason:fReason.value.trim(),
    validUntil:fValidUntil.value||'', unitsTotal:parseInt(fUnitsTotal.value||0,10),
    unitsUsed:parseInt(fUnitsUsed.value||0,10), description:fDescription.value.trim(),
    redeemed:fRedeemed.checked
  });
  const addItem=d=>{items.push({id:'rx_'+Date.now(),createdAt:Date.now(),...d});saveLocal();render();};
  const updateItem=(id,d)=>{const i=items.findIndex(x=>x.id===id);if(i>=0){items[i]={...items[i],...d};saveLocal();render();}};
  const delItem=id=>{if(confirm('Löschen ?')){items=items.filter(x=>x.id!==id);saveLocal();render();}};

  // ---- Events ----
  btnAdd?.addEventListener('click',openNew);
  btnEmptyAdd?.addEventListener('click',openNew);
  modalClose?.addEventListener('click',closeDlg);
  btnCancel?.addEventListener('click',closeDlg);
  btnDelete?.addEventListener('click',()=>{if(currentId){delItem(currentId);closeDlg();}});
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const d=readForm();
    if(!d.title){alert('Bitte Name/Bezeichnung eingeben.');return;}
    currentId?updateItem(currentId,d):addItem(d);
    closeDlg();
  });
  filterButtons.forEach(b=>b.addEventListener('click',()=>{
    filterButtons.forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); currentFilter=b.dataset.filter; render();
  }));
  search?.addEventListener('input',()=>{q=search.value.toLowerCase();render();});

  // ---- Init ----
  loadLocal(); render();
})();
