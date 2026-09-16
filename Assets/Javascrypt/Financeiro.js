const colors = ['#7c8ff0', '#f2a65a', '#3fbf8f', '#e8707d', '#a68cf0', '#f06d9a', '#4fc3d9', '#f0a94f'];

let accounts = JSON.parse(localStorage.getItem('financeiro_data')) || [];

const currency = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
}


function colorFor(initials) {
  let h = 0;
  for (const c of initials) h += c.charCodeAt(0);
  return colors[h % colors.length];
}

// Atualiza cards de totalizador
function updateSummary() {
  const total = accounts.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const recebido = accounts.filter(a => a.status === 'pago').reduce((acc, curr) => acc + Number(curr.valor), 0);

  document.getElementById('totalFaturado').innerText = currency(total);
  document.getElementById('totalRecebido').innerText = currency(recebido);
}

// Renderiza a tabela de acordo com o filtro ativo
function renderTable(filter) {
  const body = document.getElementById('tableBody');
  const rows = accounts.filter(a => filter === 'todos' || a.status === filter);

  if (!rows.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="6" style="text-align: center; padding: 20px;">Nenhuma conta encontrada.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((a) => {

    const realIndex = accounts.indexOf(a);

    return `
      <tr>
        <td>
          <div class="prof-cell" style="display:flex; align-items:center; gap:10px;">
            <div class="prof-avatar" style="background:${colorFor(a.initials)}; width:35px; height:35px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:white; font-weight:bold;">${a.initials}</div>
            <div>
              <div class="prof-name" style="font-weight:bold;">${a.name}</div>
              <div class="prof-spec" style="font-size:12px; color:#888;">${a.spec}</div>
            </div>
          </div>
        </td>
        <td class="desc">${a.desc}</td>
        <td><span class="badge ${a.cat}" style="padding:4px 8px; border-radius:4px; background:#eee; font-size:12px;">${a.cat === 'locacao' ? 'Locação' : 'Convênio'}</span></td>
        <td class="valor">${currency(a.valor)}</td>
        <td><span class="status ${a.status}" style="padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold; ${a.status === 'pago' ? 'color:green;' : a.status === 'pendente' ? 'color:orange;' : 'color:red;'}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span></td>
        <td><button onclick="deleteAccount(${realIndex})" style="background:transparent; border:none; color:red; cursor:pointer;" title="Excluir">🗑️</button></td>
      </tr>
    `;
  }).join('');
}

// Excluir registro
window.deleteAccount = function(index) {
  if (confirm("Tem certeza que deseja excluir este registro?")) {
    accounts.splice(index, 1);
    saveAndRender();
  }
};

// Salva e atualiza visual
function saveAndRender() {
  localStorage.setItem('financeiro_data', JSON.stringify(accounts));
  updateSummary();
  const activeTab = document.querySelector('.tab.active');
  const activeFilter = activeTab ? activeTab.dataset.filter : 'todos';
  renderTable(activeFilter);
}

// Filtro pelas abas 
document.getElementById('tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderTable(btn.dataset.filter);
});

// Exportar CSV
document.getElementById('exportBtn').addEventListener('click', () => {
  if (!accounts.length) return alert('Nenhum dado para exportar.');
  
  const header = 'Profissional,Especialidade,Descrição,Categoria,Valor,Status\n';
  const rows = accounts.map(a =>
    `"${a.name}","${a.spec}","${a.desc}","${a.cat === 'locacao' ? 'Locação' : 'Convênio'}",${a.valor},"${a.status}"`
  ).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'financeiro.csv';
  link.click();
  URL.revokeObjectURL(url);
});


const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addForm');

document.getElementById('addBtn').addEventListener('click', () => {
  addModal.style.display = 'flex';
});

document.getElementById('closeModal').addEventListener('click', () => {
  addModal.style.display = 'none';
  addForm.reset();
});


addForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const nome = document.getElementById('nomeProfissional').value;

  const novaConta = {
    initials: getInitials(nome),
    name: nome,
    spec: document.getElementById('especialidade').value,
    desc: document.getElementById('descricao').value,
    cat: document.getElementById('categoria').value,
    valor: parseFloat(document.getElementById('valor').value),
    status: document.getElementById('status').value
  };

  accounts.push(novaConta);
  saveAndRender();

  addModal.style.display = 'none';
  addForm.reset();
});


const darkToggle = document.getElementById('darkToggle');
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-preview');
  darkToggle.textContent = document.body.classList.contains('dark-preview') ? '☀️' : '🌙';
});


updateSummary();
renderTable('todos');