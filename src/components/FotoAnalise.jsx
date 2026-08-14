import React, { useRef, useState } from "react";
import { ArrowRight, Camera, Check, Sparkles, AlertTriangle, RotateCcw } from "lucide-react";

/* ------------------------------------------------------------------
   FOTO 3 - Análise da foto de perfil
   1) Checagem técnica LOCAL (canvas, sem custo, sempre disponível).
   2) UMA única análise com IA por usuário (teto), disparada apenas
      quando a pessoa toca conscientemente em "Analisar minha foto".
   A imagem nunca é armazenada: vive só na memória enquanto a tela
   está aberta. Só o texto do resultado vai para o localStorage.
------------------------------------------------------------------- */

const FONT_DISPLAY = "'Manrope', system-ui, sans-serif";
const MAX_UPLOAD = 5 * 1024 * 1024; // 5 MB antes da compressão
const LADO_MAX = 640; // compressão agressiva: menos consumo na IA

function Botao({ children, onClick, disabled }) {
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

function Bloco({ titulo, children }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-3">
      <p className="text-[13px] font-extrabold text-neutral-900 mb-2" style={{ fontFamily: FONT_DISPLAY }}>
        {titulo}
      </p>
      {children}
    </div>
  );
}

function Lista({ itens }) {
  if (!itens || itens.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {itens.map((t, i) => (
        <li key={i} className="flex gap-2 text-[13.5px] text-neutral-700 leading-relaxed">
          <span className="text-yellow-500 font-bold leading-[1.4]">•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/* --------------------- checagem técnica local --------------------- */

function comprimirEAnalisar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        const local = medir(ctx, w, h, img.width, img.height, canvas);
        URL.revokeObjectURL(url);
        resolve({ dataUrl, local });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("nao_carregou"));
    };
    img.src = url;
  });
}

