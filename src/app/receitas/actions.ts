"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  calculateRecipeItemCost,
  calculateRecipeTotalCost,
  calculateRecipeUnitCost,
} from "@/lib/calculations";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { recalculateRecipeCost } from "@/lib/recipe-costs";
import { areUnitsCompatible, type SupportedUnit } from "@/lib/units";

const supportedUnits = ["kg", "g", "L", "ml", "duzia", "unidade"] as const;

const optionalTextSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().optional(),
);

const optionalUrlSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().url("Cole um endereço de imagem válido (https://...).").optional(),
);

const recipeHeaderSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(2, "Digite o nome da receita."),
  categoriaId: optionalTextSchema,
  fotoUrl: optionalUrlSchema,
  rendimento: z.coerce
    .number()
    .int("Digite quantas unidades a receita rende.")
    .positive("O rendimento precisa ser maior que zero."),
  atualizarCustoAutomaticamente: z.boolean(),
});

const recipeItemSchema = z.object({
  insumoId: z.string().min(1, "Escolha um ingrediente."),
  quantidade: z.coerce
    .number()
    .positive("Informe quanto deste ingrediente vai na receita."),
  unidade: z.enum(supportedUnits),
});

export type ReceitaFormState = {
  success?: string;
  error?: string;
};

function formatDecimal(value: number, decimalPlaces: number) {
  return value.toFixed(decimalPlaces);
}

function getRepeatedFormValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => value.toString())
    .filter((value) => value.length > 0);
}

function parseRecipeForm(formData: FormData) {
  const header = recipeHeaderSchema.safeParse({
    id: formData.get("id")?.toString(),
    nome: formData.get("nome"),
    categoriaId: formData.get("categoriaId"),
    fotoUrl: formData.get("fotoUrl"),
    rendimento: formData.get("rendimento"),
    atualizarCustoAutomaticamente:
      formData.get("atualizarCustoAutomaticamente") === "on",
  });

  if (!header.success) {
    return {
      error: header.error.issues[0]?.message ?? "Confira os dados da receita.",
    };
  }

  const insumoIds = getRepeatedFormValues(formData, "insumoId");
  const quantities = getRepeatedFormValues(formData, "quantidade");
  const units = getRepeatedFormValues(formData, "unidade");

  if (insumoIds.length === 0) {
    return {
      error: "Adicione pelo menos um ingrediente à receita.",
    };
  }

  if (insumoIds.length !== quantities.length || insumoIds.length !== units.length) {
    return {
      error: "Confira os ingredientes da receita antes de salvar.",
    };
  }

  const parsedItems = insumoIds.map((insumoId, index) =>
    recipeItemSchema.safeParse({
      insumoId,
      quantidade: quantities[index],
      unidade: units[index],
    }),
  );

  const invalidItem = parsedItems.find((item) => !item.success);

  if (invalidItem && !invalidItem.success) {
    return {
      error: invalidItem.error.issues[0]?.message ?? "Confira os ingredientes da receita.",
    };
  }

  return {
    data: {
      ...header.data,
      itens: parsedItems.map((item) => {
        if (!item.success) {
          throw new Error("Invalid recipe item");
        }

        return item.data;
      }),
    },
  };
}

