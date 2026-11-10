import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getActiveUser } from '@/lib/auth-helper';
import { calculatePhysicalSheets, extractPdfPageCount } from '@/lib/pdf-calculator';
import { reserveQuota, getOrCreateTodayQuota } from '@/lib/quota-ledger';
import { enqueueJob } from '@/lib/queue-manager';
import { broadcastQueueUpdate, notifyAgentJobAvailable } from '@/lib/socket-bridge';

export async function POST(req: NextRequest) {
  try {
    const user = await getActiveUser();
    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Silakan pilih berkas PDF atau gambar.' }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran berkas melebihi batas maksimal 25 MB.' }, { status: 400 });
    }

    const copies = Math.max(1, Math.min(10, parseInt(String(formData.get('copies') || '1'), 10) || 1));
    const isColor = String(formData.get('isColor')) === 'true';
    const isDuplex = String(formData.get('isDuplex')) === 'true';
    const isLocked = String(formData.get('isLocked')) === 'true';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    let pageCount = 1;
    if (isPdf) {
      pageCount = await extractPdfPageCount(buffer);
    }

    const physicalSheets = calculatePhysicalSheets(pageCount, copies, isDuplex);

    // Ensure today's quota record exists with any employee override
    await getOrCreateTodayQuota(user.id);

    // Phase 1: Atomically reserve quota
    const reservation = await reserveQuota(user.id, physicalSheets);
    if (!reservation.success) {
      return NextResponse.json({ error: reservation.error }, { status: 400 });
    }

    // Save uploaded file to local storage directory on server
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFileName = `${Date.now()}-${safeName}`;
    const storedPath = path.join(uploadDir, storedFileName);
    fs.writeFileSync(storedPath, buffer);

    const job = await enqueueJob({
      userId: user.id,
      fileName: file.name,
      fileUrl: storedFileName,
      fileSize: file.size,
      pageCount,
      physicalSheets,
      copies,
      isColor,
      isDuplex,
      isLocked,
    });

    broadcastQueueUpdate();
    if (!isLocked) {
      notifyAgentJobAvailable();
    }

    return NextResponse.json({ job, remainingQuota: reservation.remaining });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengunggah dokumen.' }, { status: 400 });
  }
}
