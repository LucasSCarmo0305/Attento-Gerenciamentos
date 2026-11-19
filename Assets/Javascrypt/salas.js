const diasSemana = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const rotulosDias = { SEG: 'Segunda-feira', TER: 'Terça-feira', QUA: 'Quarta-feira', QUI: 'Quinta-feira', SEX: 'Sexta-feira', SAB: 'Sábado' };
const turnos = ['M', 'T', 'N'];
const rotulosTurno = { M: 'Manhã', T: 'Tarde', N: 'Noite' };
const horariosTurno = { M: '08-13h', T: '14-17h', N: '18-21h' };
const horasExtra = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];


function criarSlotLivre() {
  return { status: 'livre', profissional: null };
}



function criarSlotsParaSala() {
  const slotsTurno = {};
  const slotsHora = {};

  for (let i = 0; i < diasSemana.length; i++) {
    const dia = diasSemana[i];

    slotsTurno[dia] = {
      M: criarSlotLivre(),
      T: criarSlotLivre(),
      N: criarSlotLivre()
    };

    slotsHora[dia] = {};
    for (let j = 0; j < horasExtra.length; j++) {
      const hora = horasExtra[j];
      slotsHora[dia][hora] = criarSlotLivre();
    }
  }

  return { slotsTurno: slotsTurno, slotsHora: slotsHora };
}



function criarSala(id, nome, codigo, tamanho, precios) {
  const estrutura = criarSlotsParaSala();
  return {
    id: id,
    nome: nome,
    codigo: codigo,
    tamanho: tamanho,
    precios: precios,
    slots: estrutura.slotsTurno,
    slotsPorHora: estrutura.slotsHora
  };
}


// Estrutura 
const dadosIniciaisUnidades = {
  europa: {
    rotulo: 'Attento Europa',
    salas: [
      criarSala('onda', 'Sala Onda', 'Sala 01', '18m²', { M: 300, T: 330, N: 300, hora: 80 }),
      criarSala('areia', 'Sala Areia', 'Sala 02', '20m²', { M: 300, T: 330, N: 300, hora: 80 }),
      criarSala('brisa', 'Sala Brisa', 'Sala 03', '22m²', { M: 300, T: 330, N: 300, hora: 85 }),
      criarSala('mar', 'Sala Mar', 'Sala 04', '25m²', { M: 300, T: 330, N: 300, hora: 90 })
    ]
  },
  horizonte: {
    rotulo: 'Attento Horizonte',
    salas: [
      criarSala('vento', 'Sala Vento', 'Sala 01', '16m²', { M: 300, T: 330, N: 300, hora: 75 }),
      criarSala('terra', 'Sala Terra', 'Sala 02', '19m²', { M: 300, T: 330, N: 300, hora: 80 }),
      criarSala('lua', 'Sala Lua', 'Sala 03', '21m²', { M: 300, T: 330, N: 300, hora: 85 }),
      criarSala('costa', 'Sala Costa', 'Sala 04', '21m²', { M: 300, T: 330, N: 300, hora: 85 })
    ]
  }
};


function salvarDados() {
  localStorage.setItem('attento_dados_unidades', JSON.stringify(dadosUnidades));
}

function carregarDados() {
  const dadosSalvos = localStorage.getItem('attento_dados_unidades');
  if (dadosSalvos) {
    return JSON.parse(dadosSalvos);
  }
  return dadosIniciaisUnidades;
}


let dadosUnidades = carregarDados();
let unidadeAtual = 'europa';
let modoAtual = 'turno';
let slotSelecionado = null;


function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function obterNomeProfissional(profissional) {
  if (!profissional) return '';
  if (typeof profissional === 'object') {
    return profissional.nome;
  }
  return profissional;
}


function renderizarPrecos(sala) {
  if (modoAtual === 'turno') {
    let html = '';
    for (let i = 0; i < turnos.length; i++) {
      const t = turnos[i];
      html += `
        <div class="etiqueta-preco ${t.toLowerCase()}">
          <span class="preco-turno">${rotulosTurno[t].toUpperCase()}</span>
          <span class="valor-preco">${formatarMoeda(sala.precios[t])}</span>
        </div>
      `;
    }
    return html;
  } else {
    return `
      <div class="etiqueta-preco hora">
        <span class="preco-turno">HORA EXTRA</span>
        <span class="valor-preco">${formatarMoeda(sala.precios.hora)}/h</span>
      </div>
    `;
  }
}

