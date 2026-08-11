import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Calendar,
  Sparkles,
  Layers,
  Clock,
  Camera,
  RotateCcw,
} from "lucide-react";

/* ------------------------------------------------------------------
   MÓDULO 2 - Estratégia de conteúdo
   Vive em answers.m2 (mesmo localStorage do app). As telas são
   renderizadas pelo fluxo principal (screen + history), então os
   botões "voltar" do app e do celular continuam funcionando igual.
------------------------------------------------------------------- */

const FONT_DISPLAY = "'Manrope', system-ui, sans-serif";

export const MODULE2_STEPS = [
  "m2Intro",
  "m2Pilares",
  "m2Periodo",
  "m2DataNegocio",
  "m2DatasComerciais",
  "m2Formatos",
  "m2Frequencia",
  "m2Ideias",
  "m2Calendario",
  "m2Final",
];

export const DEFAULT_M2 = {
  pilares: [],
  periodo: "",
  periodoDataFim: "",
  temDataNegocio: "",
  dataNegocioQuando: "",
  dataNegocioDescricao: "",
  datasComerciais: [],
  formatos: [],
  frequencia: "",
  ideiasSelecionadas: [],
  concluido: false,
};

/* ---------------------------- Primitivos (mesmo visual do Módulo 1) --------------------------- */
function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-yellow-400 disabled:bg-neutral-100 disabled:text-neutral-300 hover:enabled:bg-yellow-300 active:enabled:scale-[0.98] transition-all text-neutral-900 font-bold text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      {children}
    </button>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-bold tracking-wide text-yellow-600 uppercase mb-2">{children}</p>
  );
}

