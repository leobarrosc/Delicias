"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidDiaMes } from "@/lib/birthdays";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

const optionalTextSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().optional(),
);

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

const clienteSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(2, "Digite o nome do cliente."),
  telefone: optionalTextSchema,
  whatsapp: optionalTextSchema,
  email: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().email("Digite um e-mail válido ou deixe em branco.").optional(),
  ),
  dataNascimento: optionalDateSchema,
  endereco: optionalTextSchema,
  observacoes: optionalTextSchema,
});

const aniversarianteSchema = z
  .object({
    nome: z.string().trim().min(2, "Digite o nome do aniversariante."),
    dia: z.coerce
      .number()
      .int("Digite o dia da data comemorativa.")
      .min(1, "Digite o dia da data comemorativa.")
      .max(31, "O dia precisa estar entre 1 e 31."),
    mes: z.coerce
      .number()
      .int()
      .min(1, "Escolha o mês da data comemorativa.")
      .max(12, "Escolha o mês da data comemorativa."),
    ano: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce
        .number()
        .int("Digite o ano com 4 dígitos.")
        .min(1900, "Digite um ano a partir de 1900.")
        .max(new Date().getFullYear(), "O ano não pode estar no futuro.")
        .optional(),
    ),
    ocasiao: z.preprocess(
      (value) => (value === "" || value === null ? "Aniversário" : value),
      z.string().trim(),
    ),
    observacoes: optionalTextSchema,
  })
  .refine((aniversariante) => isValidDiaMes(aniversariante.dia, aniversariante.mes), {
    message: "Esse dia não existe nesse mês. Confira a data.",
  });

export type ClienteFormState = {
  success?: string;
  error?: string;
};

function getRepeatedFormValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => value.toString());
}

function parseClienteForm(formData: FormData) {
  const cliente = clienteSchema.safeParse({
    id: formData.get("id")?.toString(),
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    dataNascimento: formData.get("dataNascimento"),
    endereco: formData.get("endereco"),
    observacoes: formData.get("observacoes"),
  });

  if (!cliente.success) {
    return {
      error: cliente.error.issues[0]?.message ?? "Confira os dados do cliente.",
    };
  }

  const nomes = getRepeatedFormValues(formData, "aniversarianteNome");
  const dias = getRepeatedFormValues(formData, "aniversarianteDia");
  const meses = getRepeatedFormValues(formData, "aniversarianteMes");
  const anos = getRepeatedFormValues(formData, "aniversarianteAno");
  const ocasioes = getRepeatedFormValues(formData, "aniversarianteOcasiao");
  const observacoes = getRepeatedFormValues(formData, "aniversarianteObservacoes");

  const aniversariantesInput = nomes
    .map((nome, index) => ({
      nome,
      dia: dias[index] ?? "",
      mes: meses[index] ?? "",
      ano: anos[index] ?? "",
      ocasiao: ocasioes[index] ?? "",
      observacoes: observacoes[index] ?? "",
    }))
    .filter(
      (aniversariante) =>
        aniversariante.nome.trim() ||
        aniversariante.dia.trim() ||
        aniversariante.observacoes.trim(),
    );

  const aniversariantes = aniversariantesInput.map((aniversariante) =>
    aniversarianteSchema.safeParse(aniversariante),
  );

  const invalidAniversariante = aniversariantes.find(
    (aniversariante) => !aniversariante.success,
  );

  if (invalidAniversariante && !invalidAniversariante.success) {
    return {
      error:
        invalidAniversariante.error.issues[0]?.message ??
        "Confira os aniversariantes ligados a este cliente.",
    };
  }

  return {
    data: {
      ...cliente.data,
      aniversariantes: aniversariantes.map((aniversariante) => {
        if (!aniversariante.success) {
          throw new Error("Invalid birthday person");
        }

        return aniversariante.data;
      }),
    },
  };
}

export async function saveCliente(
  _previousState: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  const parsed = parseClienteForm(formData);

  if (parsed.error || !parsed.data) {
    return { error: parsed.error };
  }

  const userId = await getCurrentUserId();
  const { id, aniversariantes, ...cliente } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const clienteData = {
        nome: cliente.nome,
        telefone: cliente.telefone ?? null,
        whatsapp: cliente.whatsapp ?? null,
        email: cliente.email ?? null,
        dataNascimento: cliente.dataNascimento ?? null,
        endereco: cliente.endereco ?? null,
        observacoes: cliente.observacoes ?? null,
      };

      let clienteId = id;

      if (id) {
        const result = await tx.cliente.updateMany({
          where: {
            id,
            userId,
          },
          data: clienteData,
        });

        if (result.count === 0) {
          throw new Error("Não encontrei esse cliente.");
        }
      } else {
        const createdCliente = await tx.cliente.create({
          data: {
            ...clienteData,
            userId,
          },
          select: {
            id: true,
          },
        });

        clienteId = createdCliente.id;
      }

      if (!clienteId) {
        throw new Error("Não consegui salvar o cliente.");
      }

      await tx.aniversariante.deleteMany({
        where: {
          clienteId,
          userId,
        },
      });

      if (aniversariantes.length > 0) {
        await tx.aniversariante.createMany({
          data: aniversariantes.map((aniversariante) => ({
            userId,
            clienteId,
            nome: aniversariante.nome,
            dia: aniversariante.dia,
            mes: aniversariante.mes,
            ano: aniversariante.ano ?? null,
            ocasiao: aniversariante.ocasiao,
            observacoes: aniversariante.observacoes ?? null,
          })),
        });
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não consegui salvar o cliente. Confira os campos e tente de novo.",
    };
  }

  revalidatePath("/clientes");
  revalidatePath("/");

  return {
    success: id ? "Cliente salvo com sucesso." : "Cliente cadastrado com sucesso.",
  };
}

export async function deactivateCliente(formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.cliente.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      ativo: false,
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/");
}

function formatDateInput(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

// Detalhe completo de um cliente, carregado só quando a usuária clica —
// mantém a lista leve e nunca segura todos os clientes completos em memória.
export async function carregarClienteDetalhe(id: string) {
  const userId = await getCurrentUserId();
  const cliente = await prisma.cliente.findFirst({
    where: {
      id,
      userId,
      ativo: true,
    },
    include: {
      aniversariantes: {
        orderBy: {
          nome: "asc",
        },
      },
      _count: {
        select: {
          pedidos: true,
        },
      },
    },
  });

  if (!cliente) {
    return null;
  }

  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone ?? "",
    whatsapp: cliente.whatsapp ?? "",
    email: cliente.email ?? "",
    dataNascimento: formatDateInput(cliente.dataNascimento),
    endereco: cliente.endereco ?? "",
    observacoes: cliente.observacoes ?? "",
    totalPedidos: cliente._count.pedidos,
    aniversariantes: cliente.aniversariantes.map((aniversariante) => ({
      id: aniversariante.id,
      nome: aniversariante.nome,
      dia: String(aniversariante.dia),
      mes: String(aniversariante.mes),
      ano: aniversariante.ano ? String(aniversariante.ano) : "",
      ocasiao: aniversariante.ocasiao,
      observacoes: aniversariante.observacoes ?? "",
    })),
  };
}
