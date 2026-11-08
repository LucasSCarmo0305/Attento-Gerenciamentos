
<<<<<<< HEAD
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
=======

function salvarDados() {
  localStorage.setItem('app_categorias', JSON.stringify(categories));
  localStorage.setItem('app_lancamentos', JSON.stringify(entries));
  localStorage.setItem('app_profissionais', JSON.stringify(profissionais));
  localStorage.setItem('app_nextId', JSON.stringify(nextId));
}



const categories = JSON.parse(localStorage.getItem('app_categorias')) || [];
const entries = JSON.parse(localStorage.getItem('app_lancamentos')) || [];
const profissionais = JSON.parse(localStorage.getItem('app_profissionais')) || [];
let nextId = Number(localStorage.getItem('app_nextId')) || 1;

let filters = { categoria: 'todas', profissional: 'todos' };
let addingCatId = null;
let editingCatId = null;

const currency = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = iso => { 
  if (!iso) return '';
  const [y, m, d] = iso.split('-'); 
  return `${d}/${m}`; 
};



const escapeHtml = s => String(s).replace(/[&<>"']/g, ch => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));

const tintOf = c => `color-mix(in srgb, ${c} 12%, white)`;




function firstGrapheme(str) {
  const s = (str || '').trim();
  if (!s) return '🛒';
  if (window.Intl && Intl.Segmenter) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s);
    return seg[Symbol.iterator]().next().value.segment;
  }
  return Array.from(s)[0];
}

const catSelect = document.getElementById('fCategoria');

function rebuildCategoryOptions() {
  const current = filters.categoria;
  catSelect.innerHTML = '<option value="todas">Todas categorias</option>';
>>>>>>> 6fb2871
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    catSelect.appendChild(opt);
  });
