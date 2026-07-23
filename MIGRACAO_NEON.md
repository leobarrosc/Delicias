# Plano de migração: Supabase → Neon (mantendo a Vercel)

_Runbook — julho/2026. Objetivo: trocar o banco Postgres do Delicias do Supabase para o Neon, sem sair da Vercel, mantendo custo US$ 0 e eliminando a pausa de 7 dias do Supabase._

## Contexto e por que é uma troca barata

O Delicias já isola o banco atrás de duas variáveis de ambiente e um driver adapter. O runtime usa `@prisma/adapter-pg` (node-postgres) lendo `DATABASE_URL`; a CLI do Prisma (`db push`) usa `DIRECT_URL` via `prisma.config.ts`. Como o Neon fala Postgres/TCP padrão, **o adapter-pg funciona sem trocar de biblioteca** — a migração é essencialmente: criar o banco no Neon, trocar as duas strings de conexão e provisionar o schema. Nenhuma mudança de código de aplicação é obrigatória.

Dois fatos que sustentam o plano:

- **Neon tem região São Paulo (`aws-sa-east-1`).** Combina com o `gru1` fixado no `vercel.json`, então a latência app↔banco fica igual à de hoje e os dados continuam no Brasil. **Não precisa mexer na região da Vercel.**
- **Padrão de conexão do Neon:** `DATABASE_URL` usa o endpoint **pooled** (com `-pooler` no host, PgBouncer em transaction mode) e `DIRECT_URL` usa o endpoint **direto** (sem `-pooler`). Ambos exigem `?sslmode=require` na porta 5432. O pooled serve pro runtime; o direto serve pra `db push`/migrations/seed.

> Sobre prepared statements: o PgBouncer em transaction mode quebra prepared statements nomeados, mas o node-postgres (adapter-pg) usa statements anônimos por padrão — então **o `?pgbouncer=true` do Supabase não é necessário no Neon**. Basta `?sslmode=require`.

---

## Fase 0 — Decisão: preservar dados ou começar limpo

Antes de tudo, uma escolha que define a Fase 3:

- **Começar limpo (recomendado):** o projeto usa `prisma db push` (sem migrations versionadas) e, segundo o `DEPLOY.md`, ainda opera com "usuário demo fixo" (auth não implementada). Se não há dados reais a preservar, o caminho mais simples é recriar o schema no Neon e re-semear o usuário demo.
- **Preservar dados:** se já existe conteúdo no Supabase que você quer manter, use `pg_dump` → `pg_restore` (comandos na Fase 3, opção B).

**Ação:** confirme que não há dados de produção a perder. Em caso de dúvida, tire um `pg_dump` de backup mesmo que vá começar limpo — custa nada e serve de rede de segurança.

---

## Fase 1 — Criar o projeto no Neon

