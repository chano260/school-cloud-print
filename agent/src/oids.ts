/**
 * SNMP OID Definitions for Printer MIB (RFC 3805) & Host Resources MIB (RFC 2790)
 * Supported by Epson EcoTank L6460 over UDP Port 161
 */
export const OIDS = {
  // RFC 2790: Error status byte (paper jam, out of paper, door open)
  hrPrinterDetectedErrorState: '1.3.6.1.2.1.25.3.5.1.2.1',

  // RFC 3805: Supply table (Black, Cyan, Magenta, Yellow, Maintenance Box)
  // Sub-indices typically:
  // .1 = Black Ink, .2 = Cyan Ink, .3 = Magenta Ink, .4 = Yellow Ink, .5 = Maintenance Box
  prtMarkerSuppliesDescription: '1.3.6.1.2.1.43.11.1.1.6.1',
  prtMarkerSuppliesMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1',
  prtMarkerSuppliesLevel: '1.3.6.1.2.1.43.11.1.1.9.1',

  // General Printer Status (1=other, 2=unknown, 3=idle/ready, 4=printing, 5=warmup)
  hrPrinterStatus: '1.3.6.1.2.1.25.3.5.1.1.1',
};
