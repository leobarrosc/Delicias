import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  CookingPot,
} from "lucide-react";
import {
  PedidoAndamentoCard,
  type PedidoAndamento,
} from "@/components/pedido-andamento-card";
import { QuickPedidoDialog } from "@/components/quick-pedido-dialog";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

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

  const [statusCounts, lucroDoMes, pedidosEmAndamento, clientes, receitas] =
    await Promise.all([
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
    ]);

  const countByStatus = new Map(
    statusCounts.map((entry) => [entry.status, entry._count._all]),
  );
  const dashboardCards = [
    {
      title: "Pedidos em orçamento",
      value: String(countByStatus.get("EM_ORCAMENTO") ?? 0),
      icon: ClipboardList,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      title: "Pedidos em produção",
      value: String(countByStatus.get("PRODUCAO") ?? 0),
      icon: CookingPot,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      title: "Pedidos concluídos",
      value: String(countByStatus.get("CONCLUIDO") ?? 0),
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Lucro estimado do mês",
      value: formatMoney(
        lucroDoMes._sum.lucroEstimadoSnapshot?.toNumber() ?? 0,
      ),
      icon: Banknote,
      tone: "bg-rose-50 text-rose-700",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Visão geral</h2>
          <p className="text-sm text-stone-500">
            Acompanhe seus pedidos e crie um novo sem sair desta tela.
          </p>
        </div>
        <QuickPedidoDialog clientes={clienteOptions} receitas={receitaOptions} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-stone-600">
                    {card.title}
                  </p>
                  <strong className="mt-3 block text-3xl font-semibold text-stone-950">
                    {card.value}
                  </strong>
                </div>
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${card.tone}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-stone-950">
            Pedidos em andamento
          </h2>
          <p className="text-sm text-stone-500">
            Orçamentos e produções ordenados pela entrega mais próxima. Clique
            em um pedido para ver detalhes, editar, mudar o status ou excluir.
          </p>
        </div>

        {pedidosAndamento.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Nenhum pedido em andamento. Crie um novo pedido para começar.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pedidosAndamento.map((pedido) => (
              <PedidoAndamentoCard
                key={pedido.id}
                pedido={pedido}
                clientes={clienteOptions}
                receitas={receitaOptions}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
