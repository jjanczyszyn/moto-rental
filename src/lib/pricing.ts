import { PRICING } from './business-config';

export interface PricingBreakdown {
  days: number;
  dailyRate: number;
  baseSubtotal: number;
  discountLabel: string | null;
  discountAmount: number;
  rentalTotal: number;
  securityDeposit: number;
  totalDue: number;
}

export function calculatePricing(days: number): PricingBreakdown {
  const dailyRate = PRICING.dailyRateUsd;
  const baseSubtotal = days * dailyRate;
  let discountLabel: string | null = null;
  let discountAmount = 0;

  if (days >= 7) {
    const candidates: { total: number; label: string }[] = [];

    // Weekly discount (7+ days)
    candidates.push({
      total: baseSubtotal * (1 - PRICING.weeklyDiscountPct / 100),
      label: `${PRICING.weeklyDiscountPct}% weekly discount`,
    });

    // Biweekly discount (14+ days)
    if (days >= 14) {
      candidates.push({
        total: baseSubtotal * (1 - PRICING.biweeklyDiscountPct / 100),
        label: `${PRICING.biweeklyDiscountPct}% two-week discount`,
      });
    }

    // Monthly rate — consider if cheaper
    const fullMonths = Math.ceil(days / 30);
    const monthlyTotal = fullMonths * PRICING.monthlyRateUsd;
    if (monthlyTotal < baseSubtotal) {
      candidates.push({
        total: monthlyTotal,
        label: 'Monthly rate',
      });
    }

    // Pick the cheapest
    const best = candidates.reduce((a, b) => a.total < b.total ? a : b);
    discountAmount = baseSubtotal - best.total;
    discountLabel = best.label;

    if (discountAmount <= 0) {
      discountAmount = 0;
      discountLabel = null;
    }
  }

  const rentalTotal = baseSubtotal - discountAmount;
  const securityDeposit = PRICING.securityDepositUsd;
  const totalDue = rentalTotal + securityDeposit;

  return {
    days,
    dailyRate,
    baseSubtotal,
    discountLabel,
    discountAmount: Math.round(discountAmount * 100) / 100,
    rentalTotal: Math.round(rentalTotal * 100) / 100,
    securityDeposit,
    totalDue: Math.round(totalDue * 100) / 100,
  };
}
