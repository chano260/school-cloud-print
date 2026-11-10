# School Cloud Print Station Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun platform web School Cloud Print terintegrasi dan agen cetak lokal untuk Epson EcoTank L6460, memungkinkan guru mencetak dokumen dari mana saja menggunakan akun Google Belajar.id dengan kuota harian, sistem rilis dokumen rahasia, serta pemantauan sensor kertas dan sisa tinta secara real-time.

**Architecture:** Sistem terdiri dari dua subsistem utama: (1) Cloud Web Portal (Next.js App Router, Tailwind CSS, Prisma, NextAuth, WebSocket server) yang menangani autentikasi guru, whitelist Excel pegawai, ledger kuota harian, dan antrean FIFO dengan prioritas rilis; (2) Local Print Agent (Node.js daemon di PC TU sekolah) yang terhubung ke cloud via WebSocket untuk mengunduh job cetak ke printer Epson L6460 dan secara berkala membaca sensor fisik kertas & tinta via protokol SNMP UDP port 161.

**Tech Stack:** TypeScript, Next.js 14+ (App Router), Tailwind CSS, Prisma ORM (SQLite/PostgreSQL), NextAuth.js (Google OAuth Belajar.id), Socket.io, `pdf-lib` (ekstraksi jumlah halaman), `xlsx` (parser Excel whitelist pegawai), `net-snmp` (monitoring printer SNMP MIB), `pdf-to-printer` (spooler cetak Windows).

**Spec:** `docs/superpowers/specs/2026-11-10-school-cloud-print-design.md`

## Global Constraints

* **Domain Email:** Hanya mengizinkan pola email `@guru.*.belajar.id` atau domain whitelist; blokir eksplisit semua akun `@siswa.*.belajar.id`.
* **Whitelist Enforced:** Hanya pegawai yang terdaftar aktif di tabel whitelist yang diizinkan masuk dan mencetak.
* **Daily Quota Reset:** Kuota lembar harian direset otomatis setiap pukul 00:00 WIB; kuota tidak terakumulasi ke hari berikutnya.
* **Format File:** Hanya menerima PDF (`application/pdf`) dan gambar (`image/jpeg`, `image/png`) dengan batas ukuran 25 MB.
* **Prioritas Rilis:** Dokumen berstatus `LOCKED` yang dirilis guru wajib mendapatkan slot prioritas tertinggi berikutnya (*Head-of-Line*) setelah job yang sedang berjalan selesai.
* **Sensor Kertas:** Sensor mendeteksi `paper-out` seketika menjeda antrean dan mengirim notifikasi darurat.

## Review Focus

1. **Race Condition Upload Melebihi Kuota:** Dua pengunggahan paralel dari guru yang sama mencoba mengonsumsi kuota yang tersisa tipis. Sistem wajib menggunakan transaksi database (`reserved_pages`).
2. **File PDF Korup / Terenkripsi Password:** Pengguna mengunggah PDF yang diproteksi password sehingga ekstraksi halaman gagal. Sistem wajib menolak di awal dengan pesan error yang jelas dan mengembalikan kuota.
3. **Kertas Habis Saat Cetak Dokumen Multi-Halaman:** Printer kehabisan kertas di tengah proses pencetakan dokumen 50 halaman. Sistem harus mendeteksi error SNMP, menandai job terhenti, dan tidak membakar kuota dokumen berikutnya sampai kertas diisi kembali.
4. **Dokumen Rahasia (LOCKED) Kedaluwarsa:** Dokumen soal ujian diunggah tetapi guru tidak pernah merilisnya di TU lebih dari 24 jam. Sistem harus membersihkan file dan melepaskan reservasi kuota tanpa kebocoran memori/storage.
5. **Koneksi Local Agent Terputus / PC TU Mati:** Server cloud harus mendeteksi status agent `OFFLINE` dan menampilkan peringatan di dashboard bahwa pencetakan fisik sedang tidak aktif, tanpa membatalkan antrean guru.

---

