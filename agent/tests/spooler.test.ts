import { describe, it, expect } from 'vitest';
import { buildPrintOptions } from '../src/spooler';

describe('Spooler Option Formatter', () => {
  it('formats printer options for duplex and color', () => {
    const opts = buildPrintOptions({
      printer: 'EPSON L6460 Series',
      copies: 3,
      isDuplex: true,
      isColor: true,
    });

    expect(opts.printer).toBe('EPSON L6460 Series');
    expect(opts.copies).toBe(3);
    expect(opts.side).toBe('duplex');
    expect(opts.monochrome).toBe(false);
  });

  it('formats single-sided monochrome options correctly', () => {
    const opts = buildPrintOptions({
      printer: 'EPSON L6460 Series',
      copies: 1,
      isDuplex: false,
      isColor: false,
    });

    expect(opts.side).toBe('simplex');
    expect(opts.monochrome).toBe(true);
  });
});
