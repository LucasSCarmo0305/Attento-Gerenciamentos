const diasSemana = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const nomesDias = { SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sáb' };
const turnos = ['M', 'T', 'N'];
const nomesTurnos = { M: 'Manhã', T: 'Tarde', N: 'Noite' };
const horariosTurnos = { M: '08-13h', T: '14-17h', N: '18-21h' };



function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function mostrarTexto(id, texto) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = texto;
}

function mostrarHtml(id, html) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.innerHTML = html;
}




function carregarLista(chave, padrao) {
  const salvo = localStorage.getItem(chave);
  if (!salvo) return padrao;

  try {
    return JSON.parse(salvo);
  } catch (erro) {
    return padrao;
  }
}

function hojeISO() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return hoje.getFullYear() + '-' + mes + '-' + dia;
}




function paraISO(data) {
  if (!data) return '';
  data = String(data).trim();

  if (data.indexOf('/') !== -1) {
    const partes = data.split('/');
    return partes[2] + '-' + partes[1] + '-' + partes[0];
  }
  return data.slice(0, 10);
}

function formatarData(dataISO) {
  if (!dataISO) return 'sem data';
  const partes = dataISO.split('-');
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}




function nomeDoProfissional(profissional) {
  if (!profissional) return '';
  if (typeof profissional === 'object') return profissional.nome;
  return profissional;
}





function lerSalas() {
  const dados = carregarLista('attento_dados_unidades', null);

  const resultado = {
    temDados: dados !== null,
    unidades: [],
    porDia: {},
    agendaHoje: [],
    pendentes: [],
    ocupados: 0,
    pendente: 0,
    receitaSemana: 0,
    hojeEmUso: 0,
    hojeTotal: 0,
    diaHoje: null
  };

  for (let i = 0; i < diasSemana.length; i++) {
    resultado.porDia[diasSemana[i]] = { ocupados: 0, pendentes: 0, total: 0 };
  }

  if (!dados) return resultado;



  const posicaoHoje = new Date().getDay() - 1;
  if (posicaoHoje >= 0) resultado.diaHoje = diasSemana[posicaoHoje];

  for (const chave in dados) {
    const unidade = dados[chave];
    const resumo = { nome: unidade.rotulo, ocupados: 0, pendentes: 0, total: 0 };

    for (let s = 0; s < unidade.salas.length; s++) {
      const sala = unidade.salas[s];
      const linhaHoje = { sala: sala.nome, unidade: unidade.rotulo, turnos: {} };

      for (let d = 0; d < diasSemana.length; d++) {
        const dia = diasSemana[d];

        for (let t = 0; t < turnos.length; t++) {
          const turno = turnos[t];
          const slot = sala.slots[dia][turno];

          resumo.total++;
          resultado.porDia[dia].total++;

          if (slot.status === 'ocupado') {
            resumo.ocupados++;
            resultado.ocupados++;
            resultado.porDia[dia].ocupados++;
            resultado.receitaSemana += sala.precios[turno];
          }

          if (slot.status === 'pendente') {
            resumo.pendentes++;
            resultado.pendente++;
            resultado.porDia[dia].pendentes++;
            resultado.pendentes.push({
              sala: sala.nome,
              dia: nomesDias[dia],
              turno: nomesTurnos[turno],
              nome: nomeDoProfissional(slot.profissional)
            });
          }

          // Guarda os turnos de hoje para a agenda
          if (dia === resultado.diaHoje) {
            linhaHoje.turnos[turno] = slot;
            resultado.hojeTotal++;
            if (slot.status !== 'livre') resultado.hojeEmUso++;
          }
        }
      }

      if (resultado.diaHoje) resultado.agendaHoje.push(linhaHoje);
    }

    resultado.unidades.push(resumo);
  }

  return resultado;
}


