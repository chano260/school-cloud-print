export type PrintJobStatus =
  | 'QUEUED'
  | 'LOCKED'
  | 'RELEASED'
  | 'PRINTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED';

export type PrinterStatus =
  | 'READY'
  | 'PRINTING'
  | 'OUT_OF_PAPER'
  | 'OFFLINE';

export interface InkLevels {
  black: number;
  cyan: number;
  magenta: number;
  yellow: number;
  wasteBox: number;
}

export interface WhitelistEntry {
  name: string;
  email: string;
  dailyQuota?: number;
  isAdmin?: boolean;
}

export interface PrintOptions {
  copies: number;
  isColor: boolean;
  isDuplex: boolean;
  isLocked: boolean;
}

export interface TelemetryPayload {
  status: PrinterStatus;
  ink: InkLevels;
  timestamp: string;
}
