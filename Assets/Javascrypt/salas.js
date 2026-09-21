
const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const dayLabels = { SEG:'Segunda-feira', TER:'Terça-feira', QUA:'Quarta-feira', QUI:'Quinta-feira', SEX:'Sexta-feira', SAB:'Sábado' };
const turnos = ['M', 'T', 'N'];
const turnoLabels = { M:'Manhã', T:'Tarde', N:'Noite' };
const turnoHorarios = { M:'08-13h', T:'14-17h', N:'18-21h' };


const profissionais = [
  'Dra. Camila Ferreira',
  'Dr. Rafael Souza',
  'Dra. Luana Martins',
  'Dr. Henrique Costa',
  'Dra. Patrícia Alves',
  'Dr. Lucas Oliveira',
  'Dra. Amanda Rocha',
  'Dr. Bruno Mendes',
];

function slot(status, prof){
  return { status, prof: prof || null };
}
function livre(){ return slot('livre', null); }

const unitsData = {
  europa: {
    label: 'Attento Europa',
    rooms: [
      {
        id:'onda', name:'Sala Onda', code:'Sala 01', size:'18m²', prices:{ M:300, T:330, N:300 },
        slots:{
          SEG:{ M:livre(), T:livre(), N:livre() },
          TER:{ M:livre(), T:livre(), N:livre() },
          QUA:{ M:livre(), T:livre(), N:livre() },
          QUI:{ M:livre(), T:livre(), N:livre() },
          SEX:{ M:livre(), T:livre(), N:livre() },
          SAB:{ M:livre(), T:livre(), N:livre() },
        }
      },
      {
        id:'areia', name:'Sala Areia', code:'Sala 02', size:'20m²', prices:{ M:300, T:330, N:300 },
        slots:{
          SEG:{ M:livre(), T:livre(), N:livre() },
          TER:{ M:livre(), T:livre(), N:livre() },
          QUA:{ M:livre(), T:livre(), N:livre() },
          QUI:{ M:livre(), T:livre(), N:livre() },
          SEX:{ M:livre(), T:livre(), N:livre() },
          SAB:{ M:livre(), T:livre(), N:livre() },
        }
      },
      {
        id:'brisa', name:'Sala Brisa', code:'Sala 03', size:'22m²', prices:{ M:300, T:330, N:300 },
        slots:{
          SEG:{ M:livre(), T:livre(), N:livre() },
          TER:{ M:livre(), T:livre(), N:livre() },
          QUA:{ M:livre(), T:livre(), N:livre() },
          QUI:{ M:livre(), T:livre(), N:livre() },
          SEX:{ M:livre(), T:livre(), N:livre() },
          SAB:{ M:livre(), T:livre(), N:livre() },
        }
      },
      {
        id:'mar', name:'Sala Mar', code:'Sala 04', size:'25m²', prices:{ M:300, T:330, N:300 },
        slots:{
          SEG:{ M:livre(), T:livre(), N:livre() },
          TER:{ M:livre(), T:livre(), N:livre() },
          QUA:{ M:livre(), T:livre(), N:livre() },
          QUI:{ M:livre(), T:livre(), N:livre() },
          SEX:{ M:livre(), T:livre(), N:livre() },
          SAB:{ M:livre(), T:livre(), N:livre() },
        }
      },
    ]
  },

  horizonte: {
    label: 'Attento Horizonte',
    rooms: [
      {
        id:'vento', name:'Sala Vento', code:'Sala 01', size:'16m²', prices:{ M:300, T:330, N:300 },
        slots:{
          SEG:{ M:livre(), T:livre(), N:livre() },
          TER:{ M:livre(), T:livre(), N:livre() },
          QUA:{ M:livre(), T:livre(), N:livre() },
          QUI:{ M:livre(), T:livre(), N:livre() },
          SEX:{ M:livre(), T:livre(), N:livre() },
          SAB:{ M:livre(), T:livre(), N:livre() },
        }
      },
      {
        id:'terra', name:'Sala Terra', code:'Sala 02', size:'19m²', prices:{ M:300, T:330, N:300 },
        slots:{
          SEG:{ M:livre(), T:livre(), N:livre() },
          TER:{ M:livre(), T:livre(), N:livre() },
          QUA:{ M:livre(), T:livre(), N:livre() },
          QUI:{ M:livre(), T:livre(), N:livre() },
          SEX:{ M:livre(), T:livre(), N:livre() },
          SAB:{ M:livre(), T:livre(), N:livre() },
        }
      },
      {
        id:'lua', name:'Sala Lua', code:'Sala 03', size:'21m²', prices:{ M:300, T:330, N:300 },
        slots:{
          SEG:{ M:livre(), T:livre(), N:livre() },
          TER:{ M:livre(), T:livre(), N:livre() },
          QUA:{ M:livre(), T:livre(), N:livre() },
          QUI:{ M:livre(), T:livre(), N:livre() },
          SEX:{ M:livre(), T:livre(), N:livre() },
          SAB:{ M:livre(), T:livre(), N:livre() },
        }
      },
      {
        id:'costa', name:'Sala Costa', code:'Sala 04', size:'21m²', prices:{ M:300, T:330, N:300 },
        slots:{
          SEG:{ M:livre(), T:livre(), N:livre() },
          TER:{ M:livre(), T:livre(), N:livre() },
          QUA:{ M:livre(), T:livre(), N:livre() },
          QUI:{ M:livre(), T:livre(), N:livre() },
          SEX:{ M:livre(), T:livre(), N:livre() },
          SAB:{ M:livre(), T:livre(), N:livre() },
        }
      },
    ]
  }
};

