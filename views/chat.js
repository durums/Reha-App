import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// --- Firebase Init ---
const db = getFirestore();
const auth = getAuth();

// --- UI Elements ---
const contactSelect = document.getElementById("contactSelect");
const messagesContainer = document.getElementById("messagesContainer");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentChat = "fahrer";
let user = null;
let unsubscribe = null;


// =============================
//   AUTH STATE
// =============================
onAuthStateChanged(auth, (u) => {
    if (!u) {
        window.location.href = "../../index.html";
        return;
    }
    user = u;
    loadChat(currentChat);
});


// =============================
//   LOAD CHATROOM
// =============================
function loadChat(room) {
    currentChat = room;

    messagesContainer.innerHTML = "";

    if (unsubscribe) unsubscribe();

    const q = query(
        collection(db, "chats", room, "messages"),
        orderBy("timestamp", "asc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = "";

        snapshot.forEach((doc) => {
            const d = doc.data();

            const div = document.createElement("div");
            div.classList.add("message");

            div.classList.add(
                d.senderUid === user.uid ? "me" : "them"
            );

            div.textContent = d.text;
            messagesContainer.appendChild(div);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}


// =============================
//   SEND MESSAGE
// =============================
async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    await addDoc(collection(db, "chats", currentChat, "messages"), {
        text,
        senderUid: user.uid,
        timestamp: serverTimestamp()
    });

    input.value = "";
}


// =============================
//   EVENT LISTENERS
// =============================
sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") sendMessage();
});

contactSelect.addEventListener("change", (e) => {
    loadChat(e.target.value);
});
