document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("help-feedback");
  if (btn) {
    btn.addEventListener("click", () => {
      alert("Feedback-Funktion ist in Arbeit. Vielen Dank für dein Interesse!");
    });
  }
});
