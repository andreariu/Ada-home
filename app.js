/* ADA Home - app.js completo corretto
   Firebase + login + semaforo + dashboard + calendario + notifiche
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
   Se questi valori sono già corretti nel tuo vecchio app.js,
   lasciali uguali.
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBE-xO9I0i0eR86SHsDX91SBU6dbvjMITo",
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

let currentUser = null;
let allItems = [];
let unsubscribeData = null;
let activeTab = "dashboard";
let calendarCursor = new Date();

const FAMILY = ["Andrea", "Daniela", "Antonio"];

/* =========================================================
   CSS APP
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
      width: min(900px, calc(100% - 28px));
      margin: 0 auto;
      padding: 26px 0 70px;
    }

    .hero {
      background: linear-gradient(135deg, #2f7d46, #14532d);
      color: white;
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 18px 36px rgba(0,0,0,.14);
      margin-bottom: 18px;
    }

    .hero h1 {
      margin: 0 0 8px;
      font-size: 38px;
      line-height: 1.1;
    }

    .hero p {
      margin: 0 0 10px;
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
      margin-top: 8px;
    }

    .logout {
      margin-top: 18px;
      width: auto;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 999px;
      background: rgba(255,255,255,.16);
      color: white;
      border: 1px solid rgba(255,255,255,.28);
      font-weight: 800;
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
      background: #e8f3ec;
      color: #166534;
      border: 1px solid #c8e6d1;
    }

    .btn:active,
    .tab:active,
    .delete:active {
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
      top: 18px;
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
      margin-right: 6px;
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

    .dashboard-person {
      border-left: 6px solid #2f7d46;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 12px;
    }

    .dash-box {
      background: #f8faf8;
      border: 1px solid #e5ece6;
      border-radius: 16px;
      padding: 14px;
    }

    .dash-box strong {
      font-size: 22px;
      color: #2f7d46;
    }

    .notif {
      border-left: 6px solid #ef4444;
      background: #fff7f7;
    }

    .calendar-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }

    .calendar-head button {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 14px;
      background: #e8f3ec;
      color: #166534;
      font-size: 24px;
      font-weight: 900;
    }

    .calendar-head strong {
      font-size: 21px;
      text-transform: capitalize;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }

    .day-name {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      font-weight: 900;
      padding-bottom: 6px;
    }

    .day-cell {
      min-height: 82px;
      background: #f8faf8;
      border: 1px solid #e5ece6;
      border-radius: 14px;
      padding: 8px;
      overflow: hidden;
    }

    .day-cell.out {
      opacity: .35;
    }

    .day-number {
      font-weight: 900;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .day-event {
      display: block;
      font-size: 11px;
      line-height: 1.2;
      padding: 4px 6px;
      border-radius: 9px;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .day-event.verde {
      background: #dcfce7;
      color: #166534;
    }

    .day-event.giallo {
      background: #fef9c3;
      color: #854d0e;
    }

    .day-event.rosso {
      background: #fee2e2;
      color: #991b1b;
    }

    .error {
      color: #b42318;
      font-weight: 900;
      margin-top: 12px;
    }

    @media (min-width: 700px) {
      .stats {
        grid-template-columns: repeat(4, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 520px) {
      .hero h1 {
        font-size: 32px;
      }

      .card {
        padding: 20px;
      }

      .calendar-grid {
        gap: 4px;
      }

      .day-cell {
        min-height: 68px;
        padding: 5px;
      }

      .day-event {
        font-size: 10px;
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

/* =========================================================
   FIRESTORE
========================================================= */

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
    checkBrowserNotifications(false);
  }, () => {
    renderApp("Errore lettura database. Controlla le regole Firebase.");
  });
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
   HOME APP
========================================================= */