<<<<<<< HEAD

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
                    <td><button class="remove-btn" data-id="${e.id}" title="Remover">Remover</button></td>
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

  // Adição de Produtos
  const addProduct = document.getElementById("addProduct");
  const closePopup = document.getElementById("closePopup");
  const cancelPopup = document.getElementById("cancelPopup");
  const modal = document.getElementById("productModal");
  const form = document.getElementById("productForm");

  addProduct.addEventListener('click', () => {
    productModal.style.display = "flex";
  });

  closePopup.addEventListener('click', () => {
    productModal.style.display = "none";
  });

  cancelPopup.addEventListener('click', () => {
    productModal.style.display = "none";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("productName").value.trim();
    const price = Number(
      document.getElementById("productPrice").value
  );
   if (!name || !Number.isFinite(price) || price < 0) {
    alert("Please enter a valid product name and price.");
    return;
  }

  const product = document.createElement("div");
  const color = "#" + 
    Math.floor(Math.random() * 16777216)
    .toString(16)
    .padStart(6, "0");
  product.className = "item-card";
  product.style.background = color;

  const productName = document.createElement("strong");
  productName.innerHTML = ` 
    <div class="item-header">
      <div class="title">${name} — ${price.toLocaleString("pt-BR", {style: "currency",currency: "BRL"})}/un</div>
      <div class="right">
        <span class="pending-pill">${currency(999)} a pagar</span>
        <button class="add-btn">+ Add</button>
      </div>
    </div>`;


  product.append(productName);
  board.appendChild(product);

  form.reset();
  modal.style.display = "none";
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

const alternarModoEscuro = document.getElementById('alternarModoEscuro');
=======
  const stillExists = current === 'todas' || categories.some(c => c.id === current);
  filters.categoria = stillExists ? current : 'todas';
  catSelect.value = filters.categoria;
}
rebuildCategoryOptions();

const profFilterSelect = document.getElementById('fProfissional');
const profDatalist = document.getElementById('profList');

// Atualiza tanto o filtro do topo quanto o autocompletar (datalist) do formulário
function rebuildProfissionalOptions() {
  const currentFilter = filters.profissional;

  profFilterSelect.innerHTML = '<option value="todos">Todos profissionais</option>';
  profDatalist.innerHTML = '';

  profissionais.forEach(p => {
    // Opção para o filtro topo
    const optFilter = document.createElement('option');
    optFilter.value = p;
    optFilter.textContent = p;
    profFilterSelect.appendChild(optFilter);

    // Opção para a lista de autocompletar do campo de texto
    const optData = document.createElement('option');
    optData.value = p;
    profDatalist.appendChild(optData);
  });

  const stillExists = currentFilter === 'todos' || profissionais.includes(currentFilter);
  filters.profissional = stillExists ? currentFilter : 'todos';
  profFilterSelect.value = filters.profissional;
}
rebuildProfissionalOptions();

catSelect.addEventListener('change', () => { filters.categoria = catSelect.value; render(); });
profFilterSelect.addEventListener('change', () => { filters.profissional = profFilterSelect.value; render(); });

function visibleEntries(catId) {
  return entries.filter(e =>
    e.cat === catId &&
    (filters.profissional === 'todos' || e.prof === filters.profissional)
  );
}

function render() {
  const board = document.getElementById('board');
  const cats = categories.filter(c => filters.categoria === 'todas' || c.id === filters.categoria);

  if (!cats.length) {
    board.innerHTML = `<div class="empty-msg">Nenhuma categoria cadastrada. Clique em "Adicionar Produto" para criar uma.</div>`;
    updateSummary();
    return;
  }

  board.innerHTML = cats.map(cat => {
    const rows = visibleEntries(cat.id);
    const total = rows.reduce((s, e) => s + e.valor, 0);
    const pendente = rows.filter(e => e.status === 'pendente').reduce((s, e) => s + e.valor, 0);
    const color = cat.color || '#2f5fd8';

    return `
      <div class="item-card custom ${cat.collapsed ? 'collapsed' : ''}"
           style="--strong:${color};--tint:${tintOf(color)}">
        <div class="item-header">
          <div class="header-left">
            <div class="title">${escapeHtml(cat.icon)} ${escapeHtml(cat.name)} — ${currency(cat.unitPrice)}/un</div>
            <div class="cat-actions">
              <button class="mini-act edit-cat" data-cat="${cat.id}" title="Editar categoria" type="button">✎ Editar</button>
              <button class="mini-act delete-cat" data-cat="${cat.id}" title="Excluir categoria" type="button">🗑 Excluir</button>
            </div>
          </div>
          <div class="right">
            <span class="pending-pill">${currency(pendente)} a pagar</span>
            <button class="add-btn" data-cat="${cat.id}">+ Add</button>
            <button class="icon-act toggle-cat" data-cat="${cat.id}" title="${cat.collapsed ? 'Expandir' : 'Minimizar'}" type="button"><span class="chev">▾</span></button>
          </div>
        </div>
        ${cat.collapsed ? '' : (rows.length ? `
          <div class="table-scroll">
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
                  <td><button class="remove-btn" data-id="${e.id}" title="Remover">Remover</button></td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td>${currency(total)}</td>
                <td colspan="2" class="pend-label">${currency(pendente)} pend.</td>
              </tr>
            </tbody>
          </table>
          </div>
        ` : `<div class="empty-msg">Nenhum lançamento para este filtro.</div>`)}
      </div>
    `;
  }).join('');

  updateSummary();
}

function updateSummary() {
  const rows = entries.filter(e => filters.profissional === 'todos' || e.prof === filters.profissional);
  const total = rows.reduce((s, e) => s + e.valor, 0);
  const quitado = rows.filter(e => e.status === 'pago').reduce((s, e) => s + e.valor, 0);
  const aquitar = rows.filter(e => e.status === 'pendente').reduce((s, e) => s + e.valor, 0);

  document.getElementById('sumTotal').textContent = currency(total);
  document.getElementById('sumQuitado').textContent = currency(quitado);
  document.getElementById('sumAquitar').textContent = currency(aquitar);
}

document.getElementById('board').addEventListener('click', async e => {
  const addBtn = e.target.closest('.add-btn');
  const statusBtn = e.target.closest('.status-badge');
  const removeBtn = e.target.closest('.remove-btn');
  const editCatBtn = e.target.closest('.edit-cat');
  const deleteCatBtn = e.target.closest('.delete-cat');
  const toggleCatBtn = e.target.closest('.toggle-cat');

  if (addBtn) {
    openAddModal(addBtn.dataset.cat);
    return;
  }

  if (editCatBtn) {
    openProductModal(editCatBtn.dataset.cat);
    return;
  }

  if (toggleCatBtn) {
    const cat = categories.find(c => c.id === toggleCatBtn.dataset.cat);
    if (cat) {
      cat.collapsed = !cat.collapsed;
      salvarDados();
      render();
    }
    return;
  }

  if (deleteCatBtn) {
    const catId = deleteCatBtn.dataset.cat;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const qtdLanc = entries.filter(x => x.cat === catId).length;
    const aviso = qtdLanc
      ? `Tem certeza que deseja excluir a categoria "${cat.name}"? ${qtdLanc} lançamento(s) dela também serão removidos.`
      : `Tem certeza que deseja excluir a categoria "${cat.name}"?`;
    const ok = await askConfirm({ title: 'Excluir categoria', message: aviso });
    if (!ok) return;

    categories.splice(categories.indexOf(cat), 1);
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].cat === catId) entries.splice(i, 1);
    }
    salvarDados();
    rebuildCategoryOptions();
    render();
    return;
  }

  if (statusBtn) {
    const entry = entries.find(x => x.id === Number(statusBtn.dataset.id));
    if (entry) entry.status = entry.status === 'pago' ? 'pendente' : 'pago';
    salvarDados();
    render();
    return;
  }

  if (removeBtn) {
    const id = Number(removeBtn.dataset.id);
    const idx = entries.findIndex(x => x.id === id);
    if (idx !== -1) {
      entries.splice(idx, 1);
      salvarDados();
      render();
    }
  }
});

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const addForm = document.getElementById('addForm');
const profInput = document.getElementById('f-prof');
const valorInput = document.getElementById('f-valor');
const qtdInput = document.getElementById('f-qtd');
const valorHint = document.getElementById('f-valor-hint');

