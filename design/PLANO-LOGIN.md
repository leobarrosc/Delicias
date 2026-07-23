# Plano — login com Google, whitelist e conta do usuário

Documento de planejamento. Escrito em 22/07/2026. **Nada aqui foi implementado
ainda** — o objetivo é fechar as decisões antes de escrever código.

## Objetivo

Fechar a plataforma atrás de login Google, com duas contas autorizadas:

| Conta | Papel | O que vê |
|---|---|---|
| `gomesdeoliveiraj2@gmail.com` | `CONFEITEIRA` | a plataforma inteira (dashboard, insumos, receitas, clientes, pedidos, financeiro) |
| `leonardobarros64@gmail.com` | `ADMIN` | um painel de controle com métricas de uso |

E dar ao usuário uma tela de conta com foto de perfil, nome próprio, nome da
empresa, CNPJ e logo — a logo substituindo o ícone no canto superior esquerdo.

## O que já existe a favor (levantado no código)

Isto é o achado mais importante do levantamento: **a aplicação já é
multi-tenant.** Não há refatoração grande pela frente.

- Todo modelo do `schema.prisma` tem `userId` com `onDelete: Cascade`, e toda
  query já filtra por ele.
- Existe uma costura única: [`src/lib/demo-user.ts`](../src/lib/demo-user.ts)
  expõe `getCurrentUserId()`, chamado em **12 lugares** (6 `page.tsx` e 6
  `actions.ts`). Hoje ele faz `upsert` de um usuário fixo
  `confeiteira@delicias.local`.
- `ConfiguracaoUsuario` já é 1:1 com `User` — é o lugar natural para preferências.
- Não existe `middleware.ts` ainda; o arquivo entra limpo.

**Consequência:** trocar o usuário-demo pela sessão real é reescrever o corpo de
uma função. Os 12 chamadores não mudam de assinatura. Isso derruba muito do risco
do projeto.

## Decisões propostas

### 1. Biblioteca: Auth.js v5 (`next-auth@beta`)

É a opção com melhor encaixe no App Router do Next 16 e com provider Google de
primeira classe. A alternativa avaliada foi `better-auth`; não compensa trocar,
porque o caso aqui é o mais batido possível (um provider OAuth, dois usuários).

### 2. Whitelist no callback `signIn`, com verificação de e-mail

O padrão documentado do Auth.js para restringir acesso é o callback `signIn`.
A lista fica em variável de ambiente, não no código:

```ts
// auth.ts — esboço, não é o código final
callbacks: {
  async signIn({ account, profile }) {
    if (account?.provider !== "google") return false;
    // profile.email_verified é obrigatório: sem ele, um e-mail do Google
    // pode não ter sido comprovado e a whitelist vira contornável.
    if (!profile?.email_verified) return false;
    return ALLOWED_EMAILS.includes(profile.email!.toLowerCase());
  },
}
```

Duas coisas que **não** podem ser esquecidas aqui:

- **`profile.email_verified` é obrigatório.** A doc do Auth.js destaca isso. Sem
  essa checagem, a whitelist compara um e-mail que o Google não garantiu.
- **A whitelist é servidor.** Nunca chega ao cliente e nunca é a única barreira:
  cada rota protegida revalida a sessão no servidor.

`ALLOWED_EMAILS` como env var (separada por vírgula) evita redeploy para trocar
o código, mas exige redeploy para trocar a lista. Para 2 pessoas, é o certo.
Quando virar "convidar usuárias pela interface", vira tabela no banco — não antes.

### 3. Sessão: JWT, não banco

`session: { strategy: "jwt" }`, com `PrismaAdapter` só para persistir usuário e
conta.

O motivo é custo de banco: a Vercel roda serverless e o plano do Neon/Supabase é
o gratuito. Sessão em banco significa uma consulta a cada navegação. Com JWT, o
`role` e o `userId` viajam no cookie assinado e a maioria das páginas não toca no
banco por causa de auth. O contra é que revogar sessão na hora fica mais difícil
— irrelevante com dois usuários conhecidos.

### 4. Papéis

```prisma
enum UserRole {
  ADMIN
  CONFEITEIRA
}
```

O papel é derivado do e-mail na primeira entrada e gravado no `User`. A checagem
de admin é **sempre no servidor**, em toda rota `/admin/*` — esconder o item no
menu é cosmético, não é controle de acesso.

### 5. Métricas do painel admin

Um modelo novo, alimentado a cada login:

