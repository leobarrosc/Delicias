import Link from "next/link";
import { CalendarDays, RotateCcw, Search } from "lucide-react";
import {
  returnPedidoStock,
  updatePedidoStatus,
} from "@/app/pedidos/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type PedidosSearchParams = {
  status?: string;
  q?: string;
};

const statusLabels = {
  EM_ORCAMENTO: "Em orçamento",
  PRODUCAO: "Produção",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
} as const;

type StatusValue = keyof typeof statusLabels;

const statusFiltros: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "EM_ORCAMENTO", label: "Em orçamento" },
  { value: "PRODUCAO", label: "Produção" },
  { value: "CONCLUIDO", label: "Concluídos" },
  { value: "CANCELADO", label: "Cancelados" },
];

const statusChipTones: Record<string, string> = {
  EM_ORCAMENTO: "bg-amber-50 text-amber-700",
  PRODUCAO: "bg-sky-50 text-sky-700",
  CONCLUIDO: "bg-emerald-50 text-emerald-700",
  CANCELADO: "bg-red-50 text-red-700",
};

const transicoes: Record<StatusValue, StatusValue[]> = {
  EM_ORCAMENTO: ["PRODUCAO", "CANCELADO"],
  PRODUCAO: ["CONCLUIDO", "CANCELADO"],
  CONCLUIDO: ["PRODUCAO"],
  CANCELADO: ["EM_ORCAMENTO"],
};

const statusChangeMessages: Record<string, string> = {
  PRODUCAO:
    "Ao mover para produção, o sistema baixa os ingredientes do estoque. Deseja continuar?",
  CANCELADO:
    "Cancelar este pedido? Se o estoque já foi baixado, use depois o botão de devolver estoque.",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function getPedidoSummary(
  itens: { descricao: string; quantidade: number }[],
) {
  if (itens.length === 0) {
    return "Pedido sem receitas";
  }

  if (itens.length === 1) {
    return `${itens[0].quantidade}x ${itens[0].descricao}`;
  }

  const total = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return `${total} itens em ${itens.length} receitas`;
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams?: Promise<PedidosSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const statusFiltro = params.status ?? "todos";
  const busca = params.q?.trim() ?? "";
  const userId = await getCurrentUserId();

  const where: Prisma.PedidoWhereInput = { userId };

  if (statusFiltro !== "todos" && statusFiltro in statusLabels) {
    where.status = statusFiltro as StatusValue;
  }

  if (busca) {
    where.cliente = { nome: { contains: busca, mode: "insensitive" } };
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      cliente: { select: { nome: true } },
      itens: {
        orderBy: { createdAt: "asc" },
        select: { descricao: true, quantidade: true },
      },
    },
  });

  function filtroHref(status: string) {
    const search = new URLSearchParams();
    if (status !== "todos") {
      search.set("status", status);
    }
    if (busca) {
      search.set("q", busca);
    }
    const query = search.toString();

    return query ? `/pedidos?${query}` : "/pedidos";
  }

  return (
    <section className="border border-stone-200 bg-card p-4 shadow-soft md:p-5">
      <div className="mb-4 border-b-2 border-stone-200 pb-2">
        <h2 className="text-lg font-medium text-stone-700">
          Histórico de pedidos
        </h2>
      </div>
      <p className="mb-4 text-sm text-stone-500">
        Todos os pedidos, incluindo concluídos e cancelados. Crie novos pelo
        botão “Novo pedido rápido” no Dashboard.
      </p>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFiltros.map((filtro) => {
            const ativo = statusFiltro === filtro.value;

            return (
              <Link
                key={filtro.value}
                href={filtroHref(filtro.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  ativo
                    ? "bg-brand-600 text-white"
                    : "border border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                {filtro.label}
              </Link>
            );
          })}
        </div>

        <form className="relative w-full lg:w-64">
          {statusFiltro !== "todos" ? (
            <input type="hidden" name="status" value={statusFiltro} />
          ) : null}
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            name="q"
            defaultValue={busca}
            placeholder="Buscar por cliente"
            className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-sm outline-hidden transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </form>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
          Nenhum pedido encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Cliente</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Entrega</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
                <th className="px-3 py-2 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {pedidos.map((pedido) => {
                const total =
                  pedido.precoTotalSnapshot.toNumber() +
                  pedido.freteSnapshot.toNumber();

                return (
                  <tr key={pedido.id} className="align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-stone-950">
                        {pedido.cliente?.nome ?? "Cliente removido"}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {getPedidoSummary(pedido.itens)}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusChipTones[pedido.status] ??
                          "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {statusLabels[pedido.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-stone-700">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays
                          className="size-4 text-brand-500"
                          aria-hidden="true"
                        />
                        {formatDate(pedido.dataEntrega)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-stone-950">
                      {formatMoney(total)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {transicoes[pedido.status].map((destino) => (
                          <form key={destino} action={updatePedidoStatus}>
                            <input type="hidden" name="id" value={pedido.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={destino}
                            />
                            <ConfirmSubmitButton
                              message={
                                statusChangeMessages[destino] ??
                                `Mover para ${statusLabels[destino]}?`
                              }
                              className="rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
                            >
                              {statusLabels[destino]}
                            </ConfirmSubmitButton>
                          </form>
                        ))}
                        {pedido.status === "CANCELADO" &&
                        pedido.estoqueBaixado &&
                        !pedido.estoqueDevolvido ? (
                          <form action={returnPedidoStock}>
                            <input type="hidden" name="id" value={pedido.id} />
                            <ConfirmSubmitButton
                              message="Devolver os ingredientes deste pedido ao estoque?"
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <RotateCcw
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              Devolver
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
