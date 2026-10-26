function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    
    if (email === "" || password === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

   
    if (email === "admin@Email.com" && password === "admn123") {
        alert("Login realizado com sucesso!\nBem-vindo(a), Administrador!");
        window.location.href = "index.html";
        return;
    }

   
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];


    const usuarioEncontrado = usuarios.find(user => user.email === email && user.password === password);

    if (usuarioEncontrado) {
        alert("Login realizado com sucesso!\nBem-vindo(a), " + email + "!");
        window.location.href = "index.html";
    } else {
        alert("E-mail ou senha incorretos.");
    }
}