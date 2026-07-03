"use client";

import { useActionState, useState } from "react";
import { Cake, CirclePlus, Trash2, UserPlus } from "lucide-react";
import { saveCliente, type ClienteFormState } from "@/app/clientes/actions";
import { MES_OPTIONS, OCASIAO_OPTIONS } from "@/lib/birthdays";

type AniversarianteFormItem = {
  id: string;
  nome: string;
  dia: string;
  mes: string;
  ano: string;
  ocasiao: string;
  observacoes: string;
};

type ClienteFormProps = {
  cliente?: {
    id: string;
    nome: string;
    telefone: string;
    whatsapp: string;
    email: string;
    dataNascimento: string;
    endereco: string;
    observacoes: string;
    aniversariantes: AniversarianteFormItem[];
  };
};

const initialState: ClienteFormState = {};

function createEmptyAniversariante(): AniversarianteFormItem {
  return {
    id: crypto.randomUUID(),
    nome: "",
    dia: "",
    mes: "",
    ano: "",
    ocasiao: "Aniversário",
    observacoes: "",
  };
}

export function ClienteForm({ cliente }: ClienteFormProps) {
  const [state, formAction, isPending] = useActionState(saveCliente, initialState);
  const [aniversariantes, setAniversariantes] = useState<
    AniversarianteFormItem[]
  >(cliente?.aniversariantes.length ? cliente.aniversariantes : []);

  function addAniversariante() {
    setAniversariantes((currentItems) => [
      ...currentItems,
      createEmptyAniversariante(),
    ]);
  }

  function updateAniversariante(
    id: string,
    changes: Partial<AniversarianteFormItem>,
  ) {
    setAniversariantes((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
            }
          : item,
      ),
    );
  }

  function removeAniversariante(id: string) {
    setAniversariantes((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="id" defaultValue={cliente?.id} />

      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <UserPlus className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-stone-950">
            {cliente ? "Editar cliente" : "Novo cliente"}
          </h2>
          <p className="text-sm text-stone-500">
            Cadastre o comprador e os aniversariantes ligados a ele.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-sm font-medium text-stone-700">Nome</span>
          <input
            name="nome"
            defaultValue={cliente?.nome}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Maria Souza"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">WhatsApp</span>
          <input
            name="whatsapp"
            defaultValue={cliente?.whatsapp}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="(11) 99999-9999"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Telefone</span>
          <input
            name="telefone"
            defaultValue={cliente?.telefone}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Opcional"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">E-mail</span>
          <input
            name="email"
            type="email"
            defaultValue={cliente?.email}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="maria@email.com"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Aniversário do cliente
          </span>
          <input
            name="dataNascimento"
            type="date"
            defaultValue={cliente?.dataNascimento}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-sm font-medium text-stone-700">Endereço</span>
          <input
            name="endereco"
            defaultValue={cliente?.endereco}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Rua, número, bairro, cidade"
          />
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-sm font-medium text-stone-700">Observações</span>
          <textarea
            name="observacoes"
            defaultValue={cliente?.observacoes}
            rows={3}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Preferências, restrições, referências de entrega..."
          />
        </label>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cake className="size-4 text-brand-700" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-stone-900">
              Aniversariantes vinculados
            </h3>
          </div>
          <button
            type="button"
            onClick={addAniversariante}
            className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            <CirclePlus className="size-4" aria-hidden="true" />
            Adicionar
          </button>
        </div>

        {aniversariantes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
            Nenhum aniversariante vinculado a este cliente.
          </div>
        ) : (
          <div className="space-y-3">
            {aniversariantes.map((aniversariante, index) => (
              <div
                key={aniversariante.id}
                className="grid gap-3 rounded-lg border border-stone-200 p-3 md:grid-cols-[1fr_180px_auto]"
              >
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-stone-700">
                    Nome
                  </span>
                  <input
                    name="aniversarianteNome"
                    value={aniversariante.nome}
                    onChange={(event) =>
                      updateAniversariante(aniversariante.id, {
                        nome: event.target.value,
                      })
                    }
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    placeholder="João"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-stone-700">
                    Ocasião
                  </span>
                  <select
                    name="aniversarianteOcasiao"
                    value={aniversariante.ocasiao}
                    onChange={(event) =>
                      updateAniversariante(aniversariante.id, {
                        ocasiao: event.target.value,
                      })
                    }
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  >
                    {OCASIAO_OPTIONS.map((ocasiao) => (
                      <option key={ocasiao} value={ocasiao}>
                        {ocasiao}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeAniversariante(aniversariante.id)}
                    aria-label={`Remover aniversariante ${index + 1}`}
                    className="inline-flex size-10 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 md:col-span-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      Dia
                    </span>
                    <input
                      name="aniversarianteDia"
                      type="number"
                      min="1"
                      max="31"
                      value={aniversariante.dia}
                      onChange={(event) =>
                        updateAniversariante(aniversariante.id, {
                          dia: event.target.value,
                        })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      placeholder="14"
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      Mês
                    </span>
                    <select
                      name="aniversarianteMes"
                      value={aniversariante.mes}
                      onChange={(event) =>
                        updateAniversariante(aniversariante.id, {
                          mes: event.target.value,
                        })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      required
                    >
                      <option value="">Escolha o mês</option>
                      {MES_OPTIONS.map((mes) => (
                        <option key={mes.value} value={mes.value}>
                          {mes.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      Ano
                    </span>
                    <input
                      name="aniversarianteAno"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={aniversariante.ano}
                      onChange={(event) =>
                        updateAniversariante(aniversariante.id, {
                          ano: event.target.value,
                        })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      placeholder="Opcional"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5 md:col-span-3">
                  <span className="text-sm font-medium text-stone-700">
                    Observações
                  </span>
                  <input
                    name="aniversarianteObservacoes"
                    value={aniversariante.observacoes}
                    onChange={(event) =>
                      updateAniversariante(aniversariante.id, {
                        observacoes: event.target.value,
                      })
                    }
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    placeholder="Tema preferido, alergias, tamanho da festa..."
                  />
                </label>
              </div>
            ))}
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
          disabled={isPending}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isPending
            ? "Salvando..."
            : cliente
              ? "Salvar alterações"
              : "Cadastrar cliente"}
        </button>
      </div>
    </form>
  );
}
