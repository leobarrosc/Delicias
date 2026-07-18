"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  DEFAULT_MENSAGEM_ANIVERSARIO,
  DEFAULT_MENSAGEM_PEDIDO,
} from "@/lib/config";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

export type ConfigFormState = {
  success?: string;
  error?: string;
};

const optionalUrlSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().url("Cole um endereço de imagem válido (https://...).").optional(),
);

const configuracaoSchema = z.object({
  fretePadrao: z.coerce
    .number()
    .min(0, "O frete padrão não pode ser negativo."),
  mensagemAniversario: z.string().trim().min(1, "Escreva a mensagem de aniversário."),
  mensagemPedido: z.string().trim().min(1, "Escreva a mensagem de pedido."),
});

const categoriaSchema = z.object({
  nome: z.string().trim().min(2, "Digite o nome da categoria."),
});

const marcaSchema = z.object({
  nome: z.string().trim().min(2, "Digite o nome da marca."),
  logoUrl: optionalUrlSchema,
});

function formatDecimal(value: number, decimalPlaces: number) {
  return value.toFixed(decimalPlaces);
}

export async function salvarConfiguracao(
  _previousState: ConfigFormState,
  formData: FormData,
): Promise<ConfigFormState> {
  const parsed = configuracaoSchema.safeParse({
    fretePadrao: formData.get("fretePadrao"),
    mensagemAniversario: formData.get("mensagemAniversario"),
    mensagemPedido: formData.get("mensagemPedido"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Confira os dados.",
    };
  }

  const userId = await getCurrentUserId();
  const { fretePadrao, mensagemAniversario, mensagemPedido } = parsed.data;
  const data = {
    fretePadrao: formatDecimal(fretePadrao, 2),
    mensagemAniversario,
    mensagemPedido,
  };

  await prisma.configuracaoUsuario.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      ...data,
    },
    update: data,
  });

  revalidatePath("/configuracoes");
  revalidatePath("/");
  revalidatePath("/clientes");

  return { success: "Configurações salvas." };
}

export async function restaurarMensagensPadrao() {
  const userId = await getCurrentUserId();

  await prisma.configuracaoUsuario.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      mensagemAniversario: DEFAULT_MENSAGEM_ANIVERSARIO,
      mensagemPedido: DEFAULT_MENSAGEM_PEDIDO,
    },
    update: {
      mensagemAniversario: DEFAULT_MENSAGEM_ANIVERSARIO,
      mensagemPedido: DEFAULT_MENSAGEM_PEDIDO,
    },
  });

  revalidatePath("/configuracoes");
}

export async function criarCategoriaReceita(
  _previousState: ConfigFormState,
  formData: FormData,
): Promise<ConfigFormState> {
  const parsed = categoriaSchema.safeParse({
    nome: formData.get("nome"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confira o nome." };
  }

  const userId = await getCurrentUserId();

  try {
    await prisma.categoriaReceita.create({
      data: {
        userId,
        nome: parsed.data.nome,
      },
    });
  } catch {
    return { error: "Já existe uma categoria com esse nome." };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/receitas");

  return { success: "Categoria criada." };
}

export async function excluirCategoriaReceita(formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.categoriaReceita.deleteMany({
    where: {
      id,
      userId,
    },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/receitas");
}

export async function criarMarca(
  _previousState: ConfigFormState,
  formData: FormData,
): Promise<ConfigFormState> {
  const parsed = marcaSchema.safeParse({
    nome: formData.get("nome"),
    logoUrl: formData.get("logoUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  }

  const userId = await getCurrentUserId();

  try {
    await prisma.marca.create({
      data: {
        userId,
        nome: parsed.data.nome,
        logoUrl: parsed.data.logoUrl ?? null,
      },
    });
  } catch {
    return { error: "Já existe uma marca com esse nome." };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/insumos");

  return { success: "Marca criada." };
}

export async function excluirMarca(formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.marca.deleteMany({
    where: {
      id,
      userId,
    },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/insumos");
}
