import type { Prisma } from "@prisma/client";
import { roundMoney } from "@/lib/calculations";
import { normalizeToBaseUnit, type SupportedUnit } from "@/lib/units";

type StockClient = Prisma.TransactionClient;

type Requirement = {
  insumoId: string;
  nome: string;
  unidadeBase: string;
  quantidadeNecessaria: number;
  estoqueAtual: number;
  custoTotal: number;
};

function formatDecimal(value: number, decimalPlaces: number) {
  return value.toFixed(decimalPlaces);
}

export async function getOrderStockRequirements({
  client,
  pedidoId,
  userId,
}: {
  client: StockClient;
  pedidoId: string;
  userId: string;
}): Promise<Requirement[]> {
  const pedido = await client.pedido.findFirst({
    where: {
      id: pedidoId,
      userId,
    },
    select: {
      itens: {
        select: {
          quantidade: true,
          receita: {
            select: {
              itens: {
                select: {
                  quantidade: true,
                  unidade: true,
                  insumo: {
                    select: {
                      id: true,
                      nome: true,
                      unidadeBase: true,
                      custoUnitarioBase: true,
                      estoqueAtual: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!pedido) {
    return [];
  }

  const requirementsByInsumo = new Map<string, Requirement>();

  for (const pedidoItem of pedido.itens) {
    for (const receitaItem of pedidoItem.receita?.itens ?? []) {
      const insumo = receitaItem.insumo;
      const quantityInBaseUnit =
        normalizeToBaseUnit(
          receitaItem.quantidade.toNumber(),
          receitaItem.unidade as SupportedUnit,
        ) * pedidoItem.quantidade;
      const currentRequirement = requirementsByInsumo.get(insumo.id);

      if (currentRequirement) {
        currentRequirement.quantidadeNecessaria += quantityInBaseUnit;
        currentRequirement.custoTotal = roundMoney(
          currentRequirement.custoTotal +
            quantityInBaseUnit * insumo.custoUnitarioBase.toNumber(),
        );
      } else {
        requirementsByInsumo.set(insumo.id, {
          insumoId: insumo.id,
          nome: insumo.nome,
          unidadeBase: insumo.unidadeBase,
          quantidadeNecessaria: quantityInBaseUnit,
          estoqueAtual: insumo.estoqueAtual?.toNumber() ?? 0,
          custoTotal: roundMoney(
            quantityInBaseUnit * insumo.custoUnitarioBase.toNumber(),
          ),
        });
      }
    }
  }

  return [...requirementsByInsumo.values()].map((requirement) => ({
    ...requirement,
    quantidadeNecessaria: Number(
      formatDecimal(requirement.quantidadeNecessaria, 3),
    ),
  }));
}

export function getInsufficientStockWarnings(requirements: Requirement[]) {
  return requirements.filter(
    (requirement) => requirement.estoqueAtual < requirement.quantidadeNecessaria,
  );
}

export async function lowerOrderStock({
  tx,
  pedidoId,
  userId,
}: {
  tx: StockClient;
  pedidoId: string;
  userId: string;
}) {
  const pedido = await tx.pedido.findFirst({
    where: {
      id: pedidoId,
      userId,
    },
    select: {
      id: true,
      estoqueBaixado: true,
    },
  });

  if (!pedido || pedido.estoqueBaixado) {
    return;
  }

  const requirements = await getOrderStockRequirements({
    client: tx,
    pedidoId,
    userId,
  });

  for (const requirement of requirements) {
    const newStock =
      requirement.estoqueAtual - requirement.quantidadeNecessaria;

    await tx.insumo.update({
      where: {
        id: requirement.insumoId,
      },
      data: {
        estoqueAtual: formatDecimal(newStock, 3),
      },
    });

    await tx.movimentoEstoque.create({
      data: {
        userId,
        insumoId: requirement.insumoId,
        tipo: "SAIDA",
        quantidade: formatDecimal(requirement.quantidadeNecessaria, 3),
        custoTotal: formatDecimal(requirement.custoTotal, 2),
        observacao: `Baixa automática do pedido ${pedidoId}`,
      },
    });
  }

  await tx.pedido.update({
    where: {
      id: pedido.id,
    },
    data: {
      estoqueBaixado: true,
      estoqueDevolvido: false,
    },
  });
}

export async function returnOrderStock({
  tx,
  pedidoId,
  userId,
}: {
  tx: StockClient;
  pedidoId: string;
  userId: string;
}) {
  const pedido = await tx.pedido.findFirst({
    where: {
      id: pedidoId,
      userId,
    },
    select: {
      id: true,
      estoqueBaixado: true,
      estoqueDevolvido: true,
    },
  });

  if (!pedido || !pedido.estoqueBaixado || pedido.estoqueDevolvido) {
    return;
  }

  const requirements = await getOrderStockRequirements({
    client: tx,
    pedidoId,
    userId,
  });

  for (const requirement of requirements) {
    const newStock =
      requirement.estoqueAtual + requirement.quantidadeNecessaria;

    await tx.insumo.update({
      where: {
        id: requirement.insumoId,
      },
      data: {
        estoqueAtual: formatDecimal(newStock, 3),
      },
    });

    await tx.movimentoEstoque.create({
      data: {
        userId,
        insumoId: requirement.insumoId,
        tipo: "ENTRADA",
        quantidade: formatDecimal(requirement.quantidadeNecessaria, 3),
        custoTotal: formatDecimal(requirement.custoTotal, 2),
        observacao: `Devolução de estoque do pedido ${pedidoId}`,
      },
    });
  }

  await tx.pedido.update({
    where: {
      id: pedido.id,
    },
    data: {
      estoqueBaixado: false,
      estoqueDevolvido: true,
    },
  });
}
