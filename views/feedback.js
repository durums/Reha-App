// feedback.js – Vollständiges Feedback-Modal System
(() => {
  // === Modal dynamisch erstellen (einmalig beim Laden) ===
  function createModal() {
    const modalHTML = `
      <div id="feedbackModal" class="feedback-modal-overlay">
        <div class="feedback-modal-card">
          <button class="feedback-close" aria-label="Schließen">&times;</button>
          <h2>Feedback geben</h2>
          <form id="feedbackForm">
            <label>
              Wie zufrieden bist du?
              <select name="rating" required>
                <option value="">Bitte wählen</option>
                <option value="5">⭐⭐⭐⭐⭐ Sehr zufrieden</option>
                <option value="4">⭐⭐⭐⭐ Zufrieden</option>
                <option value="3">⭐⭐⭐ Neutral</option>
                <option value="2">⭐⭐ Verbesserungsbedarf</option>
                <option value="1">⭐ Schlecht</option>
              </select>
            </label>
            <label>
              Deine Nachricht:
              <textarea name="message" rows="4" placeholder="Was können wir verbessern?" required></textarea>
            </label>
            <div class="feedback-actions">
              <button type="button" class="btn-cancel">Abbrechen</button>
              <button type="submit" class="btn-send">Senden</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // === Modal öffnen ===
  function openModal() {
    let modal = document.getElementById('feedbackModal');
    if (!modal) {
      createModal();
      modal = document.getElementById('feedbackModal');
    }
    modal.style.display = 'grid';
    document.body.style.overflow = 'hidden'; // Hintergrund sperren
    modal.querySelector('select').focus(); // Barrierefreiheit
  }

  // === Modal schließen ===
  function closeModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('feedbackForm').reset();
  }

  // === Daten speichern ===
  async function saveFeedback(data) {
    const feedbacks = JSON.parse(localStorage.getItem('rehapp:feedback') || '[]');
    feedbacks.push(data);
    localStorage.setItem('rehapp:feedback', JSON.stringify(feedbacks));
    console.log('Feedback lokal gespeichert:', data);
    }

  // === Initialisierung ===
  function init() {
    // Button finden (muss die ID #help-feedback haben)
    const btn = document.getElementById('help-feedback');
    if (!btn) {
      console.warn('Feedback-Button (#help-feedback) nicht gefunden');
      return;
    }

    // Event: Button klickt → Modal öffnet
    btn.addEventListener('click', openModal);

    // Event: Modal schließen
    document.addEventListener('click', (e) => {
      if (e.target.id === 'feedbackModal') closeModal();
      if (e.target.classList.contains('feedback-close')) closeModal();
      if (e.target.classList.contains('btn-cancel')) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Event: Formular absenden
    document.addEventListener('submit', async (e) => {
      if (e.target.id !== 'feedbackForm') return;
      e.preventDefault();

      const formData = new FormData(e.target);
      const data = {
        rating: parseInt(formData.get('rating')),
        message: formData.get('message').trim(),
        user: window.currentUserName || 'Anonym',
        timestamp: new Date().toISOString()
      };

      if (!data.message || !data.rating) {
        alert('Bitte fülle alle Felder aus.');
        return;
      }

      await saveFeedback(data);
      alert('✅ Vielen Dank für dein Feedback!');
      closeModal();
    });
  }

  // === Starten, wenn DOM bereit ist ===
  document.addEventListener('DOMContentLoaded', init);
})();