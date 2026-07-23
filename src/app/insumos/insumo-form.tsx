"use client";

import { useActionState, useState } from "react";
import { PackagePlus } from "lucide-react";
import { saveInsumo, type InsumoFormState } from "@/app/insumos/actions";

export type MarcaOption = {
  id: string;
  nome: string;
};

type InsumoFormProps = {
  marcas: MarcaOption[];
  insumo?: {
    id: string;
    nome: string;
    marcaId: string;
    fotoUrl: string;
    categoria: string;
    conteudoEmbalagem: string;
    unidadeEmbalagem: string;
    estoqueAtual: string;
    estoqueMinimo: string;
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

const baseUnitByUnit: Record<string, string> = {
  kg: "g",
  g: "g",
  L: "ml",
  ml: "ml",
  duzia: "unidade",
  unidade: "unidade",
};

const inputClassName =
  "rounded-md border border-stone-300 px-3 py-2 text-sm outline-hidden transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

export function InsumoForm({ marcas, insumo }: InsumoFormProps) {
  const [state, formAction, isPending] = useActionState(saveInsumo, initialState);
  const [unidadeEmbalagem, setUnidadeEmbalagem] = useState(
    insumo?.unidadeEmbalagem ?? "g",
  );
  const [registrarCompra, setRegistrarCompra] = useState(true);
  const unidadeBase = baseUnitByUnit[unidadeEmbalagem] ?? "unidade";
  const isEdicao = Boolean(insumo);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-stone-200 bg-card p-5 shadow-soft"
    >
      <input type="hidden" name="id" defaultValue={insumo?.id} />

      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
          <PackagePlus className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-stone-950">
            {isEdicao ? "Corrigir ingrediente" : "Novo ingrediente"}
          </h2>
          <p className="text-sm text-stone-500">
            Cadastre o produto como ele é na prateleira. As compras entram
            separadas, com histórico.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Nome do ingrediente
          </span>
          <input
            name="nome"
            defaultValue={insumo?.nome}
            className={inputClassName}
            placeholder="Leite condensado"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Marca</span>
          <select
            name="marcaId"
            defaultValue={insumo?.marcaId ?? ""}
            className={inputClassName}
          >
            <option value="">Sem marca</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nome}
              </option>
            ))}
          </select>
          <span className="text-xs text-stone-500">
            Cadastre marcas com logo em Configurações.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Categoria</span>
          <input
            name="categoria"
            defaultValue={insumo?.categoria}
            className={inputClassName}
            placeholder="Secos, laticínios, embalagens..."
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 xl:col-span-3">
          <span className="text-sm font-medium text-stone-700">
            Foto do produto (URL)
          </span>
          <input
            name="fotoUrl"
            defaultValue={insumo?.fotoUrl}
            className={inputClassName}
            placeholder="https://... (opcional)"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Conteúdo da embalagem
          </span>
          <div className="grid grid-cols-[1fr_110px] gap-2">
            <input
              name="conteudoEmbalagem"
              type="number"
              step="0.001"
              min="0.001"
              defaultValue={insumo?.conteudoEmbalagem}
              className={inputClassName}
              placeholder="395"
              required
            />
            <select
              name="unidadeEmbalagem"
              value={unidadeEmbalagem}
              onChange={(event) => setUnidadeEmbalagem(event.target.value)}
              className={inputClassName}
            >
              {units.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-stone-500">
            Ex.: a caixinha de leite condensado tem 395 g.
          </span>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Avisar quando chegar em
          </span>
          <input
            name="estoqueMinimo"
            type="number"
            step="0.001"
            min="0"
            defaultValue={insumo?.estoqueMinimo}
            className={inputClassName}
            placeholder="Opcional"
          />
          <span className="text-xs text-stone-500">
            Estoque mínimo, em {unidadeBase}.
          </span>
        </label>

        {isEdicao ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-stone-700">
              Ajustar estoque atual
            </span>
            <input
              name="estoqueAtual"
              type="number"
              step="0.001"
              defaultValue={insumo?.estoqueAtual}
              className={inputClassName}
              placeholder="Opcional"
            />
            <span className="text-xs text-stone-500">
              Em {unidadeBase}. Use para acertar perdas e sobras.
            </span>
          </label>
        ) : null}
      </div>

      {!isEdicao ? (
        <div className="mt-4">
          <label className="flex items-start gap-3 rounded-lg border border-stone-200 p-3">
            <input
              name="registrarCompra"
              type="checkbox"
              checked={registrarCompra}
              onChange={(event) => setRegistrarCompra(event.target.checked)}
              className="mt-1 size-4 rounded-sm border-stone-300 text-brand-600 focus:ring-brand-600"
            />
            <span>
              <span className="block text-sm font-medium text-stone-700">
                Já comprei — registrar a primeira compra
              </span>
              <span className="block text-sm text-stone-500">
                Desmarque para cadastrar o produto sem compra. O custo fica
                zerado até a primeira compra.
              </span>
            </span>
          </label>

          {registrarCompra ? (
            <div className="mt-3 rounded-lg border border-dashed border-stone-300 p-3">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-stone-700">
                    Quantas embalagens
                  </span>
                  <input
                    name="compraEmbalagens"
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
                    name="compraPrecoTotal"
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
                  <input
                    name="compraData"
                    type="date"
                    className={inputClassName}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Ex.: 24 caixinhas por R$ 112,90. O custo por {unidadeBase} e o
                estoque saem daqui.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

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
          {isPending
            ? "Salvando..."
            : isEdicao
              ? "Salvar correções"
              : "Cadastrar ingrediente"}
        </button>
      </div>
    </form>
  );
}
