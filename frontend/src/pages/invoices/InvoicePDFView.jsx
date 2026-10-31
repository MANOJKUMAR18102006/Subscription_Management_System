import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { Printer, ArrowLeft, Sparkles, AlertCircle, Receipt, CheckCircle2 } from 'lucide-react';

const InvoicePDFView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${id}`);
        if (res.data.success) {
          setInvoice(res.data.invoice);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoice for printing');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Sparkles className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Preparing printable tax invoice document...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-slate-200 text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Print Error</h3>
        <p className="text-sm text-slate-500 mt-1">{error || 'Invoice not found'}</p>
        <button
          onClick={() => navigate('/invoices')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const isPaid = (invoice.status || '').toLowerCase() === 'paid';

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      {/* Top Floating Action Bar (Hidden during Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => navigate(`/invoices/${id}`)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoice View
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 print:shadow-none print:border-none print:p-6 print:rounded-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  SubScribe SaaS
                </h1>
                <p className="text-xs text-slate-400">Subscription & Billing Management</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              100 Tech Innovation Plaza, Suite 400<br />
              Bangalore, Karnataka 560001, India<br />
              Tax ID / GSTIN: 29AABCU9603R1ZM<br />
              billing@subscribesaas.io
            </p>
          </div>

          <div className="sm:text-right">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              TAX INVOICE
            </h2>
            <div className="mt-2 font-mono text-base font-bold text-blue-600">
              #{invoice.invoiceNumber}
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Invoice Date:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Due Date:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Payment Terms:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {invoice.paymentTerms || 'Net 30'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Billing Cycle:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {invoice.billingFrequency || 'Monthly'}
                </span>
              </div>
            </div>

            {/* Stamp / Status */}
            <div className="mt-3">
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PAID IN FULL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold uppercase rounded-lg">
                  STATUS: {invoice.status?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer & Agreement Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-2">
              BILLED TO:
            </h3>
            <p className="font-bold text-sm text-slate-900">
              {invoice.customerId?.name || 'Valued Customer'}
            </p>
            {invoice.customerId?.company && (
              <p className="text-slate-700 font-medium">{invoice.customerId?.company}</p>
            )}
            <p className="text-slate-500 mt-1">{invoice.customerId?.email}</p>
            {invoice.customerId?.phone && (
              <p className="text-slate-500">{invoice.customerId?.phone}</p>
            )}
          </div>

          <div className="sm:text-right">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-2">
              SUBSCRIPTION AGREEMENT:
            </h3>
            {invoice.subscriptionId ? (
              <>
                <p className="font-mono font-bold text-slate-900">
                  #{invoice.subscriptionId.subscriptionNumber || 'N/A'}
                </p>
                <p className="text-slate-600">
                  Plan: {invoice.subscriptionId.planName || 'Enterprise Subscription'}
                </p>
                <p className="text-slate-400 mt-1">
                  Period: {invoice.billingPeriodStart ? new Date(invoice.billingPeriodStart).toLocaleDateString() : '-'} →{' '}
                  {invoice.billingPeriodEnd ? new Date(invoice.billingPeriodEnd).toLocaleDateString() : '-'}
                </p>
              </>
            ) : (
              <p className="text-slate-500">Direct Invoiced Agreement</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 w-1/2">Item Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Discount</th>
                <th className="py-2.5 text-right">Tax</th>
                <th className="py-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.invoiceLines && invoice.invoiceLines.length > 0 ? (
                invoice.invoiceLines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="py-3">
                      <div className="font-semibold text-slate-900">{line.name}</div>
                      {line.variant && <div className="text-[11px] text-slate-400">Variant: {line.variant}</div>}
                    </td>
                    <td className="py-3 text-center font-mono">{line.quantity}</td>
                    <td className="py-3 text-right font-mono">₹{line.unitPrice?.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-slate-600">
                      {line.discount > 0 ? `${line.discount}%` : '-'}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600">
                      {line.taxRate > 0 ? `${line.taxRate}%` : '-'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      ₹{line.lineTotal?.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">No line items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="py-6 flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 text-xs">
          <div className="max-w-md space-y-3">
            {invoice.discountDetails && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs">
                <span className="font-bold">Promotional Coupon:</span> {invoice.discountDetails.code} (Saved ₹{invoice.discountDetails.amount?.toLocaleString()})
              </div>
            )}

            <div className="space-y-1 text-slate-500">
              <p className="font-bold text-slate-700">Bank Remittance Instructions:</p>
              <p>Account Name: SubScribe SaaS Technologies Pvt Ltd</p>
              <p>Account Number: 9876543210987</p>
              <p>IFSC / Routing Code: HDFC0001234</p>
              <p>Bank: HDFC Bank, Tech Park Branch</p>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">₹{(invoice.subtotal || 0).toLocaleString()}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Total Savings / Discount:</span>
                <span className="font-mono">- ₹{invoice.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-blue-700">
              <span>Applicable Taxes:</span>
              <span className="font-mono">+ ₹{(invoice.taxAmount || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
              <span>Invoice Total:</span>
              <span className="font-mono">₹{(invoice.totalAmount || invoice.amount || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-semibold pt-1">
              <span>Amount Paid:</span>
              <span className="font-mono">₹{(invoice.amountPaid || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm font-black text-rose-700 pt-2 border-t border-slate-200">
              <span>Outstanding Balance:</span>
              <span className="font-mono">₹{(invoice.balanceDue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-600">Thank you for your business!</p>
          <p>
            This is a computer-generated tax invoice and requires no physical signature. Questions? Contact support@subscribesaas.io.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFView;

