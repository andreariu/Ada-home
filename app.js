/* ADA Home - app.js SENZA LOGIN
   Dashboard + semaforo priorità + calendario + notifiche semplici
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

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
const db = getFirestore(app);

let allItems = [];
let unsubscribeData = null;
let activeTab = "dashboard";
let appError = "";

const currentUser = {
  email: "accesso-libero"
};

const FAMILY = ["Andrea", "Daniela", "Antonio"];

const TYPES = {
  spesa: "Spesa",
  faccende: "Faccende",
  scadenze: "Scadenze",
  spese: "Spese",
  note: "Note",
  calendario: "Calendario"
};

const ACTION_TYPES = ["spesa", "faccende", "scadenze", "calendario"];

/* =========================================================
   START APP
========================================================= */

function startApp() {
  injectCss();
  renderLoading();
  listenData();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}

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
      width: min(1040px, calc(100% - 28px));
      margin: 0 auto;
      padding: 26px 0 48px;
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
      margin: 0 0 18px;
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
    }

    .today {
      margin-top: 16px;
      font-size: 14px;
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
      font-size: 20px;
    }

    .muted {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.45;
    }

    .error {
      color: #b42318;
      font-weight: 800;
      margin-top: 12px;
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

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .btn {
      width: 100%;
      min-height: 54px;
      border: none;
      border-radius: 16px;
      background: #2f7d46;
      color: white;
      font-size: 17px;
      font-weight: 800;
      margin-top: 10px;
      cursor: pointer;
    }

    .btn:active {
      transform: scale(.98);
    }

    .btn-secondary {
      width: auto;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,.08);
      background: #eef7f0;
      color: #14532d;
      font-weight: 900;
      cursor: pointer;
      margin-top: 10px;
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
      font-size: 31px;
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
      font-weight: 800;
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
      padding-left: 58px;
    }

    .item strong {
      display: block;
      font-size: 17px;
      margin-bottom: 5px;
    }

    .item small {
      display: block;
      color: #6b7280;
      line-height: 1.45;
    }

    .semaforo {
      position: absolute;
      left: 18px;
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
      font-weight: 800;
      margin-top: 12px;
      cursor: pointer;
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

    .person-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .person-head h3 {
      margin: 0;
      font-size: 22px;
    }

    .pill-count {
      border-radius: 999px;
      padding: 6px 10px;
      font-weight: 900;
      background: #eef7f0;
      color: #14532d;
      font-size: 13px;
    }

    .priority-section {
      border-top: 1px solid rgba(0,0,0,.06);
      padding-top: 12px;
      margin-top: 12px;
    }

    .priority-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 900;
      margin-bottom: 8px;
    }

    .mini-dot {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      display: inline-block;
    }

    .mini-list {
      margin: 0;
      padding-left: 18px;
      color: #374151;
    }

    .mini-list li {
      margin: 5px 0;
      line-height: 1.35;
    }

    .type-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 10px 0 2px;
    }

    .type-chip {
      background: white;
      border: 1px solid rgba(0,0,0,.07);
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: 800;
      color: #374151;
    }

    @media (min-width: 700px) {
      .stats {
        grid-template-columns: repeat(4, 1fr);
      }

      .grid-2 {
        grid-template-columns: repeat(2, 1fr);
      }

      .grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   FIRESTORE
========================================================= */

function listenData() {
  if (unsubscribeData) {
    unsubscribeData();
    unsubscribeData = null;
  }

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

      appError = "";
      renderApp();
      checkNotifications();
    },
    (error) => {
      appError = "Errore lettura database Firebase: " + error.code;
      renderApp();
    }
  );
}

async function addItem(type, data) {
  try {
    await addDoc(collection(db, "adaHome"), {
      type,
      ...data,
      createdAt: serverTimestamp(),
      createdBy: currentUser.email
    });
  } catch (error) {
    appError = "Errore salvataggio Firebase: " + error.code;
    renderApp();
  }
}

async function removeItem(id) {
  try {
    await deleteDoc(doc(db, "adaHome", id));
  } catch (error) {
    appError = "Errore eliminazione Firebase: " + error.code;
    renderApp();
  }
}

/* =========================================================
   RENDER PRINCIPALE
========================================================= */

function renderLoading() {
  document.body.innerHTML = `
    <main class="ada-wrap">
      <section class="hero">
        <h1>ADA Home</h1>
        <p>Caricamento dati...</p>
        <span class="family-pill">Andrea · Daniela · Antonio</span>
      </section>
    </main>
  `;
}

