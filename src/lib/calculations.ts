import { normalizeToBaseUnit, type SupportedUnit } from "@/lib/units";

const MONEY_DECIMAL_PLACES = 2;
const UNIT_COST_DECIMAL_PLACES = 4;
const PERCENT_DECIMAL_PLACES = 2;
const MINIMUM_PROFIT_MULTIPLIER = 2;

function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function roundMoney(value: number): number {
  return roundToDecimalPlaces(value, MONEY_DECIMAL_PLACES);
}

export function roundUnitCost(value: number): number {
  return roundToDecimalPlaces(value, UNIT_COST_DECIMAL_PLACES);
}

export function calculateInsumoBaseUnitCost({
  totalCost,
  quantity,
  unit,
}: {
  totalCost: number;
  quantity: number;
  unit: SupportedUnit;
}): number {
  const baseQuantity = normalizeToBaseUnit(quantity, unit);

  if (baseQuantity <= 0) {
    return 0;
  }

  return roundUnitCost(totalCost / baseQuantity);
}

export function calculateRecipeItemCost({
  baseUnitCost,
  quantity,
  unit,
}: {
  baseUnitCost: number;
  quantity: number;
  unit: SupportedUnit;
}): number {
  const baseQuantity = normalizeToBaseUnit(quantity, unit);

  return roundMoney(baseUnitCost * baseQuantity);
}

export function calculateRecipeTotalCost(itemCosts: number[]): number {
  const totalCost = itemCosts.reduce((total, itemCost) => total + itemCost, 0);

  return roundMoney(totalCost);
}

export function calculateRecipeUnitCost({
  totalCost,
  yieldQuantity,
}: {
  totalCost: number;
  yieldQuantity: number;
}): number {
  if (yieldQuantity <= 0) {
    return 0;
  }

  return roundMoney(totalCost / yieldQuantity);
}

export function calculateSuggestedOrderPrice({
  cost,
  profitMultiplier = MINIMUM_PROFIT_MULTIPLIER,
}: {
  cost: number;
  profitMultiplier?: number;
}): number {
  const safeMultiplier = Math.max(profitMultiplier, MINIMUM_PROFIT_MULTIPLIER);

  return roundMoney(cost * safeMultiplier);
}

export function calculateEstimatedProfit({
  price,
  cost,
}: {
  price: number;
  cost: number;
}): number {
  return roundMoney(price - cost);
}

export function calculateProfitMargin({
  price,
  cost,
}: {
  price: number;
  cost: number;
}): number {
  if (price <= 0) {
    return 0;
  }

  const profit = calculateEstimatedProfit({ price, cost });

  return roundToDecimalPlaces((profit / price) * 100, PERCENT_DECIMAL_PLACES);
}

// Exemplos de uso:
// calculateInsumoBaseUnitCost({ totalCost: 12, quantity: 1, unit: "kg" }) === 0.012
// calculateRecipeItemCost({ baseUnitCost: 0.012, quantity: 250, unit: "g" }) === 3
// calculateRecipeTotalCost([3, 5.5, 1.25]) === 9.75
// calculateRecipeUnitCost({ totalCost: 30, yieldQuantity: 10 }) === 3
// calculateSuggestedOrderPrice({ cost: 40, profitMultiplier: 1.5 }) === 80
// calculateEstimatedProfit({ price: 100, cost: 40 }) === 60
// calculateProfitMargin({ price: 100, cost: 40 }) === 60
