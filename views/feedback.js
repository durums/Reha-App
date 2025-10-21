(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("feedbackForm");
  const list = $("feedbackList");
  const user = window.currentUserName || "Anonym";

  // === Laden (lokal oder Firebase) ===
  async function loadFeedback() {
    list.innerHTML = "<li>Lade Feedback …</li>";
    try {
      if (window.db) {
        // 🔹 Mit Firestore
        const { getDocs, collection, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const snap = await getDocs(query(collection(window.db, "feedback"), orderBy("created", "desc")));
        list.innerHTML = "";
        snap.forEach(doc => {
          const d = doc.data();
          list.append(makeItem(d.user, d.text, d.rating, d.created?.toDate?.() || new Date()));
        });
      } else {
        // 🔹 Lokal
        const arr = JSON.parse(localStorage.getItem("feedback") || "[]");
        list.innerHTML = "";
        arr.sort((a,b)=> b.created - a.created).forEach(d => {
          list.append(makeItem(d.user, d.text, d.rating, new Date(d.created)));
        });
      }
    } catch (err) {
      console.error("Feedback laden fehlgeschlagen:", err);
      list.innerHTML = "<li>⚠️ Konnte Feedback nicht laden.</li>";
    }
  }

  // === Eintrag erzeugen ===
  function makeItem(u, t, r, d) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${u}</strong> – ${"⭐".repeat(r)}<br>${t}<br><small>${d.toLocaleString()}</small>`;
    return li;
  }

  // === Absenden ===
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("fbText").value.trim();
    const rating = parseInt($("fbRating").value);
    if (!text || !rating) return alert("Bitte alle Felder ausfüllen.");

    const entry = { user, text, rating, created: Date.now() };

    try {
      if (window.db) {
        // 🔹 Firestore speichern
        const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        await addDoc(collection(window.db, "feedback"), { ...entry, created: serverTimestamp() });
      } else {
        // 🔹 Lokal speichern
        const arr = JSON.parse(localStorage.getItem("feedback") || "[]");
        arr.push(entry);
        localStorage.setItem("feedback", JSON.stringify(arr));
      }

      $("fbText").value = "";
      $("fbRating").value = "";
      alert("Vielen Dank für Ihr Feedback!");
      loadFeedback();
    } catch (err) {
      console.error("Feedback speichern fehlgeschlagen:", err);
      alert("⚠️ Feedback konnte nicht gespeichert werden.");
    }
  });

  // Beim Laden anzeigen
  document.addEventListener("DOMContentLoaded", loadFeedback);
})();
