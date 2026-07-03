"use client";

import { useState } from "react";
import {
  CakeSlice,
  CalendarDays,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  deletePedido,
  updatePedidoStatus,
} from "@/app/pedidos/actions";
import {
  PedidoForm,
  type ClienteOption,
  type PedidoEditData,
  type ReceitaOption,
} from "@/app/pedidos/pedido-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Modal } from "@/components/modal";

const statusLabels = {
  EM_ORCAMENTO: "Em orçamento",
  PRODUCAO: "Produção",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
} as const;

type PedidoStatusValue = keyof typeof statusLabels;

const statusChipTones: Record<string, string> = {
  EM_ORCAMENTO: "bg-amber-50 text-amber-700",
  PRODUCAO: "bg-sky-50 text-sky-700",
};

const statusAccentBorders: Record<string, string> = {
  EM_ORCAMENTO: "border-l-amber-400",
  PRODUCAO: "border-l-sky-400",
};

const statusChangeMessages: Record<string, string> = {
  PRODUCAO:
    "Ao mover para produção, o sistema vai baixar os ingredientes do estoque. Se faltar estoque, ele pode ficar negativo. Deseja continuar?",
  CANCELADO:
    "Tem certeza que deseja cancelar este pedido? Se o estoque já foi baixado, use depois o botão de devolver estoque.",
};

export type PedidoAndamento = {
  id: string;
  clienteNome: string;
  aniversarianteNome: string | null;
  status: PedidoStatusValue;
  dataEntregaLabel: string;
  entregaBadge: { label: string; tone: string } | null;
  custoTotal: number;
  precoTotal: number;
  lucroEstimado: number;
  estoqueBaixado: boolean;
  observacoes: string | null;
  itens: { id: string; descricao: string; quantidade: number }[];
  edicao: PedidoEditData;
};

