# Attento Gerenciamentos

Sistema web de gestão para clínicas e consultórios de saúde multiprofissionais, desenvolvido para a **Attento – Saúde Integral**. A aplicação centraliza em um só lugar o controle de **salas**, o **financeiro** e as **conveniências** (café, água, impressão e outros consumíveis) usadas pelos profissionais.

O projeto é um front-end estático (HTML, CSS e JavaScript puro), sem back-end e sem dependências.

---

## Funcionalidades

- **Login com perfis de acesso:** dois papéis, **administrador** e **funcionário**. Todas as páginas internas exigem login; só o administrador vê e acessa **Gerenciar funcionários**.
- **Cadastro com aprovação:** o funcionário se cadastra sozinho (nome, e-mail, CPF e senha) e só consegue entrar depois que o administrador **aprova** o pedido.
- **Gerenciar funcionários (somente administrador):** aviso no topo e contador no menu quando há pedidos; **aprovar** ou **recusar** cada pedido; excluir pedidos recusados; **desativar** e **reativar** funcionários.
- **Visão geral (dashboard):** salas reservadas no dia, faturamento diário e itens consumidos.
- **Grade de salas:** disponibilidade e alocação por turno (Manhã 08-13h, Tarde 14-17h, Noite 18-21h) ou por hora (hora extra), separada entre as unidades **Attento Europa** e **Attento Horizonte**.
- **Financeiro:**
  - cadastro de contas por categoria (Locação, Recebíveis e Despesa);
  - filtros por status (Todos, Pendentes, Vencidos e Pagos);
  - ordenação por qualquer coluna;
  - indicadores de vencimento (vence hoje, vence em X dias, vencido há X dias);
  - totais de faturado, recebido e despesas;
  - exportação para **CSV** (compatível com Excel).
- **Conveniências:** lançamento de consumo por profissional e categorias, com cálculo automático do valor, alternância entre *pago* e *pendente* e totais de quitado e a quitar.
- **Modo escuro** disponível em todas as telas.

---

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (ES6+), sem frameworks ou bibliotecas
- `localStorage` para persistência de dados no navegador

---

## Estrutura do projeto

```
Attento-Gerenciamentos/
├── Assets/
│   ├── Css/
│   │   ├── conveniencias.css
│   │   ├── financeiro.css
│   │   ├── funcionarios.css
│   │   ├── index.css
│   │   ├── login.css
│   │   ├── publico.css          (tela de cadastro)
│   │   ├── salas.css
│   │   └── sidebar.css
│   ├── Javascrypt/
│   │   ├── auth.js              (usuários, papéis, sessão e aprovação de cadastros)
│   │   ├── cadastro.js
│   │   ├── conveniencias.js
│   │   ├── financeiro.js
│   │   ├── funcionarios.js
│   │   ├── Index.js
│   │   ├── login.js
│   │   ├── salas.js
│   │   └── tema.js              (modo escuro compartilhado)
│   └── imagens/
│       ├── Attento Logo.png
│       └── ImagenLogin.png
├── Pages/
│   ├── cadastro.html
│   ├── conveniencias.html
│   ├── financeiro.html
│   ├── funcionarios.html        (somente administrador)
│   ├── index.html
│   ├── login.html
│   └── salas.html
├── .gitignore
└── README.md
```

---

## Como executar

Não há instalação nem build. O projeto deve ser servido por um servidor local (`http://localhost`), e não aberto com duplo clique no HTML: a criptografia das senhas (`crypto.subtle`) só funciona em `localhost` ou HTTPS.

1. Baixe ou clone o repositório:

   ```bash
   git clone https://github.com/<seu-usuario>/Attento-Gerenciamentos.git
   cd Attento-Gerenciamentos
   ```

2. Inicie um servidor local na raiz do projeto. Escolha uma das opções:

   **VS Code + Live Server:** abra a pasta no VS Code, clique com o botão direito em `Pages/login.html` e escolha *Open with Live Server*.

   **Python:**

   ```bash
   python -m http.server 5500
   ```

   **Node.js:**

   ```bash
   npx serve .
   ```

3. Acesse no navegador (ajuste a porta conforme o servidor usado):

   ```
   http://localhost:5500/Pages/login.html
   ```

---

## Acesso e perfis

No primeiro carregamento o sistema cria o administrador de demonstração:

| Campo  | Valor             |
| ------ | ----------------- |
| E-mail | `admin@Email.com` |
| Senha  | `admin123`         |

Fluxo de um funcionário novo:

1. Na tela de login, ele usa **Cadastre-se** e informa nome, e-mail, CPF e a senha que quer usar.
2. O pedido fica **aguardando aprovação**. Se tentar entrar antes, o login avisa que o cadastro ainda não foi aprovado.
3. O administrador abre **Gerenciar funcionários > Pedidos de cadastro** e escolhe **Aprovar** ou **Recusar**. Depois de aprovado, o funcionário entra com o e-mail e a senha que ele mesmo escolheu.

Usuários que já existiam no formato antigo (`{ email, password }`) são migrados sozinhos para funcionários ativos, mantendo a mesma senha.

**Limitações conhecidas (por enquanto):**

- O **CPF** por enquanto só é conferido pelo formato (11 números); os dígitos verificadores **não** são validados, para facilitar testes.
- Por enquanto não há recuperação de senha: quem esquecer a senha precisa de outra solução (ex.: o admin excluir o cadastro e a pessoa pedir de novo).

> **Atenção:** as senhas ficam guardadas com hash (PBKDF2), mas tudo roda no navegador, em `localStorage`. Isso organiza as telas e os perfis, **não é segurança de verdade**: quem abrir o console do navegador consegue alterar papéis e dados, e cada navegador tem a sua própria lista de usuários (um pedido de cadastro feito em um computador não aparece no navegador do administrador em outro). As credenciais de teste estão no código-fonte (`auth.js`). Para uso com dados reais é necessário um back-end que valide login, papéis e aprovações.

---

## Persistência de dados

| Módulo        | Onde os dados ficam                                   |
| ------------- | ----------------------------------------------------- |
| Usuários      | `localStorage` (chave `usuarios`); sessão em `sessionStorage` |
| Tema escuro   | `localStorage` (chave `modoEscuro`)                   |
| Financeiro    | `localStorage` (chave `financeiro_data`)              |
| Conveniências | `localStorage` |
| Salas         | `localStorage`                                  |

Para limpar os dados salvos, abra as ferramentas de desenvolvedor do navegador (`F12`), vá em *Application > Local Storage* e remova as chaves acima.

---

## Status do projeto e próximos passos

O projeto está em desenvolvimento. Algumas partes ainda estão incompletas:

- [ ] Finalizar a **grade de salas** (renderização, alocação e contadores de ocupados, disponíveis e pendentes).
- [ ] Integrar o **dashboard** com os dados reais de salas e conveniências.
- [ ] Persistir os lançamentos de **conveniências** (hoje ficam apenas em memória).
- [ ] Criar back-end e autenticação segura.

---

## Contribuição

Sugestões e melhorias são bem-vindas. Para contribuir:

1. Faça um *fork* do projeto.
2. Crie uma branch para a sua alteração: `git checkout -b minha-melhoria`.
3. Faça o commit: `git commit -m "Descrição da melhoria"`.
4. Envie para o seu repositório: `git push origin minha-melhoria`.
5. Abra um *Pull Request*.

---

&copy; 2026 Attento Gerencimentos. Todos os direitos reservados.
