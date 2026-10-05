import { describe, it, expect } from 'vitest';
import { formatRupees } from '../lib/money';
import { periodToRange } from '../lib/analytics/period';
import { discountSuggestion } from '../lib/analytics/expiry';

describe('formatRupees', () => {
  it('formats 12450000 paise as ₹1,24,500', () => {
    expect(formatRupees(12450000)).toBe('₹1,24,500');
  });
});

describe('periodToRange', () => {
  it('today range starts at midnight', () => {
    const { from, to } = periodToRange('today');
    expect(from.getHours()).toBe(0);
    expect(to >= from).toBe(true);
  });
});

describe('discountSuggestion', () => {
  it('suggests 10% for 8 days to expiry', () => {
    const r = discountSuggestion({ unitCostPaise: 8000, sellingPricePaise: 10000, daysToExpiry: 8, predictedUnsold: 5 });
    expect(r.discountPct).toBe(10);
  });
  it('suggests 30% for 2 days to expiry', () => {
    const r = discountSuggestion({ unitCostPaise: 8000, sellingPricePaise: 10000, daysToExpiry: 2, predictedUnsold: 5 });
    expect(r.discountPct).toBe(30);
  });
  it('never goes below cost', () => {
    const r = discountSuggestion({ unitCostPaise: 9500, sellingPricePaise: 10000, daysToExpiry: 1, predictedUnsold: 5 });
    expect(r.suggestedPricePaise).toBeGreaterThanOrEqual(9500);
  });
});