let currentUnit = 'europa';
let selectedSlotRef = null; 

const currency = v => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });


function renderPriceTags(room){
  return turnos.map(t => `
    <div class="price-tag ${t.toLowerCase()}">
      <span class="price-turno">${turnoLabels[t].toUpperCase()}</span>
      <span class="price-value">${currency(room.prices[t])}</span>
    </div>
  `).join('');
}

function renderGrid(){
  const unit = unitsData[currentUnit];
  const body = document.getElementById('gridBody');

  body.innerHTML = unit.rooms.map(room => `
    <tr>
      <td>
        <div class="room-info">
          <div class="room-name">${room.name}</div>
          <div class="room-meta">${room.code} · ${room.size}</div>
          <div class="room-prices">${renderPriceTags(room)}</div>
        </div>
      </td>
      ${days.map(day => `
        <td>
          <div class="day-cell">
            ${turnos.map(t => renderSlot(room.id, day, t)).join('')}
          </div>
        </td>
      `).join('')}
    </tr>
  `).join('');

  updateCounters();
}

function renderSlot(roomId, day, turno){
  const room = unitsData[currentUnit].rooms.find(r => r.id === roomId);
  const s = room.slots[day][turno];

  if (s.status === 'livre'){
    return `
      <div class="slot livre" data-room="${roomId}" data-day="${day}" data-turno="${turno}">
        <span class="turno-label">${turno} · ${turnoHorarios[turno]}</span>
        <span class="slot-name">Livre</span>
      </div>
    `;
  }

  return `
    <div class="slot ${s.status}" data-room="${roomId}" data-day="${day}" data-turno="${turno}">
      <span class="turno-label">${turno} · ${turnoHorarios[turno]}</span>
      <span class="slot-name">${s.prof}</span>
      ${s.status === 'pendente' ? '<span class="slot-sub">Pendente</span>' : ''}
    </div>
  `;
}

function updateCounters(){
  const unit = unitsData[currentUnit];
  let ocupados = 0, livres = 0, pendentes = 0;

  unit.rooms.forEach(room => {
    days.forEach(day => {
      turnos.forEach(t => {
        const status = room.slots[day][t].status;
        if (status === 'ocupado') ocupados++;
        else if (status === 'pendente') pendentes++;
        else livres++;
      });
    });
  });

  document.getElementById('countOcupados').textContent = ocupados;
  document.getElementById('countDisponiveis').textContent = livres;
  document.getElementById('countPendentes').textContent = pendentes;
}


