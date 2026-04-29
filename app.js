/* ADA Home - app.js completo
   Firebase + login + semaforo + dashboard + calendario + notifiche base
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

/* =========================================================
   CONFIG FIREBASE
   ATTENZIONE: qui devi mettere i valori reali Firebase.
   Non lasciare INCOLLA_...
========================================================= */

const firebaseConfig = {
  apiKey: "INCOLLA_LA_TUA_API_KEY",
  authDomain: "ada-home-4db14.firebaseapp.com",
  projectId: "ada-home-4db14",
  storageBucket: "ada-home-4db14.firebasestorage.app",
  messagingSenderId: "INCOLLA_MESSAGING_SENDER_ID",
  appId: "INCOLLA_APP_ID"
};

/* =========================================================
   AVVIO FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let allItems = [];
let unsubscribeData = null;
let activeTab = "dashboard";

const FAMILY = ["Andrea", "Daniela", "Antonio"];

const TYPES = {
  spesa: "Spesa",
  faccende: "Faccende",
  scadenze: "Scadenze",
  spese: "Spese",
  note: "Note",
  calendario: "Calendario"
};

/* =========================================================
   CSS
========================================================= */

function injectCss() {
  const old = document.getElementById("ada-dynamic-style");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "ada-dynamic-style";

  style.textContent = `
    * {
      box-sizing: border-box;
    }

    html {
      -webkit-text-size-adjust: 100%;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: #f4f7f3;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .ada-wrap {
      width: min(860px, calc(100% - 28px));
      margin: 0 auto;
      padding: 26px 0 56px;
    }

    .hero {
      background: linear-gradient(135deg, #2f7d46, #14532d);
      color: white;
      border-radius: 28px;
      padding: 30px;
      box-shadow: 0 18px 36px rgba(0,0,0,.14);
      margin-bottom: 18px;
    }

    .hero h1 {
      margin: 0 0 8px;
      font-size: 38px;
      line-height: 1.1;
    }

    .hero p {
      margin: 0 0 14px;
      opacity: .92;
      font-size: 18px;
    }

    .family-pill {
      display: inline-block;
      padding: 10px 16px;
      border-radius: 999px;
      background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.24);
      font-size: 15px;
      margin-bottom: 12px;
    }

    .top-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 10px;
    }

    .mini-btn {
      min-height: 42px;
      padding: 0 16px;
      border-radius: 999px;
      background: rgba(255,255,255,.16);
      color: white;
      border: 1px solid rgba(255,255,255,.28);
      font-weight: 800;
      cursor: pointer;
    }

    .mini-text {
      font-size: 13px;
      opacity: .9;
    }

    .card {
      background: white;
      border-radius: 26px;
      padding: 24px;
      border: 1px solid rgba(0,0,0,.06);
      box-shadow: 0 14px 32px rgba(0,0,0,.08);
      margin-bottom: 18px;
    }

    .card h2 {
      margin: 0 0 14px;
      font-size: 26px;
    }

    .card h3 {
      margin: 0 0 12px;
      font-size: 21px;
    }

    .muted {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.4;
    }

    input,
    select,
    textarea {
      width: 100%;
      min-height: 52px;
      border: 1px solid #d9e1dc;
      border-radius: 16px;
      padding: 0 14px;
      margin: 8px 0;
      font-size: 16px;
      background: white;
      color: #1f2937;
    }

    textarea {
      min-height: 110px;
      padding-top: 14px;
      resize: vertical;
    }

    .btn {
      width: 100%;
      min-height: 54px;
      border: none;
      border-radius: 16px;
      background: #2f7d46;
      color: white;
      font-size: 17px;
      font-weight: 900;
      margin-top: 10px;
      cursor: pointer;
    }

    .btn:active,
    .tab:active,
    .delete:active,
    .mini-btn:active {
      transform: scale(.98);
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
      -webkit-overflow-scrolling: touch;
    }

    .tab {
      flex: 0 0 auto;
      width: auto;
      min-height: 44px;
      padding: 0 18px;
      border: 1px solid rgba(0,0,0,.08);
      border-radius: 999px;
      background: white;
      color: #1f2937;
      font-size: 15px;
      font-weight: 900;
      box-shadow: 0 7px 18px rgba(0,0,0,.06);
      cursor: pointer;
    }

    .tab.active {
      background: #2f7d46;
      color: white;
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
      padding-left: 56px;
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
      width: 100%;
      min-height: 40px;
      border: none;
      border-radius: 14px;
      background: #ffe1e1;
      color: #b42318;
      font-weight: 900;
      margin-top: 12px;
      cursor: pointer;
    }

    .semaforo {
      position: absolute;
      left: 18px;
      top: 19px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(0,0,0,.04);
    }

    .verde {
      background: #22c55e;
    }

    .giallo {
      background: #facc15;
    }

    .rosso {
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
      font-weight: 900;
      margin-top: 12px;
      line-height: 1.4;
    }

    .dash-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .person-card {
      border: 1px solid rgba(0,0,0,.07);
      border-radius: 22px;
      padding: 18px;
      background: #fbfbfb;
    }

    .person-card h3 {
      margin: 0 0 12px;
    }

    .priority-row {
      display: grid;
      grid-template-columns: 18px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,.05);
    }

    .priority-row:last-child {
      border-bottom: none;
    }

    .dot {
      width: 15px;
      height: 15px;
      border-radius: 50%;
    }

    .type-list {
      margin-top: 12px;
      display: grid;
      gap: 8px;
    }

    .type-chip {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 14px;
      background: white;
      border: 1px solid rgba(0,0,0,.06);
      font-size: 14px;
    }

    .calendar-box {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .date-range {
      display: inline-block;
      margin-top: 6px;
      padding: 5px 10px;
      border-radius: 999px;
      background: #eef6ee;
      color: #14532d;
      font-size: 13px;
      font-weight: 800;
    }

    @media (min-width: 700px) {
      .stats {
        grid-template-columns: repeat(4, 1fr);
      }

      .dash-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .calendar-box {
        grid-template-columns: 1fr 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   LOGIN
========================================================= */

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

        <input id="loginEmail" type="email" placeholder="Email" autocomplete="email">
        <input id="loginPassword" type="password" placeholder="Password" autocomplete="current-password">

        <button class="btn" id="loginBtn">Accedi</button>

        ${errorMessage ? `<div class="error">${escapeHtml(errorMessage)}</div>` : ""}

        <p class="muted">
          Se continua a dare errore, controlla che in Firebase sia attivo Email/password
          e che il dominio andreariu.github.io sia autorizzato.
        </p>
      </section>
    </main>
  `;

  document.getElementById("loginBtn").addEventListener("click", login);

  document.getElementById("loginPassword").addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    renderLogin("Inserisci email e password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Errore login Firebase:", error);
    renderLogin("Accesso non riuscito. Errore Firebase: " + error.code);
  }
}