1. Crie conta em [neon.com](https://neon.com) (login com GitHub facilita).
2. **New Project** → região **AWS South America (São Paulo) — `aws-sa-east-1`**. Postgres 16+.
3. Dê um nome ao database (ex.: `delicias`).
4. Em **Connect / Connection Details**, copie **as duas** strings:
   - **Pooled** (host com `-pooler`) → vai virar `DATABASE_URL`.
   - **Direct / unpooled** (host sem `-pooler`) → vai virar `DIRECT_URL`.

Guarde as duas com senha. Formato esperado:

```
# Runtime da app (pooled, PgBouncer)
DATABASE_URL="postgresql://<user>:<password>@ep-xxxx-xxxx-pooler.sa-east-1.aws.neon.tech/delicias?sslmode=require"

# CLI do Prisma: db push / migrations / seed (direto, sem pooler)
DIRECT_URL="postgresql://<user>:<password>@ep-xxxx-xxxx.sa-east-1.aws.neon.tech/delicias?sslmode=require"
```

> Note a diferença Supabase→Neon: sai o `:6543 ?pgbouncer=true` (pooled) e o `:5432` do Supabase; no Neon **os dois usam 5432** e o que muda é o `-pooler` no host + `?sslmode=require`.

---

## Fase 2 — Ajustar `.env` e documentação do repo

O que precisa mudar no repositório é mínimo:

1. **`.env` local** — substituir os valores por Neon (formato acima).
2. **`.env.example`** — atualizar os comentários e o template para Neon (tirar as referências a Supabase/pgbouncer/porta 6543).
3. **`DEPLOY.md`** — trocar a seção do Supabase pela do Neon e remover a ressalva "Supabase Free pausa após ~1 semana" (o Neon faz scale-to-zero e retoma em ~0,5 s, sem essa pausa).
4. **Opcional (`src/lib/prisma.ts`)** — o código funciona como está; só vale atualizar o comentário que menciona "pooler do Supabase" para Neon. O `max: 3` em produção continua uma salvaguarda válida (o pooler do Neon aguenta até ~10k conexões, então não é gargalo).
5. **Não mexer:** `vercel.json` (região `gru1` continua certa), `prisma.config.ts` (já usa `DIRECT_URL`), `schema.prisma` e o `generator/datasource`.

_Posso fazer as edições dos itens 2, 3 e 4 direto no repo quando você mandar — o `.env` real (item 1) fica com você por conter segredo._

---

## Fase 3 — Provisionar o schema no Neon

### Opção A — Começar limpo (recomendado)

Com o `DIRECT_URL` já apontando para o Neon:

```bash
# cria todas as tabelas do schema.prisma no Neon
npm run db:push        # = prisma db push (usa DIRECT_URL via prisma.config.ts)

# regenera o client (o build já faz isso, mas garante local)
npm run db:generate
```

Depois, recrie o **usuário demo** rodando o mesmo passo que você usa hoje (script/seed atual). Se ainda não houver um script de seed, vale criar um `prisma/seed.ts` simples agora para tornar o setup reproduzível.

### Opção B — Preservar os dados do Supabase

Use uma versão recente do `pg_dump` (>= versão do servidor). Rode com os endpoints **diretos** (unpooled) dos dois lados:

```bash
# 1) dump do Supabase (schema + dados), sem donos/privilégios (evita erro de role)
pg_dump "postgresql://postgres.axhwzosasnzdtxrrlyws:<senha>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres" \
  --no-owner --no-privileges -Fc -f delicias.dump

# 2) restore no Neon (DIRECT_URL / unpooled)
pg_restore --no-owner --no-privileges \
  -d "postgresql://<user>:<password>@ep-xxxx-xxxx.sa-east-1.aws.neon.tech/delicias?sslmode=require" \
  delicias.dump
```

Confira ao final que as tabelas e contagens de linhas batem com a origem.

---

## Fase 4 — Testar localmente

Com o `.env` local no Neon:

```bash
npm run db:studio      # abre o Prisma Studio: confirme tabelas e dados
npm run dev            # sobe o Next.js apontando para o Neon
```

Smoke test manual: abra o app, faça **uma leitura** (listar algo) e **uma escrita** (criar/editar um registro), e confirme que persiste no Neon (recarregue o Studio). A primeira query depois de ociosidade pode levar ~0,5 s (cold start do scale-to-zero) — comportamento esperado no free tier.

---

## Fase 5 — Atualizar a Vercel e fazer redeploy

1. Vercel → projeto Delicias → **Settings → Environment Variables**.
2. Atualize `DATABASE_URL` (pooled) e `DIRECT_URL` (direto) nos três ambientes: **Production, Preview e Development**.
3. **Valide num Preview primeiro:** faça push numa branch para gerar um deploy de Preview e teste antes de tocar em produção. (Bônus: dá pra criar uma _branch_ do banco no Neon e apontar o Preview para ela, isolando testes dos dados reais.)
4. Com o Preview ok, faça o **Redeploy** de Production (ou promova o deploy).

> Como o build roda `prisma generate && next build` e as páginas são `force-dynamic`, nada acessa o banco em build-time — o redeploy é seguro sem passos extras.

---

## Fase 6 — Validar produção e desativar o Supabase

1. Smoke test na URL de produção (mesma checagem leitura+escrita da Fase 4).
2. **Não delete o Supabase ainda.** Deixe o projeto pausado ~1–2 semanas como rollback vivo.
3. Passado o período sem incidentes, delete o projeto Supabase e remova as strings antigas de qualquer lugar guardado.

---

## Rollback

Se algo quebrar em produção, a volta é rápida porque nada de código mudou de forma incompatível:

1. Na Vercel, restaure `DATABASE_URL`/`DIRECT_URL` para os valores antigos do Supabase (mantenha-os salvos num gerenciador de senhas antes de começar).
2. Redeploy. O app volta ao Supabase enquanto você investiga.

Gatilhos para acionar rollback: erros de conexão/SSL persistentes, timeouts em transações, ou divergência de dados após a Opção B.

---

## Checklist rápido

- [ ] Fase 0 — decisão dados (limpo vs. preservar) + backup de segurança
- [ ] Fase 1 — projeto Neon em `aws-sa-east-1` + 2 strings copiadas
- [ ] Fase 2 — `.env`, `.env.example`, `DEPLOY.md` (e comentário do `prisma.ts`) atualizados
- [ ] Fase 3 — `db push` (ou dump/restore) no Neon + seed demo
- [ ] Fase 4 — testado local (Studio + dev, leitura e escrita)
- [ ] Fase 5 — env vars na Vercel + validação em Preview + redeploy Production
- [ ] Fase 6 — validado em prod + Supabase pausado (deletar depois)

---

## Fontes

- [Neon — Regiões (São Paulo `aws-sa-east-1`)](https://neon.com/docs/introduction/regions) · [Changelog São Paulo](https://neon.com/docs/changelog/2025-02-28)
- [Prisma — Guia Neon (DATABASE_URL pooled / DIRECT_URL direto, `sslmode=require`)](https://www.prisma.io/docs/orm/overview/databases/neon) · [Neon Docs — Connect from Prisma](https://neon.com/docs/guides/prisma)
- [Neon — Connect from any application](https://neon.com/docs/connect/connect-from-any-app)
