"use strict";
const API_BASE = "/api/items";
const listEl = getRequiredElement("list-items");
const formEl = getRequiredElement("form-item");
const messageEl = getRequiredElement("message");
const overlayEl = getRequiredElement("modal-overlay");
const editFormEl = getRequiredElement("form-edit");
const cancelEditBtn = getRequiredElement("btn-cancel-edit");
const addPanelEl = getRequiredElement("add-panel");
const toggleFormBtn = getRequiredElement("btn-toggle-form");
const searchInputEl = getRequiredElement("input-search");
const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const summaryEls = {
    total: getRequiredElement("stats-total"),
    pending: getRequiredElement("stats-pending"),
    purchased: getRequiredElement("stats-purchased"),
    quantity: getRequiredElement("stats-quantity"),
    listSummary: getRequiredElement("list-summary"),
    statusChip: getRequiredElement("status-chip"),
};
const state = {
    items: [],
    query: "",
    filter: "all",
};
let messageTimeoutId = 0;
function getRequiredElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Elemento não encontrado: ${id}`);
    }
    return element;
}
function showMessage(text, type = "success") {
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
    div.textContent = value;
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
async function fetchJson(url, init) {
    const response = await fetch(url, init);
    if (!response.ok) {
        const data = (await response.json().catch(() => ({})));
        throw new Error(data.error || "Erro ao processar a requisicao.");
    }
    if (response.status === 204) {
        return undefined;
    }
    return (await response.json());
}
function syncToggleFormButton() {
    toggleFormBtn.textContent = addPanelEl.classList.contains("hidden")
        ? "+ Adicionar produto"
        : "Fechar cadastro";
}
function toggleAddPanel(forceOpen) {
    const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : addPanelEl.classList.contains("hidden");
    addPanelEl.classList.toggle("hidden", !shouldOpen);
    syncToggleFormButton();
    if (shouldOpen) {
        getRequiredElement("input-name").focus();
    }
}
function setStatusChip(text, variant) {
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
        const matchesFilter = state.filter === "all" ||
            (state.filter === "pending" && !item.purchased) ||
            (state.filter === "purchased" && item.purchased);
        if (!matchesFilter)
            return false;
        if (!normalizedQuery)
            return true;
        const haystack = normalizeText(`${item.name} ${formatUnit(item.unit)}`);
        return haystack.includes(normalizedQuery);
    });
}
function updateDashboard(items, hasError = false) {
    const total = items.length;
    const purchased = items.filter((item) => item.purchased).length;
    const pending = total - purchased;
    const quantity = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    summaryEls.total.textContent = String(total);
    summaryEls.pending.textContent = String(pending);
    summaryEls.purchased.textContent = String(purchased);
    summaryEls.quantity.textContent = String(quantity);
    if (hasError) {
        summaryEls.listSummary.textContent = "Nao foi possivel carregar a lista.";
        setStatusChip("Sem conexao", "is-error");
    }
}
function updateListMeta(filteredItems) {
    const total = state.items.length;
    const purchased = state.items.filter((item) => item.purchased).length;
    const pending = total - purchased;
    const hasFilters = Boolean(state.query) || state.filter !== "all";
    if (total === 0) {
        summaryEls.listSummary.textContent = "Sua lista ainda esta vazia";
        setStatusChip("Pronto para comecar", "is-ready");
        return;
    }
    if (hasFilters) {
        summaryEls.listSummary.textContent =
            `Mostrando ${filteredItems.length} de ${total} ${pluralize(total, "produto", "produtos")}`;
        setStatusChip("Filtros aplicados", "is-neutral");
        return;
    }
    summaryEls.listSummary.textContent =
        `${pending} ${pluralize(pending, "produto pendente", "produtos pendentes")}`;
    if (pending === 0) {
        setStatusChip("Tudo comprado", "is-success");
    }
    else if (purchased === 0) {
        setStatusChip("Carrinho aberto", "is-ready");
    }
    else {
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
    li.querySelector(".btn-toggle")?.addEventListener("click", () => {
        toggleItem(item._id).catch((error) => {
            const message = error instanceof Error ? error.message : "Erro ao atualizar item.";
            showMessage(message, "error");
        });
    });
    li.querySelector(".btn-edit")?.addEventListener("click", () => {
        openEditModal(item);
    });
    li.querySelector(".btn-delete")?.addEventListener("click", () => {
        deleteItem(item._id).catch((error) => {
            const message = error instanceof Error ? error.message : "Erro ao remover item.";
            showMessage(message, "error");
        });
    });
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
        state.items = await fetchJson(API_BASE);
        updateDashboard(state.items);
        renderItems();
    }
    catch (error) {
        state.items = [];
        listEl.innerHTML = "";
        listEl.appendChild(createEmptyState("error"));
        updateDashboard([], true);
        console.error(error);
    }
}
async function addItem(event) {
    event.preventDefault();
    const nameInput = getRequiredElement("input-name");
    const quantityInput = getRequiredElement("input-quantity");
    const unitInput = getRequiredElement("input-unit");
    const name = nameInput.value.trim();
    const quantity = parseInt(quantityInput.value, 10) || 1;
    const unit = unitInput.value.trim() || "un";
    if (!name) {
        showMessage("Informe o nome do item.", "error");
        return;
    }
    await fetchJson(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity, unit }),
    });
    formEl.reset();
    quantityInput.value = "1";
    unitInput.value = "un";
    toggleAddPanel(false);
    await loadItems();
    showMessage("Produto adicionado com sucesso.");
}
async function toggleItem(id) {
    await fetchJson(`${API_BASE}/${id}/toggle`, { method: "PATCH" });
    await loadItems();
}
async function deleteItem(id) {
    if (!window.confirm("Remover este item da lista?"))
        return;
    await fetchJson(`${API_BASE}/${id}`, { method: "DELETE" });
    await loadItems();
    showMessage("Produto removido.");
}
function openEditModal(item) {
    getRequiredElement("edit-id").value = item._id;
    getRequiredElement("edit-name").value = item.name;
    getRequiredElement("edit-quantity").value = String(item.quantity);
    getRequiredElement("edit-unit").value = formatUnit(item.unit);
    overlayEl.classList.remove("hidden");
    document.body.classList.add("modal-open");
    getRequiredElement("edit-name").focus();
}
function closeEditModal() {
    overlayEl.classList.add("hidden");
    document.body.classList.remove("modal-open");
}
async function saveEdit(event) {
    event.preventDefault();
    const id = getRequiredElement("edit-id").value;
    const name = getRequiredElement("edit-name").value.trim();
    const quantity = parseInt(getRequiredElement("edit-quantity").value, 10) || 1;
    const unit = getRequiredElement("edit-unit").value.trim() || "un";
    if (!name) {
        showMessage("Nome do item e obrigatorio.", "error");
        return;
    }
    await fetchJson(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity, unit }),
    });
    closeEditModal();
    await loadItems();
    showMessage("Produto atualizado.");
}
formEl.addEventListener("submit", (event) => {
    addItem(event).catch((error) => {
        const message = error instanceof Error ? error.message : "Erro ao adicionar item.";
        showMessage(message, "error");
    });
});
toggleFormBtn.addEventListener("click", () => toggleAddPanel());
searchInputEl.addEventListener("input", (event) => {
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
overlayEl.addEventListener("click", (event) => {
    if (event.target.id === "modal-overlay")
        closeEditModal();
});
editFormEl.addEventListener("submit", (event) => {
    saveEdit(event).catch((error) => {
        const message = error instanceof Error ? error.message : "Erro ao atualizar item.";
        showMessage(message, "error");
    });
});
cancelEditBtn.addEventListener("click", closeEditModal);
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlayEl.classList.contains("hidden")) {
        closeEditModal();
    }
});
syncToggleFormButton();
updateFilterButtons();
loadItems().catch((error) => {
    const message = error instanceof Error ? error.message : "Erro ao carregar a lista.";
    showMessage(message, "error");
});
