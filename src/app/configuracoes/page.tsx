import { ImageOff, Tag, Trash2 } from "lucide-react";
import {
  CategoriaAddForm,
  ConfiguracaoGeralForm,
  MarcaAddForm,
} from "@/app/configuracoes/config-client";
import {
  excluirCategoriaReceita,
  excluirMarca,
} from "@/app/configuracoes/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getConfiguracao } from "@/lib/config";
import { getCurrentUserId } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-stone-200 bg-card p-4 shadow-sm md:p-5">
      <div className="mb-2 border-b-2 border-stone-200 pb-2">
        <h2 className="text-lg font-medium text-stone-700">{title}</h2>
      </div>
      <p className="mb-4 text-sm text-stone-500">{description}</p>
      {children}
    </section>
  );
}

export default async function ConfiguracoesPage() {
  const userId = await getCurrentUserId();
  const [config, categorias, marcas] = await Promise.all([
    getConfiguracao(userId),
    prisma.categoriaReceita.findMany({
      where: { userId },
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: { receitas: true },
        },
      },
    }),
    prisma.marca.findMany({
      where: { userId },
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: { insumos: true },
        },
      },
    }),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel
        title="Geral e mensagens"
        description="Frete padrão dos pedidos e as mensagens de WhatsApp usadas na plataforma."
      >
        <ConfiguracaoGeralForm
          fretePadrao={config.fretePadrao.toString()}
          mensagemAniversario={config.mensagemAniversario}
          mensagemPedido={config.mensagemPedido}
        />
      </Panel>

      <div className="space-y-6">
        <Panel
          title="Categorias de receitas"
          description="Organize suas receitas por tipo (bolos, doces, salgados...)."
        >
          <CategoriaAddForm />

          {categorias.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              Nenhuma categoria ainda.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-200">
              {categorias.map((categoria) => (
                <li
                  key={categoria.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm text-stone-900">
                    <Tag className="size-4 text-brand-500" aria-hidden="true" />
                    {categoria.nome}
                    <span className="text-xs text-stone-500">
                      ({categoria._count.receitas} receita
                      {categoria._count.receitas === 1 ? "" : "s"})
                    </span>
                  </span>
                  <form action={excluirCategoriaReceita}>
                    <input type="hidden" name="id" value={categoria.id} />
                    <ConfirmSubmitButton
                      message={`Excluir a categoria ${categoria.nome}? As receitas continuam, mas ficam sem categoria.`}
                      className="inline-flex size-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Marcas"
          description="Cadastre marcas com logo para reaproveitar nos ingredientes."
        >
          <MarcaAddForm />

          {marcas.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">Nenhuma marca ainda.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-200">
              {marcas.map((marca) => (
                <li
                  key={marca.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="flex items-center gap-3 text-sm text-stone-900">
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                      {marca.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={marca.logoUrl}
                          alt={marca.nome}
                          className="size-full object-contain"
                        />
                      ) : (
                        <ImageOff
                          className="size-4 text-stone-400"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span>
                      {marca.nome}
                      <span className="block text-xs text-stone-500">
                        {marca._count.insumos} ingrediente
                        {marca._count.insumos === 1 ? "" : "s"}
                      </span>
                    </span>
                  </span>
                  <form action={excluirMarca}>
                    <input type="hidden" name="id" value={marca.id} />
                    <ConfirmSubmitButton
                      message={`Excluir a marca ${marca.nome}? Os ingredientes continuam, mas ficam sem marca.`}
                      className="inline-flex size-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