document.getElementById('unitTabs').addEventListener('click', e => {
  const btn = e.target.closest('.unit-tab');
  if (!btn) return;
  document.querySelectorAll('.unit-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentUnit = btn.dataset.unit;
  renderGrid();
});

// ---------- Modal ----------
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalInfo = document.getElementById('modalInfo');
const modalActions = document.getElementById('modalActions');
const allocateForm = document.getElementById('allocateForm');
const profSelect = document.getElementById('f-prof');
const pendenteCheckbox = document.getElementById('f-pendente');

profissionais.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p;
  opt.textContent = p;
  profSelect.appendChild(opt);
});

function openModal(){ modalOverlay.classList.add('open'); }
function closeModal(){
  modalOverlay.classList.remove('open');
  allocateForm.reset();
  allocateForm.classList.add('hidden');
  modalActions.innerHTML = '';
  selectedSlotRef = null;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('cancelAllocate').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal(); });

document.getElementById('gridBody').addEventListener('click', e => {
  const cell = e.target.closest('.slot');
  if (!cell) return;

  const roomId = cell.dataset.room;
  const day = cell.dataset.day;
  const turno = cell.dataset.turno;
  const room = unitsData[currentUnit].rooms.find(r => r.id === roomId);
  const s = room.slots[day][turno];

  selectedSlotRef = { roomId, day, turno };

  const header = `<strong>${room.name}</strong> · ${dayLabels[day]} · ${turnoLabels[turno]}`;

  if (s.status === 'livre'){
    modalTitle.textContent = 'Alocar horário';
    modalInfo.innerHTML = `${header}<br>Este horário está disponível.`;
    allocateForm.classList.remove('hidden');
    modalActions.innerHTML = '';
    profSelect.value = '';
    pendenteCheckbox.checked = false;
  } else {
    modalTitle.textContent = s.status === 'pendente' ? 'Confirmação pendente' : 'Horário ocupado';
    modalInfo.innerHTML = `${header}<br>Profissional: <strong>${s.prof}</strong>`;
    allocateForm.classList.add('hidden');

    if (s.status === 'pendente'){
      modalActions.innerHTML = `
        <button type="button" class="btn btn-outline" id="cancelSlotBtn">Cancelar alocação</button>
        <button type="button" class="btn btn-success" id="confirmSlotBtn">Confirmar</button>
      `;
      document.getElementById('confirmSlotBtn').addEventListener('click', () => {
        s.status = 'ocupado';
        closeModal();
        renderGrid();
      });
      document.getElementById('cancelSlotBtn').addEventListener('click', () => {
        room.slots[day][turno] = livre();
        closeModal();
        renderGrid();
      });
    } else {
      modalActions.innerHTML = `
        <button type="button" class="btn btn-outline" id="closeSlotBtn">Fechar</button>
        <button type="button" class="btn btn-danger" id="freeSlotBtn">Liberar horário</button>
      `;
      document.getElementById('freeSlotBtn').addEventListener('click', () => {
        room.slots[day][turno] = livre();
        closeModal();
        renderGrid();
      });
      document.getElementById('closeSlotBtn').addEventListener('click', closeModal);
    }
  }

  openModal();
});

allocateForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!selectedSlotRef) return;

  const { roomId, day, turno } = selectedSlotRef;
  const room = unitsData[currentUnit].rooms.find(r => r.id === roomId);
  const prof = profSelect.value;
  if (!prof) return;

  room.slots[day][turno] = slot(pendenteCheckbox.checked ? 'pendente' : 'ocupado', prof);

  closeModal();
  renderGrid();
});


document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  });
});

const darkToggle = document.getElementById('darkToggle');
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-preview');
  darkToggle.textContent = document.body.classList.contains('dark-preview') ? '☀️' : '🌙';
});


renderGrid();