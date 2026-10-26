const CORES = ['#7c8ff0', '#f2a65a', '#3fbf8f', '#e8707d', '#a68cf0', '#f06d9a', '#4fc3d9', '#f0a94f'];

let contas = JSON.parse(localStorage.getItem('financeiro_data')) || [];


let ordenacaoAtual = {
  coluna: 'vencimento', 
  direcao: 'asc'        
};

const formatarMoeda = (valor) => 
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function formatarData(data) {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

function atualizarSumario() {
  const total = contas.reduce((acc, c) => acc + Number(c.valor || 0), 0);
  const despesas = contas
    .filter((c) => (c.categoria || c.cat) === 'outros')
    .reduce((acc, c) => acc + Number(c.valor || 0), 0);
  const recebido = contas
    .filter((c) => c.status === 'pago' && (c.categoria || c.cat) !== 'outros')
    .reduce((acc, c) => acc + Number(c.valor || 0), 0) - contas
    .filter((c) => c.status === 'pago' && (c.categoria || c.cat) === 'outros')
    .reduce((acc, c) => acc + Number(c.valor || 0), 0);

  const elTotal = document.getElementById('totalFaturado');
  const elRecebido = document.getElementById('totalRecebido');
  const elDespesas = document.getElementById('totalDespesas');

  if (elTotal) elTotal.innerText = formatarMoeda(total);
  if (elRecebido) elRecebido.innerText = formatarMoeda(recebido);
  if (elDespesas) elDespesas.innerText = formatarMoeda(despesas);
}

function ordenarContas(lista) {
  return [...lista].sort((a, b) => {
    let valorA = a[ordenacaoAtual.coluna] || '';
    let valorB = b[ordenacaoAtual.coluna] || '';

    if (ordenacaoAtual.coluna === 'valor') {
      valorA = Number(valorA || 0);
      valorB = Number(valorB || 0);
    }

    if (valorA < valorB) return ordenacaoAtual.direcao === 'asc' ? -1 : 1;
    if (valorA > valorB) return ordenacaoAtual.direcao === 'asc' ? 1 : -1;
    return 0;
  });
}

function atualizarIconesOrdenacao() {
  const colunas = ['descricao', 'categoria', 'valor', 'vencimento', 'status'];
  colunas.forEach(col => {
    const elIcone = document.getElementById(`sort-${col}`);
    if (elIcone) {
      if (ordenacaoAtual.coluna === col) {
        elIcone.textContent = ordenacaoAtual.direcao === 'asc' ? ' ▲' : ' ▼';
        elIcone.style.opacity = '1';
      } else {
        elIcone.textContent = ' ⇅';
        elIcone.style.opacity = '0.3';
      }
    }
  });
}

function calcularIndicadorVencimento(vencimentoStr, status) {
  if (status === 'pago') {
    return { icone: '⬆', classe: 'venc-pago', texto: 'Pago' };
  }

  if (!vencimentoStr) return { icone: '•', classe: '', texto: '' };

  // Data atual x Data de vencimento
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [ano, mes, dia] = vencimentoStr.split('-').map(Number);
  const dataVenc = new Date(ano, mes - 1, dia);
  dataVenc.setHours(0, 0, 0, 0);

  const diffTempo = dataVenc - hoje;
  const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

  if (diffDias < 0 || status === 'vencido') {
    return { icone: '⬇', classe: 'venc-atrasado', texto: `Vencido há ${Math.abs(diffDias)} dia(s)` };
  } else if (diffDias === 0) {
    return { icone: '➔', classe: 'venc-hoje', texto: 'Vence HOJE' };
  } else if (diffDias <= 3) {
    return { icone: '➔', classe: 'venc-alerta', texto: `Vence em ${diffDias} dia(s)` };
  } else {
    return { icone: '⏳', classe: 'venc-pendente', texto: `Vence em ${diffDias} dias` };
  }
}

function carregarTabela(filtro = 'todos') {
  const corpoTabela = document.getElementById('corpoTabela');
  if (!corpoTabela) return;

  let contasFiltradas = contas.filter((c) => filtro === 'todos' || c.status === filtro);
  contasFiltradas = ordenarContas(contasFiltradas);

  atualizarIconesOrdenacao();

  if (!contasFiltradas.length) {
    corpoTabela.innerHTML = `<tr class="empty-row"><td colspan="6">Nenhuma conta encontrada.</td></tr>`;
    return;
  }

  corpoTabela.innerHTML = contasFiltradas.map((c) => {
    const indiceReal = contas.indexOf(c);
    const descricao = c.descricao || c.desc || '';
    const categoria = c.categoria || c.cat || '';
    const status = c.status || 'pendente';
    const valor = c.valor || 0;
    const vencimento = c.vencimento || '';

//setas para melhor visualização!
    let setaData = '';
    if (status === 'pendente') {
      setaData = '<span style="color: #d97706; font-weight: bold; margin-right: 6px; display: inline-block;">➔</span> ';
    } else if (status === 'vencido') {
      setaData = '<span style="color: #dc2626; font-weight: bold; margin-right: 6px; display: inline-block;">⬇</span> ';
    } else if (status === 'pago') {
      setaData = '<span style="color: #16a34a; font-weight: bold; margin-right: 6px; display: inline-block;">⬆</span> ';
    }

    return `
      <tr>
        <td class="desc">${descricao}</td>
        <td>
          <span class="badge ${categoria}">
            ${categoria === 'locacao' ? 'Locação' : categoria === 'convenio' ? 'Convênio' : 'Despesa'}
          </span>
        </td>
        <td class="valor">${formatarMoeda(valor)}</td>
        <td>${setaData}${formatarData(vencimento)}</td>
        <td>
          <span class="status ${status}">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>
        <td>
${status !== 'pago' ? `<button onclick="confirmarConta(${indiceReal})" class="btn-acao btn-pago" title="Confirmar pagamento">✓ Marcar como Pago</button>` : ''}
            <button onclick="excluirConta(${indiceReal})" class="btn-acao btn-remover" title="Excluir">✕ Remover</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Alternar coluna de ordenação ao clicar na header
window.ordenarPor = function (coluna) {
  if (ordenacaoAtual.coluna === coluna) {
    ordenacaoAtual.direcao = ordenacaoAtual.direcao === 'asc' ? 'desc' : 'asc';
  } else {
    ordenacaoAtual.coluna = coluna;
    ordenacaoAtual.direcao = 'asc';
  }
  const abaAtiva = document.querySelector('.tab.active');
  const filtroAtivo = abaAtiva ? abaAtiva.dataset.filter : 'todos';
  carregarTabela(filtroAtivo);
};

window.confirmarConta = function (indice) {
  if (confirm('Confirmar o pagamento desta conta?')) {
    contas[indice].status = 'pago';
    salvarEAtualizarVisual();
  }
};

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
      let csvContent = 'sep=;\n';
      csvContent += 'Descrição;Categoria;Valor (R$);Vencimento;Status\n';

      const linhas = contas.map((c) => {
        const descricao = (c.descricao || c.desc || '').replace(/"/g, '""');
        const categoria = c.categoria || c.cat || '';
        const nomeCategoria = categoria === 'locacao' ? 'Locação' : categoria === 'convenio' ? 'Convênio' : 'Despesa';
        const valorFormatado = Number(c.valor || 0).toFixed(2).replace('.', ',');
        const vencimento = formatarData(c.vencimento || '');
        const status = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Pendente';

        return `"${descricao}";"${nomeCategoria}";${valorFormatado};"${vencimento}";"${status}"`;
      }).join('\n');

      csvContent += linhas + '\n\n';

      const buffer = new Uint8Array(csvContent.length);
      for (let i = 0; i < csvContent.length; i++) {
        buffer[i] = csvContent.charCodeAt(i) & 0xff;
      }

      const arquivoBlob = new Blob([buffer], { type: 'text/csv;charset=iso-8859-1;' });
      const urlLink = URL.createObjectURL(arquivoBlob);
      const elementoLink = document.createElement('a');
      const dataAtual = new Date().toISOString().slice(0, 10);
      elementoLink.href = urlLink;
      elementoLink.download = `relatorio_financeiro_attento_${dataAtual}.csv`;
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

      const novaConta = {
        descricao: document.getElementById('descricao').value,
        categoria: document.getElementById('categoria').value,
        valor: parseFloat(document.getElementById('valor').value),
        vencimento: document.getElementById('vencimento').value,
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
    const estaEscuro = document.body.classList.contains('dark-preview');
    
    const textoTema = document.getElementById('textoModoEscuro');
    if (textoTema) {
      textoTema.textContent = estaEscuro ? 'Modo Claro' : 'Modo Escuro';
    }
  });
}
  atualizarSumario();
  carregarTabela('todos');
});