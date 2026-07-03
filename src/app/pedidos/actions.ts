"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidDiaMes } from "@/lib/birthdays";
import {
  calculateEstimatedProfit,
  calculateSuggestedOrderPrice,
  roundMoney,
} from "@/lib/calculations";
import { getCurrentUserId } from "@/lib/demo-user";
import { lowerOrderStock, returnOrderStock } from "@/lib/order-stock";
import { prisma } from "@/lib/prisma";

const pedidoStatus = ["EM_ORCAMENTO", "PRODUCAO", "CONCLUIDO", "CANCELADO"] as const;

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

const optionalTextSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().optional(),
);

const optionalMoneySchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().positive("Digite um preço final maior que zero.").optional(),
);

const NOVO_CLIENTE_ID = "__novo__";
const NOVO_ANIVERSARIANTE_ID = "__novo__";

const optionalIntSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().optional(),
);

const pedidoSchema = z.object({
  id: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().optional(),
  ),
  clienteId: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().optional(),
  ),
  novoClienteNome: optionalTextSchema,
  novoClienteWhatsapp: optionalTextSchema,
  aniversarianteId: z
    .preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.string().optional(),
    ),
  novoAniversarianteNome: optionalTextSchema,
  novoAniversarianteDia: optionalIntSchema,
  novoAniversarianteMes: optionalIntSchema,
  novoAniversarianteAno: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
      .number()
      .int("Digite o ano com 4 dígitos.")
      .min(1900, "Digite um ano a partir de 1900.")
      .max(new Date().getFullYear(), "O ano não pode estar no futuro.")
      .optional(),
  ),
  novoAniversarianteOcasiao: optionalTextSchema,
  status: z.enum(pedidoStatus),
  dataEntrega: optionalDateSchema,
  multiplicadorLucro: z.coerce
    .number()
    .min(2, "Use pelo menos 2x para não vender abaixo do mínimo recomendado."),
  observacoes: optionalTextSchema,
});

const pedidoItemSchema = z.object({
  receitaId: z.string().min(1, "Escolha uma receita para o pedido."),
  quantidade: z.coerce
    .number()
    .int("Digite a quantidade em número inteiro.")
    .positive("A quantidade precisa ser maior que zero."),
  precoFinalUnitario: optionalMoneySchema,
});

export type PedidoFormState = {
  success?: string;
  error?: string;
};

function formatDecimal(value: number, decimalPlaces: number) {
  return value.toFixed(decimalPlaces);
}

function getRepeatedFormValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => value.toString());
}

function parsePedidoForm(formData: FormData) {
  const pedido = pedidoSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
    novoClienteNome: formData.get("novoClienteNome"),
    novoClienteWhatsapp: formData.get("novoClienteWhatsapp"),
    aniversarianteId: formData.get("aniversarianteId"),
    novoAniversarianteNome: formData.get("novoAniversarianteNome"),
    novoAniversarianteDia: formData.get("novoAniversarianteDia"),
    novoAniversarianteMes: formData.get("novoAniversarianteMes"),
    novoAniversarianteAno: formData.get("novoAniversarianteAno"),
    novoAniversarianteOcasiao: formData.get("novoAniversarianteOcasiao"),
    status: formData.get("status") ?? "EM_ORCAMENTO",
    dataEntrega: formData.get("dataEntrega"),
    multiplicadorLucro: formData.get("multiplicadorLucro"),
    observacoes: formData.get("observacoes"),
  });

  if (!pedido.success) {
    return {
      error: pedido.error.issues[0]?.message ?? "Confira os dados do pedido.",
    };
  }

  const receitaIds = getRepeatedFormValues(formData, "receitaId").filter(Boolean);
  const quantities = getRepeatedFormValues(formData, "quantidade");
  const finalPrices = getRepeatedFormValues(formData, "precoFinalUnitario");

  if (receitaIds.length === 0) {
    return {
      error: "Adicione pelo menos uma receita ao pedido.",
    };
  }

  if (receitaIds.length !== quantities.length) {
    return {
      error: "Confira as receitas do pedido antes de salvar.",
    };
  }

  const items = receitaIds.map((receitaId, index) =>
    pedidoItemSchema.safeParse({
      receitaId,
      quantidade: quantities[index],
      precoFinalUnitario: finalPrices[index] ?? "",
    }),
  );

  const invalidItem = items.find((item) => !item.success);

  if (invalidItem && !invalidItem.success) {
    return {
      error: invalidItem.error.issues[0]?.message ?? "Confira as receitas do pedido.",
    };
  }

  return {
    data: {
      ...pedido.data,
      itens: items.map((item) => {
        if (!item.success) {
          throw new Error("Invalid order item");
        }

        return item.data;
      }),
    },
  };
}