export async function saveReceita(
  _previousState: ReceitaFormState,
  formData: FormData,
): Promise<ReceitaFormState> {
  const parsed = parseRecipeForm(formData);

  if (parsed.error || !parsed.data) {
    return { error: parsed.error };
  }

  const userId = await getCurrentUserId();
  const {
    id,
    nome,
    categoriaId,
    fotoUrl,
    rendimento,
    atualizarCustoAutomaticamente,
    itens,
  } = parsed.data;
  const uniqueInsumoIds = [...new Set(itens.map((item) => item.insumoId))];

  const insumos = await prisma.insumo.findMany({
    where: {
      id: {
        in: uniqueInsumoIds,
      },
      userId,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      unidadeBase: true,
      custoUnitarioBase: true,
    },
  });

  const insumoById = new Map(insumos.map((insumo) => [insumo.id, insumo]));

  let calculatedItems: Array<{
    insumoId: string;
    quantidade: number;
    unidade: SupportedUnit;
    custoTotal: number;
  }>;

  try {
    calculatedItems = itens.map((item) => {
      const insumo = insumoById.get(item.insumoId);

      if (!insumo) {
        throw new Error("Um dos ingredientes escolhidos não está mais disponível.");
      }

      const unidade = item.unidade as SupportedUnit;
      const unidadeBase = insumo.unidadeBase as SupportedUnit;

      if (!areUnitsCompatible(unidade, unidadeBase)) {
        throw new Error(
          `A unidade ${unidade} não combina com ${insumo.nome}. Use uma unidade do mesmo tipo de medida.`,
        );
      }

      const custoTotal = calculateRecipeItemCost({
        baseUnitCost: insumo.custoUnitarioBase.toNumber(),
        quantity: item.quantidade,
        unit: unidade,
      });

      return {
        insumoId: item.insumoId,
        quantidade: item.quantidade,
        unidade,
        custoTotal,
      };
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não consegui calcular o custo da receita. Confira os ingredientes.",
    };
  }

  const custoTotalAtual = calculateRecipeTotalCost(
    calculatedItems.map((item) => item.custoTotal),
  );
  const custoPorUnidade = calculateRecipeUnitCost({
    totalCost: custoTotalAtual,
    yieldQuantity: rendimento,
  });

  try {
    await prisma.$transaction(async (tx) => {
      const recipeData = {
        nome,
        categoriaId: categoriaId ?? null,
        fotoUrl: fotoUrl ?? null,
        rendimento,
        atualizarCustoAutomaticamente,
        custoTotal: formatDecimal(custoTotalAtual, 2),
        custoTotalAtual: formatDecimal(custoTotalAtual, 2),
        custoPorUnidade: formatDecimal(custoPorUnidade, 2),
      };

      const receita = id
        ? await tx.receita.update({
            where: {
              id,
              userId,
            },
            data: recipeData,
            select: {
              id: true,
            },
          })
        : await tx.receita.create({
            data: {
              ...recipeData,
              userId,
            },
            select: {
              id: true,
            },
          });

      await tx.receitaItem.deleteMany({
        where: {
          receitaId: receita.id,
          userId,
        },
      });

      await tx.receitaItem.createMany({
        data: calculatedItems.map((item) => ({
          userId,
          receitaId: receita.id,
          insumoId: item.insumoId,
          quantidade: formatDecimal(item.quantidade, 3),
          unidade: item.unidade,
          custoTotal: formatDecimal(item.custoTotal, 2),
        })),
      });
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não consegui salvar a receita. Tente conferir os campos.",
    };
  }

  revalidatePath("/receitas");
  revalidatePath("/");

  return {
    success: id ? "Receita salva com sucesso." : "Receita cadastrada com sucesso.",
  };
}

// Carrega o detalhe de UMA receita sob demanda (quando a usuária clica).
// A lista traz só o resumo, então nunca mantemos N receitas completas em
// memória — cada detalhe é buscado ao abrir e descartado ao fechar.
export async function carregarReceitaDetalhe(id: string): Promise<{
  id: string;
  nome: string;
  fotoUrl: string;
  categoriaId: string;
  rendimento: string;
  atualizarCustoAutomaticamente: boolean;
  itens: {
    id: string;
    insumoId: string;
    insumoNome: string;
    unidadeBase: string;
    quantidade: string;
    unidade: string;
    custoTotal: number;
  }[];
} | null> {
  const userId = await getCurrentUserId();
  const receita = await prisma.receita.findFirst({
    where: {
      id,
      userId,
      ativo: true,
    },
    include: {
      itens: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          insumo: {
            select: {
              nome: true,
              unidadeBase: true,
            },
          },
        },
      },
    },
  });

  if (!receita) {
    return null;
  }

  return {
    id: receita.id,
    nome: receita.nome,
    fotoUrl: receita.fotoUrl ?? "",
    categoriaId: receita.categoriaId ?? "",
    rendimento: receita.rendimento?.toString() ?? "",
    atualizarCustoAutomaticamente: receita.atualizarCustoAutomaticamente,
    itens: receita.itens.map((item) => ({
      id: item.id,
      insumoId: item.insumoId,
      insumoNome: item.insumo.nome,
      unidadeBase: item.insumo.unidadeBase,
      quantidade: item.quantidade.toString(),
      unidade: item.unidade,
      custoTotal: item.custoTotal.toNumber(),
    })),
  };
}

export async function deactivateReceita(formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.receita.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      ativo: false,
    },
  });

  revalidatePath("/receitas");
  revalidatePath("/");
}

export async function recalculateReceita(formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.$transaction(async (tx) => {
    await recalculateRecipeCost({
      tx,
      receitaId: id,
      userId,
    });
  });

  revalidatePath("/receitas");
  revalidatePath("/");
}
