const formularioLogin = document.getElementById('loginForm');
const campoMensagem = document.getElementById('mensagem');
const botaoEntrar = document.getElementById('botaoEntrar');

function mostrarMensagem(texto) {
    campoMensagem.textContent = texto;
    campoMensagem.hidden = !texto;
}

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (email === '' || password === '') {
        mostrarMensagem('Por favor, preencha todos os campos.');
        return;
    }

    botaoEntrar.disabled = true;
    mostrarMensagem('');

    try {
        const resultado = await Auth.login(email, password);
        if (resultado.ok) {
            window.location.href = 'index.html';
            return;
        }
        mostrarMensagem(resultado.erro);
    } catch (erro) {
        console.error(erro);
        mostrarMensagem('Não foi possível entrar agora. Tente novamente.');
    } finally {
        botaoEntrar.disabled = false;
    }
}

formularioLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    login();
});
