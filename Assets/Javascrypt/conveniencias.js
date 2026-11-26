const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const emojisSugeridos = [
  '☕', '🧃', '🥤', '🧋', '🥛', '💧', '🍺', '🍔', '🍕', '🌭',
  '🍟', '🥪', '🌮', '🍿', '🍪', '🍩', '🍰', '🍫', '🍦', '🧁',
  '🥐', '🍱', '🥗', '🍲', '🍣', '🍎', '🍌', '🍓', '🖨️', '🛒'
];

const produtosIniciais = [
  { id: 'cafe', nome: 'Café', preco: 3, emoji: '☕', cor: '#0f9aad', recolhido: false },
  { id: 'cappuccino', nome: 'Cappuccino', preco: 6, emoji: '🥛', cor: '#e8912f', recolhido: false },
  { id: 'agua', nome: 'Água', preco: 3, emoji: '💧', cor: '#3f8fe0', recolhido: false },
  { id: 'biscoito', nome: 'Biscoito', preco: 2, emoji: '🍪', cor: '#e0596b', recolhido: false },
  { id: 'impressao', nome: 'Impressão', preco: 0.5, emoji: '🖨️', cor: '#9955d6', recolhido: false }
];

function carregarLista(chave, padrao) {
  const salvo = localStorage.getItem(chave);
  if (!salvo) return padrao;

  try {
    return JSON.parse(salvo);
  } catch (erro) {
    return padrao;
  }
}

function salvarDados() {
  localStorage.setItem('attento_produtos', JSON.stringify(produtos));
  localStorage.setItem('attento_consumos', JSON.stringify(consumos));
}

// ===== Integração com Salas =====
function obterProfissionaisSalas() {
  const dadosSalas = carregarLista('attento_dados_unidades', null);
  if (!dadosSalas || typeof dadosSalas !== 'object') return [];

  const mapa = {};

  function registrarSlot(slot, nomeSala) {
    if (!slot || slot.status === 'livre' || !slot.profissional) return;

    const nomeBruto = typeof slot.profissional === 'object'
      ? slot.profissional.nome
      : slot.profissional;

    if (!nomeBruto || typeof nomeBruto !== 'string') return;

    const nome = nomeBruto.trim();
    if (!nome) return;

    const chave = nome.toLowerCase();
    if (!mapa[chave]) {
      mapa[chave] = { nome: nome, salas: [] };
    }

    if (nomeSala && mapa[chave].salas.indexOf(nomeSala) === -1) {
      mapa[chave].salas.push(nomeSala);
    }
  }

  Object.keys(dadosSalas).forEach(function (chaveUnidade) {
    const unidade = dadosSalas[chaveUnidade];
    if (!unidade || !Array.isArray(unidade.salas)) return;

    unidade.salas.forEach(function (sala) {
      if (sala.slots) {
        Object.keys(sala.slots).forEach(function (dia) {
          const turnosDia = sala.slots[dia];
          if (!turnosDia) return;
          Object.keys(turnosDia).forEach(function (turno) {
            registrarSlot(turnosDia[turno], sala.nome);
          });
        });
      }

      if (sala.slotsPorHora) {
        Object.keys(sala.slotsPorHora).forEach(function (dia) {
          const horasDia = sala.slotsPorHora[dia];
          if (!horasDia) return;
          Object.keys(horasDia).forEach(function (hora) {
            registrarSlot(horasDia[hora], sala.nome);
          });
        });
      }
    });
  });

  return Object.keys(mapa)
    .map(function (chave) { return mapa[chave]; })
    .sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
}

function preencherSelectProfissionais() {
  const select = document.getElementById('f-prof');
  const hint = document.getElementById('f-prof-hint');
  const btnSalvar = document.querySelector('#addForm button[type="submit"]');
  if (!select) return;

  const profissionais = obterProfissionaisSalas();

  if (profissionais.length === 0) {
    select.innerHTML = '<option value="">Nenhum profissional cadastrado em Salas</option>';
    select.disabled = true;
    if (btnSalvar) btnSalvar.disabled = true;
    if (hint) {
      hint.innerHTML = 'Nenhum profissional com sala locada. <a href="salas.html">Cadastre em Salas</a> primeiro.';
    }
    return;
  }

  let html = '<option value="" disabled selected>Selecione o profissional...</option>';
  for (let i = 0; i < profissionais.length; i++) {
    const p = profissionais[i];
    const rotuloSalas = p.salas.length > 0 ? ' · ' + p.salas.join(', ') : '';
    html += '<option value="' + escapar(p.nome) + '">' + escapar(p.nome + rotuloSalas) + '</option>';
  }

  select.innerHTML = html;
  select.disabled = false;
  if (btnSalvar) btnSalvar.disabled = false;
  if (hint) {
    hint.textContent = profissionais.length === 1
      ? '1 profissional ativo vinculado em Salas.'
      : profissionais.length + ' profissionais ativos vinculados em Salas.';
  }
}

