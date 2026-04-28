/* ADA Home - app.js completo corretto
   Firebase + login + sincronizzazione + semaforo urgenze + home sistemata
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =========================
   CONFIG FIREBASE
========================= */

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

let currentUser = null;
let allItems = [];
let unsubscribeData = null;

const FAMILY = ["Andrea", "Daniela", "Antonio"];

/* =========================
   CSS COMPLETO APP
========================= */

function injectCss() {
  const old = document.getElementById("ada-dynamic-style");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "ada-dynamic-style";

  style.textContent = `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0 !important;
      min-height: 100vh;
      background: #f4f7f3 !important;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .ada-wrap {
      width: min(760px, calc(100% - 28px));
      margin: 0 auto;
      padding: 26px 0 48px;
    }

    .hero {
      background: linear-gradient(135deg, #2f7d46, #14532d) !important;
      color: white !important;
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 18px 36px rgba(0,0,0,.14);
      margin-bottom: 18px;
    }

    .hero h1 {
      margin: 0 0 8px;
      font-size: 34px;
      line-height: 1.1;
    }

    .hero p {
      margin: 0 0 18px;
      opacity: .92;
      font-size: 17px;
    }

    .family-pill {
      display: inline-block;
      padding: 10px 16px;
      border-radius: 999px;
      background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.24);
      font-size: 15px;
    }

    .card {
      background: white !important;
      border-radius: 26px;
      padding: 24px;
      border: 1px solid rgba(0,0,0,.06);
      box-shadow: 0 14px 32px rgba(0,0,0,.08);
      margin-bottom: 18px;
    }

    .card h2 {
      margin: 0 0 14px;
      font-size: 25px;
    }

    .muted {
      color: #6b7280;
      font-size: 14px;
    }

    input,
    select,
    textarea {
      width: 100% !important;
      min-height: 52px !important;
      border: 1px solid #d9e1dc !important;
      border-radius: 16px !important;
      padding: 0 14px !important;
      margin: 8px 0 !important;
      font-size: 16px !important;
      background: white !important;
      color: #1f2937 !important;
    }

    textarea {
      min-height: 110px !important;
      padding-top: 14px !important;
      resize: vertical;
    }

    .btn {
      width: 100% !important;
      min-height: 54px !important;
      border: none !important;
      border-radius: 16px !important;
      background: #2f7d46 !important;
      color: white !important;
      font-size: 17px !important;
      font-weight: 800 !important;
      margin-top: 10px !important;
      cursor: pointer;
    }

    .btn:active {
      transform: scale(.98);
    }

    .logout {
      margin-top: 18px !important;
      width: auto !important;
      min-height: 42px !important;
      padding: 0 16px !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.16) !important;
      color: white !important;
      border: 1px solid rgba(255,255,255,.28) !important;
      font-weight: 700 !important;
      font-size: 14px !important;
    }

    .stats {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }

    .stat {
      background: white;
      border: 1px solid rgba(0,0,0,.06);
      border-radius: 20px;
      padding: 18px;
      box-shadow: 0 10px 24px rgba(0,0,0,.05);
    }

    .stat strong {
      display: block;
      font-size: 30px;
      color: #2f7d46;
      line-height: 1;
      margin-bottom: 5px;
    }

    .tabs {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 4px 0 14px;
      margin-bottom: 8px;
    }

    .tab {
      flex: 0 0 auto !important;
      width: auto !important;
      min-height: 44px !important;
      padding: 0 18px !important;
      border: 1px solid rgba(0,0,0,.08) !important;
      border-radius: 999px !important;
      background: white !important;
      color: #1f2937 !important;
      font-size: 15px !important;
      font-weight: 800 !important;
      box-shadow: 0 7px 18px rgba(0,0,0,.06);
      cursor: pointer;
      margin: 0 !important;
      white-space: nowrap;
    }

    .tab.active {
      background: #2f7d46 !important;
      color: white !important;
    }

    .panel {
      display: none;
    }

    .panel.active {
      display: block;
    }

    .item {
      position: relative;
      background: #fbfbfb;
      border: 1px solid rgba(0,0,0,.07);
      border-radius: 20px;
      padding: 16px;
      margin-top: 12px;
    }

    .item.with-light {
      padding-left: 54px;
    }

    .item strong {
      display: block;
      font-size: 17px;
      margin-bottom: 5px;
    }

    .item small {
      display: block;
      color: #6b7280;
      line-height: 1.4;
    }

    .money {
      color: #2f7d46;
      font-size: 19px;
      font-weight: 900;
      margin-top: 8px;
    }

    .delete {
      width: 100% !important;
      min-height: 40px !important;
      border: none !important;
      border-radius: 14px !important;
      background: #ffe1e1 !important;
      color: #b42318 !important;
      font-weight: 800 !important;
      margin-top: 12px !important;
      cursor: pointer;
    }

    .semaforo {
      position: absolute;
      left: 17px;
      top: 18px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(0,0,0,.04);
    }

    .semaforo.verde {
      background: #22c55e;
    }

    .semaforo.giallo {
      background: #facc15;
    }

    .semaforo.rosso {
      background: #ef4444;
    }

    .badge {
      display: inline-block;
      margin-top: 8px;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 900;
    }

    .badge.verde {
      background: #dcfce7;
      color: #166534;
    }

    .badge.giallo {
      background: #fef9c3;
      color: #854d0e;
    }

    .badge.rosso {
      background: #fee2e2;
      color: #991b1b;
    }

    .error {
      color: #b42318;
      font-weight: 800;
      margin-top: 12px;
    }

    @media (min-width: 650px) {
      .stats {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================
   LOGIN
========================= */

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (unsubscribeData) {
    unsubscribeData();
    unsubscribeData = null;
  }

  if (!user) {
    renderLogin();
    return;
  }

  listenData();
});

function renderLogin(errorMessage = "") {
  injectCss();

  document.body.innerHTML = `
    <main class="ada-wrap">
      <section class="hero">
        <h1>ADA Home</h1>
        <p>Gestione quotidiana della famiglia</p>
        <span class="family-pill">Andrea · Daniela · Antonio</span>
      </section>

      <section class="card">
        <h2>Accesso famiglia</h2>
        <p class="muted">Accedi per sincronizzare i dati tra tutti i dispositivi.</p>

        <input id="loginEmail" type="email" placeholder="Email">
        <input id="loginPassword" type="password" placeholder="Password">

        <button class="btn" id="loginBtn">Accedi</button>

        ${errorMessage ? `<div class="error">${escapeHtml(errorMessage)}</div>` : ""}
      </section>
    </main>
  `;

  document.getElementById("loginBtn").addEventListener("click", login);
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    renderLogin("Inserisci email e password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    renderLogin("Accesso non riuscito. Controlla email e password.");
  }
}

async function logout() {
  await signOut(auth);
}

/* =========================
   FIRESTORE
========================= */

function listenData() {
  unsubscribeData = onSnapshot(collection(db, "adaHome"), (snapshot) => {
    allItems = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    allItems.sort((a, b) => {
      const ad = a.createdAt?.seconds || 0;
      const bd = b.createdAt?.seconds || 0;
      return bd - ad;
    });

    renderApp();
  }, () => {
    renderApp("Errore lettura database. Controlla le regole Firebase.");
  });
}

async function addItem(type, data) {
  await addDoc(collection(db, "adaHome"), {
    type,
    ...data,
    date: todayISO(),
    createdAt: serverTimestamp(),
    createdBy: currentUser?.email || ""
  });
}

async function removeItem(id) {
  await deleteDoc(doc(db, "adaHome", id));
}

/* =========================
   HOME APP
========================= */

function renderApp(errorMessage = "") {
  injectCss();

  const shopping = allItems.filter(x => x.type === "spesa");
  const chores = allItems.filter(x => x.type === "faccende");
  const deadlines = allItems.filter(x => x.type === "scadenze");
  const expenses = allItems.filter(x => x.type === "spese");
  const notes = allItems.filter(x => x.type === "note");

  const urgentCount = [...shopping, ...chores, ...deadlines]
    .filter(x => getStatus(x) === "rosso").length;

  const expensesMonthTotal = expenses
    .filter(x => isCurrentMonth(x.date))
    .reduce((sum, x) => sum + Number(x.amount || 0), 0);

  document.body.innerHTML = `
    <main class="ada-wrap">
      <section class="hero">
        <h1>ADA Home</h1>
        <p>Gestione quotidiana della famiglia</p>
        <span class="family-pill">Andrea · Daniela · Antonio</span>
        <br>
        <button class="logout" id="logoutBtn">Esci</button>
      </section>

      ${errorMessage ? `<section class="card error">${escapeHtml(errorMessage)}</section>` : ""}

      <section class="stats">
        <div class="stat">
          <strong>${urgentCount}</strong>
          Urgenti
        </div>
        <div class="stat">
          <strong>${shopping.length}</strong>
          Spesa
        </div>
        <div class="stat">
          <strong>${formatMoney(expensesMonthTotal)}</strong>
          Spese mese
        </div>
      </section>

      <nav class="tabs">
        <button class="tab active" data-tab="spesa">Spesa</button>
        <button class="tab" data-tab="faccende">Faccende</button>
        <button class="tab" data-tab="scadenze">Scadenze</button>
        <button class="tab" data-tab="spese">Spese</button>
        <button class="tab" data-tab="note">Note</button>
      </nav>

      <section class="card panel active" id="panel-spesa">
        <h2>Lista spesa</h2>
        <input id="shoppingText" placeholder="Es. Pane, detersivo, acqua">
        ${personSelect("shoppingPerson")}
        ${prioritySelect("shoppingPriority")}
        <button class="btn" id="addShoppingBtn">Aggiungi</button>
        <div>${renderItems(shopping)}</div>
      </section>

      <section class="card panel" id="panel-faccende">
        <h2>Faccende di casa</h2>
        <input id="choreText" placeholder="Es. Pulire cucina, buttare immondizia">
        ${personSelect("chorePerson")}
        ${prioritySelect("chorePriority")}
        <button class="btn" id="addChoreBtn">Aggiungi</button>
        <div>${renderItems(chores)}</div>
      </section>

      <section class="card panel" id="panel-scadenze">
        <h2>Scadenze</h2>
        <input id="deadlineText" placeholder="Es. Bolletta luce, assicurazione">
        <input id="deadlineDate" type="date">
        ${personSelect("deadlinePerson")}
        <button class="btn" id="addDeadlineBtn">Aggiungi</button>
        <div>${renderItems(deadlines)}</div>
      </section>

      <section class="card panel" id="panel-spese">
        <h2>Spese familiari</h2>
        <input id="expenseText" placeholder="Descrizione">
        <input id="expenseAmount" type="number" step="0.01" placeholder="Importo €">
        <select id="expenseCategory">
          <option>Casa</option>
          <option>Spesa</option>
          <option>Auto</option>
          <option>Bollette</option>
          <option>Salute</option>
          <option>Famiglia</option>
          <option>Extra</option>
        </select>
        ${personSelect("expensePerson")}
        <button class="btn" id="addExpenseBtn">Aggiungi</button>
        <div>${renderItems(expenses)}</div>
      </section>

      <section class="card panel" id="panel-note">
        <h2>Note famiglia</h2>
        <textarea id="noteText" placeholder="Scrivi una nota"></textarea>
        ${personSelect("notePerson")}
        <button class="btn" id="addNoteBtn">Aggiungi</button>
        <div>${renderItems(notes)}</div>
      </section>
    </main>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
    });
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await removeItem(btn.dataset.delete);
    });
  });

  document.getElementById("addShoppingBtn").addEventListener("click", async () => {
    const text = val("shoppingText");
    if (!text) return;

    await addItem("spesa", {
      text,
      person: val("shoppingPerson"),
      priority: val("shoppingPriority")
    });
  });

  document.getElementById("addChoreBtn").addEventListener("click", async () => {
    const text = val("choreText");
    if (!text) return;

    await addItem("faccende", {
      text,
      person: val("chorePerson"),
      priority: val("chorePriority")
    });
  });

  document.getElementById("addDeadlineBtn").addEventListener("click", async () => {
    const text = val("deadlineText");
    const deadline = val("deadlineDate");

    if (!text) return;

    await addItem("scadenze", {
      text,
      person: val("deadlinePerson"),
      deadline
    });
  });

  document.getElementById("addExpenseBtn").addEventListener("click", async () => {
    const text = val("expenseText");
    const amount = Number(val("expenseAmount") || 0);

    if (!text || amount <= 0) return;

    await addItem("spese", {
      text,
      amount,
      category: val("expenseCategory"),
      person: val("expensePerson")
    });
  });

  document.getElementById("addNoteBtn").addEventListener("click", async () => {
    const text = val("noteText");
    if (!text) return;

    await addItem("note", {
      text,
      person: val("notePerson")
    });
  });
}

