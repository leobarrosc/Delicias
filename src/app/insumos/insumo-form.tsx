"use client";

import { useActionState } from "react";
import { PackagePlus } from "lucide-react";
import { saveInsumo, type InsumoFormState } from "@/app/insumos/actions";

type InsumoFormProps = {
  insumo?: {
    id: string;
    nome: string;
    categoria: string;
    quantidadeCompra: string;
    unidadeCompra: string;
    precoCompra: string;
    estoqueAtual: string;
    estoqueMinimo: string;
    dataUltimaCompra: string;
  };
};

const initialState: InsumoFormState = {};

const units = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "L", label: "L" },
  { value: "ml", label: "ml" },
  { value: "duzia", label: "dúzia" },
  { value: "unidade", label: "unidade" },
];

export function InsumoForm({ insumo }: InsumoFormProps) {
  const [state, formAction, isPending] = useActionState(saveInsumo, initialState);

  return (
    <form action={formAction} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="id" defaultValue={insumo?.id} />

      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <PackagePlus className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-stone-950">
            {insumo ? "Corrigir ingrediente" : "Novo ingrediente"}
          </h2>
          <p className="text-sm text-stone-500">
            Digite como você comprou. O sistema calcula quanto custa usar um pouco dele na receita.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Nome do ingrediente</span>
          <input
            name="nome"
            defaultValue={insumo?.nome}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Chocolate em pó"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Categoria</span>
          <input
            name="categoria"
            defaultValue={insumo?.categoria}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Secos, laticínios, embalagens..."
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Quanto veio na compra</span>
          <input
            name="quantidadeCompra"
            type="number"
            step="0.001"
            min="0.001"
            defaultValue={insumo?.quantidadeCompra}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="1"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Unidade da compra</span>
          <select
            name="unidadeCompra"
            defaultValue={insumo?.unidadeCompra ?? "kg"}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          >
            {units.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Quanto você pagou</span>
          <input
            name="precoCompra"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={insumo?.precoCompra}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="18.90"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Data da última compra</span>
          <input
            name="dataUltimaCompra"
            type="date"
            defaultValue={insumo?.dataUltimaCompra}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Quanto tem hoje em estoque</span>
          <input
            name="estoqueAtual"
            type="number"
            step="0.001"
            min="0"
            defaultValue={insumo?.estoqueAtual}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Opcional"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Avisar quando chegar em</span>
          <input
            name="estoqueMinimo"
            type="number"
            step="0.001"
            min="0"
            defaultValue={insumo?.estoqueMinimo}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Opcional"
          />
        </label>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isPending ? "Salvando..." : insumo ? "Salvar correções" : "Cadastrar ingrediente"}
        </button>
      </div>
    </form>
  );
}
