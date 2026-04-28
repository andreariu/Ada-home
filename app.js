import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBE-xO9I0i0eR86SHsDX9lSBU6dbvjMIIo",
  authDomain: "ada-home-4db14.firebaseapp.com",
  projectId: "ada-home-4db14",
  storageBucket: "ada-home-4db14.firebasestorage.app",
  messagingSenderId: "908315649480",
  appId: "1:908315649480:web:5a2549a291a259f15d0cfd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let data = {
  spesa: [],
  faccende: [],
  scadenze: [],
  spese: [],
  note: []
};

let unsubscribers = [];

const $ = (id) => document.getElementById(id);

function todayItalian() {
  const oggi = new Date();
  $("todayDate").textContent = oggi.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

todayItalian();

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString("it-IT");
}

function formatMoney(value) {
  const number = Number(value || 0);
  return number.toFixed(2) + " €";
}

function getCollectionRef(type) {
  return collection(db, "adaHome", type, "items");
}

async function addItem(type, payload) {
  await addDoc(getCollectionRef(type), {
    ...payload,
    createdAt: serverTimestamp()
  });
}

async function removeItem(type, id) {
  await deleteDoc(doc(db, "adaHome", type, "items", id));
}

function renderItem(containerId, type, htmlBuilder) {
  const container = $(containerId);
  container.innerHTML = "";

  data[type].forEach((item) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = htmlBuilder(item);

    const btn = document.createElement("button");
    btn.className = "delete";
    btn.textContent = "Elimina";
    btn.onclick = () => removeItem(type, item.id);

    div.appendChild(btn);
    container.appendChild(div);
  });
}

function renderAll() {
  renderItem("shoppingList", "spesa", (item) => `
    <strong>${escapeHtml(item.text)}</strong>
    <small>${escapeHtml(item.person)} · ${formatDate(item.date)}</small>
  `);

  renderItem("choreList", "faccende", (item) => `
    <strong>${escapeHtml(item.text)}</strong>
    <small>Assegnata a ${escapeHtml(item.person)} · ${formatDate(item.date)}</small>
  `);

  renderItem("deadlineList", "scadenze", (item) => `
    <strong>${escapeHtml(item.text)}</strong>
    <small>${escapeHtml(item.person)} · Scadenza: ${formatDate(item.deadline)}</small>
  `);

  renderItem("expenseList", "spese", (item) => `
    <strong>${escapeHtml(item.text)}</strong>
    <small>${escapeHtml(item.category)} · ${escapeHtml(item.person)} · ${formatDate(item.date)}</small>
    <div class="money">${formatMoney(item.amount)}</div>
  `);

  renderItem("noteList", "note", (item) => `
    <strong>${escapeHtml(item.person)}</strong>
    <small>${formatDate(item.date)}</small>
    <p>${escapeHtml(item.text)}</p>
  `);

  updateStats();
}

function updateStats() {
  $("shoppingCount").textContent = data.spesa.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urgent = data.scadenze.filter((item) => {
    if (!item.deadline) return false;
    const d = new Date(item.deadline);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  }).length;

  $("urgentCount").textContent = urgent;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const total = data.spese
    .filter((item) => {
      const d = new Date(item.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  $("monthExpenses").textContent = formatMoney(total);
}

function startRealtimeSync() {
  stopRealtimeSync();

  ["spesa", "faccende", "scadenze", "spese", "note"].forEach((type) => {
    const q = query(getCollectionRef(type), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      data[type] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      renderAll();
    });

    unsubscribers.push(unsubscribe);
  });
}

function stopRealtimeSync() {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

$("loginBtn").addEventListener("click", async () => {
  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;

  $("loginError").textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    $("loginError").textContent = "Accesso non riuscito. Controlla email e password.";
  }
});

$("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    $("loginBox").style.display = "none";
    $("mainApp").style.display = "block";
    startRealtimeSync();
  } else {
    stopRealtimeSync();
    $("loginBox").style.display = "block";
    $("mainApp").style.display = "none";
  }
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

$("addShoppingBtn").addEventListener("click", async () => {
  const text = $("shoppingText").value.trim();
  if (!text) return;

  await addItem("spesa", {
    text,
    person: $("shoppingPerson").value,
    date: todayISO()
  });

  $("shoppingText").value = "";
});

$("addChoreBtn").addEventListener("click", async () => {
  const text = $("choreText").value.trim();
  if (!text) return;

  await addItem("faccende", {
    text,
    person: $("chorePerson").value,
    date: todayISO()
  });

  $("choreText").value = "";
});

$("addDeadlineBtn").addEventListener("click", async () => {
  const text = $("deadlineText").value.trim();
  const deadline = $("deadlineDate").value;

  if (!text || !deadline) return;

  await addItem("scadenze", {
    text,
    deadline,
    person: $("deadlinePerson").value,
    date: todayISO()
  });

  $("deadlineText").value = "";
  $("deadlineDate").value = "";
});

$("addExpenseBtn").addEventListener("click", async () => {
  const text = $("expenseText").value.trim();
  const amount = Number($("expenseAmount").value);

  if (!text || !amount) return;

  await addItem("spese", {
    text,
    amount,
    category: $("expenseCategory").value,
    person: $("expensePerson").value,
    date: todayISO()
  });

  $("expenseText").value = "";
  $("expenseAmount").value = "";
});

$("addNoteBtn").addEventListener("click", async () => {
  const text = $("noteText").value.trim();
  if (!text) return;

  await addItem("note", {
    text,
    person: $("notePerson").value,
    date: todayISO()
  });

  $("noteText").value = "";
});
