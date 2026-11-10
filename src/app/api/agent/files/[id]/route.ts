import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const secret = req.headers.get('x-agent-secret');
    if (!secret || secret !== process.env.AGENT_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized agent' }, { status: 401 });
    }

    const job = await prisma.printJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'storage', 'uploads', path.basename(job.fileUrl));
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Stored file not found on server' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const isPdf = job.fileName.toLowerCase().endsWith('.pdf');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': isPdf ? 'application/pdf' : 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(job.fileName)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
