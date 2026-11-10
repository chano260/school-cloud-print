import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser, loginWithSchoolEmail, SESSION_COOKIE_NAME } from '@/lib/auth-helper';

export async function GET() {
  try {
    const user = await getActiveUser();
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email akun Belajar.id wajib diisi.' }, { status: 400 });
    }

    const result = await loginWithSchoolEmail(email);
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
    return NextResponse.json({ error: err.message || 'Gagal masuk.' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
