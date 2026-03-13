const API_BASE = "/api/items";

const listEl = document.getElementById("list-items");
const formEl = document.getElementById("form-item");
const messageEl = document.getElementById("message");
const overlayEl = document.getElementById("modal-overlay");
const editFormEl = document.getElementById("form-edit");
const cancelEditBtn = document.getElementById("btn-cancel-edit");
const addPanelEl = document.getElementById("add-panel");
const toggleFormBtn = document.getElementById("btn-toggle-form");
const searchInputEl = document.getElementById("input-search");
const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));

const summaryEls = {
  total: document.getElementById("stats-total"),
  pending: document.getElementById("stats-pending"),
  purchased: document.getElementById("stats-purchased"),
  quantity: document.getElementById("stats-quantity"),
  listSummary: document.getElementById("list-summary"),
  statusChip: document.getElementById("status-chip"),
};

const state = {
  items: [],
  query: "",
  filter: "all",
};

let messageTimeoutId;

function showMessage(text, type = "success") {
  if (!messageEl) return;

  window.clearTimeout(messageTimeoutId);
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.classList.remove("hidden");

  messageTimeoutId = window.setTimeout(() => {
    messageEl.classList.add("hidden");
  }, 3000);
}

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

function formatUnit(unit) {
  return String(unit || "un").trim() || "un";
}

function getItemInitial(name) {
  const value = String(name || "").trim();
  return value ? value.charAt(0).toUpperCase() : "?";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function syncToggleFormButton() {
  if (!toggleFormBtn || !addPanelEl) return;
  toggleFormBtn.textContent = addPanelEl.classList.contains("hidden")
    ? "+ Adicionar produto"
    : "Fechar cadastro";
}

function toggleAddPanel(forceOpen) {
  if (!addPanelEl) return;

  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : addPanelEl.classList.contains("hidden");

  addPanelEl.classList.toggle("hidden", !shouldOpen);
  syncToggleFormButton();

  if (shouldOpen) {
    document.getElementById("input-name")?.focus();
  }
}

function setStatusChip(text, variant) {
  if (!summaryEls.statusChip) return;
  summaryEls.statusChip.textContent = text;
  summaryEls.statusChip.className = `status-chip ${variant}`;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
}

function getFilteredItems() {
  const normalizedQuery = normalizeText(state.query);

  return state.items.filter((item) => {
    const matchesFilter =
      state.filter === "all" ||
      (state.filter === "pending" && !item.purchased) ||
      (state.filter === "purchased" && item.purchased);

    if (!matchesFilter) return false;
    if (!normalizedQuery) return true;

    const haystack = normalizeText(`${item.name} ${formatUnit(item.unit)}`);
    return haystack.includes(normalizedQuery);
  });
}

function updateDashboard(items, hasError = false) {
  const total = items.length;
  const purchased = items.filter((item) => item.purchased).length;
  const pending = total - purchased;
  const quantity = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  if (summaryEls.total) summaryEls.total.textContent = String(total);
  if (summaryEls.pending) summaryEls.pending.textContent = String(pending);
  if (summaryEls.purchased) summaryEls.purchased.textContent = String(purchased);
  if (summaryEls.quantity) summaryEls.quantity.textContent = String(quantity);

  if (hasError) {
    if (summaryEls.listSummary) summaryEls.listSummary.textContent = "Nao foi possivel carregar a lista.";
    setStatusChip("Sem conexao", "is-error");
  }
}

function updateListMeta(filteredItems) {
  const total = state.items.length;
  const purchased = state.items.filter((item) => item.purchased).length;
  const pending = total - purchased;
  const hasFilters = Boolean(state.query) || state.filter !== "all";

  if (total === 0) {
    if (summaryEls.listSummary) summaryEls.listSummary.textContent = "Sua lista ainda esta vazia";
    setStatusChip("Pronto para comecar", "is-ready");
    return;
  }

  if (hasFilters) {
    if (summaryEls.listSummary) {
      summaryEls.listSummary.textContent =
        `Mostrando ${filteredItems.length} de ${total} ${pluralize(total, "produto", "produtos")}`;
    }
    setStatusChip("Filtros aplicados", "is-neutral");
    return;
  }

  if (summaryEls.listSummary) {
    summaryEls.listSummary.textContent =
      `${pending} ${pluralize(pending, "produto pendente", "produtos pendentes")}`;
  }

  if (pending === 0) {
    setStatusChip("Tudo comprado", "is-success");
  } else if (purchased === 0) {
    setStatusChip("Carrinho aberto", "is-ready");
  } else {
    setStatusChip(`${purchased} concluidos`, "is-success");
  }
}

function createEmptyState(type = "empty") {
  const li = document.createElement("li");
  li.className = "empty-state";

  if (type === "error") {
    li.innerHTML = `
      <div class="empty-state-icon">!</div>
      <strong>Falha ao carregar a lista</strong>
      <p>Verifique se o servidor esta rodando e tente novamente.</p>
    `;
    return li;
  }

  if (type === "search") {
    li.innerHTML = `
      <div class="empty-state-icon">?</div>
      <strong>Nenhum produto encontrado</strong>
      <p>Tente outro termo de busca ou mude o filtro da listagem.</p>
    `;
    return li;
  }

  li.innerHTML = `
    <div class="empty-state-icon">+</div>
    <strong>Nenhum produto cadastrado</strong>
    <p>Use o botao "Adicionar produto" para comecar sua lista.</p>
  `;

  return li;
}

function createItemElement(item) {
  const li = document.createElement("li");
  li.className = `item-card${item.purchased ? " purchased" : ""}`;

  const name = escapeHtml(item.name);
  const unit = escapeHtml(formatUnit(item.unit));
  const initial = escapeHtml(getItemInitial(item.name));
  const statusClass = item.purchased ? "done" : "pending";
  const statusLabel = item.purchased ? "Comprado" : "Pendente";
  const toggleTitle = item.purchased ? "Marcar como pendente" : "Marcar como comprado";

  li.innerHTML = `
    <div class="item-cell item-product">
      <button
        type="button"
        class="btn-toggle"
        data-id="${item._id}"
        aria-label="${toggleTitle}"
        title="${toggleTitle}"
      ></button>

      <div class="item-thumb" aria-hidden="true">${initial}</div>

      <div class="item-copy">
        <span class="item-name">${name}</span>
        <span class="item-caption">Produto da sua lista de compras</span>
      </div>
    </div>

    <div class="item-cell item-value">
      <span class="cell-label">Quantity</span>
      <span>${item.quantity}</span>
    </div>

    <div class="item-cell item-value">
      <span class="cell-label">Unit</span>
      <span>${unit}</span>
    </div>

    <div class="item-cell item-status-wrap">
      <span class="cell-label">Status</span>
      <span class="item-status ${statusClass}">${statusLabel}</span>
    </div>

    <div class="item-cell item-actions">
      <span class="cell-label">Actions</span>
      <button type="button" class="btn-edit" data-id="${item._id}" title="Editar item">Editar</button>
      <button type="button" class="btn-delete" data-id="${item._id}" title="Remover item">Remover</button>
    </div>
  `;

  li.querySelector(".btn-toggle")?.addEventListener("click", () => toggleItem(item._id));
  li.querySelector(".btn-edit")?.addEventListener("click", () => openEditModal(item));
  li.querySelector(".btn-delete")?.addEventListener("click", () => deleteItem(item._id));

  return li;
}

function renderItems() {
  const filteredItems = getFilteredItems();
  listEl.innerHTML = "";
  updateListMeta(filteredItems);

  if (state.items.length === 0) {
    listEl.appendChild(createEmptyState());
    return;
  }

  if (filteredItems.length === 0) {
    listEl.appendChild(createEmptyState("search"));
    return;
  }

  filteredItems.forEach((item) => listEl.appendChild(createItemElement(item)));
}

async function loadItems() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error("Falha ao carregar itens");

    state.items = await res.json();
    updateDashboard(state.items);
    renderItems();
  } catch (error) {
    state.items = [];
    listEl.innerHTML = "";
    listEl.appendChild(createEmptyState("error"));
    updateDashboard([], true);
    console.error(error);
  }
}

