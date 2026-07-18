import {
  ReceitasClient,
  type ReceitaResumo,
} from "@/app/receitas/receitas-client";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReceitasPage() {
  const userId = await getCurrentUserId();
  const [insumos, categorias, receitas] = await Promise.all([
    prisma.insumo.findMany({
      where: { userId, ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        unidadeBase: true,
        custoUnitarioBase: true,
      },
    }),
    prisma.categoriaReceita.findMany({
      where: { userId },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    // Só o resumo de cada receita — nada de itens aqui. O detalhe é buscado
    // sob demanda quando a usuária abre uma receita.
    prisma.receita.findMany({
      where: { userId, ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        rendimento: true,
        custoTotalAtual: true,
        custoPorUnidade: true,
        atualizarCustoAutomaticamente: true,
        categoria: { select: { nome: true } },
        _count: { select: { itens: true } },
      },
    }),
  ]);

  const insumoOptions = insumos.map((insumo) => ({
    id: insumo.id,
    nome: insumo.nome,
    unidadeBase: insumo.unidadeBase,
    custoUnitarioBase: insumo.custoUnitarioBase.toString(),
  }));

  const receitasResumo: ReceitaResumo[] = receitas.map((receita) => ({
    id: receita.id,
    nome: receita.nome,
    fotoUrl: receita.fotoUrl,
    categoriaNome: receita.categoria?.nome ?? null,
    custoTotal: receita.custoTotalAtual.toNumber(),
    custoPorUnidade: receita.custoPorUnidade.toNumber(),
    rendimento: receita.rendimento,
    itensCount: receita._count.itens,
    atualizacaoAutomatica: receita.atualizarCustoAutomaticamente,
  }));

  return (
    <ReceitasClient
      insumos={insumoOptions}
      categorias={categorias}
      receitas={receitasResumo}
    />
  );
}
