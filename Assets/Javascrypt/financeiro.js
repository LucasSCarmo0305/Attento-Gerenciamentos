const CORES = ['#7c8ff0', '#f2a65a', '#3fbf8f', '#e8707d', '#a68cf0', '#f06d9a', '#4fc3d9', '#f0a94f'];

let contas = JSON.parse(localStorage.getItem('financeiro_data')) || [];

let ordenacaoAtual = {
  coluna: 'vencimento',
  direcao: 'asc'
};

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function converterMoedaParaNumero(valorFormatado) {
  if (!valorFormatado) return 0;
  return parseFloat(String(valorFormatado).replace(/\./g, '').replace(',', '.')) || 0;
}

function formatarData(data) {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : data;
}

function obterNomeCategoria(categoria) {
  if (categoria === 'locacao') return 'Locação';
  if (categoria === 'convenio') return 'Convênio';
  return 'Despesa';
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

    let setaData = '';
    if (status === 'pendente') {
      setaData = '<span class="seta-data seta-pendente">➔</span>';
    } else if (status === 'vencido') {
      setaData = '<span class="seta-data seta-vencido">⬇</span>';
    } else if (status === 'pago') {
      setaData = '<span class="seta-data seta-pago">⬆</span>';
    }

    return `
      <tr>
        <td class="desc">${descricao}</td>
        <td>
          <span class="badge ${categoria}">
            ${obterNomeCategoria(categoria)}
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
          <div class="acoes-cell">
            ${status !== 'pago' ? `<button onclick="confirmarConta(${indiceReal})" class="btn-acao btn-pago" title="Confirmar pagamento">✓ Pago</button>` : ''}
            <button onclick="excluirConta(${indiceReal})" class="btn-acao btn-remover" title="Excluir">✕ Remover</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

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


function carregarExcelJS() {
  return new Promise((resolve, reject) => {
    if (typeof ExcelJS !== 'undefined') return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Não foi possível carregar a biblioteca ExcelJS.'));
    document.head.appendChild(script);
  });
}

async function exportarExcelFormatado() {
  if (!contas.length) {
    alert('Nenhum dado para exportar.');
    return;
  }

  try {
    await carregarExcelJS();
  } catch (erro) {
    alert('Erro ao carregar o gerador de Excel. Verifique sua conexão com a internet.');
    return;
  }

  const listaOrdenada = ordenarContas(contas);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Attento Saúde Integral';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Financeiro', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  // Larguras das colunas 
  sheet.columns = [
    { key: 'descricao', width: 40 },
    { key: 'categoria', width: 16 },
    { key: 'valor', width: 18 },
    { key: 'vencimento', width: 16 },
    { key: 'status', width: 15 }
  ];

  const bordaFina = {
    top: { style: 'thin', color: { argb: 'FFD9E2EC' } },
    left: { style: 'thin', color: { argb: 'FFD9E2EC' } },
    bottom: { style: 'thin', color: { argb: 'FFD9E2EC' } },
    right: { style: 'thin', color: { argb: 'FFD9E2EC' } }
  };

  // === Linha 1: Título ===
  sheet.mergeCells('A1:E1');
  const celulaTitulo = sheet.getCell('A1');
  celulaTitulo.value = 'ATTENTO SAÚDE INTEGRAL · RELATÓRIO FINANCEIRO';
  celulaTitulo.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  celulaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  celulaTitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(1).height = 30;

  // === Linha 2: Subtítulo ===
  const dataBR = new Date().toLocaleDateString('pt-BR');
  sheet.mergeCells('A2:E2');
  const celulaSub = sheet.getCell('A2');
  celulaSub.value = `Exportado em ${dataBR}  ·  Total de registros: ${listaOrdenada.length}`;
  celulaSub.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF0F766E' } };
  celulaSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7F8' } };
  celulaSub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(2).height = 22;

  // Linha 3: Espaço
  sheet.getRow(3).height = 10;


  const headerRow = sheet.getRow(4);
  headerRow.values = ['Descrição', 'Categoria', 'Valor (R$)', 'Vencimento', 'Status'];
  headerRow.height = 24;

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F9AAD' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNumber === 1 ? 'left' : colNumber === 3 ? 'right' : 'center',
      indent: colNumber === 1 ? 1 : 0
    };
    cell.border = bordaFina;
  });

  // Paletas de cores por categoria e status
  const estilosCategoria = {
    locacao: { bg: 'FFE0F2FE', cor: 'FF0369A1' },
    convenio: { bg: 'FFF3E8FF', cor: 'FF6B21A8' },
    outros: { bg: 'FFFDECEC', cor: 'FFB91C1C' }
  };

  const estilosStatus = {
    pago: { bg: 'FFDCFCE7', cor: 'FF166534' },
    pendente: { bg: 'FFFEF3C7', cor: 'FF92400E' },
    vencido: { bg: 'FFFEE2E2', cor: 'FF991B1B' }
  };

  let totalReceitas = 0;
  let totalDespesas = 0;
  let saldoRecebido = 0;
  let totalEmAberto = 0;

  const primeiraLinhaDados = 5;

  listaOrdenada.forEach((c, index) => {
    const descricao = c.descricao || c.desc || '';
    const categoriaCod = (c.categoria || c.cat || 'outros').toLowerCase();
    const nomeCategoria = obterNomeCategoria(categoriaCod);
    const valorNum = Number(c.valor || 0);
    const statusCod = (c.status || 'pendente').toLowerCase();
    const nomeStatus = statusCod.charAt(0).toUpperCase() + statusCod.slice(1);

    
    let valorVencimento = '-';
    if (c.vencimento && c.vencimento.includes('-')) {
      const [ano, mes, dia] = c.vencimento.split('-').map(Number);
      if (ano && mes && dia) {
        valorVencimento = new Date(Date.UTC(ano, mes - 1, dia));
      }
    }

    // Acumuladores do resumo
    if (categoriaCod === 'outros') {
      totalDespesas += valorNum;
      if (statusCod === 'pago') saldoRecebido -= valorNum;
    } else {
      totalReceitas += valorNum;
      if (statusCod === 'pago') saldoRecebido += valorNum;
    }

    if (statusCod === 'pendente' || statusCod === 'vencido') {
      totalEmAberto += valorNum;
    }

    const row = sheet.addRow([descricao, nomeCategoria, valorNum, valorVencimento, nomeStatus]);
    row.height = 22;

    const corZebra = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
    const estCat = estilosCategoria[categoriaCod] || estilosCategoria.outros;
    const estStatus = estilosStatus[statusCod] || estilosStatus.pendente;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: corZebra } };
      cell.border = bordaFina;
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      // Coluna 1: Descrição
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      }

      // Coluna 2: Categoria
      if (colNumber === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: estCat.cor } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estCat.bg } };
      }

      // Coluna 3: Valor (R$)
      if (colNumber === 3) {
        cell.numFmt = '"R$ "#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = {
          name: 'Calibri',
          size: 10.5,
          bold: true,
          color: { argb: categoriaCod === 'outros' ? 'FFB91C1C' : 'FF0F172A' }
        };
      }

      // Coluna 4: Vencimento
      if (colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (valorVencimento instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF475569' } };
      }

      // Coluna 5: Status
      if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: estStatus.cor } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estStatus.bg } };
      }
    });
  });

  const ultimaLinhaDados = primeiraLinhaDados + listaOrdenada.length - 1;

  // Filtro automático na tabela principal
  sheet.autoFilter = {
    from: 'A4',
    to: `E${ultimaLinhaDados}`
  };

  // === Bloco de Resumo Financeiro com Fórmulas Reais ===
  const inicioResumo = ultimaLinhaDados + 2;

  sheet.mergeCells(`A${inicioResumo}:C${inicioResumo}`);
  const resumoHeader = sheet.getCell(`A${inicioResumo}`);
  resumoHeader.value = 'RESUMO FINANCEIRO';
  resumoHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  resumoHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  resumoHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(inicioResumo).height = 24;

  const intCat = `B${primeiraLinhaDados}:B${ultimaLinhaDados}`;
  const intVal = `C${primeiraLinhaDados}:C${ultimaLinhaDados}`;
  const intSt = `E${primeiraLinhaDados}:E${ultimaLinhaDados}`;
  const saldoGeral = totalReceitas - totalDespesas;

  const linhasResumo = [
    {
      label: 'Total de Receitas (Locação + Convênio)',
      formula: `SUMIF(${intCat},"Locação",${intVal})+SUMIF(${intCat},"Convênio",${intVal})`,
      result: totalReceitas,
      bg: 'FFE6F7F0',
      cor: 'FF0F766E'
    },
    {
      label: 'Total de Despesas',
      formula: `SUMIF(${intCat},"Despesa",${intVal})`,
      result: totalDespesas,
      bg: 'FFFDECEC',
      cor: 'FFB91C1C'
    },
    {
      label: 'Em Aberto (Pendente + Vencido)',
      formula: `SUMIF(${intSt},"Pendente",${intVal})+SUMIF(${intSt},"Vencido",${intVal})`,
      result: totalEmAberto,
      bg: 'FFFFFBEB',
      cor: 'FF92400E'
    },
    {
      label: 'Saldo Recebido (Contas Pagas)',
      formula: `SUMIFS(${intVal},${intCat},"Locação",${intSt},"Pago")+SUMIFS(${intVal},${intCat},"Convênio",${intSt},"Pago")-SUMIFS(${intVal},${intCat},"Despesa",${intSt},"Pago")`,
      result: saldoRecebido,
      bg: saldoRecebido >= 0 ? 'FFDCFCE7' : 'FFFEE2E2',
      cor: saldoRecebido >= 0 ? 'FF166534' : 'FF991B1B',
      destaque: true
    },
    {
      label: 'Saldo Geral (Receitas - Despesas)',
      formula: `C${inicioResumo + 1}-C${inicioResumo + 2}`,
      result: saldoGeral,
      bg: saldoGeral >= 0 ? 'FFE0F2FE' : 'FFFEE2E2',
      cor: saldoGeral >= 0 ? 'FF0369A1' : 'FF991B1B',
      destaque: true
    }
  ];

  linhasResumo.forEach((item, idx) => {
    const r = inicioResumo + 1 + idx;
    sheet.mergeCells(`A${r}:B${r}`);

    const cellLabel = sheet.getCell(`A${r}`);
    const cellVal = sheet.getCell(`C${r}`);

    cellLabel.value = item.label;
    cellVal.value = { formula: item.formula, result: item.result };
    cellVal.numFmt = '"R$ "#,##0.00';

    const row = sheet.getRow(r);
    row.height = item.destaque ? 24 : 21;

    [cellLabel, sheet.getCell(`B${r}`), cellVal].forEach((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.bg } };
      cell.border = bordaFina;
      cell.font = {
        name: 'Calibri',
        size: item.destaque ? 11 : 10.5,
        bold: true,
        color: { argb: item.cor }
      };
    });

    cellLabel.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cellVal.alignment = { vertical: 'middle', horizontal: 'right' };
  });

  // === Gera e baixa o arquivo .xlsx ===
  const buffer = await workbook.xlsx.writeBuffer();
  const arquivoBlob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const urlLink = URL.createObjectURL(arquivoBlob);
  const elementoLink = document.createElement('a');
  const dataAtual = new Date().toISOString().slice(0, 10);
  elementoLink.href = urlLink;
  elementoLink.download = `relatorio_financeiro_attento_${dataAtual}.xlsx`;
  document.body.appendChild(elementoLink);
  elementoLink.click();
  elementoLink.remove();
  URL.revokeObjectURL(urlLink);
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
      exportarExcelFormatado();
    });
  }

  const modalAdicionar = document.getElementById('modalAdicionar');
  const formularioAdicionar = document.getElementById('formularioAdicionar');
  const botaoAdicionar = document.getElementById('botaoAdicionar');
  const botaoFecharModal = document.getElementById('botaoFecharModal');
  const campoValor = document.getElementById('valor');

  if (campoValor) {
    campoValor.type = 'text';
    campoValor.inputMode = 'numeric';
    campoValor.removeAttribute('step');
    campoValor.placeholder = '0,00';

    campoValor.addEventListener('input', (evento) => {
      const digitos = evento.target.value.replace(/\D/g, '');
      if (!digitos) {
        evento.target.value = '';
        return;
      }
      const numero = Number(digitos) / 100;
      evento.target.value = numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    });
  }

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
        valor: converterMoedaParaNumero(document.getElementById('valor').value),
        vencimento: document.getElementById('vencimento').value,
        status: document.getElementById('status').value
      };

      contas.push(novaConta);
      salvarEAtualizarVisual();

      modalAdicionar.style.display = 'none';
      formularioAdicionar.reset();
    });
  }

  atualizarSumario();
  carregarTabela('todos');
});

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