async function addItem(event) {
  event.preventDefault();

  const nameInput = document.getElementById("input-name");
  const quantityInput = document.getElementById("input-quantity");
  const unitInput = document.getElementById("input-unit");

  const name = nameInput.value.trim();
  const quantity = parseInt(quantityInput.value, 10) || 1;
  const unit = unitInput.value.trim() || "un";

  if (!name) {
    showMessage("Informe o nome do item.", "error");
    return;
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity, unit }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Erro ao adicionar");
    }

    formEl.reset();
    quantityInput.value = 1;
    unitInput.value = "un";
    toggleAddPanel(false);
    await loadItems();
    showMessage("Produto adicionado com sucesso.");
  } catch (error) {
    showMessage(error.message || "Erro ao adicionar item.", "error");
  }
}

async function toggleItem(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}/toggle`, { method: "PATCH" });
    if (!res.ok) throw new Error("Erro ao atualizar");

    await loadItems();
  } catch (error) {
    showMessage("Erro ao atualizar item.", "error");
  }
}

async function deleteItem(id) {
  if (!window.confirm("Remover este item da lista?")) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao remover");

    await loadItems();
    showMessage("Produto removido.");
  } catch (error) {
    showMessage("Erro ao remover item.", "error");
  }
}

function openEditModal(item) {
  if (!overlayEl) return;

  document.getElementById("edit-id").value = item._id;
  document.getElementById("edit-name").value = item.name;
  document.getElementById("edit-quantity").value = item.quantity;
  document.getElementById("edit-unit").value = formatUnit(item.unit);

  overlayEl.classList.remove("hidden");
  document.body.classList.add("modal-open");
  document.getElementById("edit-name")?.focus();
}

function closeEditModal() {
  if (!overlayEl) return;
  overlayEl.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function saveEdit(event) {
  event.preventDefault();

  const id = document.getElementById("edit-id").value;
  const name = document.getElementById("edit-name").value.trim();
  const quantity = parseInt(document.getElementById("edit-quantity").value, 10) || 1;
  const unit = document.getElementById("edit-unit").value.trim() || "un";

  if (!name) {
    showMessage("Nome do item e obrigatorio.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity, unit }),
    });

    if (!res.ok) throw new Error("Erro ao salvar");

    closeEditModal();
    await loadItems();
    showMessage("Produto atualizado.");
  } catch (error) {
    showMessage("Erro ao atualizar item.", "error");
  }
}

formEl?.addEventListener("submit", addItem);
toggleFormBtn?.addEventListener("click", () => toggleAddPanel());
searchInputEl?.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderItems();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter || "all";
    updateFilterButtons();
    renderItems();
  });
});

overlayEl?.addEventListener("click", (event) => {
  if (event.target.id === "modal-overlay") closeEditModal();
});

editFormEl?.addEventListener("submit", saveEdit);
cancelEditBtn?.addEventListener("click", closeEditModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && overlayEl && !overlayEl.classList.contains("hidden")) {
    closeEditModal();
  }
});

syncToggleFormButton();
updateFilterButtons();
loadItems();
