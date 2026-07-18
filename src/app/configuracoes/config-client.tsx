"use client";

import { useActionState } from "react";
import { Plus, Save } from "lucide-react";
import {
  criarCategoriaReceita,
  criarMarca,
  salvarConfiguracao,
  type ConfigFormState,
} from "@/app/configuracoes/actions";

const initialState: ConfigFormState = {};

const inputClassName =
  "rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

type ConfiguracaoGeralFormProps = {
  fretePadrao: string;
  mensagemAniversario: string;
  mensagemPedido: string;
};

export function ConfiguracaoGeralForm({
  fretePadrao,
  mensagemAniversario,
  mensagemPedido,
}: ConfiguracaoGeralFormProps) {
  const [state, formAction, isPending] = useActionState(
    salvarConfiguracao,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="flex max-w-xs flex-col gap-1.5">
        <span className="text-sm font-medium text-stone-700">
          Frete padrão (R$)
        </span>
        <input
          name="fretePadrao"
          type="number"
          step="0.01"
          min="0"
          defaultValue={fretePadrao}
          className={inputClassName}
        />
        <span className="text-xs text-stone-500">
          Já vem preenchido no pedido; pode zerar quando for retirada no local.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-stone-700">
          Mensagem de aniversário (WhatsApp)
        </span>
        <textarea
          name="mensagemAniversario"
          rows={3}
          defaultValue={mensagemAniversario}
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-stone-700">
          Mensagem de pedido (WhatsApp)
        </span>
        <textarea
          name="mensagemPedido"
          rows={3}
          defaultValue={mensagemPedido}
          className={inputClassName}
        />
      </label>

      <p className="rounded-md bg-stone-100 px-3 py-2 text-xs text-stone-500">
        Você pode usar os atalhos{" "}
        <code className="text-brand-500">{"{cliente}"}</code>,{" "}
        <code className="text-brand-500">{"{aniversariante}"}</code> e{" "}
        <code className="text-brand-500">{"{ocasiao}"}</code> — eles são
        trocados pelos nomes reais na hora de enviar.
      </p>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        <Save className="size-4" aria-hidden="true" />
        {isPending ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}

export function CategoriaAddForm() {
  const [state, formAction, isPending] = useActionState(
    criarCategoriaReceita,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="nome"
          className={`${inputClassName} flex-1`}
          placeholder="Ex.: Bolos, Doces, Salgados"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar
        </button>
      </div>
      {state.error ? (
        <p className="text-xs text-red-700">{state.error}</p>
      ) : null}
    </form>
  );
}

export function MarcaAddForm() {
  const [state, formAction, isPending] = useActionState(criarMarca, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          name="nome"
          className={inputClassName}
          placeholder="Nome da marca (Italac)"
          required
        />
        <input
          name="logoUrl"
          className={inputClassName}
          placeholder="URL da logo (opcional)"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar
        </button>
      </div>
      {state.error ? (
        <p className="text-xs text-red-700">{state.error}</p>
      ) : null}
    </form>
  );
}
