/*
 * Attento · autenticação e perfis de acesso
 *
 * Papéis:   "admin" (aprova cadastros e gerencia funcionários) e "funcionario".
 * Status:   "aguardando" (pediu cadastro, espera o admin aprovar),
 *           "recusado"   (pedido recusado pelo admin),
 *           "ativo" e "inativo".
 *
 * Uso nas páginas (no <head>, antes de qualquer outro script):
 *   <script src="../Assets/Javascrypt/auth.js" data-acesso="logado"></script>
 *   data-acesso="logado"  → exige sessão
 *   data-acesso="admin"   → exige sessão de administrador
 *   (sem atributo)        → página pública (login, cadastro)
 *
 * ATENÇÃO: tudo fica no navegador (localStorage). Isto organiza as telas,
 * mas NÃO é segurança real: quem abrir o console consegue alterar os dados.
 * Para uso com dados reais, a validação precisa ser feita num servidor.
 */
(function () {
  'use strict';

  const CHAVE_USUARIOS = 'usuarios';
  const CHAVE_SESSAO = 'attento_sessao';
  const CHAVE_BLOQUEIOS = 'attento_bloqueios';

  const MAX_TENTATIVAS = 5;
  const BLOQUEIO_MS = 5 * 60 * 1000;
  const SENHA_MINIMA = 8;

  // Admin inicial (README: credenciais de demonstração). Troque antes de usar de verdade.
  const ADMIN_SEMENTE = { nome: 'Administrador', email: 'admin@email.com', senha: 'admin123' };

  const scriptAtual = document.currentScript;
  const acesso = scriptAtual && scriptAtual.dataset ? scriptAtual.dataset.acesso : '';

  // ---------- armazenamento ----------
  function lerJSON(armazenamento, chave, padrao) {
    try {
      const bruto = armazenamento.getItem(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch (e) {
      return padrao;
    }
  }

  function lerUsuarios() {
    const lista = lerJSON(localStorage, CHAVE_USUARIOS, []);
    return Array.isArray(lista) ? lista : [];
  }

  function salvarUsuarios(lista) {
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
  }

  function lerSessao() {
    return lerJSON(sessionStorage, CHAVE_SESSAO, null);
  }

  // ---------- utilitários ----------
  const enc = new TextEncoder();

  function paraBase64(buffer) {
    let texto = '';
    new Uint8Array(buffer).forEach(function (b) { texto += String.fromCharCode(b); });
    return btoa(texto);
  }

  function deBase64(texto) {
    return Uint8Array.from(atob(texto), function (c) { return c.charCodeAt(0); });
  }

  function cryptoDisponivel() {
    return !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
  }

  async function derivar(texto, saltBase64) {
    const salt = saltBase64 ? deBase64(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
    const chave = await crypto.subtle.importKey('raw', enc.encode(texto), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
      chave,
      256
    );
    return { hash: paraBase64(bits), salt: paraBase64(salt) };
  }

  function novoId() {
    const r = crypto.getRandomValues(new Uint8Array(8));
    return Array.from(r, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function normalizarEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function somenteDigitos(texto) {
    return String(texto || '').replace(/\D/g, '');
  }

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Por enquanto só confere o formato (11 números). A conferência dos dígitos
  // verificadores foi retirada para facilitar testes; ver README.
  function cpfComFormatoValido(cpf) {
    return cpf.length === 11;
  }

  function mascararCpf(cpf) {
    if (!cpf || cpf.length !== 11) return '—';
    return '***.' + cpf.slice(3, 6) + '.' + cpf.slice(6, 9) + '-**';
  }

  function nomeDoEmail(email) {
    const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Usuário';
  }

  function iniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '--';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  function rotuloPapel(papel) {
    return papel === 'admin' ? 'Administrador' : 'Funcionário';
  }

  // ---------- limites de tentativas (simbólicos: estão no navegador) ----------
  function lerBloqueios() {
    return lerJSON(localStorage, CHAVE_BLOQUEIOS, {});
  }

  function minutosBloqueado(chave) {
    const b = lerBloqueios()[chave];
    if (b && b.ate && b.ate > Date.now()) return Math.ceil((b.ate - Date.now()) / 60000);
    return 0;
  }

  function registrarFalha(chave) {
    const todos = lerBloqueios();
    const b = todos[chave] || { n: 0, ate: 0 };
    if (b.ate && b.ate <= Date.now()) { b.n = 0; b.ate = 0; }
    b.n += 1;
    if (b.n >= MAX_TENTATIVAS) { b.ate = Date.now() + BLOQUEIO_MS; b.n = 0; }
    todos[chave] = b;
    localStorage.setItem(CHAVE_BLOQUEIOS, JSON.stringify(todos));
  }

  function limparFalhas(chave) {
    const todos = lerBloqueios();
    if (todos[chave]) {
      delete todos[chave];
      localStorage.setItem(CHAVE_BLOQUEIOS, JSON.stringify(todos));
    }
  }

  // No máximo `max` envios a cada `janelaMs`. Devolve os minutos de espera quando
  // estourou; senão registra o envio e devolve 0.
  function limiteJanela(chave, max, janelaMs) {
    const todos = lerBloqueios();
    const agora = Date.now();
    const recentes = (Array.isArray(todos[chave]) ? todos[chave] : []).filter(function (t) { return agora - t < janelaMs; });
    if (recentes.length >= max) {
      return Math.max(1, Math.ceil((janelaMs - (agora - recentes[0])) / 60000));
    }
    recentes.push(agora);
    todos[chave] = recentes;
    localStorage.setItem(CHAVE_BLOQUEIOS, JSON.stringify(todos));
    return 0;
  }

  // ---------- visão pública do usuário (sem hashes) ----------
  function publico(u) {
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      cpfMascarado: mascararCpf(u.cpf),
      papel: u.papel,
      status: u.status,
      criadoEm: u.criadoEm
    };
  }

  // ---------- migração e admin inicial ----------
  async function iniciar() {
    if (!cryptoDisponivel()) return;

    const antigos = lerUsuarios();
    const resultado = [];
    let mudou = false;

    for (const u of antigos) {
      if (u && u.status) { resultado.push(u); continue; } // já no formato novo
      mudou = true;
      const email = normalizarEmail(u && u.email);
      const senhaAntiga = u && u.password ? String(u.password) : '';
      if (!email || !senhaAntiga) continue;               // registro inválido: descarta
      const h = await derivar(senhaAntiga);
      resultado.push({
        id: novoId(), nome: nomeDoEmail(email), email: email, cpf: '',
        papel: 'funcionario', status: 'ativo',
        senhaHash: h.hash, salt: h.salt,
        criadoEm: Date.now()
      });
    }

    if (!resultado.some(function (u) { return u.papel === 'admin'; })) {
      const h = await derivar(ADMIN_SEMENTE.senha);
      const admin = {
        id: novoId(), nome: ADMIN_SEMENTE.nome, email: ADMIN_SEMENTE.email, cpf: '',
        papel: 'admin', status: 'ativo',
        senhaHash: h.hash, salt: h.salt,
        criadoEm: Date.now()
      };
      // se alguém já usava o e-mail reservado ao admin, esse registro dá lugar ao admin
      const indice = resultado.findIndex(function (u) { return u.email === admin.email; });
      if (indice >= 0) resultado[indice] = admin; else resultado.push(admin);
      mudou = true;
    }

    if (mudou) salvarUsuarios(resultado);
  }

  const pronto = iniciar().catch(function (erro) {
    console.error('Attento: falha ao preparar usuários', erro);
  });

  // ---------- sessão ----------
  function sessao() {
    return lerSessao();
  }

  function sair() {
    sessionStorage.removeItem(CHAVE_SESSAO);
  }

  async function login(email, senha) {
    await pronto;
    if (!cryptoDisponivel()) {
      return { ok: false, erro: 'Este navegador bloqueou a criptografia. Abra o sistema por http://localhost ou HTTPS.' };
    }
    email = normalizarEmail(email);
    const chave = 'login:' + email;
    const minutos = minutosBloqueado(chave);
    if (minutos) {
      return { ok: false, erro: 'Muitas tentativas. Tente de novo em ' + minutos + ' min.' };
    }

    const u = lerUsuarios().find(function (x) { return x.email === email; });
    let confere = false;
    if (u && u.senhaHash) {
      const h = await derivar(String(senha), u.salt);
      confere = h.hash === u.senhaHash;
    } else {
      await derivar(String(senha)); // mantém o tempo de resposta parecido
    }

    if (!confere) {
      registrarFalha(chave);
      return { ok: false, erro: 'E-mail ou senha incorretos.' };
    }
    if (u.status === 'aguardando') {
      return { ok: false, erro: 'Seu cadastro está aguardando a aprovação do administrador.' };
    }
    if (u.status === 'recusado') {
      return { ok: false, erro: 'Seu pedido de cadastro não foi aprovado. Fale com o administrador.' };
    }
    if (u.status === 'inativo') {
      return { ok: false, erro: 'Acesso desativado. Fale com o administrador.' };
    }
    if (u.status !== 'ativo') {
      return { ok: false, erro: 'E-mail ou senha incorretos.' };
    }

    limparFalhas(chave);
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({
      id: u.id, nome: u.nome, email: u.email, papel: u.papel
    }));
    return { ok: true, usuario: publico(u) };
  }

  // ---------- cadastro por conta própria (espera aprovação do admin) ----------
  async function solicitarCadastro(dados) {
    await pronto;
    if (!cryptoDisponivel()) {
      return { ok: false, erro: 'Este navegador bloqueou a criptografia. Abra o sistema por http://localhost ou HTTPS.' };
    }

    const nome = String(dados.nome || '').trim().replace(/\s+/g, ' ');
    const email = normalizarEmail(dados.email);
    const cpf = somenteDigitos(dados.cpf);
    const senha = String(dados.senha || '');

    if (nome.length < 3) return { ok: false, erro: 'Informe o nome completo.' };
    if (!emailValido(email)) return { ok: false, erro: 'E-mail inválido.' };
    if (!cpfComFormatoValido(cpf)) return { ok: false, erro: 'O CPF precisa ter 11 números.' };
    if (senha.length < SENHA_MINIMA) return { ok: false, erro: 'A senha precisa ter ao menos ' + SENHA_MINIMA + ' caracteres.' };
    if (senha !== dados.confirmacao) return { ok: false, erro: 'As senhas não coincidem.' };
    if (normalizarEmail(senha) === email) return { ok: false, erro: 'A senha não pode ser igual ao e-mail.' };

    const espera = limiteJanela('cadastro', 5, 10 * 60 * 1000);
    if (espera) return { ok: false, erro: 'Muitos pedidos seguidos. Tente de novo em ' + espera + ' min.' };

    // Resposta idêntica exista ou não cadastro com estes dados: o formulário
    // não pode servir para descobrir quais e-mails/CPFs já estão no sistema.
    const usuarios = lerUsuarios();
    const jaExiste = usuarios.some(function (u) { return u.email === email || (u.cpf && u.cpf === cpf); });
    if (jaExiste) {
      await derivar(senha); // mantém o tempo de resposta parecido
      return { ok: true };
    }

    const h = await derivar(senha);
    usuarios.push({
      id: novoId(), nome: nome, email: email, cpf: cpf,
      papel: 'funcionario', status: 'aguardando',
      senhaHash: h.hash, salt: h.salt,
      criadoEm: Date.now()
    });
    salvarUsuarios(usuarios);
    return { ok: true };
  }

  // ---------- administração (somente admin) ----------
  function exigirAdmin() {
    const s = lerSessao();
    const u = s && lerUsuarios().find(function (x) { return x.id === s.id; });
    return u && u.papel === 'admin' && u.status === 'ativo' ? u : null;
  }

  const SEM_PERMISSAO = { ok: false, erro: 'Sem permissão para esta ação.' };

  function listarUsuarios() {
    if (!exigirAdmin()) return [];
    return lerUsuarios().map(publico);
  }

  function pedidosAguardando() {
    if (!exigirAdmin()) return 0;
    return lerUsuarios().filter(function (u) { return u.status === 'aguardando'; }).length;
  }

  async function aprovarCadastro(id) {
    await pronto;
    if (!exigirAdmin()) return SEM_PERMISSAO;
    const usuarios = lerUsuarios();
    const u = usuarios.find(function (x) { return x.id === id; });
    if (!u || u.papel !== 'funcionario' || (u.status !== 'aguardando' && u.status !== 'recusado')) {
      return { ok: false, erro: 'Este pedido não está mais disponível para aprovação.' };
    }
    u.status = 'ativo';
    salvarUsuarios(usuarios);
    return { ok: true, usuario: publico(u) };
  }

  async function recusarCadastro(id) {
    await pronto;
    if (!exigirAdmin()) return SEM_PERMISSAO;
    const usuarios = lerUsuarios();
    const u = usuarios.find(function (x) { return x.id === id; });
    if (!u || u.papel !== 'funcionario' || u.status !== 'aguardando') {
      return { ok: false, erro: 'Só é possível recusar um pedido que está aguardando.' };
    }
    u.status = 'recusado';
    salvarUsuarios(usuarios);
    return { ok: true, usuario: publico(u) };
  }

  // Remove um pedido recusado (libera o e-mail e o CPF para um novo pedido).
  async function excluirPedido(id) {
    await pronto;
    if (!exigirAdmin()) return SEM_PERMISSAO;
    const usuarios = lerUsuarios();
    const indice = usuarios.findIndex(function (x) { return x.id === id; });
    const u = usuarios[indice];
    if (!u || u.papel !== 'funcionario' || u.status !== 'recusado') {
      return { ok: false, erro: 'Só é possível excluir um pedido recusado.' };
    }
    usuarios.splice(indice, 1);
    salvarUsuarios(usuarios);
    return { ok: true };
  }

  async function alterarAtivo(id, ativo) {
    await pronto;
    const admin = exigirAdmin();
    if (!admin) return SEM_PERMISSAO;
    const usuarios = lerUsuarios();
    const u = usuarios.find(function (x) { return x.id === id; });
    if (!u || u.papel !== 'funcionario') {
      return { ok: false, erro: 'Só é possível alterar funcionários.' };
    }
    if (u.id === admin.id) return { ok: false, erro: 'Você não pode desativar a si mesmo.' };
    if (u.status === 'aguardando' || u.status === 'recusado') {
      return { ok: false, erro: 'Para um pedido de cadastro, use Aprovar ou Recusar.' };
    }

    if (ativo) {
      if (u.status !== 'inativo') return { ok: true, usuario: publico(u) };
      u.status = 'ativo';
    } else {
      u.status = 'inativo';
    }
    salvarUsuarios(usuarios);
    return { ok: true, usuario: publico(u) };
  }

  // ---------- proteção de páginas ----------
  function proteger() {
    if (acesso !== 'logado' && acesso !== 'admin') return;
    const s = lerSessao();
    const u = s ? lerUsuarios().find(function (x) { return x.id === s.id; }) : null;

    if (!s || !u || u.status !== 'ativo') {
      sair();
      location.replace('login.html');
      return;
    }
    if (acesso === 'admin' && u.papel !== 'admin') {
      location.replace('index.html');
      return;
    }
    // mantém a sessão em dia com o cadastro
    if (s.papel !== u.papel || s.nome !== u.nome) {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({ id: u.id, nome: u.nome, email: u.email, papel: u.papel }));
    }
  }

  proteger();
  // voltar pelo histórico depois de "Sair" não deve mostrar a página em cache
  window.addEventListener('pageshow', function (e) { if (e.persisted) proteger(); });

  // ---------- preenchimento da interface ----------
  function preencherInterface() {
    const s = lerSessao();
    if (!s) return;

    document.querySelectorAll('[data-usuario-nome]').forEach(function (el) { el.textContent = s.nome; });
    document.querySelectorAll('[data-usuario-papel]').forEach(function (el) { el.textContent = rotuloPapel(s.papel); });
    document.querySelectorAll('[data-usuario-iniciais]').forEach(function (el) { el.textContent = iniciais(s.nome); });
    document.querySelectorAll('[data-papel="admin"]').forEach(function (el) { el.hidden = s.papel !== 'admin'; });

    const pedidos = pedidosAguardando();
    document.querySelectorAll('[data-papel="admin"]').forEach(function (el) {
      const antigo = el.querySelector('.nav-badge');
      if (antigo) antigo.remove();
      if (!pedidos) return;
      const selo = document.createElement('span');
      selo.className = 'nav-badge';
      selo.textContent = pedidos;
      selo.title = pedidos + (pedidos === 1 ? ' pedido de cadastro aguardando aprovação' : ' pedidos de cadastro aguardando aprovação');
      el.appendChild(selo);
    });

    document.querySelectorAll('[data-sair]').forEach(function (el) {
      el.addEventListener('click', sair); // a navegação do link segue normalmente
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preencherInterface);
  } else {
    preencherInterface();
  }

  window.Auth = {
    pronto: pronto,
    SENHA_MINIMA: SENHA_MINIMA,
    sessao: sessao,
    sair: sair,
    login: login,
    solicitarCadastro: solicitarCadastro,
    listarUsuarios: listarUsuarios,
    pedidosAguardando: pedidosAguardando,
    aprovarCadastro: aprovarCadastro,
    recusarCadastro: recusarCadastro,
    excluirPedido: excluirPedido,
    alterarAtivo: alterarAtivo,
    rotuloPapel: rotuloPapel
  };
})();
