import { History, Package, Pencil, ShoppingCart, Trash2 } from "lucide-react";
import { deactivateInsumo } from "@/app/insumos/actions";
import { CompraForm } from "@/app/insumos/compra-form";
import { InsumoForm } from "@/app/insumos/insumo-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { normalizeToBaseUnit, type SupportedUnit } from "@/lib/units";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Custo por g/ml costuma ser menor que um centavo; mostra até 4 casas.
function formatUnitMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}

function formatDecimalInput(value: { toString: () => string } | null) {
  return value?.toString() ?? "";
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Sem compras ainda";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatUnitLabel(unit: string) {
  return unit === "duzia" ? "dúzia" : unit;
}

export default async function InsumosPage() {
  const userId = await getCurrentUserId();
  const [insumos, marcas] = await Promise.all([
    prisma.insumo.findMany({
      where: {
        userId,
        ativo: true,
      },
      orderBy: {
        nome: "asc",
      },
      include: {
        marcaRef: {
          select: { nome: true, logoUrl: true },
        },
        compras: {
          orderBy: {
            dataCompra: "desc",
          },
          take: 12,
        },
      },
    }),
    prisma.marca.findMany({
      where: { userId },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <InsumoForm marcas={marcas} />

      <section className="border border-stone-200 bg-card p-4 shadow-soft md:p-5">
        <div className="mb-4 border-b-2 border-stone-200 pb-2">
          <h2 className="text-lg font-medium text-stone-700">
            Ingredientes cadastrados
          </h2>
        </div>
        <p className="mb-4 text-sm text-stone-500">
          Veja custo, estoque e histórico. Comprou de novo? Registre a reposição
          direto no produto.
        </p>

        {insumos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Nenhum ingrediente cadastrado ainda. Comece pelo formulário acima.
          </div>
        ) : (
          <div className="space-y-3">
            {insumos.map((insumo) => {
              const conteudoEmbalagem = insumo.conteudoEmbalagem.toNumber();
              const conteudoBase = normalizeToBaseUnit(
                conteudoEmbalagem,
                insumo.unidadeEmbalagem as SupportedUnit,
              );
              const estoqueAtual = insumo.estoqueAtual?.toNumber() ?? null;
              const embalagensEmEstoque =
                estoqueAtual !== null && conteudoBase > 0
                  ? estoqueAtual / conteudoBase
                  : null;
              const embalagemLabel = `${formatNumber(conteudoEmbalagem)} ${formatUnitLabel(insumo.unidadeEmbalagem)}`;
              const custoUnitario = insumo.custoUnitarioBase.toNumber();

              return (
                <article
                  key={insumo.id}
                  className="rounded-lg border border-stone-200 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                        {insumo.fotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={insumo.fotoUrl}
                            alt={insumo.nome}
                            className="size-full object-cover"
                          />
                        ) : (
                          <Package
                            className="size-6 text-stone-400"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-stone-950">
                          {insumo.nome}
                        </p>
                        {insumo.marcaRef ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                            {insumo.marcaRef.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={insumo.marcaRef.logoUrl}
                                alt={insumo.marcaRef.nome}
                                className="size-4 rounded-sm object-contain"
                              />
                            ) : null}
                            {insumo.marcaRef.nome}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-stone-500">
                        {insumo.categoria}
                      </p>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <dt className="text-stone-500">Embalagem</dt>
                          <dd className="font-medium text-stone-900">
                            {embalagemLabel}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-stone-500">Custo nas receitas</dt>
                          <dd className="font-medium text-stone-900">
                            {custoUnitario > 0
                              ? `Cada 1 ${formatUnitLabel(insumo.unidadeBase)} custa ${formatUnitMoney(custoUnitario)}`
                              : "Sem compras ainda"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-stone-500">Estoque</dt>
                          <dd className="font-medium text-stone-900">
                            {estoqueAtual !== null
                              ? `${formatNumber(estoqueAtual)} ${formatUnitLabel(insumo.unidadeBase)}${
                                  embalagensEmEstoque !== null
                                    ? ` (~${embalagensEmEstoque.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} emb.)`
                                    : ""
                                }`
                              : "Não controlado"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-stone-500">Última compra</dt>
                          <dd className="font-medium text-stone-900">
                            {formatDate(insumo.dataUltimaCompra)}
                          </dd>
                        </div>
                      </dl>
                      </div>
                    </div>

                    <form action={deactivateInsumo}>
                      <input type="hidden" name="id" value={insumo.id} />
                      <ConfirmSubmitButton
                        message={`Tem certeza que deseja desativar ${insumo.nome}? Ele não aparecerá nas novas receitas.`}
                        className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Desativar
                      </ConfirmSubmitButton>
                    </form>
                  </div>

                  <details className="mt-4">
                    <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-brand-500/40 px-3 py-2 text-sm font-medium text-brand-500 transition hover:bg-brand-50">
                      <ShoppingCart className="size-4" aria-hidden="true" />
                      Registrar compra (reposição)
                    </summary>
                    <div className="mt-4 rounded-lg border border-dashed border-stone-300 p-3">
                      <CompraForm
                        insumoId={insumo.id}
                        embalagemLabel={embalagemLabel}
                      />
                    </div>
                  </details>

                  <details className="mt-3">
                    <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                      <History className="size-4" aria-hidden="true" />
                      Histórico de compras ({insumo.compras.length})
                    </summary>
                    <div className="mt-4">
                      {insumo.compras.length === 0 ? (
                        <p className="text-sm text-stone-500">
                          Nenhuma compra registrada ainda.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-stone-200">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                              <tr>
                                <th className="px-3 py-2 font-semibold">Data</th>
                                <th className="px-3 py-2 font-semibold">
                                  Embalagens
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                  Total pago
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                  Por embalagem
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                              {insumo.compras.map((compra) => {
                                const embalagens =
                                  compra.quantidadeEmbalagens.toNumber();
                                const total = compra.precoTotal.toNumber();

                                return (
                                  <tr key={compra.id}>
                                    <td className="px-3 py-2 text-stone-700">
                                      {formatDate(compra.dataCompra)}
                                    </td>
                                    <td className="px-3 py-2 text-stone-700">
                                      {formatNumber(embalagens)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium text-stone-900">
                                      {formatMoney(total)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-stone-700">
                                      {embalagens > 0
                                        ? formatMoney(total / embalagens)
                                        : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </details>

                  <details className="mt-3">
                    <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                      <Pencil className="size-4" aria-hidden="true" />
                      Corrigir ingrediente
                    </summary>
                    <div className="mt-4">
                      <InsumoForm
                        marcas={marcas}
                        insumo={{
                          id: insumo.id,
                          nome: insumo.nome,
                          marcaId: insumo.marcaId ?? "",
                          fotoUrl: insumo.fotoUrl ?? "",
                          categoria: insumo.categoria,
                          conteudoEmbalagem: formatDecimalInput(
                            insumo.conteudoEmbalagem,
                          ),
                          unidadeEmbalagem: insumo.unidadeEmbalagem,
                          estoqueAtual: formatDecimalInput(insumo.estoqueAtual),
                          estoqueMinimo: formatDecimalInput(
                            insumo.estoqueMinimo,
                          ),
                        }}
                      />
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
