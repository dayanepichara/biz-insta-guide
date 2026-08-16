/* ------------------------------------------------------------------
   Motor de diagnóstico LOCAL do Módulo 1.
   Regras determinísticas, sem chamada de IA e sem custo recorrente.
   Cada função devolve sempre o mesmo formato:
     { avaliacao, funcionando: [], mudar: [], sugestoes: [], recomendada, porque }
------------------------------------------------------------------- */

const STOPWORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "para",
  "por",
  "com",
  "sem",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "e",
  "ou",
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "uns",
  "umas",
  "que",
  "meu",
  "minha",
  "seu",
  "sua",
  "eu",
  "vendo",
  "faco",
  "faço",
  "trabalho",
  "sou",
  "tenho",
  "muito",
  "mais",
  "todo",
  "toda",
  "todos",
  "todas",
  "melhor",
  "qualidade",
  "servicos",
  "serviço",
  "serviços",
  "produtos",
  "produto",
]);

const GENERICAS = [
  "delicias",
  "delicia",
  "sonho",
  "sonhos",
  "encanto",
  "charme",
  "estilo",
  "espaco",
  "cantinho",
  "mundo",
  "art",
  "arte",
  "bella",
  "bela",
  "gold",
  "premium",
  "top",
  "vip",
  "store",
  "shop",
  "company",
  "oficial",
];

const DESPERDICIO = [
  "oficial",
  "instagram",
  "insta",
  "perfil",
  "conta",
  "loja virtual",
  "seja bem vindo",
  "bem vindo",
  "bemvindo",
  "ltda",
  "me",
  "eireli",
];

export function semAcento(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function palavrasChave(answers) {
  const base = `${answers.oferece || ""} ${answers.negocio || ""}`;
  return semAcento(base)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 2 && !STOPWORDS.has(p))
    .slice(0, 8);
}

/* Categoria curta do negócio: "marmitas fitness", "cortes femininos"... */
export function categoriaCurta(answers) {
  const bruto = (answers.oferece || answers.negocio || "").trim();
  if (!bruto) return "";
  const palavras = bruto
    .replace(/\s+/g, " ")
    .split(" ")
    .filter((p) => !STOPWORDS.has(semAcento(p)));
  const curta = palavras.slice(0, 3).join(" ");
  return capitalize(curta || bruto.split(" ").slice(0, 3).join(" "));
}

/* Marca / apelido: tenta reaproveitar o nome atual, senão o negócio. */
export function marcaBase(answers) {
  const atual = (answers.nomeAtual || answers.nome || "").trim();
  if (atual) {
    const limpo = atual.split(/[|\-•·]/)[0].trim();
    const partes = limpo.split(/\s+/).filter((p) => !STOPWORDS.has(semAcento(p)));
    const candidata = partes[partes.length - 1] || partes[0];
    if (candidata && candidata.length >= 3) return capitalize(candidata);
  }
  const neg = (answers.negocio || "").trim();
  if (neg) return capitalize(neg.split(/\s+/)[0]);
  return "";
}

function cidadeCurta(answers) {
  if (answers.bioOndeNA) return "";
  const onde = (answers.bioOnde || "").trim();
  if (!onde) return "";
  if (onde.length > 22) return "";
  return onde.split(/[,\-]/)[0].trim();
}

/* ----------------------------- NOME ----------------------------- */

export function sugestoesDeNome(answers) {
  const marca = marcaBase(answers) || "Seu nome";
  const cat = categoriaCurta(answers) || "Seu negócio";
  const cidade = cidadeCurta(answers);
  const lista = [
    `${marca} | ${cat}`,
    `${cat} da ${marca}`,
    `${marca} | ${cat} artesanal`.length <= 30 ? `${marca} · ${cat}` : `${marca} · ${cat}`,
  ];
  if (cidade) lista.push(`${marca} | ${cat} em ${cidade}`);
  const neg = capitalize((answers.negocio || "").trim());
  if (neg && semAcento(neg) !== semAcento(cat)) lista.push(`${marca} | ${neg}`);
  const unicas = [];
  for (const s of lista) {
    const limpo = s.replace(/\s+/g, " ").trim();
    if (limpo && !unicas.some((u) => semAcento(u) === semAcento(limpo))) unicas.push(limpo);
  }
  return unicas.slice(0, 5);
}

