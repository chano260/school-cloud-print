import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isCurrentUserAdmin } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Akses ditolak. Khusus Admin TU.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const query = searchParams.get('q')?.trim().toLowerCase();

    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (query) {
      whereClause.OR = [
        { fileName: { contains: query } },
        { user: { name: { contains: query } } },
      ];
    }

    const jobs = await prisma.printJob.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Also get all distinct users who have print jobs for the filter dropdown
    const usersWithJobs = await prisma.user.findMany({
      where: {
        printJobs: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { printJobs: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ jobs, usersWithJobs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat berkas cetak.' }, { status: 500 });
  }
}
