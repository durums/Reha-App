// Firebase initialisieren (Konfiguration hier einfügen)
const firebaseConfig = {
  /* TODO: Firebase-Konfiguration einfügen */
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();  // Firestore-Instanz erstellen  [oai_citation:3‡firebase.google.com](https://firebase.google.com/docs/firestore/manage-data/add-data#:~:text=%2F%2F%20Initialize%20Firebase%20firebase)

// Referenzen auf wichtige DOM-Elemente
const cardsContainer = document.getElementById('cardsContainer');
const addButton = document.getElementById('addButton');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const prescriptionForm = document.getElementById('prescriptionForm');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');

// Formularelemente
const typeInput = document.getElementById('type');
const nameInput = document.getElementById('name');
const reasonInput = document.getElementById('reason');
const descriptionInput = document.getElementById('description');
const durationDateInput = document.getElementById('durationDate');
const durationUnitsInput = document.getElementById('durationUnits');
const durationTypeRadios = document.querySelectorAll('input[name="durationType"]');

// Status-Filter
let currentFilter = 'all';  // aktueller Filter (all, valid, expired, redeemed)

// Hilfsvariable für Editiermodus
let editId = null;  // speichert die ID der Verordnung, die gerade bearbeitet wird (oder null für neu)

// ** Status-Berechnung für eine Verordnung **
function computeStatus(docData) {
  // Falls als eingelöst markiert
  if (docData.redeemed) {
    return 'redeemed';
  }
  // Falls Dauer ein Datum enthält ("bis DD.MM.YYYY")
  const duration = docData.duration || '';
  if (duration.startsWith('bis')) {
    // Datum aus dem String extrahieren und vergleichen
    const dateStr = duration.slice(4).trim();  // Teil nach "bis "
    // dd.mm.yyyy in Date umwandeln
    const [day, month, year] = dateStr.split('.');
    if (day && month && year) {
      const expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);
      if (Date.now() > expiryDate.getTime()) {
        return 'expired';
      }
    }
    return 'valid';
  }
  // Falls Dauer "Einheiten" enthält und noch nicht eingelöst => gültig (kein Ablaufdatum)
  return 'valid';
}

// ** Render-Funktion: Verordnungen als Karten anzeigen (mit Filter) **
function renderPrescriptions(prescriptions) {
  // Falls Filter aktiv, entsprechende Liste filtern
  let filtered = prescriptions;
  if (currentFilter !== 'all') {
    filtered = prescriptions.filter(doc => {
      const status = computeStatus(doc);
      if (currentFilter === 'valid') return status === 'valid';
      if (currentFilter === 'expired') return status === 'expired';
      if (currentFilter === 'redeemed') return status === 'redeemed';
      return true;
    });
  }
  // HTML für alle gefilterten Verordnungen zusammenbauen
  let html = '';
  filtered.forEach(doc => {
    const data = doc;  // doc enthält { id, type, name, ... duration, redeemed }
    const statusKey = computeStatus(data);
    // Anzeigename des Status in Deutsch
    let statusLabel;
    if (statusKey === 'valid') statusLabel = 'Gültig';
    else if (statusKey === 'expired') statusLabel = 'Abgelaufen';
    else statusLabel = 'Eingelöst';
    // Karte HTML
    html += `
      <div class="card">
        <small class="card-type">${data.type}</small>
        <h3 class="card-name">${data.name}</h3>
        <p><strong>Grund:</strong> ${data.reason || ''}</p>
        <p><strong>Beschreibung:</strong> ${data.description || ''}</p>
        <p><strong>Dauer:</strong> ${data.duration}</p>
        <div class="card-meta">
          <span class="card-status status-${statusKey}">${statusLabel}</span>
        </div>
        <div class="card-actions">
          <button class="edit-btn" data-id="${data.id}">Bearbeiten</button>
          <button class="delete-btn" data-id="${data.id}">Löschen</button>
          ${(!data.redeemed && computeStatus(data) === 'valid') 
             ? `<button class="redeem-btn" data-id="${data.id}">Einlösen</button>` 
             : ''}
        </div>
      </div>`;
  });
  // Wenn keine Verordnungen im Filter, Hinweis anzeigen
  if (filtered.length === 0) {
    html = `<p>Keine Verordnungen vorhanden.</p>`;
  }
  cardsContainer.innerHTML = html;

  // Event-Listener für dynamische Buttons (Bearbeiten/Löschen/Einlösen)
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openEditModal(id);
    });
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deletePrescription(id);
    });
  });
  document.querySelectorAll('.redeem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      redeemPrescription(id);
    });
  });
}

