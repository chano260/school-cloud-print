import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Prisma Schema Validation', () => {
  it('should define all core application models', () => {
    const prisma = new PrismaClient();
    expect(prisma.employeeWhitelist).toBeDefined();
    expect(prisma.dailyQuota).toBeDefined();
    expect(prisma.printJob).toBeDefined();
    expect(prisma.printerTelemetry).toBeDefined();
  });
});
