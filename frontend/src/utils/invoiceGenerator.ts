/**
 * Invoice PDF Generator Utility
 *
 * Generates professional PDF invoices for milestone payments
 * using jsPDF library.
 */

import { jsPDF } from 'jspdf';
import type { PaymentResponseDto } from '@/services/paymentService';

export interface InvoiceData {
  payment: PaymentResponseDto;
  milestoneName: string;
  projectName: string;
  clientName?: string;
  developerName?: string;
  companyName?: string;
}

/**
 * Format currency for display
 */
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Generate invoice number from payment ID and date
 */
const generateInvoiceNumber = (payment: PaymentResponseDto): string => {
  if (payment.invoice_number) {
    return payment.invoice_number;
  }
  const date = new Date(payment.created_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = payment.id.substring(0, 8).toUpperCase();
  return `INV-${year}${month}-${shortId}`;
};

/**
 * Get payment status label
 */
const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Paid',
    failed: 'Failed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return statusLabels[status] || status;
};

/**
 * Generate and download invoice PDF
 */
export const generateInvoicePDF = (data: InvoiceData): void => {
  const { payment, milestoneName, projectName, clientName, developerName, companyName } = data;

  // Create new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = [59, 130, 246]; // Blue
  const textColor = [31, 41, 55]; // Gray-800
  const lightGray = [107, 114, 128]; // Gray-500
  const borderColor = [229, 231, 235]; // Gray-200

  let yPos = 20;

  // ============================================
  // HEADER
  // ============================================

  // Company Logo/Name
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Team@Once', 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Secure Milestone Payments', 20, 33);

  // Invoice Label
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 20, 28, { align: 'right' });

  yPos = 55;

  // ============================================
  // INVOICE DETAILS
  // ============================================

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Invoice Number and Date - Left Side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(generateInvoiceNumber(payment), 60, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(payment.created_at), 60, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 20, yPos);

  // Status badge
  const status = getStatusLabel(payment.status);
  const statusColor = payment.status === 'completed' ? [34, 197, 94] : [234, 179, 8]; // green or yellow
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(status.toUpperCase(), 60, yPos);

  // Right side - Payment ID
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Payment ID: ${payment.id}`, pageWidth - 20, 55, { align: 'right' });

  yPos += 20;

  // ============================================
  // FROM / TO SECTION
  // ============================================

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);

  // From (Platform/Company)
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', 20, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(companyName || 'Team@Once Platform', 20, yPos);
  yPos += 5;
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Secure Escrow Payment Service', 20, yPos);

  // To (Client)
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', pageWidth / 2, yPos - 11);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName || 'Client', pageWidth / 2, yPos - 5);

  yPos += 25;

  // ============================================
  // DIVIDER LINE
  // ============================================

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 15;

  // ============================================
  // PROJECT & MILESTONE INFO
  // ============================================

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Details', 20, yPos);

  yPos += 10;

  // Project name
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Project:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName, 55, yPos);

  yPos += 7;

  // Milestone name
  doc.setFont('helvetica', 'bold');
  doc.text('Milestone:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(milestoneName, 55, yPos);

  if (developerName) {
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Developer:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(developerName, 55, yPos);
  }

  yPos += 20;

  // ============================================
  // ITEMS TABLE
  // ============================================

  // Table Header
  doc.setFillColor(248, 250, 252); // Gray-50
  doc.rect(20, yPos - 5, pageWidth - 40, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  doc.text('DESCRIPTION', 25, yPos + 2);
  doc.text('TYPE', 100, yPos + 2);
  doc.text('AMOUNT', pageWidth - 25, yPos + 2, { align: 'right' });

  yPos += 15;

  // Table Row - Milestone Payment
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const description = `Milestone Payment: ${milestoneName}`;
  const paymentType = payment.payment_type === 'milestone_escrow' ? 'Escrow' :
                      payment.payment_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const amount = Number(payment.amount) || 0;

  doc.text(description.length > 45 ? description.substring(0, 45) + '...' : description, 25, yPos);
  doc.text(paymentType, 100, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(amount, payment.currency), pageWidth - 25, yPos, { align: 'right' });

  yPos += 10;

  // Divider
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 15;

  // ============================================
  // TOTALS
  // ============================================

  const subtotal = amount;
  const platformFee = Number(payment.platform_fee) || 0;
  const netAmount = Number(payment.net_amount) || (subtotal - platformFee);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 80, yPos);
  doc.text(formatCurrency(subtotal, payment.currency), pageWidth - 25, yPos, { align: 'right' });

  yPos += 8;

  // Platform Fee (if applicable)
  if (platformFee > 0) {
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('Platform Fee:', pageWidth - 80, yPos);
    doc.text(`-${formatCurrency(platformFee, payment.currency)}`, pageWidth - 25, yPos, { align: 'right' });
    yPos += 8;
  }

  // Total
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(pageWidth - 100, yPos - 5, 80, 15, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', pageWidth - 95, yPos + 4);
  doc.text(formatCurrency(subtotal, payment.currency), pageWidth - 25, yPos + 4, { align: 'right' });

  yPos += 30;

  // ============================================
  // PAYMENT INFORMATION
  // ============================================

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Information', 20, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (payment.payment_method) {
    const methodLabel = payment.payment_method === 'stripe' ? 'Credit Card (Stripe)' :
                        payment.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    doc.text(`Payment Method: ${methodLabel}`, 20, yPos);
    yPos += 6;
  }

  if (payment.transaction_id) {
    doc.text(`Transaction ID: ${payment.transaction_id}`, 20, yPos);
    yPos += 6;
  }

  if (payment.transaction_date) {
    doc.text(`Transaction Date: ${formatDate(payment.transaction_date)}`, 20, yPos);
    yPos += 6;
  }

  yPos += 15;

  // ============================================
  // FOOTER
  // ============================================

  // Footer line
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 10;

  // Footer text
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const footerText1 = 'This invoice was automatically generated by Team@Once Platform.';
  const footerText2 = 'All payments are securely processed through our escrow system.';
  const footerText3 = 'For questions or support, please contact support@teamatonce.com';

  doc.text(footerText1, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(footerText2, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(footerText3, pageWidth / 2, yPos, { align: 'center' });

  // Page number
  doc.text(`Page 1 of 1`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });

  // Generated timestamp
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, doc.internal.pageSize.getHeight() - 10);

  // ============================================
  // DOWNLOAD
  // ============================================

  const fileName = `Invoice-${generateInvoiceNumber(payment)}.pdf`;
  doc.save(fileName);
};

export default generateInvoicePDF;
