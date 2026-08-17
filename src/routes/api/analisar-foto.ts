import { createFileRoute } from "@tanstack/react-router";

type Body = {
  imagem?: string; // data:image/jpeg;base64,...
  contexto?: Record<string, string>;
  tecnica?: string;
};

const MAX_BASE64 = 2_500_000; // ~1.8MB de imagem já comprimida

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function extrairJson(texto: string) {
  const limpo = texto
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(limpo);
  } catch {
    const i = limpo.indexOf("{");
    const f = limpo.lastIndexOf("}");
    if (i >= 0 && f > i) {
      try {
        return JSON.parse(limpo.slice(i, f + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const Route = createFileRoute("/api/analisar-foto")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json({ erro: "ia_indisponivel" }, 503);

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return json({ erro: "requisicao_invalida" }, 400);
        }

        const imagem = body.imagem ?? "";
        if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(imagem)) {
          return json({ erro: "imagem_invalida" }, 400);
        }
        if (imagem.length > MAX_BASE64) {
          return json({ erro: "imagem_grande" }, 413);
        }

        const c = body.contexto ?? {};
        const contextoTexto = [
          `Tipo de negócio: ${c["negocio"] || "não informado"}`,
          `O que oferece: ${c["oferece"] || "não informado"}`,
          `Para quem vende: ${c["comprador"] || "não informado"}`,
          `Objetivo no Instagram: ${c["objetivo"] || "não informado"}`,
          `Nome do perfil: ${c["nome"] || "não informado"}`,
          `@ do perfil: ${c["arroba"] || "não informado"}`,
          `O que usa hoje como foto: ${c["fotoEscolha"] || "não informado"}`,
        ].join("\n");

        const prompt = `Você é um especialista em identidade visual de perfis profissionais no Instagram, falando com o dono de um pequeno negócio brasileiro. Responda em português do Brasil, linguagem simples e direta, sem jargão.

Analise a IMAGEM enviada como foto de perfil (ícone circular e minúsculo do Instagram).

Contexto do negócio informado pela pessoa:
${contextoTexto}

Checagem técnica automática já feita no aparelho (use como apoio, não repita literalmente):
${body.tecnica || "não disponível"}

Regras obrigatórias:
- Descreva primeiro, de forma concreta, o que REALMENTE aparece na imagem (pessoa, produto, logotipo, texto, ambiente, cores, fundo, enquadramento).
- Toda avaliação deve citar elementos concretos e visíveis dessa imagem. É PROIBIDO responder de forma genérica como "use uma foto profissional", "melhore a iluminação" ou "está boa".
- Cruze o que aparece na imagem com o negócio informado e diga se ela comunica bem esse negócio.
- Considere que a imagem será vista em um círculo muito pequeno: textos pequenos, muitos elementos e detalhes finos somem.

Responda SOMENTE com um objeto json com exatamente estas chaves:
{
 "aparece": "1 a 2 frases descrevendo o que aparece na imagem",
 "avaliacao": "1 a 2 frases de avaliação geral desta foto como foto de perfil",
 "funcionando": ["2 a 4 pontos concretos que funcionam nesta imagem"],
 "prejudica": ["2 a 4 pontos concretos que prejudicam esta imagem como foto de perfil"],
 "comunicaNegocio": "1 a 2 frases dizendo se a imagem comunica o negócio informado e por quê",
 "mudar": ["2 a 4 mudanças específicas nesta imagem"],
 "tipoIdeal": "rosto | produto | logotipo | ambiente | outro — com uma frase justificando para ESTE negócio",
 "fotoIdeal": "3 a 5 frases descrevendo concretamente a foto que você usaria no lugar: enquadramento, fundo, luz, roupa/objeto, cor, o que deve aparecer"
}`;

        let resp: Response;
        try {
          resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
              "X-Lovable-AIG-SDK": "fetch",
            },
            body: JSON.stringify({
              model: "google/gemini-3.6-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imagem } },
                  ],
                },
              ],
            }),
          });
        } catch {
          return json({ erro: "ia_indisponivel" }, 503);
        }

        if (!resp.ok) {
          const detalhe = await resp.text().catch(() => "");
          console.error("analisar-foto gateway erro", resp.status, detalhe.slice(0, 500));
          if (resp.status === 429) return json({ erro: "ia_ocupada" }, 429);
          if (resp.status === 402) return json({ erro: "sem_creditos" }, 402);
          return json({ erro: "ia_indisponivel" }, 503);
        }

        let data: { choices?: Array<{ message?: { content?: string } }> };
        try {
          data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
        } catch {
          return json({ erro: "resposta_invalida" }, 502);
        }
        const texto = data.choices?.[0]?.message?.content ?? "";
        const parsed = extrairJson(texto);
        if (!parsed || typeof parsed !== "object") return json({ erro: "resposta_invalida" }, 502);

        // A IA pode devolver objetos, números ou strings onde esperamos texto/listas.
        // Normalizamos aqui para que a tela só receba strings — assim nenhuma
        // resposta fora do formato consegue derrubar o aplicativo.
        const analise = {
          aparece: texto1(parsed["aparece"]),
          avaliacao: texto1(parsed["avaliacao"]),
          funcionando: lista(parsed["funcionando"]),
          prejudica: lista(parsed["prejudica"]),
          comunicaNegocio: texto1(parsed["comunicaNegocio"]),
          mudar: lista(parsed["mudar"]),
          tipoIdeal: texto1(parsed["tipoIdeal"]),
          fotoIdeal: texto1(parsed["fotoIdeal"]),
        };

        const temConteudo =
          analise.avaliacao ||
          analise.fotoIdeal ||
          analise.funcionando.length > 0 ||
          analise.prejudica.length > 0 ||
          analise.mudar.length > 0;
        if (!temConteudo) return json({ erro: "resposta_invalida" }, 502);

        return json({ analise });
      },
    },
  },
});