export function analisarNome(nome, answers) {
  const sugestoes = sugestoesDeNome(answers);
  const recomendada = sugestoes[0] || "";
  const cat = categoriaCurta(answers);
  const porque = cat
    ? `Ela junta o nome que as pessoas já conhecem com a palavra “${cat}”, que é o que você realmente vende. Assim, quem nunca te viu entende o seu negócio antes mesmo de ler a bio — e o Instagram passa a te mostrar em buscas por esse termo.`
    : "Ela junta o nome que as pessoas já conhecem com o que você vende, então quem chega ao perfil entende seu negócio na hora.";

  const texto = (nome || "").trim();
  if (!texto) {
    return {
      temAtual: false,
      avaliacao: cat
        ? `Como você está começando, o campo Nome precisa fazer dois trabalhos ao mesmo tempo: dizer quem você é e deixar claro que você trabalha com ${cat.toLowerCase()}.`
        : "Como você está começando, o campo Nome precisa dizer quem você é e o que você faz.",
      funcionando: [],
      mudar: [],
      sugestoes,
      recomendada,
      porque,
    };
  }

  const chaves = palavrasChave(answers);
  const nomeSemAcento = semAcento(texto);
  const temCategoria = chaves.some((k) =>
    nomeSemAcento.includes(k.slice(0, Math.max(4, k.length - 2))),
  );
  const longo = texto.length > 30;
  const curtoDemais = texto.length < 3;
  const generico = GENERICAS.some((g) => nomeSemAcento.includes(g));
  const desperdicio = DESPERDICIO.filter((d) => nomeSemAcento.includes(d));
  const memoravel = texto.length <= 25 && texto.split(/\s+/).length <= 4;

  const funcionando = [];
  const mudar = [];

  if (memoravel) funcionando.push("É curto e fácil de lembrar — isso ajuda no boca a boca.");
  if (temCategoria)
    funcionando.push(
      "Já aparece no nome uma palavra ligada ao que você vende, e isso ajuda quem procura por esse termo dentro do Instagram.",
    );
  if (!generico && !temCategoria && memoravel)
    funcionando.push("Tem cara de marca própria, não é uma expressão qualquer.");

  if (!temCategoria)
    mudar.push(
      cat
        ? `Sozinho, o nome não deixa claro que você trabalha com ${cat.toLowerCase()}. Quem chega pela primeira vez pode imaginar outra coisa. Eu acrescentaria essa palavra no campo Nome.`
        : "Sozinho, o nome não deixa claro o que você vende. Eu acrescentaria a palavra que descreve o seu produto ou serviço.",
    );
  if (generico)
    mudar.push(
      "Ele usa uma expressão que aparece em muitos negócios diferentes, então não diferencia o seu. O nome precisa dizer algo que só o seu negócio faz.",
    );
  if (longo)
    mudar.push(
      `Está longo (${texto.length} caracteres) e o Instagram corta o final em telas pequenas. Eu deixaria com até 30 caracteres.`,
    );
  if (curtoDemais) mudar.push("Está curto demais para alguém entender do que se trata.");
  if (desperdicio.length)
    mudar.push(
      `As palavras “${desperdicio.join("”, “")}” ocupam espaço sem informar nada a quem chega. Eu tiraria e usaria esse espaço para dizer o que você vende.`,
    );

  let avaliacao;
  if (mudar.length === 0) {
    avaliacao = `“${texto}” cumpre o papel: é fácil de lembrar e já diz o que você faz. Eu manteria.`;
  } else if (funcionando.length > 0) {
    avaliacao = `“${texto}” tem pontos bons, mas ainda não faz todo o trabalho que esse campo poderia fazer pelo seu negócio.`;
  } else {
    avaliacao = `“${texto}” não está ajudando quem chega ao seu perfil a entender o que você vende. Eu mudaria.`;
  }

  return {
    temAtual: true,
    ok: mudar.length === 0,
    avaliacao,
    funcionando,
    mudar,
    sugestoes,
    recomendada,
    porque,
  };
}

/* ----------------------------- @ ----------------------------- */

function slug(s) {
  return semAcento(s)
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 18);
}

