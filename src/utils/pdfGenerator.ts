import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export function generateInvoicePDF(order: Order): void {
  const doc = new jsPDF();

  // Primary brand colors
  const primaryColor = [73, 101, 42]; // #B8F23A GREEN
  const darkSlate = [7, 7, 7]; // #070707 BLACK
  const mutedGray = [85, 90, 82]; // #555A52 GRAY 01
  const lightBg = [247, 248, 240]; // #F7F8F0 IVORY

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 15, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('GLOBALHOST CLOUD', 15, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('Infraestructura Global de Dominios & Servicios Digitales', 15, 38);
  doc.text('Soporte: support@banelio.com | https://banelio.com', 15, 43);

  // Invoice Tag (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FACTURA FISCAL', 140, 32);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`N° Factura: ${order.invoiceNumber}`, 140, 38);
  doc.text(`Fecha: ${new Date(order.date).toLocaleDateString()}`, 140, 43);
  doc.text(`Estado: PAGADO (PAID)`, 140, 48);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 53, 195, 53);

  // Billed To info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('FACTURADO A:', 15, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Cliente: ${order.customerName}`, 15, 68);
  doc.text(`Email: ${order.customerEmail}`, 15, 73);
  doc.text(`País / Región: ${order.countryCode}`, 15, 78);
  doc.text(`Método de Pago: ${order.paymentMethod}`, 15, 83);

  // Table of Items
  const tableRows = order.items.map((item) => [
    item.description,
    item.serviceType,
    item.quantity.toString(),
    `$${item.unitPriceUSD.toFixed(2)} USD`,
    `$${(item.unitPriceUSD * item.quantity).toFixed(2)} USD`
  ]);

  autoTable(doc, {
    startY: 92,
    head: [['Descripción del Servicio', 'Tipo', 'Cant.', 'Precio Unitario', 'Total']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [73, 101, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    }
  });

  // Calculate position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Financial Summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text(`Subtotal:`, 130, finalY);
  doc.text(`$${order.subtotalUSD.toFixed(2)} USD`, 175, finalY, { align: 'right' });

  if (order.discountUSD > 0) {
    doc.text(`Descuento Cupón:`, 130, finalY + 6);
    doc.text(`-$${order.discountUSD.toFixed(2)} USD`, 175, finalY + 6, { align: 'right' });
  }

  doc.text(`Impuestos (${(order.taxPercent * 100).toFixed(0)}%):`, 130, finalY + 12);
  doc.text(`+$${order.taxUSD.toFixed(2)} USD`, 175, finalY + 12, { align: 'right' });

  // Total
  doc.setDrawColor(203, 213, 225);
  doc.line(130, finalY + 16, 195, finalY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`TOTAL PAGADO:`, 130, finalY + 23);
  doc.text(`${order.totalPaidInCurrency.toFixed(2)} ${order.currencyPaid}`, 195, finalY + 23, { align: 'right' });

  // Legal / Footer Note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text(
    'Este documento constituye un comprobante de pago válido emitido electrónicamente. Todos los servicios han sido aprovisionados.',
    15,
    270
  );
  doc.text('Gracias por confiar en la infraestructura Cloud de Banelio.', 15, 275);

  // Save the PDF directly to client download
  doc.save(`Factura_${order.invoiceNumber}.pdf`);
}
