import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { deactivateReceita, recalculateReceita } from "@/app/receitas/actions";
import { ReceitaForm } from "@/app/receitas/receita-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatMoney(value: { toNumber: () => number }) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value.toNumber());
}

function formatDecimal(value: { toString: () => string } | null) {
  return value?.toString() ?? "";
}

function formatUnitLabel(unit: string) {
  return unit === "duzia" ? "dúzia" : unit;
}

export default async function ReceitasPage() {
  const userId = await getCurrentUserId();
  const [insumos, receitas] = await Promise.all([
    prisma.insumo.findMany({
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
        unidadeBase: true,
        custoUnitarioBase: true,
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
      include: {
        itens: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            insumo: {
              select: {
                nome: true,
                unidadeBase: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const insumoOptions = insumos.map((insumo) => ({
    id: insumo.id,
    nome: insumo.nome,
    unidadeBase: insumo.unidadeBase,
    custoUnitarioBase: insumo.custoUnitarioBase.toString(),
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(380px,460px)_1fr]">
      <ReceitaForm insumos={insumoOptions} />

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-stone-950">
            Receitas cadastradas
          </h2>
          <p className="text-sm text-stone-500">
            Consulte custo total, custo por unidade e ficha técnica.
          </p>
        </div>

        {receitas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Nenhuma receita cadastrada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {receitas.map((receita) => (
              <article
                key={receita.id}
                className="rounded-lg border border-stone-200 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-stone-950">
                      {receita.nome}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-stone-500">Rendimento</dt>
                        <dd className="font-medium text-stone-900">
                          {receita.rendimento ?? 0} unidades
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Custo total</dt>
                        <dd className="font-medium text-stone-900">
                          {formatMoney(receita.custoTotalAtual)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Custo por unidade</dt>
                        <dd className="font-medium text-stone-900">
                          {formatMoney(receita.custoPorUnidade)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Atualização</dt>
                        <dd className="font-medium text-stone-900">
                          {receita.atualizarCustoAutomaticamente
                            ? "Automática"
                            : "Manual"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={recalculateReceita}>
                      <input type="hidden" name="id" value={receita.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                      >
                        <RefreshCw className="size-4" aria-hidden="true" />
                        Recalcular
                      </button>
                    </form>

                    <form action={deactivateReceita}>
                      <input type="hidden" name="id" value={receita.id} />
                      <ConfirmSubmitButton
                        message={`Tem certeza que deseja desativar a receita ${receita.nome}? Ela não aparecerá em novos pedidos.`}
                        className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Desativar receita
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-stone-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Insumo</th>
                        <th className="px-3 py-2 font-semibold">Uso</th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Custo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {receita.itens.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-medium text-stone-900">
                            {item.insumo.nome}
                          </td>
                          <td className="px-3 py-2 text-stone-600">
                            {formatDecimal(item.quantidade)}{" "}
                            {formatUnitLabel(item.unidade)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-stone-900">
                            {formatMoney(item.custoTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <details className="mt-4">
                  <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar receita
                  </summary>
                  <div className="mt-4">
                    <ReceitaForm
                      insumos={insumoOptions}
                      receita={{
                        id: receita.id,
                        nome: receita.nome,
                        rendimento: receita.rendimento?.toString() ?? "",
                        atualizarCustoAutomaticamente:
                          receita.atualizarCustoAutomaticamente,
                        itens: receita.itens.map((item) => ({
                          id: item.id,
                          insumoId: item.insumoId,
                          quantidade: formatDecimal(item.quantidade),
                          unidade: item.unidade,
                        })),
                      }}
                    />
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