function cinza(data, i) {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

function medir(ctx, w, h, origW, origH, canvas) {
  const { data } = ctx.getImageData(0, 0, w, h);
  const g = new Float32Array(w * h);
  let soma = 0;
  for (let p = 0; p < w * h; p++) {
    const v = cinza(data, p * 4);
    g[p] = v;
    soma += v;
  }
  const media = soma / (w * h);

  let varSoma = 0;
  for (let p = 0; p < w * h; p++) varSoma += (g[p] - media) ** 2;
  const contraste = Math.sqrt(varSoma / (w * h));

  // nitidez: variância do laplaciano
  let lapSoma = 0;
  let lapSoma2 = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const lap = 4 * g[p] - g[p - 1] - g[p + 1] - g[p - w] - g[p + w];
      lapSoma += lap;
      lapSoma2 += lap * lap;
      n++;
    }
  }
  const lapMedia = lapSoma / n;
  const nitidez = lapSoma2 / n - lapMedia * lapMedia;

  // extremos de exposição
  let escuros = 0;
  let estourados = 0;
  for (let p = 0; p < w * h; p++) {
    if (g[p] < 25) escuros++;
    if (g[p] > 240) estourados++;
  }
  const pctEscuros = (escuros / (w * h)) * 100;
  const pctEstourados = (estourados / (w * h)) * 100;

  // quanto de detalhe sobrevive no ícone circular (56px)
  const mini = document.createElement("canvas");
  mini.width = 56;
  mini.height = 56;
  const mctx = mini.getContext("2d");
  mctx.drawImage(canvas, 0, 0, 56, 56);
  const md = mctx.getImageData(0, 0, 56, 56).data;
  const mg = new Float32Array(56 * 56);
  let msoma = 0;
  for (let p = 0; p < 56 * 56; p++) {
    mg[p] = cinza(md, p * 4);
    msoma += mg[p];
  }
  const mmedia = msoma / (56 * 56);
  let mvar = 0;
  for (let p = 0; p < 56 * 56; p++) mvar += (mg[p] - mmedia) ** 2;
  const detalheMini = Math.sqrt(mvar / (56 * 56));

  // conteúdo perdido fora do círculo (cantos do quadrado)
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  let dentro = 0;
  let fora = 0;
  let energiaFora = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const borda = Math.abs(4 * g[p] - g[p - 1] - g[p + 1] - g[p - w] - g[p + w]);
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) dentro += borda;
      else {
        fora += borda;
        energiaFora++;
      }
    }
  }
  const pctForaCirculo = fora + dentro > 0 ? (fora / (fora + dentro)) * 100 : 0;
  const proporcao = origW / origH;

  const itens = [];
  const push = (ok, texto) => itens.push({ ok, texto });

  const ladoMenor = Math.min(origW, origH);
  push(
    ladoMenor >= 320,
    ladoMenor >= 320
      ? `Resolução suficiente (${origW}×${origH} px).`
      : `Resolução baixa (${origW}×${origH} px). O Instagram vai deixar a imagem ainda pior. O ideal é pelo menos 320×320 px.`,
  );

  push(
    Math.abs(proporcao - 1) < 0.15,
    Math.abs(proporcao - 1) < 0.15
      ? "Formato próximo do quadrado: o corte circular não vai cortar quase nada."
      : `A imagem não é quadrada (${origW}×${origH}). O Instagram vai cortar as laterais — recorte no quadrado antes de subir.`,
  );

  push(
    nitidez >= 90,
    nitidez >= 90
      ? "Imagem nítida, com bordas bem definidas."
      : nitidez >= 40
        ? "Nitidez mediana: a imagem tem um leve borrão ou foi ampliada demais."
        : "Imagem pouco nítida (borrada ou muito ampliada). Refaça a foto sem zoom digital.",
  );

  push(
    media >= 70 && media <= 200,
    media < 70
      ? `Imagem escura (brilho médio ${Math.round(media)} de 255). Refaça perto de uma janela, de dia.`
      : media > 200
        ? `Imagem muito clara (brilho médio ${Math.round(media)} de 255), com risco de perder detalhes.`
        : `Iluminação equilibrada (brilho médio ${Math.round(media)} de 255).`,
  );

  push(
    pctEscuros < 25 && pctEstourados < 10,
    pctEscuros >= 25
      ? `${Math.round(pctEscuros)}% da imagem está praticamente preta — há sombras cobrindo o assunto.`
      : pctEstourados >= 10
        ? `${Math.round(pctEstourados)}% da imagem está estourada de luz (branco sem detalhe).`
        : "Sem sombras pesadas nem áreas estouradas.",
  );

  push(
    contraste >= 35,
    contraste >= 35
      ? "Bom contraste: o assunto se separa do fundo."
      : "Contraste baixo: o assunto se mistura com o fundo e some no ícone pequeno.",
  );

  push(
    detalheMini >= 22,
    detalheMini >= 22
      ? "No tamanho do ícone (56 px) a imagem continua legível."
      : "No tamanho do ícone (56 px) a imagem vira uma mancha: há detalhes ou textos pequenos demais para esse espaço.",
  );

  push(
    pctForaCirculo < 40,
    pctForaCirculo < 40
      ? "O que importa está no centro — o corte circular preserva o assunto."
      : `Boa parte do conteúdo (${Math.round(pctForaCirculo)}%) está nos cantos, que somem no corte circular. Centralize o assunto.`,
  );

  const problemas = itens.filter((i) => !i.ok).length;
  const resumo =
    problemas === 0
      ? "Tecnicamente a imagem está pronta para ser foto de perfil."
      : problemas <= 2
        ? "Tecnicamente a imagem está quase lá: há pontos a ajustar."
        : "Tecnicamente esta imagem tem vários pontos que atrapalham como foto de perfil.";

  const tecnicaTexto = itens.map((i) => `${i.ok ? "OK" : "PROBLEMA"}: ${i.texto}`).join("\n");

  return { itens, resumo, problemas, tecnicaTexto };
}

