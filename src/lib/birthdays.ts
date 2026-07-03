export const OCASIAO_OPTIONS = [
  "Aniversário",
  "Bodas de casamento",
  "Outra data especial",
] as const;

export const MES_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
] as const;

// 29 em fevereiro é permitido no cadastro; ano não bissexto celebra em 28/02.
const MAX_DIAS_POR_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isValidDiaMes(dia: number, mes: number): boolean {
  if (!Number.isInteger(dia) || !Number.isInteger(mes)) {
    return false;
  }

  if (mes < 1 || mes > 12) {
    return false;
  }

  return dia >= 1 && dia <= MAX_DIAS_POR_MES[mes - 1];
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function buildOccurrence(dia: number, mes: number, year: number): Date {
  const effectiveDay = dia === 29 && mes === 2 && !isLeapYear(year) ? 28 : dia;

  return new Date(year, mes - 1, effectiveDay);
}

export function getNextOccurrence(
  dia: number,
  mes: number,
  referenceDate: Date,
): Date {
  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const thisYear = buildOccurrence(dia, mes, referenceDate.getFullYear());

  return thisYear >= startOfToday
    ? thisYear
    : buildOccurrence(dia, mes, referenceDate.getFullYear() + 1);
}

export function formatDiaMes(dia: number, mes: number, ano?: number | null) {
  const base = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`;

  return ano ? `${base}/${ano}` : base;
}

export function getIdadeNaProximaOcorrencia(
  ano: number | null | undefined,
  proximaOcorrencia: Date,
): number | null {
  if (!ano) {
    return null;
  }

  return proximaOcorrencia.getFullYear() - ano;
}
