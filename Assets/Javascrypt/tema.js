/*
 * Modo escuro compartilhado por todas as páginas internas.
 * - Lê a preferência salva (chave "modoEscuro")
 * - Aplica a classe "dark-preview" no <html> e no <body>
 * - Liga o botão #alternarModoEscuro e atualiza o texto do botão
 * Carregar no fim do <body>, antes do script da página.
 */
(function () {
  const CHAVE = 'modoEscuro';

  function lerPreferencia() {
    try { return localStorage.getItem(CHAVE) === 'true'; } catch (e) { return false; }
  }

  function salvarPreferencia(escuro) {
    try { localStorage.setItem(CHAVE, String(escuro)); } catch (e) { /* sem storage: ignora */ }
  }

  function aplicarTema(escuro) {
    document.documentElement.classList.toggle('dark-preview', escuro);
    document.body.classList.toggle('dark-preview', escuro);

    const texto = document.getElementById('textoModoEscuro');
    if (texto) texto.textContent = escuro ? 'Modo Claro' : 'Modo Escuro';

    const botao = document.getElementById('alternarModoEscuro');
    if (botao) botao.setAttribute('aria-pressed', String(escuro));
  }

  aplicarTema(lerPreferencia());

  const botao = document.getElementById('alternarModoEscuro');
  if (botao) {
    botao.addEventListener('click', function () {
      const escuro = !document.body.classList.contains('dark-preview');
      aplicarTema(escuro);
      salvarPreferencia(escuro);
    });
  }

  // mantém várias abas abertas sincronizadas
  window.addEventListener('storage', function (e) {
    if (e.key === CHAVE) aplicarTema(e.newValue === 'true');
  });
})();
