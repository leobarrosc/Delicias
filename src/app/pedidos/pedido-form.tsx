"use client";

import { useActionState, useMemo, useState } from "react";
import { CirclePlus, ClipboardPlus, Trash2 } from "lucide-react";
import { savePedido, type PedidoFormState } from "@/app/pedidos/actions";
import { MES_OPTIONS, OCASIAO_OPTIONS } from "@/lib/birthdays";

export type ClienteOption = {
  id: string;
  nome: string;
  aniversariantes: {
    id: string;
    nome: string;
  }[];
};

export type ReceitaOption = {
  id: string;
  nome: string;
  custoPorUnidade: number;
};

export type PedidoEditData = {
  id: string;
  clienteId: string;
  aniversarianteId: string;
  status: string;
  dataEntrega: string;
  multiplicadorLucro: string;
  observacoes: string;
  itens: {
    receitaId: string;
    quantidade: string;
    precoFinalUnitario: string;
    manualPrice: boolean;
  }[];
};

type PedidoFormProps = {
  clientes: ClienteOption[];
  receitas: ReceitaOption[];
  permitirNovoCliente?: boolean;
  pedido?: PedidoEditData;
};

const NOVO_CLIENTE_ID = "__novo__";
const NOVO_ANIVERSARIANTE_ID = "__novo__";

type PedidoItemForm = {
  id: string;
  receitaId: string;
  quantidade: string;
  precoFinalUnitario: string;
  manualPrice: boolean;
};

const initialState: PedidoFormState = {};

