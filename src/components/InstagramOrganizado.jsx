import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Instagram,
  User,
  AtSign,
  Camera,
  BookOpen,
  Link2,
  LayoutGrid,
  ClipboardCheck,
  Copy,
  RotateCcw,
  X,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import {
  DEFAULT_M2,
  MODULE2_STEPS,
  M2Intro,
  M2Pilares,
  M2Periodo,
  M2DataNegocio,
  M2DatasComerciais,
  M2Formatos,
  M2Frequencia,
  M2Ideias,
  M2Calendario,
  M2Final,
} from "./Modulo2.jsx";
import FotoAnalise from "./FotoAnalise.jsx";
import {
  PerfilStatus,
  NomeAnalise,
  ArrobaAnalise,
  BioDiagnostico,
  FotoRecomendacao,
  PerfilRecomendado,
} from "./Modulo1Screens.jsx";

/* ------------------------------------------------------------------ ARQUITETURA - answers + progress vivem num único fluxo de estado, com um "patch" central (patchAnswers / setProgress) — a persistência (safeLoad/safeSave/safeClear) só lê/escreve esse mesmo formato, então trocar de storage no futuro não exige mexer nas telas. - MODULE1_SECTIONS: config declarativa. Cada seção tem uma tela de entrada ("entry"). Seções sem "entry" ainda não foram construídas e aparecem como "Em breve" — novos módulos/seções entram como novos itens, sem mudar a navegação nem o hub. - screen + history: pilha simples (empilha ao avançar, desempilha no botão voltar). Também são persistidos. - STEP_GROUPS: mapeia cada sequência de telas para a barra de progresso, sem precisar de lógica especial por seção. ------------------------------------------------------------------- */ const FONT_DISPLAY =
  "'Manrope', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const STORAGE_KEY = "instagramOrganizado:v1";
const OBJETIVOS = [
  "Conseguir clientes",
  "Vender produtos",
  "Receber pedidos no WhatsApp",
  "Divulgar meu negócio",
  "Ser mais conhecido na minha região",
  "Ainda não sei",
];
const MODULE1_SECTIONS = [
  { id: "nomeArroba", label: "Nome e @", icon: AtSign, entry: "explainAt" },
  { id: "foto", label: "Foto de perfil", icon: Camera, entry: "foto1" },
  { id: "bio", label: "Bio", icon: BookOpen, entry: "bio1" },
  { id: "link", label: "Link e WhatsApp", icon: Link2, entry: "link1" },
  {
    id: "destaques",
    label: "Destaques",
    icon: LayoutGrid,
    entry: "destaques1",
  },
  {
    id: "revisao",
    label: "Revisão do perfil",
    icon: ClipboardCheck,
    entry: "revisao1",
  },
];
const ONBOARDING_STEPS = ["welcome", "q1", "q2", "q3", "q4", "summary", "perfilStatus"];
const NAMEAT_STEPS = ["explainAt", "explainNome", "howto", "nomeAnalise", "arrobaAnalise"];
const FOTO_STEPS = ["foto1", "fotoRec", "foto3"];
const BIO_STEPS = ["bio1", "bioStep1", "bioStep2", "bioStep3", "bioStep4", "bioResult"];
const LINK_STEPS = ["link1", "link2", "link3", "link4"];
const DESTAQUES_STEPS = ["destaques1", "destaques2", "destaques3", "destaques4"];
const REVISAO_STEPS = ["revisao1", "revisao2", "revisao3"];
const STEP_GROUPS = [
  { steps: ONBOARDING_STEPS, label: (i, n) => `Etapa ${i + 1} de ${n}` },
  { steps: NAMEAT_STEPS, label: (i, n) => `Nome e @ · Passo ${i + 1} de ${n}` },
  {
    steps: FOTO_STEPS,
    label: (i, n) => `Foto de perfil · Passo ${i + 1} de ${n}`,
  },
  { steps: BIO_STEPS, label: (i, n) => `Bio · Passo ${i + 1} de ${n}` },
  {
    steps: LINK_STEPS,
    label: (i, n) => `Link e WhatsApp · Passo ${i + 1} de ${n}`,
  },
  {
    steps: DESTAQUES_STEPS,
    label: (i, n) => `Destaques · Passo ${i + 1} de ${n}`,
  },
  {
    steps: REVISAO_STEPS,
    label: (i, n) => `Revisão do perfil · Passo ${i + 1} de ${n}`,
  },
  {
    steps: MODULE2_STEPS,
    label: (i, n) => `Estratégia de conteúdo · Passo ${i + 1} de ${n}`,
  },
];

const DEFAULT_ANSWERS = {
  negocio: "",
  oferece: "",
  comprador: "",
  objetivo: "",
  arroba: "",
  nome: "",
  temInstagram: "",
  nomeAtual: "",
  arrobaAtual: "",
  bioAtual: "",
  fotoLocalFeita: false,
  clareza: "",
  fotoEscolha: "",
  fotoAnalise: null,
  fotoIaUsada: false,
  fotoChecklist: {
    reconhecivel: false,
    legivelPequena: false,
    representaNegocio: false,
    combinaMarca: false,
  },
  bioOquefaz: "",
  bioOquefazSeeded: false,
  bioParaquem: "",
  bioOnde: "",
  bioOndeNA: false,
  bioProximoPasso: "",
  bioProximoPassoOutro: "",
  bioFinal: "",
  linkAtual: "",
  whatsappChecklist: {
    abreCorretamente: false,
    facilEncontrar: false,
    numeroCerto: false,
    mensagemClara: false,
    preparado: false,
  },
  whatsappMsg: "",
  whatsappMsgSeeded: false,
  destaquesSelecionados: [],
  teste5s: { quem: "", oQue: "", paraQuem: "", comoComprar: "" },
  m2: DEFAULT_M2,
};

