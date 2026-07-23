import {
  AlertTriangle,
  Banknote,
  Cake,
  CheckCircle2,
  ClipboardList,
  CookingPot,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import {
  PedidoAndamentoCard,
  type PedidoAndamento,
} from "@/components/pedido-andamento-card";
import { QuickPedidoDialog } from "@/components/quick-pedido-dialog";
import {
  getIdadeNaProximaOcorrencia,
  getNextOccurrence,
} from "@/lib/birthdays";
import { getConfiguracao } from "@/lib/config";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { createWhatsAppBirthdayLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function getEntregaBadge(dataEntrega: Date | null) {
  if (!dataEntrega) {
    return null;
  }

  const hoje = startOfDay(new Date());
  const entrega = startOfDay(
    new Date(
      dataEntrega.getUTCFullYear(),
      dataEntrega.getUTCMonth(),
      dataEntrega.getUTCDate(),
    ),
  );
  const diffDays = Math.round(
    (entrega.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return { label: "Atrasado", tone: "bg-red-50 text-red-700" };
  }

  if (diffDays === 0) {
    return { label: "Entrega hoje", tone: "bg-amber-50 text-amber-700" };
  }

  if (diffDays === 1) {
    return { label: "Entrega amanhã", tone: "bg-amber-50 text-amber-700" };
  }

  return { label: `Faltam ${diffDays} dias`, tone: "bg-stone-100 text-stone-600" };
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );

  const config = await getConfiguracao(userId);
  const [
    statusCounts,
    lucroDoMes,
    pedidosEmAndamento,
    clientes,
    receitas,
    insumosComMinimo,
    maisVendidas,
    aniversariantes,
  ] = await Promise.all([
      prisma.pedido.groupBy({
        by: ["status"],
        where: {
          userId,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.pedido.aggregate({
        where: {
          userId,
          status: {
            not: "CANCELADO",
          },
          dataPedido: {
            gte: monthStart,
          },
        },
        _sum: {
          lucroEstimadoSnapshot: true,
        },
      }),
      prisma.pedido.findMany({
        where: {
          userId,
          status: {
            in: ["EM_ORCAMENTO", "PRODUCAO"],
          },
        },
        orderBy: [
          { dataEntrega: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        include: {
          cliente: {
            select: {
              nome: true,
            },
          },
          aniversariante: {
            select: {
              nome: true,
            },
          },
          itens: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              receitaId: true,
              descricao: true,
              quantidade: true,
              precoUnitarioSnapshot: true,
              precoSugeridoUnitarioSnapshot: true,
            },
          },
        },
      }),
      prisma.cliente.findMany({
        where: {
          userId,
          ativo: true,
        },
        orderBy: {
          nome: "asc",
        },
        select: {
          id: true,
          nome: true,
          aniversariantes: {
            orderBy: {
              nome: "asc",
            },
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      prisma.receita.findMany({
        where: {
          userId,
          ativo: true,
        },
        orderBy: {
          nome: "asc",
        },
        select: {
          id: true,
          nome: true,
          custoPorUnidade: true,
        },
      }),
      prisma.insumo.findMany({
        where: {
          userId,
          ativo: true,
          estoqueMinimo: {
            not: null,
          },
        },
        select: {
          id: true,
          nome: true,
          unidadeBase: true,
          estoqueAtual: true,
          estoqueMinimo: true,
        },
      }),
      prisma.pedidoItem.groupBy({
        by: ["descricao"],
        where: {
          userId,
          pedido: {
            status: {
              not: "CANCELADO",
            },
          },
        },
        _sum: {
          quantidade: true,
        },
        orderBy: {
          _sum: {
            quantidade: "desc",
          },
        },
        take: 5,
      }),
      prisma.aniversariante.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          nome: true,
          dia: true,
          mes: true,
          ano: true,
          ocasiao: true,
          cliente: {
            select: {
              nome: true,
              whatsapp: true,
            },
          },
        },
      }),
    ]);

  const countByStatus = new Map(
    statusCounts.map((entry) => [entry.status, entry._count._all]),
  );
  const dashboardCards = [
    {
      title: "Pedidos em orçamento",
      value: String(countByStatus.get("EM_ORCAMENTO") ?? 0),
      icon: ClipboardList,
      iconTone: "bg-amber-50 text-amber-700",
      valueTone: "text-stone-950",
      sub: "Aguardando aprovação",
    },
    {
      title: "Pedidos em produção",
      value: String(countByStatus.get("PRODUCAO") ?? 0),
      icon: CookingPot,
      iconTone: "bg-sky-50 text-sky-700",
      valueTone: "text-stone-950",
      sub: "No forno agora",
    },
    {
      title: "Pedidos concluídos",
      value: String(countByStatus.get("CONCLUIDO") ?? 0),
      icon: CheckCircle2,
      iconTone: "bg-emerald-50 text-emerald-700",
      valueTone: "text-stone-950",
      sub: "Desde o início",
    },
    {
      title: "Lucro estimado do mês",
      value: formatMoney(
        lucroDoMes._sum.lucroEstimadoSnapshot?.toNumber() ?? 0,
      ),
      icon: Banknote,
      iconTone: "bg-brand-50 text-brand-500",
      valueTone: "text-brand-500",
      sub: "Pedidos deste mês",
    },
  ];

  const clienteOptions = clientes.map((cliente) => ({
    id: cliente.id,
    nome: cliente.nome,
    aniversariantes: cliente.aniversariantes,
  }));
  const receitaOptions = receitas.map((receita) => ({
    id: receita.id,
    nome: receita.nome,
    custoPorUnidade: receita.custoPorUnidade.toNumber(),
  }));
  const pedidosAndamento: PedidoAndamento[] = pedidosEmAndamento.map(
    (pedido) => ({
      id: pedido.id,
      clienteNome: pedido.cliente?.nome ?? "Cliente removido",
      aniversarianteNome: pedido.aniversariante?.nome ?? null,
      status: pedido.status as PedidoAndamento["status"],
      dataEntregaLabel: formatDate(pedido.dataEntrega),
      entregaBadge: getEntregaBadge(pedido.dataEntrega),
      custoTotal: pedido.custoTotalSnapshot.toNumber(),
      precoTotal: pedido.precoTotalSnapshot.toNumber(),
      lucroEstimado: pedido.lucroEstimadoSnapshot.toNumber(),
      estoqueBaixado: pedido.estoqueBaixado,
      observacoes: pedido.observacoes,
      itens: pedido.itens.map((item) => ({
        id: item.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
      })),
      edicao: {
        id: pedido.id,
        clienteId: pedido.clienteId ?? "",
        aniversarianteId: pedido.aniversarianteId ?? "",
        status: pedido.status,
        dataEntrega: pedido.dataEntrega?.toISOString().slice(0, 10) ?? "",
        multiplicadorLucro: pedido.multiplicadorLucro.toNumber().toString(),
        frete: pedido.freteSnapshot.toNumber().toString(),
        observacoes: pedido.observacoes ?? "",
        itens: pedido.itens
          .filter((item) => item.receitaId)
          .map((item) => ({
            receitaId: item.receitaId as string,
            quantidade: String(item.quantidade),
            precoFinalUnitario: item.precoUnitarioSnapshot
              .toNumber()
              .toFixed(2),
            manualPrice:
              item.precoUnitarioSnapshot.toNumber() !==
              item.precoSugeridoUnitarioSnapshot.toNumber(),
          })),
      },
    }),
  );

  const hoje = new Date();
  const inicioDeHoje = startOfDay(hoje);
  const proximosAniversarios = aniversariantes
    .map((aniversariante) => {
      const proximaOcorrencia = getNextOccurrence(
        aniversariante.dia,
        aniversariante.mes,
        hoje,
      );

      return {
        id: aniversariante.id,
        nome: aniversariante.nome,
        ocasiao: aniversariante.ocasiao,
        proximaOcorrencia,
        idade: getIdadeNaProximaOcorrencia(
          aniversariante.ano,
          proximaOcorrencia,
        ),
        clienteNome: aniversariante.cliente.nome,
        whatsappLink: createWhatsAppBirthdayLink({
          whatsapp: aniversariante.cliente.whatsapp,
          aniversarianteNome: aniversariante.nome,
          clienteNome: aniversariante.cliente.nome,
          ocasiao: aniversariante.ocasiao,
          template: config.mensagemAniversario,
        }),
      };
    })
    .filter(
      (aniversariante) =>
        (aniversariante.proximaOcorrencia.getTime() - inicioDeHoje.getTime()) /
          (1000 * 60 * 60 * 24) <=
        30,
    )
    .sort(
      (first, second) =>
        first.proximaOcorrencia.getTime() - second.proximaOcorrencia.getTime(),
    )
    .slice(0, 5);

  const estoqueBaixo = insumosComMinimo
    .map((insumo) => {
      const estoqueAtual = insumo.estoqueAtual?.toNumber() ?? null;
      const estoqueMinimo = insumo.estoqueMinimo?.toNumber() ?? 0;

      return {
        id: insumo.id,
        nome: insumo.nome,
        unidadeBase: insumo.unidadeBase,
        estoqueAtual,
        estoqueMinimo,
        percentual:
          estoqueAtual === null || estoqueMinimo <= 0
            ? 0
            : Math.max(0, Math.min(100, (estoqueAtual / estoqueMinimo) * 100)),
      };
    })
    .filter(
      (insumo) =>
        insumo.estoqueAtual !== null &&
        insumo.estoqueMinimo > 0 &&
        insumo.estoqueAtual <= insumo.estoqueMinimo,
    )
    .sort((first, second) => first.percentual - second.percentual)
    .slice(0, 5);

  const topReceitas = maisVendidas
    .map((item) => ({
      descricao: item.descricao,
      quantidade: item._sum.quantidade ?? 0,
    }))
    .filter((item) => item.quantidade > 0);
  const maiorVenda = topReceitas[0]?.quantidade ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Visão geral</h2>
          <p className="text-sm text-stone-500">
            Acompanhe seus pedidos e crie um novo sem sair desta tela.
          </p>
        </div>
        <QuickPedidoDialog
          clientes={clienteOptions}
          receitas={receitaOptions}
          fretePadrao={config.fretePadrao.toString()}
        />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="flex items-start gap-4 rounded-lg border border-stone-200 bg-card p-5"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${card.iconTone}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {card.title}
                </p>
                <strong
                  className={`mt-1 block text-3xl font-bold ${card.valueTone}`}
                >
                  {card.value}
                </strong>
                <p className="mt-1 text-xs text-stone-500">{card.sub}</p>
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <section className="border border-stone-200 bg-card p-4 shadow-soft md:p-5 xl:col-span-2">
          <div className="mb-4 border-b-2 border-stone-200 pb-2">
            <h2 className="text-lg font-medium text-stone-700">
              Pedidos em andamento
            </h2>
          </div>
          <p className="mb-4 text-sm text-stone-500">
            Orçamentos e produções ordenados pela entrega mais próxima. Clique
            em um pedido para ver detalhes, editar, mudar o status ou excluir.
          </p>

          {pedidosAndamento.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
              Nenhum pedido em andamento. Crie um novo pedido para começar.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pedidosAndamento.map((pedido) => (
                <PedidoAndamentoCard
                  key={pedido.id}
                  pedido={pedido}
                  clientes={clienteOptions}
                  receitas={receitaOptions}
                  fretePadrao={config.fretePadrao.toString()}
                />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="border border-stone-200 bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 border-b-2 border-stone-200 pb-2">
              <Cake className="size-4 text-brand-500" aria-hidden="true" />
              <h2 className="text-base font-medium text-stone-700">
                Próximos aniversários
              </h2>
            </div>

            {proximosAniversarios.length === 0 ? (
              <p className="text-sm text-stone-500">
                Nenhuma data especial nos próximos 30 dias.
              </p>
            ) : (
              <ul className="divide-y divide-stone-200">
                {proximosAniversarios.map((aniversariante) => (
                  <li
                    key={aniversariante.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-950">
                        {aniversariante.nome}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDate(aniversariante.proximaOcorrencia)}
                        {aniversariante.idade
                          ? ` — vai fazer ${aniversariante.idade} ${
                              aniversariante.idade === 1 ? "ano" : "anos"
                            }`
                          : ""}
                      </p>
                      <p className="text-xs text-stone-400">
                        Cliente: {aniversariante.clienteNome}
                      </p>
                    </div>
                    {aniversariante.whatsappLink ? (
                      <a
                        href={aniversariante.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abrir WhatsApp sobre ${aniversariante.nome}`}
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-stone-200 bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 border-b-2 border-stone-200 pb-2">
              <AlertTriangle
                className="size-4 text-amber-700"
                aria-hidden="true"
              />
              <h2 className="text-base font-medium text-stone-700">
                Estoque baixo
              </h2>
            </div>

            {estoqueBaixo.length === 0 ? (
              <p className="text-sm text-stone-500">
                Nenhum ingrediente abaixo do estoque mínimo.
              </p>
            ) : (
              <ul className="divide-y divide-stone-200">
                {estoqueBaixo.map((insumo) => (
                  <li key={insumo.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-stone-950">
                        {insumo.nome}
                      </span>
                      <span className="shrink-0 text-xs text-red-700">
                        {insumo.estoqueAtual?.toLocaleString("pt-BR")} / mín.{" "}
                        {insumo.estoqueMinimo.toLocaleString("pt-BR")}{" "}
                        {insumo.unidadeBase}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-red-700"
                        style={{ width: `${insumo.percentual}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-stone-200 bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 border-b-2 border-stone-200 pb-2">
              <TrendingUp
                className="size-4 text-brand-500"
                aria-hidden="true"
              />
              <h2 className="text-base font-medium text-stone-700">
                Receitas mais vendidas
              </h2>
            </div>

            {topReceitas.length === 0 ? (
              <p className="text-sm text-stone-500">
                Sem vendas registradas ainda.
              </p>
            ) : (
              <ul className="divide-y divide-stone-200">
                {topReceitas.map((receita) => (
                  <li key={receita.descricao} className="py-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-stone-700">
                        {receita.descricao}
                      </span>
                      <span className="shrink-0 font-semibold text-stone-950">
                        {receita.quantidade}x
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{
                          width: `${(receita.quantidade / maiorVenda) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
