const STORAGE_KEY = "adaHomeData";

let data = {
  shopping: [],
  tasks: [],
  deadlines: [],
  expenses: [],
  notes: []
};

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    data = JSON.parse(saved);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "Nessuna data";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function getPriorityLabel(priority) {
  if (priority === "rosso") return "🔴 Urgente";
  if (priority === "giallo") return "🟡 Importante";
  return "🟢 Normale";
}

function setTodayDate() {
  const today = new Date();
  document.getElementById("todayDate").textContent = today.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".section");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.section).classList.add("active");
    });
  });
}

function addShoppingItem() {
  const name = document.getElementById("shoppingName").value.trim();
  const category = document.getElementById("shoppingCategory").value;
  const person = document.getElementById("shoppingPerson").value;

  if (!name) {
    alert("Inserisci un prodotto.");
    return;
  }

  data.shopping.unshift({
    id: createId(),
    name,
    category,
    person,
    done: false,
    createdAt: new Date().toISOString()
  });

  document.getElementById("shoppingName").value = "";

  saveData();
  renderAll();
}

function toggleShoppingItem(id) {
  const item = data.shopping.find(x => x.id === id);
  if (item) {
    item.done = !item.done;
    saveData();
    renderAll();
  }
}

function deleteShoppingItem(id) {
  data.shopping = data.shopping.filter(x => x.id !== id);
  saveData();
  renderAll();
}

function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const person = document.getElementById("taskPerson").value;
  const priority = document.getElementById("taskPriority").value;
  const date = document.getElementById("taskDate").value;

  if (!title) {
    alert("Inserisci una faccenda.");
    return;
  }

  data.tasks.unshift({
    id: createId(),
    title,
    person,
    priority,
    date,
    done: false,
    createdAt: new Date().toISOString()
  });

  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDate").value = "";

  saveData();
  renderAll();
}

function toggleTask(id) {
  const item = data.tasks.find(x => x.id === id);
  if (item) {
    item.done = !item.done;
    saveData();
    renderAll();
  }
}

function deleteTask(id) {
  data.tasks = data.tasks.filter(x => x.id !== id);
  saveData();
  renderAll();
}

function addDeadline() {
  const title = document.getElementById("deadlineTitle").value.trim();
  const type = document.getElementById("deadlineType").value;
  const date = document.getElementById("deadlineDate").value;
  const person = document.getElementById("deadlinePerson").value;
  const priority = document.getElementById("deadlinePriority").value;

  if (!title) {
    alert("Inserisci una scadenza.");
    return;
  }

  if (!date) {
    alert("Inserisci una data di scadenza.");
    return;
  }

  data.deadlines.unshift({
    id: createId(),
    title,
    type,
    date,
    person,
    priority,
    done: false,
    createdAt: new Date().toISOString()
  });

  document.getElementById("deadlineTitle").value = "";
  document.getElementById("deadlineDate").value = "";

  saveData();
  renderAll();
}

function toggleDeadline(id) {
  const item = data.deadlines.find(x => x.id === id);
  if (item) {
    item.done = !item.done;
    saveData();
    renderAll();
  }
}

function deleteDeadline(id) {
  data.deadlines = data.deadlines.filter(x => x.id !== id);
  saveData();
  renderAll();
}

function addExpense() {
  const title = document.getElementById("expenseTitle").value.trim();
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const category = document.getElementById("expenseCategory").value;
  const person = document.getElementById("expensePerson").value;

  if (!title) {
    alert("Inserisci una descrizione.");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert("Inserisci un importo valido.");
    return;
  }

  data.expenses.unshift({
    id: createId(),
    title,
    amount,
    category,
    person,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });

  document.getElementById("expenseTitle").value = "";
  document.getElementById("expenseAmount").value = "";

  saveData();
  renderAll();
}

function deleteExpense(id) {
  data.expenses = data.expenses.filter(x => x.id !== id);
  saveData();
  renderAll();
}

function addNote() {
  const title = document.getElementById("noteTitle").value.trim();
  const text = document.getElementById("noteText").value.trim();

  if (!title && !text) {
    alert("Inserisci una nota.");
    return;
  }

  data.notes.unshift({
    id: createId(),
    title: title || "Nota senza titolo",
    text,
    createdAt: new Date().toISOString()
  });

  document.getElementById("noteTitle").value = "";
  document.getElementById("noteText").value = "";

  saveData();
  renderAll();
}

function deleteNote(id) {
  data.notes = data.notes.filter(x => x.id !== id);
  saveData();
  renderAll();
}