// ** Firestore-Echtzeitlistener: lädt alle Verordnungen und rendert sie **
db.collection('verordnungen').onSnapshot((querySnapshot) => {
  const docs = [];
  querySnapshot.forEach((doc) => {
    // Daten des Dokuments plus ID sammeln
    const docData = doc.data();
    docData.id = doc.id;
    docs.push(docData);
  });
  renderPrescriptions(docs);
}); // Das UI aktualisiert sich automatisch bei jeder Änderung [oai_citation:4‡firebase.google.com](https://firebase.google.com/docs/firestore/query-data/listen#:~:text=db.collection%28,)

// ** Modal anzeigen für neue Verordnung (Hinzufügen) **
function openAddModal() {
  editId = null;
  modalTitle.textContent = 'Neue Verordnung';
  prescriptionForm.reset();  // Formular leeren
  // Standard: "Bis Datum" auswählen, Einheiten-Feld deaktivieren
  durationTypeRadios.forEach(radio => {
    if (radio.value === 'date') {
      radio.checked = true;
    }
  });
  durationDateInput.disabled = false;
  durationUnitsInput.disabled = true;
  durationDateInput.required = true;
  durationUnitsInput.required = false;
  modalOverlay.style.display = 'flex';
}

// ** Modal anzeigen für bestehende Verordnung (Bearbeiten) **
function openEditModal(id) {
  const docRef = db.collection('verordnungen').doc(id);
  docRef.get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      editId = id;
      modalTitle.textContent = 'Verordnung bearbeiten';
      // Formularfelder mit vorhandenen Daten füllen
      typeInput.value = data.type || '';
      nameInput.value = data.name || '';
      reasonInput.value = data.reason || '';
      descriptionInput.value = data.description || '';
      // Dauer je nach Typ setzen
      if (data.duration && data.duration.includes('Einheit')) {
        // Einheiten-Variante
        document.querySelector('input[name="durationType"][value="sessions"]').checked = true;
        document.querySelector('input[name="durationType"][value="date"]').checked = false;
        durationUnitsInput.disabled = false;
        durationDateInput.disabled = true;
        durationUnitsInput.required = true;
        durationDateInput.required = false;
        // Zahl aus "X Einheiten" extrahieren
        const num = parseInt(data.duration) || 0;
        durationUnitsInput.value = num > 0 ? num : '';
      } else if (data.duration && data.duration.startsWith('bis')) {
        // Datums-Variante
        document.querySelector('input[name="durationType"][value="date"]').checked = true;
        document.querySelector('input[name="durationType"][value="sessions"]').checked = false;
        durationUnitsInput.disabled = true;
        durationDateInput.disabled = false;
        durationUnitsInput.required = false;
        durationDateInput.required = true;
        // Datum "bis DD.MM.YYYY" in das Date-Input-Format (YYYY-MM-DD) umwandeln
        const dateStr = data.duration.slice(4).trim(); // z.B. "10.12.2025"
        const [day, month, year] = dateStr.split('.');
        if (year && month && day) {
          // Mit führenden Nullen sicherstellen, dass Format passt
          const mm = month.padStart(2, '0');
          const dd = day.padStart(2, '0');
          durationDateInput.value = `${year}-${mm}-${dd}`;
        }
      } else {
        // Falls keine Dauer angegeben, Standard auf Datum
        durationTypeRadios.forEach(radio => {
          if (radio.value === 'date') radio.checked = true;
        });
        durationDateInput.disabled = false;
        durationUnitsInput.disabled = true;
        durationDateInput.required = true;
        durationUnitsInput.required = false;
      }
      modalOverlay.style.display = 'flex';
    }
  });
}