function renderizarGrade() {
  const corpoTabela = document.getElementById('gridBody');
  if (!corpoTabela) return;

  const unidade = dadosUnidades[unidadeAtual];
  let htmlLinhas = '';

  for (let i = 0; i < unidade.salas.length; i++) {
    const sala = unidade.salas[i];

    if (modoAtual === 'turno') {
  
     htmlLinhas += `
  <tr class="linha-cabecalho-sala" data-sala="${sala.id}">
    <td colspan="7">
      <div class="cabecalho-sala-flex">
        <div>
          <span class="nome-sala">${sala.nome}</span>
          <span class="meta-sala">${sala.codigo} · ${sala.tamanho}</span>
        </div>
        <button type="button" class="btn-remover-sala" data-remover="${sala.id}">🗑 Remover</button>
      </div>
    </td>
  </tr>
`;

      // Uma linha por turno
      for (let t = 0; t < turnos.length; t++) {
        const turno = turnos[t];

        htmlLinhas += `
          <tr class="linha-turno turno-${turno.toLowerCase()}" data-sala="${sala.id}">
            <td class="coluna-preco">
              <div class="etiqueta-preco ${turno.toLowerCase()}">
                <span class="preco-turno">${rotulosTurno[turno].toUpperCase()}</span>
                <span class="valor-preco">${formatarMoeda(sala.precios[turno])}</span>
              </div>
            </td>
        `;

        for (let d = 0; d < diasSemana.length; d++) {
          const dia = diasSemana[d];
          const slot = sala.slots[dia][turno];
          const nomeProf = slot.status === 'livre' ? 'Livre' : obterNomeProfissional(slot.profissional);
          const textoPendente = slot.status === 'pendente' ? '<span class="subtexto-horario">Pendente</span>' : '';

          htmlLinhas += `
            <td>
              <div class="bloco-horario ${slot.status}" data-sala="${sala.id}" data-dia="${dia}" data-turno="${turno}">
                <span class="rotulo-turno">${horariosTurno[turno]}</span>
                <span class="nome-horario">${nomeProf}</span>
                ${textoPendente}
              </div>
            </td>
          `;
        }

        htmlLinhas += '</tr>';
      }
    } else {

      htmlLinhas += '<tr>';
      htmlLinhas += `
        <td>
          <div class="info-sala" data-sala="${sala.id}">
            <div class="nome-sala">${sala.nome}</div>
            <div class="meta-sala">${sala.codigo} · ${sala.tamanho}</div>
            <div class="precos-sala">${renderizarPrecos(sala)}</div>
            <button type="button" class="btn-remover-sala" data-remover="${sala.id}">🗑 Remover</button>
          </div>
        </td>
      `;

      for (let d = 0; d < diasSemana.length; d++) {
        const dia = diasSemana[d];
        htmlLinhas += '<td><div class="celula-dia celula-por-hora">';

        for (let h = 0; h < horasExtra.length; h++) {
          const hora = horasExtra[h];
          const slot = sala.slotsPorHora[dia][hora];
          const nomeProf = slot.status === 'livre' ? 'Livre' : obterNomeProfissional(slot.profissional);
          const textoPendente = slot.status === 'pendente' ? '<span class="subtexto-horario">Pendente</span>' : '';

          htmlLinhas += `
            <div class="bloco-horario ${slot.status} horario-por-hora" data-sala="${sala.id}" data-dia="${dia}" data-hora="${hora}">
              <span class="rotulo-turno">${hora}</span>
              <span class="nome-horario">${nomeProf}</span>
              ${textoPendente}
            </div>
          `;
        }

        htmlLinhas += '</div></td>';
      }

      htmlLinhas += '</tr>';
    }
  }
  if (unidade.salas.length === 0) {
  htmlLinhas = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-400);">Nenhuma sala cadastrada nesta unidade.</td></tr>';
}
  corpoTabela.innerHTML = htmlLinhas;
  atualizarContadores();
}

