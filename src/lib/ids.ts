// crypto.randomUUID só existe em contextos seguros (HTTPS ou localhost).
// Ao acessar o dev server pela rede (http://192.168.1.x), ela é undefined,
// então usamos um fallback simples — os ids são só chaves locais de lista.
export function generateLocalId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
