import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tel = await prisma.printerTelemetry.findUnique({
      where: { id: 'epson_l6460' },
    });

    if (!tel) {
      return NextResponse.json({
        status: 'READY',
        ink: { black: 85, cyan: 70, magenta: 75, yellow: 60, wasteBox: 12 },
        lastSeenAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: tel.status,
      ink: {
        black: tel.blackInk,
        cyan: tel.cyanInk,
        magenta: tel.magentaInk,
        yellow: tel.yellowInk,
        wasteBox: tel.wasteBox,
      },
      lastSeenAt: tel.lastSeenAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-agent-secret');
    if (!secret || secret !== process.env.AGENT_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized agent' }, { status: 401 });
    }

    const body = await req.json();
    const status = body.status || 'READY';
    const ink = body.ink || {};

    const updated = await prisma.printerTelemetry.upsert({
      where: { id: 'epson_l6460' },
      update: {
        status,
        blackInk: ink.black ?? 100,
        cyanInk: ink.cyan ?? 100,
        magentaInk: ink.magenta ?? 100,
        yellowInk: ink.yellow ?? 100,
        wasteBox: ink.wasteBox ?? 0,
        lastSeenAt: new Date(),
      },
      create: {
        id: 'epson_l6460',
        status,
        blackInk: ink.black ?? 100,
        cyanInk: ink.cyan ?? 100,
        magentaInk: ink.magenta ?? 100,
        yellowInk: ink.yellow ?? 100,
        wasteBox: ink.wasteBox ?? 0,
      },
    });

    return NextResponse.json({ ok: true, telemetry: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