/* =========================
   RENDER ELEMENTI
========================= */

function renderItems(items) {
  if (!items.length) {
    return `<p class="muted">Nessun elemento inserito.</p>`;
  }

  return items.map((item) => {
    const status = getStatus(item);
    const label = getStatusLabel(item, status);

    let details = "";

    if (item.type === "spese") {
      details = `
        <small>${escapeHtml(item.category || "Spesa")} · ${escapeHtml(item.person || "")} · ${formatDate(item.date)}</small>
        <div class="money">${formatMoney(item.amount)}</div>
      `;
    } else if (item.type === "scadenze") {
      details = `
        <small>${escapeHtml(item.person || "")} · Scadenza: ${formatDate(item.deadline)}</small>
        <span class="badge ${status}">${label}</span>
      `;
    } else if (item.type === "note") {
      details = `
        <small>${escapeHtml(item.person || "")} · ${formatDate(item.date)}</small>
      `;
    } else {
      details = `
        <small>${escapeHtml(item.person || "")} · ${formatDate(item.date)}</small>
        <span class="badge ${status}">${label}</span>
      `;
    }

    const hasLight = item.type !== "spese" && item.type !== "note";
    const light = hasLight ? `<span class="semaforo ${status}"></span>` : "";
    const lightClass = hasLight ? "with-light" : "";

    return `
      <div class="item ${lightClass}">
        ${light}
        <strong>${escapeHtml(item.text || "")}</strong>
        ${details}
        <button class="delete" data-delete="${item.id}">Elimina</button>
      </div>
    `;
  }).join("");
}

