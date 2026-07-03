import type { Prisma } from "@prisma/client";
import {
  calculateRecipeItemCost,
  calculateRecipeTotalCost,
  calculateRecipeUnitCost,
} from "@/lib/calculations";
import { areUnitsCompatible, type SupportedUnit } from "@/lib/units";

type RecipeCostClient = Prisma.TransactionClient;

function formatDecimal(value: number, decimalPlaces: number) {
  return value.toFixed(decimalPlaces);
}

export async function recalculateRecipeCost({
  tx,
  receitaId,
  userId,
}: {
  tx: RecipeCostClient;
  receitaId: string;
  userId: string;
}) {
  const receita = await tx.receita.findFirst({
    where: {
      id: receitaId,
      userId,
      ativo: true,
    },
    select: {
      id: true,
      rendimento: true,
      itens: {
        select: {
          id: true,
          quantidade: true,
          unidade: true,
          insumo: {
            select: {
              nome: true,
              unidadeBase: true,
              custoUnitarioBase: true,
            },
          },
        },
      },
    },
  });

  if (!receita) {
    return;
  }

  const calculatedItems = receita.itens.map((item) => {
    const unidade = item.unidade as SupportedUnit;
    const unidadeBase = item.insumo.unidadeBase as SupportedUnit;

    if (!areUnitsCompatible(unidade, unidadeBase)) {
      throw new Error(
        `A unidade ${unidade} não é compatível com a unidade base ${unidadeBase} de ${item.insumo.nome}.`,
      );
    }

    return {
      id: item.id,
      custoTotal: calculateRecipeItemCost({
        baseUnitCost: item.insumo.custoUnitarioBase.toNumber(),
        quantity: item.quantidade.toNumber(),
        unit: unidade,
      }),
    };
  });

  const custoTotalAtual = calculateRecipeTotalCost(
    calculatedItems.map((item) => item.custoTotal),
  );
  const custoPorUnidade = calculateRecipeUnitCost({
    totalCost: custoTotalAtual,
    yieldQuantity: receita.rendimento ?? 0,
  });

  await Promise.all(
    calculatedItems.map((item) =>
      tx.receitaItem.update({
        where: {
          id: item.id,
        },
        data: {
          custoTotal: formatDecimal(item.custoTotal, 2),
        },
      }),
    ),
  );

  await tx.receita.update({
    where: {
      id: receita.id,
    },
    data: {
      custoTotal: formatDecimal(custoTotalAtual, 2),
      custoTotalAtual: formatDecimal(custoTotalAtual, 2),
      custoPorUnidade: formatDecimal(custoPorUnidade, 2),
    },
  });
}

export async function recalculateAutomaticRecipesUsingInsumo({
  tx,
  insumoId,
  userId,
}: {
  tx: RecipeCostClient;
  insumoId: string;
  userId: string;
}) {
  const receitas = await tx.receita.findMany({
    where: {
      userId,
      ativo: true,
      atualizarCustoAutomaticamente: true,
      itens: {
        some: {
          insumoId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  for (const receita of receitas) {
    await recalculateRecipeCost({
      tx,
      receitaId: receita.id,
      userId,
    });
  }
}
