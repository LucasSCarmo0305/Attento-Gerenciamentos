const formCadastro = document.getElementById('formCadastro');
const campoMensagem = document.getElementById('mensagem');
const campoCpf = document.getElementById('cpf');

function mostrarMensagem(texto) {
    campoMensagem.textContent = texto;
    campoMensagem.hidden = !texto;
}

campoCpf.addEventListener('input', function () {
    const d = campoCpf.value.replace(/\D/g, '').slice(0, 11);
    let t = d;
    if (d.length > 9) t = d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
    else if (d.length > 6) t = d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
    else if (d.length > 3) t = d.slice(0, 3) + '.' + d.slice(3);
    campoCpf.value = t;
});

formCadastro.addEventListener('submit', async function (e) {
    e.preventDefault();
    const botao = document.getElementById('botaoCadastrar');

    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        cpf: campoCpf.value,
        senha: document.getElementById('senha').value,
        confirmacao: document.getElementById('confirmaSenha').value
    };

    if (!dados.nome.trim() || !dados.email.trim() || !dados.cpf || !dados.senha || !dados.confirmacao) {
        mostrarMensagem('Por favor, preencha todos os campos.');
        return;
    }

    botao.disabled = true;
    mostrarMensagem('');
    try {
        const resultado = await Auth.solicitarCadastro(dados);
        if (!resultado.ok) {
            mostrarMensagem(resultado.erro);
            return;
        }
        formCadastro.reset();
        document.getElementById('secaoForm').hidden = true;
        document.getElementById('rodapeLink').hidden = true;
        document.getElementById('secaoSucesso').hidden = false;
    } catch (erro) {
        console.error(erro);
        mostrarMensagem('Não foi possível enviar agora. Tente novamente.');
    } finally {
        botao.disabled = false;
    }
});
