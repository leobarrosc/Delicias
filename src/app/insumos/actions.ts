"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { roundUnitCost } from "@/lib/calculations";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { recalculateAutomaticRecipesUsingInsumo } from "@/lib/recipe-costs";
import {
  getBaseUnit,
  normalizeToBaseUnit,
  type SupportedUnit,
} from "@/lib/units";

const supportedUnits = ["kg", "g", "L", "ml", "duzia", "unidade"] as const;

const optionalTextSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().optional(),
);

const optionalDecimalSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0, "Informe um valor maior ou igual a zero").optional(),
);

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

const optionalUrlSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().url("Cole um endereço de imagem válido (https://...).").optional(),
);

const insumoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(2, "Digite o nome do ingrediente."),
  marcaId: optionalTextSchema,
  fotoUrl: optionalUrlSchema,
  categoria: z
    .string()
    .trim()
    .min(2, "Digite uma categoria simples, como secos ou embalagens."),
  conteudoEmbalagem: z.coerce
    .number()
    .positive("Informe quanto vem em uma embalagem (ex.: 395)."),
  unidadeEmbalagem: z.enum(supportedUnits),
  estoqueAtual: optionalDecimalSchema,
  estoqueMinimo: optionalDecimalSchema,
  registrarCompra: z.boolean(),
  compraEmbalagens: optionalDecimalSchema,
  compraPrecoTotal: optionalDecimalSchema,
  compraData: optionalDateSchema,
});

const compraSchema = z.object({
  insumoId: z.string().min(1, "Escolha o ingrediente da compra."),
  quantidadeEmbalagens: z.coerce
    .number()
    .positive("Informe quantas embalagens você comprou."),
  precoTotal: z.coerce
    .number()
    .positive("Informe o valor total pago na compra."),
  dataCompra: optionalDateSchema,
});

export type InsumoFormState = {
  success?: string;
  error?: string;
};

export type CompraFormState = {
  success?: string;
  error?: string;
};

function formatDecimal(value: number, decimalPlaces: number) {
  return value.toFixed(decimalPlaces);
}

type InsumoParaCompra = {
  id: string;
  conteudoEmbalagem: number;
  unidadeEmbalagem: SupportedUnit;
  estoqueAtual: number | null;
};

// Aplica uma compra: histórico, custo unitário novo, entrada no estoque
// (em unidade base) e recálculo das receitas automáticas.
async function applyCompra({
  tx,
  userId,
  insumo,
  quantidadeEmbalagens,
  precoTotal,
  dataCompra,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  insumo: InsumoParaCompra;
  quantidadeEmbalagens: number;
  precoTotal: number;
  dataCompra?: Date;
}) {
  const conteudoBase = normalizeToBaseUnit(
    insumo.conteudoEmbalagem,
    insumo.unidadeEmbalagem,
  );
  const quantidadeBase = conteudoBase * quantidadeEmbalagens;

  if (quantidadeBase <= 0) {
    throw new Error("Confira o conteúdo da embalagem antes de registrar a compra.");
  }

  const custoUnitarioBase = roundUnitCost(precoTotal / quantidadeBase);
  const novoEstoque = (insumo.estoqueAtual ?? 0) + quantidadeBase;
  const data = dataCompra ?? new Date();

  await tx.insumoCompra.create({
    data: {
      userId,
      insumoId: insumo.id,
      quantidadeEmbalagens: formatDecimal(quantidadeEmbalagens, 3),
      precoTotal: formatDecimal(precoTotal, 2),
      dataCompra: data,
    },
  });

  await tx.insumo.update({
    where: {
      id: insumo.id,
    },
    data: {
      custoUnitarioBase: formatDecimal(custoUnitarioBase, 4),
      estoqueAtual: formatDecimal(novoEstoque, 3),
      dataUltimaCompra: data,
    },
  });

  await tx.movimentoEstoque.create({
    data: {
      userId,
      insumoId: insumo.id,
      tipo: "ENTRADA",
      quantidade: formatDecimal(quantidadeBase, 3),
      custoTotal: formatDecimal(precoTotal, 2),
      observacao: `Compra de ${quantidadeEmbalagens} embalagem(ns)`,
    },
  });

  await recalculateAutomaticRecipesUsingInsumo({
    tx,
    insumoId: insumo.id,
    userId,
  });
}

function revalidateInsumoPaths() {
  revalidatePath("/insumos");
  revalidatePath("/receitas");
  revalidatePath("/");
}

