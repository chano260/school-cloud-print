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
    // 1. Download file
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream',
      headers: {
        'x-agent-secret': config.agentSecretKey,
      },
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // 2. Dispatch to Windows Spooler / Epson driver
    const printParams = buildPrintOptions(options);
    console.log(`[Spooler] Mengirim berkas ${fileName} ke ${printParams.printer}...`);
    await print(tempFilePath, printParams as any);
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
