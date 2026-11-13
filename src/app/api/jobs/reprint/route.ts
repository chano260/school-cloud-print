import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isCurrentUserAdmin, getActiveUser } from '@/lib/auth-helper';
import { broadcastQueueUpdate, notifyAgentJobAvailable } from '@/lib/socket-bridge';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'ID dokumen wajib disertakan.' }, { status: 400 });
    }

    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 });
    }

    // Authorization: Must be Admin TU or the teacher who owns the job
    const isAdmin = await isCurrentUserAdmin();
    const activeUser = await getActiveUser();
    const isOwner = activeUser && activeUser.id === job.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak untuk mencetak ulang dokumen ini.' },
        { status: 403 }
      );
    }

    // Re-queue the job without re-deducting quota (since it failed or needs reprinting)
    const updated = await prisma.printJob.update({
      where: { id: jobId },
      data: {
        status: 'QUEUED',
        errorMessage: null,
      },
    });

    // Notify WebSocket and Print Agent
    broadcastQueueUpdate();
    notifyAgentJobAvailable();

    return NextResponse.json({ ok: true, job: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengirim ulang dokumen ke antrean.' },
      { status: 500 }
    );
  }
}
