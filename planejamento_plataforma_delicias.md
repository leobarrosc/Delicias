# Planejamento da Plataforma Web **Delícias**

## 0. Design atual (prompt de referência)

> Use este bloco como prompt ao gerar ou revisar telas, para manter a
> identidade visual consistente.

**Tema:** dashboard administrativo escuro no estilo **Gentelella v4**,
reconstruído 100% em **Tailwind CSS** (sem Bootstrap/jQuery). Dark por padrão.

**Paleta (via `tailwind.config.ts`):**
- Fundo da página `#0B1220`; superfície de cards/painéis `#111A2C` (token
  `bg-card`); bordas sutis `#1D2A3F` (`border-stone-200`, escala invertida).
- Texto: base `#8B9BB4` (`text-stone-500`), forte `#EAF0F8`
  (`text-stone-950`), títulos `#DCE4F0` (`text-stone-700`).
- Acento **teal** `#2DD4BF` (`brand-500`) em botões, valores de destaque,
  item ativo do menu e chips de categoria.
- Cores de status em versão dark (fundo tintado escuro + texto claro):
  âmbar (orçamento), azul-céu (produção), esmeralda (concluído/lucro),
  vermelho (cancelado/estoque baixo).

**Layout (shell):**
- Sidebar escura fixa à esquerda (`bg-stone-800`): logo no topo, seção
  "Geral", item ativo com borda esquerda teal + fundo escurecido, e o
  **lobby da usuária fixo no rodapé esquerdo** (avatar + nome + "Minha
  conta"). Recolhível pelo hambúrguer no desktop; vira drawer no mobile.
- Topbar clara-escura com hambúrguer à esquerda e **data + relógio ao vivo
  no canto superior direito**.
- Conteúdo com kicker "DELÍCIAS" em maiúsculas acima do título da página.
- Rodapé discreto.

**Padrões de componente:**
- Painéis: `border border-stone-200 bg-card`, título com borda inferior
  dupla (`border-b-2`).
- **Formulários de cadastro/edição abrem em pop-up central** (componente
  `Modal`: overlay preto, Esc, trava scroll, botão X). Vale para Nova
  receita, Novo cliente, Novo pedido rápido e detalhes.
- **Listas longas são compactas e paginadas/buscáveis** (receitas,
  clientes, carteira de aniversariantes, histórico de pedidos). Ênfase em
  miniatura de imagem quando houver (receita, produto, logo de marca).
- **Detalhe sob demanda:** a lista carrega só o resumo; ao clicar, o
  detalhe completo é buscado via server action e descartado ao fechar o
  modal — nunca manter N registros completos em memória.
- Ícones: `lucide-react`. Fonte: Helvetica Neue / Roboto.
- Imagens são **URLs** por enquanto (campo de texto + miniatura com
  fallback); trocar por upload (Vercel Blob/Cloudinary) no futuro.

**Navegação (menu "Geral"):** Dashboard, Insumos, Receitas, Clientes,
Pedidos (histórico), Financeiro, Configurações. O Dashboard concentra a
criação rápida de pedidos e os pedidos em andamento; **Pedidos** é o
histórico completo (todos os status, com busca e mudança de status).

**Configurações** centraliza: frete padrão, **mensagens de WhatsApp**
(templates com `{cliente}`, `{aniversariante}`, `{ocasiao}`), categorias de
receitas e marcas (com logo).

---

## 1. Visão geral

A **Delícias** será uma plataforma web para confeiteiras que têm baixo domínio tecnológico. O foco principal é permitir que a usuária cadastre insumos, monte receitas, calcule custo de produção, defina preço de venda com margem de lucro e acompanhe pedidos/clientes.

A plataforma deve ser simples, visual e guiada. O objetivo não é parecer um ERP complexo, mas sim uma ferramenta prática para responder perguntas como:

- Quanto custa produzir esta receita?
- Quanto devo cobrar para ter lucro?
- Quais insumos foram usados em um pedido?
- Quem são meus clientes e aniversariantes?
- Quais pedidos estão em orçamento, produção, concluídos ou cancelados?
- Quanto lucrei nos pedidos recentes?

---

## 2. Público-alvo

Usuária principal: confeiteira autônoma ou pequena confeitaria.

Características prováveis:

- Pouco domínio tecnológico.
- Usa WhatsApp como principal canal de venda.
- Precisa controlar custo, lucro e pedidos sem planilhas complicadas.
- Pode comprar insumos em unidades diferentes das usadas na receita.
- Precisa de alertas simples e informações prontas para decisão.

Consequência para o design:

- Interface com linguagem simples.
- Poucos campos por tela.
- Botões grandes e claros.
- Fluxos guiados passo a passo.
- Evitar termos técnicos como “SKU”, “CMV”, “markup”, “estoque reservado”, etc., salvo em áreas avançadas.

---

## 3. Módulos principais

### 3.1 Dashboard inicial

Tela inicial com resumo simples:

- Pedidos em orçamento.
- Pedidos em produção.
- Pedidos concluídos recentemente.
- Faturamento estimado dos últimos pedidos.
- Lucro estimado.
- Próximos aniversariantes.
- Insumos com estoque baixo, caso o controle de estoque seja ativado.

### 3.2 Insumos

A usuária poderá cadastrar, editar e remover insumos.

Exemplos:

- Açúcar refinado
- Farinha de trigo
- Chocolate em pó
- Leite condensado
- Granulado
- Embalagem
- Gás
- Energia elétrica, opcionalmente como custo indireto

Campos do produto (como ele é na prateleira):

- Nome do insumo.
- Marca (ex.: Italac), opcional.
- Categoria: ingrediente, embalagem, descartável, custo indireto.
- Conteúdo da embalagem + unidade (ex.: 395 g por caixinha).
- Custo por unidade base calculado automaticamente a partir da última compra.
- Estoque atual (em unidade base), alimentado pelas compras.
- Estoque mínimo, opcional.
- Data da última compra.

As compras são registros separados, com histórico por produto:

- Quantidade de embalagens compradas (1 caixa, 24 unidades...).
- Valor total pago.
- Data da compra.

Regras:

- Produto existente → registrar nova compra (reposição): soma o estoque,
  atualiza o custo unitário e entra no razão de movimentos como ENTRADA.
- Produto novo → pode ser criado já com a primeira compra ou sem compra
  (custo fica zerado até comprar).

Exemplo:

> Leite condensado Italac, embalagem de 395 g.  
> Compra: 24 caixinhas por R$ 112,90 → custo de R$ 0,0119 por grama,
> estoque +9.480 g.

### 3.3 Conversão de medidas

A plataforma precisa lidar com diferentes unidades.

Unidades recomendadas no MVP:

Peso:

- g
- kg

Volume:

- ml
- L

Unidade:

- unidade
- dúzia
- pacote
- caixa

Conversões diretas:

- 1 kg = 1000 g
- 1 L = 1000 ml
- 1 dúzia = 12 unidades

Atenção importante:

Nem toda conversão deve ser automática. Por exemplo, converter “xícara de farinha” para gramas depende da densidade do produto. Para o MVP, é melhor evitar xícara, colher de sopa e colher de chá como unidades automáticas, ou permitir que a usuária cadastre equivalências específicas por insumo.

Exemplo avançado:

> Para farinha de trigo: 1 xícara = 120g.  
> Para açúcar: 1 xícara = 200g.

Essa parte pode entrar depois do MVP.

### 3.4 Receitas

A usuária poderá criar receitas usando os insumos cadastrados.

Campos da receita:

- Nome da receita.
- Foto opcional.
- Rendimento: quantidade final produzida.
- Unidade do rendimento: unidade, fatia, cento, kg, bolo etc.
- Lista de insumos usados.
- Quantidade usada de cada insumo.
- Custo automático de cada item.
- Custo total da receita.
- Custo por unidade/fatia/porção.
- Mão de obra, opcional.
- Custos extras, opcional.
- Observações/modo de preparo, opcional.

Exemplo:

Receita: Brigadeiro tradicional  
Rendimento: 25 unidades

Itens:

- 395g de leite condensado
- 20g de chocolate em pó
- 15g de manteiga
- 50g de granulado
- 25 forminhas

Resultado:

- Custo total: R$ X
- Custo por brigadeiro: R$ Y

### 3.5 Atualização automática de custo da receita

A plataforma deverá permitir duas opções:

#### Modo automático

Quando o preço de um insumo muda, todas as receitas que usam esse insumo têm o custo atualizado automaticamente.

Exemplo:

> O leite condensado subiu de R$ 6,50 para R$ 7,20.  
> Todas as receitas que usam leite condensado passam a refletir esse novo custo.

#### Modo manual/congelado

A receita mantém o custo antigo até a usuária clicar em “Atualizar custo da receita”.

Esse modo é útil para evitar sustos em pedidos antigos ou orçamentos já enviados.

Recomendação:

- Receitas padrão podem usar custo atualizado automaticamente.
- Pedidos devem congelar o custo no momento em que forem criados, para manter histórico correto.

---

## 4. Clientes

A plataforma terá uma base de clientes.

Campos do cliente:

- Nome completo.
- WhatsApp.
- Data de aniversário.
- Endereço.
- Observações.
- Tipo de cliente:
  - Cliente comum.
  - Aniversariante.

Observação importante:

Todo cliente pode ter data de aniversário. O tipo “aniversariante” pode ser usado quando o pedido é feito para outra pessoa, por exemplo:

> Maria compra um bolo para o aniversário do filho João.  
> Maria é a cliente pagante.  
> João é o aniversariante.

Por isso, vale separar:

- Cliente comprador.
- Pessoa aniversariante vinculada ao pedido.

### Carteira de aniversariantes

A ideia é usar aniversários para gerar oportunidades de venda.

Funcionalidades futuras:

- Lista de aniversariantes do mês.
- Alerta 7, 15 ou 30 dias antes do aniversário.
- Botão para abrir conversa no WhatsApp.
- Histórico do que o cliente comprou no aniversário anterior.

---

## 5. Pedidos

O pedido será o centro operacional da plataforma.

### Status do pedido

- Em orçamento
- Produção
- Concluído
- Cancelado

Sugestão de regra:

- **Em orçamento:** ainda não deve baixar insumos automaticamente, porque o pedido pode não fechar.
- **Produção:** deve reservar ou baixar os insumos.
- **Concluído:** confirma o pedido e mantém os dados financeiros.
- **Cancelado:** deve permitir devolver os insumos ao estoque, caso já tenham sido baixados.

O usuário disse que “assim que o pedido é iniciado, a receita subtrai dos insumos”. Porém, para evitar erro operacional, a melhor regra prática seria:

- Pedido criado em orçamento: não baixa estoque.
- Pedido movido para produção: baixa estoque.

Caso seja indispensável baixar logo no início, o sistema deve ter uma opção clara:

> Baixar insumos agora?

### Campos do pedido

- Código do pedido.
- Cliente comprador.
- Aniversariante, opcional.
- Data do pedido.
- Data de entrega.
- Status.
- Receita escolhida.
- Quantidade solicitada.
- Custo de produção calculado.
- Multiplicador de lucro.
- Preço sugerido.
- Preço final vendido.
- Lucro estimado.
- Forma de pagamento, opcional.
- Observações.
- Endereço de entrega, opcional.

### Uso de receitas no pedido

O pedido deve copiar os dados financeiros da receita no momento da criação ou confirmação.

Isso é importante porque o histórico precisa permanecer correto.

Exemplo:

> Em janeiro, a receita custava R$ 30 e foi vendida por R$ 75.  
> Em março, os insumos subiram e a receita passou a custar R$ 38.  
> O pedido de janeiro deve continuar mostrando custo de R$ 30, não R$ 38.

---

## 6. Lucro e preço de venda

O pedido terá uma barra de ajuste de lucro.

Regra mínima:

- Multiplicador mínimo: 2x

Exemplo:

- Custo de produção: R$ 40
- Multiplicador: 2x
- Preço sugerido: R$ 80
- Lucro bruto: R$ 40

Sugestão de barra:

- Mínimo: 2x
- Padrão: 2.5x ou 3x
- Máximo inicial: 5x

Também deve ser possível editar o preço final manualmente.

Exemplo:

> O sistema sugere R$ 100, mas a confeiteira decide vender por R$ 95.

Nesse caso, o sistema recalcula:

- Receita do pedido.
- Lucro estimado.
- Margem real.

Fórmulas:

- Preço sugerido = custo de produção × multiplicador
- Lucro = preço de venda - custo de produção
- Margem de lucro = lucro / preço de venda × 100

---

## 7. Financeiro

O financeiro deve ser simples no início.

### Lista dos últimos pedidos

Colunas:

- Data
- Cliente
- Pedido/receita
- Status
- Custo de produção
- Valor de venda
- Lucro estimado

### Resumos úteis

- Total vendido no período.
- Custo total de produção no período.
- Lucro estimado no período.
- Quantidade de pedidos concluídos.
- Quantidade de pedidos cancelados.

Filtros:

- Hoje
- Esta semana
- Este mês
- Período personalizado
- Por status
- Por cliente

Atenção:

No MVP, o financeiro deve ser baseado nos pedidos. Não precisa começar com controle completo de caixa, contas a pagar, contas a receber, fluxo de caixa e conciliação. Isso deixaria o projeto pesado demais.

---

## 8. Controle de estoque

Como o sistema mexe com insumos, existe uma decisão importante:

### Opção simples para MVP

A plataforma calcula custos, mas o estoque é opcional.

A usuária pode cadastrar quantidade em estoque se quiser.

### Opção mais completa

Quando um pedido entra em produção, o sistema baixa automaticamente os insumos.

Regras necessárias:

- Verificar se há estoque suficiente.
- Mostrar alerta se faltar algum insumo.
- Permitir baixa mesmo com estoque negativo, se a usuária quiser.
- Devolver estoque quando um pedido for cancelado, se aplicável.

Sugestão:

Começar com estoque simples, porque confeitaria tem perdas, sobras e compras frequentes. Um controle rígido demais pode atrapalhar usuárias menos técnicas.

---

## 9. Entidades principais do banco de dados

### Usuário

- id
- nome
- email
- senha_hash
- telefone
- criado_em

### Insumo

- id
- usuario_id
- nome
- categoria
- quantidade_compra
- unidade_compra
- preco_compra
- unidade_base
- custo_unitario_base
- estoque_atual
- estoque_minimo
- data_ultima_compra
- ativo
- criado_em
- atualizado_em

### Receita

- id
- usuario_id
- nome
- rendimento_quantidade
- rendimento_unidade
- custo_total_atual
- custo_por_unidade
- atualizacao_automatica
- observacoes
- ativo
- criado_em
- atualizado_em

### ReceitaItem

- id
- receita_id
- insumo_id
- quantidade_usada
- unidade_usada
- custo_calculado

### Cliente

- id
- usuario_id
- nome
- whatsapp
- data_aniversario
- endereco
- observacoes
- criado_em
- atualizado_em

### Aniversariante

- id
- usuario_id
- cliente_id
- nome
- dia
- mes
- ano (opcional)
- ocasiao
- observacoes

Essa tabela é útil quando o comprador e o aniversariante são pessoas diferentes.

Decisões de modelagem importantes:

- **Dia e mês separados, ano opcional.** Muita gente não sabe (ou não quer informar) o ano de nascimento. Um campo `DATE` obrigaria a inventar anos falsos. Com `dia` e `mes` separados, a consulta de recorrência fica trivial e há um índice natural em `(mes, dia)`. Quando o ano existir, dá para mostrar "vai fazer 7 anos" no lembrete.
- **Campo ocasião.** Nem todo bolo é de aniversário: a ocasião (aniversário, bodas de casamento, outra data) deixa a porta aberta para outras datas recorrentes.
- **29/02 em ano não bissexto** é celebrado em 28/02 (convenção no cálculo da próxima ocorrência).
- **Lembretes não são armazenados** — são calculados sob demanda a partir de `(dia, mes)`.

### Pedido

- id
- usuario_id
- cliente_id
- aniversariante_id
- status
- data_pedido
- data_entrega
- custo_producao
- multiplicador_lucro
- preco_sugerido
- preco_final
- lucro_estimado
- observacoes
- estoque_baixado
- criado_em
- atualizado_em

### PedidoItem

- id
- pedido_id
- receita_id
- nome_receita_snapshot
- quantidade
- custo_unitario_snapshot
- custo_total_snapshot
- preco_venda_snapshot

### MovimentoEstoque

- id
- insumo_id
- pedido_id
- tipo
- quantidade
- unidade
- motivo
- criado_em

Tipos possíveis:

- entrada
- saida
- ajuste
- devolucao

---

## 10. Fluxo principal da usuária

### Primeiro uso

1. Criar conta.
2. Cadastrar primeiros insumos.
3. Criar primeira receita.
4. Ver custo da receita.
5. Criar cliente.
6. Criar pedido.
7. Ajustar preço com barra de lucro.
8. Mover pedido para produção.
9. Concluir pedido.
10. Ver resultado no financeiro.

### Fluxo de criação de receita

1. Clicar em “Nova receita”.
2. Informar nome e rendimento.
3. Adicionar insumos.
4. Informar quantidade usada.
5. Sistema calcula custo automaticamente.
6. Mostrar custo total e custo por unidade.
7. Salvar receita.

### Fluxo de pedido

1. Clicar em “Novo pedido”.
2. Selecionar ou cadastrar cliente.
3. Selecionar receita.
4. Informar quantidade.
5. Sistema calcula custo de produção.
6. Usuária ajusta multiplicador de lucro.
7. Sistema sugere preço.
8. Usuária salva como orçamento ou produção.
9. Se for produção, sistema baixa insumos.
10. Pedido aparece no financeiro.

---

## 11. MVP recomendado

Para não construir um sistema grande demais logo de início, o MVP deve conter apenas o essencial.

### MVP 1

- Login/cadastro.
- Cadastro de insumos.
- Conversão básica de kg/g, L/ml e unidade/dúzia.
- Cadastro de receitas.
- Cálculo de custo da receita.
- Cadastro de clientes.
- Cadastro de pedidos.
- Status do pedido.
- Barra de lucro com mínimo 2x.
- Lista financeira simples dos pedidos.

### MVP 2

- Controle de estoque com baixa automática.
- Histórico de preço dos insumos.
- Atualização automática/manual das receitas.
- Carteira de aniversariantes.
- Alertas de aniversário.
- Link direto para WhatsApp.

### MVP 3

- Relatórios por mês.
- Produtos mais vendidos.
- Clientes recorrentes.
- Impressão/exportação de orçamento.
- Catálogo simples de produtos.
- Notificações.
- Controle de pagamento.

---

## 12. Telas sugeridas

### Menu principal

- Início
- Insumos
- Receitas
- Clientes
- Pedidos
- Financeiro
- Configurações

### Tela de insumos

- Lista de insumos.
- Botão “Novo insumo”.
- Busca por nome.
- Filtro por categoria.
- Alerta de estoque baixo.

### Tela de receitas

- Lista de receitas.
- Custo total visível.
- Custo por unidade visível.
- Botão “Criar pedido a partir desta receita”.

### Tela de clientes

- Nome.
- WhatsApp.
- Aniversário.
- Endereço.
- Histórico de pedidos.

### Tela de pedidos

Kanban simples:

- Em orçamento
- Produção
- Concluídos
- Cancelados

### Tela financeiro

- Lista dos últimos pedidos.
- Cards de resumo.
- Filtros por período.

---

## 13. Regras importantes

1. Pedido antigo não deve mudar de custo quando o preço do insumo for atualizado.
2. Receita pode atualizar automaticamente, mas pedido deve salvar um snapshot do custo.
3. Se o pedido for cancelado depois de baixar estoque, o sistema deve perguntar se deseja devolver os insumos.
4. O multiplicador mínimo de lucro deve ser 2x.
5. O preço sugerido deve poder ser editado manualmente.
6. A plataforma deve evitar campos obrigatórios demais.
7. WhatsApp deve ser tratado como campo central do cliente.
8. Data de aniversário deve ser usada para gerar oportunidades de venda.
9. A data de entrega não é a data do aniversário: a festa pode ser no sábado, mas o aniversário é dia 14. O formulário de pedido sugere a data de entrega como ponto de partida, mas o dia/mês reais devem ser confirmados.
10. Ao criar um pedido, oferecer os aniversariantes já cadastrados do cliente ("é para a Sofia de novo?") em vez de criar registro duplicado.

---

## 14. Pontos de atenção

### Conversão de medidas

Esse é um dos pontos mais delicados. Peso e volume são fáceis, mas medidas culinárias como xícara e colher exigem equivalência por ingrediente.

Recomendação: começar sem xícara/colher no cálculo automático, ou permitir que a usuária cadastre equivalências.

### Baixa automática de estoque

Baixar estoque no momento errado pode causar confusão.

Recomendação: baixar quando o pedido entra em produção, não quando está apenas em orçamento.

### Simplicidade da interface

A plataforma deve sempre explicar o resultado.

Exemplo ruim:

> Custo unitário base: 0,01645

Exemplo bom:

> Cada 1g deste ingrediente custa R$ 0,016.  
> Usar 100g custa R$ 1,60.

---

## 15. Arquitetura técnica recomendada

A plataforma será desenvolvida com **Next.js** e terá deploy na **Vercel**.

### Stack sugerida

- **Frontend e backend:** Next.js com App Router.
- **Linguagem:** TypeScript.
- **Deploy:** Vercel.
- **Banco de dados:** PostgreSQL externo ou integrado via Vercel Marketplace.
- **ORM:** Prisma.
- **Autenticação:** Auth.js, Clerk ou Supabase Auth.
- **Estilização:** Tailwind CSS.
- **Componentes de interface:** shadcn/ui.
- **Validação de dados:** Zod.
- **Formulários:** React Hook Form.
- **Armazenamento de imagens:** Vercel Blob, Cloudinary ou Supabase Storage.

### Por que PostgreSQL?

A plataforma terá muitos relacionamentos:

- Usuário tem vários insumos.
- Receita tem vários insumos.
- Pedido usa receita.
- Pedido pertence a cliente.
- Cliente pode ter aniversariantes vinculados.
- Pedido pode gerar movimentações de estoque.

Por isso, um banco relacional como PostgreSQL é mais adequado do que um banco NoSQL para este projeto.

### Observação importante sobre Vercel

A Vercel é excelente para hospedar a aplicação Next.js, mas o banco de dados deve ficar em um serviço próprio de banco, como:

- Vercel Postgres/Marketplace.
- Neon.
- Supabase.
- Railway.
- Render.
- Prisma Postgres.

A aplicação na Vercel acessa o banco usando variáveis de ambiente, principalmente:

- `DATABASE_URL`
- `DIRECT_URL`, se usar Prisma e precisar de conexão direta para migrations

---

## 16. Estrutura de pastas sugerida no Next.js

```txt
src/
  app/
    dashboard/
      page.tsx
    insumos/
      page.tsx
      novo/
        page.tsx
      [id]/
        page.tsx
    receitas/
      page.tsx
      nova/
        page.tsx
      [id]/
        page.tsx
    clientes/
      page.tsx
      novo/
        page.tsx
      [id]/
        page.tsx
    pedidos/
      page.tsx
      novo/
        page.tsx
      [id]/
        page.tsx
    financeiro/
      page.tsx
    configuracoes/
      page.tsx

  components/
    layout/
    forms/
    tables/
    cards/
    ui/

  lib/
    prisma.ts
    auth.ts
    units.ts
    money.ts
    calculations.ts
    stock.ts

  server/
    actions/
      insumos.ts
      receitas.ts
      clientes.ts
      pedidos.ts
    queries/
      insumos.ts
      receitas.ts
      clientes.ts
      pedidos.ts
      financeiro.ts

  types/
    index.ts

prisma/
  schema.prisma
  migrations/
```

---

## 17. Separação de responsabilidades

### `app/`

Contém as rotas e páginas da aplicação.

Exemplo:

- `/insumos`
- `/receitas`
- `/clientes`
- `/pedidos`
- `/financeiro`

### `components/`

Contém componentes reutilizáveis.

Exemplos:

- Card de resumo financeiro.
- Tabela de pedidos.
- Formulário de insumo.
- Seletor de unidade.
- Barra de lucro.

### `lib/`

Contém funções utilitárias e regras de negócio puras.

Exemplos:

- Converter kg para g.
- Calcular custo de receita.
- Calcular lucro.
- Formatar dinheiro.
- Validar unidade compatível.

### `server/actions/`

Contém Server Actions para criar, editar e remover dados.

Exemplos:

- Criar insumo.
- Atualizar preço de insumo.
- Criar receita.
- Mover pedido para produção.
- Cancelar pedido.

### `server/queries/`

Contém consultas ao banco.

Exemplos:

- Buscar receitas do usuário.
- Buscar pedidos recentes.
- Buscar clientes aniversariantes do mês.
- Buscar resumo financeiro.

---

## 18. Modelo Prisma inicial sugerido

```prisma
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  insumos  Insumo[]
  receitas Receita[]
  clientes Cliente[]
  pedidos  Pedido[]
}

model Insumo {
  id                 String   @id @default(cuid())
  userId             String
  nome               String
  categoria          String
  quantidadeCompra   Decimal
  unidadeCompra      String
  precoCompra        Decimal
  unidadeBase        String
  custoUnitarioBase  Decimal
  estoqueAtual       Decimal?
  estoqueMinimo      Decimal?
  dataUltimaCompra   DateTime?
  ativo              Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id])
  receitaItens ReceitaItem[]
  movimentos   MovimentoEstoque[]
}

model Receita {
  id                    String   @id @default(cuid())
  userId                String
  nome                  String
  rendimentoQuantidade  Decimal
  rendimentoUnidade     String
  custoTotalAtual       Decimal  @default(0)
  custoPorUnidade       Decimal  @default(0)
  atualizacaoAutomatica Boolean  @default(true)
  observacoes           String?
  ativo                 Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user  User          @relation(fields: [userId], references: [id])
  itens ReceitaItem[]
  pedidoItens PedidoItem[]
}

model ReceitaItem {
  id               String  @id @default(cuid())
  receitaId        String
  insumoId         String
  quantidadeUsada  Decimal
  unidadeUsada     String
  custoCalculado   Decimal

  receita Receita @relation(fields: [receitaId], references: [id])
  insumo  Insumo  @relation(fields: [insumoId], references: [id])
}

model Cliente {
  id              String   @id @default(cuid())
  userId          String
  nome            String
  whatsapp        String?
  dataAniversario DateTime?
  endereco        String?
  observacoes     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User             @relation(fields: [userId], references: [id])
  pedidos         Pedido[]
  aniversariantes Aniversariante[]
}

model Aniversariante {
  id          String   @id @default(cuid())
  clienteId   String
  nome        String
  dia         Int
  mes         Int
  ano         Int?
  ocasiao     String   @default("Aniversário")
  observacoes String?

  cliente Cliente  @relation(fields: [clienteId], references: [id])
  pedidos Pedido[]

  @@index([mes, dia])
}

model Pedido {
  id                 String   @id @default(cuid())
  userId             String
  clienteId          String
  aniversarianteId   String?
  status             PedidoStatus @default(EM_ORCAMENTO)
  dataPedido         DateTime @default(now())
  dataEntrega        DateTime?
  custoProducao      Decimal  @default(0)
  multiplicadorLucro Decimal  @default(2)
  precoSugerido      Decimal  @default(0)
  precoFinal         Decimal  @default(0)
  lucroEstimado      Decimal  @default(0)
  observacoes        String?
  estoqueBaixado     Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user           User            @relation(fields: [userId], references: [id])
  cliente        Cliente         @relation(fields: [clienteId], references: [id])
  aniversariante Aniversariante? @relation(fields: [aniversarianteId], references: [id])
  itens          PedidoItem[]
  movimentos     MovimentoEstoque[]
}

model PedidoItem {
  id                   String  @id @default(cuid())
  pedidoId             String
  receitaId            String
  nomeReceitaSnapshot  String
  quantidade           Decimal
  custoUnitarioSnapshot Decimal
  custoTotalSnapshot    Decimal
  precoVendaSnapshot    Decimal

  pedido  Pedido  @relation(fields: [pedidoId], references: [id])
  receita Receita @relation(fields: [receitaId], references: [id])
}

model MovimentoEstoque {
  id        String   @id @default(cuid())
  insumoId  String
  pedidoId  String?
  tipo      MovimentoEstoqueTipo
  quantidade Decimal
  unidade   String
  motivo    String?
  createdAt DateTime @default(now())

  insumo Insumo  @relation(fields: [insumoId], references: [id])
  pedido Pedido? @relation(fields: [pedidoId], references: [id])
}

enum PedidoStatus {
  EM_ORCAMENTO
  PRODUCAO
  CONCLUIDO
  CANCELADO
}

enum MovimentoEstoqueTipo {
  ENTRADA
  SAIDA
  AJUSTE
  DEVOLUCAO
}
```

---

## 19. Funções de cálculo essenciais

### Cálculo do custo unitário do insumo

```ts
custoUnitarioBase = precoCompra / quantidadeConvertidaParaUnidadeBase
```

Exemplo:

- Compra: 1kg de açúcar por R$ 5,00
- Unidade base: g
- Quantidade base: 1000g
- Custo por grama: R$ 0,005

### Cálculo de item da receita

```ts
custoDoItem = quantidadeUsadaNaUnidadeBase * custoUnitarioBase
```

### Cálculo da receita

```ts
custoTotalReceita = somaDosCustosDosItens
custoPorUnidade = custoTotalReceita / rendimentoQuantidade
```

### Cálculo do pedido

```ts
custoProducao = custoDaReceita * quantidadePedida
precoSugerido = custoProducao * multiplicadorLucro
lucroEstimado = precoFinal - custoProducao
margemLucro = lucroEstimado / precoFinal * 100
```

---

## 20. API interna / Server Actions sugeridas

### Insumos

- `createInsumo`
- `updateInsumo`
- `deleteInsumo`
- `updateInsumoPrice`
- `adjustInsumoStock`

### Receitas

- `createReceita`
- `updateReceita`
- `deleteReceita`
- `recalculateReceitaCost`
- `addInsumoToReceita`
- `removeInsumoFromReceita`

### Clientes

- `createCliente`
- `updateCliente`
- `deleteCliente`
- `createAniversariante`
- `updateAniversariante`

### Pedidos

- `createPedido`
- `updatePedidoStatus`
- `movePedidoToProduction`
- `completePedido`
- `cancelPedido`
- `recalculatePedidoPrice`

### Financeiro

- `getFinancialSummary`
- `getRecentOrders`
- `getProfitByPeriod`

---

## 21. Cuidados técnicos importantes

### Usar Decimal para dinheiro

Não usar `Float` para valores financeiros no banco.

Usar `Decimal` no Prisma/PostgreSQL para evitar erros de arredondamento.

### Snapshot em pedidos

Pedidos devem salvar cópias dos valores no momento do pedido.

Isso evita que um pedido antigo mude de custo quando um insumo for atualizado.

Campos importantes de snapshot:

- `nomeReceitaSnapshot`
- `custoUnitarioSnapshot`
- `custoTotalSnapshot`
- `precoVendaSnapshot`

### Multiusuário

Todas as tabelas principais precisam estar vinculadas a `userId`.

Isso impede que uma confeiteira veja dados de outra.

### Segurança

Toda query deve validar se o registro pertence ao usuário logado.

Exemplo:

- Não basta buscar `receitaId`.
- É necessário buscar `receitaId` + `userId`.

### Serverless e banco

Como o deploy será na Vercel, é importante usar um banco compatível com ambiente serverless ou com pooling de conexão.

Opções boas:

- Neon.
- Supabase.
- Prisma Postgres.
- Vercel Marketplace Postgres.

---

## 22. Próxima etapa recomendada

Antes de programar, transformar este planejamento em três materiais:

1. **Mapa de telas**: quais telas existem e o que tem em cada uma.
2. **Modelo de banco de dados final**: tabelas, campos, relações e enums.
3. **Fluxo do MVP**: caminho mínimo desde cadastrar insumo até concluir pedido e ver lucro.

A ordem ideal de desenvolvimento é:

1. Criar projeto Next.js.
2. Configurar TypeScript, Tailwind e shadcn/ui.
3. Configurar Prisma e PostgreSQL.
4. Criar autenticação.
5. Criar módulo de insumos.
6. Criar conversão de unidades.
7. Criar módulo de receitas.
8. Criar módulo de clientes.
9. Criar módulo de pedidos.
10. Criar financeiro simples.
11. Criar estoque automático.
12. Criar aniversariantes e WhatsApp.

