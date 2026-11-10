import * as XLSX from 'xlsx';
import { WhitelistEntry } from '@/types';

/**
 * Parses uploaded Excel (.xlsx, .xls) or CSV buffer containing employee records.
 * Expects columns: Nama / Name, Email, and optional Kuota / Quota.
 */
export function parseWhitelistExcel(buffer: Buffer): WhitelistEntry[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const entries: WhitelistEntry[] = [];

  for (const row of rawRows) {
    // Look up column variants flexibly (case-insensitive)
    const keys = Object.keys(row);
    const nameKey = keys.find(k => /^(nama|name|nama_pegawai|pegawai)$/i.test(k.trim()));
    const emailKey = keys.find(k => /^(email|e-mail|email_belajar|surel)$/i.test(k.trim()));
    const quotaKey = keys.find(k => /^(kuota|quota|limit|batas_kuota)$/i.test(k.trim()));
    const adminKey = keys.find(k => /^(admin|is_admin|role)$/i.test(k.trim()));

    const name = nameKey ? String(row[nameKey]).trim() : '';
    const email = emailKey ? String(row[emailKey]).trim().toLowerCase() : '';
    const quotaVal = quotaKey && row[quotaKey] ? parseInt(String(row[quotaKey]), 10) : undefined;
    const isAdmin = adminKey ? /^(true|1|ya|yes|admin)$/i.test(String(row[adminKey]).trim()) : false;

    if (name && email && email.includes('@')) {
      entries.push({
        name,
        email,
        dailyQuota: Number.isInteger(quotaVal) && quotaVal! > 0 ? quotaVal : undefined,
        isAdmin,
      });
    }
  }

  return entries;
}
