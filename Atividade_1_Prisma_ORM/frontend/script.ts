const API_BASE = "/api";

type SectionName = "pessoas" | "carros" | "associacoes";
type MessageType = "success" | "error";
type FormMode = "create" | "edit";

interface Pessoa {
  id: number;
  nome: string;
  email: string;
}

interface Carro {
  id: number;
  modelo: string;
  marca: string;
  ano: number;
}

interface Associacao {
  pessoaId: number;
  carroId: number;
  pessoa?: Pessoa;
  carro?: Carro;
}

interface ApiError {
  error?: string;
}

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab-button"));
const sections = Array.from(document.querySelectorAll<HTMLElement>(".secao"));
const pessoaTableBody = getRequiredElement<HTMLTableSectionElement>("#tabela-pessoas tbody");
const carroTableBody = getRequiredElement<HTMLTableSectionElement>("#tabela-carros tbody");
const associacaoTableBody = getRequiredElement<HTMLTableSectionElement>("#tabela-associacoes tbody");
const pessoaSelect = getRequiredElement<HTMLSelectElement>("#select-pessoa");
const carroSelect = getRequiredElement<HTMLSelectElement>("#select-carro");
const pessoaForm = getRequiredElement<HTMLFormElement>("#form-pessoa");
const carroForm = getRequiredElement<HTMLFormElement>("#form-carro");
const associacaoForm = getRequiredElement<HTMLFormElement>("#form-associacao");
const pessoaSubmitButton = getRequiredElement<HTMLButtonElement>("#pessoa-submit");
const carroSubmitButton = getRequiredElement<HTMLButtonElement>("#carro-submit");
const pessoaCancelButton = getRequiredElement<HTMLButtonElement>("#pessoa-cancelar");
const carroCancelButton = getRequiredElement<HTMLButtonElement>("#carro-cancelar");
const pessoaFormStatus = getRequiredElement<HTMLParagraphElement>("#pessoa-form-status");
const carroFormStatus = getRequiredElement<HTMLParagraphElement>("#carro-form-status");
const statPessoas = getRequiredElement<HTMLElement>("#stat-pessoas");
const statCarros = getRequiredElement<HTMLElement>("#stat-carros");
const statAssociacoes = getRequiredElement<HTMLElement>("#stat-associacoes");
const heroSummaryText = getRequiredElement<HTMLParagraphElement>("#hero-summary-text");
const pessoasBadge = getRequiredElement<HTMLSpanElement>("#pessoas-badge");
const carrosBadge = getRequiredElement<HTMLSpanElement>("#carros-badge");
const associacoesBadge = getRequiredElement<HTMLSpanElement>("#associacoes-badge");
const messageEl = getRequiredElement<HTMLDivElement>("#message");

const dashboardCounts = {
  pessoas: 0,
  carros: 0,
  associacoes: 0,
};

