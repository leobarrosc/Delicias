import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import { PedidoForm } from "@/app/pedidos/pedido-form";
import {
  returnPedidoStock,
  updatePedidoStatus,
} from "@/app/pedidos/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getCurrentUserId } from "@/lib/demo-user";
import {
  getInsufficientStockWarnings,
  getOrderStockRequirements,
} from "@/lib/order-stock";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusColumns = [
  { value: "EM_ORCAMENTO", label: "Em orçamento" },
  { value: "PRODUCAO", label: "Produção" },
  { value: "CONCLUIDO", label: "Concluídos" },
  { value: "CANCELADO", label: "Cancelados" },
] as const;

const statusLabels = {
  EM_ORCAMENTO: "Em orçamento",
  PRODUCAO: "Produção",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

function formatMoney(value: { toNumber: () => number }) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value.toNumber());
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

export default async function PedidosPage() {
  const userId = await getCurrentUserId();
  const [clientes, receitas, pedidos] = await Promise.all([
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
    prisma.pedido.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
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
        },
      },
    }),
  ]);

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
  const stockWarningsByPedidoId = new Map(
    await Promise.all(
      pedidos.map(async (pedido) => {
        const requirements = await getOrderStockRequirements({
          client: prisma,
          pedidoId: pedido.id,
          userId,
        });

        return [
          pedido.id,
          getInsufficientStockWarnings(requirements),
        ] as const;
      }),
    ),
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(420px,520px)_1fr]">
      <PedidoForm clientes={clienteOptions} receitas={receitaOptions} />

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-stone-950">
            Kanban de pedidos
          </h2>
          <p className="text-sm text-stone-500">
            Acompanhe o fluxo por status e mova os cards pelos botões.
          </p>
        </div>

        {pedidos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Nenhum pedido cadastrado ainda.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-4">
            {statusColumns.map((column) => {
              const columnPedidos = pedidos.filter(
                (pedido) => pedido.status === column.value,
              );

              return (
                <div
                  key={column.value}
                  className="min-h-64 rounded-lg border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-stone-950">
                      {column.label}
                    </h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-stone-600">
                      {columnPedidos.length}
                    </span>
                  </div>

                  {columnPedidos.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">
                      Nenhum pedido.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {columnPedidos.map((pedido) => (
                        <article
                          key={pedido.id}
                          className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-2">
                            <ClipboardList
                              className="mt-0.5 size-4 shrink-0 text-brand-700"
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-stone-950">
                                {pedido.cliente?.nome ?? "Cliente removido"}
                              </p>
                              <p className="mt-1 text-sm text-stone-600">
                                {getPedidoSummary(pedido.itens)}
                              </p>
                              {pedido.aniversariante ? (
                                <p className="mt-1 text-xs text-stone-500">
                                  Aniversariante: {pedido.aniversariante.nome}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2 rounded-md bg-stone-50 px-2 py-2 text-xs text-stone-600">
                            <CalendarDays
                              className="size-4 text-brand-700"
                              aria-hidden="true"
                            />
                            Entrega: {formatDate(pedido.dataEntrega)}
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <dt className="text-stone-500">Custo</dt>
                              <dd className="font-semibold text-stone-950">
                                {formatMoney(pedido.custoTotalSnapshot)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-stone-500">Preço final</dt>
                              <dd className="font-semibold text-stone-950">
                                {formatMoney(pedido.precoTotalSnapshot)}
                              </dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-stone-500">Lucro estimado</dt>
                              <dd className="font-semibold text-stone-950">
                                {formatMoney(pedido.lucroEstimadoSnapshot)}
                              </dd>
                            </div>
                          </dl>

                          <div className="mt-3 rounded-md bg-stone-50 px-2 py-2 text-xs font-medium text-stone-700">
                            Estoque:{" "}
                            {pedido.estoqueBaixado
                              ? "baixado"
                              : pedido.estoqueDevolvido
                                ? "devolvido"
                                : "pendente"}
                          </div>

                          {(stockWarningsByPedidoId.get(pedido.id)?.length ?? 0) >
                          0 ? (
                            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                              <div className="flex items-start gap-2 font-semibold">
                                <AlertTriangle
                                  className="mt-0.5 size-4 shrink-0"
                                  aria-hidden="true"
                                />
                                Estoque insuficiente
                              </div>
                              <ul className="mt-2 space-y-1">
                                {stockWarningsByPedidoId
                                  .get(pedido.id)
                                  ?.slice(0, 3)
                                  .map((warning) => (
                                    <li key={warning.insumoId}>
                                      {warning.nome}: precisa{" "}
                                      {warning.quantidadeNecessaria.toFixed(3)}{" "}
                                      {warning.unidadeBase}, disponível{" "}
                                      {warning.estoqueAtual.toFixed(3)}{" "}
                                      {warning.unidadeBase}.
                                    </li>
                                  ))}
                              </ul>
                              <p className="mt-2">
                                Você pode mover para produção mesmo assim; o
                                estoque ficará negativo.
                              </p>
                            </div>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {statusColumns
                              .filter((status) => status.value !== pedido.status)
                              .map((status) => (
                                <form
                                  key={status.value}
                                  action={updatePedidoStatus}
                                >
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={pedido.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value={status.value}
                                  />
                                  <ConfirmSubmitButton
                                    message={
                                      status.value === "PRODUCAO"
                                        ? "Ao mover para produção, o sistema vai baixar os ingredientes do estoque. Se faltar estoque, ele pode ficar negativo. Deseja continuar?"
                                        : status.value === "CANCELADO"
                                          ? "Tem certeza que deseja cancelar este pedido? Se o estoque já foi baixado, use depois o botão de devolver estoque."
                                          : `Mover este pedido para ${statusLabels[status.value]}?`
                                    }
                                    className="rounded-md border border-stone-200 px-2 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
                                  >
                                    {statusLabels[status.value]}
                                  </ConfirmSubmitButton>
                                </form>
                              ))}
                            {pedido.status === "CANCELADO" &&
                            pedido.estoqueBaixado ? (
                              <form action={returnPedidoStock}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={pedido.id}
                                />
                                <ConfirmSubmitButton
                                  message="Devolver os ingredientes deste pedido ao estoque?"
                                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 px-2 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                                >
                                  <RotateCcw
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  Devolver estoque
                                </ConfirmSubmitButton>
                              </form>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
