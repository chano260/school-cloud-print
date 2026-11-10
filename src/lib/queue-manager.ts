import { prisma } from './prisma';
import { PrintJob } from '@prisma/client';
import { commitQuota, releaseReservedQuota, getTodayDateString } from './quota-ledger';

export interface CreateJobInput {
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  pageCount: number;
  physicalSheets: number;
  copies: number;
  isColor: boolean;
  isDuplex: boolean;
  isLocked: boolean;
}

/**
 * Enqueues a new print job.
 * If isLocked = true, status starts as LOCKED (waiting for teacher to release at TU).
 * Otherwise, status starts as QUEUED.
 */
export async function enqueueJob(data: CreateJobInput): Promise<PrintJob> {
  return await prisma.printJob.create({
    data: {
      userId: data.userId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      pageCount: data.pageCount,
      physicalSheets: data.physicalSheets,
      copies: data.copies,
      isColor: data.isColor,
      isDuplex: data.isDuplex,
      isLocked: data.isLocked,
      status: data.isLocked ? 'LOCKED' : 'QUEUED',
    },
  });
}

/**
 * Releases a confidential LOCKED document when teacher is at TU.
 * Changes status to RELEASED and sets releasedAt timestamp.
 */
export async function releaseLockedJob(jobId: string, userId: string): Promise<PrintJob> {
  const job = await prisma.printJob.findUnique({
    where: { id: jobId },
  });

  if (!job) throw new Error('Dokumen tidak ditemukan.');
  if (job.userId !== userId) throw new Error('Anda tidak memiliki wewenang untuk merilis dokumen ini.');
  if (job.status !== 'LOCKED') throw new Error(`Dokumen tidak dalam status terkunci (Status: ${job.status}).`);

  return await prisma.printJob.update({
    where: { id: jobId },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
    },
  });
}

/**
 * Priority Scheduler for the Local Print Agent:
 * 1. Highest Priority: RELEASED jobs (Head-of-Line preemption, ordered by releasedAt ASC).
 * 2. Standard Priority: QUEUED jobs (Strict FIFO, ordered by createdAt ASC).
 */
export async function getNextJobForAgent(): Promise<PrintJob | null> {
  // Check if printer has paper error
  const telemetry = await prisma.printerTelemetry.findUnique({
    where: { id: 'epson_l6460' },
  });

  if (telemetry?.status === 'OUT_OF_PAPER') {
    return null; // Queue is paused while paper is empty
  }

  // 1. Check for newly released confidential jobs
  const releasedJob = await prisma.printJob.findFirst({
    where: { status: 'RELEASED' },
    orderBy: { releasedAt: 'asc' },
  });

  if (releasedJob) return releasedJob;

  // 2. Fallback to standard FIFO queue
  return await prisma.printJob.findFirst({
    where: { status: 'QUEUED' },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Marks job as PRINTING when Local Agent begins spooling.
 */
export async function markJobPrinting(jobId: string): Promise<PrintJob> {
  return await prisma.printJob.update({
    where: { id: jobId },
    data: { status: 'PRINTING' },
  });
}

/**
 * Marks job as COMPLETED and commits quota.
 */
export async function markJobCompleted(jobId: string): Promise<void> {
  const job = await prisma.printJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  await prisma.printJob.update({
    where: { id: jobId },
    data: { status: 'COMPLETED' },
  });

  const dateStr = job.createdAt.toISOString().slice(0, 10);
  await commitQuota(job.userId, job.physicalSheets, dateStr);
}

/**
 * Marks job as FAILED and rolls back reserved quota.
 */
export async function markJobFailed(jobId: string, reason: string): Promise<void> {
  const job = await prisma.printJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  await prisma.printJob.update({
    where: { id: jobId },
    data: { status: 'FAILED', errorMessage: reason },
  });

  const dateStr = job.createdAt.toISOString().slice(0, 10);
  await releaseReservedQuota(job.userId, job.physicalSheets, dateStr);
}

/**
 * Routine: Expires unreleased LOCKED documents older than 24 hours.
 */
export async function cleanupExpiredLockedJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expiredJobs = await prisma.printJob.findMany({
    where: {
      status: 'LOCKED',
      createdAt: { lt: cutoff },
    },
  });

  for (const job of expiredJobs) {
    await prisma.printJob.update({
      where: { id: job.id },
      data: { status: 'EXPIRED', errorMessage: 'Dokumen kedaluwarsa setelah 24 jam tidak dirilis.' },
    });
    const dateStr = job.createdAt.toISOString().slice(0, 10);
    await releaseReservedQuota(job.userId, job.physicalSheets, dateStr);
  }

  return expiredJobs.length;
}