function renderApp(errorMessage = "") {
  injectCss();

  const shopping = allItems.filter(x => x.type === "spesa");
  const chores = allItems.filter(x => x.type === "faccende");
  const deadlines = allItems.filter(x => x.type === "scadenze");
  const calendar = allItems.filter(x => x.type === "calendario");
  const expenses = allItems.filter(x => x.type === "spese");
  const notes = allItems.filter(x => x.type === "note");

  const activityItems = [...shopping, ...chores, ...deadlines, ...calendar];

  const urgentCount = activityItems.filter(x => getStatus(x) === "rosso").length;

  const importantCount = activityItems.filter(x => getStatus(x) === "giallo").length;

  const expensesTotal = expenses.reduce((sum, x) => {
    return sum + Number(x.amount || 0);
  }, 0);

  const today = new Date();

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
          <strong>${importantCount}</strong>
          Importanti
        </div>
        <div class="stat">
          <strong>${shopping.length}</strong>
          Spesa
        </div>
        <div class="stat">
          <strong>${formatMoney(expensesTotal)}</strong>
          Spese mese
        </div>
      </section>

      <nav class="tabs">
        <button class="tab ${activeTab === "dashboard" ? "active" : ""}" data-tab="dashboard">Dashboard</button>
        <button class="tab ${activeTab === "spesa" ? "active" : ""}" data-tab="spesa">Spesa</button>
        <button class="tab ${activeTab === "faccende" ? "active" : ""}" data-tab="faccende">Faccende</button>
        <button class="tab ${activeTab === "scadenze" ? "active" : ""}" data-tab="scadenze">Scadenze</button>
        <button class="tab ${activeTab === "calendario" ? "active" : ""}" data-tab="calendario">Calendario</button>
        <button class="tab ${activeTab === "spese" ? "active" : ""}" data-tab="spese">Spese</button>
        <button class="tab ${activeTab === "note" ? "active" : ""}" data-tab="note">Note</button>
      </nav>

      <section class="card panel ${activeTab === "dashboard" ? "active" : ""}" id="panel-dashboard">
        <h2>Dashboard famiglia</h2>
        <p class="muted">Riepilogo attività divise per persona, tipologia e urgenza.</p>
        ${renderNotifications(deadlines, calendar)}
        ${renderDashboard(activityItems)}
      </section>

      <section class="card panel ${activeTab === "spesa" ? "active" : ""}" id="panel-spesa">
        <h2>Lista della spesa</h2>
        <input id="shoppingText" placeholder="Cosa manca in casa?">
        ${personSelect("shoppingPerson")}
        ${prioritySelect("shoppingPriority")}
        <button class="btn" id="addShoppingBtn">Aggiungi</button>
        <div>${renderItems(shopping)}</div>
      </section>

      <section class="card panel ${activeTab === "faccende" ? "active" : ""}" id="panel-faccende">
        <h2>Faccende di casa</h2>
        <input id="choreText" placeholder="Es. Pulire cucina, buttare immondizia">
        ${personSelect("chorePerson")}
        ${prioritySelect("chorePriority")}
        <button class="btn" id="addChoreBtn">Aggiungi</button>
        <div>${renderItems(chores)}</div>
      </section>

      <section class="card panel ${activeTab === "scadenze" ? "active" : ""}" id="panel-scadenze">
        <h2>Scadenze</h2>
        <input id="deadlineText" placeholder="Es. Bolletta luce, assicurazione, visita">
        <input id="deadlineDate" type="date">
        ${personSelect("deadlinePerson")}
        ${prioritySelect("deadlinePriority")}
        <button class="btn" id="addDeadlineBtn">Aggiungi</button>
        <div>${renderItems(deadlines)}</div>
      </section>

      <section class="card panel ${activeTab === "calendario" ? "active" : ""}" id="panel-calendario">
        <h2>Calendario famiglia</h2>
        <p class="muted">Inserisci impegni da data a data. Verranno mostrati anche nella Dashboard.</p>

        <input id="calendarText" placeholder="Titolo impegno">
        <input id="calendarStart" type="date" value="${todayDateString()}">
        <input id="calendarEnd" type="date" value="${todayDateString()}">
        ${personSelect("calendarPerson")}
        ${prioritySelect("calendarPriority")}
        <textarea id="calendarNote" placeholder="Note facoltative"></textarea>

        <button class="btn" id="addCalendarBtn">Aggiungi impegno</button>

        <div style="height:18px"></div>

        ${renderCalendarGrid(calendar)}

        <div style="height:18px"></div>

        <h3>Impegni inseriti</h3>
        <div>${renderItems(sortCalendar(calendar))}</div>
      </section>

      <section class="card panel ${activeTab === "spese" ? "active" : ""}" id="panel-spese">
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

      <section class="card panel ${activeTab === "note" ? "active" : ""}" id="panel-note">
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
   EVENTI UI
========================================================= */

function bindEvents() {
  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      activateTab(activeTab);
    });
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await removeItem(btn.dataset.delete);
    });
  });

  const enableNotifBtn = document.getElementById("enableNotifBtn");
  if (enableNotifBtn) {
    enableNotifBtn.addEventListener("click", requestBrowserNotifications);
  }

  const prevMonth = document.getElementById("prevMonth");
  if (prevMonth) {
    prevMonth.addEventListener("click", () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
      activeTab = "calendario";
      renderApp();
    });
  }

  const nextMonth = document.getElementById("nextMonth");
  if (nextMonth) {
    nextMonth.addEventListener("click", () => {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
      activeTab = "calendario";
      renderApp();
    });
  }

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
    const text = val("calendarText");
    const startDate = val("calendarStart");
    const endDate = val("calendarEnd");

    if (!text || !startDate || !endDate) return;

    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate);

    if (end < start) {
      alert("La data fine non può essere prima della data inizio.");
      return;
    }

    await addItem("calendario", {
      text,
      startDate,
      endDate,
      person: val("calendarPerson"),
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

function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));

  const tab = document.querySelector(`[data-tab="${tabName}"]`);
  const panel = document.getElementById(`panel-${tabName}`);

  if (tab) tab.classList.add("active");
  if (panel) panel.classList.add("active");
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard(activityItems) {
  if (!activityItems.length) {
    return `<p class="muted">Nessuna attività presente.</p>`;
  }

  return FAMILY.map(person => {
    const personItems = activityItems.filter(item => item.person === person);

    const spesa = personItems.filter(item => item.type === "spesa");
    const faccende = personItems.filter(item => item.type === "faccende");
    const scadenze = personItems.filter(item => item.type === "scadenze");
    const calendario = personItems.filter(item => item.type === "calendario");

    const rosso = personItems.filter(item => getStatus(item) === "rosso");
    const giallo = personItems.filter(item => getStatus(item) === "giallo");
    const verde = personItems.filter(item => getStatus(item) === "verde");

    return `
      <div class="item dashboard-person">
        <strong style="font-size:22px;">${escapeHtml(person)}</strong>
        <small>Totale attività: <b>${personItems.length}</b></small>

        <div style="margin-top:12px;">
          <span class="badge rosso">Urgenti: ${rosso.length}</span>
          <span class="badge giallo">Importanti: ${giallo.length}</span>
          <span class="badge verde">Normali: ${verde.length}</span>
        </div>

        <div class="dashboard-grid">
          <div class="dash-box">
            <small>Spesa</small>
            <strong>${spesa.length}</strong>
          </div>
          <div class="dash-box">
            <small>Faccende</small>
            <strong>${faccende.length}</strong>
          </div>
          <div class="dash-box">
            <small>Scadenze</small>
            <strong>${scadenze.length}</strong>
          </div>
          <div class="dash-box">
            <small>Calendario</small>
            <strong>${calendario.length}</strong>
          </div>
          <div class="dash-box">
            <small>Rosso</small>
            <strong>${rosso.length}</strong>
          </div>
          <div class="dash-box">
            <small>Giallo</small>
            <strong>${giallo.length}</strong>
          </div>
        </div>

        <div style="margin-top:16px;">
          <small><b>Dettaglio urgenze</b></small>
          ${renderDashboardList(rosso, "rosso")}
        </div>

        <div style="margin-top:16px;">
          <small><b>Dettaglio importanti</b></small>
          ${renderDashboardList(giallo, "giallo")}
        </div>

        <div style="margin-top:16px;">
          <small><b>Dettaglio normali</b></small>
          ${renderDashboardList(verde, "verde")}
        </div>
      </div>
    `;
  }).join("");
}