function lerConveniencias() {
  const produtos = carregarLista('attento_produtos', []);
  const consumos = carregarLista('attento_consumos', []);
  const mesAtual = hojeISO().slice(0, 7);

  const resultado = { total: 0, pendente: 0, qtdPendentes: 0, porProduto: [], porComprador: [] };
  const totaisProduto = {};
  const totaisComprador = {};

  for (let i = 0; i < consumos.length; i++) {
    const c = consumos[i];


    if (c.data.slice(0, 7) !== mesAtual) continue;

    resultado.total += c.valor;

    if (c.status !== 'pago') {
      resultado.pendente += c.valor;
      resultado.qtdPendentes++;
      totaisComprador[c.comprador] = (totaisComprador[c.comprador] || 0) + c.valor;
    }

    if (!totaisProduto[c.produtoId]) {
     
      let nome = 'Produto removido';
      let emoji = '🛒';
      let cor = '#718096';
      for (let j = 0; j < produtos.length; j++) {
        if (produtos[j].id === c.produtoId) {
          nome = produtos[j].nome;
          emoji = produtos[j].emoji;
          cor = produtos[j].cor;
        }
      }
      totaisProduto[c.produtoId] = { nome: nome, emoji: emoji, cor: cor, valor: 0, qtd: 0 };
    }

    totaisProduto[c.produtoId].valor += c.valor;
    totaisProduto[c.produtoId].qtd += c.qtd;
  }

  for (const id in totaisProduto) {
    resultado.porProduto.push(totaisProduto[id]);
  }
  resultado.porProduto.sort(function (a, b) { return b.valor - a.valor; });

  for (const nome in totaisComprador) {
    resultado.porComprador.push({ nome: nome, valor: totaisComprador[nome] });
  }
  resultado.porComprador.sort(function (a, b) { return b.valor - a.valor; });

  return resultado;
}

// Página Financeiro
function lerFinanceiro() {
  const contas = carregarLista('financeiro_data', []);
  const hoje = hojeISO();

  const resultado = {
    temDados: contas.length > 0,
    faturamentoHoje: 0,
    totalPago: 0,
    usouTotal: false,
    aReceber: 0,
    vencidas: 0,
    valorVencidas: 0,
    recentes: []
  };

  const lista = [];

  for (let i = 0; i < contas.length; i++) {
    const c = contas[i];

    const conta = {
      status: (c.status || '').toLowerCase().trim(),
      categoria: (c.categoria || c.cat || '').toLowerCase().trim(),
      data: paraISO(c.vencimento || c.data),
      valor: parseFloat(c.valor || 0),
      descricao: c.descricao || c.desc || c.nome || c.profissional || c.titulo || 'Lançamento'
    };
    lista.push(conta);


    if (conta.categoria === 'outros') continue;

    if (conta.status === 'pago') {
      resultado.totalPago += conta.valor;
      if (conta.data === hoje) resultado.faturamentoHoje += conta.valor;
    } else {
      resultado.aReceber += conta.valor;
      if (conta.data !== '' && conta.data < hoje) {
        resultado.vencidas++;
        resultado.valorVencidas += conta.valor;
      }
    }
  }


  if (resultado.faturamentoHoje === 0 && resultado.totalPago > 0) {
    resultado.faturamentoHoje = resultado.totalPago;
    resultado.usouTotal = true;
  }


  lista.sort(function (a, b) { return b.data.localeCompare(a.data); });
  resultado.recentes = lista.slice(0, 6);

  return resultado;
}




function desenharSaudacao() {
  const hora = new Date().getHours();
  let saudacao = 'Boa noite';
  if (hora < 12) saudacao = 'Bom dia';
  else if (hora < 18) saudacao = 'Boa tarde';

  const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  mostrarTexto('saudacao', saudacao);
  mostrarTexto('dataHoje', data.charAt(0).toUpperCase() + data.slice(1));
}

function desenharCards(salas, conveniencias, financeiro) {

  mostrarTexto('dash-faturamento', formatarMoeda(financeiro.faturamentoHoje));
  if (!financeiro.temDados) {
    mostrarTexto('kpiFatSub', 'Nenhum lançamento ainda');
  } else if (financeiro.usouTotal) {
    mostrarTexto('kpiFatSub', 'Total pago (sem lançamentos hoje)');
  } else {
    mostrarTexto('kpiFatSub', 'Pago hoje');
  }


  let porcentagem = 0;
  if (salas.hojeTotal > 0) {
    porcentagem = Math.round((salas.hojeEmUso / salas.hojeTotal) * 100);
  }
  mostrarTexto('kpiOcup', porcentagem + '%');

  if (salas.diaHoje) {
    mostrarTexto('kpiOcupSub', salas.hojeEmUso + ' de ' + salas.hojeTotal + ' turnos em uso');
  } else {
    mostrarTexto('kpiOcupSub', 'Domingo, sem atendimento');
  }


  mostrarTexto('kpiSalas', formatarMoeda(salas.receitaSemana));
  let textoSalas = salas.ocupados + ' turnos ocupados';
  if (salas.pendente > 0) textoSalas += ', ' + salas.pendente + ' a confirmar';
  mostrarTexto('kpiSalasSub', textoSalas);


  mostrarTexto('kpiConv', formatarMoeda(conveniencias.total));
  if (conveniencias.pendente > 0) {
    mostrarTexto('kpiConvSub', formatarMoeda(conveniencias.pendente) + ' ainda não pago');
  } else if (conveniencias.total > 0) {
    mostrarTexto('kpiConvSub', 'Tudo pago');
  } else {
    mostrarTexto('kpiConvSub', 'Sem consumos neste mês');
  }
}

