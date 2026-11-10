import { print } from 'pdf-to-printer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { config } from './config';

export interface SpoolOptions {
  printer?: string;
  copies: number;
  isDuplex: boolean;
  isColor: boolean;
}

export function buildPrintOptions(opts: SpoolOptions) {
  return {
    printer: opts.printer || config.windowsPrinterName,
    copies: opts.copies || 1,
    side: opts.isDuplex ? 'duplex' : 'simplex',
    monochrome: !opts.isColor,
  };
}

/**
 * Downloads file from cloud server, spools to Epson L6460, and cleans up temp file.
 */
export async function downloadAndPrintJob(
  fileUrl: string,
  fileName: string,
  options: SpoolOptions
): Promise<void> {
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `${Date.now()}-${fileName}`);

  try {
    // 1. Sanitize fileUrl to resolve against config.cloudServerUrl
    let downloadUrl = fileUrl;
    if (downloadUrl.startsWith('/')) {
      downloadUrl = `${config.cloudServerUrl}${downloadUrl}`;
    } else {
      try {
        const parsed = new URL(downloadUrl);
        if (parsed.hostname === '0.0.0.0' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          downloadUrl = `${config.cloudServerUrl}${parsed.pathname}${parsed.search}`;
        }
      } catch {}
    }

    console.log(`[Downloader] Mengunduh berkas dari: ${downloadUrl}`);
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      headers: {
        'x-agent-secret': config.agentSecretKey,
      },
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });

    // 2. Dispatch to Windows Spooler / Epson driver
    const printParams = buildPrintOptions(options);
    console.log(`[Spooler] Mengirim berkas ${fileName} ke ${printParams.printer}...`);
    try {
      await print(tempFilePath, printParams as any);
    } catch (e: any) {
      const sumatraPath = 'C:\\Users\\smane\\AppData\\Local\\SumatraPDF\\SumatraPDF.exe';
      if (fs.existsSync(sumatraPath)) {
        console.log(`[Spooler] Mencetak langsung via SumatraPDF...`);
        const { execSync } = require('child_process');
        const settings: string[] = [];
        if (options.copies > 1) settings.push(`${options.copies}x`);
        settings.push(options.isDuplex ? 'duplex' : 'simplex');
        const settingsArg = settings.length ? `-print-settings "${settings.join(',')}"` : '';
        const cmd = `"${sumatraPath}" -print-to "${printParams.printer}" ${settingsArg} -silent "${tempFilePath}"`;
        execSync(cmd);
      } else {
        throw e;
      }
    }
    console.log(`[Spooler] Berkas ${fileName} berhasil dikirim ke antrean printer.`);
  } finally {
    // 3. Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.warn(`[Spooler] Gagal menghapus berkas sementara: ${tempFilePath}`, err);
      }
    }
  }
}
