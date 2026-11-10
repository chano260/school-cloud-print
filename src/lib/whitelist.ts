import { prisma } from './prisma';
import { WhitelistEntry } from '@/types';

/**
 * Validates whether an email belongs to an authorized school employee.
 * Strictly blocks student domains (@siswa.*.belajar.id).
 */
export async function validateEmployeeAccess(email: string): Promise<{
  allowed: boolean;
  isAdmin: boolean;
  name?: string;
  dailyQuota?: number;
  reason?: string;
}> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Explicit block on student accounts
  if (/@siswa\..*belajar\.id$/i.test(normalizedEmail)) {
    return {
      allowed: false,
      isAdmin: false,
      reason: 'Akun siswa tidak memiliki izin akses untuk mencetak.',
    };
  }

  // 2. Check if this is the bootstrapped initial admin
  const initialAdmin = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (initialAdmin && normalizedEmail === initialAdmin) {
    return {
      allowed: true,
      isAdmin: true,
      name: 'Superadmin TU',
      dailyQuota: 500,
    };
  }

  // 3. Check database whitelist
  const employee = await prisma.employeeWhitelist.findUnique({
    where: { email: normalizedEmail },
  });

  if (!employee || !employee.isActive) {
    return {
      allowed: false,
      isAdmin: false,
      reason: 'Akun Anda belum terdaftar dalam daftar pegawai sekolah. Silakan hubungi staf TU.',
    };
  }

  return {
    allowed: true,
    isAdmin: employee.isAdmin,
    name: employee.name,
    dailyQuota: employee.dailyQuotaOverride || 20,
  };
}

/**
 * Imports or updates employee records from parsed list.
 */
export async function importWhitelistRecords(records: WhitelistEntry[]) {
  let created = 0;
  let updated = 0;

  for (const record of records) {
    const existing = await prisma.employeeWhitelist.findUnique({
      where: { email: record.email },
    });

    if (existing) {
      await prisma.employeeWhitelist.update({
        where: { email: record.email },
        data: {
          name: record.name,
          dailyQuotaOverride: record.dailyQuota ?? existing.dailyQuotaOverride,
          isAdmin: record.isAdmin ?? existing.isAdmin,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.employeeWhitelist.create({
        data: {
          name: record.name,
          email: record.email,
          dailyQuotaOverride: record.dailyQuota,
          isAdmin: record.isAdmin ?? false,
          isActive: true,
        },
      });
      created++;
    }
  }

  return { created, updated, total: records.length };
}