function Title({ children }) {
  return (
    <h2
      className="text-[19px] font-extrabold text-neutral-900 mb-2 leading-snug"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      {children}
    </h2>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl border text-[13px] font-semibold transition-all text-left ${
        active
          ? "bg-yellow-400 border-yellow-400 text-neutral-900"
          : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

function OptionButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-2xl border text-[14.5px] font-semibold transition-all ${
        active
          ? "bg-yellow-400 border-yellow-400 text-neutral-900"
          : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">{children}</div>
  );
}

/* ---------------------------- Regras de conteúdo ---------------------------- */

export const PILARES = [
  "Produtos ou serviços",
  "Dicas e educação",
  "Dúvidas dos clientes",
  "Bastidores",
  "Resultados",
  "Antes e depois",
  "Depoimentos",
  "Prova social",
  "Como funciona",
  "Demonstração",
  "Localização e região",
  "História da marca",
  "Autoridade",
  "Inspiração",
  "Venda e oferta",
];

const NEGOCIO_KEYS = {
  transformacao: [
    "salão",
    "salao",
    "cabelei",
    "barbe",
    "estétic",
    "estetic",
    "unha",
    "manicure",
    "sobrancelh",
    "maquia",
    "dentista",
    "personal",
    "nutri",
    "fisiot",
    "reforma",
    "pintura",
    "jardin",
    "limpeza",
    "design",
    "tatu",
  ],
  comida: [
    "doceria",
    "confeit",
    "bolo",
    "brigadeiro",
    "marmita",
    "restaurante",
    "lanche",
    "pizzar",
    "padaria",
    "café",
    "cafe",
    "food",
    "comida",
    "salgad",
    "açaí",
    "acai",
    "hamburg",
  ],
  produto: [
    "loja",
    "roupa",
    "moda",
    "boutique",
    "acessóri",
    "acessori",
    "semijoi",
    "joia",
    "calçad",
    "calcad",
    "papelaria",
    "presente",
    "cosmétic",
    "cosmetic",
    "pet shop",
    "artesanat",
  ],
  servicoTecnico: [
    "eletric",
    "encanad",
    "mecânic",
    "mecanic",
    "assistênc",
    "assistenc",
    "conserto",
    "manutenç",
    "instalaç",
    "chavei",
    "informátic",
    "informatic",
    "climatiz",
  ],
  consultivo: [
    "advogad",
    "contador",
    "consultor",
    "coach",
    "psicolog",
    "arquitet",
    "corretor",
    "professor",
    "terapeut",
    "agência",
    "agencia",
    "market",
  ],
};

function categoriaDoNegocio(answers) {
  const txt = `${answers.negocio || ""} ${answers.oferece || ""}`.toLowerCase();
  for (const [cat, keys] of Object.entries(NEGOCIO_KEYS)) {
    if (keys.some((k) => txt.includes(k))) return cat;
  }
  return "geral";
}

export function sugerirPilares(answers) {
  const cat = categoriaDoNegocio(answers);
  const objetivo = answers.objetivo || "";
  const score = {};
  const add = (p, n) => {
    score[p] = (score[p] || 0) + n;
  };

  PILARES.forEach((p) => add(p, 0));

  // Base por categoria de negócio
  const porCategoria = {
    transformacao: [
      ["Antes e depois", 5],
      ["Resultados", 5],
      ["Depoimentos", 4],
      ["Dicas e educação", 3],
      ["Bastidores", 3],
      ["Produtos ou serviços", 3],
    ],
    comida: [
      ["Produtos ou serviços", 5],
      ["Bastidores", 4],
      ["Demonstração", 4],
      ["Venda e oferta", 3],
      ["Depoimentos", 3],
      ["Localização e região", 3],
    ],
    produto: [
      ["Produtos ou serviços", 5],
      ["Inspiração", 4],
      ["Venda e oferta", 4],
      ["Prova social", 3],
      ["Demonstração", 3],
      ["Dúvidas dos clientes", 2],
    ],
    servicoTecnico: [
      ["Como funciona", 5],
      ["Resultados", 4],
      ["Dúvidas dos clientes", 4],
      ["Antes e depois", 3],
      ["Autoridade", 3],
      ["Localização e região", 3],
    ],
    consultivo: [
      ["Autoridade", 5],
      ["Dicas e educação", 5],
      ["Dúvidas dos clientes", 4],
      ["Depoimentos", 3],
      ["Como funciona", 3],
      ["História da marca", 2],
    ],
    geral: [
      ["Produtos ou serviços", 4],
      ["Dicas e educação", 3],
      ["Dúvidas dos clientes", 3],
      ["Bastidores", 3],
      ["Depoimentos", 3],
      ["Como funciona", 2],
    ],
  };
  porCategoria[cat].forEach(([p, n]) => add(p, n));

  // Ajuste por objetivo
  const porObjetivo = {
    "Conseguir clientes": [
      ["Prova social", 3],
      ["Depoimentos", 3],
      ["Como funciona", 2],
    ],
    "Vender produtos": [
      ["Produtos ou serviços", 3],
      ["Venda e oferta", 3],
      ["Demonstração", 2],
    ],
    "Receber pedidos no WhatsApp": [
      ["Venda e oferta", 3],
      ["Como funciona", 3],
      ["Produtos ou serviços", 2],
    ],
    "Divulgar meu negócio": [
      ["História da marca", 3],
      ["Bastidores", 3],
      ["Produtos ou serviços", 2],
    ],
    "Ser mais conhecido na minha região": [
      ["Localização e região", 4],
      ["Prova social", 2],
      ["Bastidores", 2],
    ],
    "Ainda não sei": [
      ["Dicas e educação", 2],
      ["Produtos ou serviços", 2],
      ["Bastidores", 2],
    ],
  };
  (porObjetivo[objetivo] || []).forEach(([p, n]) => add(p, n));

  if ((answers.bioOnde || "").trim()) add("Localização e região", 2);
  if ((answers.comprador || "").trim()) add("Dúvidas dos clientes", 1);

  return PILARES.slice()
    .sort((a, b) => (score[b] || 0) - (score[a] || 0))
    .slice(0, 5);
}

export function funcaoDoConteudo(objetivo) {
  const mapa = {
    "Conseguir clientes": {
      titulo: "Seu conteúdo precisa gerar confiança e provocar contato",
      texto:
        "Como seu objetivo é conseguir clientes, o conteúdo não serve para “aparecer”: ele serve para mostrar que você resolve o problema da pessoa e que já resolveu para outras. Posts de resultado, depoimento e explicação de como funciona o atendimento fazem mais efeito do que posts bonitos sem contexto.",
    },
    "Vender produtos": {
      titulo: "Seu conteúdo precisa mostrar o produto em uso e facilitar a decisão",
      texto:
        "Como seu objetivo é vender, o conteúdo precisa mostrar o produto de perto, explicar tamanho, preço, variações e como comprar. Quem vende no Instagram vende quando a pessoa entende exatamente o que está levando e não precisa perguntar tudo antes.",
    },
    "Receber pedidos no WhatsApp": {
      titulo: "Seu conteúdo precisa terminar sempre em uma próxima ação",
      texto:
        "Como seu objetivo é receber pedidos no WhatsApp, cada post precisa deixar claro o que a pessoa faz depois de ver. Conteúdo que explica o processo de pedido, prazos e formas de pagamento tira a dúvida que trava a mensagem.",
    },
    "Divulgar meu negócio": {
      titulo: "Seu conteúdo precisa apresentar o negócio para quem ainda não conhece",
      texto:
        "Como seu objetivo é divulgar, boa parte do conteúdo deve responder “quem é você, o que você faz e para quem”. Bastidores, história da marca e demonstrações ajudam quem chegou agora a entender o negócio em poucos segundos.",
    },
    "Ser mais conhecido na minha região": {
      titulo: "Seu conteúdo precisa deixar claro onde você está e quem você atende",
      texto:
        "Como seu objetivo é ser conhecido na sua região, o conteúdo deve citar bairro, cidade, pontos de referência e clientes locais. Isso faz o Instagram mostrar seu perfil para pessoas perto de você e faz o vizinho lembrar de você na hora certa.",
    },
    "Ainda não sei": {
      titulo: "Seu conteúdo precisa fazer as pessoas entenderem e lembrarem de você",
      texto:
        "Sem um objetivo definido ainda, o caminho mais seguro é equilibrar: conteúdo que explica o que você faz, conteúdo que ajuda quem te acompanha e conteúdo que mostra os bastidores. Com o tempo você vê o que traz mais mensagem e ajusta.",
    },
  };
  return mapa[objetivo] || mapa["Ainda não sei"];
}

/* ---------------------------- Datas ---------------------------- */

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function fmtData(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function periodoRange(periodo, dataFim) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(hoje);
  let fim = new Date(hoje);
  if (periodo === "Esta semana") {
    const diasAteDomingo = 7 - (hoje.getDay() === 0 ? 7 : hoje.getDay());
    fim.setDate(hoje.getDate() + diasAteDomingo);
  } else if (periodo === "Próxima semana") {
    const diasAteDomingo = 7 - (hoje.getDay() === 0 ? 7 : hoje.getDay());
    inicio.setDate(hoje.getDate() + diasAteDomingo + 1);
    fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
  } else if (periodo === "Até o fim deste mês") {
    fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  } else if (periodo === "Outra data" && dataFim) {
    const parsed = new Date(`${dataFim}T00:00:00`);
    if (!isNaN(parsed.getTime())) fim = parsed;
  }
  if (fim < inicio) fim = new Date(inicio);
  return { inicio, fim, label: `${fmtData(inicio)} a ${fmtData(fim)}` };
}

// Datas comerciais com as categorias de negócio em que fazem sentido.
const DATAS_COMERCIAIS = [
  {
    nome: "Dia das Mães",
    mes: 5,
    dia: 11,
    cats: ["transformacao", "comida", "produto", "consultivo"],
    palavras: ["presente", "mãe", "flor", "beleza", "doce", "bolo", "joia", "roupa"],
  },
  {
    nome: "Dia dos Namorados",
    mes: 6,
    dia: 12,
    cats: ["comida", "produto", "transformacao"],
    palavras: ["presente", "casal", "jantar", "flor", "doce", "joia", "perfume"],
  },
  {
    nome: "Dia dos Pais",
    mes: 8,
    dia: 10,
    cats: ["comida", "produto", "transformacao"],
    palavras: ["presente", "pai", "barba", "churrasco", "camisa"],
  },
  {
    nome: "Dia das Crianças",
    mes: 10,
    dia: 12,
    cats: ["comida", "produto"],
    palavras: ["criança", "infantil", "brinquedo", "festa", "kids", "escola"],
  },
  {
    nome: "Black Friday",
    mes: 11,
    dia: 28,
    cats: ["produto", "comida", "transformacao", "servicoTecnico", "consultivo"],
    palavras: ["desconto", "promo", "loja", "curso", "pacote"],
  },
  {
    nome: "Natal",
    mes: 12,
    dia: 25,
    cats: ["comida", "produto", "transformacao"],
    palavras: ["presente", "ceia", "festa", "confraterniza"],
  },
];

export function datasComerciaisRelevantes(answers, periodo, dataFim) {
  const { inicio, fim } = periodoRange(periodo, dataFim);
  const cat = categoriaDoNegocio(answers);
  const txt =
    `${answers.negocio || ""} ${answers.oferece || ""} ${answers.comprador || ""}`.toLowerCase();
  const anos = [inicio.getFullYear(), fim.getFullYear()];
  const encontradas = [];
  DATAS_COMERCIAIS.forEach((d) => {
    anos.forEach((ano) => {
      const data = new Date(ano, d.mes - 1, d.dia);
      if (data < inicio || data > fim) return;
      const relevante = d.cats.includes(cat) || d.palavras.some((p) => txt.includes(p));
      if (!relevante) return;
      if (encontradas.some((e) => e.nome === d.nome)) return;
      encontradas.push({
        nome: d.nome,
        quando: `${d.dia} de ${MESES[d.mes - 1]}`,
        motivo: motivoData(d.nome, answers),
      });
    });
  });
  return encontradas;
}

function motivoData(nome, answers) {
  const oferta = (answers.oferece || answers.negocio || "o que você oferece").trim();
  const publico = (answers.comprador || "").trim();
  const base = {
    "Dia das Mães": `muita gente procura ${oferta} para presentear nessa semana`,
    "Dia dos Namorados": `${oferta} entra na lista de presente e comemoração de casal`,
    "Dia dos Pais": `${oferta} funciona bem como presente nessa data`,
    "Dia das Crianças": `${oferta} tem relação com público infantil e família`,
    "Black Friday": `é a data em que as pessoas mais comparam preço e condição de ${oferta}`,
    Natal: `${oferta} costuma ser procurado para presente e confraternização`,
  };
  const motivo = base[nome] || `tem relação com ${oferta}`;
  return publico ? `${motivo} — e combina com ${publico}.` : `${motivo}.`;
}

/* ---------------------------- Ideias ---------------------------- */

const FORMATOS = [
  "Fotos",
  "Carrosséis",
  "Reels sem aparecer",
  "Reels aparecendo e falando",
  "Stories",
  "Ainda não sei",
];

function formatoPara(pilar, formatos) {
  const disp = formatos.filter((f) => f !== "Ainda não sei" && f !== "Stories");
  if (disp.length === 0) return "Foto com legenda";
  const preferencia = {
    "Produtos ou serviços": ["Fotos", "Carrosséis", "Reels sem aparecer"],
    "Dicas e educação": ["Carrosséis", "Reels aparecendo e falando", "Fotos"],
    "Dúvidas dos clientes": ["Carrosséis", "Reels aparecendo e falando", "Fotos"],
    Bastidores: ["Reels sem aparecer", "Fotos", "Carrosséis"],
    Resultados: ["Fotos", "Carrosséis", "Reels sem aparecer"],
    "Antes e depois": ["Reels sem aparecer", "Fotos", "Carrosséis"],
    Depoimentos: ["Fotos", "Carrosséis", "Reels sem aparecer"],
    "Prova social": ["Carrosséis", "Fotos", "Reels sem aparecer"],
    "Como funciona": ["Carrosséis", "Reels aparecendo e falando", "Fotos"],
    Demonstração: ["Reels sem aparecer", "Reels aparecendo e falando", "Fotos"],
    "Localização e região": ["Fotos", "Reels sem aparecer", "Carrosséis"],
    "História da marca": ["Reels aparecendo e falando", "Carrosséis", "Fotos"],
    Autoridade: ["Reels aparecendo e falando", "Carrosséis", "Fotos"],
    Inspiração: ["Carrosséis", "Fotos", "Reels sem aparecer"],
    "Venda e oferta": ["Fotos", "Carrosséis", "Reels sem aparecer"],
  };
  const ordem = preferencia[pilar] || ["Fotos", "Carrosséis"];
  return ordem.find((f) => disp.includes(f)) || disp[0];
}

function ideiasDoPilar(pilar, ctx) {
  const { negocio, oferta, publico, local, cta } = ctx;
  const ondeTxt = local ? ` em ${local}` : "";
  const paraQuem = publico ? ` para ${publico}` : "";
  const mapa = {
    "Produtos ou serviços": [
      `Mostre ${oferta} de perto e explique na legenda o que está incluso, quanto tempo leva e como pedir (${cta}).`,
      `Poste os 3 itens de ${oferta} mais pedidos${paraQuem} e diga por que cada um é escolhido.`,
    ],
    "Dicas e educação": [
      `Dê uma dica prática que ${publico || "seu cliente"} pode aplicar hoje relacionada a ${oferta}, sem precisar comprar nada.`,
      `Explique um erro comum que as pessoas cometem antes de contratar/comprar ${oferta} e como evitar.`,
    ],
    "Dúvidas dos clientes": [
      `Responda a pergunta que mais chega no WhatsApp de ${negocio} sobre ${oferta} (preço, prazo ou funcionamento).`,
      `Monte um "perguntas e respostas" com as 4 dúvidas que ${publico || "seus clientes"} sempre mandam antes de fechar.`,
    ],
    Bastidores: [
      `Mostre como ${oferta} é preparado no dia a dia de ${negocio}: começo, meio e resultado.`,
      `Grave um dia normal de trabalho${ondeTxt} e mostre o cuidado que ninguém vê antes de entregar ${oferta}.`,
    ],
    Resultados: [
      `Mostre o resultado real de um cliente que usou ${oferta} e conte em uma frase o que mudou para ele.`,
      `Poste um caso recente de ${negocio}: qual era o problema, o que você fez e como ficou.`,
    ],
    "Antes e depois": [
      `Publique um antes e depois de ${oferta}, dizendo quanto tempo levou e o que foi feito.`,
      `Faça um antes e depois em vídeo curto mostrando a diferença em poucos segundos.`,
    ],
    Depoimentos: [
      `Compartilhe o print de um elogio recebido no WhatsApp sobre ${oferta} (com autorização) e agradeça.`,
      `Peça a um cliente${ondeTxt} para dizer em 15 segundos por que voltaria a comprar de ${negocio}.`,
    ],
    "Prova social": [
      `Mostre quantas pessoas já foram atendidas por ${negocio} e o que elas mais elogiam em ${oferta}.`,
      `Junte 3 avaliações de clientes num carrossel e finalize com ${cta}.`,
    ],
    "Como funciona": [
      `Explique o passo a passo para pedir ${oferta}: da primeira mensagem até a entrega/atendimento.`,
      `Mostre formas de pagamento, prazo e como funciona o agendamento em ${negocio}.`,
    ],
    Demonstração: [
      `Grave ${oferta} sendo usado/feito na prática, sem cortes, e comente o detalhe que faz diferença.`,
      `Compare duas opções de ${oferta} e ajude ${publico || "o cliente"} a escolher a certa.`,
    ],
    "Localização e região": [
      `Mostre onde ${negocio} fica${ondeTxt}, com ponto de referência e como chegar.`,
      `Fale de algo que só quem é${local ? ` de ${local}` : " da sua região"} entende e conecte com ${oferta}.`,
    ],
    "História da marca": [
      `Conte por que você começou ${negocio} e o que te faz continuar.`,
      `Mostre a diferença entre o começo de ${negocio} e como está hoje.`,
    ],
    Autoridade: [
      `Explique um assunto do seu trabalho com ${oferta} que a maioria das pessoas entende errado.`,
      `Dê sua opinião profissional sobre uma dúvida frequente${paraQuem}.`,
    ],
    Inspiração: [
      `Monte um carrossel com formas diferentes de usar/aproveitar ${oferta}.`,
      `Mostre uma combinação/ideia pronta usando ${oferta} para ${publico || "seu cliente"} copiar.`,
    ],
    "Venda e oferta": [
      `Anuncie uma condição especial de ${oferta} com prazo definido e finalize com ${cta}.`,
      `Mostre o que está disponível hoje em ${negocio} e diga como garantir (${cta}).`,
    ],
  };
  return mapa[pilar] || [`Poste sobre ${oferta} explicando o que é e como pedir.`];
}

export function gerarIdeias(answers) {
  const m2 = answers.m2 || DEFAULT_M2;
  const negocio = (answers.negocio || "seu negócio").trim();
  const oferta = (answers.oferece || answers.negocio || "o que você oferece").trim();
  const publico = (answers.comprador || "").trim();
  const local = (answers.bioOndeNA ? "" : answers.bioOnde || "").trim();
  const cta =
    (answers.bioProximoPasso === "Outro"
      ? answers.bioProximoPassoOutro
      : answers.bioProximoPasso) || "chamar no WhatsApp";
  const ctx = { negocio, oferta, publico, local, cta };
  const formatos = m2.formatos || [];
  const ideias = [];

  (m2.pilares || []).forEach((pilar) => {
    ideiasDoPilar(pilar, ctx).forEach((texto, i) => {
      ideias.push({
        id: `${pilar}-${i}`,
        pilar,
        texto,
        formato: formatoPara(pilar, formatos),
      });
    });
  });

  // Data do próprio negócio
  if (m2.temDataNegocio === "Sim" && (m2.dataNegocioDescricao || "").trim()) {
    const quando = m2.dataNegocioQuando ? ` (${m2.dataNegocioQuando})` : "";
    ideias.unshift(
      {
        id: "dataNegocio-0",
        pilar: "Data do seu negócio",
        texto: `Anuncie ${m2.dataNegocioDescricao}${quando} explicando o que muda para ${publico || "seus clientes"} e como participar (${cta}).`,
        formato: formatoPara("Venda e oferta", formatos),
      },
      {
        id: "dataNegocio-1",
        pilar: "Data do seu negócio",
        texto: `Mostre os bastidores da preparação de ${m2.dataNegocioDescricao} em ${negocio} nos dias que antecedem a data.`,
        formato: formatoPara("Bastidores", formatos),
      },
    );
  }

  // Datas comerciais escolhidas
  (m2.datasComerciais || []).forEach((nome, i) => {
    ideias.unshift({
      id: `dataCom-${i}`,
      pilar: nome,
      texto: `Prepare um post de ${nome} conectando ${oferta} à data: mostre a opção pronta para ${publico || "quem vai presentear"} e diga o prazo para pedir (${cta}).`,
      formato: formatoPara("Venda e oferta", formatos),
    });
  });

  return ideias;
}

export function sugestoesStories(answers) {
  const negocio = (answers.negocio || "seu negócio").trim();
  const oferta = (answers.oferece || "o que você oferece").trim();
  const cta =
    (answers.bioProximoPasso === "Outro"
      ? answers.bioProximoPassoOutro
      : answers.bioProximoPasso) || "chamar no WhatsApp";
  return [
    `Enquete: "Qual desses você levaria hoje?" com duas opções de ${oferta}.`,
    `Caixinha de perguntas: "O que você quer saber sobre ${oferta}?" e responda uma por dia.`,
    `Mostre um pedido sendo preparado/atendido em ${negocio} hoje.`,
    `Repost de um cliente marcando ${negocio}, com agradecimento.`,
    `Story lembrando como pedir: passo a passo curto terminando em ${cta}.`,
  ];
}

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const DISTRIBUICAO = {
  "2 posts por semana": ["Terça", "Sexta"],
  "3 posts por semana": ["Segunda", "Quarta", "Sexta"],
  "4 posts por semana": ["Segunda", "Terça", "Quinta", "Sexta"],
  "5 posts por semana": ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
};

export function montarCalendario(answers) {
  const m2 = answers.m2 || DEFAULT_M2;
  const dias = DISTRIBUICAO[m2.frequencia] || DIAS_SEMANA.slice(0, 3);
  const todas = gerarIdeias(answers);
  const escolhidas = todas.filter((i) => (m2.ideiasSelecionadas || []).includes(i.id));
  const lista = escolhidas.length ? escolhidas : todas.slice(0, dias.length);
  return dias.map((dia, i) => ({
    dia,
    ideia: lista[i % lista.length] || null,
  }));
}

/* ---------------------------- Telas ---------------------------- */

export function M2Intro({ answers, onNext }) {
  const info = funcaoDoConteudo(answers.objetivo);
  const negocio = (answers.negocio || "seu negócio").trim();
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Módulo 2 · Estratégia de conteúdo</Eyebrow>
        <Title>{info.titulo}</Title>
        <p className="text-[13.5px] text-neutral-500 leading-relaxed mb-4">{info.texto}</p>
        <Card>
          <p className="text-[12px] font-bold text-neutral-500 uppercase tracking-wide mb-1">
            O que já sabemos sobre você
          </p>
          <p className="text-[13px] text-neutral-700 leading-relaxed">
            <strong>Negócio:</strong> {negocio}
            <br />
            {answers.oferece ? (
              <>
                <strong>Oferece:</strong> {answers.oferece}
                <br />
              </>
            ) : null}
            {answers.comprador ? (
              <>
                <strong>Quem compra:</strong> {answers.comprador}
                <br />
              </>
            ) : null}
            {answers.objetivo ? (
              <>
                <strong>Objetivo:</strong> {answers.objetivo}
              </>
            ) : null}
          </p>
        </Card>
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext}>
          VER MEUS PILARES <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

export function M2Pilares({ answers, patchM2, onNext }) {
  const sugeridos = useMemo(() => sugerirPilares(answers), [answers]);
  const atuais = answers.m2?.pilares?.length ? answers.m2.pilares : sugeridos;
  useEffect(() => {
    if (!answers.m2?.pilares?.length) patchM2({ pilares: sugeridos });
  }, []);
  function toggle(p) {
    const set = new Set(atuais);
    if (set.has(p)) set.delete(p);
    else set.add(p);
    patchM2({ pilares: Array.from(set) });
  }
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Pilares de conteúdo</Eyebrow>
        <Title>Os assuntos que fazem sentido para o seu negócio</Title>
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
          {answers.negocio
            ? `Já marcamos os pilares mais fortes para ${answers.negocio}${answers.objetivo ? ` com o objetivo de ${answers.objetivo.toLowerCase()}` : ""}. Você pode ajustar.`
            : "Já marcamos os pilares mais comuns. Você pode ajustar."}
        </p>
        <div className="flex flex-wrap gap-2">
          {PILARES.map((p) => (
            <Chip key={p} active={atuais.includes(p)} onClick={() => toggle(p)}>
              {p}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext} disabled={atuais.length === 0}>
          CONTINUAR <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

const PERIODOS = ["Esta semana", "Próxima semana", "Até o fim deste mês", "Outra data"];

export function M2Periodo({ answers, patchM2, onNext }) {
  const m2 = answers.m2 || DEFAULT_M2;
  const ok = m2.periodo && (m2.periodo !== "Outra data" || !!m2.periodoDataFim);
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Período</Eyebrow>
        <Title>Para qual período você quer planejar?</Title>
        <div className="flex flex-col gap-2.5 mt-4">
          {PERIODOS.map((p) => (
            <OptionButton key={p} active={m2.periodo === p} onClick={() => patchM2({ periodo: p })}>
              {p}
            </OptionButton>
          ))}
        </div>
        {m2.periodo === "Outra data" && (
          <div className="mt-4">
            <label className="text-[13px] text-neutral-500 block mb-2">
              Planejar até qual data?
            </label>
            <input
              type="date"
              value={m2.periodoDataFim || ""}
              onChange={(e) => patchM2({ periodoDataFim: e.target.value })}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        )}
        {ok && (
          <p className="mt-4 text-[12.5px] text-neutral-400">
            Período do planejamento: {periodoRange(m2.periodo, m2.periodoDataFim).label}
          </p>
        )}
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext} disabled={!ok}>
          CONTINUAR <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

export function M2DataNegocio({ answers, patchM2, onNext }) {
  const m2 = answers.m2 || DEFAULT_M2;
  const precisaDetalhe = m2.temDataNegocio === "Sim";
  const ok =
    m2.temDataNegocio === "Não" || (precisaDetalhe && (m2.dataNegocioDescricao || "").trim());
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Datas do seu negócio</Eyebrow>
        <Title>Existe alguma data do seu próprio negócio nesse período?</Title>
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
          Aniversário da empresa, lançamento, promoção, evento, inauguração ou outra ocasião.
        </p>
        <div className="flex flex-col gap-2.5">
          {["Sim", "Não"].map((o) => (
            <OptionButton
              key={o}
              active={m2.temDataNegocio === o}
              onClick={() => patchM2({ temDataNegocio: o })}
            >
              {o}
            </OptionButton>
          ))}
        </div>
        {precisaDetalhe && (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-[13px] text-neutral-500 block mb-2">Qual a data?</label>
              <input
                type="date"
                value={m2.dataNegocioQuando || ""}
                onChange={(e) => patchM2({ dataNegocioQuando: e.target.value })}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="text-[13px] text-neutral-500 block mb-2">
                O que vai acontecer?
              </label>
              <textarea
                rows={2}
                value={m2.dataNegocioDescricao || ""}
                onChange={(e) => patchM2({ dataNegocioDescricao: e.target.value })}
                placeholder="Ex.: aniversário de 3 anos da loja com desconto"
                className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
        )}
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext} disabled={!ok}>
          CONTINUAR <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

export function M2DatasComerciais({ answers, patchM2, onNext }) {
  const m2 = answers.m2 || DEFAULT_M2;
  const relevantes = useMemo(
    () => datasComerciaisRelevantes(answers, m2.periodo, m2.periodoDataFim),
    [answers, m2.periodo, m2.periodoDataFim],
  );
  function toggle(nome) {
    const set = new Set(m2.datasComerciais || []);
    if (set.has(nome)) set.delete(nome);
    else set.add(nome);
    patchM2({ datasComerciais: Array.from(set) });
  }
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Datas comerciais</Eyebrow>
        <Title>
          {relevantes.length
            ? "Encontramos datas que combinam com o seu negócio"
            : "Nenhuma data comercial relevante nesse período"}
        </Title>
        {relevantes.length ? (
          <>
            <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
              Só mostramos datas que têm relação com o que você vende. Marque as que quiser incluir
              no planejamento.
            </p>
            <div className="flex flex-col gap-2.5">
              {relevantes.map((d) => {
                const active = (m2.datasComerciais || []).includes(d.nome);
                return (
                  <button
                    key={d.nome}
                    onClick={() => toggle(d.nome)}
                    className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                      active ? "bg-yellow-50 border-yellow-300" : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-none ${
                          active ? "bg-yellow-400" : "bg-white border border-neutral-300"
                        }`}
                      >
                        {active && <Check size={13} className="text-neutral-900" />}
                      </div>
                      <p className="text-[14px] font-bold text-neutral-900">{d.nome}</p>
                      <span className="text-[12px] text-neutral-400">{d.quando}</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-neutral-500 leading-relaxed">
                      Faz sentido porque {d.motivo}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-[13.5px] text-neutral-500 leading-relaxed">
            Nesse período não há nenhuma data comercial que tenha relação real com o seu negócio.
            Seguimos com os pilares e as datas do seu próprio negócio — é melhor postar com contexto
            do que forçar uma data qualquer.
          </p>
        )}
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext}>
          CONTINUAR <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

export function M2Formatos({ answers, patchM2, onNext }) {
  const m2 = answers.m2 || DEFAULT_M2;
  const atuais = m2.formatos || [];
  function toggle(f) {
    if (f === "Ainda não sei") {
      patchM2({ formatos: atuais.includes(f) ? [] : ["Ainda não sei"] });
      return;
    }
    const set = new Set(atuais.filter((x) => x !== "Ainda não sei"));
    if (set.has(f)) set.delete(f);
    else set.add(f);
    patchM2({ formatos: Array.from(set) });
  }
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Formatos</Eyebrow>
        <Title>Quais formatos você consegue produzir?</Title>
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
          Marque o que é realista para a sua rotina. Podemos ajustar depois.
        </p>
        <div className="flex flex-col gap-2.5">
          {FORMATOS.map((f) => (
            <OptionButton key={f} active={atuais.includes(f)} onClick={() => toggle(f)}>
              {f}
            </OptionButton>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext} disabled={atuais.length === 0}>
          CONTINUAR <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

const FREQUENCIAS = [
  "2 posts por semana",
  "3 posts por semana",
  "4 posts por semana",
  "5 posts por semana",
];

export function M2Frequencia({ answers, patchM2, onNext }) {
  const m2 = answers.m2 || DEFAULT_M2;
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Frequência</Eyebrow>
        <Title>Quantos posts por semana você consegue fazer?</Title>
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
          Escolha um número que você consegue manter. Constância vale mais do que volume.
        </p>
        <div className="flex flex-col gap-2.5">
          {FREQUENCIAS.map((f) => (
            <OptionButton
              key={f}
              active={m2.frequencia === f}
              onClick={() => patchM2({ frequencia: f })}
            >
              {f}
            </OptionButton>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext} disabled={!m2.frequencia}>
          VER MINHAS IDEIAS <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

export function M2Ideias({ answers, patchM2, onNext }) {
  const m2 = answers.m2 || DEFAULT_M2;
  const ideias = useMemo(() => gerarIdeias(answers), [answers]);
  const meta = DISTRIBUICAO[m2.frequencia]?.length || 3;
  const selecionadas = m2.ideiasSelecionadas || [];
  useEffect(() => {
    if (!selecionadas.length && ideias.length) {
      patchM2({ ideiasSelecionadas: ideias.slice(0, meta).map((i) => i.id) });
    }
  }, []);
  function toggle(id) {
    const set = new Set(selecionadas);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    patchM2({ ideiasSelecionadas: Array.from(set) });
  }
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Ideias de conteúdo</Eyebrow>
        <Title>Ideias feitas com as suas respostas</Title>
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
          Escolha pelo menos {meta} ideia{meta > 1 ? "s" : ""} para montar o calendário da semana.
        </p>
        <div className="flex flex-col gap-2.5">
          {ideias.map((i) => {
            const active = selecionadas.includes(i.id);
            return (
              <button
                key={i.id}
                onClick={() => toggle(i.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${
                  active ? "bg-yellow-50 border-yellow-300" : "bg-neutral-50 border-neutral-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-none ${
                      active ? "bg-yellow-400" : "bg-white border border-neutral-300"
                    }`}
                  >
                    {active && <Check size={13} className="text-neutral-900" />}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-yellow-600">
                    {i.pilar}
                  </span>
                </div>
                <p className="text-[13.5px] text-neutral-700 leading-relaxed">{i.texto}</p>
                <p className="mt-1.5 text-[12px] text-neutral-400">Formato indicado: {i.formato}</p>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext} disabled={selecionadas.length === 0}>
          MONTAR CALENDÁRIO <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

export function M2Calendario({ answers, onNext }) {
  const calendario = useMemo(() => montarCalendario(answers), [answers]);
  const m2 = answers.m2 || DEFAULT_M2;
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Calendário</Eyebrow>
        <Title>Sua semana de conteúdo</Title>
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
          {m2.frequencia
            ? `Distribuímos as ideias escolhidas em ${m2.frequencia.toLowerCase()}.`
            : "Distribuímos as ideias escolhidas ao longo da semana."}
        </p>
        <div className="flex flex-col gap-2.5">
          {calendario.map((c) => (
            <div
              key={c.dia}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-yellow-600" />
                <p
                  className="text-[13.5px] font-extrabold text-neutral-900"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  {c.dia}
                </p>
              </div>
              {c.ideia ? (
                <>
                  <p className="text-[13px] text-neutral-700 leading-relaxed">{c.ideia.texto}</p>
                  <p className="mt-1 text-[12px] text-neutral-400">
                    {c.ideia.pilar} · {c.ideia.formato}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-neutral-400">Dia livre</p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={onNext}>
          VER MEU PLANEJAMENTO <ArrowRight size={17} />
        </PrimaryButton>
      </div>
    </div>
  );
}

export function M2Final({ answers, onReset }) {
  const m2 = answers.m2 || DEFAULT_M2;
  const ideias = useMemo(() => gerarIdeias(answers), [answers]);
  const escolhidas = ideias.filter((i) => (m2.ideiasSelecionadas || []).includes(i.id));
  const calendario = useMemo(() => montarCalendario(answers), [answers]);
  const stories = useMemo(() => sugestoesStories(answers), [answers]);
  const periodo = m2.periodo
    ? `${m2.periodo} · ${periodoRange(m2.periodo, m2.periodoDataFim).label}`
    : "";

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center mb-5">
          <Sparkles size={22} className="text-neutral-900" />
        </div>
        <Title>Seu planejamento de conteúdo está pronto</Title>
        {periodo && <p className="text-[13px] text-neutral-400 mb-4">{periodo}</p>}

        <div className="flex items-center gap-2 mt-4 mb-2">
          <Layers size={14} className="text-yellow-600" />
          <p className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">
            Pilares escolhidos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(m2.pilares || []).map((p) => (
            <span
              key={p}
              className="px-3 py-1.5 rounded-xl bg-yellow-50 border border-yellow-200 text-[12.5px] font-semibold text-neutral-700"
            >
              {p}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-5 mb-2">
          <Camera size={14} className="text-yellow-600" />
          <p className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">
            Ideias e formato indicado
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {escolhidas.map((i) => (
            <Card key={i.id}>
              <p className="text-[13px] text-neutral-700 leading-relaxed">{i.texto}</p>
              <p className="mt-1 text-[12px] text-neutral-400">
                {i.pilar} · {i.formato}
              </p>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-5 mb-2">
          <Calendar size={14} className="text-yellow-600" />
          <p className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">
            Calendário da semana
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {calendario.map((c) => (
            <Card key={c.dia}>
              <p
                className="text-[13px] font-extrabold text-neutral-900"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {c.dia}
              </p>
              <p className="text-[12.5px] text-neutral-600 leading-relaxed mt-0.5">
                {c.ideia ? c.ideia.texto : "Dia livre"}
              </p>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-5 mb-2">
          <Clock size={14} className="text-yellow-600" />
          <p className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">
            Sugestões de Stories
          </p>
        </div>
        <ul className="flex flex-col gap-1.5">
          {stories.map((s, i) => (
            <li key={i} className="text-[13px] text-neutral-600 leading-relaxed flex gap-2">
              <span className="text-yellow-500 font-bold">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <button
          onClick={onReset}
          className="w-full border border-neutral-200 hover:border-yellow-400 transition-all text-neutral-800 font-bold text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          <RotateCcw size={16} /> REFAZER MEU PLANEJAMENTO
        </button>
      </div>
    </div>
  );
}
