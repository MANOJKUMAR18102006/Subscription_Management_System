import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { Printer, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';

const QuotationPDFView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quotations/${id}`);
        if (res.data.success) {
          setQuotation(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quotation for printing');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Sparkles className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Preparing printable quotation document...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-slate-200 text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Print Error</h3>
        <p className="text-sm text-slate-500 mt-1">{error || 'Quotation not found'}</p>
        <button
          onClick={() => navigate('/quotations')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      {/* Non-printing Control Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(`/quotations/${id}`)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotation
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Printable Sheet (Standard A4 dimensions styling) */}
      <div className="max-w-4xl mx-auto bg-white p-10 sm:p-14 rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-8 print:max-w-none text-slate-800">
        {/* Header: Company & Quotation Info */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">SubScribe SaaS</h1>
                <p className="text-xs text-slate-500">Cloud Infrastructure & Software Solutions</p>
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-3 space-y-0.5 leading-relaxed">
              <p>Technology Tower 4, Cyber City Phase 2</p>
              <p>Bengaluru, Karnataka 560100, India</p>
              <p>GSTIN: 29AABCU9603R1ZM • billing@subscribesaas.io</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2 border border-blue-200">
              Commercial Quotation
            </span>
            <h2 className="text-2xl font-black text-slate-900">{quotation.quotationNumber}</h2>
            <div className="text-xs text-slate-600 mt-2 space-y-1">
              <p>
                <span className="text-slate-400">Issue Date:</span>{' '}
                <span className="font-semibold">{new Date(quotation.createdDate).toLocaleDateString()}</span>
              </p>
              <p>
                <span className="text-slate-400">Expiry Date:</span>{' '}
                <span className="font-bold text-slate-900">
                  {new Date(quotation.expiryDate).toLocaleDateString()}
                </span>
              </p>
              <p>
                <span className="text-slate-400">Payment Terms:</span>{' '}
                <span className="font-semibold">{quotation.paymentTerms || 'Net 30'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer / Prepared For Section */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Quotation Prepared For:
            </div>
            <div className="text-sm font-bold text-slate-900">{quotation.customer?.name}</div>
            {quotation.customer?.company && (
              <div className="text-slate-700 font-medium">{quotation.customer.company}</div>
            )}
            <div className="text-slate-500 mt-1">{quotation.customer?.email}</div>
            {quotation.customer?.phone && <div className="text-slate-500">{quotation.customer.phone}</div>}
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Account / Agreement Terms:
            </div>
            <div className="text-slate-700 leading-relaxed">
              <p>
                <span className="font-medium text-slate-500">Status:</span>{' '}
                <span className="font-semibold">{quotation.status}</span>
              </p>
              <p>
                <span className="font-medium text-slate-500">Currency:</span>{' '}
                <span className="font-semibold">{quotation.currency || 'INR'} (₹)</span>
              </p>
              <p>
                <span className="font-medium text-slate-500">Validity:</span>{' '}
                <span className="font-semibold">{quotation.validityDuration} Calendar Days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b-2 border-slate-800 text-[11px] font-bold text-slate-900 uppercase">
              <tr>
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Item Description</th>
                <th className="py-2.5 px-2 text-center w-16">Qty</th>
                <th className="py-2.5 px-2 text-right w-24">Rate (₹)</th>
                <th className="py-2.5 px-2 text-right w-20">Discount</th>
                <th className="py-2.5 px-2 text-right w-20">GST</th>
                <th className="py-2.5 px-2 text-right w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Plans */}
              {quotation.plans?.map((pl, idx) => (
                <tr key={`pl-${idx}`}>
                  <td className="py-3 px-2 text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-slate-900">{pl.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Recurring Subscription ({pl.billingFrequency || 'Monthly'})
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-medium">{pl.quantity}</td>
                  <td className="py-3 px-2 text-right">{Number(pl.unitPrice || 0).toFixed(2)}</td>
                  <td className="py-3 px-2 text-right">{pl.discount ? `${pl.discount}%` : '-'}</td>
                  <td className="py-3 px-2 text-right">{pl.taxRate || 18}%</td>
                  <td className="py-3 px-2 text-right font-bold text-slate-900">
                    {Number(pl.lineTotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Products */}
              {quotation.products?.map((p, idx) => (
                <tr key={`p-${idx}`}>
                  <td className="py-3 px-2 text-slate-400">
                    {(quotation.plans?.length || 0) + idx + 1}
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    {p.variant && <div className="text-[11px] text-slate-500">{p.variant}</div>}
                  </td>
                  <td className="py-3 px-2 text-center font-medium">{p.quantity}</td>
                  <td className="py-3 px-2 text-right">{Number(p.unitPrice || 0).toFixed(2)}</td>
                  <td className="py-3 px-2 text-right">{p.discount ? `${p.discount}%` : '-'}</td>
                  <td className="py-3 px-2 text-right">{p.taxRate || 18}%</td>
                  <td className="py-3 px-2 text-right font-bold text-slate-900">
                    {Number(p.lineTotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation & Totals Summary */}
        <div className="border-t border-slate-200 pt-4 flex justify-end">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(quotation.subtotal || 0).toFixed(2)}
              </span>
            </div>

            {quotation.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Total Discount Applied:</span>
                <span className="font-semibold">
                  -₹{Number(quotation.discountAmount || 0).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>GST (18% Statutory):</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(quotation.taxAmount || 0).toFixed(2)}
              </span>
            </div>

            <div className="pt-2 border-t-2 border-slate-800 flex justify-between text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-blue-600">
                ₹{Number(quotation.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms and Signatures */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-[11px] text-slate-600 space-y-4">
          <div>
            <span className="font-bold text-slate-900">Terms & Conditions:</span>
            <p className="whitespace-pre-wrap mt-1 leading-relaxed">
              {quotation.termsAndConditions ||
                '1. Quotation is valid until the specified expiry date.\n2. Payment terms as agreed above.\n3. Taxes applicable as per statutory rates.'}
            </p>
          </div>

          {/* Signature acceptance block */}
          <div className="grid grid-cols-2 gap-12 pt-8 text-xs">
            <div>
              <div className="border-b border-slate-400 pb-8"></div>
              <div className="font-semibold text-slate-900 mt-2">Authorized Signatory</div>
              <div className="text-[10px] text-slate-400">SubScribe SaaS Solutions Pvt. Ltd.</div>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-8"></div>
              <div className="font-semibold text-slate-900 mt-2">Customer Acceptance Signature</div>
              <div className="text-[10px] text-slate-400">
                Name: {quotation.customer?.name} • Date: _________________
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPDFView;