export function sugestoesDeArroba(answers) {
  const marca = slug(marcaBase(answers)) || "seunegocio";
  const cat = slug((categoriaCurta(answers) || "").split(" ")[0]);
  const cat2 = slug((categoriaCurta(answers) || "").split(" ").slice(0, 2).join(""));
  const cidade = slug(cidadeCurta(answers));
  const lista = [];
  if (cat) lista.push(`@${marca}.${cat}`);
  if (cat) lista.push(`@${cat}.${marca}`);
  if (cat2 && cat2 !== cat) lista.push(`@${marca}${cat2}`);
  if (cidade && cat) lista.push(`@${cat}.${cidade}`);
  lista.push(`@${marca}`);
  const unicas = [];
  for (const s of lista) if (s.length > 3 && !unicas.includes(s)) unicas.push(s);
  return unicas.slice(0, 5);
}

export function analisarArroba(arroba, answers) {
  const sugestoes = sugestoesDeArroba(answers);
  const recomendada = sugestoes[0] || "";
  const porque =
    "Ela é curta, se escreve do jeito que se fala e já carrega a palavra do que você vende — então é fácil de ditar por telefone e fácil de achar na busca. Se estiver disponível, minha primeira opção seria essa.";

  const texto = (arroba || "").trim().replace(/^@/, "");
  if (!texto) {
    return {
      temAtual: false,
      avaliacao:
        "Como você ainda vai criar o seu @, vale escolher um que a pessoa consiga escrever sem errar depois de ouvir uma vez só.",
      funcionando: [],
      mudar: [],
      sugestoes,
      recomendada,
      porque,
    };
  }

  const chaves = palavrasChave(answers);
  const semAc = semAcento(texto);
  const temCategoria = chaves.some((k) => semAc.includes(k.slice(0, Math.max(4, k.length - 2))));
  const longo = texto.length > 20;
  const comNumeros = /\d{2,}/.test(texto);
  const muitosSeparadores = (texto.match(/[._]/g) || []).length > 1;
  const temMaiuscula = /[A-Z]/.test(texto);
  const curto = texto.length <= 16;

  const funcionando = [];
  const mudar = [];

  if (curto) funcionando.push(`Tem ${texto.length} caracteres — é fácil de digitar e de ditar.`);
  if (temCategoria)
    funcionando.push("Carrega uma palavra do seu negócio, o que ajuda quem procura por esse tema.");
  if (!comNumeros && !muitosSeparadores)
    funcionando.push(
      "Não tem números soltos nem excesso de pontos, então quase ninguém erra ao escrever.",
    );

  if (longo)
    mudar.push(
      `Está longo (${texto.length} caracteres). @ comprido é difícil de ditar e de lembrar — eu ficaria com até 16.`,
    );
  if (comNumeros)
    mudar.push(
      "Os números não significam nada para quem chega e são o principal motivo de a pessoa digitar errado. Eu tiraria.",
    );
  if (muitosSeparadores)
    mudar.push(
      "Tem mais de um ponto ou underline. Cada símbolo extra é uma chance de a pessoa errar ao te procurar. Eu usaria no máximo um.",
    );
  if (temMaiuscula)
    mudar.push("Letras maiúsculas confundem na hora de digitar. Eu deixaria tudo em minúsculas.");
  if (!temCategoria)
    mudar.push(
      "Ele não diz nada sobre o que você vende. Quem busca pelo seu tipo de negócio dificilmente chega até você por aqui.",
    );

  let avaliacao;
  if (mudar.length === 0) {
    avaliacao = `@${texto} está bom: curto, fácil de escrever e ligado ao seu negócio. Eu manteria — trocar de @ faz você perder quem já te conhece.`;
  } else if (mudar.length === 1 && funcionando.length >= 2) {
    avaliacao = `@${texto} funciona, mas tem um detalhe que atrapalha na hora de alguém te procurar.`;
  } else {
    avaliacao = `@${texto} atrapalha mais do que ajuda hoje: é difícil de lembrar e de escrever certo. Eu trocaria.`;
  }

  return {
    temAtual: true,
    ok: mudar.length === 0,
    avaliacao,
    funcionando,
    mudar,
    sugestoes,
    recomendada,
    porque,
  };
}

/* ----------------------------- FOTO ----------------------------- */

const SERVICO_PESSOAL = [
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
  "manicure",
  "esteticista",
  "massag",
  "terapeut",
  "barbeir",
];

