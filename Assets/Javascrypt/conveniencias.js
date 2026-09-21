
  const categories = [
    { id:'cafe',       name:'Café',       icon:'☕', unitPrice:5 },
    { id:'cappuccino', name:'Cappuccino', icon:'☕', unitPrice:8 },
    { id:'agua',       name:'Água',       icon:'💧', unitPrice:3 },
    { id:'biscoito',   name:'Biscoito',   icon:'🍪', unitPrice:4 },
    { id:'impressao',  name:'Impressão',  icon:'🖨️', unitPrice:2 },
  ];

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
  let nextId = 1;
  const raw = [];
  const entries = raw.map(e => ({ id: nextId++, ...e }));

  let filters = { categoria:'todas', profissional:'todos' };
  let addingCatId = null;

  const currency = v => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const formatDate = iso => { const [y,m,d] = iso.split('-'); return `${d}/${m}`; };

 
  const catSelect = document.getElementById('fCategoria');
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    catSelect.appendChild(opt);
  });

  const profFilterSelect = document.getElementById('fProfissional');
  profissionais.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    profFilterSelect.appendChild(opt);
  });

  const profFormSelect = document.getElementById('f-prof');
  profissionais.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    profFormSelect.appendChild(opt);
  });

  catSelect.addEventListener('change', () => { filters.categoria = catSelect.value; render(); });
  profFilterSelect.addEventListener('change', () => { filters.profissional = profFilterSelect.value; render(); });


  function visibleEntries(catId){
    return entries.filter(e =>
      e.cat === catId &&
      (filters.profissional === 'todos' || e.prof === filters.profissional)
    );
  }

  function render(){
    const board = document.getElementById('board');
    const cats = categories.filter(c => filters.categoria === 'todas' || c.id === filters.categoria);

    board.innerHTML = cats.map(cat => {
      const rows = visibleEntries(cat.id);
      const total = rows.reduce((s, e) => s + e.valor, 0);
      const pendente = rows.filter(e => e.status === 'pendente').reduce((s, e) => s + e.valor, 0);

      return `
        <div class="item-card ${cat.id}">
          <div class="item-header">
            <div class="title">${cat.icon} ${cat.name} — ${currency(cat.unitPrice)}/un</div>
            <div class="right">
              <span class="pending-pill">${currency(pendente)} a pagar</span>
              <button class="add-btn" data-cat="${cat.id}">+ Add</button>
            </div>
          </div>
          ${rows.length ? `
            <table>
              <thead>
                <tr>
                  <th>Profissional</th>
                  <th>Qtd</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(e => `
                  <tr data-id="${e.id}">
                    <td class="prof">${e.prof}</td>
                    <td class="qtd">${e.qtd}</td>
                    <td class="data">${formatDate(e.data)}</td>
                    <td class="valor">${currency(e.valor)}</td>
                    <td>
                      <button class="status-badge ${e.status}" data-id="${e.id}" title="Clique para alternar">
                        ${e.status === 'pago' ? '✓ Pago' : 'Pendente'}
                      </button>
                    </td>
                    <td><button class="remove-btn" data-id="${e.id}" title="Remover">✕</button></td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3">TOTAL</td>
                  <td>${currency(total)}</td>
                  <td colspan="2" class="pend-label">${currency(pendente)} pend.</td>
                </tr>
              </tbody>
            </table>
          ` : `<div class="empty-msg">Nenhum lançamento para este filtro.</div>`}
        </div>
      `;
    }).join('');

    updateSummary();
  }

  function updateSummary(){
    const rows = entries.filter(e => filters.profissional === 'todos' || e.prof === filters.profissional);
    const total = rows.reduce((s, e) => s + e.valor, 0);
    const quitado = rows.filter(e => e.status === 'pago').reduce((s, e) => s + e.valor, 0);
    const aquitar = rows.filter(e => e.status === 'pendente').reduce((s, e) => s + e.valor, 0);

    document.getElementById('sumTotal').textContent = currency(total);
    document.getElementById('sumQuitado').textContent = currency(quitado);
    document.getElementById('sumAquitar').textContent = currency(aquitar);
  }

  
  document.getElementById('board').addEventListener('click', e => {
    const addBtn = e.target.closest('.add-btn');
    const statusBtn = e.target.closest('.status-badge');
    const removeBtn = e.target.closest('.remove-btn');

    if (addBtn){
      openAddModal(addBtn.dataset.cat);
      return;
    }

    if (statusBtn){
      const entry = entries.find(x => x.id === Number(statusBtn.dataset.id));
      if (entry) entry.status = entry.status === 'pago' ? 'pendente' : 'pago';
      render();
      return;
    }

    if (removeBtn){
      const id = Number(removeBtn.dataset.id);
      const idx = entries.findIndex(x => x.id === id);
      if (idx !== -1){
        entries.splice(idx, 1);
        render();
      }
    }
  });

  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const addForm = document.getElementById('addForm');
  const valorInput = document.getElementById('f-valor');
  const qtdInput = document.getElementById('f-qtd');
  const valorHint = document.getElementById('f-valor-hint');

  function openAddModal(catId){
    addingCatId = catId;
    const cat = categories.find(c => c.id === catId);
    modalTitle.textContent = `Adicionar consumo — ${cat.name}`;
    valorHint.textContent = `Preço de referência: ${currency(cat.unitPrice)}/un`;
    qtdInput.value = 1;
    valorInput.value = cat.unitPrice.toFixed(2);
    document.getElementById('f-data').value = '';
    profFormSelect.value = profissionais[0];
    modalOverlay.classList.add('open');
  }
  function closeModal(){
    modalOverlay.classList.remove('open');
    addForm.reset();
    addingCatId = null;
  }

  qtdInput.addEventListener('input', () => {
    if (!addingCatId) return;
    const cat = categories.find(c => c.id === addingCatId);
    const qtd = parseInt(qtdInput.value, 10) || 0;
    valorInput.value = (qtd * cat.unitPrice).toFixed(2);
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('cancelAdd').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal(); });

  addForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!addingCatId) return;

    entries.push({
      id: nextId++,
      cat: addingCatId,
      prof: profFormSelect.value,
      qtd: parseInt(qtdInput.value, 10) || 1,
      data: document.getElementById('f-data').value || '2026-09-01',
      valor: parseFloat(valorInput.value) || 0,
      status: 'pendente',
    });

    closeModal();
    render();
  });

 
  const alternarModoEscuro = document.getElementById('alternarModoEscuro');
  if (alternarModoEscuro) {
    alternarModoEscuro.addEventListener('click', () => {
      document.body.classList.toggle('dark-preview');
      alternarModoEscuro.textContent = document.body.classList.contains('dark-preview') ? '☀️' : '🌙';
    });
  }


  render();