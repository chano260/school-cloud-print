import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { config } from './config';
import { pollEpsonTelemetry } from './snmp-monitor';
import { downloadAndPrintJob } from './spooler';

console.log('========================================================');
console.log('   School Cloud Print - Local Agent (Epson L6460)      ');
console.log('========================================================');
console.log(`Server Cloud : ${config.cloudServerUrl}`);
console.log(`IP Printer   : ${config.printerIp}`);
console.log(`Nama Spooler : ${config.windowsPrinterName}`);
console.log('--------------------------------------------------------');

let isProcessingJob = false;

// Connect to Cloud Socket.io
const socket: Socket = io(config.cloudServerUrl, {
  path: '/api/socket',
  auth: { token: config.agentSecretKey },
  reconnection: true,
  reconnectionDelay: 5000,
});

socket.on('connect', () => {
  console.log('[Socket] Berhasil terhubung ke server cloud!');
  // Run initial telemetry check
  runTelemetryCycle();
  // Check for any waiting jobs
  fetchNextJob();
});

socket.on('disconnect', () => {
  console.warn('[Socket] Terputus dari server cloud. Mencoba menyambung kembali...');
});

// Cloud notifies agent that a new job is queued or a locked job was released
socket.on('JOB_AVAILABLE', () => {
  console.log('[Queue] Notifikasi job baru diterima.');
  fetchNextJob();
});

/**
 * Fetches the next job from cloud queue and spools it.
 */
async function fetchNextJob() {
  if (isProcessingJob) return;

  try {
    const res = await axios.get(`${config.cloudServerUrl}/api/agent/next-job`, {
      headers: { 'x-agent-secret': config.agentSecretKey },
    });

    const job = res.data?.job;
    if (!job) return; // No jobs waiting

    isProcessingJob = true;
    console.log(`[Job #${job.id}] Memulai proses cetak: "${job.fileName}" (${job.physicalSheets} lembar)...`);

    // 1. Mark printing on cloud
    await axios.post(
      `${config.cloudServerUrl}/api/agent/job-status`,
      { jobId: job.id, status: 'PRINTING' },
      { headers: { 'x-agent-secret': config.agentSecretKey } }
    );

    // 2. Download and spool to Epson L6460
    await downloadAndPrintJob(job.fileUrl, job.fileName, {
      copies: job.copies,
      isDuplex: job.isDuplex,
      isColor: job.isColor,
    });

    // 3. Mark completed on cloud
    await axios.post(
      `${config.cloudServerUrl}/api/agent/job-status`,
      { jobId: job.id, status: 'COMPLETED' },
      { headers: { 'x-agent-secret': config.agentSecretKey } }
    );

    console.log(`[Job #${job.id}] Selesai dicetak dengan sukses!`);
  } catch (error: any) {
    console.error('[Job Error] Gagal memproses cetak:', error.message);
  } finally {
    isProcessingJob = false;
    // Check if more jobs are waiting in queue
    setTimeout(fetchNextJob, 2000);
  }
}

/**
 * Periodically reads Epson SNMP hardware status and pushes to cloud.
 */
async function runTelemetryCycle() {
  try {
    const state = await pollEpsonTelemetry();
    socket.emit('TELEMETRY_DATA', {
      status: state.status,
      ink: state.ink,
      timestamp: new Date().toISOString(),
    });

    if (state.isOutOfPaper) {
      console.warn('[Sensor] PERINGATAN: Kertas di printer Epson L6460 habis!');
    }
  } catch (err: any) {
    console.error('[Telemetry Error]', err.message);
  }
}

// Start telemetry background timer
setInterval(runTelemetryCycle, config.telemetryIntervalMs);
