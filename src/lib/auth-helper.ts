import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { validateEmployeeAccess } from './whitelist';

export const SESSION_COOKIE_NAME = 'scp_user_email';

/**
 * Resolves the active user from session cookie, or falls back to a default demo teacher
 * when no session cookie is set so the portal works out-of-the-box on initial deployment.
 */
export async function getActiveUser() {
  const cookieStore = cookies();
  const cookieEmail = cookieStore.get(SESSION_COOKIE_NAME)?.value?.trim().toLowerCase();

  if (cookieEmail) {
    const existing = await prisma.user.findUnique({ where: { email: cookieEmail } });
    if (existing) return existing;
  }

  // Ensure default initial admin & demo teacher exist in Whitelist + User table
  const defaultEmail = cookieEmail || 'guru.demo@guru.smp.belajar.id';
  const defaultName = cookieEmail ? cookieEmail.split('@')[0] : 'Guru Demo (Belajar.id)';

  await prisma.employeeWhitelist.upsert({
    where: { email: defaultEmail },
    update: {},
    create: {
      name: defaultName,
      email: defaultEmail,
      dailyQuotaOverride: 20,
      isAdmin: false,
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: defaultEmail },
    update: {},
    create: {
      name: defaultName,
      email: defaultEmail,
      role: 'TEACHER',
    },
  });

  return user;
}

/**
 * Authenticates an employee email against the Belajar.id & School Whitelist rules,
 * and upserts the User record.
 */
export async function loginWithSchoolEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const check = await validateEmployeeAccess(normalized);

  if (!check.allowed) {
    return { ok: false as const, error: check.reason || 'Akses ditolak.' };
  }

  const user = await prisma.user.upsert({
    where: { email: normalized },
    update: {
      name: check.name || normalized.split('@')[0],
      role: check.isAdmin ? 'ADMIN' : 'TEACHER',
    },
    create: {
      name: check.name || normalized.split('@')[0],
      email: normalized,
      role: check.isAdmin ? 'ADMIN' : 'TEACHER',
    },
  });

  return { ok: true as const, user, dailyQuota: check.dailyQuota ?? 20 };
}
