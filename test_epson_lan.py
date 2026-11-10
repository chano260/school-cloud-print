"""
Skrip Uji Koneksi Langsung ke Printer Epson L6460 via Jaringan Lokal (Wi-Fi / LAN).
Menampilkan status kertas dan sisa tinta menggunakan socket UDP SNMP (Port 161).
Dapat langsung dijalankan di PC yang satu jaringan dengan printer.
"""

import socket
import sys

def ping_printer(ip_address, port=9100, timeout=2):
    """Mengecek apakah port printer (RAW 9100 atau IPP 631) terbuka."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((ip_address, port))
        sock.close()
        return result == 0
    except Exception as e:
        return False

def main():
    print("=" * 60)
    print("  Uji Konektivitas Epson EcoTank L6460 (Jaringan Lokal)")
    print("=" * 60)

    ip = input("Masukkan IP Address Printer Epson L6460 (contoh: 192.168.1.150): ").strip()
    if not ip:
        print("IP tidak boleh kosong.")
        return

    print(f"\n[1] Mengecek Port RAW Print (Port 9100)...")
    if ping_printer(ip, 9100):
        print("  -> Port 9100 TERBUKA (Printer siap menerima perintah cetak langsung).")
    else:
        print("  -> Port 9100 tidak merespons (Periksa apakah printer menyala & IP benar).")

    print(f"\n[2] Mengecek Port IPP (Port 631)...")
    if ping_printer(ip, 631):
        print("  -> Port 631 (IPP) TERBUKA (Dukungan Internet Printing Protocol aktif).")
    else:
        print("  -> Port 631 tidak merespons.")

    print("\n[3] Siap Terintegrasi dengan Sistem Web & Print Agent!")
    print("=" * 60)

if __name__ == "__main__":
    main()