function openAddModal(catId) {
  addingCatId = catId;
  const cat = categories.find(c => c.id === catId);
  modalTitle.textContent = `Adicionar consumo — ${cat.name}`;
  valorHint.textContent = `Preço de referência: ${currency(cat.unitPrice)}/un`;
  qtdInput.value = 1;
  valorInput.value = cat.unitPrice.toFixed(2);
  profInput.value = '';
  
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('f-data').value = hoje;
  modalOverlay.classList.add('open');
  profInput.focus();
}

function closeModal() {
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

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (confirmModal.classList.contains('open')) { closeConfirm(false); return; }
  if (modalOverlay.classList.contains('open')) closeModal();
  if (productModal.classList.contains('open')) closeProductModal();
});

addForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!addingCatId) return;

  const profNome = profInput.value.trim();
  if (!profNome) {
    alert('Digite o nome do profissional.');
    return;
  }

  // Se for um novo profissional, adiciona à lista para reutilização futura
  if (!profissionais.includes(profNome)) {
    profissionais.push(profNome);
    rebuildProfissionalOptions();
  }

  const hoje = new Date().toISOString().split('T')[0];

  entries.push({
    id: nextId++,
    cat: addingCatId,
    prof: profNome,
    qtd: parseInt(qtdInput.value, 10) || 1,
    data: document.getElementById('f-data').value || hoje,
    valor: parseFloat(valorInput.value) || 0,
    status: 'pendente',
  });

  salvarDados();
  closeModal();
  render();
});

const addProduct = document.getElementById('addProduct');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const productModalTitle = document.getElementById('productModalTitle');
const productSubmit = document.getElementById('productSubmit');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const productEmojiInput = document.getElementById('productEmoji');
const productColorInput = document.getElementById('productColor');

function openProductModal(catId) {
  editingCatId = typeof catId === 'string' ? catId : null;
  const cat = editingCatId ? categories.find(c => c.id === editingCatId) : null;

  if (cat) {
    productModalTitle.textContent = 'Editar Categoria';
    productSubmit.textContent = 'Salvar';
    productNameInput.value = cat.name;
    productPriceInput.value = cat.unitPrice;
    productEmojiInput.value = cat.icon;
    productColorInput.value = cat.color || '#2f5fd8';
  } else {
    editingCatId = null;
    productModalTitle.textContent = 'Adicionar Produto';
    productSubmit.textContent = 'Confirmar';
    productForm.reset();
    productEmojiInput.value = '🛒';
    productColorInput.value = '#2f5fd8';
  }
  productModal.classList.add('open');
}

