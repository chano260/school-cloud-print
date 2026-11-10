import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Cloud Server WebSocket URL (e.g., https://print.namasekolah.sch.id)
  cloudServerUrl: process.env.CLOUD_SERVER_URL || 'http://localhost:3000',
  agentSecretKey: process.env.AGENT_SECRET_KEY || 'default-school-agent-key',

  // Epson EcoTank L6460 Local IP address on school Wi-Fi/LAN
  printerIp: process.env.PRINTER_IP || '192.168.1.150',
  printerSnmpCommunity: process.env.PRINTER_SNMP_COMMUNITY || 'public',

  // Windows Spooler exact printer name in Windows Control Panel / Settings
  windowsPrinterName: process.env.WINDOWS_PRINTER_NAME || 'EPSON L6460 Series',

  // Polling intervals in milliseconds
  telemetryIntervalMs: parseInt(process.env.TELEMETRY_INTERVAL_MS || '15000', 10),
};
