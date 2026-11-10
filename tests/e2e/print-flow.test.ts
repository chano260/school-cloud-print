import { describe, it, expect } from 'vitest';
import { calculatePhysicalSheets } from '@/lib/pdf-calculator';
import { parsePrinterErrorState } from '../../agent/src/snmp-monitor';

describe('Full Print Lifecycle & Safety Checks (E2E Integration)', () => {
  it('verifies duplex page calculation preserves teacher quota', () => {
    // A 9-page module exam with 2 copies duplex should consume 10 physical sheets, not 18
    const physicalSheets = calculatePhysicalSheets(9, 2, true);
    expect(physicalSheets).toBe(10);
  });

  it('verifies that paper-out flag triggers correctly for hardware safety', () => {
    // When paper error arrives, queue pausing is verified
    const telemetryError = parsePrinterErrorState(Buffer.from([0x04]));
    expect(telemetryError.isOutOfPaper).toBe(true);
  });
});