function desenharAgenda(salas) {
  if (!salas.temDados) {
    mostrarHtml('agenda', '<div class="vazio">Abra a página Salas para começar a registrar alocações.</div>');
    return;
  }
  if (!salas.diaHoje) {
    mostrarHtml('agenda', '<div class="vazio">Hoje é domingo. A grade de salas funciona de segunda a sábado.</div>');
    return;
  }
  if (salas.agendaHoje.length === 0) {
    mostrarHtml('agenda', '<div class="vazio">Nenhuma sala cadastrada.</div>');
    return;
  }

  let html = '<div class="ag-cab"><span>Sala</span>';
  for (let t = 0; t < turnos.length; t++) {
    html += '<span>' + nomesTurnos[turnos[t]] + ' (' + horariosTurnos[turnos[t]] + ')</span>';
  }
  html += '</div>';

  for (let i = 0; i < salas.agendaHoje.length; i++) {
    const linha = salas.agendaHoje[i];

    html += '<div class="ag-linha">';
    html += '<div class="ag-sala"><strong>' + escapar(linha.sala) + '</strong><span>' + escapar(linha.unidade) + '</span></div>';

    for (let t = 0; t < turnos.length; t++) {
      const slot = linha.turnos[turnos[t]];

      let texto = 'Livre';
      if (slot.status !== 'livre') {
        texto = escapar(nomeDoProfissional(slot.profissional));
        if (slot.status === 'pendente') texto += ' (a confirmar)';
      }

      html += '<div class="chip ' + slot.status + '" title="' + texto + '">' + texto + '</div>';
    }

    html += '</div>';
  }

  mostrarHtml('agenda', html);
}

function desenharAlertas(salas, conveniencias, financeiro) {
  const alertas = [];

  if (financeiro.vencidas > 0) {
    alertas.push({
      classe: 'perigo',
      texto: '<b>' + financeiro.vencidas + ' conta(s) vencida(s)</b> somando ' + formatarMoeda(financeiro.valorVencidas) + '.'
    });
  }

  if (salas.pendente > 0) {

    let exemplos = '';
    for (let i = 0; i < salas.pendentes.length && i < 2; i++) {
      const p = salas.pendentes[i];
      if (i > 0) exemplos += '; ';
      exemplos += escapar(p.nome) + ' (' + escapar(p.sala) + ', ' + p.dia + ' ' + p.turno.toLowerCase() + ')';
    }
    if (salas.pendente > 2) exemplos += ' e mais ' + (salas.pendente - 2);

    alertas.push({
      classe: '',
      texto: '<b>' + salas.pendente + ' reserva(s) a confirmar</b>: ' + exemplos + '.'
    });
  }

  if (conveniencias.qtdPendentes > 0) {
    let texto = '<b>' + formatarMoeda(conveniencias.pendente) + ' em conveniências</b> sem pagamento';
    if (conveniencias.porComprador.length > 0) {
      const maior = conveniencias.porComprador[0];
      texto += ', maior saldo de ' + escapar(maior.nome) + ' (' + formatarMoeda(maior.valor) + ')';
    }
    alertas.push({ classe: '', texto: texto + '.' });
  }

  if (alertas.length === 0) {
    alertas.push({ classe: 'ok', texto: 'Nada pendente por enquanto.' });
  }

  let html = '';
  for (let i = 0; i < alertas.length; i++) {
    html += '<li class="' + alertas[i].classe + '"><span>' + alertas[i].texto + '</span></li>';
  }
  mostrarHtml('alertas', html);
}

function desenharSemana(salas) {
  const posicaoHoje = new Date().getDay() - 1;
  let htmlSemana = '';

  for (let i = 0; i < diasSemana.length; i++) {
    const dia = diasSemana[i];
    const info = salas.porDia[dia];

    let pctOcupado = 0;
    let pctPendente = 0;
    if (info.total > 0) {
      pctOcupado = (info.ocupados / info.total) * 100;
      pctPendente = (info.pendentes / info.total) * 100;
    }

    let classeHoje = '';
    if (i === posicaoHoje) classeHoje = ' hoje';

    htmlSemana += '<div class="col' + classeHoje + '">';
    htmlSemana += '<span class="pct">' + Math.round(pctOcupado + pctPendente) + '%</span>';
    htmlSemana += '<div class="pilha-v" title="' + info.ocupados + ' ocupados, ' + info.pendentes + ' pendentes de ' + info.total + '">';
    htmlSemana += '<i class="o" data-h="' + pctOcupado + '"></i><i class="p" data-h="' + pctPendente + '"></i></div>';
    htmlSemana += '<span>' + nomesDias[dia] + '</span></div>';
  }
  mostrarHtml('semana', htmlSemana);

  let htmlUnidades = '';
  for (let i = 0; i < salas.unidades.length; i++) {
    const u = salas.unidades[i];

    let pctOcupado = 0;
    let pctPendente = 0;
    if (u.total > 0) {
      pctOcupado = (u.ocupados / u.total) * 100;
      pctPendente = (u.pendentes / u.total) * 100;
    }
    const livres = u.total - u.ocupados - u.pendentes;

    htmlUnidades += '<div class="un"><div class="un-topo"><strong>' + escapar(u.nome) + '</strong>';
    htmlUnidades += '<span>' + u.ocupados + ' ocupados, ' + u.pendentes + ' a confirmar, ' + livres + ' livres</span></div>';
    htmlUnidades += '<div class="pilha"><i class="o" data-w="' + pctOcupado + '"></i><i class="p" data-w="' + pctPendente + '"></i></div></div>';
  }
  mostrarHtml('unidades', htmlUnidades);


  setTimeout(animarBarras, 50);
}

