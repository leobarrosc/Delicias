"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cake,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  carregarClienteDetalhe,
  deactivateCliente,
} from "@/app/clientes/actions";
import {
  ClienteForm,
  type ClienteEditData,
} from "@/app/clientes/cliente-form";
import { Modal } from "@/components/modal";

export type AniversarianteItem = {
  id: string;
  nome: string;
  ocasiao: string;
  dataLabel: string;
  proximoLabel: string;
  idade: number | null;
  clienteNome: string;
  whatsappLink: string;
};

export type ClienteResumo = {
  id: string;
  nome: string;
  whatsapp: string | null;
  telefone: string | null;
  email: string | null;
  aniversariantesCount: number;
};

type ClienteDetalhe = Awaited<ReturnType<typeof carregarClienteDetalhe>>;

const CARTEIRA_PAGE_SIZE = 6;
const CLIENTES_PAGE_SIZE = 8;

const inputClassName =
  "w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-2 text-sm text-stone-500">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Anterior
      </button>
      <span>
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Próxima
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ClientesClient({
  aniversariantes,
  clientes,
}: {
  aniversariantes: AniversarianteItem[];
  clientes: ClienteResumo[];
}) {
  const router = useRouter();
  const [novoOpen, setNovoOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ClienteDetalhe>(null);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);

  const [buscaCarteira, setBuscaCarteira] = useState("");
  const [paginaCarteira, setPaginaCarteira] = useState(1);
  const [buscaClientes, setBuscaClientes] = useState("");
  const [paginaClientes, setPaginaClientes] = useState(1);

  const selecionado = clientes.find((cliente) => cliente.id === selectedId);

  const carteiraFiltrada = useMemo(() => {
    const termo = buscaCarteira.trim().toLowerCase();

    if (!termo) {
      return aniversariantes;
    }

    return aniversariantes.filter(
      (item) =>
        item.nome.toLowerCase().includes(termo) ||
        item.clienteNome.toLowerCase().includes(termo),
    );
  }, [aniversariantes, buscaCarteira]);

  const clientesFiltrados = useMemo(() => {
    const termo = buscaClientes.trim().toLowerCase();

    if (!termo) {
      return clientes;
    }

    return clientes.filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(termo) ||
        (cliente.whatsapp ?? "").toLowerCase().includes(termo),
    );
  }, [clientes, buscaClientes]);

  useEffect(() => {
    setPaginaCarteira(1);
  }, [buscaCarteira]);

  useEffect(() => {
    setPaginaClientes(1);
  }, [buscaClientes]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    let ativo = true;
    setLoading(true);
    setDetalhe(null);

    carregarClienteDetalhe(selectedId).then((data) => {
      if (!ativo) {
        return;
      }

      setDetalhe(data);
      setLoading(false);
    });

    return () => {
      ativo = false;
    };
  }, [selectedId]);

  const carteiraTotalPages = Math.max(
    1,
    Math.ceil(carteiraFiltrada.length / CARTEIRA_PAGE_SIZE),
  );
  const carteiraPagina = carteiraFiltrada.slice(
    (paginaCarteira - 1) * CARTEIRA_PAGE_SIZE,
    paginaCarteira * CARTEIRA_PAGE_SIZE,
  );
  const clientesTotalPages = Math.max(
    1,
    Math.ceil(clientesFiltrados.length / CLIENTES_PAGE_SIZE),
  );
  const clientesPagina = clientesFiltrados.slice(
    (paginaClientes - 1) * CLIENTES_PAGE_SIZE,
    paginaClientes * CLIENTES_PAGE_SIZE,
  );

  function closeDetail() {
    setSelectedId(null);
    setDetalhe(null);
    setEditando(false);
  }

  function afterSave() {
    setNovoOpen(false);
    closeDetail();
    router.refresh();
  }

  async function handleDesativar() {
    if (!selectedId || !selecionado) {
      return;
    }

    if (
      !window.confirm(
        `Desativar ${selecionado.nome}? Ele não aparecerá em novos pedidos.`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("id", selectedId);
    await deactivateCliente(formData);
    afterSave();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-stone-700">Clientes</h2>
          <p className="text-sm text-stone-500">
            Compradores, aniversariantes e oportunidades de venda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNovoOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Novo cliente
        </button>
      </div>

      <section className="border border-stone-200 bg-card p-4 shadow-sm md:p-5">
        <div className="mb-3 flex flex-col gap-3 border-b-2 border-stone-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium text-stone-700">
            <Cake className="size-5 text-brand-500" aria-hidden="true" />
            Carteira de aniversariantes
          </h2>
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              value={buscaCarteira}
              onChange={(event) => setBuscaCarteira(event.target.value)}
              className={inputClassName}
              placeholder="Buscar por nome ou cliente"
            />
          </div>
        </div>

        {carteiraPagina.length === 0 ? (
          <p className="py-4 text-sm text-stone-500">
            Nenhum aniversariante encontrado.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {carteiraPagina.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-stone-950">
                      {item.nome}
                    </p>
                    {item.ocasiao !== "Aniversário" ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-500">
                        {item.ocasiao}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {item.dataLabel} · Próximo: {item.proximoLabel}
                    {item.idade ? ` (${item.idade} anos)` : ""} ·{" "}
                    {item.clienteNome}
                  </p>
                </div>
                {item.whatsappLink ? (
                  <a
                    href={item.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Mensagem
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-stone-400">
                    Sem WhatsApp
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={paginaCarteira}
          totalPages={carteiraTotalPages}
          onChange={setPaginaCarteira}
        />
      </section>

      <section className="border border-stone-200 bg-card p-4 shadow-sm md:p-5">
        <div className="mb-3 flex flex-col gap-3 border-b-2 border-stone-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-stone-700">
            Clientes cadastrados
          </h2>
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              value={buscaClientes}
              onChange={(event) => setBuscaClientes(event.target.value)}
              className={inputClassName}
              placeholder="Buscar cliente"
            />
          </div>
        </div>

        {clientesPagina.length === 0 ? (
          <p className="py-4 text-sm text-stone-500">
            Nenhum cliente encontrado.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {clientesPagina.map((cliente) => (
              <li key={cliente.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(cliente.id)}
                  className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-stone-100/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                    <UserRound className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-950">
                      {cliente.nome}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {cliente.whatsapp || cliente.telefone || "Sem contato"}
                      {cliente.aniversariantesCount > 0
                        ? ` · ${cliente.aniversariantesCount} aniversariante${
                            cliente.aniversariantesCount === 1 ? "" : "s"
                          }`
                        : ""}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-stone-400"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={paginaClientes}
          totalPages={clientesTotalPages}
          onChange={setPaginaClientes}
        />
      </section>

      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} label="Novo cliente">
        <ClienteForm onSaved={afterSave} />
      </Modal>

      <Modal
        open={selectedId !== null}
        onClose={closeDetail}
        label={selecionado ? `Cliente ${selecionado.nome}` : "Cliente"}
      >
        <div className="rounded-lg border border-stone-200 bg-card p-5 shadow-sm">
          {loading || !detalhe ? (
            <div className="flex items-center gap-3 py-6 text-sm text-stone-500">
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
              Carregando cliente...
            </div>
          ) : editando ? (
            <ClienteForm
              cliente={detalhe as ClienteEditData}
              onSaved={afterSave}
            />
          ) : (
            <div>
              <div className="flex items-start gap-3 pr-10">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                  <UserRound className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-stone-950">
                    {detalhe.nome}
                  </h2>
                  <p className="text-sm text-stone-500">
                    {detalhe.totalPedidos} pedido
                    {detalhe.totalPedidos === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-stone-500">WhatsApp</dt>
                  <dd className="font-medium text-stone-900">
                    {detalhe.whatsapp || "Não informado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">Telefone</dt>
                  <dd className="font-medium text-stone-900">
                    {detalhe.telefone || "Não informado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">E-mail</dt>
                  <dd className="break-words font-medium text-stone-900">
                    {detalhe.email || "Não informado"}
                  </dd>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-brand-500"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-stone-500">Endereço</dt>
                    <dd className="font-medium text-stone-900">
                      {detalhe.endereco || "Não informado"}
                    </dd>
                  </div>
                </div>
              </dl>

              {detalhe.observacoes ? (
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
                  {detalhe.observacoes}
                </p>
              ) : null}

              <div className="mt-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-900">
                  <Cake className="size-4 text-brand-500" aria-hidden="true" />
                  Aniversariantes vinculados
                </h3>
                {detalhe.aniversariantes.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    Nenhum aniversariante vinculado.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {detalhe.aniversariantes.map((aniversariante) => (
                      <li
                        key={aniversariante.id}
                        className="rounded-md bg-stone-50 p-2.5 text-sm"
                      >
                        <p className="font-medium text-stone-900">
                          {aniversariante.nome}
                        </p>
                        <p className="text-xs text-stone-500">
                          {aniversariante.ocasiao}:{" "}
                          {aniversariante.dia.padStart(2, "0")}/
                          {aniversariante.mes.padStart(2, "0")}
                          {aniversariante.ano ? `/${aniversariante.ano}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar cliente
                </button>
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
