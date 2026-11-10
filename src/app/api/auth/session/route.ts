import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveUser, loginWithSchoolEmail, SESSION_COOKIE_NAME } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getActiveUser();
    const teachers = await prisma.employeeWhitelist.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        dailyQuotaOverride: true,
      },
    });
    return NextResponse.json({ user, teachers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let targetEmail = body.email ? String(body.email).trim().toLowerCase() : '';

    if (body.employeeId) {
      const emp = await prisma.employeeWhitelist.findUnique({
        where: { id: String(body.employeeId) },
      });
      if (!emp || !emp.isActive) {
        return NextResponse.json({ error: 'Data guru tidak ditemukan.' }, { status: 404 });
      }
      targetEmail = emp.email;
    }

    if (!targetEmail) {
      return NextResponse.json({ error: 'Silakan pilih nama guru terlebih dahulu.' }, { status: 400 });
    }

    const result = await loginWithSchoolEmail(targetEmail);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    const res = NextResponse.json({ user: result.user, dailyQuota: result.dailyQuota });
    res.cookies.set(SESSION_COOKIE_NAME, result.user.email, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memilih akun guru.' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
