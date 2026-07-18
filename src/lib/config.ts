import { prisma } from "@/lib/prisma";

export const DEFAULT_MENSAGEM_ANIVERSARIO =
  "Olá {cliente}! Vi aqui que o aniversário de {aniversariante} está chegando e queria te mostrar algumas opções de doces e bolos para a data.";

export const DEFAULT_MENSAGEM_PEDIDO =
  "Olá {cliente}! Passando para confirmar os detalhes do seu pedido. Qualquer coisa, é só chamar.";

export type ConfiguracaoResolvida = {
  fretePadrao: number;
  mensagemAniversario: string;
  mensagemPedido: string;
};

// Leitura pura: se ainda não há linha de configuração, devolve os padrões
// sem gravar nada. A gravação acontece só quando a usuária salva.
export async function getConfiguracao(
  userId: string,
): Promise<ConfiguracaoResolvida> {
  const config = await prisma.configuracaoUsuario.findUnique({
    where: {
      userId,
    },
  });

  return {
    fretePadrao: config?.fretePadrao.toNumber() ?? 0,
    mensagemAniversario:
      config?.mensagemAniversario ?? DEFAULT_MENSAGEM_ANIVERSARIO,
    mensagemPedido: config?.mensagemPedido ?? DEFAULT_MENSAGEM_PEDIDO,
  };
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key] : match,
  );
}