let messageTimeoutId = 0;

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Elemento não encontrado: ${selector}`);
  }

  return element;
}

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function getPluralLabel(
  count: number,
  singular: string,
  plural: string,
  includeCount = true,
): string {
  const label = count === 1 ? singular : plural;
  return includeCount ? `${count} ${label}` : label;
}

function syncDashboard() {
  statPessoas.textContent = String(dashboardCounts.pessoas);
  statCarros.textContent = String(dashboardCounts.carros);
  statAssociacoes.textContent = String(dashboardCounts.associacoes);

  pessoasBadge.textContent = getPluralLabel(
    dashboardCounts.pessoas,
    "registro",
    "registros",
  );
  carrosBadge.textContent = getPluralLabel(
    dashboardCounts.carros,
    "registro",
    "registros",
  );
  associacoesBadge.textContent = getPluralLabel(
    dashboardCounts.associacoes,
    "registro",
    "registros",
  );

  if (
    dashboardCounts.pessoas === 0 &&
    dashboardCounts.carros === 0 &&
    dashboardCounts.associacoes === 0
  ) {
    heroSummaryText.textContent =
      "Cadastre os primeiros registros para visualizar o resumo do sistema.";
    return;
  }

  heroSummaryText.textContent =
    `${getPluralLabel(dashboardCounts.pessoas, "pessoa cadastrada", "pessoas cadastradas")}, ` +
    `${getPluralLabel(dashboardCounts.carros, "carro cadastrado", "carros cadastrados")} e ` +
    `${getPluralLabel(dashboardCounts.associacoes, "associação ativa", "associações ativas")}.`;
}

function showSection(sectionName: SectionName) {
  sections.forEach((section) => {
    section.classList.toggle("ativa", section.id === `secao-${sectionName}`);
  });

  tabs.forEach((button) => {
    button.classList.toggle("ativa", button.dataset.section === sectionName);
  });
}

function showMessage(text: string, type: MessageType = "success") {
  window.clearTimeout(messageTimeoutId);
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.classList.remove("hidden");

  messageTimeoutId = window.setTimeout(() => {
    messageEl.classList.add("hidden");
  }, 3200);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(data.error || "Erro ao processar a requisição.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function setSelectOptions<T extends Pessoa | Carro>(
  select: HTMLSelectElement,
  items: T[],
  placeholder: string,
  getLabel: (item: T) => string,
) {
  select.innerHTML = `<option value="">${placeholder}</option>`;

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = getLabel(item);
    select.appendChild(option);
  });
}

function createCell(label: string, content: string): string {
  return `<td data-label="${label}">${content}</td>`;
}

function renderEmptyState(
  tableBody: HTMLTableSectionElement,
  colSpan: number,
  title: string,
  description: string,
) {
  const row = document.createElement("tr");
  row.className = "empty-row";
  row.innerHTML = `
    <td colspan="${colSpan}">
      <div class="empty-state">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(description)}</span>
      </div>
    </td>
  `;

  tableBody.appendChild(row);
}

function setPessoaFormMode(mode: FormMode) {
  if (mode === "edit") {
    pessoaSubmitButton.textContent = "Salvar alterações";
    pessoaCancelButton.classList.remove("hidden");
    pessoaFormStatus.textContent =
      "Você está editando uma pessoa existente. Salve ou cancele a alteração.";
    return;
  }

  pessoaSubmitButton.textContent = "Cadastrar pessoa";
  pessoaCancelButton.classList.add("hidden");
  pessoaFormStatus.textContent =
    "Preencha os campos para cadastrar uma nova pessoa.";
}

function setCarroFormMode(mode: FormMode) {
  if (mode === "edit") {
    carroSubmitButton.textContent = "Salvar alterações";
    carroCancelButton.classList.remove("hidden");
    carroFormStatus.textContent =
      "Você está editando um carro existente. Salve ou cancele a alteração.";
    return;
  }

  carroSubmitButton.textContent = "Cadastrar carro";
  carroCancelButton.classList.add("hidden");
  carroFormStatus.textContent = "Preencha os campos para cadastrar um novo carro.";
}

function resetPessoaForm() {
  pessoaForm.reset();
  getRequiredElement<HTMLInputElement>("#pessoa-id").value = "";
  setPessoaFormMode("create");
}

function resetCarroForm() {
  carroForm.reset();
  getRequiredElement<HTMLInputElement>("#carro-id").value = "";
  setCarroFormMode("create");
}

function renderPessoas(pessoas: Pessoa[]) {
  pessoaTableBody.innerHTML = "";

  if (pessoas.length === 0) {
    renderEmptyState(
      pessoaTableBody,
      4,
      "Nenhuma pessoa cadastrada",
      "Cadastre uma pessoa para começar a montar a base do sistema.",
    );
    return;
  }

  pessoas.forEach((pessoa) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      ${createCell("ID", String(pessoa.id))}
      ${createCell("Nome", escapeHtml(pessoa.nome))}
      ${createCell("E-mail", escapeHtml(pessoa.email))}
      <td data-label="Ações">
        <div class="acoes">
          <button
            type="button"
            class="acao editar"
            data-action="edit-pessoa"
            data-id="${pessoa.id}"
            data-nome="${escapeHtml(pessoa.nome)}"
            data-email="${escapeHtml(pessoa.email)}"
          >
            Editar
          </button>
          <button
            type="button"
            class="acao excluir"
            data-action="delete-pessoa"
            data-id="${pessoa.id}"
          >
            Excluir
          </button>
        </div>
      </td>
    `;

    pessoaTableBody.appendChild(row);
  });
}

