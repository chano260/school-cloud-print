import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { importWhitelistRecords } from '@/lib/whitelist';
import { getTodayDateString } from '@/lib/quota-ledger';

export const dynamic = 'force-dynamic';

function slugifyNameToEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${slug || 'guru'}@guru.sman3buru.belajar.id`;
}

export async function GET() {
  try {
    const employees = await prisma.employeeWhitelist.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
    });
    return NextResponse.json({ employees });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const email = rawEmail && rawEmail.includes('@') ? rawEmail : slugifyNameToEmail(name);
    const dailyQuota = body.dailyQuota ? parseInt(String(body.dailyQuota), 10) : 20;
    const isAdmin = Boolean(body.isAdmin);

    if (!name) {
      return NextResponse.json({ error: 'Nama guru wajib diisi.' }, { status: 400 });
    }

    if (/@siswa\..*belajar\.id$/i.test(email)) {
      return NextResponse.json({ error: 'Akun siswa (@siswa.*) tidak diizinkan masuk daftar guru.' }, { status: 400 });
    }

    const result = await importWhitelistRecords([
      { name, email, dailyQuota, isAdmin },
    ]);

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || '');
    const dailyQuota = parseInt(String(body.dailyQuota), 10);

    if (!id || isNaN(dailyQuota) || dailyQuota <= 0) {
      return NextResponse.json({ error: 'ID pegawai dan kuota valid (> 0) wajib disertakan.' }, { status: 400 });
    }

    const updated = await prisma.employeeWhitelist.update({
      where: { id },
      data: { dailyQuotaOverride: dailyQuota },
    });

    // Also update today's active quota if the user already has a quota record
    const today = getTodayDateString();
    const user = await prisma.user.findUnique({
      where: { email: updated.email },
    });

    if (user) {
      await prisma.dailyQuota.updateMany({
        where: {
          userId: user.id,
          quotaDate: today,
        },
        data: {
          dailyLimit: dailyQuota,
        },
      });
    }

    return NextResponse.json({ ok: true, employee: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID pegawai wajib disertakan.' }, { status: 400 });
    }
    await prisma.employeeWhitelist.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