function closeProductModal() {
  productModal.classList.remove('open');
  productForm.reset();
  editingCatId = null;
}

addProduct.addEventListener('click', () => openProductModal());
document.getElementById('closePopup').addEventListener('click', closeProductModal);
document.getElementById('cancelPopup').addEventListener('click', closeProductModal);
productModal.addEventListener('click', e => { if (e.target === productModal) closeProductModal(); });

document.getElementById('emojiPresets').addEventListener('click', e => {
  const chip = e.target.closest('.emoji-chip');
  if (chip) productEmojiInput.value = chip.dataset.emoji;
});

productForm.addEventListener('submit', e => {
  e.preventDefault();

  const name = productNameInput.value.trim();
  const price = Number(productPriceInput.value);

  if (!name || !Number.isFinite(price) || price <= 0) {
    alert('Digite um nome e um preço válidos.');
    return;
  }

  const icon = firstGrapheme(productEmojiInput.value);
  const color = productColorInput.value;

  if (editingCatId) {
    const cat = categories.find(c => c.id === editingCatId);
    if (cat) {
      cat.name = name;
      cat.unitPrice = price;
      cat.icon = icon;
      cat.color = color;
    }
  } else {
    categories.push({
      id: 'custom-' + Date.now(),
      name,
      icon,
      unitPrice: price,
      color,
      collapsed: false,
    });
  }

  salvarDados();
  rebuildCategoryOptions();
  closeProductModal();
  render();
});

const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOk = document.getElementById('confirmOk');
const confirmCancel = document.getElementById('confirmCancel');
let confirmResolve = null;

function askConfirm({ title, message, okLabel = 'Excluir', info = false }) {
  return new Promise(resolve => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOk.textContent = okLabel;
    confirmOk.className = info ? 'btn btn-primary' : 'btn btn-danger';
    confirmCancel.style.display = info ? 'none' : '';
    confirmResolve = resolve;
    confirmModal.classList.add('open');
    confirmOk.focus();
  });
}

function closeConfirm(result) {
  confirmModal.classList.remove('open');
  if (confirmResolve) {
    const resolve = confirmResolve;
    confirmResolve = null;
    resolve(result);
  }
}

confirmOk.addEventListener('click', () => closeConfirm(true));
confirmCancel.addEventListener('click', () => closeConfirm(false));
document.getElementById('confirmClose').addEventListener('click', () => closeConfirm(false));
confirmModal.addEventListener('click', e => { if (e.target === confirmModal) closeConfirm(false); });

document.getElementById('clearPaid').addEventListener('click', async () => {
  const qtdPagos = entries.filter(x => x.status === 'pago').length;

  if (!qtdPagos) {
    await askConfirm({
      title: 'Nada para limpar',
      message: 'Não há conveniências com status pago.',
      okLabel: 'OK',
      info: true,
    });
    return;
  }

  const ok = await askConfirm({
    title: 'Limpar pagos',
    message: `Tem certeza que deseja excluir ${qtdPagos} conveniência(s) com status pago, de todas as categorias? Essa ação não pode ser desfeita.`,
  });
  if (!ok) return;

  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].status === 'pago') entries.splice(i, 1);
  }
  salvarDados();
  render();
});

const alternarModoEscuro = document.getElementById('alternarModoEscuro');
const textoTema = document.getElementById('textoModoEscuro');

const modoEscuroSalvo = localStorage.getItem('app_modo_escuro') === 'true';
if (modoEscuroSalvo) {
  document.body.classList.add('dark-preview');
  if (textoTema) textoTema.textContent = 'Modo Claro';
}

>>>>>>> 6fb2871
if (alternarModoEscuro) {
  alternarModoEscuro.addEventListener('click', () => {
    document.body.classList.toggle('dark-preview');
    const estaEscuro = document.body.classList.contains('dark-preview');
<<<<<<< HEAD
    
    const textoTema = document.getElementById('textoModoEscuro');
=======
    localStorage.setItem('app_modo_escuro', estaEscuro);

>>>>>>> 6fb2871
    if (textoTema) {
      textoTema.textContent = estaEscuro ? 'Modo Claro' : 'Modo Escuro';
    }
  });
}

<<<<<<< HEAD
  render();
=======
render();
>>>>>>> 6fb2871