let produtos = carregarLista('attento_produtos', produtosIniciais);
let consumos = carregarLista('attento_consumos', []);

let filtroMes = hojeISO().slice(0, 7);
let filtroCategoria = 'todas';
let filtroComprador = 'todos';

let produtoDoConsumoId = null;
let editandoProdutoId = null;
let acaoConfirmada = null;

// ===== Funções utilitárias =====
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function hojeISO() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return hoje.getFullYear() + '-' + mes + '-' + dia;
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataISO) {
  const partes = dataISO.split('-');
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function rotuloMes(chave) {
  const partes = chave.split('-');
  return nomesMeses[parseInt(partes[1], 10) - 1] + ' ' + partes[0];
}

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function gerarTint(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  function clarear(canal) {
    return Math.round(canal + (255 - canal) * 0.88);
  }

  return 'rgb(' + clarear(r) + ',' + clarear(g) + ',' + clarear(b) + ')';
}

function acharProduto(id) {
  for (let i = 0; i < produtos.length; i++) {
    if (produtos[i].id === id) return produtos[i];
  }
  return null;
}

function acharConsumo(id) {
  for (let i = 0; i < consumos.length; i++) {
    if (consumos[i].id === id) return consumos[i];
  }
  return null;
}

function consumosVisiveis() {
  const lista = [];

  for (let i = 0; i < consumos.length; i++) {
    const c = consumos[i];

    if (c.data.slice(0, 7) !== filtroMes) continue;
    if (filtroCategoria !== 'todas' && c.produtoId !== filtroCategoria) continue;
    if (filtroComprador !== 'todos' && c.comprador !== filtroComprador) continue;

    lista.push(c);
  }

  return lista;
}

function preencherFiltros() {
  const meses = [hojeISO().slice(0, 7)];
  for (let i = 0; i < consumos.length; i++) {
    const mes = consumos[i].data.slice(0, 7);
    if (meses.indexOf(mes) === -1) meses.push(mes);
  }
  if (meses.indexOf(filtroMes) === -1) meses.push(filtroMes);
  meses.sort().reverse();

  let htmlMeses = '';
  for (let i = 0; i < meses.length; i++) {
    const selecionado = meses[i] === filtroMes ? ' selected' : '';
    htmlMeses += '<option value="' + meses[i] + '"' + selecionado + '>' + rotuloMes(meses[i]) + '</option>';
  }
  document.getElementById('fMonth').innerHTML = htmlMeses;

  if (filtroCategoria !== 'todas' && !acharProduto(filtroCategoria)) {
    filtroCategoria = 'todas';
  }

  let htmlCategorias = '<option value="todas">Todas categorias</option>';
  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    const selecionado = p.id === filtroCategoria ? ' selected' : '';
    htmlCategorias += '<option value="' + p.id + '"' + selecionado + '>' + p.emoji + ' ' + escapar(p.nome) + '</option>';
  }
  document.getElementById('fCategoria').innerHTML = htmlCategorias;

  // Combina profissionais cadastrados em Salas + compradores com histórico de consumo
  const mapaCompradores = {};
  const profissionaisSalas = obterProfissionaisSalas();

  for (let i = 0; i < profissionaisSalas.length; i++) {
    const nome = profissionaisSalas[i].nome;
    mapaCompradores[nome.toLowerCase()] = nome;
  }

  for (let i = 0; i < consumos.length; i++) {
    const nome = consumos[i].comprador;
    if (nome && !mapaCompradores[nome.toLowerCase()]) {
      mapaCompradores[nome.toLowerCase()] = nome;
    }
  }

  const compradores = Object.keys(mapaCompradores)
    .map(function (chave) { return mapaCompradores[chave]; })
    .sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });

  if (filtroComprador !== 'todos' && compradores.indexOf(filtroComprador) === -1) {
    filtroComprador = 'todos';
  }

  let htmlCompradores = '<option value="todos">Todos profissionais</option>';
  for (let i = 0; i < compradores.length; i++) {
    const selecionado = compradores[i] === filtroComprador ? ' selected' : '';
    htmlCompradores += '<option value="' + escapar(compradores[i]) + '"' + selecionado + '>' + escapar(compradores[i]) + '</option>';
  }
  document.getElementById('fProfissional').innerHTML = htmlCompradores;
}

