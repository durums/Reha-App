document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("nbShowBtn");

    if (btn) {
        btn.addEventListener("click", () => {
            window.open("Nachbehandlungsplan.pdf", "_blank");
        });
    }

});
