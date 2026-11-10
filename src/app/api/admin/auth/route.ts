import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin, ADMIN_COOKIE_NAME } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAdmin = await isCurrentUserAdmin();
  return NextResponse.json({ isAdmin });
}

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const expectedPin = process.env.ADMIN_PIN || '123456';

    if (!pin || String(pin).trim() !== String(expectedPin).trim()) {
      return NextResponse.json({ error: 'PIN Admin TU salah.' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, isAdmin: true });
    res.cookies.set(ADMIN_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal autentikasi admin.' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, isAdmin: false });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
