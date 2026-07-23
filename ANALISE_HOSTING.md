# Análise de Dynamic Page Hosting para o Delicias

_Análise comparativa — julho/2026. Foco: custo e planos grátis._

## O que o Delicias precisa da hospedagem

Antes de comparar plataformas, vale fixar o que o projeto exige, porque isso elimina metade das opções logo de cara. O Delicias é **Next.js 16 + Prisma 7 + PostgreSQL**, hoje apontado para **Vercel + Supabase** (`vercel.json` na região `gru1`, `.env` com o pooler do Supabase). Não é um site estático: tem páginas `force-dynamic`, funções de servidor e depende de um banco Postgres vivo em runtime.

Isso significa que a plataforma precisa de **duas coisas**, e a pergunta de custo real é sobre as duas somadas:

1. **Runtime de aplicação** — um ambiente Node que rode `next start` (ou serverless equivalente) e faça build a partir do GitHub.
2. **Banco PostgreSQL** — na própria plataforma ou externo (Supabase, Neon, etc.).

Um "deploy grátis" que só cobre o item 1 e te empurra para um Postgres pago não é grátis de fato. Por isso a análise trata app **e** banco juntos.

## Onde os quatro ausentes se encaixam

Você notou que Zeabur, Sealos, RepoCloud e Dokploy não estão na FMHY. Verificando a fonte da FMHY diretamente, o quadro é o seguinte:

- **Dokploy já está na FMHY** — listado em _Software Dev Tools_ como "App Deployment", só que fora da âncora `#dynamic-page-hosting`. Ou seja, não é ausência, é categoria diferente.
- **Nept** é a aposta que a FMHY destaca para "deploy instantâneo de 20+ frameworks (Next.js, Python, Go…)" a partir do GitHub — é o equivalente moderno ao fluxo Vercel na lista deles.
- **Zeabur, Sealos e RepoCloud** realmente **não aparecem** na página.

O motivo provável da ausência: a seção de _Dynamic Page Hosting_ da FMHY privilegia serviços onde você conecta um repositório e eles hospedam (Vercel-like). Dos quatro, só o **Zeabur** encaixa direto nesse molde. **Sealos** é um "cloud OS" sobre Kubernetes, **RepoCloud** é um marketplace de apps open-source prontos, e **Dokploy** é um PaaS que você mesmo instala num servidor — três categorias adjacentes, não substitutos diretos de "conectar repo e publicar".

## Comparativo (ordenado por custo para o caso do Delicias)

| Plataforma | Categoria | Deploy do GitHub | Roda o banco Postgres? | Custo real p/ Delicias (app + banco) | Serve pro Delicias? |
|---|---|---|---|---|---|
| **Vercel + Neon** | PaaS serverless + Postgres serverless | Sim, nativo | Não (Neon externo, grátis) | **US$ 0** no free tier | Sim — melhor DX p/ Next.js |
| **Vercel + Supabase** (atual) | PaaS serverless + BaaS | Sim, nativo | Não (Supabase externo) | **US$ 0**, mas banco pausa após ~1 semana ocioso | Sim, com ressalva |
| **Dokploy** (num VPS seu) | PaaS self-hosted | Sim (Git/Docker) | Sim, no mesmo servidor | **~US$ 4–5/mês** de VPS (software grátis) | Sim — melhor custo a longo prazo |
| **Sealos** | Cloud OS (Kubernetes) | Sim (via App Launchpad) | Sim, mesmo cluster | Pay-as-you-go, ~US$ 1/dia de dev; barato | Sim, com curva de setup |
| **Zeabur** | PaaS gerenciado | Sim, nativo | Sim, 1-clique | Free trial US$ 5 de crédito; uso real ~**US$ 5/mês** | Sim — app+banco num lugar só |
| **Render** | PaaS container | Sim, nativo | Sim, mas **grátis expira em 30 dias** | Web grátis dorme; banco vira pago | Marginal (free tier fraco) |
| **Railway** | PaaS container | Sim, nativo | Sim | **Sem free tier**; mínimo ~US$ 5/mês | Só pago |
| **Fly.io** | Máquinas na borda | Sim (Dockerfile) | Sim (Postgres gerenciado) | **Sem free tier**; ~US$ 2/mês app mínimo + banco | Só pago |
| **Koyeb** | PaaS serverless | Sim, nativo | Add-on | Novos usuários **sem Starter grátis**; entrada US$ 29/mês | Caro agora |
| **RepoCloud** | Marketplace open-source | Não (apps prontos) | — | Cobrança por hora | **Não** — não publica seu repo custom |

Observações que não cabem na tabela: em qualquer plataforma que **não** seja a Vercel, o Next.js 16 roda como serviço Node (`next start`, idealmente com `output: 'standalone'`), o que funciona bem mas exige configurar porta/health check. Na Vercel é serverless nativo, sem esse trabalho.