function atualizarContadores() {
  let ocupados = 0;
  let livres = 0;
  let pendentes = 0;

  const unidade = dadosUnidades[unidadeAtual];

  for (let i = 0; i < unidade.salas.length; i++) {
    const sala = unidade.salas[i];

    for (let d = 0; d < diasSemana.length; d++) {
      const dia = diasSemana[d];

      if (modoAtual === 'turno') {
        for (let t = 0; t < turnos.length; t++) {
          const status = sala.slots[dia][turnos[t]].status;
          if (status === 'ocupado') ocupados++;
          else if (status === 'pendente') pendentes++;
          else livres++;
        }
      } else {
        for (let h = 0; h < horasExtra.length; h++) {
          const status = sala.slotsPorHora[dia][horasExtra[h]].status;
          if (status === 'ocupado') ocupados++;
          else if (status === 'pendente') pendentes++;
          else livres++;
        }
      }
    }
  }

  const elOcupados = document.getElementById('countOcupados');
  const elDisponiveis = document.getElementById('countDisponiveis');
  const elPendentes = document.getElementById('countPendentes');

  if (elOcupados) elOcupados.textContent = ocupados;
  if (elDisponiveis) elDisponiveis.textContent = livres;
  if (elPendentes) elPendentes.textContent = pendentes;
}


function abrirModal() {
  const fundoModal = document.getElementById('modalOverlay');
  if (fundoModal) fundoModal.classList.add('open');
}

function fecharModal() {
  const fundoModal = document.getElementById('modalOverlay');
  const formularioAlocacao = document.getElementById('allocateForm');
  const acoesModal = document.getElementById('acoesModal');

  if (fundoModal) fundoModal.classList.remove('open');
  if (formularioAlocacao) {
    formularioAlocacao.reset();
    formularioAlocacao.classList.add('escondido');
  }
  if (acoesModal) acoesModal.innerHTML = '';
  slotSelecionado = null;
}

// Fechamento do Modal
const btnFecharModal = document.getElementById('modalClose');
if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);

const btnCancelarModal = document.getElementById('cancelAllocate');
if (btnCancelarModal) btnCancelarModal.addEventListener('click', fecharModal);

const fundoModal = document.getElementById('modalOverlay');
if (fundoModal) {
  fundoModal.addEventListener('click', function (e) {
    if (e.target === fundoModal) fecharModal();
  });
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') fecharModal();
});

// Troca de Abas (Unidade / Modo)
document.addEventListener('click', function (e) {
  const abaUnidade = e.target.closest('.aba-unidade');
  if (abaUnidade) {
    if (abaUnidade.dataset.unit === unidadeAtual) return;

   
    const ordem = Object.keys(dadosUnidades);
    const direcao = ordem.indexOf(abaUnidade.dataset.unit) > ordem.indexOf(unidadeAtual)
      ? 'direita'
      : 'esquerda';

    const abas = document.querySelectorAll('.aba-unidade');
    abas.forEach(function (aba) { aba.classList.remove('active'); });
    abaUnidade.classList.add('active');
    unidadeAtual = abaUnidade.dataset.unit;
    renderizarGrade();
    animarTroca(direcao);
    return;
  }

  const abaModo = e.target.closest('.aba-modo');
  if (abaModo) {
    const abas = document.querySelectorAll('.aba-modo');
    abas.forEach(function (aba) { aba.classList.remove('active'); });
    abaModo.classList.add('active');
    modoAtual = abaModo.dataset.mode;
    renderizarGrade();
    return;
  }
});

