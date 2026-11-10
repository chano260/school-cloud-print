# Design Document: School Cloud Print Station (Epson EcoTank L6460)

**Date:** 2026-11-10  
**Status:** Approved by Reviewer & Configured (Awaiting Human Approval)  
**Target Hardware:** Epson EcoTank L6460 (LAN / Wi-Fi)  

---

## 1. Intent & The "Why"
Di lingkungan sekolah, guru saat ini harus datang langsung ke ruang Tata Usaha (TU) membawa flashdisk atau laptop, mengantre giliran di komputer TU, dan meminta staf mencetak berkas satu per satu. Proses ini memakan waktu, mengganggu alur kerja staf TU, dan rawan penyebaran virus via flashdisk.

Sistem **School Cloud Print Station** ini dibangun untuk memungkinkan guru mengunggah dokumen dari mana saja (rumah, ruang kelas, atau smartphone), masuk ke antrean cetak berurutan (FIFO), membatasi kuota cetak harian guru secara adil, dan mencetak otomatis ke printer Epson EcoTank L6460 di ruang TU tanpa perlu antre fisik, lengkap dengan pemantauan sensor kertas dan tinta secara *real-time*.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
* **Autentikasi & Keamanan Ketat:** 
  * Guru login menggunakan Google SSO akun Belajar.id (`@guru.*.belajar.id`). Akun siswa (`@siswa.*.belajar.id`) diblokir otomatis.
  * **Whitelist Pegawai Sekolah:** Hanya akun yang terdaftar dalam daftar putih (diimpor via Excel/CSV oleh Admin TU) yang dapat login dan menggunakan fasilitas cetak.
* **Pengaturan Kuota Harian Terkontrol:**
  * Setiap guru memiliki kuota lembar cetak harian (default: 20 lembar/hari, dapat disesuaikan per pegawai di dashboard TU).
  * Kuota otomatis di-reset setiap pukul 00:00 WIB.
  * Menggunakan sistem **Reservasi Kuota Transaksional** untuk mencegah pencetakan melebihi kuota secara bersamaan (*race condition*).
* **Manajemen Antrean Cerdas & Prioritas:**
  * Dokumen biasa: **Cetak Langsung (*Direct Print*)** secara berurutan.
  * Dokumen rahasia (seperti soal ujian): **Kunci Dokumen (*Hold & Release*)**. Dokumen ditahan di server dan baru dicetak saat guru menekan tombol web *"Rilis & Cetak Sekarang"* dari HP-nya di ruang TU.
  * **Preemption/Priority Jump:** Dokumen terkunci yang dirilis otomatis melompat ke urutan berikutnya (*Head-of-Line*) tepat setelah file yang sedang berjalan selesai, sehingga guru tidak perlu menunggu lama di depan printer.
* **Integrasi Sensor Epson L6460 Real-Time:**
  * Mendeteksi status kertas habis (*paper out*) via SNMP/IPP, otomatis menjeda antrean dan mengirim peringatan ke web.
  * Memantau persentase sisa tinta 4 warna (Black, Cyan, Magenta, Yellow) dan kapasitas *Maintenance Box*.
* **Komunikasi Dua Arah Real-Time:** Notifikasi status antrean, kertas habis, dan peringatan tinta langsung ter-update di layar guru dan dashboard TU tanpa reload halaman via WebSocket.

### Non-Goals
* Sistem pembayaran berbayar / e-wallet.
* Format file selain PDF dan gambar umum (JPG/PNG).
* Manajemen multi-printer di lokasi berbeda (fokus pada 1 unit Epson L6460 di ruang TU).

### Anti-Goals
* **Mencegah kebocoran berkas rahasia:** Soal ujian tidak boleh keluar dari baki printer tanpa ada guru pemiliknya yang menekan tombol rilis di tempat.
* **Mencegah antrean macet:** File corrupt atau error printer tidak boleh menghentikan seluruh antrean; ada timeout dan penandaan status failed.
* **Mencegah over-quota:** Guru tidak dapat memanfaatkan jeda pencetakan untuk mengunggah dokumen di luar batas kuota harian.

---

## 3. Constraints & Hardware Specifications

* **Model Printer:** Epson EcoTank L6460
  * Konektivitas: Ethernet (LAN) / Wi-Fi dalam 1 jaringan lokal dengan PC TU.
  * Protokol: IPP (port 631) dan SNMP v1/v2c (port 161).
  * Kemampuan: Full Color & Duplex (bolak-balik otomatis).
  * Sistem Tinta: 4 tangki botol infus + Chip Maintenance Box T04D1.
* **Konektivitas Jaringan:** Printer dan PC lokal berada di dalam LAN sekolah (di balik router/firewall). Server web berada di cloud publik. Komunikasi dijembatani oleh **Local Print Agent** via WebSocket Secure (koneksi keluar dari LAN ke Cloud, tidak memerlukan IP publik statis atau port forwarding di sekolah).

---

## 4. Architectural Approaches

Tiga pendekatan arsitektur telah dipertimbangkan:

| Pendekatan | Deskripsi | Kelebihan | Kekurangan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Next.js + Node.js Agent (Full-Stack TS)** | Web App berbasis Next.js (React + Tailwind + Prisma), Local Print Agent berbasis Node.js via WebSocket. | Satu bahasa (TypeScript), notifikasi real-time instan, antarmuka mobile responsif bagi guru. | Butuh runtime Node.js di PC sekolah. | **DIPILIH** |
| **2. Python Stack (FastAPI + Python Agent)** | Backend FastAPI, Agent Python dengan PySNMP dan win32print, polling REST API. | Ekosistem PDF sangat kuat. | Polling API menimbulkan jeda (*latency*) untuk notifikasi kertas habis. | Ditolak |
| **3. PHP Laravel + Python/Node Agent** | Web Laravel di cPanel/MySQL sekolah, agent lokal polling API. | Hosting cPanel murah/tersedia di sekolah. | Fitur real-time memerlukan layanan pihak ketiga berbayar (seperti Pusher). | Ditolak |

