"""
School Cloud Print - Server Uji Coba Lokal (Epson EcoTank L6460)
Menjalankan Web Portal Guru + Print Agent lokal dalam 1 aplikasi mandiri.
Dapat diakses dari browser PC ini atau dari HP (melalui Wi-Fi yang sama).
"""

import os
import sys
import json
import time
import socket
import threading
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

PRINTER_IP = "192.168.0.177"
PRINTER_NAME = "L6460 Series(Network)"
PORT = 5000
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "local_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# SumatraPDF binary for rock-solid silent Windows printing
SUMATRA_PATH = r"C:\Users\smane\AppData\Local\SumatraPDF\SumatraPDF.exe"

# In-memory database for local testing
state = {
    "quota": {
        "daily_limit": 20,
        "used_today": 0,
    },
    "printer": {
        "status": "READY", # READY, PRINTING, OUT_OF_PAPER, OFFLINE
        "paper_ok": True,
        "ink": {"black": 85, "cyan": 60, "magenta": 70, "yellow": 45, "wasteBox": 15},
        "last_checked": "",
    },
    "jobs": []
}

def check_printer_snmp():
    """Mengecek status printer fisik via SNMP UDP port 161."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(1.5)
        # SNMP packet query for hrPrinterDetectedErrorState (1.3.6.1.2.1.25.3.5.1.2.1)
        packet = bytes.fromhex('302b02010004067075626c6963a0200204123456780201000201003010300e060a2b060102011903050102010500')
        sock.sendto(packet, (PRINTER_IP, 161))
        data, _ = sock.recvfrom(1024)
        sock.close()
        
        # Check error byte if returned
        paper_ok = True
        if len(data) > 30:
            error_byte = data[-1]
            if (error_byte & 0x04) != 0 or (error_byte & 0x40) != 0:
                paper_ok = False
        
        state["printer"]["paper_ok"] = paper_ok
        state["printer"]["status"] = "READY" if paper_ok else "OUT_OF_PAPER"
    except Exception:
        # Fallback to WMI if SNMP packet times out
        try:
            cmd = f'powershell -Command "Get-CimInstance Win32_Printer -Filter \\"Name=\'{PRINTER_NAME}\'\\" | Select-Object -ExpandProperty PrinterStatus"'
            res = subprocess.check_output(cmd, shell=True).decode().strip()
            state["printer"]["status"] = "READY" if res == "3" else "PRINTING"
            state["printer"]["paper_ok"] = True
        except Exception:
            state["printer"]["status"] = "OFFLINE"
    
    state["printer"]["last_checked"] = time.strftime("%H:%M:%S")

def background_telemetry_loop():
    """Loop berkala untuk memantau sensor printer setiap 5 detik."""
    while True:
        check_printer_snmp()
        time.sleep(5)

def print_file_worker():
    """Worker antrean cetak: memproses antrean satu per satu."""
    while True:
        # Cari job dengan prioritas:
        # 1. Dokumen yang baru dirilis (status == 'RELEASED')
        # 2. Dokumen antrean biasa (status == 'QUEUED')
        target_job = None
        for j in state["jobs"]:
            if j["status"] == "RELEASED":
                target_job = j
                break
        
        if not target_job:
            for j in state["jobs"]:
                if j["status"] == "QUEUED":
                    target_job = j
                    break

        if target_job and state["printer"]["status"] != "OUT_OF_PAPER":
            target_job["status"] = "PRINTING"
            state["printer"]["status"] = "PRINTING"
            print(f"[Printer] Memulai cetak dokumen: {target_job['fileName']}...")

            file_path = target_job["filePath"]
            try:
                # Cetak menggunakan driver Epson L6460 via SumatraPDF
                copies = target_job.get("copies", 1)
                is_duplex = target_job.get("isDuplex", False)
                
                settings_list = []
                if copies > 1:
                    settings_list.append(f"{copies}x")
                if is_duplex:
                    settings_list.append("duplex")
                else:
                    settings_list.append("simplex")

                settings_arg = ""
                if settings_list:
                    settings_arg = f'-print-settings "{",".join(settings_list)}"'

                if os.path.exists(SUMATRA_PATH):
                    cmd = f'"{SUMATRA_PATH}" -print-to "{PRINTER_NAME}" {settings_arg} -silent "{file_path}"'
                else:
                    cmd = f'powershell -Command "Start-Process -FilePath \'{file_path}\' -ArgumentList \'\\"{PRINTER_NAME}\\"\' -Verb PrintTo"'

                print(f"[Printer Command] {cmd}")
                res = subprocess.run(cmd, shell=True, timeout=60, capture_output=True, text=True)
                
                target_job["status"] = "COMPLETED"
                state["quota"]["used_today"] += target_job["sheets"]
                print(f"[Printer] SUKSES! Dokumen '{target_job['fileName']}' berhasil dikirim ke printer Epson L6460.")
            except Exception as e:
                target_job["status"] = "FAILED"
                target_job["error"] = str(e)
                print(f"[Printer Error] Gagal mencetak: {e}")
            finally:
                state["printer"]["status"] = "READY"
        
        time.sleep(3)

HTML_PAGE = """<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>School Cloud Print - Uji Coba Lokal</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen pb-16">

  <!-- Header -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
    <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          🖨️
        </div>
        <div>
          <h1 class="font-bold text-base text-slate-900 leading-tight">School Cloud Print</h1>
          <p class="text-xs text-slate-400">Epson EcoTank L6460 • Mode Uji Coba Lokal</p>
        </div>
      </div>
      <div id="printer-badge" class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        <span class="text-xs font-semibold text-slate-600">Printer Siap</span>
      </div>
    </div>
  </header>

  <!-- Banner Kertas Habis -->
  <div id="paper-warning" class="hidden bg-red-600 text-white py-3 px-4 shadow-sm animate-pulse">
    <div class="max-w-4xl mx-auto flex items-center gap-2 font-semibold text-sm">
      ⚠️ PERINGATAN: Kertas di printer Epson L6460 habis! Antrean cetak dijeda sampai kertas diisi ulang.
    </div>
  </div>

  <main class="max-w-4xl mx-auto px-4 pt-6">

    <!-- Card Status Hardware & Tinta -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
      <div class="flex justify-between items-center mb-3">
        <div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Perangkat Keras</span>
          <h3 class="text-base font-bold text-slate-800">Epson EcoTank L6460 (192.168.0.177)</h3>
        </div>
        <button onclick="refreshData()" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
          Segarkan Data 🔄
        </button>
      </div>

      <!-- Ink Bars -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Hitam (BK)</span>
            <span id="ink-k">85%</span>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div id="bar-k" class="bg-slate-900 h-2 rounded-full" style="width: 85%"></div>
          </div>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Cyan (C)</span>
            <span id="ink-c">60%</span>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div id="bar-c" class="bg-sky-500 h-2 rounded-full" style="width: 60%"></div>
          </div>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Magenta (M)</span>
            <span id="ink-m">70%</span>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div id="bar-m" class="bg-pink-500 h-2 rounded-full" style="width: 70%"></div>
          </div>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Yellow (Y)</span>
            <span id="ink-y">45%</span>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div id="bar-y" class="bg-amber-400 h-2 rounded-full" style="width: 45%"></div>
          </div>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Waste Box</span>
            <span id="ink-waste">15%</span>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div id="bar-waste" class="bg-slate-500 h-2 rounded-full" style="width: 15%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card Kuota Harian Guru -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kuota Harian Guru (Belajar.id)</span>
        <span id="quota-text" class="text-sm font-semibold text-slate-700">0 / 20 Lembar Terpakai</span>
      </div>
      <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div id="quota-bar" class="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style="width: 0%"></div>
      </div>
    </div>

    <!-- Form Upload Dokumen -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <h2 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        📤 Kirim Berkas untuk Dicetak
      </h2>

      <form id="upload-form" onsubmit="submitJob(event)">
        <div class="mb-4">
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-2">Pilih File (PDF, Gambar, atau Dokumen)</label>
          <input type="file" id="file-input" required class="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 cursor-pointer">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Jumlah Rangkap</label>
            <input type="number" id="copies" value="1" min="1" max="10" class="w-full p-2.5 border border-slate-200 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Warna</label>
            <select id="color" class="w-full p-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="false">Hitam-Putih (Monochrome)</option>
              <option value="true">Berwarna (Color)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Sisi Cetak</label>
            <select id="duplex" class="w-full p-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="false">1 Sisi (Single)</option>
              <option value="true">Bolak-balik (Duplex)</option>
            </select>
          </div>
        </div>

        <!-- Checkbox Kunci Dokumen (Berkas Rahasia / Soal Ujian) -->
        <div class="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" id="is-locked" class="mt-1 w-4 h-4 text-indigo-600 rounded">
            <div>
              <span class="text-sm font-semibold text-amber-900">🔒 Kunci Dokumen (Berkas Rahasia / Soal Ujian)</span>
              <p class="text-xs text-amber-800/80 mt-0.5">
                Dokumen tidak akan langsung dicetak. Dokumen ditahan di antrean dan baru keluar saat Anda menekan tombol "Rilis Sekarang" di depan printer.
              </p>
            </div>
          </label>
        </div>

        <button type="submit" id="btn-submit" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm">
          Kirim ke Antrean Cetak
        </button>
      </form>
    </div>

    <!-- Antrean Dokumen -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 class="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
        <span>📋 Daftar Antrean Cetak</span>
        <span id="queue-count" class="text-xs font-normal text-slate-400">0 dokumen</span>
      </h2>
      <div id="queue-list" class="divide-y divide-slate-100">
        <p class="text-center py-6 text-sm text-slate-400">Belum ada dokumen di antrean.</p>
      </div>
    </div>

  </main>

  <script>
    async function refreshData() {
      try {
        const res = await fetch('/api/state');
        const data = await res.json();
        
        // Update printer status & paper warning
        const pBadge = document.getElementById('printer-badge');
        const pWarning = document.getElementById('paper-warning');
        
        if (data.printer.status === 'READY') {
          pBadge.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span class="text-xs font-semibold text-slate-600">Printer Siap</span>';
          pWarning.classList.add('hidden');
        } else if (data.printer.status === 'OUT_OF_PAPER') {
          pBadge.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span><span class="text-xs font-semibold text-red-600">Kertas Habis!</span>';
          pWarning.classList.remove('hidden');
        } else if (data.printer.status === 'PRINTING') {
          pBadge.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span><span class="text-xs font-semibold text-blue-600">Sedang Mencetak...</span>';
          pWarning.classList.add('hidden');
        }

        // Update quota
        const used = data.quota.used_today;
        const limit = data.quota.daily_limit;
        const pct = Math.min(100, Math.round((used / limit) * 100));
        document.getElementById('quota-text').innerText = `${used} / ${limit} Lembar Terpakai`;
        document.getElementById('quota-bar').style.width = pct + '%';

        // Update queue list
        renderQueue(data.jobs);
      } catch (e) {
        console.error(e);
      }
    }

    function renderQueue(jobs) {
      const container = document.getElementById('queue-list');
      document.getElementById('queue-count').innerText = `${jobs.length} dokumen`;

      if (jobs.length === 0) {
        container.innerHTML = '<p class="text-center py-6 text-sm text-slate-400">Belum ada dokumen di antrean.</p>';
        return;
      }

      container.innerHTML = jobs.map((j, i) => {
        let badge = '';
        let releaseBtn = '';

        if (j.status === 'QUEUED') {
          badge = '<span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">⏳ Antre</span>';
        } else if (j.status === 'LOCKED') {
          badge = '<span class="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">🔒 Terkunci (Rahasia)</span>';
          releaseBtn = `<button onclick="releaseJob('${j.id}')" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">▶️ Rilis Sekarang</button>`;
        } else if (j.status === 'RELEASED') {
          badge = '<span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200">🚀 Siap Keluar (Prioritas)</span>';
        } else if (j.status === 'PRINTING') {
          badge = '<span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200 animate-pulse">🖨️ Sedang Dicetak...</span>';
        } else if (j.status === 'COMPLETED') {
          badge = '<span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">✅ Selesai</span>';
        } else {
          badge = '<span class="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-200">❌ Gagal</span>';
        }

        return `
          <div class="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p class="text-sm font-semibold text-slate-800">${i + 1}. ${j.fileName}</p>
              <p class="text-xs text-slate-400">${j.copies} rangkap • ${j.isColor ? 'Warna' : 'B&W'} • ${j.isDuplex ? 'Bolak-balik' : '1 Sisi'}</p>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center">
              ${badge}
              ${releaseBtn}
            </div>
          </div>
        `;
      }).join('');
    }

    async function submitJob(e) {
      e.preventDefault();
      const fileInput = document.getElementById('file-input');
      if (!fileInput.files[0]) return;

      const btn = document.getElementById('btn-submit');
      btn.disabled = true;
      btn.innerText = 'Mengirim...';

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('copies', document.getElementById('copies').value);
      formData.append('isColor', document.getElementById('color').value);
      formData.append('isDuplex', document.getElementById('duplex').value);
      formData.append('isLocked', document.getElementById('is-locked').checked);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const resData = await res.json();
        if (!res.ok) alert(resData.error || 'Gagal mengirim berkas.');
        fileInput.value = '';
        refreshData();
      } catch (err) {
        alert(err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = 'Kirim ke Antrean Cetak';
      }
    }

    async function releaseJob(jobId) {
      if (!confirm('Apakah Anda sudah berdiri di depan printer Epson L6460? Dokumen akan langsung keluar.')) return;
      await fetch('/api/release', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ jobId })
      });
      refreshData();
    }

    // Auto poll every 4 seconds
    refreshData();
    setInterval(refreshData, 4000);
  </script>