function renderApp() {
  injectCss();

  const shopping = getItemsByType("spesa");
  const chores = getItemsByType("faccende");
  const deadlines = getItemsByType("scadenze");
  const expenses = getItemsByType("spese");
  const notes = getItemsByType("note");
  const calendar = getItemsByType("calendario");

  const urgentCount = allItems
    .filter((x) => ACTION_TYPES.includes(x.type))
    .filter((x) => getStatus(x) === "rosso")
    .length;

  const todayCount = calendar.filter((x) => isTodayInRange(x.startDate, x.endDate)).length;
  const expensesTotal = getCurrentMonthExpensesTotal(expenses);

  document.body.innerHTML = `
    <main class="ada-wrap">
      <section class="hero">
        <h1>ADA Home</h1>
        <p>Gestione quotidiana della famiglia</p>
        <span class="family-pill">Andrea · Daniela · Antonio</span>
        <div class="today">${formatToday()}</div>
      </section>

      ${appError ? `<section class="card"><div class="error">${escapeHtml(appError)}</div></section>` : ""}

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
          <strong>${todayCount}</strong>
          Impegni oggi
        </div>
        <div class="stat">
          <strong>${formatMoney(expensesTotal)}</strong>
          Spese mese
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
        ${renderDashboard()}
      </section>

      <section class="card panel ${isActive("spesa")}" id="panel-spesa">
        <h2>Lista della spesa</h2>
        <input id="shoppingText" placeholder="Cosa manca in casa?">
        <div class="grid-2">
          ${personSelect("shoppingPerson")}
          ${prioritySelect("shoppingPriority")}
        </div>
        <button class="btn" id="addShoppingBtn">Aggiungi</button>
        <div>${renderItems(shopping)}</div>
      </section>

      <section class="card panel ${isActive("faccende")}" id="panel-faccende">
        <h2>Faccende di casa</h2>
        <input id="choreText" placeholder="Es. Pulire cucina, buttare immondizia">
        <div class="grid-2">
          ${personSelect("chorePerson")}
          ${prioritySelect("chorePriority")}
        </div>
        <button class="btn" id="addChoreBtn">Aggiungi</button>
        <div>${renderItems(chores)}</div>
      </section>

      <section class="card panel ${isActive("scadenze")}" id="panel-scadenze">
        <h2>Scadenze</h2>
        <input id="deadlineText" placeholder="Es. Bolletta luce, assicurazione, pagamento">
        <div class="grid-2">
          <input id="deadlineDate" type="date">
          ${personSelect("deadlinePerson")}
        </div>
        <p class="muted">Il semaforo delle scadenze è automatico: rosso se scaduta o oggi, giallo entro 7 giorni, verde oltre 7 giorni.</p>
        <button class="btn" id="addDeadlineBtn">Aggiungi</button>
        <div>${renderItems(deadlines)}</div>
      </section>

      <section class="card panel ${isActive("calendario")}" id="panel-calendario">
        <h2>Calendario famiglia</h2>
        <input id="calendarTitle" placeholder="Titolo impegno">
        <div class="grid-2">
          <input id="calendarStart" type="date">
          <input id="calendarEnd" type="date">
        </div>
        <div class="grid-2">
          ${personSelect("calendarPerson")}
          ${prioritySelect("calendarPriority")}
        </div>
        <textarea id="calendarNote" placeholder="Note eventuali"></textarea>
        <button class="btn" id="addCalendarBtn">Aggiungi impegno</button>

        <div style="margin-top:18px;">
          <h3>Notifiche</h3>
          ${renderNotificationBox()}
        </div>

        <div>${renderItems(calendar)}</div>
      </section>

      <section class="card panel ${isActive("spese")}" id="panel-spese">
        <h2>Spese familiari</h2>
        <input id="expenseText" placeholder="Descrizione spesa">
        <div class="grid-3">
          <input id="expenseAmount" type="number" step="0.01" placeholder="Importo €">
          <input id="expenseDate" type="date" value="${todayIso()}">
          <select id="expenseCategory">
            <option>Casa</option>
            <option>Spesa</option>
            <option>Auto</option>
            <option>Famiglia</option>
            <option>Extra</option>
          </select>
        </div>
        ${personSelect("expensePerson")}
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

function tabButton(tab, label) {
  return `
    <button class="tab ${activeTab === tab ? "active" : ""}" data-tab="${tab}">
      ${label}
    </button>
  `;
}

function isActive(tab) {
  return activeTab === tab ? "active" : "";
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {
  return `
    <h2>Dashboard priorità</h2>
    <p class="muted">
      Qui vedi le attività assegnate a ogni persona, divise per urgenza e per tipologia.
    </p>

    <div class="dashboard-grid">
      ${FAMILY.map((person) => renderPersonDashboard(person)).join("")}
    </div>
  `;
}

function renderPersonDashboard(person) {
  const items = allItems.filter((x) => {
    return ACTION_TYPES.includes(x.type) && (x.person || "") === person;
  });

  const rossi = items.filter((x) => getStatus(x) === "rosso");
  const gialli = items.filter((x) => getStatus(x) === "giallo");
  const verdi = items.filter((x) => getStatus(x) === "verde");

  const typeCounts = ACTION_TYPES.map((type) => {
    const count = items.filter((x) => x.type === type).length;
    if (!count) return "";
    return `<span class="type-chip">${TYPES[type]}: ${count}</span>`;
  }).join("");

  return `
    <div class="person-card">
      <div class="person-head">
        <h3>${escapeHtml(person)}</h3>
        <span class="pill-count">${items.length} attività</span>
      </div>

      <div class="type-chips">
        ${typeCounts || `<span class="type-chip">Nessuna attività</span>`}
      </div>

      ${renderPriorityBlock("rosso", "Urgenti", rossi)}
      ${renderPriorityBlock("giallo", "Importanti", gialli)}
      ${renderPriorityBlock("verde", "Normali", verdi)}
    </div>
  `;
}

function renderPriorityBlock(status, title, items) {
  return `
    <div class="priority-section">
      <div class="priority-title">
        <span class="mini-dot ${status}"></span>
        ${title} (${items.length})
      </div>
      ${
        items.length
          ? `<ul class="mini-list">${items.slice(0, 6).map((x) => `<li>${miniItemText(x)}</li>`).join("")}</ul>`
          : `<p class="muted">Nessuna.</p>`
      }
    </div>
  `;
}

function miniItemText(item) {
  let text = `<strong>${escapeHtml(item.text || item.title || "")}</strong>`;
  text += ` · ${escapeHtml(TYPES[item.type] || item.type)}`;

  if (item.type === "scadenze") {
    text += ` · ${formatDate(item.deadline)}`;
  }

  if (item.type === "calendario") {
    text += ` · ${formatDateRange(item.startDate, item.endDate)}`;
  }

  return text;
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

    let title = item.text || item.title || "";
    let details = "";

    if (item.type === "spese") {
      details = `
        <small>
          ${escapeHtml(item.category || "Spesa")} · 
          ${escapeHtml(item.person || "")} · 
          ${formatDate(item.expenseDate)}
        </small>
        <div class="money">${formatMoney(item.amount)}</div>
      `;
    } else if (item.type === "scadenze") {
      details = `
        <small>
          ${escapeHtml(item.person || "")} · 
          Scadenza: ${formatDate(item.deadline)}
        </small>
        <span class="badge ${status}">${label}</span>
      `;
    } else if (item.type === "calendario") {
      details = `
        <small>
          ${escapeHtml(item.person || "")} · 
          ${formatDateRange(item.startDate, item.endDate)}
        </small>
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

    return `
      <div class="item ${hasLight ? "with-light" : ""}">
        ${hasLight ? `<span class="semaforo ${status}"></span>` : ""}
        <strong>${escapeHtml(title)}</strong>
        ${details}
        <button class="delete" data-delete="${item.id}">Elimina</button>
      </div>
    `;
  }).join("");
}