async function logout() {
  await signOut(auth);
}

/* =========================================================
   FIRESTORE
========================================================= */

function listenData() {
  unsubscribeData = onSnapshot(
    collection(db, "adaHome"),
    (snapshot) => {
      allItems = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      allItems.sort((a, b) => {
        const pa = priorityWeight(getStatus(a));
        const pb = priorityWeight(getStatus(b));

        if (pa !== pb) return pb - pa;

        const ad = a.createdAt?.seconds || 0;
        const bd = b.createdAt?.seconds || 0;
        return bd - ad;
      });

      renderApp();
      checkCalendarNotifications();
    },
    (error) => {
      console.error("Errore Firestore:", error);
      renderApp("Errore database: " + error.code);
    }
  );
}

async function addItem(type, data) {
  try {
    await addDoc(collection(db, "adaHome"), {
      type,
      ...data,
      createdAt: serverTimestamp(),
      createdBy: currentUser?.email || ""
    });
  } catch (error) {
    console.error("Errore inserimento:", error);
    alert("Errore inserimento: " + error.code);
  }
}

async function removeItem(id) {
  try {
    await deleteDoc(doc(db, "adaHome", id));
  } catch (error) {
    console.error("Errore eliminazione:", error);
    alert("Errore eliminazione: " + error.code);
  }
}

/* =========================================================
   HOME APP
========================================================= */

