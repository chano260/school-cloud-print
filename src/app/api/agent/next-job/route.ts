import { NextRequest, NextResponse } from 'next/server';
import { getNextJobForAgent } from '@/lib/queue-manager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get('x-agent-secret');
    if (!secret || secret !== process.env.AGENT_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized agent' }, { status: 401 });
    }

    const job = await getNextJobForAgent();
    if (!job) {
      return NextResponse.json({ job: null });
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const origin = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : 'https://cetak.smanegeri3buru.my.id');
    
    return NextResponse.json({
      job: {
        ...job,
        fileUrl: `${origin}/api/agent/files/${job.id}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