// Clique nos Slots da Tabela
const gridBody = document.getElementById('gridBody');
if (gridBody) {
  gridBody.addEventListener('click', function (e) {
    const celula = e.target.closest('.bloco-horario');
    if (!celula) return;

    const idSala = celula.dataset.sala;
    const dia = celula.dataset.dia;
    const sala = dadosUnidades[unidadeAtual].salas.find(function (s) { return s.id === idSala; });

    let chave = '';
    let slot = null;
    let textoHorario = '';

    if (modoAtual === 'turno') {
      chave = celula.dataset.turno;
      slot = sala.slots[dia][chave];
      textoHorario = 'Turno ' + rotulosTurno[chave];
    } else {
      chave = celula.dataset.hora;
      slot = sala.slotsPorHora[dia][chave];
      textoHorario = 'Hora Extra (' + chave + ')';
    }

    slotSelecionado = { idSala: idSala, dia: dia, chave: chave, modo: modoAtual };

    const cabecalho = '<strong>' + sala.nome + '</strong> · ' + rotulosDias[dia] + ' · ' + textoHorario;

    const tituloModal = document.getElementById('modalTitle');
    const infoModal = document.getElementById('modalInfo');
    const formularioAlocacao = document.getElementById('allocateForm');
    let acoesModal = document.getElementById('acoesModal');

    if (!acoesModal) {
      acoesModal = document.createElement('div');
      acoesModal.id = 'acoesModal';
      acoesModal.className = 'rodape-modal';
      document.querySelector('.janela-modal').appendChild(acoesModal);
    }

    if (slot.status === 'livre') {
      tituloModal.textContent = modoAtual === 'turno' ? 'Alocar horário' : 'Alocar Hora Extra';
      infoModal.innerHTML = cabecalho + '<br>Este horário está disponível.';
      formularioAlocacao.classList.remove('escondido');
      acoesModal.innerHTML = '';
      document.getElementById('f-pendente').checked = false;
    } else {
      tituloModal.textContent = slot.status === 'pendente' ? 'Confirmação pendente' : 'Horário ocupado';

      let dadosProf = '';
      if (slot.profissional && typeof slot.profissional === 'object') {
        dadosProf = '<br>Profissional: <strong>' + slot.profissional.nome + '</strong><br>Telefone: ' + slot.profissional.telefone + '<br>E-mail: ' + slot.profissional.email;
      } else {
        dadosProf = '<br>Profissional: <strong>' + slot.profissional + '</strong>';
      }

      infoModal.innerHTML = cabecalho + dadosProf;
      formularioAlocacao.classList.add('escondido');

      if (slot.status === 'pendente') {
        acoesModal.innerHTML = `
          <button type="button" class="botao botao-contorno" id="btnCancelarSlot">Cancelar alocação</button>
          <button type="button" class="botao botao-sucesso" id="btnConfirmarSlot">Confirmar</button>
        `;

        document.getElementById('btnConfirmarSlot').addEventListener('click', function () {
          slot.status = 'ocupado';
          salvarDados();
          fecharModal();
          renderizarGrade();
        });

        document.getElementById('btnCancelarSlot').addEventListener('click', function () {
          if (modoAtual === 'turno') {
            sala.slots[dia][chave] = criarSlotLivre();
          } else {
            sala.slotsPorHora[dia][chave] = criarSlotLivre();
          }
          salvarDados();
          fecharModal();
          renderizarGrade();
        });
      } else {
        acoesModal.innerHTML = `
          <button type="button" class="botao botao-perigo" id="btnLiberarSlot">Liberar horário</button>
        `;

        document.getElementById('btnLiberarSlot').addEventListener('click', function () {
          if (modoAtual === 'turno') {
            sala.slots[dia][chave] = criarSlotLivre();
          } else {
            sala.slotsPorHora[dia][chave] = criarSlotLivre();
          }
          salvarDados();
          fecharModal();
          renderizarGrade();
        });
      }
    }

    abrirModal();
  });
}



// Envio do Formulário de Alocação
const formularioAlocacao = document.getElementById('allocateForm');
if (formularioAlocacao) {
  formularioAlocacao.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!slotSelecionado) return;

    const sala = dadosUnidades[unidadeAtual].salas.find(function (s) { return s.id === slotSelecionado.idSala; });

    const objetoProfissional = {
      nome: document.getElementById('f-nome').value.trim(),
      telefone: document.getElementById('f-telefone').value.trim(),
      email: document.getElementById('f-email').value.trim()
    };

    const novoStatus = document.getElementById('f-pendente').checked ? 'pendente' : 'ocupado';
    const novoSlot = { status: novoStatus, profissional: objetoProfissional };

    if (slotSelecionado.modo === 'turno') {
      sala.slots[slotSelecionado.dia][slotSelecionado.chave] = novoSlot;
    } else {
      sala.slotsPorHora[slotSelecionado.dia][slotSelecionado.chave] = novoSlot;
    }

    salvarDados();
    fecharModal();
    renderizarGrade();
  });
}




renderizarGrade();

// ===== Destaque interativo (hover) =====
let celulasSaltando = [];

function pararSalto() {
  celulasSaltando.forEach(function (el) {
    el.classList.remove('salta', 'realce-turno', 'realce-dia');
    el.style.transitionDelay = '';
  });
  celulasSaltando = [];
  document.querySelectorAll('.th-destaque').forEach(function (th) {
    th.classList.remove('th-destaque');
  });
}

function iniciarSalto(celulas, classeExtra) {
  pararSalto();
  celulasSaltando = Array.from(celulas);
  celulasSaltando.forEach(function (el, i) {
    el.style.transitionDelay = (i * 25) + 'ms'; // efeito de "onda"
    el.classList.add('salta');
    if (classeExtra) el.classList.add(classeExtra);
  });
}

