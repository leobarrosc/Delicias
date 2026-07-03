# Deploy na Vercel

O projeto já está pré-configurado para a Vercel. Checklist para o primeiro deploy:

## 1. Suba o código para o GitHub

A Vercel faz deploy a partir do repositório. Confirme que `.env` **não** está
versionado (o `.gitignore` já cuida disso).

## 2. Crie o projeto na Vercel

1. [vercel.com/new](https://vercel.com/new) → importe o repositório.
2. Framework detectado automaticamente: **Next.js**. Não mude build/output.
3. O `vercel.json` já fixa a região **gru1 (São Paulo)**, colada no banco
   Supabase de `sa-east-1` — menos latência por requisição.

## 3. Variáveis de ambiente (Settings → Environment Variables)

| Variável       | Valor                                                    |
| -------------- | -------------------------------------------------------- |
| `DATABASE_URL` | Transaction Pooler do Supabase (porta 6543, `?pgbouncer=true`) |
| `DIRECT_URL`   | Session Pooler (porta 5432) — opcional, só para migrations |

Copie as strings no painel do Supabase em **Connect**. Use os mesmos valores do
seu `.env` local (veja `.env.example`).

## 4. O que já está pré-ajustado no código

- **`postinstall: prisma generate`** e **`build: prisma generate && next build`**
  — o Prisma Client é gerado no build da Vercel (o cache de dependências da
  Vercel pula o postinstall às vezes; o build cobre esse caso).
- **Pool de conexões limitado em produção** (`src/lib/prisma.ts`) — evita
  esgotar os clientes do pooler do Supabase quando as funções serverless escalam.
- **Versões fixadas no `package.json`** — nada de `latest`; builds reproduzíveis.
- **Páginas com `force-dynamic`** — nada tenta acessar o banco durante o build.

## 5. Atenções pós-deploy

- **Supabase Free pausa o banco após ~1 semana sem uso.** Em produção real,
  considere o plano pago ou um ping periódico para manter o projeto ativo.
- **Schema:** o projeto usa `prisma db push` (sem migrations versionadas).
  Rode `npm run db:push` localmente após mudar o `schema.prisma`, antes do
  deploy. Quando o produto estabilizar, vale migrar para `prisma migrate`.
- **Autenticação ainda não existe** (usuário demo fixo). Antes de expor a URL
  publicamente, implemente o login (MVP 1 do planejamento) ou proteja o deploy
  com [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection).
