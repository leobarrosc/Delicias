# Handoff — reformulação da interface do Delícias

Contexto para continuar o trabalho de UI. Escrito em 22/07/2026.

## Objetivo

Trocar o tema dark navy/teal (herdado de um reskin do Gentelella) por uma
identidade própria de confeitaria: **tons de chocolate e capuccino**, cantos
arredondados, aparência macia. Dois temas — diurno e noturno.

## Estado atual: migração concluída, telas ainda não convertidas

O build foi migrado e os temas estão escritos e verificados. As telas
continuam usando as classes antigas, que hoje funcionam através de uma ponte
de compatibilidade (ver abaixo).

### O que foi alterado

| Arquivo | Mudança |
|---|---|
| `package.json` | `tailwindcss` 3.4.19 → **4.3.3**; adicionados `@tailwindcss/postcss@4.3.3` e `daisyui@5.7.0`; removido `autoprefixer`; adicionado `"browserslist": "> 1%"` (evita o Lightning CSS do Turbopack polyfillar estilos e quebrar o daisyUI) |
| `postcss.config.mjs` | Plugins `tailwindcss` + `autoprefixer` → `@tailwindcss/postcss` |
| `tailwind.config.ts` | **Apagado.** Tailwind v4 configura por CSS |
| `src/app/globals.css` | Reescrito: importa Tailwind v4, registra daisyUI, define os dois temas, a escala de raio e a ponte de compatibilidade |
| `src/app/layout.tsx` | Fontes Fredoka + Nunito via `next/font`; `data-theme` no `<html>`; script inline que aplica o tema salvo antes da primeira pintura |
| `src/components/theme-toggle.tsx` | **Novo.** Alterna os temas, persiste em `localStorage` |
| `src/components/app-shell.tsx` | `ThemeToggle` adicionado ao header, ao lado do `Clock` |
| 14 arquivos `.tsx` | Renomes da v4: 40× `outline-none` → `outline-hidden`, 20× `shadow-sm` → `shadow-soft`, 2× `rounded` → `rounded-sm` |

Verificado: `npx tsc --noEmit` não acusa nenhum erro em `src/`, e o
`globals.css` compila limpo com `@tailwindcss/cli` + daisyUI 5.7.0.

## Os dois temas

Definidos em `globals.css` via `@plugin "daisyui/theme"`.

**`delicias`** (diurno, padrão) — base `#FFFCF8` / `#F7EFE6`, texto `#3B2A21`,
primária chocolate `#8B5E3C`, secundária framboesa `#A64B57`, acento espresso
`#5C4033`, sidebar `#4A362B`.

**`delicias-dark`** (noturno, também ativado por `prefers-color-scheme: dark`)
— base `#241A15` / `#1B1310`, texto `#F0E3D6`, primária caramelo `#D9A066`,
secundária framboesa clara `#E09AA3`, acento café com leite `#BFA07E`.

Raio: `--radius-box: 1.75rem`, `--radius-field: 1rem`,
`--radius-selector: 0.75rem`. Além disso a escala `rounded-*` do Tailwind foi
sobrescrita em `@theme` (`rounded-md` = 14px em vez de 6px), o que arredondou a
aplicação inteira sem editar classe.

## A ponte de compatibilidade — leia antes de mexer em cor

As telas usam ~630 classes `stone-*`, `brand-*` e `bg-card`, herdadas do reskin
antigo (onde a escala `stone` estava **invertida**: `stone-50` era o fundo
escuro e `stone-900` o texto claro).

Em vez de reescrever 19 arquivos de uma vez, o bloco `@theme inline` no fim do
`globals.css` remapeia essas escalas para as variáveis do daisyUI. Efeito: a
aplicação inteira troca de tema junto, sem edição.

Mapeamento semântico adotado:

- `stone-50` → `base-200` (fundo de página) · `stone-100` → `base-100`
  (superfícies) · `stone-200` → `base-300` (divisórias de card) ·
  `stone-800` → `neutral` (sidebar) · `bg-card` → `base-100`
- `stone-400/500` → `base-content` a 72% · `stone-600` → 82% ·
  `stone-700` → 90% · `stone-900/950` → 100%
- `stone-300` → `base-content` a **52%** — usado só em borda de campo de
  formulário, que é elemento funcional e precisa de 3:1
- `brand-600/500` → `primary` · `brand-700` → mistura de `primary` com
  `base-content` (escurece no tema claro, clareia no escuro, sozinho)
- `amber/sky/emerald/red` → `warning/info/success/error`, com fundos de chip a
  12% de tinta

**`@theme inline` é obrigatório aqui.** Sem o `inline`, o utilitário congela o
valor em build e para de reagir à troca de tema.

Isto é uma ponte, não o destino. Código novo deve usar as classes semânticas do
daisyUI (`bg-base-100`, `text-base-content`, `btn btn-primary`). A ponte pode
ser aposentada tela por tela; quando a última classe `stone-*` sumir, o bloco
inteiro sai.

## Acessibilidade

`design/contraste.md` tem a tabela completa: 74 pares texto/fundo calculados
replicando o `color-mix(in oklab, ...)` do CSS e a composição alfa do
navegador. **Zero reprovações em WCAG AA.**

Três ajustes vieram dessa verificação e não devem ser desfeitos sem recalcular:
o azul de `info` precisou escurecer para `#3A6485`; os fundos de chip caíram de
14% para 12% de tinta (acima disso o texto da mesma cor não alcança 4.5:1 em
cima do próprio chip); e `brand-700` virou mistura com `base-content`.

Decisão consciente: divisórias decorativas de card (`border-stone-200`) ficam em
1.5:1. A WCAG 1.4.11 cobre limites *necessários para identificar* um componente,
e um card já é delimitado por fundo e sombra. Bordas de campo de formulário
(`border-stone-300`), essas passam com folga.

Se mudar qualquer cor de tema, rode a verificação de novo antes de commitar.

## Pendências

1. **Testar `npm run dev`** — o build nunca rodou no Windows. É o próximo passo.
2. **Converter as telas** para classes semânticas do daisyUI e aposentar a
   ponte. Pode ser incremental, uma tela por PR.
3. **Trocar os ícones** de `lucide-react` para Phosphor (variantes `duotone` /
   `fill`). O lucide é traço fino e técnico; o duotone combina com o raio novo.
   Decisão de design já tomada, execução pendente.
4. **`lovable-project-3f638d7a/`** — projeto Lovable solto dentro do repo que o
   `tsconfig.json` está varrendo, gerando 181 erros de tipo. Não tem relação com
   a UI. Excluir do tsconfig ou remover do repo.

## Referências visuais

- `design/preview-tema-marrom.html` — dashboard nos dois temas, usando o CSS
  compilado de verdade a partir do `globals.css`. Botão no rodapé alterna.
- `design/preview-tema-fofo.html` — protótipo anterior, paleta rosa/pastel.
  Descartado em favor do marrom, mantido como referência de layout e de
  tratamento de sombra.
- `design/contraste.md` — tabela de contraste.

## Ferramentas

Documentação do daisyUI disponível via **Context7** (conector MCP já instalado).
O MCP oficial (Blueprint, US$ 600 vitalício) foi avaliado e descartado: as
alternativas gratuitas cobrem o caso, e o gerador de tema do próprio site
(`daisyui.com/theme-generator`) faz o que o Blueprint faria a mais.