function renderApp(errorMessage = "") {
  injectCss();

  const shopping = byType("spesa");
  const chores = byType("faccende");
  const deadlines = byType("scadenze");
  const expenses = byType("spese");
  const notes = byType("note");
  const calendar = byType("calendario");

  const priorityItems = allItems.filter(x =>
    ["spesa", "faccende", "scadenze", "calendario"].includes(x.type)
  );

  const urgentCount = priorityItems.filter(x => getStatus(x) === "rosso").length;
  const yellowCount = priorityItems.filter(x => getStatus(x) === "giallo").length;

  const expensesTotal = expenses.reduce((sum, x) => {
    return sum + Number(x.amount || 0);
  }, 0);

  document.body.innerHTML = `
    <main class="ada-wrap">
      <section class="hero">
        <h1>ADA Home</h1>
        <p>Gestione quotidiana della famiglia</p>
        <span class="family-pill">Andrea · Daniela · Antonio</span>

        <div class="top-row">
          <button class="mini-btn" id="notifyBtn">Attiva notifiche</button>
          <button class="mini-btn" id="logoutBtn">Esci</button>
          <span class="mini-text">${escapeHtml(currentUser?.email || "")}</span>
        </div>
      </section>

      ${errorMessage ? `<section class="card error">${escapeHtml(errorMessage)}</section>` : ""}

      <section class="stats">
        <div class="stat">
          <strong>${urgentCount}</strong>
          Urgenti
        </div>
        <div class="stat">
          <strong>${yellowCount}</strong>
          Importanti
        </div>
        <div class="stat">
          <strong>${shopping.length}</strong>
          Spesa
        </div>
        <div class="stat">
          <strong>${formatMoney(expensesTotal)}</strong>
          Spese
        </div>
      </section>

      <nav class="tabs">
        ${tabButton("dashboard", "Dashboard")}
        ${tabButton("spesa", "Spesa")}
        ${tabButton("faccende", "Faccende")}
        ${tabButton("scadenze", "Scadenze")}
        ${tabButton("calendario", "Calendario")}
        ${tabButton("spese", "Spese")}
        ${tabButton("note", "Note")}
      </nav>

      <section class="card panel ${panelClass("dashboard")}" id="panel-dashboard">
        <h2>Dashboard urgenze</h2>
        <p class="muted">Qui vedi cosa deve fare ogni persona, diviso per urgenza e tipologia.</p>
        ${renderDashboard()}
      </section>

      <section class="card panel ${panelClass("spesa")}" id="panel-spesa">
        <h2>Lista della spesa</h2>
        <input id="shoppingText" placeholder="Cosa manca in casa?">
        ${personSelect("shoppingPerson")}
        ${prioritySelect("shoppingPriority")}
        <button class="btn" id="addShoppingBtn">Aggiungi</button>
        <div>${renderItems(shopping)}</div>
      </section>

      <section class="card panel ${panelClass("faccende")}" id="panel-faccende">
        <h2>Faccende</h2>
        <input id="choreText" placeholder="Es. Pulire cucina, buttare spazzatura">
        ${personSelect("chorePerson")}
        ${prioritySelect("chorePriority")}
        <button class="btn" id="addChoreBtn">Aggiungi</button>
        <div>${renderItems(chores)}</div>
      </section>

      <section class="card panel ${panelClass("scadenze")}" id="panel-scadenze">
        <h2>Scadenze</h2>
        <input id="deadlineText" placeholder="Es. Bolletta, assicurazione, pagamento">
        <input id="deadlineDate" type="date">
        ${personSelect("deadlinePerson")}
        ${prioritySelect("deadlinePriority")}
        <button class="btn" id="addDeadlineBtn">Aggiungi</button>
        <div>${renderItems(deadlines)}</div>
      </section>

      <section class="card panel ${panelClass("calendario")}" id="panel-calendario">
        <h2>Calendario</h2>
        <p class="muted">Inserisci impegni da data a data. Le notifiche funzionano se il browser le consente e l’app viene aperta.</p>

        <input id="calendarTitle" placeholder="Titolo impegno">
        <div class="calendar-box">
          <input id="calendarStart" type="date">
          <input id="calendarEnd" type="date">
        </div>
        ${personSelect("calendarPerson")}
        ${prioritySelect("calendarPriority")}
        <textarea id="calendarNote" placeholder="Note opzionali"></textarea>

        <button class="btn" id="addCalendarBtn">Aggiungi impegno</button>

        <div>${renderItems(calendar)}</div>
      </section>

      <section class="card panel ${panelClass("spese")}" id="panel-spese">
        <h2>Spese familiari</h2>
        <input id="expenseText" placeholder="Descrizione">
        <input id="expenseAmount" type="number" step="0.01" placeholder="Importo €">
        <select id="expenseCategory">
          <option>Casa</option>
          <option>Spesa</option>
          <option>Auto</option>
          <option>Famiglia</option>
          <option>Extra</option>
        </select>
        ${personSelect("expensePerson")}
        <button class="btn" id="addExpenseBtn">Aggiungi</button>
        <div>${renderItems(expenses)}</div>
      </section>

      <section class="card panel ${panelClass("note")}" id="panel-note">
        <h2>Note</h2>
        <textarea id="noteText" placeholder="Scrivi una nota"></textarea>
        ${personSelect("notePerson")}
        <button class="btn" id="addNoteBtn">Aggiungi</button>
        <div>${renderItems(notes)}</div>
      </section>
    </main>
  `;

  bindEvents();
}