export async function saveInsumo(
  _previousState: InsumoFormState,
  formData: FormData,
): Promise<InsumoFormState> {
  const parsed = insumoSchema.safeParse({
    id: formData.get("id")?.toString(),
    nome: formData.get("nome"),
    marcaId: formData.get("marcaId"),
    fotoUrl: formData.get("fotoUrl"),
    categoria: formData.get("categoria"),
    conteudoEmbalagem: formData.get("conteudoEmbalagem"),
    unidadeEmbalagem: formData.get("unidadeEmbalagem"),
    estoqueAtual: formData.get("estoqueAtual"),
    estoqueMinimo: formData.get("estoqueMinimo"),
    registrarCompra: formData.get("registrarCompra") === "on",
    compraEmbalagens: formData.get("compraEmbalagens"),
    compraPrecoTotal: formData.get("compraPrecoTotal"),
    compraData: formData.get("compraData"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Confira os dados do ingrediente.",
    };
  }

  const {
    id,
    nome,
    marcaId,
    fotoUrl,
    categoria,
    conteudoEmbalagem,
    unidadeEmbalagem,
    estoqueAtual,
    estoqueMinimo,
    registrarCompra,
    compraEmbalagens,
    compraPrecoTotal,
    compraData,
  } = parsed.data;
  const unidadeBase = getBaseUnit(unidadeEmbalagem as SupportedUnit);

  if (!id && registrarCompra) {
    if (!compraEmbalagens || compraEmbalagens <= 0) {
      return { error: "Informe quantas embalagens você comprou." };
    }

    if (!compraPrecoTotal || compraPrecoTotal <= 0) {
      return { error: "Informe o valor total pago na compra." };
    }
  }

  const userId = await getCurrentUserId();
  const insumoData = {
    nome,
    marcaId: marcaId ?? null,
    fotoUrl: fotoUrl ?? null,
    categoria,
    conteudoEmbalagem: formatDecimal(conteudoEmbalagem, 3),
    unidadeEmbalagem,
    unidadeBase,
    estoqueMinimo:
      estoqueMinimo === undefined ? null : formatDecimal(estoqueMinimo, 3),
  };

  try {
    await prisma.$transaction(async (tx) => {
      if (id) {
        const existente = await tx.insumo.findFirst({
          where: {
            id,
            userId,
          },
          select: {
            id: true,
          },
        });

        if (!existente) {
          throw new Error("Não encontrei esse ingrediente.");
        }

        await tx.insumo.update({
          where: {
            id,
          },
          data: {
            ...insumoData,
            estoqueAtual:
              estoqueAtual === undefined
                ? null
                : formatDecimal(estoqueAtual, 3),
          },
        });

        // Se a embalagem mudou, o custo unitário derivado da última compra
        // muda junto — recalcula a partir do histórico.
        const ultimaCompra = await tx.insumoCompra.findFirst({
          where: {
            insumoId: id,
            userId,
          },
          orderBy: {
            dataCompra: "desc",
          },
          select: {
            quantidadeEmbalagens: true,
            precoTotal: true,
          },
        });

        if (ultimaCompra) {
          const conteudoBase = normalizeToBaseUnit(
            conteudoEmbalagem,
            unidadeEmbalagem as SupportedUnit,
          );
          const quantidadeBase =
            conteudoBase * ultimaCompra.quantidadeEmbalagens.toNumber();

          if (quantidadeBase > 0) {
            await tx.insumo.update({
              where: {
                id,
              },
              data: {
                custoUnitarioBase: formatDecimal(
                  roundUnitCost(
                    ultimaCompra.precoTotal.toNumber() / quantidadeBase,
                  ),
                  4,
                ),
              },
            });

            await recalculateAutomaticRecipesUsingInsumo({
              tx,
              insumoId: id,
              userId,
            });
          }
        }
      } else {
        const criado = await tx.insumo.create({
          data: {
            ...insumoData,
            userId,
            custoUnitarioBase: "0",
            estoqueAtual: registrarCompra ? "0" : null,
          },
          select: {
            id: true,
          },
        });

        if (registrarCompra) {
          await applyCompra({
            tx,
            userId,
            insumo: {
              id: criado.id,
              conteudoEmbalagem,
              unidadeEmbalagem: unidadeEmbalagem as SupportedUnit,
              estoqueAtual: 0,
            },
            quantidadeEmbalagens: compraEmbalagens as number,
            precoTotal: compraPrecoTotal as number,
            dataCompra: compraData,
          });
        }
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não consegui salvar o ingrediente. Confira os campos.",
    };
  }

  revalidateInsumoPaths();

  return {
    success: id
      ? "Ingrediente salvo com sucesso."
      : registrarCompra
        ? "Ingrediente cadastrado com a primeira compra registrada."
        : "Ingrediente cadastrado. Registre uma compra quando comprar.",
  };
}

export async function registrarCompraInsumo(
  _previousState: CompraFormState,
  formData: FormData,
): Promise<CompraFormState> {
  const parsed = compraSchema.safeParse({
    insumoId: formData.get("insumoId"),
    quantidadeEmbalagens: formData.get("quantidadeEmbalagens"),
    precoTotal: formData.get("precoTotal"),
    dataCompra: formData.get("dataCompra"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Confira os dados da compra.",
    };
  }

  const { insumoId, quantidadeEmbalagens, precoTotal, dataCompra } = parsed.data;
  const userId = await getCurrentUserId();

  const insumo = await prisma.insumo.findFirst({
    where: {
      id: insumoId,
      userId,
      ativo: true,
    },
    select: {
      id: true,
      conteudoEmbalagem: true,
      unidadeEmbalagem: true,
      estoqueAtual: true,
    },
  });

  if (!insumo) {
    return { error: "Não encontrei esse ingrediente." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await applyCompra({
        tx,
        userId,
        insumo: {
          id: insumo.id,
          conteudoEmbalagem: insumo.conteudoEmbalagem.toNumber(),
          unidadeEmbalagem: insumo.unidadeEmbalagem as SupportedUnit,
          estoqueAtual: insumo.estoqueAtual?.toNumber() ?? null,
        },
        quantidadeEmbalagens,
        precoTotal,
        dataCompra,
      });
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não consegui registrar a compra. Confira os campos.",
    };
  }

  revalidateInsumoPaths();

  return {
    success: "Compra registrada. Estoque e custo atualizados.",
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
