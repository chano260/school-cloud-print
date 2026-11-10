/**
 * Custom Production Server for aaPanel (Next.js + Socket.io Real-Time Hub)
 * Startup file for aaPanel Node Project / PM2 Manager: `server.js`
 */
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

// Ensure working directory is always the project root
process.chdir(__dirname);

// Default to production mode for stability and high performance on aaPanel
const isExplicitDev = process.env.NODE_ENV === 'development';
const dev = isExplicitDev;
process.env.NODE_ENV = dev ? 'development' : 'production';

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3003', 10);

const app = next({ dev, dir: __dirname, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: { origin: '*' },
  });

  // Expose io globally so Next.js App Router API routes can emit events
  global.io = io;

  io.on('connection', (socket) => {
    const agentToken = socket.handshake.auth?.token;
    const isAgent = agentToken && agentToken === process.env.AGENT_SECRET_KEY;

    if (isAgent) {
      socket.join('agent_room');
      console.log('[SocketHub] Local Print Agent TU terhubung.');

      prisma.printerTelemetry
        .upsert({
          where: { id: 'epson_l6460' },
          update: { status: 'READY', lastSeenAt: new Date() },
          create: { id: 'epson_l6460', status: 'READY' },
        })
        .catch(() => {});

      socket.on('TELEMETRY_DATA', async (payload) => {
        try {
          await prisma.printerTelemetry.upsert({
            where: { id: 'epson_l6460' },
            update: {
              status: payload.status || 'READY',
              blackInk: payload.ink?.black ?? 100,
              cyanInk: payload.ink?.cyan ?? 100,
              magentaInk: payload.ink?.magenta ?? 100,
              yellowInk: payload.ink?.yellow ?? 100,
              wasteBox: payload.ink?.wasteBox ?? 0,
              lastSeenAt: new Date(),
            },
            create: {
              id: 'epson_l6460',
              status: payload.status || 'READY',
              blackInk: payload.ink?.black ?? 100,
              cyanInk: payload.ink?.cyan ?? 100,
              magentaInk: payload.ink?.magenta ?? 100,
              yellowInk: payload.ink?.yellow ?? 100,
              wasteBox: payload.ink?.wasteBox ?? 0,
            },
          });
          io.emit('PRINTER_STATUS_UPDATE', payload);
        } catch (e) {
          console.error('[SocketHub] Telemetry update error:', e);
        }
      });

      socket.on('disconnect', async () => {
        console.warn('[SocketHub] Local Print Agent TU terputus.');
        await prisma.printerTelemetry
          .update({
            where: { id: 'epson_l6460' },
            data: { status: 'OFFLINE' },
          })
          .catch(() => {});
        io.emit('PRINTER_STATUS_UPDATE', { status: 'OFFLINE' });
      });
    }

    socket.on('subscribe_queue', () => {
      socket.join('queue_room');
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> School Cloud Print Server (${process.env.NODE_ENV}) siap di http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('[Server Error] Gagal menyiapkan aplikasi Next.js:', err);
  process.exit(1);
});
