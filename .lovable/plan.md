# Análise da foto de perfil com IA (Módulo 1 · Foto)

Opção A confirmada: **sem Lovable Cloud**. A imagem é analisada e descartada; só o texto do resultado fica salvo no mesmo `localStorage` já usado hoje.

## 1. Telas adicionadas

Um único passo novo, `foto3`, **depois** de `foto2` (as telas `foto1` e `foto2` ficam intactas). A seção passa de 2 para 3 passos: `Foto de perfil · Passo 3 de 3`.

`foto3` tem três estados na mesma tela, no design atual (cards brancos arredondados, botão amarelo, tipografia existente):

1. **Envio** — "Analisar a sua foto de perfil", botão de enviar/tirar foto (`input type=file` com `accept="image/*"`, no celular abre galeria ou câmera), preview circular no tamanho real do Instagram, botão amarelo "Analisar minha foto" e um link discreto "Pular esta etapa".
2. **Analisando** — estado de carregamento com o mesmo estilo de botão desabilitado.
3. **Resultado** — exatamente os quatro blocos pedidos:
   - **Análise da sua foto** (avaliação curta)
   - **O que está funcionando**
   - **O que eu mudaria**
   - **A foto que eu usaria no seu lugar**
   E abaixo: "Trocar imagem e analisar de novo" + botão "Concluir esta etapa" (chama o `completeSection("foto", ...)` já existente).

Se a análise falhar (sem internet, erro da IA), aparece uma mensagem curta com "Tentar de novo" e a opção de seguir sem análise — a etapa nunca trava o fluxo.

## 2. Arquivos alterados / criados

| Arquivo | O que muda |
| --- | --- |
| `src/routes/api/analisar-foto.ts` (**novo**) | Rota de servidor que recebe a imagem e chama o Lovable AI Gateway. A chave nunca vai ao navegador. |
| `src/components/FotoAnalise.jsx` (**novo**) | A tela `foto3` (envio, compressão da imagem, chamada da rota, exibição do resultado), usando os mesmos componentes visuais do app. |
| `src/components/InstagramOrganizado.jsx` | Só o mínimo: `FOTO_STEPS` passa a `["foto1","foto2","foto3"]`; `foto2` avança para `foto3` em vez de concluir; render de `{screen === "foto3" && <FotoAnalise .../>}`; novo campo `fotoAnalise` em `DEFAULT_ANSWERS`; e uma referência ao resultado na tela de revisão (item 5). Nenhum texto educativo existente é alterado ou removido. |

## 3. Como a imagem chega até a IA

1. No celular, a imagem escolhida é **redimensionada no próprio navegador** (canvas, lado maior ~768px, JPEG qualidade ~0.8) — deixa o envio rápido em 4G e evita arquivos grandes.
2. Vira uma string base64 e é enviada por `POST` para `/api/analisar-foto`, junto com o contexto do Módulo 1: `negocio`, `oferece`, `comprador`, `objetivo`, `nome`, `arroba` e a escolha feita em `foto2` (`fotoEscolha`).
3. O servidor repassa para o Lovable AI Gateway e devolve **apenas o texto da análise**. A imagem não é gravada em disco, banco ou storage — existe só na memória durante a requisição e no navegador enquanto a pessoa está na tela.
4. Validação: aceita JPG/PNG/WebP, limite ~5 MB antes da compressão.

## 4. Modelo e prompt

- Modelo multimodal: **`google/gemini-3.6-flash`** pelo Lovable AI Gateway (rápido, barato e com boa leitura de imagem). Sem contas ou chaves externas — o custo sai dos créditos do workspace.
- Saída em **JSON estruturado** com os campos `avaliacao`, `funcionando[]`, `melhorar[]`, `fotoIdeal` — garante que a tela sempre tenha os quatro blocos preenchidos.
- O prompt obriga a IA a: descrever o que realmente aparece na imagem antes de julgar; avaliar nitidez, luz, enquadramento, excesso de elementos e textos pequenos considerando o ícone circular minúsculo do Instagram; avaliar profissionalismo e confiança; cruzar tudo com o tipo de negócio informado; e dizer se rosto, produto, ambiente ou logotipo é o mais adequado ali. É proibido responder de forma genérica ("está boa", "use algo profissional") — a resposta tem de citar elementos concretos da foto enviada. Linguagem simples, em português, direta ao dono do pequeno negócio, mesmo tom do resto do app.

## 5. Como o resultado entra no diagnóstico final

- Salvo em `answers.fotoAnalise` (junto com a data), no mesmo `localStorage` de sempre — some ao "Recomeçar meu planejamento", como o restante.
- **`foto2`**: nada muda; ao concluir o checklist a pessoa segue para `foto3`.
- **Hub do Módulo 1**: a seção "Foto de perfil" só é marcada como concluída ao final de `foto3` (ou ao pular).
- **Revisão do perfil (`revisao3`)**: dentro do resumo já existente, a linha da foto passa a mostrar um pequeno bloco "A foto que eu usaria no seu lugar" com a recomendação personalizada — se a análise não tiver sido feita, o resumo segue exatamente como está hoje.
- Nada disso interfere no Módulo 2.

## 6. Fora do escopo

Sem banco, sem storage, sem histórico entre aparelhos, sem alterar Módulo 2, sem mudar textos existentes de `foto1`/`foto2`.
