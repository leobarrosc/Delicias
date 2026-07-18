import { fillTemplate } from "@/lib/config";

export function normalizeWhatsApp(value: string | null): string {
  const digits = value?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function buildWhatsAppLink(
  whatsapp: string | null,
  message: string,
): string {
  const phone = normalizeWhatsApp(whatsapp);

  if (!phone) {
    return "";
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppBirthdayLink({
  whatsapp,
  aniversarianteNome,
  clienteNome,
  ocasiao,
  template,
}: {
  whatsapp: string | null;
  aniversarianteNome: string;
  clienteNome: string;
  ocasiao: string;
  template: string;
}): string {
  const message = fillTemplate(template, {
    aniversariante: aniversarianteNome,
    cliente: clienteNome,
    ocasiao: ocasiao.toLowerCase(),
  });

  return buildWhatsAppLink(whatsapp, message);
}
