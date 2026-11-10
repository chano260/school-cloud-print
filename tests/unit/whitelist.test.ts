import { describe, it, expect } from 'vitest';
import { validateEmployeeAccess } from '@/lib/whitelist';
import { parseWhitelistExcel } from '@/lib/excel-parser';
import * as XLSX from 'xlsx';

describe('Whitelist Verification & Excel Parsing', () => {
  it('should block student accounts matching @siswa.*.belajar.id', async () => {
    const check1 = await validateEmployeeAccess('andi.saputra@siswa.smp.belajar.id');
    expect(check1.allowed).toBe(false);
    expect(check1.reason).toContain('Akun siswa');

    const check2 = await validateEmployeeAccess('budi@siswa.sma.belajar.id');
    expect(check2.allowed).toBe(false);
  });

  it('should parse excel worksheet correctly into whitelist entries', () => {
    const testData = [
      { Nama: 'Budi Santoso, S.Pd.', Email: 'budi.santoso@guru.smp.belajar.id', Kuota: 30 },
      { Nama: 'Siti Aminah, M.Pd.', Email: 'siti.aminah@guru.smp.belajar.id', Kuota: 25 },
    ];

    const ws = XLSX.utils.json_to_sheet(testData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pegawai');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const entries = parseWhitelistExcel(buffer);
    expect(entries.length).toBe(2);
    expect(entries[0].name).toBe('Budi Santoso, S.Pd.');
    expect(entries[0].email).toBe('budi.santoso@guru.smp.belajar.id');
    expect(entries[0].dailyQuota).toBe(30);
  });
});
