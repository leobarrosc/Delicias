"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { CirclePlus, CookingPot, Trash2 } from "lucide-react";
import { saveReceita, type ReceitaFormState } from "@/app/receitas/actions";
import { generateLocalId } from "@/lib/ids";

type InsumoOption = {
  id: string;
  nome: string;
  unidadeBase: string;
  custoUnitarioBase: string;
};

type ReceitaFormItem = {
  id: string;
  insumoId: string;
  quantidade: string;
  unidade: string;
};

type ReceitaFormProps = {
  insumos: InsumoOption[];
  receita?: {
    id: string;
    nome: string;
    rendimento: string;
    atualizarCustoAutomaticamente: boolean;
    itens: ReceitaFormItem[];
  };
};

const initialState: ReceitaFormState = {};

const unitOptions = [
  { value: "kg", label: "kg", baseUnit: "g" },
  { value: "g", label: "g", baseUnit: "g" },
  { value: "L", label: "L", baseUnit: "ml" },
  { value: "ml", label: "ml", baseUnit: "ml" },
  { value: "duzia", label: "dúzia", baseUnit: "unidade" },
  { value: "unidade", label: "unidade", baseUnit: "unidade" },
];

function createEmptyItem(insumos: InsumoOption[]): ReceitaFormItem {
  const firstInsumo = insumos[0];
  const firstUnit =
    unitOptions.find((unit) => unit.baseUnit === firstInsumo?.unidadeBase)?.value ??
    "g";

  return {
    id: generateLocalId(),
    insumoId: firstInsumo?.id ?? "",
    quantidade: "",
    unidade: firstUnit,
  };
}

function getCompatibleUnits(insumoId: string, insumos: InsumoOption[]) {
  const selectedInsumo = insumos.find((insumo) => insumo.id === insumoId);

  if (!selectedInsumo) {
    return unitOptions;
  }

  return unitOptions.filter((unit) => unit.baseUnit === selectedInsumo.unidadeBase);
}

export function ReceitaForm({ insumos, receita }: ReceitaFormProps) {
  const [state, formAction, isPending] = useActionState(saveReceita, initialState);
  const [items, setItems] = useState<ReceitaFormItem[]>(
    receita?.itens.length ? receita.itens : [createEmptyItem(insumos)],
  );

  const insumoById = useMemo(
    () => new Map(insumos.map((insumo) => [insumo.id, insumo])),
    [insumos],
  );

  function updateItem(id: string, changes: Partial<ReceitaFormItem>) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nextItem = {
          ...item,
          ...changes,
        };

        if (changes.insumoId) {
          const compatibleUnits = getCompatibleUnits(changes.insumoId, insumos);
          const stillCompatible = compatibleUnits.some(
            (unit) => unit.value === nextItem.unidade,
          );

          if (!stillCompatible) {
            nextItem.unidade = compatibleUnits[0]?.value ?? "";
          }
        }

        return nextItem;
      }),
    );
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, createEmptyItem(insumos)]);
  }

  function removeItem(id: string) {
    setItems((currentItems) =>
      currentItems.length === 1
        ? [createEmptyItem(insumos)]
        : currentItems.filter((item) => item.id !== id),
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="id" defaultValue={receita?.id} />

      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <CookingPot className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-stone-950">
            {receita ? "Editar receita" : "Nova receita"}
          </h2>
          <p className="text-sm text-stone-500">
            Escolha os ingredientes e informe quanto vai em uma receita.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Nome da receita</span>
          <input
            name="nome"
            defaultValue={receita?.nome}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Brigadeiro gourmet"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Quantas unidades rende</span>
          <input
            name="rendimento"
            type="number"
            step="1"
            min="1"
            defaultValue={receita?.rendimento}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="20"
            required
          />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-lg border border-stone-200 p-3">
        <input
          name="atualizarCustoAutomaticamente"
          type="checkbox"
          defaultChecked={receita?.atualizarCustoAutomaticamente ?? true}
          className="mt-1 size-4 rounded border-stone-300 text-brand-600 focus:ring-brand-600"
        />
        <span>
          <span className="block text-sm font-medium text-stone-800">
            Atualizar custo sozinho
          </span>
          <span className="block text-sm text-stone-500">
            Se o preço de um ingrediente mudar, esta receita será recalculada.
          </span>
        </span>
      </label>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-stone-900">Ingredientes usados</h3>
          <button
            type="button"
            onClick={addItem}
            disabled={insumos.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400"
          >
            <CirclePlus className="size-4" aria-hidden="true" />
            Adicionar ingrediente
          </button>
        </div>

        {insumos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
            Cadastre pelo menos um ingrediente antes de montar uma receita.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const compatibleUnits = getCompatibleUnits(item.insumoId, insumos);
              const selectedInsumo = insumoById.get(item.insumoId);

              return (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-stone-200 p-3 md:grid-cols-[1fr_120px_130px_auto]"
                >
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      Insumo
                    </span>
                    <select
                      name="insumoId"
                      value={item.insumoId}
                      onChange={(event) =>
                        updateItem(item.id, { insumoId: event.target.value })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      required
                    >
                      {insumos.map((insumo) => (
                        <option key={insumo.id} value={insumo.id}>
                          {insumo.nome}
                        </option>
                      ))}
                    </select>
                    {selectedInsumo ? (
                      <span className="text-xs text-stone-500">
                        Cada 1 {selectedInsumo.unidadeBase} custa R${" "}
                        {selectedInsumo.custoUnitarioBase}
                      </span>
                    ) : null}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      Quanto usa
                    </span>
                    <input
                      name="quantidade"
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={item.quantidade}
                      onChange={(event) =>
                        updateItem(item.id, { quantidade: event.target.value })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      placeholder="100"
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">Unidade</span>
                    <select
                      name="unidade"
                      value={item.unidade}
                      onChange={(event) =>
                        updateItem(item.id, { unidade: event.target.value })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      required
                    >
                      {compatibleUnits.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remover item ${index + 1}`}
                      className="inline-flex size-10 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          disabled={isPending || insumos.length === 0}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isPending
            ? "Salvando..."
            : receita
              ? "Salvar receita"
              : "Cadastrar receita"}
        </button>
      </div>
    </form>
  );
}
