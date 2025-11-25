document.getElementById("menu-kontaktieren")?.addEventListener("click", () => {
  location.hash = "kontakt";
});

// Wenn die Seite Kontakt angezeigt wird, Panel sichtbar machen
function loadKontaktView() {
  const view = document.getElementById("kontakt-view");
  const other = document.querySelectorAll(".main-content > *:not(#kontakt-view)");

  other.forEach(el => el.style.display = "none");
  if (view) view.style.display = "block";
}

// Button „Chat jetzt öffnen“
document.getElementById("openChatBtn")?.addEventListener("click", () => {
  try {
    userlike.userlikeApi.openChatWindow();   // offizieller Userlike JS-Call
  } catch (e) {
    console.warn("Chat kann nicht geöffnet werden:", e);
  }
});

// Hash-Routing anpassen
window.addEventListener("hashchange", () => {
  if (location.hash === "#kontakt") {
    loadKontaktView();
  }
});