function tratarHover(e) {
  const alvo = e.target;


  const th = alvo.closest('thead th[data-dia]');
  if (th) {
    iniciarSalto(document.querySelectorAll('.bloco-horario[data-dia="' + th.dataset.dia + '"]'), 'realce-dia');
    th.classList.add('th-destaque');
    return;
  }


  const sala = alvo.closest('.linha-cabecalho-sala, .info-sala');
  if (sala && sala.dataset.sala) {
    iniciarSalto(document.querySelectorAll('.bloco-horario[data-sala="' + sala.dataset.sala + '"]'));
    return;
  }

  const preco = alvo.closest('.coluna-preco');
  if (preco) {
    iniciarSalto(preco.parentElement.querySelectorAll('.bloco-horario'), 'realce-turno');
    return;
  }

  pararSalto();
}


document.querySelectorAll('thead th').forEach(function (th, i) {
  if (i > 0) th.dataset.dia = diasSemana[i - 1];
});

const tabelaGrade = document.querySelector('table');
if (tabelaGrade) {
  tabelaGrade.addEventListener('mouseover', tratarHover);
  tabelaGrade.addEventListener('mouseleave', pararSalto);
}

function animarTroca(direcao) {
  const corpo = document.getElementById('gridBody');
  if (!corpo) return;

  corpo.querySelectorAll('tr').forEach(function (tr, i) {
    tr.style.animationDelay = (i * 35) + 'ms'; 
    tr.classList.add('entra-' + direcao);
  });
}
// ===== Adicionar / Remover salas =====
function gerarIdSala(nome) {
  const base = nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'sala';
  return base + '-' + Date.now();
}

const modalSala = document.getElementById('modalSala');
const formSala = document.getElementById('formSala');

function abrirModalSala() {
  formSala.reset();
  modalSala.classList.add('open');
  document.getElementById('s-nome').focus();
}

function fecharModalSala() {
  modalSala.classList.remove('open');
}

document.getElementById('btnAdicionarSala').addEventListener('click', abrirModalSala);
document.getElementById('modalSalaClose').addEventListener('click', fecharModalSala);
document.getElementById('cancelarSala').addEventListener('click', fecharModalSala);
modalSala.addEventListener('click', function (e) {
  if (e.target === modalSala) fecharModalSala();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') fecharModalSala();
});

formSala.addEventListener('submit', function (e) {
  e.preventDefault();

  const unidade = dadosUnidades[unidadeAtual];
  const nome = document.getElementById('s-nome').value.trim();

  const jaExiste = unidade.salas.some(function (s) {
    return s.nome.toLowerCase() === nome.toLowerCase();
  });
  if (jaExiste) {
    alert('Já existe uma sala com esse nome nesta unidade.');
    return;
  }

  const codigo = document.getElementById('s-codigo').value.trim()
    || 'Sala ' + String(unidade.salas.length + 1).padStart(2, '0');
  const tamanho = document.getElementById('s-tamanho').value + 'm²';

  const precos = {
    M: Number(document.getElementById('s-preco-m').value),
    T: Number(document.getElementById('s-preco-t').value),
    N: Number(document.getElementById('s-preco-n').value),
    hora: Number(document.getElementById('s-preco-h').value)
  };

  unidade.salas.push(criarSala(gerarIdSala(nome), nome, codigo, tamanho, precos));

  salvarDados();
  fecharModalSala();
  renderizarGrade();
});

function salaTemReservas(sala) {
  for (let d = 0; d < diasSemana.length; d++) {
    const dia = diasSemana[d];
    for (let t = 0; t < turnos.length; t++) {
      if (sala.slots[dia][turnos[t]].status !== 'livre') return true;
    }
    for (let h = 0; h < horasExtra.length; h++) {
      if (sala.slotsPorHora[dia][horasExtra[h]].status !== 'livre') return true;
    }
  }
  return false;
}

document.getElementById('gridBody').addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-remover-sala');
  if (!btn) return;

  const unidade = dadosUnidades[unidadeAtual];
  const sala = unidade.salas.find(function (s) { return s.id === btn.dataset.remover; });
  if (!sala) return;

  let msg = 'Remover a sala "' + sala.nome + '"?';
  if (salaTemReservas(sala)) {
    msg += '\n\nATENÇÃO: ela tem horários ocupados/pendentes, que serão perdidos.';
  }
  if (!confirm(msg)) return;

  unidade.salas = unidade.salas.filter(function (s) { return s.id !== sala.id; });
  salvarDados();
  renderizarGrade();
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