function renderCarros(carros: Carro[]) {
  carroTableBody.innerHTML = "";

  if (carros.length === 0) {
    renderEmptyState(
      carroTableBody,
      5,
      "Nenhum carro cadastrado",
      "Adicione um carro para começar a relacionar os veículos com as pessoas.",
    );
    return;
  }

  carros.forEach((carro) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      ${createCell("ID", String(carro.id))}
      ${createCell("Modelo", escapeHtml(carro.modelo))}
      ${createCell("Marca", escapeHtml(carro.marca))}
      ${createCell("Ano", String(carro.ano))}
      <td data-label="Ações">
        <div class="acoes">
          <button
            type="button"
            class="acao editar"
            data-action="edit-carro"
            data-id="${carro.id}"
            data-modelo="${escapeHtml(carro.modelo)}"
            data-marca="${escapeHtml(carro.marca)}"
            data-ano="${carro.ano}"
          >
            Editar
          </button>
          <button
            type="button"
            class="acao excluir"
            data-action="delete-carro"
            data-id="${carro.id}"
          >
            Excluir
          </button>
        </div>
      </td>
    `;

    carroTableBody.appendChild(row);
  });
}

function renderAssociacoes(associacoes: Associacao[]) {
  associacaoTableBody.innerHTML = "";

  if (associacoes.length === 0) {
    renderEmptyState(
      associacaoTableBody,
      8,
      "Nenhuma associação cadastrada",
      "Associe uma pessoa a um carro para visualizar os vínculos nesta tabela.",
    );
    return;
  }

  associacoes.forEach((associacao) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      ${createCell("ID da pessoa", String(associacao.pessoaId))}
      ${createCell("ID do carro", String(associacao.carroId))}
      ${createCell("Pessoa", escapeHtml(associacao.pessoa?.nome || "—"))}
      ${createCell("E-mail", escapeHtml(associacao.pessoa?.email || "—"))}
      ${createCell("Carro", escapeHtml(associacao.carro?.modelo || "—"))}
      ${createCell("Marca", escapeHtml(associacao.carro?.marca || "—"))}
      ${createCell("Ano", associacao.carro ? String(associacao.carro.ano) : "—")}
      <td data-label="Ações">
        <div class="acoes">
          <button
            type="button"
            class="acao excluir"
            data-action="delete-associacao"
            data-pessoa-id="${associacao.pessoaId}"
            data-carro-id="${associacao.carroId}"
          >
            Excluir
          </button>
        </div>
      </td>
    `;

    associacaoTableBody.appendChild(row);
  });
}

async function carregarPessoas() {
  const pessoas = await fetchJson<Pessoa[]>(`${API_BASE}/pessoas`);
  dashboardCounts.pessoas = pessoas.length;
  syncDashboard();
  renderPessoas(pessoas);
  setSelectOptions(pessoaSelect, pessoas, "Selecione uma pessoa", (pessoa) => {
    return `${pessoa.id} · ${pessoa.nome}`;
  });
}

async function carregarCarros() {
  const carros = await fetchJson<Carro[]>(`${API_BASE}/carros`);
  dashboardCounts.carros = carros.length;
  syncDashboard();
  renderCarros(carros);
  setSelectOptions(carroSelect, carros, "Selecione um carro", (carro) => {
    return `${carro.id} · ${carro.modelo}`;
  });
}

async function carregarAssociacoes() {
  const associacoes = await fetchJson<Associacao[]>(`${API_BASE}/associacoes`);
  dashboardCounts.associacoes = associacoes.length;
  syncDashboard();
  renderAssociacoes(associacoes);
}

function preencherFormularioPessoa(id: number, nome: string, email: string) {
  getRequiredElement<HTMLInputElement>("#pessoa-id").value = String(id);
  getRequiredElement<HTMLInputElement>("#pessoa-nome").value = nome;
  getRequiredElement<HTMLInputElement>("#pessoa-email").value = email;
  setPessoaFormMode("edit");
  showSection("pessoas");
}

function preencherFormularioCarro(id: number, modelo: string, marca: string, ano: number) {
  getRequiredElement<HTMLInputElement>("#carro-id").value = String(id);
  getRequiredElement<HTMLInputElement>("#carro-modelo").value = modelo;
  getRequiredElement<HTMLInputElement>("#carro-marca").value = marca;
  getRequiredElement<HTMLInputElement>("#carro-ano").value = String(ano);
  setCarroFormMode("edit");
  showSection("carros");
}

async function salvarPessoa(event: SubmitEvent) {
  event.preventDefault();

  const id = getRequiredElement<HTMLInputElement>("#pessoa-id").value;
  const nome = getRequiredElement<HTMLInputElement>("#pessoa-nome").value.trim();
  const email = getRequiredElement<HTMLInputElement>("#pessoa-email").value.trim();

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/pessoas/${id}` : `${API_BASE}/pessoas`;

  await fetchJson(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email }),
  });

  resetPessoaForm();
  await carregarPessoas();
  await carregarAssociacoes();
  showMessage(id ? "Pessoa atualizada com sucesso." : "Pessoa cadastrada com sucesso.");
}

async function salvarCarro(event: SubmitEvent) {
  event.preventDefault();

  const id = getRequiredElement<HTMLInputElement>("#carro-id").value;
  const modelo = getRequiredElement<HTMLInputElement>("#carro-modelo").value.trim();
  const marca = getRequiredElement<HTMLInputElement>("#carro-marca").value.trim();
  const ano = Number(getRequiredElement<HTMLInputElement>("#carro-ano").value);

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/carros/${id}` : `${API_BASE}/carros`;

  await fetchJson(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelo, marca, ano }),
  });

  resetCarroForm();
  await carregarCarros();
  await carregarAssociacoes();
  showMessage(id ? "Carro atualizado com sucesso." : "Carro cadastrado com sucesso.");
}