function renderDashboardList(items, status) {
  if (!items.length) {
    return `<small class="muted">Nessun elemento</small>`;
  }

  return items.map(item => {
    return `
      <div style="margin-top:8px; padding:10px 12px; background:#f8faf8; border-radius:12px; border:1px solid #e5ece6;">
        <span class="badge ${status}">${getTypeLabel(item.type)}</span>
        <small><b>${escapeHtml(item.text || "")}</b></small>
        <small>${getExtraInfo(item)}</small>
      </div>
    `;
  }).join("");
}

/* =========================================================
   NOTIFICHE
========================================================= */

function renderNotifications(deadlines, calendar) {
  const alerts = getNotificationItems(deadlines, calendar);

  const permissionText = getNotificationPermissionText();

  return `
    <div class="item notif">
      <strong>Avvisi e notifiche</strong>
      <small>${permissionText}</small>
      <button class="btn secondary" id="enableNotifBtn">Attiva notifiche browser</button>
      <div style="margin-top:12px;">
        ${
          alerts.length
            ? alerts.map(a => `
                <div style="margin-top:8px;">
                  <span class="badge ${a.status}">${a.label}</span>
                  <small><b>${escapeHtml(a.title)}</b></small>
                  <small>${escapeHtml(a.message)}</small>
                </div>
              `).join("")
            : `<small class="muted">Nessun avviso urgente.</small>`
        }
      </div>
    </div>
  `;
}