function personSelect(id) {
  return `
    <select id="${id}">
      ${FAMILY.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("")}
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
   EVENTI
========================================================= */

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((btn) => {
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

  bindClick("addShoppingBtn", async () => {
    const text = val("shoppingText");
    if (!text) return;

    await addItem("spesa", {
      text,
      person: val("shoppingPerson"),
      priority: val("shoppingPriority")
    });
  });

  bindClick("addChoreBtn", async () => {
    const text = val("choreText");
    if (!text) return;

    await addItem("faccende", {
      text,
      person: val("chorePerson"),
      priority: val("chorePriority")
    });
  });

  bindClick("addDeadlineBtn", async () => {
    const text = val("deadlineText");
    if (!text) return;

    await addItem("scadenze", {
      text,
      person: val("deadlinePerson"),
      deadline: val("deadlineDate")
    });
  });

  bindClick("addCalendarBtn", async () => {
    const title = val("calendarTitle");
    if (!title) return;

    const startDate = val("calendarStart");
    const endDate = val("calendarEnd") || startDate;

    await addItem("calendario", {
      title,
      text: title,
      person: val("calendarPerson"),
      priority: val("calendarPriority"),
      startDate,
      endDate,
      note: val("calendarNote")
    });
  });

  bindClick("addExpenseBtn", async () => {
    const text = val("expenseText");
    const amount = Number(val("expenseAmount") || 0);
    if (!text || amount <= 0) return;

    await addItem("spese", {
      text,
      amount,
      category: val("expenseCategory"),
      person: val("expensePerson"),
      expenseDate: val("expenseDate") || todayIso()
    });
  });

  bindClick("addNoteBtn", async () => {
    const text = val("noteText");
    if (!text) return;

    await addItem("note", {
      text,
      person: val("notePerson")
    });
  });

  bindClick("enableNotificationsBtn", async () => {
    await enableNotifications();
  });
}

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("click", handler);
  }
}

/* =========================================================
   SEMAFORO
========================================================= */

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

  const today = localToday();
  const due = parseLocalDate(deadline);

  if (!due) return "verde";

  const diffDays = Math.ceil((due - today) / 86400000);

  if (diffDays <= 0) return "rosso";
  if (diffDays <= 7) return "giallo";
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

function renderNotificationBox() {
  if (!("Notification" in window)) {
    return `
      <p class="muted">
        Questo browser non supporta le notifiche web.
      </p>
    `;
  }

  const permission = Notification.permission;

  let stato = "non attive";
  if (permission === "granted") stato = "attive";
  if (permission === "denied") stato = "bloccate";

  return `
    <p class="muted">
      Stato notifiche: <strong>${stato}</strong>.
      Le notifiche semplici avvisano per elementi urgenti quando l'app è aperta.
    </p>
    <button class="btn-secondary" id="enableNotificationsBtn">
      Attiva notifiche
    </button>
  `;
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    alert("Notifiche non supportate su questo browser.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    new Notification("ADA Home", {
      body: "Notifiche attivate correttamente."
    });

    checkNotifications();
  }

  renderApp();
}

function checkNotifications() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const todayKey = todayIso();
  const storageKey = "adaHomeNotified_" + todayKey;

  let alreadyNotified = [];

  try {
    alreadyNotified = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    alreadyNotified = [];
  }

  const urgentItems = allItems
    .filter((x) => ACTION_TYPES.includes(x.type))
    .filter((x) => getStatus(x) === "rosso")
    .filter((x) => !alreadyNotified.includes(x.id))
    .slice(0, 5);

  urgentItems.forEach((item) => {
    const title = item.text || item.title || "Attività urgente";

    new Notification("ADA Home - Urgenza", {
      body: `${title} · ${item.person || "Famiglia"}`
    });

    alreadyNotified.push(item.id);
  });

  localStorage.setItem(storageKey, JSON.stringify(alreadyNotified));
}

/* =========================================================
   UTILITY
========================================================= */

function getItemsByType(type) {
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
  if (!d) return dateString;

  return d.toLocaleDateString("it-IT");
}

function formatDateRange(start, end) {
  if (!start && !end) return "date non impostate";

  if (start && !end) {
    return formatDate(start);
  }

  if (start === end) {
    return formatDate(start);
  }

  return `${formatDate(start)} → ${formatDate(end)}`;
}

function formatToday() {
  return new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function localToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseLocalDate(dateString) {
  if (!dateString) return null;

  const parts = String(dateString).split("-");
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);

  if (Number.isNaN(d.getTime())) return null;

  return d;
}

function isTodayInRange(startDate, endDate) {
  const today = localToday();
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate || startDate);

  if (!start) return false;

  return today >= start && today <= end;
}

function getCurrentMonthExpensesTotal(expenses) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return expenses.reduce((sum, item) => {
    const amount = Number(item.amount || 0);
    const d = parseLocalDate(item.expenseDate);

    if (!d) {
      return sum + amount;
    }

    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return sum + amount;
    }

    return sum;
  }, 0);
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
