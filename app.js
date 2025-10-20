// app.js - Hauptlogik für Reha Tagesprogramm
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js";

// init: verwende deine firebaseConfig wie in deinem Projekt
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Auth-UI sauber nach DOM-Ready initialisieren ---
function initAuthUI() {
  const userInfo = document.getElementById('user-info');
  const signOutBtn = document.getElementById('sign-out');

  if (!userInfo || !signOutBtn) {
    console.warn('Auth-UI: #user-info oder #sign-out nicht gefunden. HTML-Snippet in index.html einfügen.');
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const name = user.displayName || user.email || ("UID: " + user.uid);
      userInfo.textContent = `Angemeldet: ${name}`;
      signOutBtn.style.display = 'inline-block';
      // optional: für Debug
      window.currentUser = user;
    } else {
      userInfo.textContent = 'Nicht angemeldet';
      signOutBtn.style.display = 'none';
      window.currentUser = null;
    }
  });

  signOutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      userInfo.textContent = 'Nicht angemeldet';
      signOutBtn.style.display = 'none';
    } catch (err) {
      console.error('Sign-out error', err);
      alert('Abmelden fehlgeschlagen — Konsole prüfen.');
    }
  });
}

class RehaScheduleApp {
    constructor() {
        // Konfiguration aus schedule-data.js laden
        this.rehaStartDate = window.REHA_CONFIG.rehaStartDate;
        this.maxDays = window.REHA_CONFIG.maxDays;
        this.serverUrl = window.REHA_CONFIG.serverUrl;
        this.currentDay = 0; // 0-based day index
        this.currentNoteIndex = null;
        this.isOnline = navigator.onLine;
        
        // Default schedule aus schedule-data.js
        this.defaultSchedule = window.DEFAULT_SCHEDULE;
        
        console.log('App initializing with config:', {
            maxDays: this.maxDays,
            scheduleKeys: Object.keys(this.defaultSchedule)
        });
        
        this.loadSchedule();
        this.loadNotes();
        this.initEventListeners();
        this.updateDisplay();
        this.generateQRCode();
        this.initOnlineOfflineHandling();
        // Sync mit Server nur wenn eine echte URL konfiguriert ist
        if (this.serverUrl && !this.serverUrl.includes('example.com')) {
            this.syncWithServer();
        } else {
            console.log('Server sync disabled - using demo/local mode');
        }
    }

    async showSyncStatus(message, type = 'info') {
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.textContent = message;
        syncStatus.className = `sync-status visible ${type}`;
        
        setTimeout(() => {
            syncStatus.classList.remove('visible');
        }, 3000);
    }

    initOnlineOfflineHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showSyncStatus('Verbindung wiederhergestellt', 'success');
            // Nur Server-Sync wenn echte URL konfiguriert ist
            if (this.serverUrl && !this.serverUrl.includes('example.com')) {
                this.syncWithServer();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showSyncStatus('Offline-Modus aktiv', 'info');
        });
    }

    async syncWithServer() {
        if (!this.isOnline) return;
        
        // Skip sync wenn Server-URL nicht konfiguriert ist
        if (!this.serverUrl || this.serverUrl.includes('example.com')) {
            console.log('Server sync skipped - demo mode');
            return;
        }
        
        try {
            // Daten vom Server laden
            const response = await fetch(`${this.serverUrl}/data`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const serverData = await response.json();
                
                // Lokale Änderungen mit Server-Daten zusammenführen
                let hasUpdates = false;
                
                if (serverData.schedule) {
                    const localScheduleStr = JSON.stringify(this.schedule);
                    const serverScheduleStr = JSON.stringify(serverData.schedule);
                    if (localScheduleStr !== serverScheduleStr) {
                        this.schedule = { ...this.schedule, ...serverData.schedule };
                        hasUpdates = true;
                    }
                }
                
                if (serverData.notes) {
                    const localNotesStr = JSON.stringify(this.notes);
                    const serverNotesStr = JSON.stringify(serverData.notes);
                    if (localNotesStr !== serverNotesStr) {
                        this.notes = { ...this.notes, ...serverData.notes };
                        hasUpdates = true;
                    }
                }
                
                if (hasUpdates) {
                    this.saveSchedule();
                    this.saveNotes();
                    this.updateDisplay();
                    this.showSyncStatus('Daten synchronisiert', 'success');
                }
            }
        } catch (error) {
            console.log('Sync-Fehler:', error);
            // Kein Fehler anzeigen, da Server möglicherweise nicht verfügbar ist
        }
    }

    async saveToServer() {
        // Skip save wenn Server-URL nicht konfiguriert ist
        if (!this.serverUrl || this.serverUrl.includes('example.com')) {
            console.log('Server save skipped - demo mode');
            return;
        }
        
        if (!this.isOnline) {
            this.showSyncStatus('Offline gespeichert', 'info');
            return;
        }
        
        try {
            const response = await fetch(`${this.serverUrl}/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    schedule: this.schedule,
                    notes: this.notes,
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                this.showSyncStatus('Auf Server gespeichert', 'success');
            } else {
                throw new Error('Server-Fehler');
            }
        } catch (error) {
            console.log('Speicher-Fehler:', error);
            this.showSyncStatus('Lokal gespeichert (Server nicht verfügbar)', 'info');
        }
    }

    loadSchedule() {
        const stored = localStorage.getItem('reha-schedule');
        if (stored) {
            this.schedule = JSON.parse(stored);
        } else {
            this.schedule = { ...this.defaultSchedule };
            this.saveSchedule();
        }
        console.log('Schedule loaded:', Object.keys(this.schedule).length, 'days');
    }

    saveSchedule() {
        // Sicherstellen, dass currentDay existiert
        if (!this.schedule.hasOwnProperty(this.currentDay)) {
            this.schedule[this.currentDay] = '';
            console.log('Created new day entry for day:', this.currentDay);
        }
        localStorage.setItem('reha-schedule', JSON.stringify(this.schedule));
        // Nur Server-Sync wenn echte URL konfiguriert ist
        if (this.serverUrl && !this.serverUrl.includes('example.com')) {
            this.saveToServer();
        }
    }

    loadNotes() {
        const stored = localStorage.getItem('reha-notes');
        if (stored) {
            this.notes = JSON.parse(stored);
        } else {
            this.notes = {};
        }
        console.log('Notes loaded:', Object.keys(this.notes).length, 'notes');
    }

    saveNotes() {
        localStorage.setItem('reha-notes', JSON.stringify(this.notes));
        // Nur Server-Sync wenn echte URL konfiguriert ist
        if (this.serverUrl && !this.serverUrl.includes('example.com')) {
            this.saveToServer();
        }
    }

    getNoteKey(day, itemIndex) {
        return `${day}-${itemIndex}`;
    }

    generateQRCode() {
        const url = window.location.href;
        const qrContainer = document.getElementById('qrCode');
        const qrUrl = document.getElementById('qrUrl');
        
        if (!qrContainer || !qrUrl) {
            console.error('QR code elements not found');
            return;
        }
        
        // Simple QR Code generation using qr-server.com API
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}`;
        
        // QR Code mit Fallback
        qrContainer.innerHTML = `
            <img src="${qrCodeUrl}" 
                 alt="QR Code" 
                 style="width: 120px; height: 120px;" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none; padding: 20px; border: 2px dashed #ccc; text-align: center; font-size: 12px; color: #666;">
                QR-Code<br>nicht verfügbar<br>(Offline-Modus)
            </div>
        `;
        
        qrUrl.textContent = url;
        console.log('QR Code generated for:', url);
    }

    initEventListeners() {
        document.getElementById('prevDay').addEventListener('click', () => {
            if (this.currentDay > 0) {
                this.currentDay--;
                this.updateDisplay();
            }
        });

        document.getElementById('nextDay').addEventListener('click', () => {
            if (this.currentDay < this.maxDays - 1) {
                this.currentDay++;
                this.updateDisplay();
            }
        });

        document.getElementById('titleButton').addEventListener('click', () => {
            const editSection = document.getElementById('editSection');
            const titleButton = document.getElementById('titleButton');
            const isActive = editSection.classList.contains('active');
            
            if (isActive) {
                editSection.classList.remove('active');
                titleButton.textContent = 'Reha Tagesprogramm';
                titleButton.style.background = '';
            } else {
                editSection.classList.add('active');
                titleButton.textContent = 'Bearbeitung schließen';
                titleButton.style.background = 'rgba(255,255,255,0.15)';
                document.getElementById('scheduleEditor').value = this.schedule[this.currentDay] || '';
            }
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            const content = document.getElementById('scheduleEditor').value;
            this.schedule[this.currentDay] = content;
            this.saveSchedule();
            this.updateDisplay();
            
            // Close edit area
            const editSection = document.getElementById('editSection');
            const titleButton = document.getElementById('titleButton');
            editSection.classList.remove('active');
            titleButton.textContent = 'Reha Tagesprogramm';
            titleButton.style.background = '';
        });

        // Notizen Modal Event Listeners
        document.getElementById('noteCancelBtn').addEventListener('click', () => {
            this.closeNoteModal();
        });

        document.getElementById('noteSaveBtn').addEventListener('click', () => {
            this.saveCurrentNote();
        });

        document.getElementById('noteDeleteBtn').addEventListener('click', () => {
            this.deleteCurrentNote();
        });

        // Modal schließen bei Klick außerhalb
        document.getElementById('noteModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('noteModal')) {
                this.closeNoteModal();
            }
        });

        // Set current day to today if we're in the reha period
        const today = new Date();
        const daysSinceStart = Math.floor((today - this.rehaStartDate) / (1000 * 60 * 60 * 24));
        console.log('Days since start:', daysSinceStart, 'Today:', today.toDateString());
        
        if (daysSinceStart >= 0 && daysSinceStart < this.maxDays * 2) { // Erweiterte Prüfung
            // Only count weekdays
            let weekdayCount = 0;
            for (let i = 0; i <= daysSinceStart; i++) {
                const checkDate = new Date(this.rehaStartDate);
                checkDate.setDate(checkDate.getDate() + i);
                const dayOfWeek = checkDate.getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                    weekdayCount++;
                }
            }
            console.log('Weekday count:', weekdayCount);
            if (weekdayCount > 0 && weekdayCount <= this.maxDays) {
                this.currentDay = weekdayCount - 1; // 0-basiert
                console.log('Set current day to:', this.currentDay);
            }
        }
        
        // Spezialfall für 16.07.2025 (heute)
        if (today.getFullYear() === 2025 && today.getMonth() === 6 && today.getDate() === 16) {
            this.currentDay = 12; // Mittwoch, 16.07.2025 ist Tag 12
            console.log('Special case: Set to day 12 for 16.07.2025');
        }
        
        console.log('Current day set to:', this.currentDay);
    }

    openNoteModal(itemIndex, title) {
        this.currentNoteIndex = itemIndex;
        const noteKey = this.getNoteKey(this.currentDay, itemIndex);
        const existingNote = this.notes[noteKey] || '';
        
        document.getElementById('noteModalTitle').textContent = `Notiz: ${title}`;
        document.getElementById('noteTextarea').value = existingNote;
        document.getElementById('noteDeleteBtn').style.display = existingNote ? 'block' : 'none';
        document.getElementById('noteModal').classList.add('active');
        
        // Focus textarea
        setTimeout(() => {
            document.getElementById('noteTextarea').focus();
        }, 100);
    }

    closeNoteModal() {
        document.getElementById('noteModal').classList.remove('active');
        this.currentNoteIndex = null;
    }

    saveCurrentNote() {
        if (this.currentNoteIndex === null) return;
        
        const noteText = document.getElementById('noteTextarea').value.trim();
        const noteKey = this.getNoteKey(this.currentDay, this.currentNoteIndex);
        
        if (noteText) {
            this.notes[noteKey] = noteText;
        } else {
            delete this.notes[noteKey];
        }
        
        this.saveNotes();
        this.closeNoteModal();
        this.updateDisplay();
    }

    deleteCurrentNote() {
        if (this.currentNoteIndex === null) return;
        
        const noteKey = this.getNoteKey(this.currentDay, this.currentNoteIndex);
        delete this.notes[noteKey];
        
        this.saveNotes();
        this.closeNoteModal();
        this.updateDisplay();
    }

    getCurrentDate() {
        let weekdaysCount = 0;
        let currentDate = new Date(this.rehaStartDate);
        
        while (weekdaysCount <= this.currentDay) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                if (weekdaysCount === this.currentDay) {
                    return new Date(currentDate);
                }
                weekdaysCount++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return currentDate;
    }

    formatDate(date) {
        const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        
        return `${days[date.getDay()]}, ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    }

    parseScheduleItem(line) {
        const parts = line.split(' | ');
        if (parts.length >= 2) {
            // Kombiniere Ort und Betreuer in einer Zeile, nur wenn vorhanden
            let locationAndInstructor = '';
            const location = parts[2] ? parts[2].trim() : '';
            const instructor = parts[3] ? parts[3].trim() : '';
            
            if (location && instructor) {
                locationAndInstructor = `${location} • ${instructor}`;
            } else if (location) {
                locationAndInstructor = location;
            } else if (instructor) {
                locationAndInstructor = instructor;
            }
            
            return {
                time: parts[0].trim(),
                title: parts[1].trim(),
                locationAndInstructor: locationAndInstructor,
                type: this.getItemType(parts[1].trim())
            };
        }
        return null;
    }

    getItemType(title) {
        const lower = title.toLowerCase();
        if (lower.includes('essen') || lower.includes('pause')) return 'break';
        if (lower.includes('seminar') || lower.includes('arzt') || lower.includes('psychologe') || lower.includes('entspannung') || lower.includes('ekg')) return 'seminar';
        return 'therapy';
    }

    updateDisplay() {
        const currentDate = this.getCurrentDate();
        const dayInfo = `${this.currentDay + 1}/${this.maxDays} • ${this.formatDate(currentDate)}`;
        document.getElementById('currentDate').textContent = dayInfo;
        
        // Update navigation buttons
        document.getElementById('prevDay').disabled = this.currentDay === 0;
        document.getElementById('nextDay').disabled = this.currentDay === this.maxDays - 1;

        // Update schedule
        this.renderSchedule();
    }

    renderSchedule() {
        const container = document.getElementById('scheduleContainer');
        const scheduleText = this.schedule[this.currentDay] || '';
        
        console.log('Rendering schedule for day', this.currentDay, ':', scheduleText.length, 'characters');
        
        if (!scheduleText.trim()) {
            container.innerHTML = '<div class="no-schedule">Kein Programm für diesen Tag</div>';
            return;
        }

        const lines = scheduleText.split('\n').filter(line => line.trim());
        let html = '';

        lines.forEach((line, index) => {
            const item = this.parseScheduleItem(line);
            if (item) {
                const noteKey = this.getNoteKey(this.currentDay, index);
                const hasNote = this.notes[noteKey];
                
                html += `
                    <div class="schedule-item ${item.type}" data-index="${index}" onclick="app.handleItemClick(${index}, '${item.title.replace(/'/g, '\\\'')}')" style="cursor: pointer;">
                        <div class="note-indicator ${hasNote ? 'visible' : ''}" onclick="event.stopPropagation(); app.toggleNoteDisplay(${index});">●</div>
                        <div class="schedule-time">
                            <span class="schedule-time-text">${item.time}</span>
                            <span class="schedule-title">${item.title}</span>
                        </div>
                        ${item.locationAndInstructor ? `<div class="schedule-location-instructor">${item.locationAndInstructor}</div>` : ''}
                        ${hasNote ? `<div class="schedule-note" id="note-${index}">${hasNote}</div>` : ''}
                    </div>
                `;
            }
        });

        container.innerHTML = html;
        console.log('Rendered', lines.length, 'schedule items');
    }

    handleItemClick(itemIndex, title) {
        console.log('Item clicked:', itemIndex, title);
        this.openNoteModal(itemIndex, title);
    }

    toggleNoteDisplay(itemIndex) {
        console.log('Note indicator clicked:', itemIndex);
        const noteKey = this.getNoteKey(this.currentDay, itemIndex);
        const hasNote = this.notes[noteKey];
        
        if (hasNote) {
            const noteElement = document.getElementById(`note-${itemIndex}`);
            if (noteElement) {
                noteElement.classList.toggle('visible');
            }
        } else {
            this.openNoteModal(itemIndex, 'Termin');
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Auth-UI initialisieren (Anzeige wer angemeldet ist)
    initAuthUI();
    
    // Haupt-App starten
    app = new RehaScheduleApp();
    
    // App global verfügbar machen für Service Worker
    window.app = app;
});


// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker: Registration successful', registration.scope);
                
                // Update verfügbar
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('ServiceWorker: Update found');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('ServiceWorker: New content available');
                                // Optional: Nutzer über Update informieren
                                if (window.app) {
                                    app.showSyncStatus('App-Update verfügbar - Seite neu laden', 'info');
                                }
                            } else {
                                console.log('ServiceWorker: Content cached for offline use');
                                if (window.app) {
                                    app.showSyncStatus('App ist jetzt offline verfügbar', 'success');
                                }
                            }
                        }
                    });
                });
                
                // Check for immediate updates
                registration.update();
            })
            .catch(error => {
                console.error('ServiceWorker: Registration failed', error);
            });
    });
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
        console.log('ServiceWorker message:', event.data);
    });
    
} else {
    console.log('ServiceWorker: Not supported in this browser');
}
