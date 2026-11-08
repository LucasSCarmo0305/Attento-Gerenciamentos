function cadastrar(){


    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (email === "" || password === "" || confirmPassword === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    if (password !== confirmPassword) {
        alert("As senhas não coincidem.");
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || []; 


    const emailExistente = usuarios.some(user => user.email === email);

    if (emailExistente) {
        alert("Este email já está cadastrado.");
        return;
    }

    usuarios.push({ email, password });
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    alert("Cadastro realizado com sucesso!");
    window.location.href = "login.html";



}