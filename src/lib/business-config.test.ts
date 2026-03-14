import { describe, it, expect } from 'vitest';
import { MOTORCYCLES, PRICING, PAYMENT_METHODS, UNIVERSAL_INCLUSIONS, BUSINESS_NAME } from './business-config';

describe('business config integrity', () => {
  describe('motorcycles', () => {
    it('has exactly 3 motorcycles', () => {
      expect(MOTORCYCLES).toHaveLength(3);
    });

    it('each motorcycle has required fields', () => {
      for (const moto of MOTORCYCLES) {
        expect(moto.slug).toBeTruthy();
        expect(moto.name).toBeTruthy();
        expect(moto.brand).toBeTruthy();
        expect(moto.model).toBeTruthy();
        expect(moto.color).toBeTruthy();
        expect(moto.transmission).toMatch(/^(Manual|Automatic)$/);
        expect(moto.imagePath).toMatch(/^\/images\/.*\.(jpg|webp)$/);
      }
    });

    it('slugs are unique', () => {
      const slugs = MOTORCYCLES.map(m => m.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });

  describe('pricing', () => {
    it('daily rate is positive', () => {
      expect(PRICING.dailyRateUsd).toBeGreaterThan(0);
    });

    it('monthly rate is less than 30 * daily rate', () => {
      expect(PRICING.monthlyRateUsd).toBeLessThan(30 * PRICING.dailyRateUsd);
    });

    it('weekly discount is between 0 and 100', () => {
      expect(PRICING.weeklyDiscountPct).toBeGreaterThan(0);
      expect(PRICING.weeklyDiscountPct).toBeLessThan(100);
    });

    it('biweekly discount is greater than weekly', () => {
      expect(PRICING.biweeklyDiscountPct).toBeGreaterThan(PRICING.weeklyDiscountPct);
    });

    it('security deposit is positive', () => {
      expect(PRICING.securityDepositUsd).toBeGreaterThan(0);
    });
  });

  describe('payment methods', () => {
    it('has at least one payment method', () => {
      expect(PAYMENT_METHODS.length).toBeGreaterThan(0);
    });

    it('each method has a type', () => {
      for (const method of PAYMENT_METHODS) {
        expect(method.type).toBeTruthy();
      }
    });
  });

  describe('inclusions', () => {
    it('has at least one inclusion', () => {
      expect(UNIVERSAL_INCLUSIONS.length).toBeGreaterThan(0);
    });
  });

  describe('business identity', () => {
    it('has a business name', () => {
      expect(BUSINESS_NAME).toBeTruthy();
    });
  });
});
