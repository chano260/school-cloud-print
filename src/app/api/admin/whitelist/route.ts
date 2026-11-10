import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { importWhitelistRecords } from '@/lib/whitelist';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const employees = await prisma.employeeWhitelist.findMany({
      orderBy: [{ isAdmin: 'desc' }, { name: 'asc' }],
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
    const email = String(body.email || '').trim().toLowerCase();
    const dailyQuota = body.dailyQuota ? parseInt(String(body.dailyQuota), 10) : 20;
    const isAdmin = Boolean(body.isAdmin);

    if (!name || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'Nama dan email pegawai wajib diisi dengan benar.' }, { status: 400 });
    }

    if (/@siswa\..*belajar\.id$/i.test(email)) {
      return NextResponse.json({ error: 'Domain email siswa (@siswa.*) tidak diizinkan masuk whitelist.' }, { status: 400 });
    }

    const result = await importWhitelistRecords([
      { name, email, dailyQuota, isAdmin },
    ]);

    return NextResponse.json({ ok: true, ...result });
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
