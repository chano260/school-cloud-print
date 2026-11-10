import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { validateEmployeeAccess } from './whitelist';

export const SESSION_COOKIE_NAME = 'scp_user_email';
export const ADMIN_COOKIE_NAME = 'scp_admin_auth';

/**
 * Resolves the active user from session cookie.
 * Returns null if user is not logged in / has not selected their profile yet.
 */
export async function getActiveUser() {
  const cookieStore = cookies();
  const cookieEmail = cookieStore.get(SESSION_COOKIE_NAME)?.value?.trim().toLowerCase();

  if (!cookieEmail) {
    return null;
  }

  const existing = await prisma.user.findUnique({ where: { email: cookieEmail } });
  if (existing) return existing;

  // Fallback to whitelist match if user record is not yet provisioned
  const employee = await prisma.employeeWhitelist.findUnique({
    where: { email: cookieEmail },
  });

  if (employee && employee.isActive) {
    return await prisma.user.create({
      data: {
        name: employee.name,
        email: employee.email,
        role: employee.isAdmin ? 'ADMIN' : 'TEACHER',
      },
    });
  }

  return null;
}

/**
 * Checks if current request has authenticated Admin TU privileges.
 */
export async function isCurrentUserAdmin() {
  const cookieStore = cookies();
  const adminAuth = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return adminAuth === 'authenticated';
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
