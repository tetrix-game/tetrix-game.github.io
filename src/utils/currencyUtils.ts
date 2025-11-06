export interface CurrencyDenomination {
  name: string;
  symbol: string;
  value: number;
  color: string;
}

export const CURRENCY_DENOMINATIONS: CurrencyDenomination[] = [
  { name: 'Diamond', symbol: '💎', value: 1000000000000000, color: '#b9f2ff' }, // Quadrillions
  { name: 'Sapphire', symbol: '💙', value: 1000000000000, color: '#4169e1' }, // Trillions
  { name: 'Ruby', symbol: '♦️', value: 1000000000, color: '#e0115f' }, // Billions
  { name: 'Gold', symbol: '🥇', value: 1000000, color: '#ffd700' }, // Millions
  { name: 'Silver', symbol: '🥈', value: 1000, color: '#c0c0c0' }, // Thousands
  { name: 'Bronze', symbol: '🥉', value: 1, color: '#cd7f32' }, // Ones
];

export interface CurrencyBreakdown {
  denomination: CurrencyDenomination;
  count: number;
}

/**
 * Converts a point value into currency denominations
 * Only returns denominations where the user has at least one coin
 */
export function convertPointsToCurrency(points: number): CurrencyBreakdown[] {
  if (points === 0) {
    return [];
  }

  const breakdown: CurrencyBreakdown[] = [];
  let remainingPoints = Math.floor(points);

  for (const denomination of CURRENCY_DENOMINATIONS) {
    if (remainingPoints >= denomination.value) {
      const count = Math.floor(remainingPoints / denomination.value);
      breakdown.push({
        denomination,
        count
      });
      remainingPoints -= count * denomination.value;
    }
  }

  return breakdown;
}

/**
 * Formats a currency breakdown for display
 * Shows "lots💎" if user has more than 999 diamonds, otherwise shows the top 2 highest value currencies
 */
export function formatCurrencyBreakdown(breakdown: CurrencyBreakdown[]): string {
  if (breakdown.length === 0) {
    return '0';
  }

  // Check if user has more than 999 diamonds
  const diamondBreakdown = breakdown.find(b => b.denomination.name === 'Diamond');
  if (diamondBreakdown && diamondBreakdown.count > 999) {
    return `lots${diamondBreakdown.denomination.symbol}`;
  }

  // Take only the top 2 currencies (highest value first)
  const topCurrencies = breakdown.slice(0, 2);

  return topCurrencies
    .map(({ denomination, count }) => `${count.toLocaleString()}${denomination.symbol}`)
    .join(' ');
}

/**
 * Gets the display color for the highest value currency the user has
 */
export function getHighestCurrencyColor(points: number): string {
  const breakdown = convertPointsToCurrency(points);
  if (breakdown.length === 0) {
    return '#00ff88'; // Default green
  }

  return breakdown[0].denomination.color;
}