function createEmptyItem(receitas: ReceitaOption[]): PedidoItemForm {
  return {
    id: crypto.randomUUID(),
    receitaId: receitas[0]?.id ?? "",
    quantidade: "1",
    precoFinalUnitario: "",
    manualPrice: false,
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateSuggestedPrice(cost: number, multiplier: number) {
  return roundMoney(cost * Math.max(multiplier || 2, 2));
}

export function PedidoForm({
  clientes,
  receitas,
  permitirNovoCliente = false,
  pedido,
}: PedidoFormProps) {
  const [state, formAction, isPending] = useActionState(savePedido, initialState);
  const [clienteId, setClienteId] = useState(
    pedido?.clienteId ??
      clientes[0]?.id ??
      (permitirNovoCliente ? NOVO_CLIENTE_ID : ""),
  );
  const [aniversarianteId, setAniversarianteId] = useState(
    pedido?.aniversarianteId ?? "",
  );
  const [dataEntrega, setDataEntrega] = useState(pedido?.dataEntrega ?? "");
  const [novoAniversarianteDia, setNovoAniversarianteDia] = useState("");
  const [novoAniversarianteMes, setNovoAniversarianteMes] = useState("");
  const [multiplier, setMultiplier] = useState(
    pedido?.multiplicadorLucro ?? "2",
  );
  const [items, setItems] = useState<PedidoItemForm[]>(
    pedido?.itens.length
      ? pedido.itens.map((item) => ({
          id: crypto.randomUUID(),
          receitaId: item.receitaId,
          quantidade: item.quantidade,
          precoFinalUnitario: item.precoFinalUnitario,
          manualPrice: item.manualPrice,
        }))
      : [createEmptyItem(receitas)],
  );

  const receitaById = useMemo(
    () => new Map(receitas.map((receita) => [receita.id, receita])),
    [receitas],
  );
  const isNovoCliente = permitirNovoCliente && clienteId === NOVO_CLIENTE_ID;
  const isNovoAniversariante = aniversarianteId === NOVO_ANIVERSARIANTE_ID;
  const semClientes = clientes.length === 0 && !permitirNovoCliente;
  const selectedCliente = clientes.find((cliente) => cliente.id === clienteId);
  const numericMultiplier = Math.max(Number(multiplier) || 2, 2);

  function handleAniversarianteChange(value: string) {
    setAniversarianteId(value);

    // A data de entrega é só um ponto de partida: a festa pode ser no sábado
    // e o aniversário cair em outro dia, então os campos ficam editáveis.
    if (value === NOVO_ANIVERSARIANTE_ID && dataEntrega) {
      const [, mesEntrega, diaEntrega] = dataEntrega.split("-");

      setNovoAniversarianteDia((current) =>
        current || (diaEntrega ? String(Number(diaEntrega)) : ""),
      );
      setNovoAniversarianteMes((current) =>
        current || (mesEntrega ? String(Number(mesEntrega)) : ""),
      );
    }
  }

  const totals = items.reduce(
    (accumulator, item) => {
      const receita = receitaById.get(item.receitaId);
      const quantity = Number(item.quantidade) || 0;
      const unitCost = receita?.custoPorUnidade ?? 0;
      const suggestedUnitPrice = calculateSuggestedPrice(
        unitCost,
        numericMultiplier,
      );
      const finalUnitPrice = item.manualPrice
        ? Number(item.precoFinalUnitario) || 0
        : suggestedUnitPrice;

      return {
        cost: roundMoney(accumulator.cost + unitCost * quantity),
        suggested: roundMoney(accumulator.suggested + suggestedUnitPrice * quantity),
        final: roundMoney(accumulator.final + finalUnitPrice * quantity),
      };
    },
    { cost: 0, suggested: 0, final: 0 },
  );
  const estimatedProfit = roundMoney(totals.final - totals.cost);

  function updateItem(id: string, changes: Partial<PedidoItemForm>) {
    setItems((currentItems) =>
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

  function addItem() {
    setItems((currentItems) => [...currentItems, createEmptyItem(receitas)]);
  }

  function removeItem(id: string) {
    setItems((currentItems) =>
      currentItems.length === 1
        ? [createEmptyItem(receitas)]
        : currentItems.filter((item) => item.id !== id),
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="id" defaultValue={pedido?.id} />

      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <ClipboardPlus className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-stone-950">
            {pedido ? "Editar pedido" : "Novo pedido"}
          </h2>
          <p className="text-sm text-stone-500">
            {pedido
              ? "Ao salvar, os valores serão recalculados com os custos atuais das receitas."
              : "Monte o pedido. Os valores ficam guardados mesmo se a receita mudar depois."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Cliente</span>
          <select
            name="clienteId"
            value={clienteId}
            onChange={(event) => {
              setClienteId(event.target.value);
              setAniversarianteId("");
            }}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            required
          >
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
            {permitirNovoCliente ? (
              <option value={NOVO_CLIENTE_ID}>+ Cadastrar novo cliente</option>
            ) : null}
          </select>
        </label>

        {isNovoCliente ? (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">
                Nome do novo cliente
              </span>
              <input
                name="novoClienteNome"
                className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Maria Souza"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">
                WhatsApp do novo cliente
              </span>
              <input
                name="novoClienteWhatsapp"
                className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="(11) 99999-9999 (opcional)"
              />
            </label>
          </>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Para quem é a festa?
          </span>
          <select
            name="aniversarianteId"
            value={aniversarianteId}
            onChange={(event) => handleAniversarianteChange(event.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Não informado</option>
            {!isNovoCliente
              ? selectedCliente?.aniversariantes.map((aniversariante) => (
                  <option key={aniversariante.id} value={aniversariante.id}>
                    {aniversariante.nome}
                  </option>
                ))
              : null}
            <option value={NOVO_ANIVERSARIANTE_ID}>
              + Cadastrar novo aniversariante
            </option>
          </select>
        </label>

        {isNovoAniversariante ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-3 md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-stone-700">
                  Nome do aniversariante
                </span>
                <input
                  name="novoAniversarianteNome"
                  className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  placeholder="Sofia"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-stone-700">
                  Ocasião
                </span>
                <select
                  name="novoAniversarianteOcasiao"
                  defaultValue="Aniversário"
                  className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                >
                  {OCASIAO_OPTIONS.map((ocasiao) => (
                    <option key={ocasiao} value={ocasiao}>
                      {ocasiao}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-stone-700">Dia</span>
                  <input
                    name="novoAniversarianteDia"
                    type="number"
                    min="1"
                    max="31"
                    value={novoAniversarianteDia}
                    onChange={(event) =>
                      setNovoAniversarianteDia(event.target.value)
                    }
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    placeholder="14"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-stone-700">Mês</span>
                  <select
                    name="novoAniversarianteMes"
                    value={novoAniversarianteMes}
                    onChange={(event) =>
                      setNovoAniversarianteMes(event.target.value)
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
                  <span className="text-sm font-medium text-stone-700">Ano</span>
                  <input
                    name="novoAniversarianteAno"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    placeholder="Opcional"
                  />
                </label>
              </div>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Preenchemos com a data de entrega como sugestão, mas confirme: a
              festa pode ser no sábado e o aniversário cair em outro dia.
            </p>
          </div>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Status</span>
          <select
            name="status"
            defaultValue={pedido?.status ?? "EM_ORCAMENTO"}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          >
            <option value="EM_ORCAMENTO">Ainda é orçamento</option>
            <option value="PRODUCAO">Começar produção</option>
            <option value="CONCLUIDO">Pedido entregue</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">Data de entrega</span>
          <input
            name="dataEntrega"
            type="date"
            value={dataEntrega}
            onChange={(event) => setDataEntrega(event.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Quanto cobrar sobre o custo
          </span>
          <input
            name="multiplicadorLucro"
            type="number"
            step="0.01"
            min="2"
            value={multiplier}
            onChange={(event) => setMultiplier(event.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            required
          />
          <span className="text-xs text-stone-500">
            Mínimo 2x. Exemplo: custo R$ 50 vira preço sugerido de R$ 100.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-sm font-medium text-stone-700">Observações</span>
          <textarea
            name="observacoes"
            rows={3}
            defaultValue={pedido?.observacoes}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Tema, entrega, detalhes combinados..."
          />
        </label>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-stone-900">O que vai no pedido</h3>
          <button
            type="button"
            onClick={addItem}
            disabled={receitas.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400"
          >
            <CirclePlus className="size-4" aria-hidden="true" />
            Adicionar receita
          </button>
        </div>

        {semClientes || receitas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
            {receitas.length === 0
              ? "Para criar um pedido, cadastre primeiro uma receita."
              : "Para criar um pedido, cadastre primeiro um cliente e uma receita."}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const receita = receitaById.get(item.receitaId);
              const quantity = Number(item.quantidade) || 0;
              const unitCost = receita?.custoPorUnidade ?? 0;
              const suggestedUnitPrice = calculateSuggestedPrice(
                unitCost,
                numericMultiplier,
              );
              const finalUnitPrice = item.manualPrice
                ? Number(item.precoFinalUnitario) || 0
                : suggestedUnitPrice;

              return (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-stone-200 p-3 md:grid-cols-[1fr_110px_150px_auto]"
                >
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      Receita
                    </span>
                    <select
                      name="receitaId"
                      value={item.receitaId}
                      onChange={(event) =>
                        updateItem(item.id, { receitaId: event.target.value })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      required
                    >
                      {receitas.map((receitaOption) => (
                        <option key={receitaOption.id} value={receitaOption.id}>
                          {receitaOption.nome}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-stone-500">
                      Custo: {formatMoney(unitCost)} - Sugerido:{" "}
                      {formatMoney(suggestedUnitPrice)}
                    </span>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      Quantidade
                    </span>
                    <input
                      name="quantidade"
                      type="number"
                      step="1"
                      min="1"
                      value={item.quantidade}
                      onChange={(event) =>
                        updateItem(item.id, { quantidade: event.target.value })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-stone-700">
                      Preço final de cada um
                    </span>
                    <input
                      name="precoFinalUnitario"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={
                        item.manualPrice
                          ? item.precoFinalUnitario
                          : suggestedUnitPrice.toFixed(2)
                      }
                      onChange={(event) =>
                        updateItem(item.id, {
                          precoFinalUnitario: event.target.value,
                          manualPrice: true,
                        })
                      }
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    />
                    <span className="text-xs text-stone-500">
                      Total: {formatMoney(finalUnitPrice * quantity)}
                    </span>
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

      <dl className="mt-5 grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-stone-500">Custo para produzir</dt>
          <dd className="font-semibold text-stone-950">
            {formatMoney(totals.cost)}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Preço sugerido</dt>
          <dd className="font-semibold text-stone-950">
            {formatMoney(totals.suggested)}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Preço final</dt>
          <dd className="font-semibold text-stone-950">
            {formatMoney(totals.final)}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Lucro estimado</dt>
          <dd className="font-semibold text-stone-950">
            {formatMoney(estimatedProfit)}
          </dd>
        </div>
      </dl>

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
          disabled={isPending || semClientes || receitas.length === 0}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isPending
            ? "Salvando..."
            : pedido
              ? "Salvar alterações"
              : "Salvar pedido"}
        </button>
      </div>
    </form>
  );
}