const DEFAULT_PROGRESS = {
  nomeArroba: false,
  foto: false,
  bio: false,
  link: false,
  destaques: false,
  revisao: false,
};
/* ---------------------------- Persistência ---------------------------- */ function safeLoad() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    return null;
  }
}
function safeSave(data) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    /* Armazenamento indisponível ou cheio */
  }
}
function safeClear() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}
/* ---------------------------- Helpers de conteúdo ---------------------------- */ function capitalize(
  str,
) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function temaDoNegocio(answers) {
  return (answers.oferece || answers.negocio || "").trim();
}
function fotoEhServicoPessoal(negocio) {
  const n = (negocio || "").toLowerCase();
  const chaves = [
    "advogad",
    "eletric",
    "consultor",
    "coach",
    "personal",
    "corretor",
    "psicolog",
    "nutri",
    "cabeleireir",
    "designer",
    "fotograf",
    "professor",
    "arquitet",
    "contador",
    "dentista",
  ];
  return chaves.some((k) => n.includes(k));
}
function exemploBioBoa(negocio, oferece) {
  const tema = (oferece || negocio || "").trim();
  if (!tema) {
    return "Brigadeiros artesanais para festas e presentes\n📍 Belo Horizonte\n📲 Encomendas pelo WhatsApp";
  }
  return `${capitalize(tema)}, feitos para o seu momento especial\n📲 Peça pelo WhatsApp`;
}
const CTA_MAP = {
  "Chamar no WhatsApp": "📲 Peça pelo WhatsApp",
  "Fazer um pedido": "🛍️ Faça seu pedido pelo link",
  "Solicitar orçamento": "💬 Solicite seu orçamento",
  "Visitar meu site": "🔗 Visite meu site pelo link",
  "Ir até minha loja": "📍 Venha nos visitar",
  "Agendar atendimento": "🗓️ Agende seu horário",
};
function montarSugestaoDeBio(a) {
  const lines = [];
  const oQueFaz = a.bioOquefaz?.trim();
  const paraQuem = a.bioParaquem?.trim();
  let linha1 = oQueFaz ? capitalize(oQueFaz) : "";
  if (paraQuem) linha1 += linha1 ? ` para ${paraQuem}` : capitalize(paraQuem);
  if (linha1) lines.push(linha1);
  if (!a.bioOndeNA && a.bioOnde?.trim()) lines.push(`📍 ${a.bioOnde.trim()}`);
  if (a.bioProximoPasso === "Outro" && a.bioProximoPassoOutro?.trim()) {
    lines.push(`👉 ${a.bioProximoPassoOutro.trim()}`);
  } else if (a.bioProximoPasso && CTA_MAP[a.bioProximoPasso]) {
    lines.push(CTA_MAP[a.bioProximoPasso]);
  }
  return lines.join("\n");
}
function linkTipByObjetivo(objetivo) {
  const mapa = {
    "Receber pedidos no WhatsApp":
      "Como seu principal objetivo é receber pedidos pelo WhatsApp, esse provavelmente deve ser o caminho mais fácil de encontrar no seu perfil.",
    "Vender produtos":
      "Como seu objetivo é vender produtos, vale priorizar um link que leve direto para pedidos ou catálogo.",
    "Conseguir clientes":
      "Como seu objetivo é conseguir clientes, um link direto para o WhatsApp ou um formulário de contato tende a funcionar melhor.",
    "Ser mais conhecido na minha região":
      "Como seu objetivo é ficar mais conhecido na região, um link com informações completas sobre o negócio pode ajudar mais do que um único contato.",
    "Divulgar meu negócio":
      "Como seu objetivo é divulgar o negócio, vale ter um link que mostre rapidamente o que você oferece.",
  };
  return mapa[objetivo] || "";
}
const WHATSAPP_MSG_TEMPLATES = {
  "Receber pedidos no WhatsApp": "Olá! Vim pelo Instagram e gostaria de fazer um pedido.",
  "Vender produtos": "Olá! Vim pelo Instagram e gostaria de fazer um pedido.",
  "Conseguir clientes": "Olá! Vi seu perfil no Instagram e gostaria de solicitar um orçamento.",
  "Divulgar meu negócio":
    "Olá! Vi seu perfil no Instagram e queria saber mais sobre o seu trabalho.",
  "Ser mais conhecido na minha região":
    "Olá! Vi seu perfil no Instagram e queria saber mais sobre o seu trabalho.",
  "Ainda não sei": "Olá! Vi seu perfil no Instagram e gostaria de mais informações.",
};
function mensagemInicialSugerida(objetivo) {
  return (
    WHATSAPP_MSG_TEMPLATES[objetivo] ||
    "Olá! Vi seu perfil no Instagram e gostaria de mais informações."
  );
}
const FULL_DESTAQUE_CATEGORIAS = [
  "Sobre",
  "Produtos ou Serviços",
  "Como comprar",
  "Depoimentos",
  "Resultados",
  "Dúvidas",
  "Localização",
  "Horários",
  "Cardápio",
  "Valores",
  "Bastidores",
  "Contato",
];
function sugerirDestaques(negocio) {
  const n = (negocio || "").toLowerCase();
  const base = new Set(["Sobre", "Como comprar", "Depoimentos", "Contato"]);
  if (
    ["doce", "comida", "restaurante", "marmita", "lanchonete", "confeitaria"].some((k) =>
      n.includes(k),
    )
  ) {
    base.add("Cardápio");
    base.add("Valores");
  }
  if (["loja", "roupa", "moda", "semij", "joia"].some((k) => n.includes(k))) {
    base.add("Produtos ou Serviços");
    base.add("Valores");
  }
  if (["clínic", "dentist", "saúde", "estétic", "consultóri"].some((k) => n.includes(k))) {
    base.add("Resultados");
    base.add("Dúvidas");
  }
  if (["salão", "cabeleireir", "beleza", "barbearia"].some((k) => n.includes(k))) {
    base.add("Resultados");
    base.add("Valores");
  }
  return Array.from(base);
}
const CONTEUDO_DESTAQUE = {
  Sobre: [
    "Quem está por trás do negócio",
    "Sua história em poucas palavras",
    "O que te diferencia",
  ],
  "Produtos ou Serviços": [
    "Principais produtos ou serviços",
    "Fotos ou vídeos curtos do que você oferece",
  ],
  "Como comprar": ["Como pedir", "Formas de pagamento", "Prazo", "Entrega ou retirada", "WhatsApp"],
  Depoimentos: [
    "Prints de clientes",
    "Vídeos curtos",
    "Avaliações",
    "Resultados",
    "Antes e depois, quando fizer sentido",
  ],
  Resultados: ["Fotos de trabalhos entregues", "Números ou conquistas", "Transformações"],
  Dúvidas: ["Perguntas frequentes", "Respostas rápidas sobre prazo, garantia, forma de uso"],
  Localização: ["Endereço", "Mapa", "Ponto de referência", "Horário"],
  Horários: ["Dias e horários de atendimento", "Exceções em feriados"],
  Cardápio: ["Fotos dos itens", "Preços", "Promoções do dia"],
  Valores: ["Faixa de preço", "O que está incluso", "Formas de pagamento"],
  Bastidores: ["Processo de produção", "Dia a dia do negócio", "Equipe"],
  Contato: ["WhatsApp", "Telefone", "E-mail", "Redes sociais"],
};
const AREA_POR_PERGUNTA = {
  quem: "Nome e @ e Foto de perfil",
  oQue: "Bio",
  paraQuem: "Bio",
  comoComprar: "Link e WhatsApp",
};
/* ------------------------------ App ------------------------------ */ export default function InstagramOrganizado() {
  const [persisted] = useState(() => safeLoad());
  const [screen, setScreen] = useState(persisted?.screen || "welcome");
  const [history, setHistory] = useState(persisted?.history || []);
  const [answers, setAnswers] = useState({
    ...DEFAULT_ANSWERS,
    ...(persisted?.answers || {}),
    m2: { ...DEFAULT_M2, ...(persisted?.answers?.m2 || {}) },
  });

  const [progress, setProgress] = useState({
    ...DEFAULT_PROGRESS,
    ...(persisted?.progress || {}),
  });
  const [lastCompletedLabel, setLastCompletedLabel] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  useEffect(() => {
    safeSave({ screen, history, answers, progress });
  }, [screen, history, answers, progress]);
  function goTo(next) {
    setHistory((h) => [...h, screen]);
    setScreen(next);
  }
  function goBack() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const copy = [...h];
      const prev = copy.pop();
      setScreen(prev);
      return copy;
    });
  }
  /* -------- Botão "voltar" do celular/navegador navega entre as telas -------- */
  const backNav = useRef({ depth: 0, ignore: 0 });
  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;
  useEffect(() => {
    if (typeof window === "undefined") return;
    backNav.current.depth = 0;
    try {
      window.history.replaceState({ ioDepth: 0 }, "");
    } catch (e) {}
    function onPop() {
      if (backNav.current.ignore > 0) {
        backNav.current.ignore -= 1;
        return;
      }
      if (backNav.current.depth > 0) {
        backNav.current.depth -= 1;
        goBackRef.current();
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const depth = history.length;
    const prev = backNav.current.depth;
    if (depth > prev) {
      for (let i = prev; i < depth; i++) {
        try {
          window.history.pushState({ ioDepth: i + 1 }, "");
        } catch (e) {}
      }
    } else if (depth < prev) {
      backNav.current.ignore += prev - depth;
      try {
        window.history.go(-(prev - depth));
      } catch (e) {
        backNav.current.ignore = 0;
      }
    }
    backNav.current.depth = depth;
  }, [history.length]);
  function patchAnswers(patch) {
    setAnswers((a) => ({ ...a, ...patch }));
  }
  function setAnswer(key, value) {
    patchAnswers({ [key]: value });
  }
  function patchM2(patch) {
    setAnswers((a) => ({ ...a, m2: { ...DEFAULT_M2, ...(a.m2 || {}), ...patch } }));
  }
  function resetModule2() {
    // Apaga somente as respostas do Módulo 2. O Módulo 1 permanece salvo.
    setAnswers((a) => ({ ...a, m2: { ...DEFAULT_M2 } }));
    setHistory([]);
    setScreen("m2Intro");
  }

  function completeSection(sectionId, label, nextScreen = "module1Hub") {
    setProgress((p) => ({ ...p, [sectionId]: true }));
    setLastCompletedLabel(label);
    setJustCompleted(nextScreen === "module1Hub");
    setHistory([]);
    setScreen(nextScreen);
  }
  function resetAll() {
    // Apaga somente a chave deste aplicativo (nunca localStorage.clear()).
    safeClear();
    setAnswers({ ...DEFAULT_ANSWERS, m2: { ...DEFAULT_M2 } });
    setProgress({ ...DEFAULT_PROGRESS });
    setHistory([]);
    setJustCompleted(false);
    setLastCompletedLabel("");
    setShowResetConfirm(false);
    setScreen("welcome");
  }

  const progressInfo = useMemo(() => {
    for (const group of STEP_GROUPS) {
      const i = group.steps.indexOf(screen);
      if (i >= 0) {
        return {
          label: group.label(i, group.steps.length),
          fraction: (i + 1) / group.steps.length,
        };
      }
    }
    return null;
  }, [screen]);
  const showBack = history.length > 0 && screen !== "welcome";
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-neutral-100 py-6 px-3"
      style={{ fontFamily: FONT_BODY }}
    >
      {" "}
      <style>{` @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600;700&display=swap'); @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } } .io-anim { animation: fadeInUp .28s ease both; } .io-scroll::-webkit-scrollbar { width: 4px; } .io-scroll::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 4px; } `}</style>{" "}
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col"
        style={{ height: "820px", maxHeight: "92vh" }}
      >
        {" "}
        {/* Header */}{" "}
        <div className="flex-none px-5 pt-5 pb-3 border-b border-neutral-100 bg-white">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            {showBack ? (
              <button
                onClick={goBack}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-700 flex-none"
                aria-label="Voltar"
              >
                {" "}
                <ArrowLeft size={16} />{" "}
              </button>
            ) : (
              <div className="w-8 h-8 flex-none flex items-center justify-center rounded-full bg-yellow-400">
                {" "}
                <Instagram size={16} className="text-neutral-900" />{" "}
              </div>
            )}{" "}
            <div className="min-w-0 flex-1">
              {" "}
              <p
                className="text-[13px] font-bold text-neutral-900 truncate"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {" "}
                Instagram Organizado{" "}
              </p>{" "}
              {progressInfo && (
                <p className="text-[11px] text-neutral-400 truncate">{progressInfo.label}</p>
              )}{" "}
            </div>{" "}
            {screen !== "welcome" && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-8 h-8 flex-none flex items-center justify-center rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label="Recomeçar meu planejamento"
                title="Recomeçar meu planejamento"
              >
                <RotateCcw size={14} />
              </button>
            )}{" "}
          </div>{" "}
          {progressInfo && (
            <div className="mt-3 h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">

              {" "}
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${progressInfo.fraction * 100}%` }}
              />{" "}
            </div>
          )}{" "}
        </div>{" "}
        {/* Content */}{" "}
        <div key={screen} className="io-anim io-scroll flex-1 overflow-y-auto px-5 py-6">
          {" "}
          {screen === "welcome" && <Welcome onStart={() => goTo("q1")} />}{" "}
          {screen === "q1" && (
            <QuestionText
              title="Qual é o seu negócio?"
              hint="Salão de beleza, doceria, loja de roupas, marmitas, clínica, advogado, eletricista, restaurante etc."
              value={answers.negocio}
              onChange={(v) => setAnswer("negocio", v)}
              onNext={() => goTo("q2")}
            />
          )}{" "}
          {screen === "q2" && (
            <QuestionText
              title="O que você vende ou oferece?"
              hint="Descreva com suas palavras, do jeito que você explicaria para um cliente."
              value={answers.oferece}
              onChange={(v) => setAnswer("oferece", v)}
              onNext={() => goTo("q3")}
            />
          )}{" "}
          {screen === "q3" && (
            <QuestionText
              title="Quem normalmente compra de você?"
              hint="Não sabe responder? Tudo bem. Vamos descobrir juntos."
              hintIsNote
              value={answers.comprador}
              onChange={(v) => setAnswer("comprador", v)}
              onNext={() => goTo("q4")}
            />
          )}{" "}
          {screen === "q4" && (
            <QuestionChoice
              title="Qual é o seu principal objetivo com o Instagram?"
              options={OBJETIVOS}
              value={answers.objetivo}
              onSelect={(v) => setAnswer("objetivo", v)}
              onNext={() => goTo("summary")}
            />
          )}{" "}
          {screen === "summary" && (
            <DiagnosticSummary answers={answers} onStart={() => goTo("perfilStatus")} />
          )}{" "}
          {screen === "perfilStatus" && (
            <PerfilStatus
              value={answers.temInstagram}
              onSelect={(v) => setAnswer("temInstagram", v)}
              onNext={() => goTo("module1Hub")}
            />
          )}{" "}
          {screen === "module1Hub" && (
            <Module1Hub
              progress={progress}
              justCompleted={justCompleted}
              lastCompletedLabel={lastCompletedLabel}
              onOpenSection={(entry) => {
                setJustCompleted(false);
                goTo(entry);
              }}
              onAskReset={() => setShowResetConfirm(true)}
            />
          )}{" "}
          {screen === "explainAt" && <ExplainAt onNext={() => goTo("explainNome")} />}{" "}
          {screen === "explainNome" && (
            <ExplainNome
              exampleArroba={answers.arroba || "@docesdalu"}
              exampleNome={answers.nome || "Luana | Doces e Brigadeiros"}
              onNext={() => goTo("howto")}
            />
          )}{" "}
          {screen === "howto" && <HowTo onNext={() => goTo("nomeAnalise")} />}{" "}
          {screen === "nomeAnalise" && (
            <NomeAnalise
              answers={answers}
              patchAnswers={patchAnswers}
              onNext={() => goTo("arrobaAnalise")}
            />
          )}{" "}
          {screen === "arrobaAnalise" && (
            <ArrobaAnalise
              answers={answers}
              patchAnswers={patchAnswers}
              onNext={() => completeSection("nomeArroba", "Nome e @")}
            />
          )}{" "}
          {screen === "foto1" && <Foto1Explica answers={answers} onNext={() => goTo("fotoRec")} />}{" "}
          {screen === "fotoRec" && (
            <FotoRecomendacao
              answers={answers}
              patchAnswers={patchAnswers}
              onNext={() => goTo("foto3")}
            />
          )}{" "}
          {screen === "foto3" && (
            <FotoAnalise
              answers={answers}
              patchAnswers={patchAnswers}
              onFinish={() => completeSection("foto", "Foto de perfil")}
            />
          )}{" "}
          {screen === "bio1" && (
            <Bio1Explica
              answers={answers}
              onNext={() => {
                if (!answers.bioOquefazSeeded) {
                  patchAnswers({
                    bioOquefaz: answers.bioOquefaz || answers.oferece || "",
                    bioOquefazSeeded: true,
                  });
                }
                goTo("bioStep1");
              }}
            />
          )}{" "}
          {screen === "bioStep1" && (
            <BioStep
              stepLabel="O que você vende ou faz?"
              hint="Trouxemos o que você respondeu no diagnóstico como sugestão. Edite ou apague à vontade."
              value={answers.bioOquefaz}
              placeholder="Ex: brigadeiros artesanais, cortes femininos, marmitas fitness..."
              onChange={(v) => setAnswer("bioOquefaz", v)}
              onNext={() => goTo("bioStep2")}
            />
          )}{" "}
          {screen === "bioStep2" && (
            <BioStep
              stepLabel="Para quem você vende?"
              hint="Pense em quem mais compra de você hoje."
              value={answers.bioParaquem}
              placeholder="Ex: festas e aniversários, mulheres da região, empresas locais..."
              onChange={(v) => setAnswer("bioParaquem", v)}
              onNext={() => goTo("bioStep3")}
              optional
            />
          )}{" "}
          {screen === "bioStep3" && (
            <BioStep3Local
              answers={answers}
              setAnswer={setAnswer}
              patchAnswers={patchAnswers}
              onNext={() => goTo("bioStep4")}
            />
          )}{" "}
          {screen === "bioStep4" && (
            <BioStep4Cta
              answers={answers}
              setAnswer={setAnswer}
              onNext={() => {
                const sugestao = montarSugestaoDeBio({ ...answers });
                setAnswer("bioFinal", sugestao);
                goTo("bioResult");
              }}
            />
          )}{" "}
          {screen === "bioResult" && (
            <BioDiagnostico
              answers={answers}
              patchAnswers={patchAnswers}
              onFinish={() => completeSection("bio", "Bio")}
            />
          )}{" "}
          {screen === "link1" && <Link1Explica answers={answers} onNext={() => goTo("link2")} />}{" "}
          {screen === "link2" && (
            <Link2Escolha answers={answers} setAnswer={setAnswer} onNext={() => goTo("link3")} />
          )}{" "}
          {screen === "link3" && (
            <Link3Whatsapp
              answers={answers}
              patchAnswers={patchAnswers}
              onNext={() => goTo("link4")}
            />
          )}{" "}
          {screen === "link4" && (
            <Link4Mensagem
              answers={answers}
              patchAnswers={patchAnswers}
              onFinish={() => completeSection("link", "Link e WhatsApp")}
            />
          )}{" "}
          {screen === "destaques1" && <Destaques1Explica onNext={() => goTo("destaques2")} />}{" "}
          {screen === "destaques2" && (
            <Destaques2Selecao
              answers={answers}
              setAnswer={setAnswer}
              onNext={() => goTo("destaques3")}
            />
          )}{" "}
          {screen === "destaques3" && (
            <Destaques3Conteudo answers={answers} onNext={() => goTo("destaques4")} />
          )}{" "}
          {screen === "destaques4" && (
            <Destaques4Capas onFinish={() => completeSection("destaques", "Destaques")} />
          )}{" "}
          {screen === "revisao1" && (
            <Revisao1Checklist progress={progress} onNext={() => goTo("revisao2")} />
          )}{" "}
          {screen === "revisao2" && (
            <Revisao2Teste5s
              answers={answers}
              setAnswer={setAnswer}
              onNext={() => goTo("revisao3")}
            />
          )}{" "}
          {screen === "revisao3" && (
            <PerfilRecomendado
              answers={answers}
              onFinish={() => completeSection("revisao", "Revisão do perfil", "m2Intro")}
            />
          )}{" "}
          {screen === "module2ComingSoon" && (
            <Module2ComingSoon onBack={() => goTo("module1Hub")} />
          )}{" "}
          {screen === "m2Intro" && <M2Intro answers={answers} onNext={() => goTo("m2Pilares")} />}{" "}
          {screen === "m2Pilares" && (
            <M2Pilares answers={answers} patchM2={patchM2} onNext={() => goTo("m2Periodo")} />
          )}{" "}
          {screen === "m2Periodo" && (
            <M2Periodo answers={answers} patchM2={patchM2} onNext={() => goTo("m2DataNegocio")} />
          )}{" "}
          {screen === "m2DataNegocio" && (
            <M2DataNegocio
              answers={answers}
              patchM2={patchM2}
              onNext={() => goTo("m2DatasComerciais")}
            />
          )}{" "}
          {screen === "m2DatasComerciais" && (
            <M2DatasComerciais
              answers={answers}
              patchM2={patchM2}
              onNext={() => goTo("m2Formatos")}
            />
          )}{" "}
          {screen === "m2Formatos" && (
            <M2Formatos answers={answers} patchM2={patchM2} onNext={() => goTo("m2Frequencia")} />
          )}{" "}
          {screen === "m2Frequencia" && (
            <M2Frequencia answers={answers} patchM2={patchM2} onNext={() => goTo("m2Ideias")} />
          )}{" "}
          {screen === "m2Ideias" && (
            <M2Ideias answers={answers} patchM2={patchM2} onNext={() => goTo("m2Calendario")} />
          )}{" "}
          {screen === "m2Calendario" && (
            <M2Calendario
              answers={answers}
              onNext={() => {
                patchM2({ concluido: true });
                goTo("m2Final");
              }}
            />
          )}{" "}
          {screen === "m2Final" && <M2Final answers={answers} onReset={resetModule2} />}{" "}
        </ErroTela>{" "}
        </div>{" "}
      </div>{" "}
      {showResetConfirm && (
        <ResetConfirmModal onCancel={() => setShowResetConfirm(false)} onConfirm={resetAll} />
      )}{" "}
    </div>
  );
}
/* ---------------------------- Componentes base ---------------------------- */ function PrimaryButton({
  children,
  onClick,
  disabled,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-yellow-400 disabled:bg-neutral-100 disabled:text-neutral-300 hover:enabled:bg-yellow-300 active:enabled:scale-[0.98] transition-all text-neutral-900 font-bold text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      {" "}
      {children}{" "}
    </button>
  );
}
function SectionEyebrow({ children }) {
  return (
    <p className="text-[11px] font-bold tracking-wide text-yellow-600 uppercase mb-2">{children}</p>
  );
}
function ChecklistToggle({ checked, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${checked ? "bg-yellow-50 border-yellow-300" : "bg-neutral-50 border-neutral-200"}`}
    >
      {" "}
      <div
        className={`w-5 h-5 rounded-md flex items-center justify-center flex-none ${checked ? "bg-yellow-400" : "bg-white border border-neutral-300"}`}
      >
        {" "}
        {checked && <Check size={12} className="text-neutral-900" strokeWidth={3} />}{" "}
      </div>{" "}
      <span className="text-[13.5px] font-semibold text-neutral-700">{label}</span>{" "}
    </button>
  );
}
function NumberedSteps({ steps }) {
  return (
    <div className="flex flex-col gap-3">
      {" "}
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-3">
          {" "}
          <div className="w-6 h-6 rounded-full bg-yellow-400 text-neutral-900 text-[12px] font-extrabold flex items-center justify-center flex-none mt-0.5">
            {" "}
            {i + 1}{" "}
          </div>{" "}
          <p className="text-[13.5px] text-neutral-700 leading-relaxed pt-0.5">{s}</p>{" "}
        </div>
      ))}{" "}
    </div>
  );
}
/* ---------------------------- Onboarding ---------------------------- */ function Welcome({
  onStart,
}) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center mb-6">
          {" "}
          <Instagram size={22} className="text-neutral-900" />{" "}
        </div>{" "}
        <h1
          className="text-[26px] leading-tight font-extrabold text-neutral-900 mb-3"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Seu Instagram organizado, passo a passo.{" "}
        </h1>{" "}
        <p className="text-[15px] text-neutral-500 leading-relaxed">
          {" "}
          Você não precisa entender de marketing. Aqui você vai aprender o que cada parte do seu
          Instagram significa e organizar seu perfil de acordo com o seu negócio.{" "}
        </p>{" "}
      </div>{" "}
      <PrimaryButton onClick={onStart}>
        {" "}
        ORGANIZAR MEU INSTAGRAM <ArrowRight size={17} />{" "}
      </PrimaryButton>{" "}
    </div>
  );
}
function QuestionText({ title, hint, hintIsNote, value, onChange, onNext }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <h2
          className="text-[21px] font-extrabold text-neutral-900 mb-4 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          {title}{" "}
        </h2>{" "}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          placeholder="Digite aqui..."
        />{" "}
        {hint && (
          <p
            className={`mt-3 text-[13px] leading-relaxed ${hintIsNote ? "text-neutral-500 italic" : "text-neutral-400"}`}
          >
            {" "}
            {hint}{" "}
          </p>
        )}{" "}
      </div>{" "}
      <PrimaryButton onClick={onNext} disabled={!value.trim()}>
        {" "}
        CONTINUAR <ArrowRight size={17} />{" "}
      </PrimaryButton>{" "}
    </div>
  );
}
function QuestionChoice({ title, options, value, onSelect, onNext }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <h2
          className="text-[21px] font-extrabold text-neutral-900 mb-5 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          {title}{" "}
        </h2>{" "}
        <div className="flex flex-col gap-2.5">
          {" "}
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl border text-[14.5px] font-semibold transition-all ${value === opt ? "bg-yellow-400 border-yellow-400 text-neutral-900" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300"}`}
            >
              {" "}
              {opt}{" "}
            </button>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext} disabled={!value}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function DiagnosticSummary({ answers, onStart }) {
  const tema = temaDoNegocio(answers);
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center mb-6">
          {" "}
          <Check size={22} className="text-neutral-900" strokeWidth={3} />{" "}
        </div>{" "}
        <h2
          className="text-[22px] font-extrabold text-neutral-900 mb-3 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Perfeito. Agora vamos começar organizando a parte mais importante: seu perfil.{" "}
        </h2>{" "}
        <p className="text-[14.5px] text-neutral-500 leading-relaxed">
          {" "}
          {tema
            ? `Anotamos que você trabalha com ${tema}. Vamos usar isso nos exemplos dos próximos passos.`
            : "A partir das suas respostas, vamos te mostrar exatamente onde mexer no Instagram e por que cada ajuste importa para o seu negócio."}{" "}
        </p>{" "}
      </div>{" "}
      <PrimaryButton onClick={onStart}>
        {" "}
        COMEÇAR MEU PERFIL <ArrowRight size={17} />{" "}
      </PrimaryButton>{" "}
    </div>
  );
}
/* ---------------------------- Hub do Módulo 1 ---------------------------- */ function Module1Hub({
  progress,
  justCompleted,
  lastCompletedLabel,
  onOpenSection,
  onAskReset,
}) {
  return (
    <div className="h-full flex flex-col">
      {" "}
      <h2
        className="text-[20px] font-extrabold text-neutral-900 mb-1"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        {" "}
        Módulo 1{" "}
      </h2>{" "}
      <p className="text-[14px] text-neutral-500 mb-5">Organizando seu perfil</p>{" "}
      {justCompleted && (
        <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
          {" "}
          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center flex-none">
            {" "}
            <Check size={13} className="text-neutral-900" strokeWidth={3} />{" "}
          </div>{" "}
          <p className="text-[13px] font-semibold text-neutral-700">
            "{lastCompletedLabel}" concluído. A próxima área já foi liberada.
          </p>{" "}
        </div>
      )}{" "}
      <div className="flex flex-col gap-2.5">
        {" "}
        {MODULE1_SECTIONS.map((s, i) => {
          const Icon = s.icon;
          const done = progress[s.id];
          const prev = MODULE1_SECTIONS[i - 1];
          const unlocked = s.entry !== null && (i === 0 || (prev && progress[prev.id]));
          return (
            <button
              key={s.id}
              disabled={!unlocked}
              onClick={unlocked ? () => onOpenSection(s.entry) : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all ${!unlocked ? "bg-neutral-50 border-neutral-100 opacity-60 cursor-not-allowed" : "bg-white border-neutral-200 hover:border-yellow-400 active:scale-[0.99]"}`}
            >
              {" "}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none ${done ? "bg-yellow-400" : "bg-neutral-100"}`}
              >
                {" "}
                {done ? (
                  <Check size={16} className="text-neutral-900" strokeWidth={3} />
                ) : !unlocked ? (
                  <Lock size={14} className="text-neutral-400" />
                ) : (
                  <Icon size={16} className="text-neutral-600" />
                )}{" "}
              </div>{" "}
              <div className="flex-1 min-w-0">
                {" "}
                <p className="text-[14px] font-bold text-neutral-800 truncate">
                  {" "}
                  {i + 1}. {s.label}{" "}
                </p>{" "}
                <p className="text-[11.5px] text-neutral-400">
                  {done ? "Concluído" : !unlocked ? "Em breve" : "Disponível agora"}
                </p>{" "}
              </div>{" "}
            </button>
          );
        })}{" "}
      </div>{" "}
      <button
        onClick={onAskReset}
        className="mt-6 self-center flex items-center gap-1.5 text-[12px] font-semibold text-neutral-400 hover:text-neutral-600"
      >
        {" "}
        <RotateCcw size={12} /> Recomeçar meu planejamento{" "}
      </button>{" "}
    </div>
  );
}
function ResetConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-6 z-50">
      {" "}
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs io-anim">
        {" "}
        <div className="flex items-center justify-between mb-4">
          {" "}
          <p
            className="text-[16px] font-extrabold text-neutral-900"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {" "}
            Recomeçar seu planejamento?{" "}
          </p>{" "}
          <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-600">
            {" "}
            <X size={18} />{" "}
          </button>{" "}
        </div>{" "}
        <p className="text-[13.5px] text-neutral-500 leading-relaxed mb-6">
          {" "}
          Isso vai apagar todas as suas respostas e recomeçar o Módulo 1 e o Módulo 2 do zero. Essa
          ação não pode ser desfeita.{" "}
        </p>{" "}
        <div className="flex flex-col gap-2">
          {" "}
          <button
            onClick={onConfirm}
            className="w-full bg-neutral-900 text-white font-bold text-[14px] py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
          >
            {" "}
            SIM, RECOMEÇAR{" "}
          </button>{" "}
          <button
            onClick={onCancel}
            className="w-full bg-neutral-100 text-neutral-700 font-bold text-[14px] py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
          >
            {" "}
            CANCELAR{" "}
          </button>{" "}

        </div>{" "}
      </div>{" "}
    </div>
  );
}
/* ------------------------ Nome e @ ------------------------ */ function ExplainAt({ onNext }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Nome, @ e foto de perfil</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-4"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          O que é o @?{" "}
        </h2>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-4">
          {" "}
          <p className="text-[14.5px] text-neutral-700 leading-relaxed">
            {" "}
            O <strong>@</strong>, também chamado de nome de usuário, é o endereço da sua conta no
            Instagram. É por ele que as pessoas te encontram e te marcam.{" "}
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
          {" "}
          <AtSign size={16} className="text-yellow-600 flex-none" />{" "}
          <p className="text-[14px] font-bold text-neutral-800">@docesdalu</p>{" "}
        </div>{" "}
        <p className="text-[13px] text-neutral-500 leading-relaxed mt-4">
          {" "}
          Ele deve ser simples, fácil de escrever, fácil de falar em voz alta e fácil de lembrar —
          pense em como você diria seu @ para um cliente pelo telefone.{" "}
        </p>{" "}
      </div>{" "}
      <PrimaryButton onClick={onNext}>
        {" "}
        CONTINUAR <ArrowRight size={17} />{" "}
      </PrimaryButton>{" "}
    </div>
  );
}
function ProfilePreview({ arroba, nome }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4">
      {" "}
      <div className="flex items-center gap-3">
        {" "}
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center flex-none">
          {" "}
          <User size={22} className="text-neutral-300" />{" "}
        </div>{" "}
        <div className="min-w-0">
          {" "}
          <p className="text-[15px] font-extrabold text-neutral-900 truncate">{nome}</p>{" "}
          <p className="text-[12.5px] text-neutral-400 truncate">{arroba}</p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px]">
        {" "}
        <div className="flex items-center gap-1">
          {" "}
          <span className="w-2 h-2 rounded-full bg-yellow-400" />{" "}
          <span className="text-neutral-500">@ = endereço da conta</span>{" "}
        </div>{" "}
        <div className="flex items-center gap-1">
          {" "}
          <span className="w-2 h-2 rounded-full bg-neutral-300" />{" "}
          <span className="text-neutral-500">Nome = o que você faz</span>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