type PedidoAndamentoCardProps = {
  pedido: PedidoAndamento;
  clientes: ClienteOption[];
  receitas: ReceitaOption[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function PedidoAndamentoCard({
  pedido,
  clientes,
  receitas,
}: PedidoAndamentoCardProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const chipTone = statusChipTones[pedido.status] ?? "bg-stone-100 text-stone-600";
  const accentBorder = statusAccentBorders[pedido.status] ?? "border-l-stone-300";
  const otherStatuses = (
    Object.keys(statusLabels) as PedidoStatusValue[]
  ).filter((status) => status !== pedido.status);

  function closeDialog() {
    setOpen(false);
    setEditing(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group flex flex-col rounded-xl border border-l-4 border-stone-200 ${accentBorder} bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600`}
      >
        <div className="flex w-full items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-stone-950">
            {pedido.clienteNome}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${chipTone}`}
          >
            {statusLabels[pedido.status]}
          </span>
        </div>

        {pedido.aniversarianteNome ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
            <CakeSlice className="size-3.5 text-brand-700" aria-hidden="true" />
            Festa de {pedido.aniversarianteNome}
          </p>
        ) : null}

        <ul className="mt-3 space-y-1 text-sm text-stone-700">
          {pedido.itens.map((item) => (
            <li key={item.id}>
              {item.quantidade}x {item.descricao}
            </li>
          ))}
          {pedido.itens.length === 0 ? (
            <li className="text-stone-500">Pedido sem receitas</li>
          ) : null}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-brand-700" aria-hidden="true" />
            Entrega: {pedido.dataEntregaLabel}
          </span>
          {pedido.entregaBadge ? (
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${pedido.entregaBadge.tone}`}
            >
              {pedido.entregaBadge.label}
            </span>
          ) : null}
        </div>

        <dl className="mt-4 grid w-full grid-cols-3 gap-2 rounded-lg bg-stone-50 p-3 text-xs">
          <div>
            <dt className="text-stone-500">Custo</dt>
            <dd className="font-semibold text-stone-950">
              {formatMoney(pedido.custoTotal)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Preço final</dt>
            <dd className="font-semibold text-stone-950">
              {formatMoney(pedido.precoTotal)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Lucro</dt>
            <dd className="font-semibold text-emerald-700">
              {formatMoney(pedido.lucroEstimado)}
            </dd>
          </div>
        </dl>

        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 opacity-0 transition group-hover:opacity-100">
          Ver detalhes e ações
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      </button>

      <Modal
        open={open}
        onClose={closeDialog}
        label={`Pedido de ${pedido.clienteNome}`}
      >
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3 pr-10">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-stone-950">
                {pedido.clienteNome}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${chipTone}`}
                >
                  {statusLabels[pedido.status]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    className="size-4 text-brand-700"
                    aria-hidden="true"
                  />
                  Entrega: {pedido.dataEntregaLabel}
                </span>
                {pedido.entregaBadge ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${pedido.entregaBadge.tone}`}
                  >
                    {pedido.entregaBadge.label}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {pedido.aniversarianteNome ? (
            <p className="mb-3 flex items-center gap-1.5 text-sm text-stone-600">
              <CakeSlice className="size-4 text-brand-700" aria-hidden="true" />
              Festa de {pedido.aniversarianteNome}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-stone-200 p-3">
              <h3 className="mb-2 text-sm font-semibold text-stone-900">
                O que vai no pedido
              </h3>
              <ul className="space-y-1 text-sm text-stone-700">
                {pedido.itens.map((item) => (
                  <li key={item.id}>
                    {item.quantidade}x {item.descricao}
                  </li>
                ))}
                {pedido.itens.length === 0 ? (
                  <li className="text-stone-500">Pedido sem receitas</li>
                ) : null}
              </ul>
            </div>

            <dl className="grid grid-cols-3 gap-2 rounded-lg bg-stone-50 p-3 text-sm">
              <div>
                <dt className="text-xs text-stone-500">Custo</dt>
                <dd className="font-semibold text-stone-950">
                  {formatMoney(pedido.custoTotal)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Preço final</dt>
                <dd className="font-semibold text-stone-950">
                  {formatMoney(pedido.precoTotal)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Lucro</dt>
                <dd className="font-semibold text-emerald-700">
                  {formatMoney(pedido.lucroEstimado)}
                </dd>
              </div>
              <div className="col-span-3">
                <dt className="text-xs text-stone-500">Estoque</dt>
                <dd className="font-medium text-stone-900">
                  {pedido.estoqueBaixado ? "Baixado" : "Pendente"}
                </dd>
              </div>
            </dl>
          </div>

          {pedido.observacoes ? (
            <div className="mt-4 rounded-lg border border-stone-200 p-3">
              <h3 className="mb-1 text-sm font-semibold text-stone-900">
                Observações
              </h3>
              <p className="whitespace-pre-wrap text-sm text-stone-600">
                {pedido.observacoes}
              </p>
            </div>
          ) : null}

          <div className="mt-5 border-t border-stone-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">
              Mudar status
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherStatuses.map((status) => (
                <form key={status} action={updatePedidoStatus}>
                  <input type="hidden" name="id" value={pedido.id} />
                  <input type="hidden" name="status" value={status} />
                  <ConfirmSubmitButton
                    message={
                      statusChangeMessages[status] ??
                      `Mover este pedido para ${statusLabels[status]}?`
                    }
                    className="rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    {statusLabels[status]}
                  </ConfirmSubmitButton>
                </form>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={() => setEditing((current) => !current)}
              className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              <Pencil className="size-4" aria-hidden="true" />
              {editing ? "Fechar edição" : "Editar pedido"}
            </button>

            <form action={deletePedido}>
              <input type="hidden" name="id" value={pedido.id} />
              <ConfirmSubmitButton
                message={`Tem certeza que deseja excluir o pedido de ${pedido.clienteNome}? Essa ação não pode ser desfeita. Se o estoque foi baixado, ele será devolvido automaticamente.`}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Excluir pedido
              </ConfirmSubmitButton>
            </form>
          </div>

          {editing ? (
            <div className="mt-4">
              <PedidoForm
                clientes={clientes}
                receitas={receitas}
                pedido={pedido.edicao}
              />
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