const PRODUTO_FISICO = [
  "doce",
  "bolo",
  "marmita",
  "comida",
  "restaurante",
  "lanche",
  "confeitaria",
  "roupa",
  "moda",
  "loja",
  "semij",
  "joia",
  "artesan",
  "papelaria",
  "flor",
  "cosmetic",
];

export function recomendacaoDeFoto(answers) {
  const n = semAcento(`${answers.negocio || ""} ${answers.oferece || ""}`);
  const cat = (categoriaCurta(answers) || "seu produto").toLowerCase();
  if (SERVICO_PESSOAL.some((k) => n.includes(k))) {
    return {
      tipo: "Seu rosto",
      texto: `No seu caso eu usaria uma foto sua, do peito para cima, olhando para a câmera, com fundo claro e sem texto. Quem contrata ${cat} está contratando uma pessoa de confiança — ver o seu rosto reduz o medo de fechar com alguém desconhecido. Um logotipo aqui deixaria o perfil mais frio.`,
    };
  }
  if (PRODUTO_FISICO.some((k) => n.includes(k))) {
    return {
      tipo: "Você com o produto (ou o produto sozinho, bem centralizado)",
      texto: `No seu caso eu usaria uma foto sua segurando ${cat}, enquadrada do peito para cima, com fundo claro, boa iluminação e sem texto. Assim, mesmo pequena, a imagem mostra ao mesmo tempo o que você vende e quem está por trás. Se preferir não aparecer, use uma foto de ${cat} sozinho, bem no centro do quadro e com fundo liso.`,
    };
  }
  return {
    tipo: "Logotipo simples ou seu rosto",
    texto: `No seu caso eu usaria um logotipo bem simples — só o símbolo ou as iniciais, em duas cores, sem frases — ou uma foto sua do peito para cima com fundo claro. Nada de texto pequeno: no círculo do Instagram ele vira um borrão.`,
  };
}

/* ----------------------------- BIO ----------------------------- */

const CTA_MAP = {
  "Chamar no WhatsApp": "📲 Peça pelo WhatsApp",
  "Fazer um pedido": "🛍️ Faça seu pedido pelo link",
  "Solicitar orçamento": "💬 Solicite seu orçamento",
  "Visitar meu site": "🔗 Visite meu site pelo link",
  "Ir até minha loja": "📍 Venha nos visitar",
  "Agendar atendimento": "🗓️ Agende seu horário",
};

function ctaTexto(a) {
  if (a.bioProximoPasso === "Outro" && a.bioProximoPassoOutro?.trim())
    return `👉 ${a.bioProximoPassoOutro.trim()}`;
  return CTA_MAP[a.bioProximoPasso] || "📲 Chame no WhatsApp";
}

export function versoesDeBio(a) {
  const faz = (a.bioOquefaz || a.oferece || "").trim();
  const quem = (a.bioParaquem || a.comprador || "").trim();
  const onde = a.bioOndeNA ? "" : (a.bioOnde || "").trim();
  const cta = ctaTexto(a);

  const v1 = [`${capitalize(faz)}${quem ? ` para ${quem}` : ""}`, onde ? `📍 ${onde}` : "", cta]
    .filter(Boolean)
    .join("\n");

  const v2 = [
    `${capitalize(faz)}${onde ? ` em ${onde}` : ""}`,
    quem ? `Atendimento pensado para ${quem}` : "Atendimento próximo, do pedido à entrega",
    cta,
  ]
    .filter(Boolean)
    .join("\n");

  const v3 = [
    `Aqui você encontra ${faz.toLowerCase()}`,
    quem ? `Feito para ${quem}` : "",
    onde ? `📍 ${onde}` : "",
    cta,
  ]
    .filter(Boolean)
    .join("\n");

  const lista = [
    { titulo: "Versão direta", texto: v1 },
    { titulo: "Versão com atendimento", texto: v2 },
    { titulo: "Versão mais conversada", texto: v3 },
  ];
  return lista.filter((v) => v.texto.trim().length > 0);
}

const BIO_GENERICAS = [
  "qualidade",
  "excelencia",
  "realizando sonhos",
  "bem vindo",
  "seja bem",
  "amor",
  "carinho",
  "atendimento diferenciado",
  "melhor da cidade",
  "compromisso",
];

