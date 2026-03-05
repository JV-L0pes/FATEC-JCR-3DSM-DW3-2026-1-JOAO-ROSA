const API_BASE = "/api";

function mostrarSecao(secao) {
  document
    .querySelectorAll(".secao")
    .forEach((s) => s.classList.remove("ativa"));
  document.getElementById(`secao-${secao}`).classList.add("ativa");
}

// ---------- Pessoas ----------

async function carregarPessoas() {
  const res = await fetch(`${API_BASE}/pessoas`);
  const pessoas = await res.json();

  const tbody = document.querySelector("#tabela-pessoas tbody");
  tbody.innerHTML = "";
  pessoas.forEach((pessoa) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${pessoa.id}</td>
      <td>${pessoa.nome}</td>
      <td>${pessoa.email}</td>
      <td>
        <button class="acao editar" onclick="editarPessoa(${pessoa.id}, '${pessoa.nome}', '${pessoa.email}')">Editar</button>
        <button class="acao excluir" onclick="excluirPessoa(${pessoa.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const selectPessoa = document.getElementById("select-pessoa");
  selectPessoa.innerHTML = `<option value="">Selecione</option>`;
  pessoas.forEach((pessoa) => {
    const opt = document.createElement("option");
    opt.value = pessoa.id;
    opt.textContent = `${pessoa.id} - ${pessoa.nome}`;
    selectPessoa.appendChild(opt);
  });
}

document.getElementById("form-pessoa").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("pessoa-id").value;
  const nome = document.getElementById("pessoa-nome").value;
  const email = document.getElementById("pessoa-email").value;

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/pessoas/${id}` : `${API_BASE}/pessoas`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email }),
  });

  e.target.reset();
  document.getElementById("pessoa-id").value = "";
  carregarPessoas();
});

function editarPessoa(id, nome, email) {
  document.getElementById("pessoa-id").value = id;
  document.getElementById("pessoa-nome").value = nome;
  document.getElementById("pessoa-email").value = email;
  mostrarSecao("pessoas");
}

async function excluirPessoa(id) {
  if (!confirm("Tem certeza que deseja excluir esta pessoa?")) return;
  await fetch(`${API_BASE}/pessoas/${id}`, { method: "DELETE" });
  carregarPessoas();
  carregarAssociacoes();
}

// ---------- Carros ----------

async function carregarCarros() {
  const res = await fetch(`${API_BASE}/carros`);
  const carros = await res.json();

  const tbody = document.querySelector("#tabela-carros tbody");
  tbody.innerHTML = "";
  carros.forEach((carro) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${carro.id}</td>
      <td>${carro.modelo}</td>
      <td>${carro.marca}</td>
      <td>${carro.ano}</td>
      <td>
        <button class="acao editar" onclick="editarCarro(${carro.id}, '${carro.modelo}', '${carro.marca}', ${carro.ano})">Editar</button>
        <button class="acao excluir" onclick="excluirCarro(${carro.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const selectCarro = document.getElementById("select-carro");
  selectCarro.innerHTML = `<option value="">Selecione</option>`;
  carros.forEach((carro) => {
    const opt = document.createElement("option");
    opt.value = carro.id;
    opt.textContent = `${carro.id} - ${carro.modelo}`;
    selectCarro.appendChild(opt);
  });
}

document.getElementById("form-carro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("carro-id").value;
  const modelo = document.getElementById("carro-modelo").value;
  const marca = document.getElementById("carro-marca").value;
  const ano = Number(document.getElementById("carro-ano").value);

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/carros/${id}` : `${API_BASE}/carros`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelo, marca, ano }),
  });

  e.target.reset();
  document.getElementById("carro-id").value = "";
  carregarCarros();
});

function editarCarro(id, modelo, marca, ano) {
  document.getElementById("carro-id").value = id;
  document.getElementById("carro-modelo").value = modelo;
  document.getElementById("carro-marca").value = marca;
  document.getElementById("carro-ano").value = ano;
  mostrarSecao("carros");
}

async function excluirCarro(id) {
  if (!confirm("Tem certeza que deseja excluir este carro?")) return;
  await fetch(`${API_BASE}/carros/${id}`, { method: "DELETE" });
  carregarCarros();
  carregarAssociacoes();
}

// ---------- Associações ----------

async function carregarAssociacoes() {
  const res = await fetch(`${API_BASE}/associacoes`);
  const associacoes = await res.json();

  const tbody = document.querySelector("#tabela-associacoes tbody");
  tbody.innerHTML = "";
  associacoes.forEach((assoc) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${assoc.id}</td>
      <td>${assoc.pessoa?.nome ?? ""}</td>
      <td>${assoc.pessoa?.email ?? ""}</td>
      <td>${assoc.carro?.modelo ?? ""}</td>
      <td>${assoc.carro?.marca ?? ""}</td>
      <td>${assoc.carro?.ano ?? ""}</td>
      <td>
        <button class="acao excluir" onclick="excluirAssociacao(${assoc.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document
  .getElementById("form-associacao")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const pessoaId = document.getElementById("select-pessoa").value;
    const carroId = document.getElementById("select-carro").value;
    if (!pessoaId || !carroId) return;

    await fetch(`${API_BASE}/associacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pessoaId: Number(pessoaId), carroId: Number(carroId) }),
    });

    carregarAssociacoes();
  });

async function excluirAssociacao(id) {
  if (!confirm("Tem certeza que deseja excluir esta associação?")) return;
  await fetch(`${API_BASE}/associacoes/${id}`, { method: "DELETE" });
  carregarAssociacoes();
}

// ---------- Inicialização ----------

window.addEventListener("DOMContentLoaded", () => {
  carregarPessoas();
  carregarCarros();
  carregarAssociacoes();
});

