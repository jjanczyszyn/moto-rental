import { describe, it, expect } from 'vitest';
import { calculatePricing } from './pricing';

describe('calculatePricing', () => {
  // Daily rate: $20, deposit: $100
  // Weekly: 10% off, Biweekly: 18% off, Monthly: $400 cap

  describe('no discount (< 7 days)', () => {
    it('calculates 1-day rental', () => {
      const result = calculatePricing(1);
      expect(result.days).toBe(1);
      expect(result.dailyRate).toBe(20);
      expect(result.baseSubtotal).toBe(20);
      expect(result.discountLabel).toBeNull();
      expect(result.discountAmount).toBe(0);
      expect(result.rentalTotal).toBe(20);
      expect(result.securityDeposit).toBe(100);
      expect(result.totalDue).toBe(120);
    });

    it('calculates 6-day rental (no discount)', () => {
      const result = calculatePricing(6);
      expect(result.baseSubtotal).toBe(120);
      expect(result.discountAmount).toBe(0);
      expect(result.rentalTotal).toBe(120);
      expect(result.totalDue).toBe(220);
    });

    it('calculates 3-day rental', () => {
      const result = calculatePricing(3);
      expect(result.baseSubtotal).toBe(60);
      expect(result.totalDue).toBe(160);
    });
  });

  describe('weekly discount (7-13 days)', () => {
    it('applies 10% weekly discount at exactly 7 days', () => {
      const result = calculatePricing(7);
      expect(result.baseSubtotal).toBe(140);
      expect(result.discountLabel).toBe('10% weekly discount');
      expect(result.discountAmount).toBe(14);
      expect(result.rentalTotal).toBe(126);
      expect(result.totalDue).toBe(226);
    });

    it('applies 10% weekly discount at 10 days', () => {
      const result = calculatePricing(10);
      expect(result.baseSubtotal).toBe(200);
      expect(result.discountAmount).toBe(20);
      expect(result.rentalTotal).toBe(180);
    });

    it('applies 10% weekly discount at 13 days', () => {
      const result = calculatePricing(13);
      expect(result.baseSubtotal).toBe(260);
      expect(result.discountAmount).toBe(26);
      expect(result.rentalTotal).toBe(234);
    });
  });

  describe('biweekly discount (14-19 days)', () => {
    it('applies 18% biweekly discount at exactly 14 days', () => {
      const result = calculatePricing(14);
      expect(result.baseSubtotal).toBe(280);
      expect(result.discountLabel).toBe('18% two-week discount');
      expect(result.discountAmount).toBe(50.4);
      expect(result.rentalTotal).toBe(229.6);
    });

    it('applies 18% biweekly discount at 19 days', () => {
      const result = calculatePricing(19);
      expect(result.baseSubtotal).toBe(380);
      expect(result.discountAmount).toBe(68.4);
      expect(result.rentalTotal).toBe(311.6);
    });
  });

  describe('monthly rate (20+ days)', () => {
    it('applies monthly rate when cheaper than biweekly discount', () => {
      const result = calculatePricing(30);
      // Base: 30 * $20 = $600
      // Biweekly: $600 * 0.82 = $492
      // Monthly: ceil(30/30) * $400 = $400 — cheapest
      expect(result.baseSubtotal).toBe(600);
      expect(result.discountLabel).toBe('Monthly rate');
      expect(result.discountAmount).toBe(200);
      expect(result.rentalTotal).toBe(400);
      expect(result.totalDue).toBe(500);
    });

    it('applies monthly rate at 25 days (monthly cheaper than biweekly)', () => {
      const result = calculatePricing(25);
      // Base: 25 * $20 = $500
      // Biweekly: $500 * 0.82 = $410
      // Monthly: ceil(25/30) * $400 = $400 — cheapest
      expect(result.baseSubtotal).toBe(500);
      expect(result.discountLabel).toBe('Monthly rate');
      expect(result.rentalTotal).toBe(400);
    });

    it('applies monthly rate for multi-month rental', () => {
      const result = calculatePricing(60);
      // Base: 60 * $20 = $1200
      // Monthly: ceil(60/30) * $400 = $800
      expect(result.baseSubtotal).toBe(1200);
      expect(result.discountLabel).toBe('Monthly rate');
      expect(result.rentalTotal).toBe(800);
      expect(result.totalDue).toBe(900);
    });
  });

  describe('edge cases', () => {
    it('handles 0 days', () => {
      const result = calculatePricing(0);
      expect(result.baseSubtotal).toBe(0);
      expect(result.rentalTotal).toBe(0);
      expect(result.totalDue).toBe(100); // deposit only
    });

    it('always includes security deposit', () => {
      for (const days of [1, 7, 14, 30]) {
        const result = calculatePricing(days);
        expect(result.securityDeposit).toBe(100);
      }
    });

    it('rounds to 2 decimal places', () => {
      const result = calculatePricing(14);
      expect(result.discountAmount).toBe(50.4);
      expect(result.rentalTotal).toBe(229.6);
      expect(result.totalDue).toBe(329.6);
    });
  });
});
