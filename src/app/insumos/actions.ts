"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateInsumoBaseUnitCost } from "@/lib/calculations";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { recalculateAutomaticRecipesUsingInsumo } from "@/lib/recipe-costs";
import { getBaseUnit, type SupportedUnit } from "@/lib/units";

const supportedUnits = ["kg", "g", "L", "ml", "duzia", "unidade"] as const;

const optionalDecimalSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0, "Informe um valor maior ou igual a zero").optional(),
);

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

const insumoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(2, "Digite o nome do ingrediente."),
  categoria: z.string().trim().min(2, "Digite uma categoria simples, como secos ou embalagens."),
  quantidadeCompra: z.coerce
    .number()
    .positive("Informe quanto veio na compra. Precisa ser maior que zero."),
  unidadeCompra: z.enum(supportedUnits),
  precoCompra: z.coerce
    .number()
    .positive("Informe quanto você pagou. Precisa ser maior que zero."),
  estoqueAtual: optionalDecimalSchema,
  estoqueMinimo: optionalDecimalSchema,
  dataUltimaCompra: optionalDateSchema,
});

export type InsumoFormState = {
  success?: string;
  error?: string;
};

function formatDecimal(value: number, decimalPlaces: number) {
  return value.toFixed(decimalPlaces);
}

function parseInsumoForm(formData: FormData) {
  const parsed = insumoSchema.safeParse({
    id: formData.get("id")?.toString(),
    nome: formData.get("nome"),
    categoria: formData.get("categoria"),
    quantidadeCompra: formData.get("quantidadeCompra"),
    unidadeCompra: formData.get("unidadeCompra"),
    precoCompra: formData.get("precoCompra"),
    estoqueAtual: formData.get("estoqueAtual"),
    estoqueMinimo: formData.get("estoqueMinimo"),
    dataUltimaCompra: formData.get("dataUltimaCompra"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Confira os dados do ingrediente.",
    };
  }

  const unidadeCompra = parsed.data.unidadeCompra as SupportedUnit;
  const unidadeBase = getBaseUnit(unidadeCompra);
  const custoUnitarioBase = calculateInsumoBaseUnitCost({
    totalCost: parsed.data.precoCompra,
    quantity: parsed.data.quantidadeCompra,
    unit: unidadeCompra,
  });

  return {
    data: {
      ...parsed.data,
      unidadeBase,
      custoUnitarioBase,
    },
  };
}

export async function saveInsumo(
  _previousState: InsumoFormState,
  formData: FormData,
): Promise<InsumoFormState> {
  const parsed = parseInsumoForm(formData);

  if (parsed.error || !parsed.data) {
    return { error: parsed.error };
  }

  const userId = await getCurrentUserId();
  const { id, ...insumo } = parsed.data;
  const existingInsumo = id
    ? await prisma.insumo.findFirst({
        where: {
          id,
          userId,
        },
        select: {
          custoUnitarioBase: true,
        },
      })
    : null;

  const data = {
    nome: insumo.nome,
    categoria: insumo.categoria,
    quantidadeCompra: formatDecimal(insumo.quantidadeCompra, 3),
    unidadeCompra: insumo.unidadeCompra,
    precoCompra: formatDecimal(insumo.precoCompra, 2),
    unidadeBase: insumo.unidadeBase,
    custoUnitarioBase: formatDecimal(insumo.custoUnitarioBase, 4),
    estoqueAtual:
      insumo.estoqueAtual === undefined
        ? null
        : formatDecimal(insumo.estoqueAtual, 3),
    estoqueMinimo:
      insumo.estoqueMinimo === undefined
        ? null
        : formatDecimal(insumo.estoqueMinimo, 3),
    dataUltimaCompra: insumo.dataUltimaCompra ?? null,
  };

  if (id) {
    const shouldRecalculateRecipes =
      existingInsumo !== null &&
      existingInsumo.custoUnitarioBase.toNumber() !== insumo.custoUnitarioBase;

    await prisma.$transaction(async (tx) => {
      await tx.insumo.updateMany({
        where: {
          id,
          userId,
        },
        data,
      });

      if (shouldRecalculateRecipes) {
        await recalculateAutomaticRecipesUsingInsumo({
          tx,
          insumoId: id,
          userId,
        });
      }
    });
  } else {
    await prisma.insumo.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  revalidatePath("/insumos");
  revalidatePath("/receitas");

  return {
    success: id ? "Ingrediente salvo com sucesso." : "Ingrediente cadastrado com sucesso.",
  };
}

export async function deactivateInsumo(formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.insumo.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      ativo: false,
    },
  });

  revalidatePath("/insumos");
}
