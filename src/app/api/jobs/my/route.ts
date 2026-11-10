import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanupExpiredLockedJobs } from '@/lib/queue-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await cleanupExpiredLockedJobs().catch(() => {});

    const jobs = await prisma.printJob.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 30,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(jobs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat antrean.' }, { status: 500 });
  }
}