function ExplainNome({ exampleArroba, exampleNome, onNext }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Nome, @ e foto de perfil</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-4"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          E o que é o Nome?{" "}
        </h2>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-4">
          {" "}
          <p className="text-[14.5px] text-neutral-700 leading-relaxed">
            {" "}
            O <strong>Nome</strong> é outro campo do perfil, separado do @. Ele pode ajudar as
            pessoas a entenderem rapidamente o que a sua empresa faz, mesmo sem conhecer o seu
            @.{" "}
          </p>{" "}
        </div>{" "}
        <ProfilePreview arroba={exampleArroba} nome={exampleNome} />{" "}
      </div>{" "}
      <div className="mt-4">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function HowTo({ onNext }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Nome, @ e foto de perfil</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-5"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Como editar{" "}
        </h2>{" "}
        <NumberedSteps
          steps={[
            "Abra o Instagram.",
            "Entre no seu perfil.",
            'Toque em "Editar perfil".',
            'Procure "Nome" e "Nome de usuário".',
          ]}
        />{" "}
      </div>{" "}
      <div className="mt-6">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          AGORA VAMOS OLHAR O SEU <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
/* ------------------------ Foto de perfil ------------------------ */ function MiniAvatarBoa() {
  return (
    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center flex-none">
      {" "}
      <span
        className="text-yellow-400 text-[22px] font-extrabold"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        {" "}
        D{" "}
      </span>{" "}
    </div>
  );
}
function MiniAvatarDificil() {
  return (
    <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center flex-none relative overflow-hidden">
      {" "}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] p-1 opacity-70">
        {" "}
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-neutral-400 rounded-[2px]" />
        ))}{" "}
      </div>{" "}
      <span className="relative text-[8px] font-bold text-neutral-600 bg-white/70 px-1 rounded">
        TEXTO
      </span>{" "}
    </div>
  );
}
function Foto1Explica({ answers, onNext }) {
  const ehServico = fotoEhServicoPessoal(answers.negocio);
  const tema = temaDoNegocio(answers);
  let dica;
  if (ehServico) {
    dica =
      "Como você presta um serviço com atendimento pessoal, sua própria foto de rosto costuma passar mais confiança do que um logotipo.";
  } else if (tema) {
    dica = `Como seu negócio é sobre ${tema}, um logotipo simples ajuda a reforçar sua marca em todo o Instagram.`;
  } else {
    dica =
      "Empresas costumam usar um logotipo simples; prestadores de serviço com atendimento pessoal costumam usar a própria foto de rosto.";
  }
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Foto de perfil</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-4"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Para que serve a foto de perfil?{" "}
        </h2>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-4">
          {" "}
          <p className="text-[14.5px] text-neutral-700 leading-relaxed">
            {" "}
            É a imagem pequena e redonda que aparece em todo canto: nos posts, nos stories, nos
            comentários e nas mensagens. Muitas vezes é a primeira coisa que alguém vê, antes mesmo
            de abrir o seu perfil.{" "}
          </p>{" "}
        </div>{" "}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
          {" "}
          <p className="text-[13.5px] text-neutral-700 leading-relaxed">{dica}</p>{" "}
        </div>{" "}
        <p className="text-[13px] font-bold text-neutral-500 uppercase tracking-wide mb-3">
          Compare os dois exemplos
        </p>{" "}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {" "}
          <div className="bg-white border border-neutral-200 rounded-2xl p-3 flex flex-col items-center text-center">
            {" "}
            <MiniAvatarBoa />{" "}
            <p className="text-[12px] font-bold text-neutral-800 mt-2">Boa foto</p>{" "}
            <p className="text-[10.5px] text-neutral-400 leading-snug">
              Logo simples e legível
            </p>{" "}
          </div>{" "}
          <div className="bg-white border border-neutral-200 rounded-2xl p-3 flex flex-col items-center text-center">
            {" "}
            <MiniAvatarDificil />{" "}
            <p className="text-[12px] font-bold text-neutral-800 mt-2">
              Difícil de identificar
            </p>{" "}
            <p className="text-[10.5px] text-neutral-400 leading-snug">
              Imagem cheia de elementos e texto
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <p className="text-[13px] text-neutral-500 leading-relaxed">
          {" "}
          Em telas de celular a foto aparece bem pequena. Textos miúdos e imagens com muitos
          elementos ficam ilegíveis — quanto mais simples, melhor ela funciona.{" "}
        </p>{" "}
      </div>{" "}
      <div className="mt-4">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
/* ------------------------ Bio ------------------------ */ function Bio1Explica({
  answers,
  onNext,
}) {
  const exemploBom = exemploBioBoa(answers.negocio, answers.oferece);
  const tema = temaDoNegocio(answers);
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Bio</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-4"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          O que é a bio?{" "}
        </h2>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-4">
          {" "}
          <p className="text-[14.5px] text-neutral-700 leading-relaxed">
            {" "}
            A bio é o texto curto — até 150 caracteres — que fica logo abaixo do seu nome, no topo
            do perfil. É uma das primeiras coisas que a pessoa lê ao entrar na sua conta.{" "}
          </p>{" "}
        </div>{" "}
        <p className="text-[13px] font-bold text-neutral-500 uppercase tracking-wide mb-2">
          Uma boa bio ajuda a pessoa a entender rápido:
        </p>{" "}
        <div className="mb-5">
          {" "}
          <NumberedSteps
            steps={[
              "O que a empresa faz.",
              "Para quem é.",
              "Onde atende, quando isso for relevante.",
              "Qual deve ser o próximo passo.",
            ]}
          />{" "}
        </div>{" "}
        <p className="text-[12px] font-bold text-red-400 uppercase tracking-wide mb-2">
          Exemplo genérico (evite)
        </p>{" "}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-1.5">
          {" "}
          <p className="text-[13.5px] text-neutral-600 italic leading-relaxed whitespace-pre-line">
            {"Qualidade e excelência sempre ❤️\nRealizando sonhos desde 2018."}
          </p>{" "}
        </div>{" "}
        <p className="text-[12px] text-neutral-400 leading-relaxed mb-5">
          {" "}
          Soa bonito, mas não diz o que a empresa faz, pra quem, nem o que fazer a seguir — poderia
          ser de qualquer negócio.{" "}
        </p>{" "}
        <p className="text-[12px] font-bold text-yellow-600 uppercase tracking-wide mb-2">
          {tema ? `Exemplo pensado para ${tema}` : "Exemplo melhor"}
        </p>{" "}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3.5">
          {" "}
          <p className="text-[13.5px] font-semibold text-neutral-800 leading-relaxed whitespace-pre-line">
            {exemploBom}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          MONTAR MINHA BIO <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function BioStep({ stepLabel, hint, value, placeholder, onChange, onNext, optional }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Construtor de bio</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-3 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          {stepLabel}{" "}
        </h2>{" "}
        {hint && <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">{hint}</p>}{" "}
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
        />{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext} disabled={!optional && !value?.trim()}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function BioStep3Local({ answers, setAnswer, patchAnswers, onNext }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Construtor de bio</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-4 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Onde você atende?{" "}
        </h2>{" "}
        <textarea
          value={answers.bioOnde}
          onChange={(e) => setAnswer("bioOnde", e.target.value)}
          rows={2}
          disabled={answers.bioOndeNA}
          placeholder="Ex: Campos Gerais e região, atendimento a domicílio, só online..."
          className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:opacity-50"
        />{" "}
        <div className="mt-3">
          {" "}
          <ChecklistToggle
            checked={answers.bioOndeNA}
            label="Minha localização não é importante para o meu negócio."
            onClick={() => patchAnswers({ bioOndeNA: !answers.bioOndeNA, bioOnde: "" })}
          />{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext} disabled={!answers.bioOndeNA && !answers.bioOnde?.trim()}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function BioStep4Cta({ answers, setAnswer, onNext }) {
  const opcoes = [
    "Chamar no WhatsApp",
    "Fazer um pedido",
    "Solicitar orçamento",
    "Visitar meu site",
    "Ir até minha loja",
    "Agendar atendimento",
    "Outro",
  ];
  const podeAvancar =
    answers.bioProximoPasso &&
    (answers.bioProximoPasso !== "Outro" || answers.bioProximoPassoOutro?.trim());
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Construtor de bio</SectionEyebrow>{" "}
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-5 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          O que você quer que a pessoa faça depois de visitar seu perfil?{" "}
        </h2>{" "}
        <div className="flex flex-col gap-2">
          {" "}
          {opcoes.map((opt) => (
            <button
              key={opt}
              onClick={() => setAnswer("bioProximoPasso", opt)}
              className={`w-full text-left px-4 py-3 rounded-2xl border text-[13.5px] font-bold transition-all ${answers.bioProximoPasso === opt ? "bg-yellow-400 border-yellow-400 text-neutral-900" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300"}`}
            >
              {" "}
              {opt}{" "}
            </button>
          ))}{" "}
        </div>{" "}
        {answers.bioProximoPasso === "Outro" && (
          <input
            value={answers.bioProximoPassoOutro}
            onChange={(e) => setAnswer("bioProximoPassoOutro", e.target.value)}
            placeholder="Descreva o próximo passo"
            className="mt-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[14.5px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          />
        )}{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext} disabled={!podeAvancar}>
          {" "}
          VER SUGESTÃO DE BIO <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function BioResult({ answers, setAnswer, onFinish }) {
  const [copied, setCopied] = useState(false);
  const texto = answers.bioFinal || "";
  const tamanho = texto.length;
  const excedeu = tamanho > 150;
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Sua sugestão de bio</SectionEyebrow>{" "}
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-4 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Pode editar à vontade antes de usar{" "}
        </h2>{" "}
        <textarea
          value={texto}
          onChange={(e) => setAnswer("bioFinal", e.target.value)}
          rows={4}
          className={`w-full resize-none rounded-2xl border bg-white px-4 py-3 text-[14.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${excedeu ? "border-red-300" : "border-neutral-200"}`}
        />{" "}
        <p
          className={`text-right text-[11.5px] mt-1.5 ${excedeu ? "text-red-500 font-bold" : "text-neutral-400"}`}
        >
          {tamanho}/150 caracteres
        </p>{" "}
        <button
          onClick={copiar}
          className="w-full mt-4 flex items-center justify-center gap-2 border border-neutral-200 rounded-2xl py-3.5 font-bold text-[14px] text-neutral-800 hover:border-yellow-400 transition-all"
        >
          {" "}
          <Copy size={16} /> {copied ? "COPIADO!" : "COPIAR MINHA BIO"}{" "}
        </button>{" "}
        <div className="mt-6">
          {" "}
          <p className="text-[13.5px] font-semibold text-neutral-700 mb-3">
            Agora é só abrir o Instagram, tocar em Editar perfil e colar sua nova bio.
          </p>{" "}
          <NumberedSteps
            steps={[
              "Abra o Instagram.",
              "Entre no seu perfil.",
              'Toque em "Editar perfil".',
              'Cole o texto no campo "Bio".',
            ]}
          />{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onFinish}>
          {" "}
          CONCLUIR BIO <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
/* ------------------------ Link e WhatsApp ------------------------ */ function Link1Explica({
  answers,
  onNext,
}) {
  const dica = linkTipByObjetivo(answers.objetivo);
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Link e WhatsApp</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-4"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          O que são os links do perfil?{" "}
        </h2>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-4">
          {" "}
          <p className="text-[14.5px] text-neutral-700 leading-relaxed">
            {" "}
            É a área abaixo da bio onde você pode adicionar links para levar a pessoa do Instagram
            para uma próxima ação, como abrir o WhatsApp, acessar um cardápio, fazer um pedido,
            solicitar orçamento, visitar seu site ou agendar um atendimento.{" "}
          </p>{" "}
        </div>{" "}
        <p className="text-[13px] font-bold text-neutral-500 uppercase tracking-wide mb-2">
          Ele pode, por exemplo:
        </p>{" "}
        <div className="flex flex-wrap gap-2 mb-4">
          {" "}
          {[
            "Abrir o WhatsApp",
            "Acessar um cardápio",
            "Fazer um pedido",
            "Solicitar orçamento",
            "Abrir um site",
            "Reunir vários links",
            "Agendar atendimento",
          ].map((t) => (
            <span
              key={t}
              className="px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-[12px] font-semibold text-neutral-600"
            >
              {" "}
              {t}{" "}
            </span>
          ))}{" "}
        </div>{" "}
        {dica && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            {" "}
            <p className="text-[13.5px] text-neutral-700 leading-relaxed">{dica}</p>{" "}
          </div>
        )}{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function Link2Escolha({ answers, setAnswer, onNext }) {
  const opcoes = [
    "WhatsApp",
    "Site",
    "Página com vários links",
    "Link de pedidos/cardápio",
    "Link de agendamento",
    "Não tenho nenhum link",
    "Não sei",
  ];
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Link e WhatsApp</SectionEyebrow>{" "}
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-4 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          O que você usa hoje?{" "}
        </h2>{" "}
        <div className="flex flex-col gap-2 mb-6">
          {" "}
          {opcoes.map((opt) => (
            <button
              key={opt}
              onClick={() => setAnswer("linkAtual", opt)}
              className={`w-full text-left px-4 py-3 rounded-2xl border text-[13.5px] font-bold transition-all ${answers.linkAtual === opt ? "bg-yellow-400 border-yellow-400 text-neutral-900" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300"}`}
            >
              {" "}
              {opt}{" "}
            </button>
          ))}{" "}
        </div>{" "}
        <p className="text-[13px] font-bold text-neutral-500 uppercase tracking-wide mb-2">
          Link único × página com vários links
        </p>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-3">
          {" "}
          <p className="text-[13px] font-bold text-neutral-800 mb-1">Link único</p>{" "}
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            {" "}
            Leva direto a um só lugar — ideal quando você tem um objetivo principal, como abrir o
            WhatsApp ou uma página de pedidos.{" "}
          </p>{" "}
        </div>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
          {" "}
          <p className="text-[13px] font-bold text-neutral-800 mb-1">
            Página com vários links
          </p>{" "}
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            {" "}
            Reúne várias opções (WhatsApp, site, catálogo, endereço) numa única página — faz sentido
            quando você precisa direcionar para mais de um lugar. Não é obrigatório usar uma
            ferramenta específica para isso; o importante é o conceito.{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext} disabled={!answers.linkAtual}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function Link3Whatsapp({ answers, patchAnswers, onNext }) {
  const checklist = answers.whatsappChecklist;
  const items = [
    { key: "abreCorretamente", label: "abre corretamente" },
    { key: "facilEncontrar", label: "está fácil de encontrar" },
    { key: "numeroCerto", label: "leva para o número certo" },
    { key: "mensagemClara", label: "tem uma mensagem inicial clara" },
    { key: "preparado", label: "está preparado para receber clientes" },
  ];
  function toggle(key) {
    patchAnswers({
      whatsappChecklist: { ...checklist, [key]: !checklist[key] },
    });
  }
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Link e WhatsApp</SectionEyebrow>{" "}
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-4 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Seu WhatsApp está fácil de encontrar?{" "}
        </h2>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-4">
          {" "}
          <p className="text-[13.5px] text-neutral-700 leading-relaxed">
            {" "}
            Colocar só o número escrito na bio obriga a pessoa a copiar e colar manualmente. Um{" "}
            <strong>link clicável</strong> abre a conversa direto — menos etapas, menos chance da
            pessoa desistir no meio do caminho.{" "}
          </p>{" "}
        </div>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-6">
          {" "}
          <p className="text-[13.5px] text-neutral-700 leading-relaxed">
            {" "}
            Vale sempre testar se o link realmente abre a conversa no número certo, e, se possível,
            usar um número separado para o WhatsApp comercial — assim mensagens de clientes não se
            misturam com as pessoais.{" "}
          </p>{" "}
        </div>{" "}
        <p className="text-[13px] font-bold text-neutral-500 uppercase tracking-wide mb-2">
          Meu WhatsApp:
        </p>{" "}
        <div className="flex flex-col gap-2">
          {" "}
          {items.map((item) => (
            <ChecklistToggle
              key={item.key}
              checked={checklist[item.key]}
              label={item.label}
              onClick={() => toggle(item.key)}
            />
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function Link4Mensagem({ answers, patchAnswers, onFinish }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!answers.whatsappMsgSeeded) {
      patchAnswers({
        whatsappMsg: mensagemInicialSugerida(answers.objetivo),
        whatsappMsgSeeded: true,
      });
    }
  }, []);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(answers.whatsappMsg || "");
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Montar minha mensagem inicial</SectionEyebrow>{" "}
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-4 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Como você gostaria que o cliente começasse a conversa?{" "}
        </h2>{" "}
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-3">
          {" "}
          Sugerimos um modelo com base no seu objetivo. Edite à vontade antes de usar.{" "}
        </p>{" "}
        <textarea
          value={answers.whatsappMsg || ""}
          onChange={(e) => patchAnswers({ whatsappMsg: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[14.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
        />{" "}
        <button
          onClick={copiar}
          className="w-full mt-4 flex items-center justify-center gap-2 border border-neutral-200 rounded-2xl py-3.5 font-bold text-[14px] text-neutral-800 hover:border-yellow-400 transition-all"
        >
          {" "}
          <MessageCircle size={16} /> {copied ? "COPIADO!" : "COPIAR MENSAGEM"}{" "}
        </button>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onFinish}>
          {" "}
          CONCLUIR LINK E WHATSAPP <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
/* ------------------------ Destaques ------------------------ */ function Destaques1Explica({
  onNext,
}) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Destaques</SectionEyebrow>{" "}
        <h2
          className="text-[20px] font-extrabold text-neutral-900 mb-4"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          O que são os Destaques?{" "}
        </h2>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-4">
          {" "}
          <p className="text-[14.5px] text-neutral-700 leading-relaxed">
            {" "}
            São Stories que continuam visíveis no seu perfil mesmo depois de 24 horas, organizados
            em círculos logo abaixo da bio. Uma pessoa nova pode conhecer rapidamente informações
            essenciais sobre o seu negócio, sem precisar rolar o feed.{" "}
          </p>{" "}
        </div>{" "}
        <div className="bg-yellow-400 rounded-2xl p-4">
          {" "}
          <p
            className="text-[14.5px] font-extrabold text-neutral-900 leading-snug"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {" "}
            Não pense nos Destaques como decoração. Pense neles como atalhos para as principais
            dúvidas do seu cliente.{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          ESCOLHER MEUS DESTAQUES <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function Destaques2Selecao({ answers, setAnswer, onNext }) {
  const sugeridos = useMemo(() => sugerirDestaques(answers.negocio), [answers.negocio]);
  const selecionados = answers.destaquesSelecionados?.length ? answers.destaquesSelecionados : null;
  useEffect(() => {
    if (!answers.destaquesSelecionados || answers.destaquesSelecionados.length === 0) {
      setAnswer("destaquesSelecionados", sugeridos);
    }
  }, []);
  const atuais = selecionados || sugeridos;
  function toggle(cat) {
    const set = new Set(atuais);
    if (set.has(cat)) set.delete(cat);
    else set.add(cat);
    setAnswer("destaquesSelecionados", Array.from(set));
  }
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Destaques</SectionEyebrow>{" "}
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-2 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Escolha os destaques que fazem sentido para o seu negócio{" "}
        </h2>{" "}
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
          {" "}
          {answers.negocio
            ? `Já marcamos algumas sugestões pensando em ${answers.negocio}. Você pode ajustar.`
            : "Já marcamos algumas sugestões comuns. Você pode ajustar."}{" "}
        </p>{" "}
        <div className="flex flex-wrap gap-2">
          {" "}
          {FULL_DESTAQUE_CATEGORIAS.map((cat) => {
            const active = atuais.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggle(cat)}
                className={`px-3.5 py-2 rounded-xl border text-[13px] font-semibold transition-all ${active ? "bg-yellow-400 border-yellow-400 text-neutral-900" : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300"}`}
              >
                {" "}
                {cat}{" "}
              </button>
            );
          })}{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext} disabled={atuais.length === 0}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function Destaques3Conteudo({ answers, onNext }) {
  const [expandido, setExpandido] = useState(null);
  const selecionados = answers.destaquesSelecionados || [];
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Destaques</SectionEyebrow>{" "}
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-4 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          O que colocar dentro de cada destaque?{" "}
        </h2>{" "}
        <p className="text-[13px] text-neutral-400 leading-relaxed mb-4">
          Toque em cada um para ver sugestões de conteúdo.
        </p>{" "}
        <div className="flex flex-col gap-2">
          {" "}
          {selecionados.map((cat) => {
            const aberto = expandido === cat;
            return (
              <div key={cat} className="border border-neutral-200 rounded-2xl overflow-hidden">
                {" "}
                <button
                  onClick={() => setExpandido(aberto ? null : cat)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-white"
                >
                  {" "}
                  <span className="text-[13.5px] font-bold text-neutral-800">{cat}</span>{" "}
                  <ChevronDown
                    size={16}
                    className={`text-neutral-400 transition-transform ${aberto ? "rotate-180" : ""}`}
                  />{" "}
                </button>{" "}
                {aberto && (
                  <div className="px-4 pb-4 bg-neutral-50">
                    {" "}
                    <ul className="flex flex-col gap-1.5">
                      {" "}
                      {(CONTEUDO_DESTAQUE[cat] || []).map((sugestao, i) => (
                        <li key={i} className="text-[13px] text-neutral-600 flex items-start gap-2">
                          {" "}
                          <span className="w-1 h-1 rounded-full bg-yellow-500 mt-2 flex-none" />{" "}
                          {sugestao}{" "}
                        </li>
                      ))}{" "}
                    </ul>{" "}
                  </div>
                )}{" "}
              </div>
            );
          })}{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          CONTINUAR <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function Destaques4Capas({ onFinish }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Destaques</SectionEyebrow>{" "}
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-4 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          E as capas dos destaques?{" "}
        </h2>{" "}
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
          {" "}
          <ul className="flex flex-col gap-2.5">
            {" "}
            {[
              "Mantenha um padrão entre todas as capas.",
              "Use poucas cores.",
              "Priorize boa leitura, mesmo pequena.",
              "Evite excesso de detalhes.",
              "Combine com a identidade da sua marca.",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2.5">
                {" "}
                <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center flex-none mt-0.5">
                  {" "}
                  <Check size={11} className="text-neutral-900" strokeWidth={3} />{" "}
                </div>{" "}
                <span className="text-[13.5px] text-neutral-700 leading-relaxed">{t}</span>{" "}
              </li>
            ))}{" "}
          </ul>{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onFinish}>
          {" "}
          CONCLUIR DESTAQUES <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
/* ------------------------ Revisão do perfil ------------------------ */ function Revisao1Checklist({
  progress,
  onNext,
}) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center mb-6">
          {" "}
          <ClipboardCheck size={22} className="text-neutral-900" />{" "}
        </div>{" "}
        <h2
          className="text-[21px] font-extrabold text-neutral-900 mb-5 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Seu perfil está quase pronto.{" "}
        </h2>{" "}
        <div className="flex flex-col gap-2">
          {" "}
          {MODULE1_SECTIONS.filter((s) => s.id !== "revisao").map((s) => (
            <div
              key={s.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50"
            >
              {" "}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-none ${progress[s.id] ? "bg-yellow-400" : "bg-neutral-200"}`}
              >
                {" "}
                {progress[s.id] && (
                  <Check size={14} className="text-neutral-900" strokeWidth={3} />
                )}{" "}
              </div>{" "}
              <span className="text-[13.5px] font-semibold text-neutral-700 flex-1">{s.label}</span>{" "}
              <span
                className={`text-[11px] font-bold ${progress[s.id] ? "text-yellow-600" : "text-neutral-400"}`}
              >
                {progress[s.id] ? "Concluído" : "Pendente"}
              </span>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext}>
          {" "}
          FAZER O TESTE DOS 5 SEGUNDOS <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function Revisao2Teste5s({ answers, setAnswer, onNext }) {
  const perguntas = [
    { key: "quem", texto: "Quem é você?" },
    { key: "oQue", texto: "O que você vende?" },
    { key: "paraQuem", texto: "Para quem?" },
    { key: "comoComprar", texto: "Como comprar ou entrar em contato?" },
  ];
  const teste = answers.teste5s;
  const respondidas = perguntas.every((p) => teste[p.key]);
  const negativas = perguntas.filter((p) => teste[p.key] === "AINDA NÃO");
  function responder(key, valor) {
    setAnswer("teste5s", { ...teste, [key]: valor });
  }
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <SectionEyebrow>Teste dos 5 segundos</SectionEyebrow>{" "}
        <p className="text-[14px] text-neutral-600 leading-relaxed mb-1">
          {" "}
          Imagine que alguém que nunca ouviu falar da sua empresa entrou agora no seu perfil.{" "}
        </p>{" "}
        <h2
          className="text-[17px] font-extrabold text-neutral-900 mb-5 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Em 5 segundos ela consegue entender:{" "}
        </h2>{" "}
        <div className="flex flex-col gap-4">
          {" "}
          {perguntas.map((p) => (
            <div key={p.key}>
              {" "}
              <p className="text-[13.5px] font-bold text-neutral-800 mb-2">{p.texto}</p>{" "}
              <div className="flex gap-2">
                {" "}
                {["SIM", "AINDA NÃO"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => responder(p.key, opt)}
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-[12.5px] font-bold transition-all ${teste[p.key] === opt ? "bg-yellow-400 border-yellow-400 text-neutral-900" : "bg-neutral-50 border-neutral-200 text-neutral-600"}`}
                  >
                    {" "}
                    {opt}{" "}
                  </button>
                ))}{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>{" "}
        {negativas.length > 0 && (
          <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            {" "}
            <p className="text-[13px] font-bold text-neutral-800 mb-1.5">Vale revisar:</p>{" "}
            <ul className="flex flex-col gap-1">
              {" "}
              {negativas.map((p) => (
                <li key={p.key} className="text-[12.5px] text-neutral-600">
                  {" "}
                  • {AREA_POR_PERGUNTA[p.key]}{" "}
                </li>
              ))}{" "}
            </ul>{" "}
          </div>
        )}{" "}
      </div>{" "}
      <div className="mt-5">
        {" "}
        <PrimaryButton onClick={onNext} disabled={!respondidas}>
          {" "}
          VER MEU PERFIL ORGANIZADO <ArrowRight size={17} />{" "}
        </PrimaryButton>{" "}
      </div>{" "}
    </div>
  );
}
function Module2ComingSoon({ onBack }) {
  return (
    <div className="h-full flex flex-col justify-between">
      {" "}
      <div>
        {" "}
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center mb-6">
          {" "}
          <LayoutGrid size={22} className="text-neutral-900" />{" "}
        </div>{" "}
        <h2
          className="text-[21px] font-extrabold text-neutral-900 mb-3 leading-snug"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {" "}
          Módulo 2 em preparação{" "}
        </h2>{" "}
        <p className="text-[14.5px] text-neutral-500 leading-relaxed">
          {" "}
          Estamos organizando a próxima etapa: pilares de conteúdo, o que postar, calendário e
          ideias para Reels e Stories. Em breve ela é liberada aqui, com tudo o que você já
          preencheu até agora.{" "}
        </p>{" "}
      </div>{" "}
      <button
        onClick={onBack}
        className="w-full border border-neutral-200 hover:border-yellow-400 transition-all text-neutral-800 font-bold text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        {" "}
        <ArrowLeft size={17} /> VOLTAR AO MÓDULO 1{" "}
      </button>{" "}
    </div>
  );
}