</body>
</html>
"""

class LocalHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/" or parsed.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_PAGE.encode("utf-8"))
        elif parsed.path == "/api/state":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(state).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/release":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)
            job_id = data.get("jobId")
            
            for j in state["jobs"]:
                if j["id"] == job_id and j["status"] == "LOCKED":
                    j["status"] = "RELEASED"
                    print(f"[Queue] Dokumen rahasia dirilis: {j['fileName']} (Melompat ke depan antrean!)")
                    break

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')

        elif parsed.path == "/api/upload":
            content_type = self.headers.get("Content-Type", "")
            if not content_type.startswith("multipart/form-data"):
                self.send_response(400)
                self.end_headers()
                return

            # Read multipart body
            boundary = content_type.split("boundary=")[1].encode()
            length = int(self.headers.get("Content-Length", 0))
            raw_data = self.rfile.read(length)

            parts = raw_data.split(b"--" + boundary)
            file_bytes = None
            filename = f"dokumen_{int(time.time())}.pdf"
            copies = 1
            is_color = False
            is_duplex = False
            is_locked = False

            for part in parts:
                if b'name="file"' in part and b'filename="' in part:
                    header, file_content = part.split(b"\r\n\r\n", 1)
                    file_content = file_content.rstrip(b"\r\n")
                    # Extract original filename
                    header_str = header.decode(errors="ignore")
                    for line in header_str.split("\r\n"):
                        if "filename=" in line:
                            filename = line.split('filename="')[1].split('"')[0]
                    file_bytes = file_content
                elif b'name="copies"' in part:
                    val = part.split(b"\r\n\r\n")[1].rstrip(b"\r\n").decode()
                    copies = int(val) if val.isdigit() else 1
                elif b'name="isColor"' in part:
                    val = part.split(b"\r\n\r\n")[1].rstrip(b"\r\n").decode()
                    is_color = (val == "true")
                elif b'name="isDuplex"' in part:
                    val = part.split(b"\r\n\r\n")[1].rstrip(b"\r\n").decode()
                    is_duplex = (val == "true")
                elif b'name="isLocked"' in part:
                    val = part.split(b"\r\n\r\n")[1].rstrip(b"\r\n").decode()
                    is_locked = (val == "true")

            if not file_bytes:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"error": "File tidak terbaca"}')
                return

            saved_path = os.path.join(UPLOAD_DIR, f"{int(time.time())}_{filename}")
            with open(saved_path, "wb") as f:
                f.write(file_bytes)

            new_job = {
                "id": str(int(time.time() * 1000)),
                "fileName": filename,
                "filePath": saved_path,
                "copies": copies,
                "isColor": is_color,
                "isDuplex": is_duplex,
                "isLocked": is_locked,
                "sheets": copies, # Simple estimate
                "status": "LOCKED" if is_locked else "QUEUED",
                "createdAt": time.strftime("%H:%M:%S")
            }
            state["jobs"].append(new_job)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "job": new_job}).encode("utf-8"))

def main():
    print("=" * 65)
    print("  School Cloud Print - Server Uji Coba Lokal (Epson L6460)")
    print("=" * 65)
    print(f"[*] Printer Terdeteksi : {PRINTER_NAME} ({PRINTER_IP})")
    print(f"[*] Port Web Server    : http://localhost:{PORT}")
    print(f"[*] Buka dari HP       : http://192.168.0.169:{PORT}")
    print("=" * 65)
    print("Tekan CTRL+C untuk menghentikan server.\n")

    # Start background threads
    threading.Thread(target=background_telemetry_loop, daemon=True).start()
    threading.Thread(target=print_file_worker, daemon=True).start()

    server = HTTPServer(("0.0.0.0", PORT), LocalHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Server dihentikan.")
        server.server_close()

if __name__ == "__main__":
    main()
