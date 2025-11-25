// Kontaktseite – Chat öffnen
document.getElementById("kt-open-chat")?.addEventListener("click", () => {
  try {
    if (window.userlike && userlike.userlikeApi) {
      userlike.userlikeApi.openChatWindow();  // offizieller Lime/Userlike API call
    } else {
      alert("Der Chat lädt noch. Bitte das blaue Symbol unten rechts anklicken.");
    }
  } catch (err) {
    console.warn("Chat konnte nicht geöffnet werden:", err);
    alert("Bitte das blaue Chat-Feld unten rechts manuell öffnen.");
  }
});
