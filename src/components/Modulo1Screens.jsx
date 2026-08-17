import React, { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Sparkles, AlertTriangle, Instagram, Plus } from "lucide-react";
import {
  analisarNome,
  analisarArroba,
  analisarBio,
  recomendacaoDeFoto,
  pendenciasDoPerfil,
} from "./diagnostico.js";

const FONT_DISPLAY = "'Manrope', system-ui, sans-serif";

/* ---------------------------- UI base ---------------------------- */

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
    <p className="text-[10.5px] font-extrabold tracking-[0.14em] text-yellow-600 uppercase mb-2.5">
      {children}
    </p>
  );
}

function Titulo({ children }) {
  return (
    <h2
      className="text-[20px] font-extrabold text-neutral-900 mb-3 leading-[1.25] tracking-tight"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      {children}
    </h2>
  );
}

/* tom: "amarelo" = recomendação (destaque) | padrão = análise (neutro) */
function Bloco({ titulo, children, tom }) {
  const destaque = tom === "amarelo";
  const cor = destaque
    ? "bg-yellow-50 border-yellow-300 shadow-[0_2px_10px_-6px_rgba(161,98,7,0.35)]"
    : "bg-neutral-50/70 border-neutral-200";
  return (
    <div className={`${cor} border rounded-2xl p-4 mb-2.5`}>
      <p
        className={`text-[10.5px] font-extrabold tracking-[0.12em] uppercase mb-2 ${
          destaque ? "text-yellow-700" : "text-neutral-400"
        }`}
        style={{ fontFamily: FONT_DISPLAY }}
      >
        {titulo}
      </p>
      {children}
    </div>
  );
}