---

## 5. Detailed Component & Workflow Specifications

### 5.1. Otorisasi Pengguna & Whitelist Pegawai
* **Login Google:** Hanya domain `@guru.*.belajar.id` atau domain sekolah yang diizinkan mengontak Google OAuth.
* **Tabel Whitelist (`EmployeeWhitelist`):**
  * Kolom: `name`, `email`, `daily_quota_override`, `is_admin`, `is_active`.
  * Saat login pertama kali: Sistem mengecek apakah email ada di tabel whitelist dan berstatus aktif. Jika tidak ada, login ditolak dengan notifikasi: *"Akun Anda belum terdaftar dalam daftar pegawai sekolah. Silakan hubungi staf TU."*
  * Admin TU memiliki fitur di dashboard untuk mengunggah file **Excel (.xlsx / .csv)** berisi daftar nama pegawai dan email Belajar.id mereka.
* **Bootstrap Admin:** Akun Superadmin ditentukan melalui *environment variable* `INITIAL_ADMIN_EMAIL`.

### 5.2. Logika Kuota Harian (Two-Phase Quota Ledger)
* Setiap pengguna memiliki:
  * `daily_limit`: Batas lembar per hari (default: 20 atau nilai kustom dari whitelist).
  * `reserved_pages`: Lembar yang sedang antre (`QUEUED` / `LOCKED` / `PRINTING`).
  * `committed_pages`: Lembar yang sudah berhasil dicetak hari ini.
* **Kalkulasi Lembar Dokumen:**
  $$\text{Lembar Fisik} = (\text{Duplex} ? \lceil \text{Halaman} / 2 \rceil : \text{Halaman}) \times \text{Rangkap}$$
* **Siklus Kuota:**
  1. *Upload:* Jika $\text{committed\_pages} + \text{reserved\_pages} + \text{Lembar Baru} > \text{daily\_limit}$, tolak upload. Jika lolos, tambahkan ke `reserved_pages`.
  2. *Selesai Cetak:* Kurangi `reserved_pages`, tambahkan ke `committed_pages`.
  3. *Gagal / Dibatalkan:* Kembalikan nilai `reserved_pages`.
* **Dokumen Terkunci Lintas Hari:**
  * Kuota dicatat pada hari dokumen diunggah (reservasi tetap mengikat).
  * Dokumen terkunci yang tidak dirilis dalam waktu **24 jam (TTL)** akan otomatis dibatalkan (*auto-expired*) dan reservasi kuota dibersihkan.

### 5.3. Manajemen Antrean & Prioritas Rilis (*Priority Queue*)
* **Bobot Antrean:**
  * Status `PRINTING`: Sedang berjalan di printer.
  * Status `RELEASED`: Dokumen rahasia yang baru saja ditekan tombol rilisnya oleh guru. **(Prioritas Tertinggi: Melompat ke urutan pertama setelah job aktif selesai).**
  * Status `QUEUED`: Antrean cetak langsung biasa (FIFO).
  * Status `LOCKED`: Dokumen rahasia yang sedang menunggu guru datang ke TU.
* **Aksi Rilis:** Guru membuka dashboard web dari HP di ruang TU, menekan tombol *"Rilis & Cetak Sekarang"*. Dokumen berubah dari `LOCKED` menjadi `RELEASED` dan langsung diproses printer begitu printer kosong.

### 5.4. Local Print Agent & Telemetri Hardware (PC TU)
* Skrip Node.js di PC TU terhubung via WebSocket ke server cloud.
* **SNMP Poller (UDP Port 161 ke IP Epson L6460):**
  * Polling status kertas: OID `hrPrinterDetectedErrorState` / `prtAlertTable`.
  * Jika terdeteksi `paper-out` / `door-open`:
    * Agent mengirim sinyal `EVENT_OUT_OF_PAPER` -> Web server mengubah status printer menjadi `OUT_OF_PAPER` dan menjeda antrean.
    * Tampilan web guru dan TU memunculkan banner merah darurat: *"⚠️ Kertas Printer Habis! Antrean dijeda."*
  * Jika kertas sudah diisi kembali:
    * Agent mengirim `EVENT_PAPER_RESTORED` -> Antrean otomatis melanjutkan cetak.
  * Polling tinta: OID `prtMarkerSuppliesLevel` dan `prtMarkerSuppliesMaxCapacity` untuk Black, Cyan, Magenta, Yellow, dan Waste Box -> dikirim ke server web untuk ditampilkan di progress bar dashboard.

---

## 6. What's Left to the Builder
* Pilihan engine database (SQLite untuk development/lokal mandiri, PostgreSQL/Supabase untuk produksi cloud).
* Parser PDF untuk ekstraksi jumlah halaman (`pdf-lib` / `pdf-page-counter`).
* Konfigurasi background daemon di Windows (menggunakan `node-windows` atau `pm2`).
* Desain visual antarmuka Tailwind CSS (tema responsif, indikator warna tinta, dan animasi status antrean).

---

## 7. Approval & Next Steps
Setelah dokumen desain ini disetujui:
1. Memulai tahap perencanaan implementasi (*implementation plan*) dengan skill `writing-plans`.
2. Menyusun daftar tugas modular (Web App, Database & Auth, Queue Engine, Print Agent, SNMP Poller).
