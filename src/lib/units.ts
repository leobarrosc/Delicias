export type SupportedUnit = "kg" | "g" | "L" | "ml" | "duzia" | "unidade";

type UnitConfig = {
  baseUnit: SupportedUnit;
  factorToBase: number;
};

const unitConfigs: Record<SupportedUnit, UnitConfig> = {
  kg: {
    baseUnit: "g",
    factorToBase: 1000,
  },
  g: {
    baseUnit: "g",
    factorToBase: 1,
  },
  L: {
    baseUnit: "ml",
    factorToBase: 1000,
  },
  ml: {
    baseUnit: "ml",
    factorToBase: 1,
  },
  duzia: {
    baseUnit: "unidade",
    factorToBase: 12,
  },
  unidade: {
    baseUnit: "unidade",
    factorToBase: 1,
  },
};

export function normalizeToBaseUnit(
  quantity: number,
  unit: SupportedUnit,
): number {
  return quantity * unitConfigs[unit].factorToBase;
}

export function areUnitsCompatible(
  firstUnit: SupportedUnit,
  secondUnit: SupportedUnit,
): boolean {
  return getBaseUnit(firstUnit) === getBaseUnit(secondUnit);
}

export function getBaseUnit(unit: SupportedUnit): SupportedUnit {
  return unitConfigs[unit].baseUnit;
}

// Exemplos de uso:
// normalizeToBaseUnit(2, "kg") === 2000
// normalizeToBaseUnit(1.5, "L") === 1500
// normalizeToBaseUnit(3, "duzia") === 36
// areUnitsCompatible("kg", "g") === true
// areUnitsCompatible("kg", "ml") === false
// getBaseUnit("L") === "ml"
