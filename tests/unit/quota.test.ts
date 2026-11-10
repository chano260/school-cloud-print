import { describe, it, expect } from 'vitest';
import { calculatePhysicalSheets } from '@/lib/pdf-calculator';

describe('Quota & Sheet Calculations', () => {
  it('calculates single-sided copies correctly', () => {
    // 5 pages, 1 copy = 5 sheets
    expect(calculatePhysicalSheets(5, 1, false)).toBe(5);
    // 5 pages, 2 copies = 10 sheets
    expect(calculatePhysicalSheets(5, 2, false)).toBe(10);
  });

  it('calculates duplex (bolak-balik) sheets with ceiling rounding', () => {
    // 5 pages duplex = ceil(5/2) = 3 sheets per copy * 2 copies = 6 sheets
    expect(calculatePhysicalSheets(5, 2, true)).toBe(6);
    // 4 pages duplex = ceil(4/2) = 2 sheets * 1 copy = 2 sheets
    expect(calculatePhysicalSheets(4, 1, true)).toBe(2);
  });

  it('handles edge cases gracefully', () => {
    expect(calculatePhysicalSheets(0, 1, false)).toBe(0);
    expect(calculatePhysicalSheets(10, 0, false)).toBe(0);
  });
});
