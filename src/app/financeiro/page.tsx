import { Calendar, DollarSign, ReceiptText, TrendingUp } from "lucide-react";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type FinanceiroSearchParams = {
  filtro?: string;
  inicio?: string;
  fim?: string;
};

const filterOptions = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mês" },
  { value: "personalizado", label: "Período personalizado" },
];

const statusLabels = {
  EM_ORCAMENTO: "Em orçamento",
  PRODUCAO: "Produção",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  return addDays(start, -daysSinceMonday);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseDateInput(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function resolvePeriod(params: FinanceiroSearchParams) {
  const today = new Date();
  const selectedFilter = params.filtro ?? "mes";

  if (selectedFilter === "hoje") {
    const start = startOfDay(today);

    return {
      filter: selectedFilter,
      start,
      end: addDays(start, 1),
    };
  }

  if (selectedFilter === "semana") {
    const start = startOfWeek(today);

    return {
      filter: selectedFilter,
      start,
      end: addDays(start, 7),
    };
  }

  if (selectedFilter === "personalizado") {
    const fallbackStart = startOfMonth(today);
    const start = parseDateInput(params.inicio) ?? fallbackStart;
    const end = addDays(parseDateInput(params.fim) ?? today, 1);

    return {
      filter: selectedFilter,
      start,
      end,
    };
  }

  const start = startOfMonth(today);

  return {
    filter: "mes",
    start,
    end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
  };
}

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

function getPedidoSummary(
  itens: Array<{
    descricao: string;
    quantidade: number;
  }>,
) {
  if (itens.length === 0) {
    return "Pedido sem receitas";
  }

  if (itens.length === 1) {
    const item = itens[0];

    return `${item.quantidade}x ${item.descricao}`;
  }

  const totalItems = itens.reduce((total, item) => total + item.quantidade, 0);

  return `${totalItems} itens em ${itens.length} receitas`;
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams?: Promise<FinanceiroSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const period = resolvePeriod(params);
  const userId = await getCurrentUserId();
  const pedidos = await prisma.pedido.findMany({
    where: {
      userId,
      dataPedido: {
        gte: period.start,
        lt: period.end,
      },
    },
    orderBy: {
      dataPedido: "desc",
    },
    take: 30,
    include: {
      cliente: {
        select: {
          nome: true,
        },
      },
      itens: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          descricao: true,
          quantidade: true,
        },
      },
    },
  });

  const pedidosValidos = pedidos.filter((pedido) => pedido.status !== "CANCELADO");
  const totalVendido = pedidosValidos.reduce(
    (total, pedido) => total + pedido.precoTotalSnapshot.toNumber(),
    0,
  );
  const custoTotal = pedidosValidos.reduce(
    (total, pedido) => total + pedido.custoTotalSnapshot.toNumber(),
    0,
  );
  const lucroTotal = pedidosValidos.reduce(
    (total, pedido) => total + pedido.lucroEstimadoSnapshot.toNumber(),
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-card p-5 shadow-soft">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">
              Resumo financeiro
            </h2>
            <p className="text-sm text-stone-500">
              Totais calculados apenas com pedidos do período.
            </p>
          </div>

          <form className="grid gap-3 md:grid-cols-[180px_150px_150px_auto]">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Filtro</span>
              <select
                name="filtro"
                defaultValue={period.filter}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-hidden transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Início</span>
              <input
                name="inicio"
                type="date"
                defaultValue={formatDateInput(period.start)}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-hidden transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Fim</span>
              <input
                name="fim"
                type="date"
                defaultValue={formatDateInput(addDays(period.end, -1))}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-hidden transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Aplicar
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-stone-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-600">
              <DollarSign className="size-4 text-brand-700" aria-hidden="true" />
              Total vendido
            </div>
            <p className="text-2xl font-semibold text-stone-950">
              {formatMoney(totalVendido)}
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-600">
              <ReceiptText className="size-4 text-brand-700" aria-hidden="true" />
              Custo total
            </div>
            <p className="text-2xl font-semibold text-stone-950">
              {formatMoney(custoTotal)}
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-600">
              <TrendingUp className="size-4 text-brand-700" aria-hidden="true" />
              Lucro total
            </div>
            <p className="text-2xl font-semibold text-stone-950">
              {formatMoney(lucroTotal)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-stone-500">
          Pedidos cancelados aparecem na lista, mas não entram nos totais.
        </p>
      </section>

      <section className="rounded-lg border border-stone-200 bg-card p-5 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-stone-950">
            Últimos pedidos
          </h2>
          <p className="text-sm text-stone-500">
            {formatDate(period.start)} até {formatDate(addDays(period.end, -1))}
          </p>
        </div>

        {pedidos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Nenhum pedido no período selecionado.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Pedido</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Data</th>
                  <th className="px-3 py-2 text-right font-semibold">Custo</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Preço final
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Lucro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {pedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td className="px-3 py-3">
                      <p className="font-medium text-stone-950">
                        {pedido.cliente?.nome ?? "Cliente removido"}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {getPedidoSummary(pedido.itens)}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-stone-700">
                      {statusLabels[pedido.status]}
                    </td>
                    <td className="px-3 py-3 text-stone-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-4 text-brand-700" aria-hidden="true" />
                        {formatDate(pedido.dataPedido)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-stone-700">
                      {formatMoney(pedido.custoTotalSnapshot.toNumber())}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-stone-950">
                      {formatMoney(pedido.precoTotalSnapshot.toNumber())}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-stone-950">
                      {formatMoney(pedido.lucroEstimadoSnapshot.toNumber())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