function renderShopping() {
  const container = document.getElementById("shoppingList");

  if (data.shopping.length === 0) {
    container.innerHTML = `<div class="empty">Nessun prodotto nella lista spesa.</div>`;
    return;
  }

  container.innerHTML = data.shopping.map(item => `
    <div class="item ${item.done ? "done" : ""}">
      <div class="item-main">
        <div class="item-title">${escapeHtml(item.name)}</div>
        <div class="item-meta">${escapeHtml(item.category)} · Inserito da ${escapeHtml(item.person)}</div>
      </div>
      <div class="item-actions">
        <button onclick="toggleShoppingItem('${item.id}')">${item.done ? "Ripristina" : "Comprato"}</button>
        <button class="delete" onclick="deleteShoppingItem('${item.id}')">Elimina</button>
      </div>
    </div>
  `).join("");
}

function renderTasks() {
  const container = document.getElementById("taskList");

  if (data.tasks.length === 0) {
    container.innerHTML = `<div class="empty">Nessuna faccenda inserita.</div>`;
    return;
  }

  container.innerHTML = data.tasks.map(item => `
    <div class="item ${item.done ? "done" : ""} priority-${item.priority}">
      <div class="item-main">
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">
          ${escapeHtml(item.person)} · ${getPriorityLabel(item.priority)} · ${formatDate(item.date)}
        </div>
      </div>
      <div class="item-actions">
        <button onclick="toggleTask('${item.id}')">${item.done ? "Ripristina" : "Fatto"}</button>
        <button class="delete" onclick="deleteTask('${item.id}')">Elimina</button>
      </div>
    </div>
  `).join("");
}

function renderDeadlines() {
  const container = document.getElementById("deadlineList");

  if (data.deadlines.length === 0) {
    container.innerHTML = `<div class="empty">Nessuna scadenza inserita.</div>`;
    return;
  }

  container.innerHTML = data.deadlines.map(item => `
    <div class="item ${item.done ? "done" : ""} priority-${item.priority}">
      <div class="item-main">
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">
          ${escapeHtml(item.type)} · ${escapeHtml(item.person)} · ${getPriorityLabel(item.priority)} · ${formatDate(item.date)}
        </div>
      </div>
      <div class="item-actions">
        <button onclick="toggleDeadline('${item.id}')">${item.done ? "Ripristina" : "Pagata/Fatta"}</button>
        <button class="delete" onclick="deleteDeadline('${item.id}')">Elimina</button>
      </div>
    </div>
  `).join("");
}

function renderExpenses() {
  const container = document.getElementById("expenseList");

  if (data.expenses.length === 0) {
    container.innerHTML = `<div class="empty">Nessuna spesa registrata.</div>`;
    return;
  }

  container.innerHTML = data.expenses.map(item => `
    <div class="item">
      <div class="item-main">
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">
          ${escapeHtml(item.category)} · ${escapeHtml(item.person)} · ${new Date(item.date).toLocaleDateString("it-IT")}
        </div>
      </div>
      <div class="item-actions">
        <span class="amount">${item.amount.toFixed(2)} €</span>
        <button class="delete" onclick="deleteExpense('${item.id}')">Elimina</button>
      </div>
    </div>
  `).join("");
}

function renderNotes() {
  const container = document.getElementById("noteList");

  if (data.notes.length === 0) {
    container.innerHTML = `<div class="empty">Nessuna nota inserita.</div>`;
    return;
  }

  container.innerHTML = data.notes.map(item => `
    <div class="item">
      <div class="item-main">
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">${escapeHtml(item.text)}</div>
      </div>
      <div class="item-actions">
        <button class="delete" onclick="deleteNote('${item.id}')">Elimina</button>
      </div>
    </div>
  `).join("");
}

function renderDashboard() {
  const urgentTasks = data.tasks.filter(x => x.priority === "rosso" && !x.done).length;
  const urgentDeadlines = data.deadlines.filter(x => x.priority === "rosso" && !x.done).length;
  const shoppingOpen = data.shopping.filter(x => !x.done).length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTotal = data.expenses
    .filter(x => {
      const d = new Date(x.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, x) => sum + Number(x.amount || 0), 0);

  document.getElementById("urgentCount").textContent = urgentTasks + urgentDeadlines;
  document.getElementById("shoppingCount").textContent = shoppingOpen;
  document.getElementById("expenseTotal").textContent = monthTotal.toFixed(2) + " €";
}

function renderAll() {
  renderShopping();
  renderTasks();
  renderDeadlines();
  renderExpenses();
  renderNotes();
  renderDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setTodayDate();
  setupTabs();
  renderAll();
});
