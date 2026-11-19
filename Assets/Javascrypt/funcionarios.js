(function () {
  const corpo = document.getElementById('corpoTabela');
  const aviso = document.getElementById('avisoAcao');

  let filtroAtual = 'todos';
  let usuarios = [];
  let avisoTimer = null;

  // ---------- utilitários de interface ----------
  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto; // textContent: nome/e-mail nunca viram HTML
    return el;
  }

  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
    clearTimeout(avisoTimer);
    if (texto) avisoTimer = setTimeout(function () { aviso.hidden = true; }, 6000);
  }

  function infoStatus(u) {
    if (u.status === 'ativo') return { classe: 'pago', texto: 'Ativo' };
    if (u.status === 'aguardando') return { classe: 'aguardando', texto: 'Aguardando aprovação' };
    if (u.status === 'recusado') return { classe: 'inativo', texto: 'Recusado' };
    return { classe: 'inativo', texto: 'Inativo' };
  }

  function passaNoFiltro(u) {
    if (filtroAtual === 'todos') return true;
    if (filtroAtual === 'pedidos') return u.status === 'aguardando' || u.status === 'recusado';
    return u.status === filtroAtual;
  }

  // pedidos que esperam decisão aparecem primeiro na lista
  function ordem(a, b) {
    const pa = a.status === 'aguardando' ? 0 : 1;
    const pb = b.status === 'aguardando' ? 0 : 1;
    return pa - pb;
  }

  // ---------- tabela ----------
  function botaoAcao(texto, classe, aoClicar) {
    const b = criar('button', 'btn-acao ' + classe, texto);
    b.type = 'button';
    b.addEventListener('click', aoClicar);
    return b;
  }

  function celulaAcoes(u) {
    const td = criar('td');

    if (u.papel === 'admin') {
      td.appendChild(criar('span', 'sem-acao', '—'));
      return td;
    }

    const caixa = criar('div', 'acoes-cell');
    if (u.status === 'aguardando') {
      caixa.appendChild(botaoAcao('Aprovar', 'btn-pago', function () { aprovar(u); }));
      caixa.appendChild(botaoAcao('Recusar', 'btn-remover', function () { recusar(u); }));
    } else if (u.status === 'recusado') {
      caixa.appendChild(botaoAcao('Aprovar', 'btn-pago', function () { aprovar(u); }));
      caixa.appendChild(botaoAcao('Excluir', 'btn-neutro', function () { excluirPedido(u); }));
    } else if (u.status === 'ativo') {
      caixa.appendChild(botaoAcao('Desativar', 'btn-remover', function () { desativar(u); }));
    } else {
      caixa.appendChild(botaoAcao('Reativar', 'btn-pago', function () { reativar(u); }));
    }
    td.appendChild(caixa);
    return td;
  }

  function renderizar() {
    corpo.replaceChildren();
    const visiveis = usuarios.filter(passaNoFiltro).sort(ordem);

    if (!visiveis.length) {
      const tr = criar('tr', 'empty-row');
      const td = criar('td', '', 'Nenhum funcionário nesta lista.');
      td.colSpan = 5;
      tr.appendChild(td);
      corpo.appendChild(tr);
      return;
    }

    visiveis.forEach(function (u) {
      const tr = criar('tr');

      const tdNome = criar('td');
      const caixaNome = criar('div', 'celula-nome');
      caixaNome.appendChild(criar('span', 'prof-name', u.nome));
      if (u.papel === 'admin') caixaNome.appendChild(criar('span', 'badge locacao', 'Admin'));
      tdNome.appendChild(caixaNome);
      tr.appendChild(tdNome);

      tr.appendChild(criar('td', 'texto-secundario', u.email));
      tr.appendChild(criar('td', 'texto-secundario', u.cpfMascarado));

      const tdStatus = criar('td');
      const info = infoStatus(u);
      tdStatus.appendChild(criar('span', 'status ' + info.classe, info.texto));
      tr.appendChild(tdStatus);

      tr.appendChild(celulaAcoes(u));
      corpo.appendChild(tr);
    });
  }

  function atualizarResumo() {
    const equipe = usuarios.filter(function (u) { return u.papel === 'funcionario'; });
    const aguardando = equipe.filter(function (u) { return u.status === 'aguardando'; }).length;

    document.getElementById('totalFuncionarios').textContent = equipe.length;
    document.getElementById('totalAtivos').textContent =
      equipe.filter(function (u) { return u.status === 'ativo'; }).length;
    document.getElementById('totalPendentes').textContent = aguardando;

    document.getElementById('avisoPedidos').hidden = aguardando === 0;
    document.getElementById('textoPedidos').textContent = aguardando === 1
      ? '1 pedido de cadastro aguardando a sua decisão.'
      : aguardando + ' pedidos de cadastro aguardando a sua decisão.';

    const selo = document.getElementById('contagemPedidos');
    selo.hidden = aguardando === 0;
    selo.textContent = aguardando;
  }

  // mantém o selo do menu lateral igual ao número real de pedidos
  function atualizarSeloDoMenu() {
    const link = document.querySelector('.sidebar-nav [data-papel="admin"]');
    if (!link) return;
    const antigo = link.querySelector('.nav-badge');
    if (antigo) antigo.remove();
    const n = Auth.pedidosAguardando();
    if (n) link.appendChild(criar('span', 'nav-badge', String(n)));
  }

  function carregar() {
    usuarios = Auth.listarUsuarios();
    atualizarResumo();
    atualizarSeloDoMenu();
    renderizar();
  }

  // ---------- ações da tabela ----------
  async function aprovar(u) {
    const r = await Auth.aprovarCadastro(u.id);
    mostrarAviso(r.ok ? u.nome + ' foi aprovado e já pode entrar.' : r.erro);
    carregar();
  }

  async function recusar(u) {
    if (!confirm('Recusar o pedido de ' + u.nome + '? Ele não conseguirá entrar.')) return;
    const r = await Auth.recusarCadastro(u.id);
    mostrarAviso(r.ok ? 'Pedido de ' + u.nome + ' recusado.' : r.erro);
    carregar();
  }

  async function excluirPedido(u) {
    if (!confirm('Excluir o pedido de ' + u.nome + '? O e-mail e o CPF ficam livres para um novo pedido.')) return;
    const r = await Auth.excluirPedido(u.id);
    mostrarAviso(r.ok ? 'Pedido excluído.' : r.erro);
    carregar();
  }

  async function desativar(u) {
    if (!confirm('Desativar ' + u.nome + '? Ele não conseguirá mais entrar.')) return;
    const r = await Auth.alterarAtivo(u.id, false);
    mostrarAviso(r.ok ? u.nome + ' foi desativado.' : r.erro);
    carregar();
  }

  async function reativar(u) {
    const r = await Auth.alterarAtivo(u.id, true);
    mostrarAviso(r.ok ? u.nome + ' foi reativado.' : r.erro);
    carregar();
  }

  // ---------- filtros ----------
  function selecionarAba(filtro) {
    filtroAtual = filtro;
    document.querySelectorAll('#abasFiltro .tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.filter === filtro);
    });
    renderizar();
  }

  document.getElementById('verPedidos').addEventListener('click', function () { selecionarAba('pedidos'); });

  document.getElementById('abasFiltro').addEventListener('click', function (e) {
    const aba = e.target.closest('.tab');
    if (aba) selecionarAba(aba.dataset.filter);
  });

  Auth.pronto.then(carregar);
})();

document.addEventListener("DOMContentLoaded", () => {
  // 1. Carrega o Phosphor Icons automaticamente se ainda não estiver na página
  if (!document.querySelector('script[src*="phosphor-icons"]')) {
    const phScript = document.createElement("script");
    phScript.src = "https://unpkg.com/@phosphor-icons/web";
    document.head.appendChild(phScript);
  }

  // 2. Marca o item ativo da sidebar de acordo com a página atual
  const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".sidebar-nav .nav-item").forEach((link) => {
    const destino = link.getAttribute("href").split("/").pop();
    link.classList.toggle("active", destino === paginaAtual);
  });
});