function personSelect(id) {
  return `
    <select id="${id}">
      ${FAMILY.map(p => `<option>${p}</option>`).join("")}
    </select>
  `;
}

function prioritySelect(id) {
  return `
    <select id="${id}">
      <option value="verde">Verde - normale</option>
      <option value="giallo">Giallo - importante</option>
      <option value="rosso">Rosso - urgente</option>
    </select>
  `;
}

/* =========================
   SEMAFORO
========================= */

function getStatus(item) {
  if (item.type === "scadenze") {
    return deadlineStatus(item.deadline);
  }

  if (item.priority === "rosso") return "rosso";
  if (item.priority === "giallo") return "giallo";

  return "verde";
}

function deadlineStatus(deadline) {
  if (!deadline) return "verde";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "rosso";
  if (diffDays <= 7) return "giallo";

  return "verde";
}

function getStatusLabel(item, status) {
  if (item.type === "scadenze") {
    if (status === "rosso") return "Scaduta / oggi";
    if (status === "giallo") return "In scadenza";
    return "Sotto controllo";
  }

  if (status === "rosso") return "Urgente";
  if (status === "giallo") return "Importante";

  return "Normale";
}

/* =========================
   UTILITY
========================= */

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isCurrentMonth(dateString) {
  if (!dateString) return false;

  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();

  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function formatMoney(value) {
  const n = Number(value || 0);

  return n.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR"
  });
}

function formatDate(dateString) {
  if (!dateString) return "non impostata";

  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString("it-IT");
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
