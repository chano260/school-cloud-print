import { NextRequest, NextResponse } from 'next/server';
import { parseWhitelistExcel } from '@/lib/excel-parser';
import { importWhitelistRecords } from '@/lib/whitelist';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Silakan pilih berkas Excel (.xlsx, .xls) atau .csv.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = parseWhitelistExcel(buffer);
    if (parsed.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada baris valid yang ditemukan. Pastikan kolom Nama dan Email terisi.' },
        { status: 400 }
      );
    }

    const stats = await importWhitelistRecords(parsed);
    return NextResponse.json({
      imported: stats.created,
      updated: stats.updated,
      total: stats.total,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengimpor berkas Excel.' }, { status: 400 });
  }
}
