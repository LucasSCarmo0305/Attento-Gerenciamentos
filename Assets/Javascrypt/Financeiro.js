const CORES = ['#7c8ff0', '#f2a65a', '#3fbf8f', '#e8707d', '#a68cf0', '#f06d9a', '#4fc3d9', '#f0a94f'];

let contas = JSON.parse(localStorage.getItem('financeiro_data')) || [];

const formatarMoeda = (valor) => 
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function obterIniciais(nome) {
  if (!nome) return '';
  const partes = nome.trim().split(' ');
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return (partes[0][0] + (partes[0][1] || '')).toUpperCase();
}

function obterCorPorIniciais(iniciais) {
  if (!iniciais) return CORES[0];
  let codigo = 0;
  for (const caractere of iniciais) {
    codigo += caractere.charCodeAt(0);
  }
  return CORES[codigo % CORES.length];
}

function atualizarSumario() {
  const total = contas.reduce((acc, c) => acc + Number(c.valor || 0), 0);
  const recebido = contas
    .filter((c) => c.status === 'pago')
    .reduce((acc, c) => acc + Number(c.valor || 0), 0);

  const elTotal = document.getElementById('totalFaturado');
  const elRecebido = document.getElementById('totalRecebido');

  if (elTotal) elTotal.innerText = formatarMoeda(total);
  if (elRecebido) elRecebido.innerText = formatarMoeda(recebido);
}

function carregarTabela(filtro = 'todos') {
  const corpoTabela = document.getElementById('corpoTabela');
  if (!corpoTabela) return;

  const contasFiltradas = contas.filter((c) => filtro === 'todos' || c.status === filtro);

  if (!contasFiltradas.length) {
    corpoTabela.innerHTML = `<tr class="empty-row"><td colspan="6">Nenhuma conta encontrada.</td></tr>`;
    return;
  }

  // Filtras as contas (Parte feito por IA) e mapeia para o HTML da tabela
  corpoTabela.innerHTML = contasFiltradas.map((c) => {
    const indiceReal = contas.indexOf(c);
    const nome = c.nome || c.name || '';
    const iniciais = c.iniciais || c.initials || obterIniciais(nome);
    const especialidade = c.especialidade || c.spec || '';
    const descricao = c.descricao || c.desc || '';
    const categoria = c.categoria || c.cat || '';
    const status = c.status || 'pendente';
    const valor = c.valor || 0;

    return `
      <tr>
        <td>
          <div class="prof-cell">
            <div class="prof-avatar" style="background:${obterCorPorIniciais(iniciais)};">${iniciais}</div>
            <div>
              <div class="prof-name">${nome}</div>
              <div class="prof-spec">${especialidade}</div>
            </div>
          </div>
        </td>
        <td class="desc">${descricao}</td>
        <td>
          <span class="badge ${categoria}">
            ${categoria === 'locacao' ? 'Locação' : 'Convênio'}
          </span>
        </td>
        <td class="valor">${formatarMoeda(valor)}</td>
        <td>
          <span class="status ${status}">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>
        <td>
          <button onclick="excluirConta(${indiceReal})" style="background:transparent; border:none; cursor:pointer;" title="Excluir">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.excluirConta = function (indice) {
  if (confirm('Tem certeza que deseja excluir este registro?')) {
    contas.splice(indice, 1);
    salvarEAtualizarVisual();
  }
};

function salvarEAtualizarVisual() {
  localStorage.setItem('financeiro_data', JSON.stringify(contas));
  atualizarSumario();
  const abaAtiva = document.querySelector('.tab.active');
  const filtroAtivo = abaAtiva ? abaAtiva.dataset.filter : 'todos';
  carregarTabela(filtroAtivo);
}

document.addEventListener('DOMContentLoaded', () => {
  const abasFiltro = document.getElementById('abasFiltro');
  if (abasFiltro) {
    abasFiltro.addEventListener('click', (evento) => {
      const botaoAba = evento.target.closest('.tab');
      if (!botaoAba) return;
      document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
      botaoAba.classList.add('active');
      carregarTabela(botaoAba.dataset.filter);
    });
  }

  const botaoExportar = document.getElementById('botaoExportar');
  if (botaoExportar) {
    botaoExportar.addEventListener('click', () => {
      if (!contas.length) return alert('Nenhum dado para exportar.');
      const cabecalho = 'Profissional,Especialidade,Descrição,Categoria,Valor,Status\n';
      const linhas = contas.map((c) => {
        const nome = c.nome || c.name || '';
        const especialidade = c.especialidade || c.spec || '';
        const descricao = c.descricao || c.desc || '';
        const categoria = c.categoria || c.cat || '';
        return `"${nome}","${especialidade}","${descricao}","${categoria === 'locacao' ? 'Locação' : 'Convênio'}",${c.valor},"${c.status}"`;
      }).join('\n');

      const arquivoBlob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
      const urlLink = URL.createObjectURL(arquivoBlob);
      const elementoLink = document.createElement('a');
      elementoLink.href = urlLink;
      elementoLink.download = 'financeiro.csv';
      elementoLink.click();
      URL.revokeObjectURL(urlLink);
    });
  }

  const modalAdicionar = document.getElementById('modalAdicionar');
  const formularioAdicionar = document.getElementById('formularioAdicionar');
  const botaoAdicionar = document.getElementById('botaoAdicionar');
  const botaoFecharModal = document.getElementById('botaoFecharModal');

  if (botaoAdicionar && modalAdicionar) {
    botaoAdicionar.addEventListener('click', () => {
      modalAdicionar.style.display = 'flex';
    });
  }

  if (botaoFecharModal && modalAdicionar && formularioAdicionar) {
    botaoFecharModal.addEventListener('click', () => {
      modalAdicionar.style.display = 'none';
      formularioAdicionar.reset();
    });
  }

  if (formularioAdicionar) {
    formularioAdicionar.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const nomeProfissional = document.getElementById('nomeProfissional').value;

      const novaConta = {
        iniciais: obterIniciais(nomeProfissional),
        nome: nomeProfissional,
        especialidade: document.getElementById('especialidade').value,
        descricao: document.getElementById('descricao').value,
        categoria: document.getElementById('categoria').value,
        valor: parseFloat(document.getElementById('valor').value),
        status: document.getElementById('status').value
      };

      contas.push(novaConta);
      salvarEAtualizarVisual();

      modalAdicionar.style.display = 'none';
      formularioAdicionar.reset();
    });
  }

  const alternarModoEscuro = document.getElementById('alternarModoEscuro');
  if (alternarModoEscuro) {
    alternarModoEscuro.addEventListener('click', () => {
      document.body.classList.toggle('dark-preview');
      alternarModoEscuro.textContent = document.body.classList.contains('dark-preview') ? '☀️' : '🌙';
    });
  }

  atualizarSumario();
  carregarTabela('todos');
});