function animarBarras() {
  const alturas = document.querySelectorAll('[data-h]');
  for (let i = 0; i < alturas.length; i++) {
    alturas[i].style.height = alturas[i].dataset.h + '%';
  }

  const larguras = document.querySelectorAll('[data-w]');
  for (let i = 0; i < larguras.length; i++) {
    larguras[i].style.width = larguras[i].dataset.w + '%';
  }
}

function desenharConveniencias(conveniencias) {
  if (conveniencias.porProduto.length === 0) {
    mostrarHtml('convTop', '<div class="vazio">Sem consumos neste mês.</div>');
    return;
  }

  const maior = conveniencias.porProduto[0].valor;
  let html = '';

  for (let i = 0; i < conveniencias.porProduto.length && i < 5; i++) {
    const p = conveniencias.porProduto[i];
    const largura = (p.valor / maior) * 100;

    html += '<div class="linha-dado">';
    html += '<div style="flex:1;min-width:0"><div class="rot"><span>' + p.emoji + '</span><span>' + escapar(p.nome) + '</span></div>';
    html += '<div class="barra-fina"><i style="width:' + largura + '%;background:' + p.cor + '"></i></div></div>';
    html += '<div style="text-align:right"><strong>' + formatarMoeda(p.valor) + '</strong><br><small>' + p.qtd + ' un.</small></div>';
    html += '</div>';
  }

  mostrarHtml('convTop', html);
}

function desenharFinanceiro(financeiro) {
 
  if (financeiro.recentes.length === 0) {
    mostrarHtml('finRecentes', '<div class="vazio">Nenhum lançamento no financeiro ainda.</div>');
  } else {
    let html = '';
    for (let i = 0; i < financeiro.recentes.length; i++) {
      const c = financeiro.recentes[i];

      let classe = 'pendente';
      let rotulo = 'Pendente';
      if (c.status === 'pago') {
        classe = 'pago';
        rotulo = 'Pago';
      }

      html += '<div class="linha-dado">';
      html += '<div class="rot"><span class="tag ' + classe + '">' + rotulo + '</span><span>' + escapar(c.descricao) + '</span></div>';
      html += '<div style="text-align:right"><strong>' + formatarMoeda(c.valor) + '</strong><br><small>' + formatarData(c.data) + '</small></div>';
      html += '</div>';
    }
    mostrarHtml('finRecentes', html);
  }


  let corVencidas = 'inherit';
  if (financeiro.vencidas > 0) corVencidas = 'var(--danger)';

  mostrarHtml('finResumo',
    '<div class="linha-dado"><span>Total recebido</span><strong>' + formatarMoeda(financeiro.totalPago) + '</strong></div>' +
    '<div class="linha-dado"><span>A receber</span><strong>' + formatarMoeda(financeiro.aReceber) + '</strong></div>' +
    '<div class="linha-dado"><span>Contas vencidas</span><strong style="color:' + corVencidas + '">' + financeiro.vencidas + '</strong></div>'
  );
}


function atualizarDashboard() {
  const salas = lerSalas();
  const conveniencias = lerConveniencias();
  const financeiro = lerFinanceiro();

  desenharSaudacao();
  desenharCards(salas, conveniencias, financeiro);
  desenharAgenda(salas);
  desenharAlertas(salas, conveniencias, financeiro);
  desenharSemana(salas);
  desenharConveniencias(conveniencias);
  desenharFinanceiro(financeiro);
}

document.addEventListener('DOMContentLoaded', atualizarDashboard);


window.addEventListener('storage', atualizarDashboard);


document.addEventListener('visibilitychange', function () {
  if (!document.hidden) atualizarDashboard();
});
