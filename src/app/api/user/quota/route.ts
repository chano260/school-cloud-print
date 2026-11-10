import { NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth-helper';
import { getOrCreateTodayQuota } from '@/lib/quota-ledger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getActiveUser();
    const defaultLimit = parseInt(process.env.DEFAULT_DAILY_QUOTA || '20', 10);
    const quota = await getOrCreateTodayQuota(user.id, defaultLimit);

    const usedToday = quota.committedPages + quota.reservedPages;
    const remaining = Math.max(0, quota.dailyLimit - usedToday);

    return NextResponse.json({
      dailyLimit: quota.dailyLimit,
      usedToday,
      committedPages: quota.committedPages,
      reservedPages: quota.reservedPages,
      remaining,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat kuota.' }, { status: 500 });
  }
}
