import { describe, it, expect } from 'vitest';
import { parsePrinterErrorState, calculateSupplyPercent } from '../src/snmp-monitor';

describe('SNMP Telemetry Parser', () => {
  it('detects paper out error code from RFC 2790 bitfield', () => {
    // Byte with bit 2 (0x04) set -> out of paper
    const buffer1 = Buffer.from([0x04]);
    expect(parsePrinterErrorState(buffer1).isOutOfPaper).toBe(true);

    // Normal byte 0x00 -> no errors
    const bufferClean = Buffer.from([0x00]);
    const cleanState = parsePrinterErrorState(bufferClean);
    expect(cleanState.isOutOfPaper).toBe(false);
    expect(cleanState.isDoorOpen).toBe(false);
    expect(cleanState.isJammed).toBe(false);
  });

  it('calculates ink percentages correctly', () => {
    expect(calculateSupplyPercent(75, 100)).toBe(75);
    expect(calculateSupplyPercent(15, 100)).toBe(15);
    expect(calculateSupplyPercent(0, 100)).toBe(0);
    expect(calculateSupplyPercent(120, 100)).toBe(100);
  });
});
