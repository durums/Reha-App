// === Chat nur auf der Kontakt-Seite laden ===

// Widget URL
const USERLIKE_WIDGET_URL = "https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/f28ed9cb34d044ca93e9ce9a24fdb449be202b7f19424260a81d47893accc995.js";

// Chat laden
function loadChatWidget() {
  // Bereits geladen?
  if (document.getElementById("userlike-widget-script")) return;

  const s = document.createElement("script");
  s.id = "userlike-widget-script";
  s.src = USERLIKE_WIDGET_URL;
  s.async = true;
  document.body.appendChild(s);
}

// Chat entfernen, wenn weg navigiert wird
function unloadChatWidget() {
  const script = document.getElementById("userlike-widget-script");
  if (script) script.remove();

  // UI-Elemente des Widgets entfernen
  const bubble = document.querySelector("[id^='userlike-']");
  if (bubble) bubble.remove();
}

// Beim Öffnen der Kontaktseite laden
loadChatWidget();

// Wenn man weg navigiert (#hashchange), entfernen
window.addEventListener("hashchange", () => {
  if (location.hash !== "#kontakt") {
    unloadChatWidget();
  }
});
