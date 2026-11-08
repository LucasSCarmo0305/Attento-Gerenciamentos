# Attento Gerenciamentos

Sistema web de gestão para clínicas e consultórios de saúde multiprofissionais, desenvolvido para a **Attento – Saúde Integral**. A aplicação centraliza em um só lugar o controle de **salas**, o **financeiro** e as **conveniências** (café, água, impressão e outros consumíveis) usadas pelos profissionais.

O projeto é um front-end estático (HTML, CSS e JavaScript puro), sem back-end e sem dependências.

---

## Funcionalidades

- **Login e cadastro:** autenticação simples de usuários, com cadastro validado (campos obrigatórios, confirmação de senha e e-mail único).
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
│   │   ├── cadastro.css
│   │   ├── conveniencias.css
│   │   ├── financeiro.css
│   │   ├── index.css
│   │   ├── login.css
│   │   ├── salas.css
│   │   └── sidebar.css
│   ├── Javascrypt/
│   │   ├── cadastro.js
│   │   ├── conveniencias.js
│   │   ├── financeiro.js
│   │   ├── Index.js
│   │   ├── login.js
│   │   └── salas.js
│   └── imagens/
│       ├── Attento Logo.png
│       └── ImagenLogin.png
├── Pages/
│   ├── cadastro.html
│   ├── conveniencias.html
│   ├── financeiro.html
│   ├── index.html
│   ├── login.html
│   └── salas.html
├── .gitignore
└── README.md
```

---

## Como executar

Não há instalação nem build. Como as páginas referenciam arquivos com caminhos absolutos (`/Assets/...`), o projeto deve ser servido a partir da **raiz da pasta**, e não aberto diretamente com um duplo clique no HTML.

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

## Acesso de demonstração

Para testar sem criar uma conta, use as credenciais abaixo na tela de login:

| Campo  | Valor             |
| ------ | ----------------- |
| E-mail | `admin@Email.com` |
| Senha  | `admn123`         |

Também é possível criar um usuário novo em `Pages/cadastro.html`. Os usuários cadastrados ficam salvos no `localStorage` do navegador.

> **Atenção:** a autenticação é apenas demonstrativa. As senhas ficam em texto puro no navegador e as credenciais de teste estão no código-fonte. Não use este sistema com dados reais sem antes implementar um back-end com autenticação segura.

---

## Persistência de dados

| Módulo        | Onde os dados ficam                                   |
| ------------- | ----------------------------------------------------- |
| Usuários      | `localStorage` (chave `usuarios`)                     |
| Financeiro    | `localStorage` (chave `financeiro_data`)              |
| Conveniências | Em memória (os lançamentos somem ao recarregar a página) |
| Salas         | Em desenvolvimento                                    |

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
