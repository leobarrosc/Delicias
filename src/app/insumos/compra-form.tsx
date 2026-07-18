"use client";

import { useActionState } from "react";
import { ShoppingCart } from "lucide-react";
import {
  registrarCompraInsumo,
  type CompraFormState,
} from "@/app/insumos/actions";

type CompraFormProps = {
  insumoId: string;
  embalagemLabel: string;
};

const initialState: CompraFormState = {};

const inputClassName =
  "rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

export function CompraForm({ insumoId, embalagemLabel }: CompraFormProps) {
  const [state, formAction, isPending] = useActionState(
    registrarCompraInsumo,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="insumoId" value={insumoId} />

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Quantas embalagens
          </span>
          <input
            name="quantidadeEmbalagens"
            type="number"
            step="0.001"
            min="0.001"
            className={inputClassName}
            placeholder="24"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Valor total pago
          </span>
          <input
            name="precoTotal"
            type="number"
            step="0.01"
            min="0.01"
            className={inputClassName}
            placeholder="112.90"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Data da compra
          </span>
          <input name="dataCompra" type="date" className={inputClassName} />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          <ShoppingCart className="size-4" aria-hidden="true" />
          {isPending ? "Registrando..." : "Registrar"}
        </button>
      </div>

      <p className="mt-2 text-xs text-stone-500">
        Cada embalagem tem {embalagemLabel}. O estoque e o custo por unidade são
        atualizados na hora.
      </p>

      {state.error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