function getNotificationItems(deadlines, calendar) {
  const alerts = [];

  deadlines.forEach(item => {
    const diff = daysUntil(item.deadline);
    if (diff === null) return;

    if (diff <= 7) {
      const status = diff <= 0 ? "rosso" : "giallo";
      alerts.push({
        key: `deadline-${item.id}-${item.deadline}`,
        status,
        label: status === "rosso" ? "Scadenza urgente" : "Scadenza vicina",
        title: item.text || "Scadenza",
        message: `${item.person || ""} · ${diff <= 0 ? "Scade oggi o è già scaduta" : "Scade tra " + diff + " giorni"}`
      });
    }
  });

  calendar.forEach(item => {
    const startDiff = daysUntil(item.startDate);
    const endDiff = daysUntil(item.endDate);

    if (startDiff === null || endDiff === null) return;

    const todayInside = startDiff <= 0 && endDiff >= 0;

    if (todayInside || (startDiff >= 0 && startDiff <= 3)) {
      const status = todayInside || startDiff === 0 ? "rosso" : "giallo";
      alerts.push({
        key: `calendar-${item.id}-${item.startDate}`,
        status,
        label: status === "rosso" ? "Impegno oggi" : "Impegno vicino",
        title: item.text || "Impegno",
        message: `${item.person || ""} · ${todayInside ? "In corso oggi" : "Inizia tra " + startDiff + " giorni"}`
      });
    }
  });

  return alerts;
}

async function requestBrowserNotifications() {
  if (!("Notification" in window)) {
    alert("Questo browser non supporta le notifiche.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    checkBrowserNotifications(true);
    alert("Notifiche attivate.");
  } else {
    alert("Notifiche non abilitate.");
  }

  renderApp();
}

function checkBrowserNotifications(force) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const deadlines = allItems.filter(x => x.type === "scadenze");
  const calendar = allItems.filter(x => x.type === "calendario");
  const alerts = getNotificationItems(deadlines, calendar);

  if (!alerts.length) return;

  const todayKey = todayDateString();
  const saved = JSON.parse(localStorage.getItem("adaHomeNotificationsSent") || "{}");

  alerts.forEach(alert => {
    const key = `${todayKey}-${alert.key}`;

    if (!saved[key] || force) {
      new Notification("ADA Home", {
        body: `${alert.title} - ${alert.message}`
      });

      saved[key] = true;
    }
  });

  localStorage.setItem("adaHomeNotificationsSent", JSON.stringify(saved));
}

function getNotificationPermissionText() {
  if (!("Notification" in window)) {
    return "Il browser non supporta le notifiche esterne. Gli avvisi saranno visibili dentro l'app.";
  }

  if (Notification.permission === "granted") {
    return "Notifiche browser attive. Gli avvisi compaiono anche fuori dalla pagina quando possibile.";
  }

  if (Notification.permission === "denied") {
    return "Notifiche bloccate dal browser. Puoi riattivarle dalle impostazioni del sito.";
  }

  return "Puoi attivare le notifiche browser. Gli avvisi dentro l'app funzionano comunque.";
}

/* =========================================================
   CALENDARIO
========================================================= */

