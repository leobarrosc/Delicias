"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CookingPot,
  Plus,
  RefreshCw,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import {
  carregarReceitaDetalhe,
  deactivateReceita,
  recalculateReceita,
} from "@/app/receitas/actions";
import {
  ReceitaForm,
  type CategoriaOption,
  type InsumoOption,
  type ReceitaEditData,
} from "@/app/receitas/receita-form";
import { Modal } from "@/components/modal";

export type ReceitaResumo = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  categoriaNome: string | null;
  custoTotal: number;
  custoPorUnidade: number;
  rendimento: number | null;
  itensCount: number;
  atualizacaoAutomatica: boolean;
};

type ReceitasClientProps = {
  insumos: InsumoOption[];
  categorias: CategoriaOption[];
  receitas: ReceitaResumo[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function Thumb({ url, nome }: { url: string | null; nome: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={nome}
        className="size-14 shrink-0 rounded-md border border-stone-200 object-cover"
      />
    );
  }

  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-100 text-stone-400">
      <UtensilsCrossed className="size-6" aria-hidden="true" />
    </span>
  );
}

export function ReceitasClient({
  insumos,
  categorias,
  receitas,
}: ReceitasClientProps) {
  const router = useRouter();
  const [novaOpen, setNovaOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ReceitaEditData | null>(null);
  const [detalheItens, setDetalheItens] = useState<
    { id: string; insumoNome: string; quantidade: string; unidade: string; custoTotal: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);

  const selecionada = receitas.find((receita) => receita.id === selectedId);

  // Detalhe carregado sob demanda quando uma receita é aberta; ao fechar,
  // limpamos tudo para não acumular receitas completas em memória.
  useEffect(() => {
    if (!selectedId) {
      return;
    }

    let ativo = true;
    setLoading(true);
    setDetalhe(null);
    setDetalheItens([]);

    carregarReceitaDetalhe(selectedId).then((data) => {
      if (!ativo || !data) {
        return;
      }

      setDetalhe({
        id: data.id,
        nome: data.nome,
        fotoUrl: data.fotoUrl,
        categoriaId: data.categoriaId,
        rendimento: data.rendimento,
        atualizarCustoAutomaticamente: data.atualizarCustoAutomaticamente,
        itens: data.itens.map((item) => ({
          id: item.id,
          insumoId: item.insumoId,
          quantidade: item.quantidade,
          unidade: item.unidade,
        })),
      });
      setDetalheItens(
        data.itens.map((item) => ({
          id: item.id,
          insumoNome: item.insumoNome,
          quantidade: item.quantidade,
          unidade: item.unidade,
          custoTotal: item.custoTotal,
        })),
      );
      setLoading(false);
    });

    return () => {
      ativo = false;
    };
  }, [selectedId]);

  function closeDetail() {
    setSelectedId(null);
    setDetalhe(null);
    setDetalheItens([]);
    setEditando(false);
  }

  function afterSave() {
    setNovaOpen(false);
    closeDetail();
    router.refresh();
  }

  async function handleRecalcular() {
    if (!selectedId) {
      return;
    }

    const formData = new FormData();
    formData.set("id", selectedId);
    await recalculateReceita(formData);
    afterSave();
  }

  async function handleDesativar() {
    if (!selectedId || !selecionada) {
      return;
    }

    if (
      !window.confirm(
        `Desativar a receita ${selecionada.nome}? Ela não aparecerá em novos pedidos.`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("id", selectedId);
    await deactivateReceita(formData);
    afterSave();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-stone-700">Receitas</h2>
          <p className="text-sm text-stone-500">
            Custo total, custo por unidade e ficha técnica de cada receita.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNovaOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nova receita
        </button>
      </div>

      <section className="border border-stone-200 bg-card p-4 shadow-sm md:p-5">
        {receitas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Nenhuma receita cadastrada ainda. Clique em “Nova receita”.
          </div>
        ) : (
          <ul className="divide-y divide-stone-200">
            {receitas.map((receita) => (
              <li key={receita.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(receita.id)}
                  className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-stone-100/50"
                >
                  <Thumb url={receita.fotoUrl} nome={receita.nome} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-stone-950">
                        {receita.nome}
                      </p>
                      {receita.categoriaNome ? (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-500">
                          {receita.categoriaNome}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {receita.itensCount} ingrediente
                      {receita.itensCount === 1 ? "" : "s"}
                      {receita.rendimento
                        ? ` · rende ${receita.rendimento}`
                        : ""}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-xs text-stone-500">Custo total</p>
                    <p className="font-semibold text-stone-950">
                      {formatMoney(receita.custoTotal)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-stone-500">Por unidade</p>
                    <p className="font-semibold text-brand-500">
                      {formatMoney(receita.custoPorUnidade)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={novaOpen} onClose={() => setNovaOpen(false)} label="Nova receita">
        <ReceitaForm
          insumos={insumos}
          categorias={categorias}
          onSaved={afterSave}
        />
      </Modal>

      <Modal
        open={selectedId !== null}
        onClose={closeDetail}
        label={selecionada ? `Receita ${selecionada.nome}` : "Receita"}
      >
        <div className="rounded-lg border border-stone-200 bg-card p-5 shadow-sm">
          {loading || !detalhe || !selecionada ? (
            <div className="flex items-center gap-3 py-6 text-sm text-stone-500">
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
              Carregando receita...
            </div>
          ) : editando ? (
            <ReceitaForm
              insumos={insumos}
              categorias={categorias}
              receita={detalhe}
              onSaved={afterSave}
            />
          ) : (
            <div>
              <div className="flex items-start gap-4 pr-10">
                <Thumb url={selecionada.fotoUrl} nome={selecionada.nome} />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-stone-950">
                    {selecionada.nome}
                  </h2>
                  <p className="text-sm text-stone-500">
                    {selecionada.categoriaNome ?? "Sem categoria"} ·{" "}
                    {selecionada.atualizacaoAutomatica
                      ? "Custo automático"
                      : "Custo manual"}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-stone-50 p-3 text-sm">
                <div>
                  <dt className="text-xs text-stone-500">Rendimento</dt>
                  <dd className="font-semibold text-stone-950">
                    {selecionada.rendimento ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">Custo total</dt>
                  <dd className="font-semibold text-stone-950">
                    {formatMoney(selecionada.custoTotal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">Por unidade</dt>
                  <dd className="font-semibold text-brand-500">
                    {formatMoney(selecionada.custoPorUnidade)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 overflow-hidden rounded-lg border border-stone-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Ingrediente</th>
                      <th className="px-3 py-2 font-semibold">Uso</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Custo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {detalheItens.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-medium text-stone-900">
                          {item.insumoNome}
                        </td>
                        <td className="px-3 py-2 text-stone-600">
                          {item.quantidade}{" "}
                          {item.unidade === "duzia" ? "dúzia" : item.unidade}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-stone-900">
                          {formatMoney(item.custoTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    <CookingPot className="size-4" aria-hidden="true" />
                    Editar receita
                  </button>
                  <button
                    type="button"
                    onClick={handleRecalcular}
                    className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Recalcular custo
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDesativar}
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Desativar
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
