import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { prisma } from '@/lib/prisma';
import { TelemetryPayload } from '@/types';

let io: SocketIOServer | null = null;

export function initSocketHub(server: NetServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    const agentToken = socket.handshake.auth?.token;
    const isAgent = agentToken && agentToken === process.env.AGENT_SECRET_KEY;

    if (isAgent) {
      socket.join('agent_room');
      // Set printer status to READY / online
      prisma.printerTelemetry.upsert({
        where: { id: 'epson_l6460' },
        update: { status: 'READY', lastSeenAt: new Date() },
        create: { id: 'epson_l6460', status: 'READY' },
      }).catch(console.error);

      // Handle telemetry data from local PC TU
      socket.on('TELEMETRY_DATA', async (payload: TelemetryPayload) => {
        await prisma.printerTelemetry.upsert({
          where: { id: 'epson_l6460' },
          update: {
            status: payload.status,
            blackInk: payload.ink.black,
            cyanInk: payload.ink.cyan,
            magentaInk: payload.ink.magenta,
            yellowInk: payload.ink.yellow,
            wasteBox: payload.ink.wasteBox,
            lastSeenAt: new Date(),
          },
          create: {
            id: 'epson_l6460',
            status: payload.status,
            blackInk: payload.ink.black,
            cyanInk: payload.ink.cyan,
            magentaInk: payload.ink.magenta,
            yellowInk: payload.ink.yellow,
            wasteBox: payload.ink.wasteBox,
          },
        });

        // Broadcast to all teachers and admin TU
        io?.emit('PRINTER_STATUS_UPDATE', payload);
      });

      socket.on('disconnect', async () => {
        await prisma.printerTelemetry.update({
          where: { id: 'epson_l6460' },
          data: { status: 'OFFLINE' },
        }).catch(() => {});
        io?.emit('PRINTER_STATUS_UPDATE', { status: 'OFFLINE' });
      });
    }

    socket.on('subscribe_queue', () => {
      socket.join('queue_room');
    });
  });

  return io;
}

export function broadcastQueueUpdate() {
  io?.to('queue_room').emit('QUEUE_UPDATED');
}

export function notifyAgentJobAvailable() {
  io?.to('agent_room').emit('JOB_AVAILABLE');
}