/* ------------------------------ tela ------------------------------ */

export default function FotoAnalise({ answers, patchAnswers, onFinish }) {
  const [preview, setPreview] = useState("");
  const [local, setLocal] = useState(null);
  const [imagemB64, setImagemB64] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [erroUpload, setErroUpload] = useState("");
  const emCurso = useRef(false);
  const inputRef = useRef(null);

  const iaUsada = !!answers.fotoIaUsada;
  const analise = answers.fotoAnalise?.analise || null;

  async function aoEscolher(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setErro("");
    setErroUpload("");
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
      setErroUpload("Formato não aceito. Envie uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_UPLOAD) {
      setErroUpload("Imagem muito grande (máximo 5 MB).");
      return;
    }
    try {
      const { dataUrl, local: medido } = await comprimirEAnalisar(file);
      setPreview(dataUrl);
      setImagemB64(dataUrl);
      setLocal(medido);
    } catch {
      setErroUpload("Não consegui abrir essa imagem. Tente outra.");
    }
  }

  async function analisarComIA() {
    // Teto rígido: uma única chamada paga por usuário, e nunca em paralelo.
    if (emCurso.current || iaUsada || !imagemB64) return;
    emCurso.current = true;
    setCarregando(true);
    setErro("");
    try {
      const resp = await fetch("/api/analisar-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagem: imagemB64,
          tecnica: local?.tecnicaTexto || "",
          contexto: {
            negocio: answers.negocio,
            oferece: answers.oferece,
            comprador: answers.comprador,
            objetivo: answers.objetivo,
            nome: answers.nome,
            arroba: answers.arroba,
            fotoEscolha: answers.fotoEscolha,
          },
        }),
      });
      const data = await resp.json().catch(() => null);
      if (resp.ok && data && data.analise) {
        patchAnswers({
          fotoIaUsada: true,
          fotoAnalise: { analise: data.analise, data: new Date().toISOString() },
        });
      } else if (resp.status === 502) {
        // A IA respondeu (consumo já aconteceu), mas fora do formato.
        patchAnswers({ fotoIaUsada: true });
        setErro("A análise com IA não veio completa. Siga com a checagem técnica abaixo.");
      } else {
        setErro(
          "A análise com IA está indisponível agora. Sua checagem técnica abaixo continua valendo.",
        );
      }
    } catch {
      setErro("Sem conexão com a análise de IA. Sua checagem técnica abaixo continua valendo.");
    } finally {
      setCarregando(false);
      emCurso.current = false;
    }
  }

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Foto de perfil</Eyebrow>
        <h2
          className="text-[19px] font-extrabold text-neutral-900 mb-2"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          Analisar a sua foto de perfil
        </h2>
        <p className="text-[13.5px] text-neutral-600 leading-relaxed mb-5">
          Envie a foto que você usa hoje (ou uma que esteja pensando em usar). Ela é analisada na
          hora e <strong>não fica guardada em lugar nenhum</strong>.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={aoEscolher}
          className="hidden"
        />

        <div className="flex flex-col items-center mb-5">
          <button
            onClick={() => inputRef.current && inputRef.current.click()}
            className="w-28 h-28 rounded-full border-2 border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center overflow-hidden active:scale-[0.98] transition-all"
          >
            {preview ? (
              <img src={preview} alt="Prévia da sua foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <Camera size={26} className="text-neutral-400" />
            )}
          </button>
          {preview && (
            <div className="mt-3 flex items-center gap-2">
              <img
                src={preview}
                alt="Prévia no tamanho do ícone do Instagram"
                className="w-[56px] h-[56px] rounded-full object-cover border border-neutral-200"
              />
              <span className="text-[11.5px] text-neutral-500">tamanho real no Instagram</span>
            </div>
          )}
          <button
            onClick={() => inputRef.current && inputRef.current.click()}
            className="mt-3 text-[13px] font-bold text-neutral-600 underline"
          >
            {preview ? "Trocar imagem" : "Enviar ou tirar foto"}
          </button>
        </div>

        {erroUpload && (
          <p className="text-[13px] text-red-600 font-semibold mb-4 text-center">{erroUpload}</p>
        )}

        {local && (
          <>
            <Bloco titulo="Checagem técnica da imagem">
              <p className="text-[13.5px] text-neutral-700 leading-relaxed mb-3">{local.resumo}</p>
              <div className="flex flex-col gap-2">
                {local.itens.map((it, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div
                      className={`w-5 h-5 rounded-md flex-none flex items-center justify-center ${it.ok ? "bg-yellow-400" : "bg-neutral-200"}`}
                    >
                      {it.ok ? (
                        <Check size={12} className="text-neutral-900" strokeWidth={3} />
                      ) : (
                        <AlertTriangle size={11} className="text-neutral-600" />
                      )}
                    </div>
                    <span className="text-[13px] text-neutral-700 leading-relaxed">{it.texto}</span>
                  </div>
                ))}
              </div>
            </Bloco>

            {!analise && !iaUsada && (
              <div className="mb-3">
                <Botao onClick={analisarComIA} disabled={carregando}>
                  {carregando ? (
                    "ANALISANDO SUA FOTO..."
                  ) : (
                    <>
                      <Sparkles size={16} /> ANALISAR MINHA FOTO
                    </>
                  )}
                </Botao>
                <p className="text-[11.5px] text-neutral-500 text-center mt-2">
                  Você tem 1 análise com inteligência artificial. A checagem técnica acima é
                  ilimitada.
                </p>
              </div>
            )}

            {iaUsada && !carregando && (
              <p className="text-[11.5px] text-neutral-500 text-center mb-3">
                Você já usou a sua análise com inteligência artificial. Pode trocar a imagem quantas
                vezes quiser — a checagem técnica acima continua funcionando.
              </p>
            )}

            {erro && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 mb-3">
                <p className="text-[13px] text-neutral-700 leading-relaxed mb-2">{erro}</p>
                {!iaUsada && (
                  <button
                    onClick={analisarComIA}
                    className="text-[13px] font-bold text-neutral-800 underline flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} /> Tentar de novo
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {analise && (
          <>
            <Bloco titulo="Análise da sua foto">
              {analise.aparece && (
                <p className="text-[13.5px] text-neutral-700 leading-relaxed mb-2">
                  {analise.aparece}
                </p>
              )}
              {analise.avaliacao && (
                <p className="text-[13.5px] text-neutral-700 leading-relaxed">{analise.avaliacao}</p>
              )}
              {analise.comunicaNegocio && (
                <p className="text-[13.5px] text-neutral-700 leading-relaxed mt-2">
                  {analise.comunicaNegocio}
                </p>
              )}
            </Bloco>
            <Bloco titulo="O que está funcionando">
              <Lista itens={analise.funcionando} />
            </Bloco>
            <Bloco titulo="O que eu mudaria">
              <Lista itens={[...(analise.prejudica || []), ...(analise.mudar || [])]} />
            </Bloco>
            <Bloco titulo="A foto que eu usaria no seu lugar">
              {analise.tipoIdeal && (
                <p className="text-[13.5px] font-semibold text-neutral-800 leading-relaxed mb-2">
                  {analise.tipoIdeal}
                </p>
              )}
              <p className="text-[13.5px] text-neutral-700 leading-relaxed">{analise.fotoIdeal}</p>
            </Bloco>
          </>
        )}
      </div>

      <div className="mt-5">
        <Botao onClick={onFinish} disabled={carregando}>
          {local || analise ? "CONCLUIR FOTO DE PERFIL" : "PULAR ESTA ETAPA"}{" "}
          <ArrowRight size={17} />
        </Botao>
      </div>
    </div>
  );
}
