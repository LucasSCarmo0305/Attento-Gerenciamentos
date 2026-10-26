document.addEventListener('DOMContentLoaded', () => {
  carregarFaturamentoDiario();
});

function carregarFaturamentoDiario() {

  const dados = localStorage.getItem('financeiro_data');
  const contas = dados ? JSON.parse(dados) : [];

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  const hojeISO = `${ano}-${mes}-${dia}`; 
  const hojeBR = `${dia}/${mes}/${ano}`;   

  let faturamentoHoje = 0;

  contas.forEach((c) => {
    const status = (c.status || '').toLowerCase().trim();
    const categoria = (c.categoria || c.cat || '').toLowerCase().trim();
    const vencimento = c.vencimento || c.data || '';
    const valor = parseFloat(c.valor || 0);


    if (status === 'pago' && categoria !== 'outros') {
      if (vencimento === hojeISO || vencimento === hojeBR) {
        faturamentoHoje += valor;
      }
    }
  });

  if (faturamentoHoje === 0 && contas.length > 0) {
    faturamentoHoje = contas.reduce((acc, c) => {
      const status = (c.status || '').toLowerCase().trim();
      const categoria = (c.categoria || c.cat || '').toLowerCase().trim();
      if (status === 'pago' && categoria !== 'outros') {
        return acc + parseFloat(c.valor || 0);
      }
      return acc;
    }, 0);
  }

  const elFaturamento = document.getElementById('dash-faturamento');
  if (elFaturamento) {
    elFaturamento.textContent = faturamentoHoje.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
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