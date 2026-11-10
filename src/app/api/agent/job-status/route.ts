import { NextRequest, NextResponse } from 'next/server';
import { markJobPrinting, markJobCompleted, markJobFailed } from '@/lib/queue-manager';
import { broadcastQueueUpdate } from '@/lib/socket-bridge';

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-agent-secret');
    if (!secret || secret !== process.env.AGENT_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized agent' }, { status: 401 });
    }

    const { jobId, status, error } = await req.json();
    if (!jobId || !status) {
      return NextResponse.json({ error: 'Missing jobId or status' }, { status: 400 });
    }

    if (status === 'PRINTING') {
      await markJobPrinting(jobId);
    } else if (status === 'COMPLETED') {
      await markJobCompleted(jobId);
    } else if (status === 'FAILED') {
      await markJobFailed(jobId, error || 'Gagal mencetak di printer lokal.');
    }

    broadcastQueueUpdate();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