export function analisarBio(bio, a) {
  const versoes = versoesDeBio(a);
  const recomendada = versoes[0]?.texto || "";
  const porque =
    "Ela responde nas duas primeiras linhas o que você vende e para quem, e termina dizendo exatamente o próximo passo. É essa sequência que faz alguém sair do perfil e chegar até você.";

  const texto = (bio || "").trim();
  if (!texto) {
    return {
      temAtual: false,
      avaliacao:
        "Sem bio, quem entra no seu perfil precisa adivinhar o que você faz — e normalmente a pessoa não tenta: ela sai. Montei as versões abaixo com as informações que você já me deu.",
      funcionando: [],
      mudar: [],
      versoes,
      recomendada,
      porque,
    };
  }

  const semAc = semAcento(texto);
  const chaves = palavrasChave(a);
  const dizOqueFaz = chaves.some((k) => semAc.includes(k.slice(0, Math.max(4, k.length - 2))));
  const dizParaQuem = /\bpara\b|\bpra\b/.test(semAc);
  const temCta = /whats|link|pedido|orcament|agende|peca|peça|chame|visite|compre|clique/.test(
    semAc,
  );
  const temLocal = /📍|\bem \w{3,}/.test(texto);
  const genericas = BIO_GENERICAS.filter((g) => semAc.includes(g));
  const longa = texto.length > 150;

  const funcionando = [];
  const mudar = [];

  if (dizOqueFaz) funcionando.push("Já dá para entender o que você vende logo na primeira linha.");
  if (temCta) funcionando.push("Você indica um próximo passo, e isso é o que gera contato.");
  if (temLocal) funcionando.push("A localização aparece, o que ajuda quem procura perto.");
  if (texto.split("\n").length > 1)
    funcionando.push("Está quebrada em linhas, então é fácil de bater o olho e ler.");

  if (!dizOqueFaz)
    mudar.push(
      "Ela não diz com todas as letras o que você vende. Quem nunca te viu não deveria precisar deduzir isso.",
    );
  if (!dizParaQuem)
    mudar.push(
      "Falta dizer para quem é. Quando a pessoa se reconhece na bio, ela continua no perfil.",
    );
  if (!temCta)
    mudar.push(
      "Não tem um próximo passo claro. Sem isso, a pessoa gosta do perfil, sai e não volta.",
    );
  if (genericas.length)
    mudar.push(
      `Eu tiraria expressões como “${genericas.join("”, “")}”: elas cabem em qualquer negócio e ocupam o espaço que deveria explicar o seu.`,
    );
  if (longa)
    mudar.push(
      `Está com ${texto.length} caracteres e o limite é 150 — o final vai ser cortado no perfil.`,
    );

  let avaliacao;
  if (mudar.length === 0) {
    avaliacao = "Sua bio faz o trabalho: diz o que é, para quem e o que fazer em seguida.";
  } else if (funcionando.length > 0) {
    avaliacao =
      "Sua bio tem uma base boa, mas está deixando de fora informações que fazem a pessoa decidir te chamar.";
  } else {
    avaliacao =
      "Sua bio hoje soa bonita, mas não informa: ela poderia estar no perfil de qualquer negócio. Eu reescreveria.";
  }

  return {
    temAtual: true,
    ok: mudar.length === 0,
    avaliacao,
    funcionando,
    mudar,
    versoes,
    recomendada,
    porque,
  };
}

/* --------------------- Pendências da revisão --------------------- */

export function pendenciasDoPerfil(a) {
  const lista = [];
  const nome = analisarNome(a.nome || "", a);
  if (nome.temAtual && !nome.ok) lista.push(`Nome: ${nome.mudar[0]}`);
  const arroba = analisarArroba(a.arroba || "", a);
  if (arroba.temAtual && !arroba.ok) lista.push(`@: ${arroba.mudar[0]}`);
  if (!a.bioFinal?.trim()) lista.push("Bio: você ainda não escolheu uma bio para usar.");
  else if (a.bioFinal.length > 150)
    lista.push(`Bio: está com ${a.bioFinal.length} caracteres e o Instagram corta em 150.`);
  if (!a.fotoAnalise && !a.fotoLocalFeita)
    lista.push("Foto de perfil: você ainda não enviou uma foto para eu analisar.");
  if (!a.linkAtual?.trim()) lista.push("Link: ainda não há um link definido no perfil.");
  return lista;
}