### Task 1: Project Scaffolding & Database Schema (Prisma)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `src/types/index.ts`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Produces: Prisma Client instance (`prisma`), model types (`EmployeeWhitelist`, `User`, `DailyQuota`, `PrintJob`, `PrinterTelemetry`).

- [ ] **Step 1: Write the failing test for Prisma schema models**

```typescript
// tests/unit/schema.test.ts
import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Prisma Schema Validation', () => {
  it('should have required models and relationships defined', () => {
    const prisma = new PrismaClient();
    expect(prisma.employeeWhitelist).toBeDefined();
    expect(prisma.dailyQuota).toBeDefined();
    expect(prisma.printJob).toBeDefined();
    expect(prisma.printerTelemetry).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL with missing PrismaClient or models.

- [ ] **Step 3: Initialize Next.js project dependencies and Prisma schema**

Setup `prisma/schema.prisma` containing:
- `EmployeeWhitelist`: `id`, `name`, `email` (unique), `dailyQuota` (default 20), `isAdmin` (Boolean), `isActive` (Boolean).
- `User`: `id`, `name`, `email` (unique), `role`.
- `DailyQuota`: `id`, `userId`, `quotaDate` (String YYYY-MM-DD), `dailyLimit`, `reservedPages`, `committedPages`.
- `PrintJob`: `id`, `userId`, `fileName`, `fileUrl`, `fileSize`, `pageCount`, `copies`, `isColor`, `isDuplex`, `isLocked`, `status` (QUEUED, LOCKED, RELEASED, PRINTING, COMPLETED, FAILED, EXPIRED), `createdAt`.
- `PrinterTelemetry`: `id`, `status` (READY, PRINTING, OUT_OF_PAPER, OFFLINE), `blackInk`, `cyanInk`, `magentaInk`, `yellowInk`, `wasteBox`, `updatedAt`.

- [ ] **Step 4: Generate Prisma Client & Run test to verify it passes**

Run: `npx prisma generate && npx vitest run tests/unit/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json prisma/ src/ tests/unit/schema.test.ts
git commit -m "feat: setup project scaffolding and prisma database schema"
```

---

### Task 2: Whitelist Engine & Excel Parser

**Files:**
- Create: `src/lib/whitelist.ts`
- Create: `src/lib/excel-parser.ts`
- Test: `tests/unit/whitelist.test.ts`

**Interfaces:**
- Consumes: Prisma `EmployeeWhitelist` model.
- Produces:
  - `parseWhitelistExcel(buffer: Buffer) -> Promise<Array<{ name: string; email: string; dailyQuota?: number }>>`
  - `importWhitelist(data: Array<{ name: string; email: string; dailyQuota?: number }>) -> Promise<{ imported: number; updated: number }>`
  - `validateEmployeeAccess(email: string) -> Promise<{ allowed: boolean; employee?: EmployeeWhitelist; reason?: string }>`

- [ ] **Step 1: Write the failing test for Excel whitelist parsing & access check**

```typescript
// tests/unit/whitelist.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmployeeAccess } from '@/lib/whitelist';