## Leitura para prioridade "custo / grátis"

**Caminho US$ 0 recomendado agora (MVP/testes): Vercel Hobby + Neon.** Você mantém a DX de Next.js que já tem, e troca o Supabase pelo **Neon** no banco. O motivo é específico do seu caso: o `DEPLOY.md` já anota que o **Supabase Free pausa o banco após ~1 semana** sem uso — o Neon Free faz _scale-to-zero_ e **retoma em ~400–750 ms** na primeira query, sem essa pausa de 7 dias, com 100 CU-horas/mês. Para um projeto que ainda não tem tráfego constante, o Neon te dá "sempre disponível na prática" de graça, enquanto o Supabase te obriga a manter um ping ativo. A migração é barata: é trocar `DATABASE_URL`/`DIRECT_URL` e rodar `prisma db push`.

**Ressalva importante sobre "grátis" na Vercel:** o plano **Hobby é para uso não-comercial**. O `planejamento_plataforma_delicias.md` descreve o Delicias como uma plataforma de produto. No momento em que ele deixar de ser experimento pessoal e virar algo comercial, o free tier da Vercel deixa de cobrir e o custo pula para o **Pro (~US$ 20/mês)**. É exatamente aí que os "ausentes" ficam interessantes.

**Se o objetivo é o menor custo sustentável de um app comercial (app + banco juntos):**

- **Dokploy num VPS barato (~US$ 4–5/mês, ex.: Hetzner)** é o melhor custo-benefício a longo prazo. Software open-source e grátis, roda app **e** Postgres no mesmo servidor, sem limite de deploys nem de projetos, sem vendor lock-in. O trade-off é que você administra o servidor (updates, backups, TLS — o Dokploy automatiza boa parte via Traefik). Substitui Vercel **e** Supabase de uma vez.
- **Sealos** é a alternativa "pague só o que usar" sem administrar servidor cru: hospeda app + Postgres no mesmo cluster Kubernetes, com custo baixo (na casa de US$ 1/dia em desenvolvimento). Curva um pouco maior por ser orientado a k8s.
- **Zeabur** é o mais parecido com "Vercel que também roda seu banco": deploy do GitHub em 1 clique, Postgres 1-clique no mesmo projeto, conexão injetada automaticamente. Na prática são ~US$ 5/mês depois que o crédito de trial acaba — mais caro que o Dokploy, porém zero manutenção de infra.

**RepoCloud pode sair da lista:** ele publica apps open-source empacotados (n8n, Lobe Chat e afins) com 1 clique, não o seu repositório Next.js custom. Não serve para o Delicias.

## Recomendação em uma linha

Para **testar/validar de graça**: continue na **Vercel**, mas migre o banco para o **Neon** (resolve a pausa do Supabase, continua US$ 0). Quando o Delicias virar produto comercial, avalie **Dokploy num VPS** (menor custo, app+banco juntos) ou **Zeabur** (mesma ideia, sem manutenção, ~US$ 5/mês) — nessa ordem, se "custo" for o critério dominante.

## Próximos passos possíveis

Se quiser seguir, posso: (a) preparar o passo a passo da migração Supabase → Neon mantendo a Vercel; (b) escrever um `docker-compose`/config de Dokploy para o Delicias (Next.js standalone + Postgres); ou (c) montar um guia de deploy no Zeabur. É só dizer qual caminho.

---

## Fontes

- [FMHY — Developer Tools (Dynamic Page Hosting)](https://fmhy.net/developer-tools#dynamic-page-hosting)
- [Zeabur — Deploy Next.js](https://zeabur.com/docs/en-US/guides/nodejs/nextjs) · [Zeabur — PostgreSQL](https://zeabur.com/docs/marketplace/postgresql) · [Zeabur — Review & Pricing](https://getdeploying.com/zeabur)
- [Sealos DevBox](https://sealos.io/products/devbox/) · [Sealos — What is DevBox](https://sealos.io/blog/what-is-devbox/)
- [RepoCloud — Documentação](https://docs.repocloud.io/) · [RepoCloud (Product Hunt)](https://www.producthunt.com/products/repocloud-io)
- [Dokploy (GitHub)](https://github.com/dokploy/dokploy) · [Dokploy — Self-Hosted PaaS](https://dokploy.com/self-hosted-paas)
- [Railway — Free Tier 2026](https://www.srvrlss.io/provider/railway/) · [Render — Free Postgres expira em 30 dias](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90)
- [Fly.io — Free Tier em 2026](https://www.saaspricepulse.com/tools/flyio) · [Koyeb — Pricing/Limits](https://www.srvrlss.io/provider/koyeb/)
- [Neon vs Supabase — Free Tier (2026)](https://agentdeals.dev/neon-vs-supabase) · [Neon — Managed Postgres free tier](https://neon.com/faqs/managed-postgres-databases-free-tier)
