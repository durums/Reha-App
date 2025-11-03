(() => {
  const form = document.getElementById("signup-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("su-email").value.trim();
    const pw    = document.getElementById("su-password").value;
    try {
      await createUserWithEmailAndPassword(window.auth, email, pw);
      alert("Konto erstellt. Du bist jetzt angemeldet.");
      location.hash = "#tagesprogramm";
    } catch (err) {
      alert(`Registrierung fehlgeschlagen: ${err.code}`);
    }
  });
})();