// ** Formular-Submit: Neue Verordnung hinzufügen oder bestehende updaten **
prescriptionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Felder auslesen
  const typeVal = typeInput.value;
  const nameVal = nameInput.value;
  const reasonVal = reasonInput.value;
  const descVal = descriptionInput.value;
  let durationVal = '';
  if (document.querySelector('input[name="durationType"]:checked').value === 'date') {
    if (durationDateInput.value) {
      // Datum ins gewünschte Format "bis DD.MM.YYYY" bringen
      const d = new Date(durationDateInput.value);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      durationVal = `bis ${day}.${month}.${year}`;
    }
  } else {  // "sessions" gewählt
    if (durationUnitsInput.value) {
      const units = parseInt(durationUnitsInput.value);
      durationVal = units ? (units === 1 ? '1 Einheit' : `${units} Einheiten`) : '';
    }
  }
  // Grundlegende Validierung: mind. ein Dauer-Feld muss ausgefüllt sein
  if (!durationVal) {
    alert("Bitte eine Dauer angeben (Datum oder Anzahl Einheiten).");
    return;
  }
  // Objekt für Firestore vorbereiten
  const docData = {
    type: typeVal,
    name: nameVal,
    reason: reasonVal,
    description: descVal,
    duration: durationVal
    // 'status' wird nicht dauerhaft gespeichert, da es dynamisch berechnet wird
  };
  if (editId) {
    // Bestehende Verordnung updaten (behält das Feld 'redeemed' bei)
    db.collection('verordnungen').doc(editId).update(docData)
      .then(() => {
        modalOverlay.style.display = 'none';  // Modal schließen
        editId = null;
      })
      .catch(err => console.error("Fehler beim Aktualisieren:", err));
  } else {
    // Neue Verordnung hinzufügen (mit redeemed=false initial)
    docData.redeemed = false;
    db.collection('verordnungen').add(docData)
      .then(() => {
        modalOverlay.style.display = 'none';  // Modal schließen
      })
      .catch(err => console.error("Fehler beim Hinzufügen:", err));
  }
});

// ** Verordnung als eingelöst markieren **
function redeemPrescription(id) {
  if (!id) return;
  // Firestore-Feld 'redeemed' auf true setzen
  db.collection('verordnungen').doc(id).update({ redeemed: true })
    .catch(err => console.error("Fehler beim Einlösen:", err));
}

// ** Verordnung löschen **
function deletePrescription(id) {
  if (!id) return;
  const confirmDelete = confirm("Soll diese Verordnung wirklich gelöscht werden?");
  if (confirmDelete) {
    db.collection('verordnungen').doc(id).delete()
      .catch(err => console.error("Fehler beim Löschen:", err));
  }
}

// ** Modal schließen (Abbrechen) **
function closeModal() {
  modalOverlay.style.display = 'none';
  editId = null;
}

// Event-Listener für Klick auf "Hinzufügen" Button
addButton.addEventListener('click', openAddModal);
// Event-Listener für Modal-Abbrechen (Cancel)
cancelBtn.addEventListener('click', closeModal);
// Klick auf Overlay außerhalb der Modal-Box schließt Modal ebenfalls
modalOverlay.addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') {
    closeModal();
  }
});

// Event-Listener für Wechsel zwischen Dauer-Optionen (Datum/Einheiten)
durationTypeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'date') {
      durationDateInput.disabled = false;
      durationDateInput.required = true;
      durationUnitsInput.disabled = true;
      durationUnitsInput.required = false;
    } else if (radio.value === 'sessions') {
      durationDateInput.disabled = true;
      durationDateInput.required = false;
      durationUnitsInput.disabled = false;
      durationUnitsInput.required = true;
    }
  });
});

// Event-Listener für Filter-Buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // aktive Klasse aktualisieren
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Filter setzen und neu rendern
    currentFilter = btn.getAttribute('data-filter');
    // Die Daten sind bereits via Snapshot vorhanden, daher neu rendern mit aktuellem Filter:
    // (Wir triggern einfach onSnapshot-Handler neu, indem wir hier nichts tun – dieser läuft 
    // automatisch bei Datenänderung. Für reines Filterwechsel ohne DB-Änderung können wir die 
    // letzte geladene Liste zwischenspeichern und hier filtern.)
    // Zur Vereinfachung rufen wir hier erneut die Firestore-Daten ab und rendern dann:
    db.collection('verordnungen').get().then(querySnapshot => {
      const docs = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        docs.push(data);
      });
      renderPrescriptions(docs);
    });
  });
});
