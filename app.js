/* ADA Home - app.js completo corretto
   Firebase + Login + Dashboard + Semaforo + Calendario + Notifiche
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
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
   CONFIG FIREBASE CORRETTA
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBE-xO9I0i0eR86SHsDX9lSBU6dbvjMIIo",
  authDomain: "ada-home-4db14.firebaseapp.com",
  projectId: "ada-home-4db14",
  storageBucket: "ada-home-4db14.firebasestorage.app",
  messagingSenderId: "908315649480",
  appId: "1:908315649480:web:5a2549a291a259f15d0cfd"
};

/* =========================================================
   AVVIO FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

let currentUser = null;
let allItems = [];
let unsubscribeData = null;
let activeTab = "dashboard";

const FAMILY = ["Andrea", "Daniela", "Antonio"];

const TYPE_LABELS = {
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

    body {
      margin: 0;
      min-height: 100vh;
      background: #f4f7f3;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .ada-wrap {
      width: min(980px, calc(100% - 28px));
      margin: 0 auto;
      padding: 26px 0 70px;
    }

    .hero {
      background: linear-gradient(135deg, #2f7d46, #14532d);
      color: white;
      border-radius: 30px;
      padding: 30px;
      box-shadow: 0 18px 38px rgba(0,0,0,.16);
      margin-bottom: 18px;
    }

    .hero h1 {
      margin: 0 0 8px;
      font-size: 40px;
      line-height: 1.1;
    }

    .hero p {
      margin: 0 0 18px;
      opacity: .95;
      font-size: 18px;
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .family-pill {
      display: inline-block;
      padding: 10px 16px;
      border-radius: 999px;
      background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.26);
      font-size: 15px;
    }

    .logout {
      min-height: 42px;
      padding: 0 18px;
      border-radius: 999px;
      background: rgba(255,255,255,.16);
      color: white;
      border: 1px solid rgba(255,255,255,.30);
      font-weight: 800;
      cursor: pointer;
    }

    .card {
      background: white;
      border-radius: 28px;
      padding: 24px;
      border: 1px solid rgba(0,0,0,.06);
      box-shadow: 0 14px 32px rgba(0,0,0,.08);
      margin-bottom: 18px;
    }

    .card h2 {
      margin: 0 0 14px;
      font-size: 27px;
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

    .btn.secondary {
      background: #eef6f0;
      color: #14532d;
      border: 1px solid #cfe8d6;
    }

    .btn:active {
      transform: scale(.985);
    }

    .tabs {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 4px 0 14px;
      margin-bottom: 8px;
    }

    .tab {
      flex: 0 0 auto;
      min-height: 46px;
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

    .stats {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }

    .stat {
      background: white;
      border: 1px solid rgba(0,0,0,.06);
      border-radius: 22px;
      padding: 18px;
      box-shadow: 0 10px 24px rgba(0,0,0,.05);
    }

    .stat strong {
      display: block;
      font-size: 32px;
      color: #2f7d46;
      line-height: 1;
      margin-bottom: 6px;
    }

    .dashboard-grid {
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
      font-size: 22px;
    }

    .mini-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .mini {
      border-radius: 16px;
      padding: 10px;
      font-size: 13px;
      font-weight: 900;
      text-align: center;
    }

    .mini strong {
      display: block;
      font-size: 22px;
    }

    .mini.rosso {
      background: #fee2e2;
      color: #991b1b;
    }

    .mini.giallo {
      background: #fef9c3;
      color: #854d0e;
    }

    .mini.verde {
      background: #dcfce7;
      color: #166534;
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
      left: 17px;
      top: 18px;
      width: 24px;
      height: 24px;
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
      padding: 6px 10px;
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
      line-height: 1.35;
    }

    .ok {
      color: #166534;
      font-weight: 800;
      margin-top: 10px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .inline-check {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
      color: #374151;
      font-weight: 700;
    }

    .inline-check input {
      width: auto;
      min-height: auto;
      margin: 0;
    }

    .small-list {
      margin: 8px 0 0;
      padding: 0;
      list-style: none;
    }

    .small-list li {
      padding: 8px 0;
      border-top: 1px solid rgba(0,0,0,.06);
      font-size: 14px;
    }

    @media (min-width: 700px) {
      .stats {
        grid-template-columns: repeat(4, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .form-grid.two {
        grid-template-columns: 1fr 1fr;
      }

      .form-grid.three {
        grid-template-columns: 1fr 1fr 1fr;
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
          Se continua a dare errore, controlla in Firebase che sia attivo il metodo Email/password
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
  const email = val("loginEmail").toLowerCase();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    renderLogin("Inserisci email e password.");
    return;
  }

  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
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
        const ad = a.createdAt?.seconds || 0;
        const bd = b.createdAt?.seconds || 0;
        return bd - ad;
      });

      renderApp();
      checkNotifications();
    },
    (error) => {
      renderApp("Errore lettura database. Controlla le regole Firebase. " + error.code);
    }
  );
}

async function addItem(type, data) {
  await addDoc(collection(db, "adaHome"), {
    type,
    ...data,
    createdAt: serverTimestamp(),
    createdBy: currentUser?.email || ""
  });
}

async function removeItem(id) {
  await deleteDoc(doc(db, "adaHome", id));
}

/* =========================================================
   APP
========================================================= */

