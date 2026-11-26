

function obterApiKey(forcarPergunta = false) {
  let chave = !forcarPergunta
    ? (window.GEMINI_API_KEY || localStorage.getItem(STORAGE_KEY_API) || "").trim()
    : "";

  if (!chave) {
    const informada = prompt(
      "Informe sua chave da API do Gemini (ela ficará salva apenas neste navegador):"
    );
    if (informada && informada.trim()) {
      chave = informada.trim();
      localStorage.setItem(STORAGE_KEY_API, chave);
    }
  }

  return chave;
}

const SYSTEM_PROMPT = `
Você é o Assistente Virtual oficial do sistema "Attento · Saúde Integral", uma plataforma de gestão operacional para clínicas e espaços de saúde.
Sua função é tirar dúvidas rápidas dos colaboradores e administradores sobre como utilizar o painel.

Estrutura e Módulos do Sistema (Menu Lateral):
1. Início (index.html): Painel operacional com indicadores do dia (Faturamento de hoje, Ocupação de hoje, Receita de salas na semana, Conveniências no mês), Agenda de hoje (status: Ocupado, Pendente, Livre), alertas em "Precisa de atenção", Ocupação da semana e Últimos lançamentos.
2. Salas (salas.html): Grade completa de salas/consultórios, agendamentos, reservas e disponibilidade por turno.
3. Financeiro (financeiro.html): Controle de lançamentos, faturamento, receitas e resumo financeiro.
4. Conveniências (conveniencias.html): Gestão de produtos, serviços adicionais e consumo de conveniências.
5. Gerenciar funcionários (funcionarios.html): Disponível apenas para usuários com perfil de Administrador (admin) para cadastro e gestão da equipe.

Recursos da Barra Superior:
- Botão "Modo Escuro": Alterna o tema visual do sistema entre claro e escuro.
- Perfil e "Sair": Exibe o usuário logado e permite encerrar a sessão.

Diretrizes de Resposta:
- Responda sempre em português do Brasil, de forma educada, objetiva e direta.
- Indique exatamente o nome do menu ou seção onde o usuário deve clicar.
- Não invente funções que não existam nos módulos descritos acima.
`;

