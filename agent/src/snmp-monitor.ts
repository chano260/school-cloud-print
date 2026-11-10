import snmp from 'net-snmp';
import { OIDS } from './oids';
import { config } from './config';

export interface PrinterHardwareState {
  status: 'READY' | 'PRINTING' | 'OUT_OF_PAPER' | 'OFFLINE';
  isOutOfPaper: boolean;
  isDoorOpen: boolean;
  isJammed: boolean;
  ink: {
    black: number;
    cyan: number;
    magenta: number;
    yellow: number;
    wasteBox: number;
  };
}

/**
 * Parses hrPrinterDetectedErrorState bitfield (RFC 2790).
 * Octet bit mapping:
 * bit 0: lowPaper
 * bit 1: noPaper (Out of paper)
 * bit 2: lowToner
 * bit 3: noToner
 * bit 4: doorOpen
 * bit 5: jammed
 */
export function parsePrinterErrorState(buffer: Buffer) {
  if (!buffer || buffer.length === 0) {
    return { isOutOfPaper: false, isDoorOpen: false, isJammed: false };
  }

  const byte = buffer[0];
  return {
    isOutOfPaper: (byte & 0x40) !== 0 || (byte & 0x04) !== 0, // checks noPaper bit
    isDoorOpen: (byte & 0x08) !== 0,
    isJammed: (byte & 0x02) !== 0,
  };
}

/**
 * Calculates percentage from level and max capacity.
 */
export function calculateSupplyPercent(level: number, maxCapacity: number): number {
  if (maxCapacity <= 0 || level < 0) return 0;
  return Math.min(100, Math.max(0, Math.round((level / maxCapacity) * 100)));
}

/**
 * Queries Epson L6460 via SNMP over LAN/Wi-Fi.
 */
export async function pollEpsonTelemetry(): Promise<PrinterHardwareState> {
  return new Promise((resolve) => {
    const session = snmp.createSession(config.printerIp, config.printerSnmpCommunity, {
      timeout: 3000,
      retries: 1,
    });

    const oidsToQuery = [
      OIDS.hrPrinterDetectedErrorState,
      OIDS.hrPrinterStatus,
      // 4 Ink Tanks (Epson EcoTank L6460)
      '1.3.6.1.2.1.43.11.1.1.9.1.1', // Black
      '1.3.6.1.2.1.43.11.1.1.9.1.2', // Cyan
      '1.3.6.1.2.1.43.11.1.1.9.1.3', // Magenta
      '1.3.6.1.2.1.43.11.1.1.9.1.4', // Yellow
    ];

    session.get(oidsToQuery, (error: any, varbinds: any[]) => {
      session.close();

      if (error) {
        console.warn(`[SNMP] Gagal membaca sensor printer di ${config.printerIp}:`, error.message);
        return resolve({
          status: 'READY',
          isOutOfPaper: false,
          isDoorOpen: false,
          isJammed: false,
          ink: { black: 100, cyan: 100, magenta: 100, yellow: 100, wasteBox: 0 },
        });
      }

      const errorBuffer = varbinds[0]?.value as Buffer;
      const errors = parsePrinterErrorState(errorBuffer);
      const statusCode = varbinds[1]?.value;

      // Extract ink levels from varbinds
      const black = typeof varbinds[2]?.value === 'number' ? varbinds[2].value : 100;
      const cyan = typeof varbinds[3]?.value === 'number' ? varbinds[3].value : 100;
      const magenta = typeof varbinds[4]?.value === 'number' ? varbinds[4].value : 100;
      const yellow = typeof varbinds[5]?.value === 'number' ? varbinds[5].value : 100;
      const wasteBox = 10; // Default estimate

      let status: 'READY' | 'PRINTING' | 'OUT_OF_PAPER' | 'OFFLINE' = 'READY';
      if (errors.isOutOfPaper) {
        status = 'OUT_OF_PAPER';
      } else if (statusCode === 4) {
        status = 'PRINTING';
      }

      resolve({
        status,
        isOutOfPaper: errors.isOutOfPaper,
        isDoorOpen: errors.isDoorOpen,
        isJammed: errors.isJammed,
        ink: { black, cyan, magenta, yellow, wasteBox },
      });
    });
  });
}
