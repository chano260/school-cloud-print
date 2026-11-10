import { PDFDocument } from 'pdf-lib';

/**
 * Calculates physical sheets of paper needed.
 * Duplex mode prints 2 pages per sheet (using Math.ceil(pages / 2)).
 */
export function calculatePhysicalSheets(pageCount: number, copies: number, isDuplex: boolean): number {
  if (pageCount <= 0 || copies <= 0) return 0;
  const sheetsPerPageSet = isDuplex ? Math.ceil(pageCount / 2) : pageCount;
  return sheetsPerPageSet * copies;
}

/**
 * Extracts page count from a PDF buffer.
 * Throws an informative error if the PDF is corrupt or password protected.
 */
export async function extractPdfPageCount(buffer: Buffer): Promise<number> {
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    return pdfDoc.getPageCount();
  } catch (error: any) {
    if (error.message?.includes('encrypted') || error.message?.includes('password')) {
      throw new Error('Dokumen PDF dilindungi password. Harap hapus password sebelum mengunggah.');
    }
    throw new Error('Gagal membaca dokumen PDF. Pastikan file tidak rusak/corrupt.');
  }
}
