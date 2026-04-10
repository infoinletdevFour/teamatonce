import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download, Printer, Send, FileText, Building, Mail,
  MapPin, Calendar, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { StatusBadge } from '@/components/payment';
import type { Invoice } from '@/types/payment';
import { paymentService } from '@/services/paymentService';

const InvoicePage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError('No invoice ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.getInvoice(invoiceId);

        // Transform API response to Invoice type
        const invoiceData: Invoice = {
          id: data.id,
          invoiceNumber: data.invoice_number || `INV-${data.id.slice(0, 8)}`,
          projectId: data.project_id,
          paymentId: data.payment_id || data.id,
          issueDate: new Date(data.issue_date || data.created_at),
          dueDate: new Date(data.due_date || data.created_at),
          paidDate: data.paid_date ? new Date(data.paid_date) : undefined,
          from: data.from || {
            name: data.developer_name || 'Service Provider',
            company: data.developer_company || '',
            email: data.developer_email || '',
            address: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          },
          to: data.to || {
            name: data.client_name || 'Client',
            company: data.client_company || '',
            email: data.client_email || '',
            address: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          },
          items: data.items || [{
            id: '1',
            description: data.description || 'Project Services',
            quantity: 1,
            unitPrice: data.amount || 0,
            amount: data.amount || 0,
          }],
          subtotal: data.subtotal || data.amount || 0,
          taxRate: data.tax_rate || 0,
          tax: data.tax || 0,
          total: data.total || data.amount || 0,
          currency: data.currency || 'USD',
          status: data.status || 'pending',
          notes: data.notes || '',
          createdAt: new Date(data.created_at),
        };

        setInvoice(invoiceData);
      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice #${invoice.invoiceNumber}`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('From:', 20, yPos);
    pdf.text('To:', pageWidth / 2 + 10, yPos);

    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    // From details
    pdf.text(invoice.from.name, 20, yPos);
    pdf.text(invoice.to.name, pageWidth / 2 + 10, yPos);
    yPos += 5;

    if (invoice.from.company) {
      pdf.text(invoice.from.company, 20, yPos);
    }
    if (invoice.to.company) {
      pdf.text(invoice.to.company, pageWidth / 2 + 10, yPos);
    }
    yPos += 5;

    pdf.text(invoice.from.address, 20, yPos);
    pdf.text(invoice.to.address, pageWidth / 2 + 10, yPos);
    yPos += 5;

    pdf.text(`${invoice.from.city}, ${invoice.from.state} ${invoice.from.postalCode}`, 20, yPos);
    pdf.text(`${invoice.to.city}, ${invoice.to.state} ${invoice.to.postalCode}`, pageWidth / 2 + 10, yPos);
    yPos += 5;

    pdf.text(invoice.from.email, 20, yPos);
    pdf.text(invoice.to.email, pageWidth / 2 + 10, yPos);

    yPos += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Issue Date: ${format(invoice.issueDate, 'MMM dd, yyyy')}`, 20, yPos);
    pdf.text(`Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}`, pageWidth / 2 + 10, yPos);

    yPos += 15;
    pdf.setFontSize(11);
    pdf.text('Description', 20, yPos);
    pdf.text('Qty', pageWidth - 80, yPos);
    pdf.text('Price', pageWidth - 60, yPos);
    pdf.text('Amount', pageWidth - 30, yPos, { align: 'right' });

    yPos += 2;
    pdf.line(20, yPos, pageWidth - 20, yPos);

    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    invoice.items.forEach((item) => {
      const splitDesc = pdf.splitTextToSize(item.description, pageWidth - 110);
      pdf.text(splitDesc, 20, yPos);
      pdf.text(item.quantity.toString(), pageWidth - 80, yPos);
      pdf.text(formatCurrency(item.unitPrice, invoice.currency), pageWidth - 60, yPos);
      pdf.text(formatCurrency(item.amount, invoice.currency), pageWidth - 30, yPos, { align: 'right' });
      yPos += splitDesc.length * 5 + 3;
    });

    yPos += 5;
    pdf.line(20, yPos, pageWidth - 20, yPos);

    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Subtotal:', pageWidth - 80, yPos);
    pdf.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 30, yPos, { align: 'right' });

    yPos += 7;
    pdf.text(`Tax (${(invoice.taxRate * 100).toFixed(2)}%):`, pageWidth - 80, yPos);
    pdf.text(formatCurrency(invoice.tax, invoice.currency), pageWidth - 30, yPos, { align: 'right' });

    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Total:', pageWidth - 80, yPos);
    pdf.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 30, yPos, { align: 'right' });

    if (invoice.notes) {
      yPos += 15;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      const splitNotes = pdf.splitTextToSize(invoice.notes, pageWidth - 40);
      pdf.text(splitNotes, 20, yPos);
    }

    pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`);
    const body = encodeURIComponent(
      `Please find attached invoice ${invoice.invoiceNumber} for the amount of ${formatCurrency(invoice.total, invoice.currency)}.\n\n` +
      `Due Date: ${format(invoice.dueDate, 'MMMM dd, yyyy')}\n\n` +
      `Thank you for your business!`
    );
    window.location.href = `mailto:${invoice.to.email}?subject=${subject}&body=${body}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600 font-semibold">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The invoice you are looking for could not be loaded.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900">Invoice</h1>
                <p className="text-gray-600 mt-1">Professional invoice for your project</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generatePDF}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendEmail}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Email
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Invoice Card */}
        <motion.div
          ref={invoiceRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden"
        >
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-4xl font-black mb-2">INVOICE</h2>
                <p className="text-emerald-100">Invoice #{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={invoice.status} />
                <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-sm opacity-90">Total Amount</div>
                  <div className="text-3xl font-black">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Dates */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-700">Issue Date</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {format(invoice.issueDate, 'MMM dd, yyyy')}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-700">Due Date</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {format(invoice.dueDate, 'MMM dd, yyyy')}
                </div>
              </div>

              {invoice.paidDate && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-700">Paid Date</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {format(invoice.paidDate, 'MMM dd, yyyy')}
                  </div>
                </div>
              )}
            </div>

            {/* Parties Information */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  From (Service Provider)
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="font-bold text-xl text-gray-900 mb-1">{invoice.from.name}</div>
                  {invoice.from.company && (
                    <div className="text-gray-700 mb-3">{invoice.from.company}</div>
                  )}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        {invoice.from.address}<br />
                        {invoice.from.city}, {invoice.from.state} {invoice.from.postalCode}<br />
                        {invoice.from.country}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span>{invoice.from.email}</span>
                    </div>
                    {invoice.from.taxId && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span>Tax ID: {invoice.from.taxId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  To (Client)
                </h3>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="font-bold text-xl text-gray-900 mb-1">{invoice.to.name}</div>
                  {invoice.to.company && (
                    <div className="text-gray-700 mb-3">{invoice.to.company}</div>
                  )}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        {invoice.to.address}<br />
                        {invoice.to.city}, {invoice.to.state} {invoice.to.postalCode}<br />
                        {invoice.to.country}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span>{invoice.to.email}</span>
                    </div>
                    {invoice.to.taxId && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span>Tax ID: {invoice.to.taxId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Items</h3>
              <div className="bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-blue-50 border-b-2 border-gray-300">
                      <th className="text-left py-4 px-6 font-bold text-gray-700">Description</th>
                      <th className="text-center py-4 px-6 font-bold text-gray-700 w-20">Qty</th>
                      <th className="text-right py-4 px-6 font-bold text-gray-700 w-32">Unit Price</th>
                      <th className="text-right py-4 px-6 font-bold text-gray-700 w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="py-4 px-6 text-gray-700">{item.description}</td>
                        <td className="py-4 px-6 text-center text-gray-700">{item.quantity}</td>
                        <td className="py-4 px-6 text-right font-semibold text-gray-900">
                          {formatCurrency(item.unitPrice, invoice.currency)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900">
                          {formatCurrency(item.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full md:w-1/2">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200 space-y-3">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-bold text-lg">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-semibold">Tax ({(invoice.taxRate * 100).toFixed(2)}%):</span>
                    <span className="font-bold text-lg">{formatCurrency(invoice.tax, invoice.currency)}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">Total:</span>
                      <span className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {invoice.status === 'paid' && invoice.paidDate && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-green-900 text-lg">Payment Received</div>
                    <div className="text-sm text-green-700">
                      Paid on {format(invoice.paidDate, 'MMMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                {invoice.paymentId && (
                  <div className="text-sm text-green-700 font-semibold">
                    Payment ID: {invoice.paymentId}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-700 leading-relaxed">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t-2 border-gray-200 p-6 text-center text-sm text-gray-600">
            <p className="font-semibold mb-2">Powered by Team@Once</p>
            <p>All transactions are processed securely through our platform</p>
          </div>
        </motion.div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-printable, #invoice-printable * {
              visibility: visible;
            }
            #invoice-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default InvoicePage;
