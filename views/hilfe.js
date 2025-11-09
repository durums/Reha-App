// hilfe.js – Lädt nur noch das Feedback-System
document.addEventListener('DOMContentLoaded', () => {
  // Sicherstellen, dass feedback.js geladen ist
  const script = document.createElement('script');
  script.src = '/js/feedback.js'; // <== PFAD ANPASSEN!
  script.defer = true;
  document.head.appendChild(script);
});