```prisma
model AcessoLog {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

O painel mostraria: total de acessos, último acesso por usuária, acessos por dia
nos últimos 30 dias e contagem dos registros do negócio (pedidos, receitas,
clientes).

**Sobre gravar IP e user-agent:** dá para enriquecer o log com isso, mas IP é
dado pessoal sob a LGPD e passa a exigir base legal e retenção definida. Para uma
métrica de "número de acessos" entre duas pessoas que se conhecem, não vejo o que
isso acrescenta. **Proposta: não gravar.** Se um dia precisar, entra com política
de descarte junto.

### 6. Conta do usuário

Campos novos no `User`:

| Campo | Tipo | Observação |
|---|---|---|
| `role` | `UserRole` | derivado do e-mail |
| `imagem` | `String?` | foto de perfil (URL) |
| `empresaNome` | `String?` | nome da confeitaria |
| `logoUrl` | `String?` | substitui o ícone no topo da sidebar |
| `cnpj` | `String?` | 14 dígitos, sem máscara |

`nome` já existe e passa a ser o nome próprio, editável (hoje vem fixo do
usuário-demo).

**CNPJ:** guardar só dígitos e formatar na exibição. Validar os dois dígitos
verificadores — um CNPJ inválido salvo hoje vira um comprovante errado depois.
Campo opcional: ela pode não ter CNPJ, e travar o cadastro nisso seria pior.

**Imagens (foto e logo):** precisam de storage de verdade — base64 no Postgres
inviabiliza o plano gratuito rápido. Proposta: **Vercel Blob**, que já está no
mesmo painel do deploy. Alternativas gratuitas existem (Cloudinary), mas somam
mais um serviço. **Isto tem custo potencial e merece sua decisão** — ver Questões
em aberto.

### 7. Logo na sidebar

Hoje [`sidebar.tsx`](../src/components/sidebar.tsx) tem um ícone `CakeSlice`
fixo. Passa a: se `logoUrl` existir, renderiza a imagem; senão, mantém o
`CakeSlice` como fallback. O fallback importa — sem ele a interface fica quebrada
até alguém subir uma logo.

## Telas

1. **`/login`** — fora do `AppShell` (sem sidebar nem header). Um card centrado,
   logo, "Entrar com Google". Mensagem de erro clara para quem não está na
   whitelist: precisa dizer que o acesso é restrito, sem revelar quem tem acesso.
2. **`/minha-conta`** — formulário com foto, nome, empresa, CNPJ e logo. Ligado
   ao botão "Minha conta" que já existe no rodapé da sidebar e hoje não faz nada.
3. **`/admin`** — só para `ADMIN`. Cards de métrica reaproveitando o visual do
   dashboard.

Todas seguem os temas daisyUI já implantados. Telas novas usam as classes
semânticas (`bg-base-100`, `btn btn-primary`), **não** a ponte `stone-*` — a
ponte é legado a ser aposentado, conforme o [HANDOFF](HANDOFF.md).

## Fases sugeridas

| # | Entrega | Depende de |
|---|---|---|
| 1 | Auth.js + Google + whitelist + `/login` + middleware; `getCurrentUserId()` passa a ler a sessão | credenciais do Google Cloud |
| 2 | Campos novos no `User`, `/minha-conta` sem upload (nome, empresa, CNPJ) | fase 1 |
| 3 | Upload de foto e logo; logo na sidebar | decisão sobre storage |
| 4 | `AcessoLog` + `/admin` | fase 1 |

A fase 1 entrega valor sozinha: a plataforma deixa de estar aberta. As outras
podem vir em PRs separados.

## Questões em aberto — precisam de decisão

1. **O que acontece com os dados que já existem?** Hoje tudo pertence ao usuário
   `confeiteira@delicias.local`. A saída mais limpa é um `UPDATE` de uma linha
   trocando o e-mail desse usuário para `gomesdeoliveiraj2@gmail.com`: as chaves
   estrangeiras continuam válidas e nada é copiado. A alternativa é começar do
   zero. **Confirmar que os dados atuais são dela e devem ser preservados.**

2. **O admin também usa a plataforma?** O pedido diz painel para o admin e uso da
   plataforma para a confeiteira. Proposta: `/admin` separado, **sem** acesso aos
   dados do negócio dela. Ver os pedidos e clientes de outra pessoa é decisão de
   privacidade, não de permissão — e "entrar como ela" para dar suporte é uma
   funcionalidade bem maior (impersonation), que eu deixaria fora por ora.

3. **Storage de imagem — Vercel Blob tem custo.** O plano gratuito cobre folgado
   duas fotos e duas logos, mas é mais um serviço com fatura possível. Dado o
   histórico de manter tudo em US$ 0 (ver `ANALISE_HOSTING.md` e
   `MIGRACAO_NEON.md`), quero sua confirmação antes de assumir. Fase 2 não
   depende disso e pode ir antes.

4. **Vinculação de conta.** Com `PrismaAdapter`, um login Google cujo e-mail já
   existe no banco (o caso da questão 1) falha com `OAuthAccountNotLinked`, por
   segurança. Contorna-se com `allowDangerousEmailAccountLinking: true` no
   provider. O nome é assustador e o risco é real no caso geral — vincular contas
   por e-mail sem prova de posse. Aqui a exposição é baixa: só dois e-mails
   entram, e o Google já confirmou `email_verified`. Mas é uma decisão consciente,
   não um detalhe de configuração.

## Pré-requisitos externos

Coisas que dependem de você e não de código:

- Projeto no **Google Cloud Console** com OAuth 2.0 Client ID (tipo "Web
  application"), gerando `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`.
- Redirect URIs: `http://localhost:3000/api/auth/callback/google` e o domínio de
  produção da Vercel.
- `AUTH_SECRET` gerado (`npx auth secret`).
- Tela de consentimento OAuth configurada. Enquanto estiver em "Testing", só
  contas de teste listadas conseguem entrar — o que, por acaso, já funciona como
  uma segunda whitelist.

Variáveis novas a somar no `.env.example`:

```
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
ALLOWED_EMAILS=gomesdeoliveiraj2@gmail.com,leonardobarros64@gmail.com
ADMIN_EMAILS=leonardobarros64@gmail.com
```

Nenhum segredo entra no repositório: os valores vão no `.env` local (já
ignorado) e nas variáveis de ambiente da Vercel.

## Riscos

- **Deixar rota desprotegida.** O middleware protege por padrão e abre exceções
  (`/login`, `/api/auth/*`), nunca o contrário. Uma rota nova nasce protegida.
- **Server Actions.** As 6 `actions.ts` são endpoints POST de verdade. Middleware
  não basta: cada action revalida a sessão. Como todas passam por
  `getCurrentUserId()`, fazer essa função lançar quando não há sessão fecha o
  buraco de uma vez.
- **Perder acesso ao próprio sistema.** Com whitelist em env var, um erro de
  digitação tranca todo mundo para fora. Vale conferir a variável em produção
  antes de considerar a fase 1 concluída.
