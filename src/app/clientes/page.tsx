import {
  ClientesClient,
  type AniversarianteItem,
  type ClienteResumo,
} from "@/app/clientes/clientes-client";
import {
  formatDiaMes,
  getIdadeNaProximaOcorrencia,
  getNextOccurrence,
} from "@/lib/birthdays";
import { getConfiguracao } from "@/lib/config";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { createWhatsAppBirthdayLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export default async function ClientesPage() {
  const userId = await getCurrentUserId();
  const config = await getConfiguracao(userId);
  const clientes = await prisma.cliente.findMany({
    where: {
      userId,
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
    select: {
      id: true,
      nome: true,
      whatsapp: true,
      telefone: true,
      email: true,
      aniversariantes: {
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          dia: true,
          mes: true,
          ano: true,
          ocasiao: true,
        },
      },
    },
  });
  const today = new Date();

  const aniversariantes: AniversarianteItem[] = clientes
    .flatMap((cliente) =>
      cliente.aniversariantes.map((aniversariante) => {
        const proximo = getNextOccurrence(
          aniversariante.dia,
          aniversariante.mes,
          today,
        );

        return {
          id: aniversariante.id,
          nome: aniversariante.nome,
          ocasiao: aniversariante.ocasiao,
          dataLabel: formatDiaMes(
            aniversariante.dia,
            aniversariante.mes,
            aniversariante.ano,
          ),
          proximoLabel: formatDate(proximo),
          proximo,
          idade: getIdadeNaProximaOcorrencia(aniversariante.ano, proximo),
          clienteNome: cliente.nome,
          whatsappLink: createWhatsAppBirthdayLink({
            whatsapp: cliente.whatsapp,
            aniversarianteNome: aniversariante.nome,
            clienteNome: cliente.nome,
            ocasiao: aniversariante.ocasiao,
            template: config.mensagemAniversario,
          }),
        };
      }),
    )
    .sort((first, second) => first.proximo.getTime() - second.proximo.getTime())
    .map(({ proximo: _proximo, ...item }) => item);

  const clientesResumo: ClienteResumo[] = clientes.map((cliente) => ({
    id: cliente.id,
    nome: cliente.nome,
    whatsapp: cliente.whatsapp,
    telefone: cliente.telefone,
    email: cliente.email,
    aniversariantesCount: cliente.aniversariantes.length,
  }));

  return (
    <ClientesClient
      aniversariantes={aniversariantes}
      clientes={clientesResumo}
    />
  );
}
