import { Pencil, Trash2 } from "lucide-react";
import { deactivateInsumo } from "@/app/insumos/actions";
import { InsumoForm } from "@/app/insumos/insumo-form";
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

function formatDateInput(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

function formatUnitLabel(unit: string) {
  return unit === "duzia" ? "dúzia" : unit;
}

export default async function InsumosPage() {
  const userId = await getCurrentUserId();
  const insumos = await prisma.insumo.findMany({
    where: {
      userId,
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(360px,420px)_1fr]">
      <InsumoForm />

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-stone-950">Ingredientes cadastrados</h2>
          <p className="text-sm text-stone-500">
            Veja quanto cada ingrediente custa e quanto ainda tem em estoque.
          </p>
        </div>

        {insumos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Nenhum ingrediente cadastrado ainda. Comece pelo formulário ao lado.
          </div>
        ) : (
          <div className="space-y-3">
            {insumos.map((insumo) => (
              <article
                key={insumo.id}
                className="rounded-lg border border-stone-200 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-stone-950">
                      {insumo.nome}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {insumo.categoria}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="text-stone-500">Você comprou</dt>
                        <dd className="font-medium text-stone-900">
                          {formatDecimal(insumo.quantidadeCompra)}{" "}
                          {formatUnitLabel(insumo.unidadeCompra)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Preço</dt>
                        <dd className="font-medium text-stone-900">
                          {formatMoney(insumo.precoCompra)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Custo nas receitas</dt>
                        <dd className="font-medium text-stone-900">
                          Cada 1 {formatUnitLabel(insumo.unidadeBase)} custa{" "}
                          {formatMoney(insumo.custoUnitarioBase)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Estoque</dt>
                        <dd className="font-medium text-stone-900">
                          {formatDecimal(insumo.estoqueAtual) || "Não informado"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <form action={deactivateInsumo}>
                    <input type="hidden" name="id" value={insumo.id} />
                    <ConfirmSubmitButton
                      message={`Tem certeza que deseja desativar ${insumo.nome}? Ele não aparecerá nas novas receitas.`}
                      className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Desativar ingrediente
                    </ConfirmSubmitButton>
                  </form>
                </div>

                <details className="mt-4">
                  <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                    <Pencil className="size-4" aria-hidden="true" />
                    Corrigir ingrediente
                  </summary>
                  <div className="mt-4">
                    <InsumoForm
                      insumo={{
                        id: insumo.id,
                        nome: insumo.nome,
                        categoria: insumo.categoria,
                        quantidadeCompra: formatDecimal(insumo.quantidadeCompra),
                        unidadeCompra: insumo.unidadeCompra,
                        precoCompra: formatDecimal(insumo.precoCompra),
                        estoqueAtual: formatDecimal(insumo.estoqueAtual),
                        estoqueMinimo: formatDecimal(insumo.estoqueMinimo),
                        dataUltimaCompra: formatDateInput(insumo.dataUltimaCompra),
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