function renderCalendarGrid(calendarItems) {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = mondayIndex(firstDay.getDay());
  const gridStart = new Date(year, month, 1 - startOffset);

  const monthTitle = calendarCursor.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric"
  });

  const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  let html = `
    <div class="calendar-head">
      <button id="prevMonth">‹</button>
      <strong>${monthTitle}</strong>
      <button id="nextMonth">›</button>
    </div>

    <div class="calendar-grid">
      ${dayNames.map(d => `<div class="day-name">${d}</div>`).join("")}
  `;

  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);

    const inMonth = day.getMonth() === month;
    const dayEvents = calendarItems.filter(item => eventIsInDay(item, day));

    html += `
      <div class="day-cell ${inMonth ? "" : "out"}">
        <div class="day-number">${day.getDate()}</div>
        ${
          dayEvents.slice(0, 3).map(ev => `
            <span class="day-event ${getStatus(ev)}">${escapeHtml(ev.text || "Impegno")}</span>
          `).join("")
        }
        ${
          dayEvents.length > 3
            ? `<span class="day-event giallo">+${dayEvents.length - 3}</span>`
            : ""
        }
      </div>
    `;
  }

  html += `</div>`;

  return html;
}

function eventIsInDay(item, day) {
  if (!item.startDate || !item.endDate) return false;

  const start = parseDateInput(item.startDate);
  const end = parseDateInput(item.endDate);
  const current = new Date(day);
  current.setHours(0, 0, 0, 0);

  return current >= start && current <= end;
}

function sortCalendar(items) {
  return [...items].sort((a, b) => {
    const ad = parseDateInput(a.startDate || "2999-12-31");
    const bd = parseDateInput(b.startDate || "2999-12-31");
    return ad - bd;
  });
}

function mondayIndex(day) {
  return day === 0 ? 6 : day - 1;
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
        <small>${escapeHtml(item.person || "")} · ${formatDateRange(item.startDate, item.endDate)}</small>
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

    const hasLight = ["spesa", "faccende", "scadenze", "calendario"].includes(item.type);
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

/* =========================================================
   SEMAFORO
========================================================= */

function getStatus(item) {
  if (item.priority === "rosso") return "rosso";

  if (item.type === "scadenze") {
    const dateStatus = deadlineStatus(item.deadline);

    if (dateStatus === "rosso") return "rosso";
    if (dateStatus === "giallo") return "giallo";
  }

  if (item.type === "calendario") {
    const calendarStatus = calendarStatusByDate(item);

    if (calendarStatus === "rosso") return "rosso";
    if (calendarStatus === "giallo") return "giallo";
  }

  if (item.priority === "giallo") return "giallo";

  return "verde";
}

function deadlineStatus(deadline) {
  const diffDays = daysUntil(deadline);

  if (diffDays === null) return "verde";
  if (diffDays <= 0) return "rosso";
  if (diffDays <= 7) return "giallo";

  return "verde";
}

function calendarStatusByDate(item) {
  if (!item.startDate || !item.endDate) return "verde";

  const startDiff = daysUntil(item.startDate);
  const endDiff = daysUntil(item.endDate);

  if (startDiff === null || endDiff === null) return "verde";

  const todayInside = startDiff <= 0 && endDiff >= 0;

  if (todayInside || startDiff === 0) return "rosso";
  if (startDiff > 0 && startDiff <= 3) return "giallo";

  return "verde";
}

function getStatusLabel(status) {
  if (status === "rosso") return "Urgente";
  if (status === "giallo") return "Importante";
  return "Normale";
}

function getTypeLabel(type) {
  if (type === "spesa") return "Spesa";
  if (type === "faccende") return "Faccenda";
  if (type === "scadenze") return "Scadenza";
  if (type === "calendario") return "Calendario";
  if (type === "spese") return "Spesa €";
  if (type === "note") return "Nota";
  return "Altro";
}

function getExtraInfo(item) {
  if (item.type === "scadenze") {
    return `${item.person || ""} · Scadenza: ${formatDate(item.deadline)}`;
  }

  if (item.type === "calendario") {
    return `${item.person || ""} · ${formatDateRange(item.startDate, item.endDate)}`;
  }

  return item.person || "";
}

/* =========================================================
   UTILITY
========================================================= */

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

  const d = parseDateInput(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString("it-IT");
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "date non impostate";
  if (startDate === endDate) return formatDate(startDate);

  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
}

function parseDateInput(dateString) {
  if (!dateString) return new Date("Invalid Date");

  const parts = String(dateString).split("-");
  if (parts.length !== 3) return new Date(dateString);

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);

  return d;
}

function todayDateString() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function daysUntil(dateString) {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = parseDateInput(dateString);
  if (Number.isNaN(due.getTime())) return null;

  const diff = due - today;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