/* =========================================================
   EVENTI
========================================================= */

function bindEvents() {
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("notifyBtn").addEventListener("click", requestNotifications);

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      renderApp();
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
    if (!text) return;

    await addItem("scadenze", {
      text,
      person: val("deadlinePerson"),
      deadline: val("deadlineDate"),
      priority: val("deadlinePriority")
    });
  });

  document.getElementById("addCalendarBtn").addEventListener("click", async () => {
    const text = val("calendarTitle");
    const startDate = val("calendarStart");
    const endDate = val("calendarEnd") || startDate;

    if (!text || !startDate) {
      alert("Inserisci almeno titolo e data inizio.");
      return;
    }

    await addItem("calendario", {
      text,
      person: val("calendarPerson"),
      startDate,
      endDate,
      priority: val("calendarPriority"),
      note: val("calendarNote")
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

/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {
  const relevant = allItems.filter(x =>
    ["spesa", "faccende", "scadenze", "calendario"].includes(x.type)
  );

  if (!relevant.length) {
    return `<p class="muted">Nessuna attività inserita.</p>`;
  }

  return `
    <div class="dash-grid">
      ${FAMILY.map(person => renderPersonDashboard(person, relevant)).join("")}
    </div>
  `;
}

function renderPersonDashboard(person, items) {
  const personItems = items.filter(x => x.person === person);

  const red = personItems.filter(x => getStatus(x) === "rosso").length;
  const yellow = personItems.filter(x => getStatus(x) === "giallo").length;
  const green = personItems.filter(x => getStatus(x) === "verde").length;

  const byTypeCounts = {};
  Object.keys(TYPES).forEach(type => {
    byTypeCounts[type] = personItems.filter(x => x.type === type).length;
  });

  return `
    <div class="person-card">
      <h3>${escapeHtml(person)}</h3>

      <div class="priority-row">
        <span class="dot rosso"></span>
        <span>Urgenti</span>
        <strong>${red}</strong>
      </div>

      <div class="priority-row">
        <span class="dot giallo"></span>
        <span>Importanti</span>
        <strong>${yellow}</strong>
      </div>

      <div class="priority-row">
        <span class="dot verde"></span>
        <span>Normali</span>
        <strong>${green}</strong>
      </div>

      <div class="type-list">
        ${Object.keys(byTypeCounts)
          .filter(type => ["spesa", "faccende", "scadenze", "calendario"].includes(type))
          .map(type => `
            <div class="type-chip">
              <span>${TYPES[type]}</span>
              <strong>${byTypeCounts[type]}</strong>
            </div>
          `).join("")}
      </div>
    </div>
  `;
}

/* =========================================================
   RENDER ELEMENTI
========================================================= */

function renderItems(items) {
  if (!items.length) {
    return `<p class="muted">Nessun elemento inserito.</p>`;
  }

  return items.map((item) => {
    const status = getStatus(item);
    const label = getStatusLabel(status);

    let details = "";

    if (item.type === "spese") {
      details = `
        <small>${escapeHtml(item.category || "Spesa")} · ${escapeHtml(item.person || "")}</small>
        <div class="money">${formatMoney(item.amount)}</div>
      `;
    } else if (item.type === "scadenze") {
      details = `
        <small>${escapeHtml(item.person || "")}</small>
        <span class="date-range">Scadenza: ${formatDate(item.deadline)}</span>
        <br>
        <span class="badge ${status}">${label}</span>
      `;
    } else if (item.type === "calendario") {
      details = `
        <small>${escapeHtml(item.person || "")}</small>
        <span class="date-range">${formatDate(item.startDate)} → ${formatDate(item.endDate || item.startDate)}</span>
        ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}
        <span class="badge ${status}">${label}</span>
      `;
    } else if (item.type === "note") {
      details = `
        <small>${escapeHtml(item.person || "")}</small>
      `;
    } else {
      details = `
        <small>${escapeHtml(item.person || "")}</small>
        <span class="badge ${status}">${label}</span>
      `;
    }

    const hasLight = !["spese", "note"].includes(item.type);
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

/* =========================================================
   COMPONENTI HTML
========================================================= */

function tabButton(tab, label) {
  return `
    <button class="tab ${activeTab === tab ? "active" : ""}" data-tab="${tab}">
      ${label}
    </button>
  `;
}

function panelClass(tab) {
  return activeTab === tab ? "active" : "";
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

/* =========================================================
   SEMAFORO
========================================================= */

function getStatus(item) {
  if (item.type === "scadenze") {
    const auto = deadlineStatus(item.deadline);
    if (auto === "rosso") return "rosso";
    if (item.priority === "rosso") return "rosso";
    if (auto === "giallo") return "giallo";
    if (item.priority === "giallo") return "giallo";
    return "verde";
  }

  if (item.type === "calendario") {
    const auto = calendarStatus(item.startDate, item.endDate);
    if (auto === "rosso") return "rosso";
    if (item.priority === "rosso") return "rosso";
    if (auto === "giallo") return "giallo";
    if (item.priority === "giallo") return "giallo";
    return "verde";
  }

  if (item.priority === "rosso") return "rosso";
  if (item.priority === "giallo") return "giallo";
  return "verde";
}

function deadlineStatus(deadline) {
  if (!deadline) return "verde";

  const today = startOfToday();
  const due = parseDateLocal(deadline);

  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "rosso";
  if (diffDays <= 7) return "giallo";
  return "verde";
}

function calendarStatus(startDate, endDate) {
  if (!startDate) return "verde";

  const today = startOfToday();
  const start = parseDateLocal(startDate);
  const end = parseDateLocal(endDate || startDate);

  if (today >= start && today <= end) return "rosso";

  const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

  if (diffDays >= 0 && diffDays <= 3) return "giallo";

  return "verde";
}

function getStatusLabel(status) {
  if (status === "rosso") return "Urgente";
  if (status === "giallo") return "Importante";
  return "Normale";
}

function priorityWeight(status) {
  if (status === "rosso") return 3;
  if (status === "giallo") return 2;
  return 1;
}

/* =========================================================
   NOTIFICHE
========================================================= */

async function requestNotifications() {
  if (!("Notification" in window)) {
    alert("Le notifiche non sono supportate da questo browser.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    alert("Notifiche attivate.");
    checkCalendarNotifications(true);
  } else {
    alert("Notifiche non autorizzate.");
  }
}

function checkCalendarNotifications(force = false) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const calendar = byType("calendario");
  const todayKey = new Date().toISOString().slice(0, 10);

  calendar.forEach(item => {
    const status = calendarStatus(item.startDate, item.endDate);
    if (status !== "rosso" && !force) return;

    const notificationKey = `ada_notify_${todayKey}_${item.id}`;

    if (localStorage.getItem(notificationKey) && !force) return;

    if (status === "rosso" || force) {
      new Notification("ADA Home", {
        body: `${item.person || "Famiglia"}: ${item.text || "Impegno in calendario"}`,
      });

      localStorage.setItem(notificationKey, "1");
    }
  });
}

setInterval(() => {
  checkCalendarNotifications();
}, 60000);

/* =========================================================
   UTILITY
========================================================= */

function byType(type) {
  return allItems.filter(x => x.type === type);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
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

  const d = parseDateLocal(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString("it-IT");
}

function parseDateLocal(dateString) {
  if (!dateString) return new Date("");

  const parts = String(dateString).split("-");
  if (parts.length !== 3) return new Date(dateString);

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  return new Date(year, month, day);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