function renderApp(errorMessage = "") {
  injectCss();

  const shopping = getByType("spesa");
  const chores = getByType("faccende");
  const deadlines = getByType("scadenze");
  const expenses = getByType("spese");
  const notes = getByType("note");
  const calendar = getByType("calendario");

  const urgentCount = allItems.filter((x) => getStatus(x) === "rosso").length;
  const importantCount = allItems.filter((x) => getStatus(x) === "giallo").length;

  const expensesTotal = expenses.reduce((sum, x) => sum + Number(x.amount || 0), 0);

  document.body.innerHTML = `
    <main class="ada-wrap">
      <section class="hero">
        <div class="top-row">
          <div>
            <h1>ADA Home</h1>
            <p>Gestione quotidiana della famiglia</p>
            <span class="family-pill">Andrea · Daniela · Antonio</span>
          </div>
          <button class="logout" id="logoutBtn">Esci</button>
        </div>
      </section>

      ${errorMessage ? `<section class="card error">${escapeHtml(errorMessage)}</section>` : ""}

      <section class="stats">
        <div class="stat">
          <strong>${urgentCount}</strong>
          Urgenti
        </div>
        <div class="stat">
          <strong>${importantCount}</strong>
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

      <section class="card panel ${isActive("dashboard")}" id="panel-dashboard">
        <h2>Dashboard famiglia</h2>
        <p class="muted">Riepilogo delle attività divise per persona, urgenza e tipologia.</p>
        <button class="btn secondary" id="notifyBtn">Attiva notifiche</button>
        ${renderDashboard()}
      </section>

      <section class="card panel ${isActive("spesa")}" id="panel-spesa">
        <h2>Lista della spesa</h2>
        <input id="shoppingText" placeholder="Cosa manca in casa?">
        <div class="form-grid two">
          ${personSelect("shoppingPerson")}
          ${prioritySelect("shoppingPriority")}
        </div>
        <button class="btn" id="addShoppingBtn">Aggiungi</button>
        <div>${renderItems(shopping)}</div>
      </section>

      <section class="card panel ${isActive("faccende")}" id="panel-faccende">
        <h2>Faccende di casa</h2>
        <input id="choreText" placeholder="Es. Pulire cucina, buttare immondizia">
        <div class="form-grid two">
          ${personSelect("chorePerson")}
          ${prioritySelect("chorePriority")}
        </div>
        <button class="btn" id="addChoreBtn">Aggiungi</button>
        <div>${renderItems(chores)}</div>
      </section>

      <section class="card panel ${isActive("scadenze")}" id="panel-scadenze">
        <h2>Scadenze</h2>
        <input id="deadlineText" placeholder="Es. Bolletta luce, assicurazione, pagamento">
        <div class="form-grid three">
          <input id="deadlineDate" type="date">
          ${personSelect("deadlinePerson")}
          ${prioritySelect("deadlinePriority")}
        </div>
        <label class="inline-check">
          <input id="deadlineNotify" type="checkbox" checked>
          Avvisami quando si avvicina
        </label>
        <button class="btn" id="addDeadlineBtn">Aggiungi</button>
        <div>${renderItems(deadlines)}</div>
      </section>

      <section class="card panel ${isActive("calendario")}" id="panel-calendario">
        <h2>Calendario</h2>
        <input id="calendarText" placeholder="Titolo impegno">
        <div class="form-grid two">
          <input id="calendarStart" type="date">
          <input id="calendarEnd" type="date">
        </div>
        <div class="form-grid two">
          ${personSelect("calendarPerson")}
          ${prioritySelect("calendarPriority")}
        </div>
        <textarea id="calendarNote" placeholder="Note impegno"></textarea>
        <label class="inline-check">
          <input id="calendarNotify" type="checkbox" checked>
          Avvisami il giorno dell'impegno
        </label>
        <button class="btn" id="addCalendarBtn">Aggiungi impegno</button>
        <div>${renderItems(calendar)}</div>
      </section>

      <section class="card panel ${isActive("spese")}" id="panel-spese">
        <h2>Spese familiari</h2>
        <input id="expenseText" placeholder="Descrizione spesa">
        <div class="form-grid three">
          <input id="expenseAmount" type="number" step="0.01" placeholder="Importo €">
          <select id="expenseCategory">
            <option>Casa</option>
            <option>Spesa</option>
            <option>Auto</option>
            <option>Famiglia</option>
            <option>Extra</option>
          </select>
          ${personSelect("expensePerson")}
        </div>
        <button class="btn" id="addExpenseBtn">Aggiungi</button>
        <div>${renderItems(expenses)}</div>
      </section>

      <section class="card panel ${isActive("note")}" id="panel-note">
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

function bindEvents() {
  document.getElementById("logoutBtn").addEventListener("click", logout);

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

  document.getElementById("notifyBtn").addEventListener("click", requestNotifications);

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
      priority: val("deadlinePriority"),
      notify: document.getElementById("deadlineNotify").checked
    });
  });

  document.getElementById("addCalendarBtn").addEventListener("click", async () => {
    const text = val("calendarText");
    const startDate = val("calendarStart");
    const endDate = val("calendarEnd") || startDate;

    if (!text || !startDate) return;

    await addItem("calendario", {
      text,
      person: val("calendarPerson"),
      startDate,
      endDate,
      priority: val("calendarPriority"),
      note: val("calendarNote"),
      notify: document.getElementById("calendarNotify").checked
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
   DASHBOARD
========================================================= */

function renderDashboard() {
  return `
    <div class="dashboard-grid">
      ${FAMILY.map((person) => renderPersonDashboard(person)).join("")}
    </div>
  `;
}

function renderPersonDashboard(person) {
  const items = allItems.filter((x) => x.person === person && x.type !== "spese" && x.type !== "note");

  const rossi = items.filter((x) => getStatus(x) === "rosso");
  const gialli = items.filter((x) => getStatus(x) === "giallo");
  const verdi = items.filter((x) => getStatus(x) === "verde");

  const ordered = [...rossi, ...gialli, ...verdi].slice(0, 8);

  return `
    <div class="person-card">
      <h3>${escapeHtml(person)}</h3>

      <div class="mini-stats">
        <div class="mini rosso">
          <strong>${rossi.length}</strong>
          Urgenti
        </div>
        <div class="mini giallo">
          <strong>${gialli.length}</strong>
          Importanti
        </div>
        <div class="mini verde">
          <strong>${verdi.length}</strong>
          Normali
        </div>
      </div>

      ${
        ordered.length
          ? `<ul class="small-list">
              ${ordered.map((x) => `
                <li>
                  <span class="badge ${getStatus(x)}">${getStatusLabel(getStatus(x))}</span>
                  <br>
                  <strong>${escapeHtml(x.text || "")}</strong>
                  <small>${escapeHtml(TYPE_LABELS[x.type] || x.type)}${dateInfo(x)}</small>
                </li>
              `).join("")}
            </ul>`
          : `<p class="muted">Nessuna attività assegnata.</p>`
      }
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
        <small>${escapeHtml(item.person || "")} · Scadenza: ${formatDate(item.deadline)}</small>
        <span class="badge ${status}">${label}</span>
      `;
    } else if (item.type === "calendario") {
      details = `
        <small>${escapeHtml(item.person || "")} · Dal ${formatDate(item.startDate)} al ${formatDate(item.endDate)}</small>
        ${item.note ? `<small>Note: ${escapeHtml(item.note)}</small>` : ""}
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

    const showLight = item.type !== "spese" && item.type !== "note";
    const light = showLight ? `<span class="semaforo ${status}"></span>` : "";
    const lightClass = showLight ? "with-light" : "";

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

function tabButton(id, label) {
  return `<button class="tab ${activeTab === id ? "active" : ""}" data-tab="${id}">${label}</button>`;
}

function isActive(id) {
  return activeTab === id ? "active" : "";
}

function personSelect(id) {
  return `
    <select id="${id}">
      ${FAMILY.map((p) => `<option>${p}</option>`).join("")}
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
  if (item.type === "spese" || item.type === "note") return "verde";

  let priorityStatus = item.priority || "verde";
  let dateStatus = "verde";

  if (item.type === "scadenze") {
    dateStatus = deadlineStatus(item.deadline);
  }

  if (item.type === "calendario") {
    dateStatus = calendarStatus(item.startDate, item.endDate);
  }

  return mostUrgent(priorityStatus, dateStatus);
}

function mostUrgent(a, b) {
  const rank = {
    verde: 1,
    giallo: 2,
    rosso: 3
  };

  return rank[a] >= rank[b] ? a : b;
}

function deadlineStatus(deadline) {
  if (!deadline) return "verde";

  const today = todayDate();
  const due = parseLocalDate(deadline);

  const diffDays = Math.ceil((due - today) / 86400000);

  if (diffDays <= 0) return "rosso";
  if (diffDays <= 7) return "giallo";
  return "verde";
}

function calendarStatus(startDate, endDate) {
  if (!startDate) return "verde";

  const today = todayDate();
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate || startDate);

  if (today >= start && today <= end) return "rosso";

  const diffDays = Math.ceil((start - today) / 86400000);

  if (diffDays <= 0) return "rosso";
  if (diffDays <= 3) return "giallo";
  return "verde";
}

function getStatusLabel(status) {
  if (status === "rosso") return "Urgente";
  if (status === "giallo") return "Importante";
  return "Normale";
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
    alert("Notifiche attivate. Funzionano quando l'app è aperta.");
    checkNotifications(true);
  } else {
    alert("Notifiche non autorizzate.");
  }
}

function checkNotifications(force = false) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const todayKey = new Date().toISOString().slice(0, 10);

  allItems.forEach((item) => {
    if (!item.notify) return;
    if (item.type !== "scadenze" && item.type !== "calendario") return;

    const key = `ada-notified-${todayKey}-${item.id}`;

    if (!force && localStorage.getItem(key)) return;

    if (shouldNotify(item)) {
      localStorage.setItem(key, "1");

      new Notification("ADA Home", {
        body: notificationText(item)
      });
    }
  });
}

function shouldNotify(item) {
  const today = todayDate();

  if (item.type === "scadenze" && item.deadline) {
    const due = parseLocalDate(item.deadline);
    const diffDays = Math.ceil((due - today) / 86400000);
    return diffDays <= 1;
  }

  if (item.type === "calendario" && item.startDate) {
    const start = parseLocalDate(item.startDate);
    const diffDays = Math.ceil((start - today) / 86400000);
    return diffDays === 0;
  }

  return false;
}

function notificationText(item) {
  if (item.type === "scadenze") {
    return `Scadenza: ${item.text} - ${formatDate(item.deadline)}`;
  }

  if (item.type === "calendario") {
    return `Impegno di oggi: ${item.text}`;
  }

  return item.text || "Promemoria";
}

/* =========================================================
   UTILITY
========================================================= */

function getByType(type) {
  return allItems.filter((x) => x.type === type);
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

  const d = parseLocalDate(dateString);

  if (Number.isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseLocalDate(dateString) {
  if (!dateString) return new Date("");

  const parts = String(dateString).split("-");
  if (parts.length !== 3) return new Date(dateString);

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  return new Date(year, month, day);
}

function dateInfo(item) {
  if (item.type === "scadenze") {
    return ` · ${formatDate(item.deadline)}`;
  }

  if (item.type === "calendario") {
    return ` · ${formatDate(item.startDate)} - ${formatDate(item.endDate)}`;
  }

  return "";
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
