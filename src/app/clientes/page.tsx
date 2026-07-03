import {
  Cake,
  ExternalLink,
  MapPin,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { deactivateCliente } from "@/app/clientes/actions";
import { ClienteForm } from "@/app/clientes/cliente-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  formatDiaMes,
  getIdadeNaProximaOcorrencia,
  getNextOccurrence,
} from "@/lib/birthdays";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatDateInput(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

function formatOptional(value: string | null) {
  return value || "Não informado";
}

function normalizeWhatsApp(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

function createWhatsAppLink({
  whatsapp,
  aniversarianteNome,
  ocasiao,
}: {
  whatsapp: string | null;
  aniversarianteNome: string;
  ocasiao: string;
}) {
  const phone = normalizeWhatsApp(whatsapp);

  if (!phone) {
    return "";
  }

  const dataLabel =
    ocasiao === "Aniversário"
      ? `o aniversário de ${aniversarianteNome}`
      : `a data especial de ${aniversarianteNome} (${ocasiao.toLowerCase()})`;
  const message = `Olá, tudo bem? Vi aqui que ${dataLabel} está chegando e queria te mostrar algumas opções de doces/bolos para a data.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

export default async function ClientesPage() {
  const userId = await getCurrentUserId();
  const clientes = await prisma.cliente.findMany({
    where: {
      userId,
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
    include: {
      aniversariantes: {
        orderBy: {
          nome: "asc",
        },
      },
    },
  });
  const today = new Date();
  const aniversariantes = clientes
    .flatMap((cliente) =>
      cliente.aniversariantes.map((aniversariante) => ({
        id: aniversariante.id,
        nome: aniversariante.nome,
        dia: aniversariante.dia,
        mes: aniversariante.mes,
        ano: aniversariante.ano,
        ocasiao: aniversariante.ocasiao,
        proximoAniversario: getNextOccurrence(
          aniversariante.dia,
          aniversariante.mes,
          today,
        ),
        clienteNome: cliente.nome,
        clienteWhatsapp: cliente.whatsapp,
      })),
    )
    .sort(
      (first, second) =>
        first.proximoAniversario.getTime() - second.proximoAniversario.getTime(),
    );
  const aniversariantesDoMes = aniversariantes.filter(
    (aniversariante) => aniversariante.mes === today.getMonth() + 1,
  );
  const proximosAniversarios = aniversariantes.filter(
    (aniversariante) =>
      aniversariante.proximoAniversario >= startOfDay(today) &&
      aniversariante.proximoAniversario <= addDays(startOfDay(today), 60),
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(380px,460px)_1fr]">
      <ClienteForm />

      <div className="space-y-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-stone-950">
              Carteira de aniversariantes
            </h2>
            <p className="text-sm text-stone-500">
              Acompanhe datas e abra o WhatsApp do cliente comprador.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-stone-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Cake className="size-4 text-brand-700" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-stone-950">
                  Aniversariantes do mês
                </h3>
              </div>

              {aniversariantesDoMes.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Nenhum aniversariante cadastrado para este mês.
                </p>
              ) : (
                <div className="space-y-3">
                  {aniversariantesDoMes.map((aniversariante) => (
                    <BirthdayCard
                      key={aniversariante.id}
                      aniversariante={aniversariante}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-stone-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Cake className="size-4 text-brand-700" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-stone-950">
                  Próximos aniversários
                </h3>
              </div>

              {proximosAniversarios.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Nenhum aniversário nos próximos 60 dias.
                </p>
              ) : (
                <div className="space-y-3">
                  {proximosAniversarios.map((aniversariante) => (
                    <BirthdayCard
                      key={aniversariante.id}
                      aniversariante={aniversariante}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-stone-950">
            Clientes cadastrados
          </h2>
          <p className="text-sm text-stone-500">
            Compradores, contatos e aniversariantes vinculados.
          </p>
        </div>

        {clientes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Nenhum cliente cadastrado ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {clientes.map((cliente) => (
              <article
                key={cliente.id}
                className="rounded-lg border border-stone-200 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-stone-950">
                      {cliente.nome}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-stone-500">WhatsApp</dt>
                        <dd className="font-medium text-stone-900">
                          {formatOptional(cliente.whatsapp)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Telefone</dt>
                        <dd className="font-medium text-stone-900">
                          {formatOptional(cliente.telefone)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">E-mail</dt>
                        <dd className="break-words font-medium text-stone-900">
                          {formatOptional(cliente.email)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Aniversário</dt>
                        <dd className="font-medium text-stone-900">
                          {formatDate(cliente.dataNascimento)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <form action={deactivateCliente}>
                    <input type="hidden" name="id" value={cliente.id} />
                    <ConfirmSubmitButton
                      message={`Tem certeza que deseja desativar ${cliente.nome}? Ele não aparecerá em novos pedidos.`}
                      className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Desativar cliente
                    </ConfirmSubmitButton>
                  </form>
                </div>

                <div className="mt-4 grid gap-3 text-sm lg:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 p-3">
                    <div className="mb-2 flex items-center gap-2 font-medium text-stone-900">
                      <MapPin className="size-4 text-brand-700" aria-hidden="true" />
                      Endereço
                    </div>
                    <p className="text-stone-600">
                      {formatOptional(cliente.endereco)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-stone-200 p-3">
                    <div className="mb-2 flex items-center gap-2 font-medium text-stone-900">
                      <MessageCircle
                        className="size-4 text-brand-700"
                        aria-hidden="true"
                      />
                      Observações
                    </div>
                    <p className="whitespace-pre-wrap text-stone-600">
                      {formatOptional(cliente.observacoes)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-stone-200 p-3">
                  <div className="mb-3 flex items-center gap-2 font-medium text-stone-900">
                    <Cake className="size-4 text-brand-700" aria-hidden="true" />
                    Aniversariantes vinculados
                  </div>

                  {cliente.aniversariantes.length === 0 ? (
                    <p className="text-sm text-stone-500">
                      Nenhum aniversariante vinculado.
                    </p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {cliente.aniversariantes.map((aniversariante) => (
                        <div
                          key={aniversariante.id}
                          className="rounded-md bg-stone-50 p-3 text-sm"
                        >
                          <p className="font-medium text-stone-900">
                            {aniversariante.nome}
                          </p>
                          <p className="mt-1 text-stone-600">
                            {aniversariante.ocasiao}:{" "}
                            {formatDiaMes(
                              aniversariante.dia,
                              aniversariante.mes,
                              aniversariante.ano,
                            )}
                          </p>
                          {aniversariante.observacoes ? (
                            <p className="mt-2 text-stone-500">
                              {aniversariante.observacoes}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <details className="mt-4">
                  <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar cliente
                  </summary>
                  <div className="mt-4">
                    <ClienteForm
                      cliente={{
                        id: cliente.id,
                        nome: cliente.nome,
                        telefone: cliente.telefone ?? "",
                        whatsapp: cliente.whatsapp ?? "",
                        email: cliente.email ?? "",
                        dataNascimento: formatDateInput(cliente.dataNascimento),
                        endereco: cliente.endereco ?? "",
                        observacoes: cliente.observacoes ?? "",
                        aniversariantes: cliente.aniversariantes.map(
                          (aniversariante) => ({
                            id: aniversariante.id,
                            nome: aniversariante.nome,
                            dia: String(aniversariante.dia),
                            mes: String(aniversariante.mes),
                            ano: aniversariante.ano
                              ? String(aniversariante.ano)
                              : "",
                            ocasiao: aniversariante.ocasiao,
                            observacoes: aniversariante.observacoes ?? "",
                          }),
                        ),
                      }}
                    />
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
        </section>
      </div>
    </div>
  );
}

function BirthdayCard({
  aniversariante,
}: {
  aniversariante: {
    nome: string;
    dia: number;
    mes: number;
    ano: number | null;
    ocasiao: string;
    proximoAniversario: Date;
    clienteNome: string;
    clienteWhatsapp: string | null;
  };
}) {
  const whatsappLink = createWhatsAppLink({
    whatsapp: aniversariante.clienteWhatsapp,
    aniversarianteNome: aniversariante.nome,
    ocasiao: aniversariante.ocasiao,
  });
  const idade = getIdadeNaProximaOcorrencia(
    aniversariante.ano,
    aniversariante.proximoAniversario,
  );

  return (
    <article className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-stone-950">
              {aniversariante.nome}
            </p>
            {aniversariante.ocasiao !== "Aniversário" ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {aniversariante.ocasiao}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-stone-600">
            Data:{" "}
            {formatDiaMes(
              aniversariante.dia,
              aniversariante.mes,
              aniversariante.ano,
            )}
          </p>
          <p className="mt-1 text-stone-600">
            Próximo: {formatDate(aniversariante.proximoAniversario)}
            {idade ? ` — vai fazer ${idade} anos` : ""}
          </p>
          <p className="mt-2 text-stone-500">
            Cliente: {aniversariante.clienteNome}
          </p>
          <p className="mt-1 text-stone-500">
            WhatsApp: {formatOptional(aniversariante.clienteWhatsapp)}
          </p>
        </div>

        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : (
          <span className="inline-flex items-center justify-center rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-400">
            Sem WhatsApp
          </span>
        )}
      </div>
    </article>
  );
}