// ===== Desenho da tela =====
function atualizarResumo() {
  const lista = consumosVisiveis();
  let total = 0;
  let quitado = 0;
  let aQuitar = 0;

  for (let i = 0; i < lista.length; i++) {
    total += lista[i].valor;
    if (lista[i].status === 'pago') quitado += lista[i].valor;
    else aQuitar += lista[i].valor;
  }

  document.getElementById('sumTotal').textContent = formatarMoeda(total);
  document.getElementById('sumQuitado').textContent = formatarMoeda(quitado);
  document.getElementById('sumAquitar').textContent = formatarMoeda(aQuitar);
  document.getElementById('subMes').textContent = rotuloMes(filtroMes);
}

function criarCardProduto(produto, visiveis) {
  const lista = [];
  for (let i = 0; i < visiveis.length; i++) {
    if (visiveis[i].produtoId === produto.id) lista.push(visiveis[i]);
  }
  lista.sort(function (a, b) { return b.data.localeCompare(a.data); });

  let totalQtd = 0;
  let totalValor = 0;
  let totalPendente = 0;
  for (let i = 0; i < lista.length; i++) {
    totalQtd += lista[i].qtd;
    totalValor += lista[i].valor;
    if (lista[i].status !== 'pago') totalPendente += lista[i].valor;
  }

  const pilulaPendente = totalPendente > 0
    ? '<span class="pending-pill">' + formatarMoeda(totalPendente) + '</span>'
    : '';

  let corpo = '';
  if (!produto.recolhido) {
    if (lista.length === 0) {
      corpo = '<div class="empty-msg">Nenhum consumo neste filtro.</div>';
    } else {
      let linhas = '';
      for (let i = 0; i < lista.length; i++) {
        const c = lista[i];
        const textoStatus = c.status === 'pago' ? 'Pago' : 'Pendente';

        linhas += `
          <tr>
            <td class="prof">${escapar(c.comprador)}</td>
            <td class="qtd">${c.qtd}</td>
            <td class="data">${formatarData(c.data)}</td>
            <td class="valor">${formatarMoeda(c.valor)}</td>
            <td><button type="button" class="status-badge ${c.status}" data-acao="alternar-status" data-id="${c.id}">${textoStatus}</button></td>
            <td><button type="button" class="remove-btn" data-acao="remover-consumo" data-id="${c.id}">Remover</button></td>
          </tr>
        `;
      }

      corpo = `
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PROFISSIONAL</th><th>QTD</th><th>DATA</th><th>VALOR</th><th>STATUS</th><th></th>
              </tr>
            </thead>
            <tbody>
              ${linhas}
              <tr class="total-row">
                <td>Total</td>
                <td>${totalQtd}</td>
                <td></td>
                <td>${formatarMoeda(totalValor)}</td>
                <td colspan="2"><span class="pend-label">Pendente: ${formatarMoeda(totalPendente)}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }
  }

  return `
    <div class="item-card custom ${produto.recolhido ? 'collapsed' : ''}" style="--strong:${produto.cor}; --tint:${gerarTint(produto.cor)};">
      <div class="item-header">
        <div class="header-left">
          <div class="title"><span>${produto.emoji}</span><span>${escapar(produto.nome)}</span></div>
          <div class="cat-actions">
            <button type="button" class="mini-act" data-acao="editar-produto" data-id="${produto.id}">Editar</button>
            <button type="button" class="mini-act" data-acao="excluir-produto" data-id="${produto.id}">Excluir</button>
          </div>
        </div>
        <div class="right">
          ${pilulaPendente}
          <button type="button" class="add-btn" data-acao="novo-consumo" data-id="${produto.id}">+ Consumo</button>
          <button type="button" class="icon-act" data-acao="recolher" data-id="${produto.id}" title="Recolher / expandir"><span class="chev">▾</span></button>
        </div>
      </div>
      ${corpo}
    </div>
  `;
}

function desenharBoard() {
  const visiveis = consumosVisiveis();
  let html = '';
  let quantidade = 0;

  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i];
    if (filtroCategoria !== 'todas' && produto.id !== filtroCategoria) continue;

    html += criarCardProduto(produto, visiveis);
    quantidade++;
  }

  if (quantidade === 0) {
    html = '<div class="empty-msg">Nenhum produto cadastrado. Clique em "Adicionar Produto".</div>';
  }

  document.getElementById('board').innerHTML = html;
}

function renderizar() {
  preencherFiltros();
  desenharBoard();
  atualizarResumo();
}

// ===== Abrir / fechar modais =====
function abrirModal(idOverlay) {
  document.getElementById(idOverlay).classList.add('open');
}

function fecharModal(idOverlay) {
  document.getElementById(idOverlay).classList.remove('open');
}

function fecharTodosModais() {
  fecharModal('modalOverlay');
  fecharModal('productModal');
  fecharModal('confirmModal');
  acaoConfirmada = null;
}

['modalOverlay', 'productModal', 'confirmModal'].forEach(function (id) {
  const overlay = document.getElementById(id);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) fecharTodosModais();
  });
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') fecharTodosModais();
});

// ===== Confirmação =====
function pedirConfirmacao(titulo, mensagem, textoBotao, acao) {
  document.getElementById('confirmTitle').textContent = titulo;
  document.getElementById('confirmMessage').textContent = mensagem;
  document.getElementById('confirmOk').textContent = textoBotao;
  acaoConfirmada = acao;
  abrirModal('confirmModal');
}

document.getElementById('confirmOk').addEventListener('click', function () {
  const acao = acaoConfirmada;
  fecharTodosModais();
  if (acao) acao();
});
document.getElementById('confirmCancel').addEventListener('click', fecharTodosModais);
document.getElementById('confirmClose').addEventListener('click', fecharTodosModais);

// ===== Modal de PRODUTO =====
function criarBotoesEmoji() {
  const area = document.getElementById('emojiPresets');
  let html = '';

  for (let i = 0; i < emojisSugeridos.length; i++) {
    html += '<button type="button" class="emoji-chip" data-emoji="' + emojisSugeridos[i] + '">' + emojisSugeridos[i] + '</button>';
  }

  area.innerHTML = html;

  area.addEventListener('click', function (e) {
    const botao = e.target.closest('.emoji-chip');
    if (!botao) return;
    document.getElementById('productEmoji').value = botao.dataset.emoji;
  });
}

function abrirModalProduto(idProduto) {
  editandoProdutoId = idProduto;
  document.getElementById('productForm').reset();

  if (idProduto) {
    const p = acharProduto(idProduto);
    document.getElementById('productModalTitle').textContent = 'Editar Produto';
    document.getElementById('productSubmit').textContent = 'Salvar';
    document.getElementById('productName').value = p.nome;
    document.getElementById('productPrice').value = p.preco;
    document.getElementById('productEmoji').value = p.emoji;
    document.getElementById('productColor').value = p.cor;
  } else {
    document.getElementById('productModalTitle').textContent = 'Adicionar Produto';
    document.getElementById('productSubmit').textContent = 'Confirmar';
  }

  abrirModal('productModal');
  document.getElementById('productName').focus();
}

document.getElementById('addProduct').addEventListener('click', function () {
  abrirModalProduto(null);
});
document.getElementById('closePopup').addEventListener('click', fecharTodosModais);
document.getElementById('cancelPopup').addEventListener('click', fecharTodosModais);

document.getElementById('productForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('productName').value.trim();
  const preco = parseFloat(document.getElementById('productPrice').value);
  const emoji = document.getElementById('productEmoji').value.trim() || '🛒';
  const cor = document.getElementById('productColor').value;

  if (!nome || isNaN(preco) || preco <= 0) return;

  for (let i = 0; i < produtos.length; i++) {
    const mesmoNome = produtos[i].nome.toLowerCase() === nome.toLowerCase();
    const outroProduto = produtos[i].id !== editandoProdutoId;
    if (mesmoNome && outroProduto) {
      alert('Já existe um produto com esse nome.');
      return;
    }
  }

  if (editandoProdutoId) {
    const p = acharProduto(editandoProdutoId);
    p.nome = nome;
    p.preco = preco;
    p.emoji = emoji;
    p.cor = cor;
  } else {
    produtos.push({ id: gerarId(), nome: nome, preco: preco, emoji: emoji, cor: cor, recolhido: false });
  }

  salvarDados();
  fecharTodosModais();
  renderizar();
});

// ===== Modal de CONSUMO =====
function abrirModalConsumo(idProduto) {
  const produto = acharProduto(idProduto);
  produtoDoConsumoId = idProduto;

  document.getElementById('addForm').reset();
  preencherSelectProfissionais();

  document.getElementById('modalTitle').textContent = 'Adicionar consumo · ' + produto.emoji + ' ' + produto.nome;
  document.getElementById('f-data').value = hojeISO();
  document.getElementById('f-qtd').value = 1;
  document.getElementById('f-valor').value = produto.preco.toFixed(2);
  document.getElementById('f-valor-hint').textContent = 'Preço unitário: ' + formatarMoeda(produto.preco);

  abrirModal('modalOverlay');

  const selectProf = document.getElementById('f-prof');
  if (selectProf && !selectProf.disabled) {
    selectProf.focus();
  }
}

document.getElementById('f-qtd').addEventListener('input', function () {
  const produto = acharProduto(produtoDoConsumoId);
  const qtd = parseInt(this.value, 10);
  if (!produto || isNaN(qtd) || qtd < 1) return;

  document.getElementById('f-valor').value = (produto.preco * qtd).toFixed(2);
});

document.getElementById('modalClose').addEventListener('click', fecharTodosModais);
document.getElementById('cancelAdd').addEventListener('click', fecharTodosModais);

document.getElementById('addForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const comprador = document.getElementById('f-prof').value.trim();
  const qtd = parseInt(document.getElementById('f-qtd').value, 10);
  const data = document.getElementById('f-data').value;
  const valor = parseFloat(document.getElementById('f-valor').value);

  if (!comprador || isNaN(qtd) || qtd < 1 || !data || isNaN(valor) || valor < 0) return;

  consumos.push({
    id: gerarId(),
    produtoId: produtoDoConsumoId,
    comprador: comprador,
    qtd: qtd,
    data: data,
    valor: valor,
    status: 'pendente'
  });

  filtroMes = data.slice(0, 7);

  salvarDados();
  fecharTodosModais();
  renderizar();
});

// ===== Cliques dentro dos cards =====
document.getElementById('board').addEventListener('click', function (e) {
  const botao = e.target.closest('[data-acao]');
  if (!botao) return;

  const acao = botao.dataset.acao;
  const id = botao.dataset.id;

  if (acao === 'novo-consumo') {
    abrirModalConsumo(id);
  }

  if (acao === 'editar-produto') {
    abrirModalProduto(id);
  }

  if (acao === 'recolher') {
    const p = acharProduto(id);
    p.recolhido = !p.recolhido;
    salvarDados();
    renderizar();
  }

  if (acao === 'alternar-status') {
    const c = acharConsumo(id);
    c.status = c.status === 'pago' ? 'pendente' : 'pago';
    salvarDados();
    renderizar();
  }

  if (acao === 'remover-consumo') {
    pedirConfirmacao('Remover consumo', 'Deseja remover este consumo?', 'Remover', function () {
      consumos = consumos.filter(function (c) { return c.id !== id; });
      salvarDados();
      renderizar();
    });
  }

  if (acao === 'excluir-produto') {
    const p = acharProduto(id);
    pedirConfirmacao(
      'Excluir produto',
      'Excluir "' + p.nome + '" e todos os consumos registrados nele?',
      'Excluir',
      function () {
        produtos = produtos.filter(function (item) { return item.id !== id; });
        consumos = consumos.filter(function (c) { return c.produtoId !== id; });
        salvarDados();
        renderizar();
      }
    );
  }
});

// ===== Filtros e botão "Limpar pagos" =====
document.getElementById('fMonth').addEventListener('change', function () {
  filtroMes = this.value;
  renderizar();
});

document.getElementById('fCategoria').addEventListener('change', function () {
  filtroCategoria = this.value;
  renderizar();
});

document.getElementById('fProfissional').addEventListener('change', function () {
  filtroComprador = this.value;
  renderizar();
});

document.getElementById('clearPaid').addEventListener('click', function () {
  const idsPagos = [];
  const visiveis = consumosVisiveis();
  for (let i = 0; i < visiveis.length; i++) {
    if (visiveis[i].status === 'pago') idsPagos.push(visiveis[i].id);
  }

  if (idsPagos.length === 0) {
    alert('Não há consumos pagos para limpar neste filtro.');
    return;
  }

  pedirConfirmacao(
    'Limpar pagos',
    'Remover ' + idsPagos.length + ' consumo(s) pago(s) de ' + rotuloMes(filtroMes) + '?',
    'Limpar',
    function () {
      consumos = consumos.filter(function (c) { return idsPagos.indexOf(c.id) === -1; });
      salvarDados();
      renderizar();
    }
  );
});

// Atualiza se Salas for alterado em outra aba
window.addEventListener('storage', function (e) {
  if (e.key === 'attento_dados_unidades') {
    preencherFiltros();
    if (document.getElementById('modalOverlay').classList.contains('open')) {
      preencherSelectProfissionais();
    }
  }
});

criarBotoesEmoji();
renderizar();

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector('script[src*="phosphor-icons"]')) {
    const phScript = document.createElement("script");
    phScript.src = "https://unpkg.com/@phosphor-icons/web";
    document.head.appendChild(phScript);
  }

  const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".sidebar-nav .nav-item").forEach((link) => {
    const destino = link.getAttribute("href").split("/").pop();
    link.classList.toggle("active", destino === paginaAtual);
  });
});