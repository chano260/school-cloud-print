import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isCurrentUserAdmin, getActiveUser } from '@/lib/auth-helper';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.printJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check authorization: Agent secret, Admin TU session, or job owner
    const secret = req.headers.get('x-agent-secret');
    const isAgent = secret && secret === process.env.AGENT_SECRET_KEY;
    const isAdmin = await isCurrentUserAdmin();
    const activeUser = await getActiveUser();
    const isOwner = activeUser && activeUser.id === job.userId;

    if (!isAgent && !isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Akses tidak diizinkan.' }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), 'storage', 'uploads', path.basename(job.fileUrl));
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Berkas fisik tidak ditemukan di server.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const isPdf = job.fileName.toLowerCase().endsWith('.pdf');
    const isImage = /\.(png|jpe?g|webp)$/i.test(job.fileName);

    let contentType = 'application/octet-stream';
    if (isPdf) contentType = 'application/pdf';
    else if (isImage) contentType = job.fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(job.fileName)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
