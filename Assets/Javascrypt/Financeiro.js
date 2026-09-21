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

function carregarTabela(filtro = 'todos') {
  const corpoTabela = document.getElementById('corpoTabela');
  if (!corpoTabela) return;

  const contasFiltradas = contas.filter((c) => filtro === 'todos' || c.status === filtro);

  if (!contasFiltradas.length) {
    corpoTabela.innerHTML = `<tr class="empty-row"><td colspan="6">Nenhuma conta encontrada.</td></tr>`;
    return;
  }

  // Filtras as contas e mapeia para o HTML da tabela
  corpoTabela.innerHTML = contasFiltradas.map((c) => {
    const indiceReal = contas.indexOf(c);
    const descricao = c.descricao || c.desc || '';
    const categoria = c.categoria || c.cat || '';
    const status = c.status || 'pendente';
    const valor = c.valor || 0;
    const vencimento = c.vencimento || '';

    return `
      <tr>
        <td class="desc">${descricao}</td>
        <td>
          <span class="badge ${categoria}">
            ${categoria === 'locacao' ? 'Locação' : categoria === 'convenio' ? 'Convênio' : 'Despesa'}
          </span>
        </td>
        <td class="valor">${formatarMoeda(valor)}</td>
        <td>${formatarData(vencimento)}</td>
        <td>
          <span class="status ${status}">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>
        <td>
          ${status === 'pendente' ? `<button onclick="confirmarConta(${indiceReal})" style="background:transparent; border:none; cursor:pointer;" title="Confirmar pagamento">✅</button>` : ''}
          <button onclick="excluirConta(${indiceReal})" style="background:transparent; border:none; cursor:pointer;" title="Excluir">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

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

      // 1. Instrução de separador do Excel
      let csvContent = 'sep=;\n';

      // 2. Cabeçalho das Colunas
      csvContent += 'Descrição;Categoria;Valor (R$);Vencimento;Status\n';

      // 3. Linhas de Dados
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

      // 4. Totais e Resumo Financeiro
      const totalFaturado = contas.reduce((acc, c) => acc + Number(c.valor || 0), 0);
      const despesas = contas
        .filter((c) => (c.categoria || c.cat) === 'outros')
        .reduce((acc, c) => acc + Number(c.valor || 0), 0);
      const recebido = contas
        .filter((c) => c.status === 'pago' && (c.categoria || c.cat) !== 'outros')
        .reduce((acc, c) => acc + Number(c.valor || 0), 0) - contas
        .filter((c) => c.status === 'pago' && (c.categoria || c.cat) === 'outros')
        .reduce((acc, c) => acc + Number(c.valor || 0), 0);

      csvContent += `"-- RESUMO FINANCEIRO --";"";"";"";""\n`;
      csvContent += `"Total Faturado";"";${totalFaturado.toFixed(2).replace('.', ',')};"";""\n`;
      csvContent += `"Total Recebido";"";${recebido.toFixed(2).replace('.', ',')};"";""\n`;
      csvContent += `"Total Despesas";"";${despesas.toFixed(2).replace('.', ',')};"";""\n`;

      // 5.  Converte o texto para codificação ISO-8859-1 (Latin1/ANSI)
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
      alternarModoEscuro.textContent = document.body.classList.contains('dark-preview') ? '☀️' : '🌙';
    });
  }

  atualizarSumario();
  carregarTabela('todos');
});