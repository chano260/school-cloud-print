import { prisma } from './prisma';

/**
 * Returns current date formatted as YYYY-MM-DD (WIB / Jakarta Timezone).
 */
export function getTodayDateString(): string {
  const now = new Date();
  // Format to Asia/Jakarta (UTC+7)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Retrieves or initializes today's quota for a user.
 */
export async function getOrCreateTodayQuota(userId: string, defaultLimit: number = 20) {
  const today = getTodayDateString();

  let quota = await prisma.dailyQuota.findUnique({
    where: {
      userId_quotaDate: {
        userId,
        quotaDate: today,
      },
    },
  });

  if (!quota) {
    // Check if user has override limit in whitelist
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    let limit = defaultLimit;
    if (user?.email) {
      const whitelist = await prisma.employeeWhitelist.findUnique({
        where: { email: user.email },
      });
      if (whitelist?.dailyQuotaOverride) {
        limit = whitelist.dailyQuotaOverride;
      }
    }

    quota = await prisma.dailyQuota.create({
      data: {
        userId,
        quotaDate: today,
        dailyLimit: limit,
        reservedPages: 0,
        committedPages: 0,
      },
    });
  }

  return quota;
}

/**
 * Phase 1: Atomically reserves quota for a print job to prevent race conditions.
 */
export async function reserveQuota(
  userId: string,
  sheetsNeeded: number,
  dateStr: string = getTodayDateString()
): Promise<{ success: boolean; remaining: number; error?: string }> {
  return await prisma.$transaction(async (tx) => {
    const quota = await tx.dailyQuota.findUnique({
      where: {
        userId_quotaDate: {
          userId,
          quotaDate: dateStr,
        },
      },
    });

    const limit = quota?.dailyLimit ?? 20;
    const currentUsed = (quota?.committedPages ?? 0) + (quota?.reservedPages ?? 0);
    const remaining = Math.max(0, limit - currentUsed);

    if (currentUsed + sheetsNeeded > limit) {
      return {
        success: false,
        remaining,
        error: `Kuota harian tidak mencukupi. Sisa: ${remaining} lembar, Dibutuhkan: ${sheetsNeeded} lembar.`,
      };
    }

    if (!quota) {
      await tx.dailyQuota.create({
        data: {
          userId,
          quotaDate: dateStr,
          dailyLimit: limit,
          reservedPages: sheetsNeeded,
          committedPages: 0,
        },
      });
    } else {
      await tx.dailyQuota.update({
        where: { id: quota.id },
        data: {
          reservedPages: { increment: sheetsNeeded },
        },
      });
    }

    return {
      success: true,
      remaining: remaining - sheetsNeeded,
    };
  });
}

/**
 * Phase 2: Commits reserved quota upon successful printing.
 */
export async function commitQuota(userId: string, sheets: number, dateStr: string) {
  const quota = await prisma.dailyQuota.findUnique({
    where: { userId_quotaDate: { userId, quotaDate: dateStr } },
  });

  if (!quota) return;

  await prisma.dailyQuota.update({
    where: { id: quota.id },
    data: {
      reservedPages: Math.max(0, quota.reservedPages - sheets),
      committedPages: quota.committedPages + sheets,
    },
  });
}

/**
 * Rollback: Releases reserved quota if job is cancelled, failed, or expired.
 */
export async function releaseReservedQuota(userId: string, sheets: number, dateStr: string) {
  const quota = await prisma.dailyQuota.findUnique({
    where: { userId_quotaDate: { userId, quotaDate: dateStr } },
  });

  if (!quota) return;

  await prisma.dailyQuota.update({
    where: { id: quota.id },
    data: {
      reservedPages: Math.max(0, quota.reservedPages - sheets),
    },
  });
}