function Lista({ itens, icone }) {
  if (!itens || itens.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {itens.map((t, i) => (
        <li key={i} className="flex gap-2 text-[13.5px] text-neutral-700 leading-relaxed">
          <span className="flex-none mt-0.5">
            {icone === "alerta" ? (
              <AlertTriangle size={13} className="text-neutral-400" />
            ) : (
              <Check size={13} className="text-yellow-500" strokeWidth={3} />
            )}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Opcao({ ativo, titulo, descricao, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.99] ${
        ativo
          ? "bg-yellow-400 border-yellow-400 text-neutral-900 shadow-[0_4px_14px_-8px_rgba(161,98,7,0.6)]"
          : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
      }`}
    >
      <p className="text-[13.5px] font-bold leading-snug">{titulo}</p>
      {descricao && <p className="text-[12px] opacity-70 mt-1 leading-snug">{descricao}</p>}
    </button>
  );
}


/* ------------------- 1. Como está seu Instagram ------------------- */

export function PerfilStatus({ value, onSelect, onNext }) {
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center mb-6">
          <Instagram size={22} className="text-neutral-900" />
        </div>
        <Titulo>Como está seu Instagram hoje?</Titulo>
        <p className="text-[13.5px] text-neutral-500 leading-relaxed mb-5">
          A partir daqui eu vou analisar o seu perfil e dizer o que eu faria no seu lugar. Só
          preciso saber de onde estamos partindo.
        </p>
        <div className="flex flex-col gap-2.5">
          <Opcao
            ativo={value === "sim"}
            titulo="Já tenho um Instagram e quero melhorar meu perfil"
            descricao="Vou olhar o que você usa hoje e apontar o que mudar."
            onClick={() => onSelect("sim")}
          />
          <Opcao
            ativo={value === "nao"}
            titulo="Ainda não tenho Instagram e quero montar do zero"
            descricao="Vou montar nome, @, foto e bio junto com você."
            onClick={() => onSelect("nao")}
          />
        </div>
      </div>
      <div className="mt-5">
        <Botao onClick={onNext} disabled={!value}>
          CONTINUAR <ArrowRight size={17} />
        </Botao>
      </div>
    </div>
  );
}

/* ------------------- Tela genérica de recomendação ------------------- */

function TelaRecomendacao({
  eyebrow,
  perguntaAtual,
  placeholder,
  valorAtual,
  onChangeAtual,
  botaoAnalisar,
  temInstagram,
  analise,
  escolha,
  setEscolha,
  manual,
  setManual,
  rotuloManter,
  onNext,
  multiline,
  contador,
}) {
  const [analisado, setAnalisado] = useState(temInstagram !== "sim");
  const mostra = analisado;

  const valorFinal =
    escolha === "manual" ? manual : escolha === "atual" ? valorAtual : escolha || "";
  const podeAvancar = !!(valorFinal && valorFinal.trim());

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        {temInstagram === "sim" && (
          <>
            <Titulo>{perguntaAtual}</Titulo>
            {multiline ? (
              <textarea
                value={valorAtual}
                onChange={(e) => onChangeAtual(e.target.value)}
                rows={4}
                placeholder={placeholder}
                className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[14.5px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            ) : (
              <input
                value={valorAtual}
                onChange={(e) => onChangeAtual(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[14.5px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            )}
            {!mostra && (
              <div className="mt-4">
                <Botao onClick={() => setAnalisado(true)}>
                  <Sparkles size={16} /> {botaoAnalisar}
                </Botao>
                <button
                  onClick={() => setAnalisado(true)}
                  className="w-full mt-3 text-[13px] font-bold text-neutral-500 underline"
                >
                  Não tenho isso preenchido hoje
                </button>
              </div>
            )}
          </>
        )}

        {mostra && (
          <div className="mt-4">
            <Bloco titulo="Minha avaliação">
              <p className="text-[13.5px] text-neutral-700 leading-relaxed">{analise.avaliacao}</p>
            </Bloco>

            {analise.funcionando.length > 0 && (
              <Bloco titulo="O que está funcionando">
                <Lista itens={analise.funcionando} />
              </Bloco>
            )}

            {analise.mudar.length > 0 && (
              <Bloco titulo="O que eu mudaria">
                <Lista itens={analise.mudar} icone="alerta" />
              </Bloco>
            )}

            <Bloco titulo="Minha recomendação" tom="amarelo">
              <p className="text-[15px] font-extrabold text-neutral-900 leading-snug whitespace-pre-line mb-2">
                {analise.recomendada}
              </p>
              <p className="text-[13px] text-neutral-700 leading-relaxed">{analise.porque}</p>
            </Bloco>

            <p className="text-[13px] font-bold text-neutral-800 mb-2 mt-4">Você quer:</p>
            <div className="flex flex-col gap-2">
              <Opcao
                ativo={escolha === analise.recomendada}
                titulo="Usar a minha recomendação"
                descricao={analise.recomendada}
                onClick={() => setEscolha(analise.recomendada)}
              />
              {(analise.sugestoes || analise.versoes || [])
                .map((s) => (typeof s === "string" ? s : s.texto))
                .filter((s) => s && s !== analise.recomendada)
                .map((s) => (
                  <Opcao
                    key={s}
                    ativo={escolha === s}
                    titulo="Usar esta outra sugestão"
                    descricao={s}
                    onClick={() => setEscolha(s)}
                  />
                ))}
              {temInstagram === "sim" && valorAtual.trim() && (
                <Opcao
                  ativo={escolha === "atual"}
                  titulo={rotuloManter}
                  descricao={valorAtual}
                  onClick={() => setEscolha("atual")}
                />
              )}
              <Opcao
                ativo={escolha === "manual"}
                titulo="Escrever do meu jeito"
                onClick={() => setEscolha("manual")}
              />
            </div>

            {escolha === "manual" &&
              (multiline ? (
                <textarea
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  rows={4}
                  placeholder={placeholder}
                  className="mt-3 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[14.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              ) : (
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder={placeholder}
                  className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[14.5px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              ))}

            {contador && valorFinal && (
              <p
                className={`text-right text-[11.5px] mt-1.5 ${
                  valorFinal.length > 150 ? "text-red-500 font-bold" : "text-neutral-400"
                }`}
              >
                {valorFinal.length}/150 caracteres
              </p>
            )}
          </div>
        )}
      </div>

      {mostra && (
        <div className="mt-5">
          <Botao onClick={() => onNext(valorFinal.trim())} disabled={!podeAvancar}>
            CONTINUAR <ArrowRight size={17} />
          </Botao>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Nome --------------------------- */

export function NomeAnalise({ answers, patchAnswers, onNext }) {
  const temInstagram = answers.temInstagram || "sim";
  const [atual, setAtual] = useState(answers.nomeAtual || "");
  const [escolha, setEscolha] = useState("");
  const [manual, setManual] = useState(answers.nome || "");
  const analise = useMemo(
    () => analisarNome(temInstagram === "sim" ? atual : "", { ...answers, nomeAtual: atual }),
    [atual, answers, temInstagram],
  );
  return (
    <TelaRecomendacao
      eyebrow="Nome do perfil"
      perguntaAtual="Qual nome aparece hoje no seu perfil?"
      placeholder="Ex: Delícias da Maria"
      valorAtual={atual}
      onChangeAtual={(v) => {
        setAtual(v);
        patchAnswers({ nomeAtual: v });
      }}
      botaoAnalisar="ANALISAR MEU NOME"
      temInstagram={temInstagram}
      analise={analise}
      escolha={escolha}
      setEscolha={setEscolha}
      manual={manual}
      setManual={setManual}
      rotuloManter="Manter o nome que já uso"
      onNext={(valor) => {
        patchAnswers({ nome: valor, nomeAtual: atual });
        onNext();
      }}
    />
  );
}

/* --------------------------- @ --------------------------- */

export function ArrobaAnalise({ answers, patchAnswers, onNext }) {
  const temInstagram = answers.temInstagram || "sim";
  const [atual, setAtual] = useState(answers.arrobaAtual || "");
  const [escolha, setEscolha] = useState("");
  const [manual, setManual] = useState(answers.arroba || "");
  const analise = useMemo(
    () =>
      analisarArroba(temInstagram === "sim" ? atual : "", {
        ...answers,
        nomeAtual: answers.nomeAtual,
      }),
    [atual, answers, temInstagram],
  );
  return (
    <div className="h-full">
      <TelaRecomendacao
        eyebrow="@ do perfil"
        perguntaAtual="Qual é o seu @ hoje?"
        placeholder="@seuusuario"
        valorAtual={atual}
        onChangeAtual={(v) => {
          setAtual(v);
          patchAnswers({ arrobaAtual: v });
        }}
        botaoAnalisar="ANALISAR MEU @"
        temInstagram={temInstagram}
        analise={analise}
        escolha={escolha}
        setEscolha={setEscolha}
        manual={manual}
        setManual={setManual}
        rotuloManter="Manter o @ que já uso"
        onNext={(valor) => {
          patchAnswers({ arroba: valor, arrobaAtual: atual });
          onNext();
        }}
      />
    </div>
  );
}

/* --------------------------- Bio --------------------------- */

export function BioDiagnostico({ answers, patchAnswers, onFinish }) {
  const temInstagram = answers.temInstagram || "sim";
  const [atual, setAtual] = useState(answers.bioAtual || "");
  const [escolha, setEscolha] = useState("");
  const [manual, setManual] = useState(answers.bioFinal || "");
  const [copiado, setCopiado] = useState(false);
  const analise = useMemo(
    () => analisarBio(temInstagram === "sim" ? atual : "", answers),
    [atual, answers, temInstagram],
  );

  async function concluir(valor) {
    patchAnswers({ bioFinal: valor, bioAtual: atual });
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
    } catch (e) {
      /* clipboard indisponível */
    }
    onFinish();
  }

  return (
    <TelaRecomendacao
      eyebrow="Bio"
      perguntaAtual="Cole aqui a bio que está no seu perfil hoje"
      placeholder="Copie do Instagram e cole aqui"
      valorAtual={atual}
      onChangeAtual={(v) => {
        setAtual(v);
        patchAnswers({ bioAtual: v });
      }}
      botaoAnalisar="ANALISAR MINHA BIO"
      temInstagram={temInstagram}
      analise={analise}
      escolha={escolha}
      setEscolha={setEscolha}
      manual={manual}
      setManual={setManual}
      rotuloManter="Manter a bio que já uso"
      onNext={concluir}
      multiline
      contador
    />
  );
}

/* --------------------- Foto: recomendação --------------------- */

export function FotoRecomendacao({ answers, patchAnswers, onNext }) {
  const rec = recomendacaoDeFoto(answers);
  const temInstagram = answers.temInstagram || "sim";
  const opcoes =
    temInstagram === "sim"
      ? ["Meu logotipo", "Minha foto", "Foto de produto", "Outra imagem", "Ainda não tenho"]
      : [
          "Pretendo usar meu logotipo",
          "Pretendo usar uma foto minha",
          "Pretendo usar uma foto de produto",
          "Ainda não sei",
        ];
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Foto de perfil</Eyebrow>
        <Titulo>A foto que eu usaria no seu lugar</Titulo>
        <Bloco titulo="Minha recomendação para o seu negócio" tom="amarelo">
          <p className="text-[14px] font-extrabold text-neutral-900 mb-2">{rec.tipo}</p>
          <p className="text-[13.5px] text-neutral-700 leading-relaxed">{rec.texto}</p>
        </Bloco>
        <p className="text-[14px] font-bold text-neutral-800 mb-3 mt-4">
          {temInstagram === "sim" ? "O que você usa hoje?" : "O que você pretende usar?"}
        </p>
        <div className="flex flex-col gap-2">
          {opcoes.map((opt) => (
            <Opcao
              key={opt}
              ativo={answers.fotoEscolha === opt}
              titulo={opt}
              onClick={() => patchAnswers({ fotoEscolha: opt })}
            />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <Botao onClick={onNext} disabled={!answers.fotoEscolha}>
          ANALISAR MINHA FOTO <ArrowRight size={17} />
        </Botao>
      </div>
    </div>
  );
}

/* --------------------- Revisão: perfil recomendado --------------------- */

export function PerfilRecomendado({ answers, onFinish }) {
  const [copiado, setCopiado] = useState("");
  const pendencias = pendenciasDoPerfil(answers);
  const fotoRec = answers.fotoAnalise?.analise?.fotoIdeal || recomendacaoDeFoto(answers).texto;

  async function copiar(texto, chave) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {}
    setCopiado(chave);
    setTimeout(() => setCopiado(""), 2000);
  }

  function Campo({ rotulo, valor, chave }) {
    return (
      <div className="mb-4">
        <p className="text-[11px] font-bold tracking-wide text-neutral-400 uppercase mb-1">
          {rotulo}
        </p>
        <p className="text-[14px] font-semibold text-neutral-900 leading-relaxed whitespace-pre-line">
          {valor || "—"}
        </p>
        {valor && chave && (
          <button
            onClick={() => copiar(valor, chave)}
            className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-neutral-500 underline"
          >
            <Copy size={12} /> {copiado === chave ? "Copiado!" : "Copiar"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <Eyebrow>Perfil organizado</Eyebrow>
        <Titulo>Seu perfil recomendado</Titulo>
        <p className="text-[13.5px] text-neutral-500 leading-relaxed mb-4">
          É assim que o seu perfil deveria aparecer para quem chega no seu Instagram.
        </p>

        {/* Prévia no formato de perfil */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 mb-4 shadow-[0_8px_24px_-20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center flex-none">
              <Instagram size={24} className="text-neutral-900" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[15px] font-extrabold text-neutral-900 leading-snug break-words"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {answers.nome || "—"}
              </p>
              <p className="text-[13px] text-neutral-500 break-words">{answers.arroba || "—"}</p>
            </div>
          </div>
          <p className="text-[13.5px] text-neutral-800 leading-relaxed whitespace-pre-line mb-3">
            {answers.bioFinal || "—"}
          </p>
          {(answers.destaquesSelecionados || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-neutral-100">
              {answers.destaquesSelecionados.map((d) => (
                <span
                  key={d}
                  className="px-2.5 py-1 rounded-full bg-neutral-50 border border-neutral-200 text-[11px] font-semibold text-neutral-600"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Campos com cópia */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-4">
          <Campo rotulo="Nome" valor={answers.nome} chave="nome" />
          <Campo rotulo="@" valor={answers.arroba} chave="arroba" />
          <Campo rotulo="Foto de perfil" valor={fotoRec} />
          <Campo rotulo="Bio" valor={answers.bioFinal} chave="bio" />
        </div>


        {pendencias.length > 0 && (
          <Bloco titulo="Pontos que eu ainda ajustaria">
            <Lista itens={pendencias} icone="alerta" />
          </Bloco>
        )}

        <div className="bg-yellow-400 rounded-2xl p-5 mb-4 text-center">
          <p
            className="text-[16px] font-extrabold text-neutral-900"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            É assim que o seu perfil deveria ficar.
          </p>
        </div>
        <p className="text-[13.5px] text-neutral-500 leading-relaxed">
          Agora começa a segunda parte: transformar esse perfil em conteúdo que ajuda sua empresa a
          ser encontrada, lembrada e escolhida.
        </p>
      </div>
      <div className="mt-5">
        <Botao onClick={onFinish}>
          COMEÇAR MINHA ESTRATÉGIA DE CONTEÚDO <ArrowRight size={17} />
        </Botao>
      </div>
    </div>
  );
}