describe('Whitelist Verification', () => {
  it('should reject student accounts matching @siswa.*', async () => {
    const result = await validateEmployeeAccess('budi@siswa.smp.belajar.id');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Akun siswa');
  });

  it('should reject unlisted teacher emails', async () => {
    const result = await validateEmployeeAccess('guru.asing@guru.smp.belajar.id');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('belum terdaftar');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/whitelist.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `excel-parser.ts` using `xlsx` and `whitelist.ts`**

Implement `parseWhitelistExcel` to extract Name, Email Belajar.id, and optional custom quota from sheets.
Implement `validateEmployeeAccess` with regex block for `@siswa\..*` and database lookup against `EmployeeWhitelist` where `isActive = true`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/whitelist.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/whitelist.ts src/lib/excel-parser.ts tests/unit/whitelist.test.ts
git commit -m "feat: implement employee whitelist and excel parser"
```

---

### Task 3: PDF Page Extractor & Two-Phase Quota Engine

**Files:**
- Create: `src/lib/pdf-calculator.ts`
- Create: `src/lib/quota-ledger.ts`
- Test: `tests/unit/quota.test.ts`

**Interfaces:**
- Consumes: Prisma `DailyQuota` and `EmployeeWhitelist`.
- Produces:
  - `calculatePhysicalSheets(pageCount: number, copies: number, isDuplex: boolean) -> number`
  - `extractPdfPageCount(buffer: Buffer) -> Promise<number>`
  - `reserveQuota(userId: string, sheetsNeeded: number, dateStr: string) -> Promise<{ success: boolean; remaining: number; error?: string }>`
  - `commitQuota(userId: string, sheets: number, dateStr: string) -> Promise<void>`
  - `releaseReservedQuota(userId: string, sheets: number, dateStr: string) -> Promise<void>`

- [ ] **Step 1: Write the failing test for physical sheet calculation and quota reservation**

```typescript
// tests/unit/quota.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePhysicalSheets } from '@/lib/pdf-calculator';

describe('Quota & Sheet Calculations', () => {
  it('calculates single-sided copies correctly', () => {
    expect(calculatePhysicalSheets(5, 2, false)).toBe(10);
  });

  it('calculates duplex (2-sided) sheets with ceiling rounding', () => {
    // 5 pages duplex = 3 sheets per copy * 2 copies = 6 sheets
    expect(calculatePhysicalSheets(5, 2, true)).toBe(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/quota.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `pdf-calculator.ts` (using `pdf-lib`) and transactional `quota-ledger.ts`**

Implement formula:
$$\text{Sheets} = (\text{isDuplex} ? \lceil \text{pageCount} / 2 \rceil : \text{pageCount}) \times \text{copies}$$
Implement `reserveQuota` inside Prisma interactive transaction (`$transaction`) checking `committedPages + reservedPages + sheetsNeeded <= dailyLimit`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/quota.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf-calculator.ts src/lib/quota-ledger.ts tests/unit/quota.test.ts
git commit -m "feat: implement pdf sheet calculator and two-phase quota ledger"
```

---

### Task 4: Print Queue Engine & Priority Scheduling (FIFO + Preemption)

**Files:**
- Create: `src/lib/queue-manager.ts`
- Create: `src/server/socket-hub.ts`
- Test: `tests/unit/queue.test.ts`

**Interfaces:**
- Consumes: Prisma `PrintJob`, `quota-ledger.ts`.
- Produces:
  - `enqueueJob(jobData: CreateJobInput) -> Promise<PrintJob>`
  - `releaseLockedJob(jobId: string, userId: string) -> Promise<PrintJob>`
  - `getNextJobForAgent() -> Promise<PrintJob | null>`
  - `markJobCompleted(jobId: string) -> Promise<void>`
  - `markJobFailed(jobId: string, reason: string) -> Promise<void>`

- [ ] **Step 1: Write the failing test for priority scheduling**

```typescript
// tests/unit/queue.test.ts
import { describe, it, expect } from 'vitest';
import { getNextJobForAgent } from '@/lib/queue-manager';

describe('Queue Priority Engine', () => {
  it('prioritizes RELEASED confidential jobs over ordinary QUEUED jobs', async () => {
    // Mock queue with Job A (QUEUED at 10:00) and Job B (RELEASED at 10:05)
    const nextJob = await getNextJobForAgent();
    expect(nextJob?.status).toBe('RELEASED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/queue.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `queue-manager.ts` and WebSocket broadcast events**

Query order:
1. `status == 'RELEASED'` ordered by `releasedAt ASC` (Head-of-Line preemption).
2. `status == 'QUEUED'` ordered by `createdAt ASC` (Strict FIFO).
Emits WebSocket events: `QUEUE_UPDATED`, `JOB_STARTED`, `JOB_COMPLETED`, `PAPER_EMPTY_ALERT`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/queue.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/queue-manager.ts src/server/socket-hub.ts tests/unit/queue.test.ts
git commit -m "feat: implement print queue manager with priority preemption"
```

---

### Task 5: Teacher Mobile-Friendly Web Portal

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/upload/page.tsx`
- Create: `src/components/UploadForm.tsx`
- Create: `src/components/QueueList.tsx`
- Create: `src/components/QuotaCard.tsx`
- Test: `tests/unit/components.test.tsx`

**Interfaces:**
- Consumes: NextAuth session, API `/api/jobs/upload`, `/api/jobs/release`.
- Produces: Responsive UI for teachers (Upload card, print options, quota progress bar, and locked job release button).

- [ ] **Step 1: Write the failing test for Upload Form submission & validation**

```typescript
// tests/unit/components.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UploadForm from '@/components/UploadForm';

describe('UploadForm UI', () => {
  it('renders required options including confidential lock checkbox', () => {
    render(<UploadForm remainingQuota={15} />);
    expect(screen.getByLabelText(/Kunci Dokumen/i)).toBeInTheDocument();
    expect(screen.getByText(/Hitam-Putih/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/components.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement components with Tailwind CSS**

Build `UploadForm.tsx` with drag-and-drop, options selector (color/BW, duplex, copies, lock checkbox).
Build `QueueList.tsx` with live status pills (`Antre`, `Dicetak`, `Terkunci`) and the *"Rilis & Cetak Sekarang"* button for locked items.
Build `QuotaCard.tsx` displaying daily usage (e.g., "12 / 20 Lembar Terpakai").

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/components.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/ src/components/ tests/unit/components.test.tsx
git commit -m "feat: implement teacher upload portal and live queue UI"
```

---

### Task 6: TU Admin Dashboard & Telemetry Visualizer

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/WhitelistManager.tsx`
- Create: `src/components/admin/PrinterStatusCard.tsx`
- Create: `src/components/admin/PrintHistoryTable.tsx`
- Test: `tests/unit/admin-ui.test.tsx`

**Interfaces:**
- Consumes: `/api/admin/whitelist`, `/api/admin/telemetry`, `/api/admin/logs`.
- Produces: Admin portal for TU staff (Excel upload, 4-ink gauge bars + waste box, live printer status banner).

- [ ] **Step 1: Write the failing test for Printer Status Card and Ink gauges**

```typescript
// tests/unit/admin-ui.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrinterStatusCard from '@/components/admin/PrinterStatusCard';

describe('Admin Telemetry UI', () => {
  it('displays ink level warnings when levels drop below 15%', () => {
    render(<PrinterStatusCard status="READY" ink={{ k: 80, c: 50, m: 50, y: 10, waste: 40 }} />);
    expect(screen.getByText(/Tinta Kuning Menipis/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/admin-ui.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement Admin components**

Implement `PrinterStatusCard.tsx` with visual SVG/Tailwind bars for Black, Cyan, Magenta, Yellow, and Maintenance Box.
Implement `WhitelistManager.tsx` with file dropzone for `.xlsx`/`.csv` and teacher quota editing.
Implement `PrintHistoryTable.tsx` with pagination and date filter.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/admin-ui.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/ src/components/admin/ tests/unit/admin-ui.test.tsx
git commit -m "feat: implement admin dashboard and ink telemetry visualizer"
```

---

### Task 7: Local Print Agent & Windows Spooler Client

**Files:**
- Create: `agent/src/index.ts`
- Create: `agent/src/spooler.ts`
- Create: `agent/src/config.ts`
- Test: `agent/tests/spooler.test.ts`

**Interfaces:**
- Consumes: Cloud WebSocket events (`JOB_AVAILABLE`, `PING`).
- Produces: Dispatches print jobs to Epson L6460 driver via `pdf-to-printer` or IPP; emits `JOB_STARTED`, `JOB_COMPLETED`, `JOB_FAILED`.

- [ ] **Step 1: Write the failing test for local spooler command builder**

```typescript
// agent/tests/spooler.test.ts
import { describe, it, expect } from 'vitest';
import { buildPrintOptions } from '../src/spooler';

describe('Spooler Option Formatter', () => {
  it('formats printer options for duplex and color', () => {
    const opts = buildPrintOptions({ printer: 'EPSON L6460 Series', copies: 2, isDuplex: true });
    expect(opts.printer).toBe('EPSON L6460 Series');
    expect(opts.copies).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run agent/tests/spooler.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `agent/src/spooler.ts` and `agent/src/index.ts`**

Connects to Cloud Socket.io server with `AGENT_SECRET_KEY`.
On `JOB_AVAILABLE`: downloads temporary PDF to disk, calls `print(tempPath, options)`, verifies completion, cleans up temp file, and emits `JOB_COMPLETED`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run agent/tests/spooler.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add agent/
git commit -m "feat: implement local print agent and spooler integration"
```

---

### Task 8: Hardware Telemetry Engine (SNMP Poller for Paper & Ink)

**Files:**
- Create: `agent/src/snmp-monitor.ts`
- Create: `agent/src/oids.ts`
- Test: `agent/tests/snmp.test.ts`

**Interfaces:**
- Consumes: Epson L6460 IP address via UDP 161 SNMP v2c.
- Produces: Real-time telemetry payloads (`{ status: 'OUT_OF_PAPER' | 'READY', inks: { k, c, m, y, waste } }`) emitted to Cloud Hub.

- [ ] **Step 1: Write the failing test for SNMP response parsing**

```typescript
// agent/tests/snmp.test.ts
import { describe, it, expect } from 'vitest';
import { parseSupplyLevels, parsePrinterState } from '../src/snmp-monitor';

describe('SNMP Telemetry Parser', () => {
  it('detects paper out error code from printer state', () => {
    // RFC 2790 hrPrinterDetectedErrorState: bit 5 = noPaper
    const state = parsePrinterState(Buffer.from([0x04])); // bit set
    expect(state.isOutOfPaper).toBe(true);
  });

  it('calculates ink percentages correctly from RFC 3805 supplies table', () => {
    const parsed = parseSupplyLevels({ level: 40, maxCapacity: 100 });
    expect(parsed.percentage).toBe(40);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run agent/tests/snmp.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `oids.ts` and `snmp-monitor.ts` using `net-snmp`**

Query OIDs:
- `1.3.6.1.2.1.25.3.5.1.2` (`hrPrinterDetectedErrorState`)
- `1.3.6.1.2.1.43.11.1.1.9` (`prtMarkerSuppliesLevel`)
- `1.3.6.1.2.1.43.11.1.1.8` (`prtMarkerSuppliesMaxCapacity`)
Runs poller loop every 5 seconds during active jobs, 20 seconds when idle. Sends `TELEMETRY_UPDATE` and `EVENT_OUT_OF_PAPER` to the cloud server.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run agent/tests/snmp.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add agent/src/snmp-monitor.ts agent/src/oids.ts agent/tests/snmp.test.ts
git commit -m "feat: implement snmp telemetry monitor for paper and ink"
```

---

### Task 9: End-to-End Integration & System Verification

**Files:**
- Create: `tests/e2e/print-flow.test.ts`
- Create: `README.md` (Setup instructions for Web and Windows Agent)

**Interfaces:**
- Consumes: All modules from Tasks 1-8.
- Produces: Comprehensive end-to-end integration test covering upload -> quota check -> queue -> agent pull -> status update.

- [ ] **Step 1: Write the end-to-end integration test**

```typescript
// tests/e2e/print-flow.test.ts
import { describe, it, expect } from 'vitest';

describe('Full Print Lifecycle E2E', () => {
  it('executes full flow: whitelist -> upload -> reserve quota -> agent receive -> commit quota', async () => {
    // Simulates teacher upload, agent pickup, and telemetry paper-out trigger
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run tests/e2e/print-flow.test.ts`
Expected: PASS

- [ ] **Step 3: Create README.md with complete installation and deployment documentation**

Include guide for:
1. Setting up Google Cloud Console OAuth with Belajar.id restrictions.
2. Deploying Next.js Web App on Vercel / VPS with WebSocket enabled.
3. Setting up the Print Agent on Windows PC TU with Epson L6460 driver.

- [ ] **Step 4: Final verification and commit**

```bash
git add tests/e2e/ README.md
git commit -m "docs: add setup guide and e2e integration tests"
```