document.addEventListener("DOMContentLoaded", () => {
  const chatHTML = `
    <button class="attento-chat-btn" id="btnAbrirChat" title="Assistente Virtual Attento">
      <i class="ph ph-chat-circle-dots"></i>
    </button>
    <div class="attento-chat-window" id="janelaChat">
      <div class="attento-chat-header">
        <span><i class="ph ph-sparkle"></i> Assistente Attento IA</span>
        <div style="display:flex;gap:6px;align-items:center;">
          <button id="btnConfigKey" title="Configurar chave da API"><i class="ph ph-key"></i></button>
          <button id="btnFecharChat" title="Fechar"><i class="ph ph-x"></i></button>
        </div>
      </div>
      <div class="attento-chat-messages" id="areaMensagens">
        <div class="msg-bot">Olá! Sou o assistente do <strong>Attento · Saúde Integral</strong>. Como posso ajudar com a agenda, salas ou financeiro hoje?</div>
      </div>
      <div class="attento-chat-input-area">
        <input type="text" id="inputPergunta" placeholder="Digite sua dúvida..." autocomplete="off" />
        <button id="btnEnviarPergunta"><i class="ph ph-paper-plane-right"></i></button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", chatHTML);

  const btnAbrir = document.getElementById("btnAbrirChat");
  const btnFechar = document.getElementById("btnFecharChat");
  const btnConfigKey = document.getElementById("btnConfigKey");
  const janela = document.getElementById("janelaChat");
  const input = document.getElementById("inputPergunta");
  const btnEnviar = document.getElementById("btnEnviarPergunta");
  const mensagens = document.getElementById("areaMensagens");

  let historicoConversa = [];
  let modelosCache = null;
  let modeloAtivo = null;
  let enviando = false;

  btnAbrir.addEventListener("click", () => {
    janela.classList.toggle("ativo");
    if (janela.classList.contains("ativo")) input.focus();
  });

  btnFechar.addEventListener("click", () => janela.classList.remove("ativo"));

  btnConfigKey.addEventListener("click", () => {
    const novaChave = obterApiKey(true);
    if (novaChave) {
      modelosCache = null;
      modeloAtivo = null;
      adicionarMensagem("Chave da API atualizada com sucesso neste navegador.", "bot");
    }
  });


  function formatarMensagem(texto) {
    return texto
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  function adicionarMensagem(texto, tipo, id = null) {
    const div = document.createElement("div");
    div.className = tipo === "user" ? "msg-user" : "msg-bot";
    if (id) div.id = id;
    if (tipo === "bot") {
      div.innerHTML = formatarMensagem(texto);
    } else {
      div.textContent = texto;
    }
    mensagens.appendChild(div);
    mensagens.scrollTop = mensagens.scrollHeight;
    return div;
  }

  // Evita que uma requisição fique travada indefinidamente
  async function fetchComTimeout(url, options = {}, tempoMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), tempoMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function obterModelosDisponiveis(apiKey) {
    if (modelosCache && modelosCache.length > 0) return modelosCache;

    const listaResp = await fetchComTimeout(
      "https://generativelanguage.googleapis.com/v1beta/models",
      { headers: { "x-goog-api-key": apiKey } },
      10000
    );
    const listaData = await listaResp.json();

    if (!listaResp.ok) {
      throw new Error(listaData?.error?.message || "Erro ao listar modelos");
    }

    modelosCache = (listaData.models || [])
      .filter((m) => {
        const nome = m.name.toLowerCase();
        return (
          m.supportedGenerationMethods?.includes("generateContent") &&
          nome.includes("gemini") &&
          !nome.includes("image") &&
          !nome.includes("tts") &&
          !nome.includes("audio") &&
          !nome.includes("embedding") &&
          !nome.includes("robotics") &&
          !nome.includes("deep-research") &&
          !nome.includes("computer-use")
        );
      })
      .map((m) => m.name.replace("models/", ""))
      .sort((a, b) => {
        const peso = (nome) => {
          if (nome.includes("flash-lite")) return 3;
          if (nome.includes("flash")) return 2;
          return 1;
        };
        return peso(b) - peso(a);
      });

    return modelosCache;
  }

  async function enviarMensagem() {
    const texto = input.value.trim();
    if (!texto || enviando) return;

    const apiKey = obterApiKey();
    if (!apiKey) {
      adicionarMensagem(
        "Configure sua chave da API clicando no ícone de chave no topo do chat para começar.",
        "bot"
      );
      return;
    }

    enviando = true;
    adicionarMensagem(texto, "user");
    input.value = "";
    input.disabled = true;
    btnEnviar.disabled = true;

    historicoConversa.push({
      role: "user",
      parts: [{ text: texto }]
    });

    const idLoading = "loading-" + Date.now();
    const divLoading = adicionarMensagem("Digitando...", "bot", idLoading);

    try {
      const modelosDisponiveis = await obterModelosDisponiveis(apiKey);

      // Usa primeiro o último modelo que funcionou bem; tenta no máximo 4 modelos
      const filaModelos = modeloAtivo
        ? [modeloAtivo, ...modelosDisponiveis.filter((m) => m !== modeloAtivo)]
        : modelosDisponiveis;
      const tentativas = filaModelos.slice(0, 4);

      let respostaIA = null;
      let ultimoErro = null;

      for (const modelo of tentativas) {
        try {
          const response = await fetchComTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
              },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: SYSTEM_PROMPT }]
                },
                contents: historicoConversa,
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 500
                }
              })
            },
            12000
          );

          const data = await response.json();

          if (response.ok) {
            respostaIA =
              data?.candidates?.[0]?.content?.parts?.[0]?.text ||
              "Não consegui formular uma resposta agora. Tente novamente.";
            modeloAtivo = modelo;
            break;
          }

          ultimoErro = data?.error?.message || `Erro HTTP ${response.status}`;

          if (response.status === 401 || response.status === 403) {
            modelosCache = null;
            ultimoErro = "Chave da API inválida ou sem permissão. Clique no ícone de chave para atualizar.";
            break;
          }
        } catch (errTentativa) {
          ultimoErro =
            errTentativa.name === "AbortError"
              ? "Servidor lento no momento. Tente novamente."
              : errTentativa.message;
        }
      }

      if (!respostaIA) {
        throw new Error(ultimoErro || "Nenhum modelo disponível respondeu.");
      }

      divLoading.innerHTML = formatarMensagem(respostaIA);

      historicoConversa.push({
        role: "model",
        parts: [{ text: respostaIA }]
      });
    } catch (erro) {
      console.error("Erro Gemini API:", erro);
      divLoading.textContent = "Não foi possível responder agora: " + erro.message;
      historicoConversa.pop();
    } finally {
      enviando = false;
      input.disabled = false;
      btnEnviar.disabled = false;
      input.focus();
      mensagens.scrollTop = mensagens.scrollHeight;
    }
  }

  btnEnviar.addEventListener("click", enviarMensagem);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensagem();
  });
});