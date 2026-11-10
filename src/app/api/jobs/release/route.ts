import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth-helper';
import { releaseLockedJob } from '@/lib/queue-manager';
import { broadcastQueueUpdate, notifyAgentJobAvailable } from '@/lib/socket-bridge';

export async function POST(req: NextRequest) {
  try {
    const user = await getActiveUser();
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'ID dokumen tidak ditemukan.' }, { status: 400 });
    }

    const updated = await releaseLockedJob(jobId, user.id);

    broadcastQueueUpdate();
    notifyAgentJobAvailable();

    return NextResponse.json({ job: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal merilis dokumen.' }, { status: 400 });
  }
}