async function salvarAssociacao(event: SubmitEvent) {
  event.preventDefault();

  const pessoaId = Number(pessoaSelect.value);
  const carroId = Number(carroSelect.value);

  if (!pessoaId || !carroId) {
    showMessage("Selecione uma pessoa e um carro para criar a associação.", "error");
    return;
  }

  await fetchJson(`${API_BASE}/associacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pessoaId, carroId }),
  });

  associacaoForm.reset();
  await carregarAssociacoes();
  showMessage("Associação criada com sucesso.");
}

async function excluirPessoa(id: number) {
  if (!window.confirm("Tem certeza de que deseja excluir esta pessoa?")) {
    return;
  }

  await fetchJson(`${API_BASE}/pessoas/${id}`, { method: "DELETE" });
  await carregarPessoas();
  await carregarAssociacoes();
  showMessage("Pessoa excluída com sucesso.");
}

async function excluirCarro(id: number) {
  if (!window.confirm("Tem certeza de que deseja excluir este carro?")) {
    return;
  }

  await fetchJson(`${API_BASE}/carros/${id}`, { method: "DELETE" });
  await carregarCarros();
  await carregarAssociacoes();
  showMessage("Carro excluído com sucesso.");
}

async function excluirAssociacao(pessoaId: number, carroId: number) {
  if (!window.confirm("Tem certeza de que deseja excluir esta associação?")) {
    return;
  }

  await fetchJson(`${API_BASE}/associacoes/${pessoaId}/${carroId}`, {
    method: "DELETE",
  });

  await carregarAssociacoes();
  showMessage("Associação excluída com sucesso.");
}

function handlePessoaTableClick(event: Event) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (!id) return;

  if (button.dataset.action === "edit-pessoa") {
    preencherFormularioPessoa(id, button.dataset.nome || "", button.dataset.email || "");
    return;
  }

  if (button.dataset.action === "delete-pessoa") {
    excluirPessoa(id).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Erro ao excluir a pessoa.";
      showMessage(message, "error");
    });
  }
}

function handleCarroTableClick(event: Event) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (!id) return;

  if (button.dataset.action === "edit-carro") {
    preencherFormularioCarro(
      id,
      button.dataset.modelo || "",
      button.dataset.marca || "",
      Number(button.dataset.ano || 0),
    );
    return;
  }

  if (button.dataset.action === "delete-carro") {
    excluirCarro(id).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Erro ao excluir o carro.";
      showMessage(message, "error");
    });
  }
}

function handleAssociacaoTableClick(event: Event) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  if (!button || button.dataset.action !== "delete-associacao") return;

  const pessoaId = Number(button.dataset.pessoaId);
  const carroId = Number(button.dataset.carroId);

  if (!pessoaId || !carroId) return;

  excluirAssociacao(pessoaId, carroId).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir a associação.";
    showMessage(message, "error");
  });
}

async function bootstrap() {
  try {
    await Promise.all([carregarPessoas(), carregarCarros(), carregarAssociacoes()]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar os dados iniciais.";
    showMessage(message, "error");
  }
}

tabs.forEach((button) => {
  button.addEventListener("click", () => {
    const section = button.dataset.section as SectionName | undefined;
    if (section) {
      showSection(section);
    }
  });
});

pessoaForm.addEventListener("submit", (event) => {
  salvarPessoa(event as SubmitEvent).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Erro ao salvar a pessoa.";
    showMessage(message, "error");
  });
});

carroForm.addEventListener("submit", (event) => {
  salvarCarro(event as SubmitEvent).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Erro ao salvar o carro.";
    showMessage(message, "error");
  });
});

associacaoForm.addEventListener("submit", (event) => {
  salvarAssociacao(event as SubmitEvent).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar a associação.";
    showMessage(message, "error");
  });
});

pessoaCancelButton.addEventListener("click", () => {
  resetPessoaForm();
});

carroCancelButton.addEventListener("click", () => {
  resetCarroForm();
});

pessoaTableBody.addEventListener("click", handlePessoaTableClick);
carroTableBody.addEventListener("click", handleCarroTableClick);
associacaoTableBody.addEventListener("click", handleAssociacaoTableClick);

window.addEventListener("DOMContentLoaded", () => {
  showSection("pessoas");
  setPessoaFormMode("create");
  setCarroFormMode("create");

  bootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Erro ao iniciar a página.";
    showMessage(message, "error");
  });
});