export async function savePedido(
  _previousState: PedidoFormState,
  formData: FormData,
): Promise<PedidoFormState> {
  const parsed = parsePedidoForm(formData);

  if (parsed.error || !parsed.data) {
    return { error: parsed.error };
  }

  const userId = await getCurrentUserId();
  const {
    id,
    clienteId,
    novoClienteNome,
    novoClienteWhatsapp,
    aniversarianteId,
    novoAniversarianteNome,
    novoAniversarianteDia,
    novoAniversarianteMes,
    novoAniversarianteAno,
    novoAniversarianteOcasiao,
    status,
    dataEntrega,
    multiplicadorLucro,
    observacoes,
    itens,
  } = parsed.data;
  const criarNovoCliente = !clienteId || clienteId === NOVO_CLIENTE_ID;
  const criarNovoAniversariante = aniversarianteId === NOVO_ANIVERSARIANTE_ID;

  if (criarNovoCliente) {
    if (!novoClienteNome || novoClienteNome.length < 2) {
      return { error: "Digite o nome do novo cliente." };
    }
  } else {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        userId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!cliente) {
      return { error: "Não encontrei esse cliente. Escolha outro cliente." };
    }

    if (aniversarianteId && !criarNovoAniversariante) {
      const aniversariante = await prisma.aniversariante.findFirst({
        where: {
          id: aniversarianteId,
          userId,
          clienteId,
        },
        select: {
          id: true,
        },
      });

      if (!aniversariante) {
        return { error: "Esse aniversariante não está ligado ao cliente escolhido." };
      }
    }
  }

  if (criarNovoAniversariante) {
    if (!novoAniversarianteNome || novoAniversarianteNome.length < 2) {
      return { error: "Digite o nome do aniversariante." };
    }

    if (
      novoAniversarianteDia === undefined ||
      novoAniversarianteMes === undefined ||
      !isValidDiaMes(novoAniversarianteDia, novoAniversarianteMes)
    ) {
      return {
        error:
          "Confira o dia e o mês do aniversariante. A data de entrega é só uma sugestão.",
      };
    }
  }

  const recipeIds = [...new Set(itens.map((item) => item.receitaId))];
  const receitas = await prisma.receita.findMany({
    where: {
      id: {
        in: recipeIds,
      },
      userId,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      custoPorUnidade: true,
    },
  });
  const receitaById = new Map(receitas.map((receita) => [receita.id, receita]));

  let calculatedItems: Array<{
    receitaId: string;
    descricao: string;
    quantidade: number;
    custoUnitario: number;
    precoSugeridoUnitario: number;
    precoFinalUnitario: number;
    custoTotal: number;
    precoSugeridoTotal: number;
    precoTotal: number;
  }>;

  try {
    calculatedItems = itens.map((item) => {
      const receita = receitaById.get(item.receitaId);

      if (!receita) {
        throw new Error("Uma das receitas escolhidas não está mais disponível.");
      }

      const custoUnitario = receita.custoPorUnidade.toNumber();
      const precoSugeridoUnitario = calculateSuggestedOrderPrice({
        cost: custoUnitario,
        profitMultiplier: multiplicadorLucro,
      });
      const precoFinalUnitario =
        item.precoFinalUnitario === undefined
          ? precoSugeridoUnitario
          : roundMoney(item.precoFinalUnitario);
      const custoTotal = roundMoney(custoUnitario * item.quantidade);
      const precoSugeridoTotal = roundMoney(
        precoSugeridoUnitario * item.quantidade,
      );
      const precoTotal = roundMoney(precoFinalUnitario * item.quantidade);

      return {
        receitaId: item.receitaId,
        descricao: receita.nome,
        quantidade: item.quantidade,
        custoUnitario,
        precoSugeridoUnitario,
        precoFinalUnitario,
        custoTotal,
        precoSugeridoTotal,
        precoTotal,
      };
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não consegui calcular o pedido. Confira as receitas e quantidades.",
    };
  }

  const custoTotal = roundMoney(
    calculatedItems.reduce((total, item) => total + item.custoTotal, 0),
  );
  const precoSugeridoTotal = roundMoney(
    calculatedItems.reduce((total, item) => total + item.precoSugeridoTotal, 0),
  );
  const precoTotal = roundMoney(
    calculatedItems.reduce((total, item) => total + item.precoTotal, 0),
  );
  const lucroEstimado = calculateEstimatedProfit({
    cost: custoTotal,
    price: precoTotal,
  });

  try {
    await prisma.$transaction(async (tx) => {
      const clienteIdFinal = criarNovoCliente
        ? (
            await tx.cliente.create({
              data: {
                userId,
                nome: novoClienteNome as string,
                whatsapp: novoClienteWhatsapp ?? null,
              },
              select: {
                id: true,
              },
            })
          ).id
        : (clienteId as string);

      const aniversarianteIdFinal = criarNovoAniversariante
        ? (
            await tx.aniversariante.create({
              data: {
                userId,
                clienteId: clienteIdFinal,
                nome: novoAniversarianteNome as string,
                dia: novoAniversarianteDia as number,
                mes: novoAniversarianteMes as number,
                ano: novoAniversarianteAno ?? null,
                ocasiao: novoAniversarianteOcasiao ?? "Aniversário",
              },
              select: {
                id: true,
              },
            })
          ).id
        : criarNovoCliente
          ? null
          : aniversarianteId ?? null;

      const pedidoData = {
        clienteId: clienteIdFinal,
        aniversarianteId: aniversarianteIdFinal,
        status,
        dataEntrega: dataEntrega ?? null,
        multiplicadorLucro: formatDecimal(Math.max(multiplicadorLucro, 2), 2),
        custoTotalSnapshot: formatDecimal(custoTotal, 2),
        precoSugeridoSnapshot: formatDecimal(precoSugeridoTotal, 2),
        precoTotalSnapshot: formatDecimal(precoTotal, 2),
        lucroEstimadoSnapshot: formatDecimal(lucroEstimado, 2),
        observacoes: observacoes ?? null,
      };
      const itensData = calculatedItems.map((item) => ({
        userId,
        receitaId: item.receitaId,
        descricao: item.descricao,
        quantidade: item.quantidade,
        custoUnitarioSnapshot: formatDecimal(item.custoUnitario, 2),
        precoSugeridoUnitarioSnapshot: formatDecimal(
          item.precoSugeridoUnitario,
          2,
        ),
        precoUnitarioSnapshot: formatDecimal(item.precoFinalUnitario, 2),
        custoTotalSnapshot: formatDecimal(item.custoTotal, 2),
        precoSugeridoTotalSnapshot: formatDecimal(item.precoSugeridoTotal, 2),
        precoTotalSnapshot: formatDecimal(item.precoTotal, 2),
      }));

      if (id) {
        const existente = await tx.pedido.findFirst({
          where: {
            id,
            userId,
          },
          select: {
            estoqueBaixado: true,
          },
        });

        if (!existente) {
          throw new Error("Não encontrei esse pedido para editar.");
        }

        // O estoque antigo precisa voltar antes de trocar os itens; depois
        // baixa de novo se o pedido seguir em produção (ou concluído já baixado).
        const haviaBaixado = existente.estoqueBaixado;

        if (haviaBaixado) {
          await returnOrderStock({
            tx,
            pedidoId: id,
            userId,
          });
        }

        await tx.pedidoItem.deleteMany({
          where: {
            pedidoId: id,
            userId,
          },
        });

        await tx.pedido.update({
          where: {
            id,
          },
          data: {
            ...pedidoData,
            itens: {
              create: itensData,
            },
          },
        });

        if (
          status === "PRODUCAO" ||
          (haviaBaixado && status === "CONCLUIDO")
        ) {
          await lowerOrderStock({
            tx,
            pedidoId: id,
            userId,
          });
        }
      } else {
        const pedido = await tx.pedido.create({
          data: {
            userId,
            ...pedidoData,
            itens: {
              create: itensData,
            },
          },
          select: {
            id: true,
          },
        });

        if (status === "PRODUCAO") {
          await lowerOrderStock({
            tx,
            pedidoId: pedido.id,
            userId,
          });
        }
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não consegui salvar o pedido. Confira os campos e tente de novo.",
    };
  }

  revalidatePath("/");
  revalidatePath("/pedidos");
  revalidatePath("/insumos");

  if (criarNovoCliente || criarNovoAniversariante) {
    revalidatePath("/clientes");
  }

  return {
    success: id
      ? "Pedido atualizado com sucesso."
      : criarNovoCliente
        ? "Pedido salvo e cliente cadastrado com sucesso."
        : "Pedido salvo com sucesso.",
  };
}

export async function deletePedido(formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        estoqueBaixado: true,
        estoqueDevolvido: true,
      },
    });

    if (!pedido) {
      return;
    }

    if (pedido.estoqueBaixado && !pedido.estoqueDevolvido) {
      await returnOrderStock({
        tx,
        pedidoId: id,
        userId,
      });
    }

    await tx.pedidoItem.deleteMany({
      where: {
        pedidoId: id,
        userId,
      },
    });

    await tx.pedido.delete({
      where: {
        id,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/pedidos");
  revalidatePath("/insumos");
  revalidatePath("/financeiro");
}

export async function updatePedidoStatus(formData: FormData) {
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();

  if (!id || !pedidoStatus.includes(status as (typeof pedidoStatus)[number])) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.$transaction(async (tx) => {
    await tx.pedido.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        status: status as (typeof pedidoStatus)[number],
      },
    });

    if (status === "PRODUCAO") {
      await lowerOrderStock({
        tx,
        pedidoId: id,
        userId,
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/pedidos");
  revalidatePath("/insumos");
}

export async function returnPedidoStock(formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return;
  }

  const userId = await getCurrentUserId();

  await prisma.$transaction(async (tx) => {
    await returnOrderStock({
      tx,
      pedidoId: id,
      userId,
    });
  });

  revalidatePath("/pedidos");
  revalidatePath("/insumos");
}
