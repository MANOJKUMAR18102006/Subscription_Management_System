import React, { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const methods = [
  ['cash', 'Cash'],
  ['bank_transfer', 'Bank Transfer'],
  ['upi', 'UPI'],
  ['card', 'Card'],
  ['other', 'Other']
];

const formatMoney = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value || 0));

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

const PaymentManagement = () => {
  const { user } = useAuth();
  const canRecord = ['admin', 'staff'].includes(user?.role);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ search: '', method: 'all', status: 'all', customerId: 'all', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    invoiceId: '', amount: '', paymentMethod: 'cash', paymentDate: new Date().toISOString().slice(0, 10),
    transactionReference: '', notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const requests = [api.get('/payments'), api.get('/payments/invoices')];
      if (canRecord) requests.push(api.get('/payments/customers'));
      const results = await Promise.all(requests);
      setPayments(results[0].data.payments || []);
      setInvoices(results[1].data.invoices || []);
      if (results[2]) setCustomers(results[2].data.customers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [canRecord]);

  const visiblePayments = useMemo(() => payments.filter((payment) => {
    const customer = payment.customerId?.name || '';
    const invoice = payment.invoiceId?.invoiceNumber || '';
    const matchesSearch = !filters.search || `${payment.paymentReference} ${customer} ${invoice}`
      .toLowerCase().includes(filters.search.toLowerCase());
    const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 10) : '';
    return matchesSearch &&
      (filters.method === 'all' || payment.paymentMethod === filters.method) &&
      (filters.status === 'all' || payment.status === filters.status) &&
      (filters.customerId === 'all' || payment.customerId?._id === filters.customerId) &&
      (!filters.from || paymentDate >= filters.from) &&
      (!filters.to || paymentDate <= filters.to);
  }), [payments, filters]);

  const selectedInvoice = invoices.find((invoice) => invoice._id === form.invoiceId);
  const selectedBalance = selectedInvoice
    ? Math.max(0, Number(selectedInvoice.amount) - Number(selectedInvoice.amountPaid || 0))
    : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      setSaving(true);
      await api.post('/payments', form);
      setShowForm(false);
      setForm({ invoiceId: '', amount: '', paymentMethod: 'cash', paymentDate: new Date().toISOString().slice(0, 10), transactionReference: '', notes: '' });
      setNotice('Payment recorded and invoice balance updated atomically.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to record payment');
    } finally {
      setSaving(false);
    }
  };

  const downloadReceipt = async (id) => {
    try {
      const response = await api.get(`/payments/${id}/receipt`);
      const receipt = response.data.receipt;
      const content = [
        `PAYMENT RECEIPT - ${receipt.receiptNumber}`,
        `Invoice: ${receipt.invoice.invoiceNumber}`,
        `Customer: ${receipt.customer.name}`,
        `Amount: ${formatMoney(receipt.amount, receipt.currency)}`,
        `Method: ${methods.find(([value]) => value === receipt.paymentMethod)?.[1] || receipt.paymentMethod}`,
        `Payment date: ${formatDate(receipt.paymentDate)}`,
        `Status: ${receipt.status}`
      ].join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receipt.receiptNumber}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate receipt');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">Module 10: Payment Management</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2">Payments & Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track invoice settlement, partial payments, balances, and payment history.</p>
        </div>
        {canRecord && <button type="button" onClick={() => { setError(''); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"><Plus className="w-4 h-4" /> Record Payment</button>}
      </div>

      {notice && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">{notice}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">{error}</div>}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search reference, invoice, customer" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
        <select value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-xs"><option value="all">All methods</option>{methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-xs"><option value="all">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select>
        {canRecord && <select value={filters.customerId} onChange={(e) => setFilters({ ...filters, customerId: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-xs"><option value="all">All customers</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select>}
        <label className="flex items-center gap-2 text-[10px] text-slate-500">From<input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700" /></label>
        <label className="flex items-center gap-2 text-[10px] text-slate-500">To<input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700" /></label>
        <button type="button" onClick={loadData} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div> : visiblePayments.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No payment records match these filters.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500 uppercase tracking-wider"><tr><th className="p-4">Reference</th><th className="p-4">Invoice / Customer</th><th className="p-4">Method</th><th className="p-4">Amount</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Receipt</th></tr></thead><tbody className="divide-y divide-slate-100">{visiblePayments.map((payment) => <tr key={payment._id} className="hover:bg-slate-50"><td className="p-4 font-semibold text-slate-800">{payment.paymentReference}<div className="text-[10px] text-slate-400">{payment.transactionReference || 'No transaction reference'}</div></td><td className="p-4"><div className="font-medium">{payment.invoiceId?.invoiceNumber}</div><div className="text-slate-500">{payment.customerId?.name}</div><div className="text-[10px] text-amber-600">Balance: {formatMoney(payment.invoiceId?.balanceDue, payment.currency)}</div></td><td className="p-4 capitalize">{methods.find(([value]) => value === payment.paymentMethod)?.[1] || payment.paymentMethod}</td><td className="p-4 font-bold">{formatMoney(payment.amount, payment.currency)}</td><td className="p-4 text-slate-500">{formatDate(payment.paymentDate)}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold capitalize ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{payment.status}</span></td><td className="p-4"><button type="button" onClick={() => downloadReceipt(payment._id)} className="text-blue-600 hover:text-blue-800"><Download className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>}
      </div>

      {showForm && <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"><form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl"><div className="flex justify-between items-center"><h2 className="font-bold text-slate-900">Record payment</h2><button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button></div><label className="block text-xs font-semibold text-slate-600">Invoice<select required value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value, amount: '' })} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg"><option value="">Select an outstanding invoice</option>{invoices.filter((invoice) => Number(invoice.balanceDue ?? invoice.amount - (invoice.amountPaid || 0)) > 0).map((invoice) => <option key={invoice._id} value={invoice._id}>{invoice.invoiceNumber} — {invoice.customerId?.name} — due {formatMoney(invoice.balanceDue ?? invoice.amount, invoice.currency)}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-slate-600">Amount<input required type="number" min="0.01" max={selectedBalance} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg" />{selectedInvoice && <span className="text-[10px] text-slate-500">Outstanding: {formatMoney(selectedBalance, selectedInvoice.currency)}</span>}</label><label className="block text-xs font-semibold text-slate-600">Payment date<input required type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg" /></label></div><label className="block text-xs font-semibold text-slate-600">Payment method<select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg">{methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-xs font-semibold text-slate-600">Transaction reference<input value={form.transactionReference} onChange={(e) => setForm({ ...form, transactionReference: e.target.value })} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg" /></label><label className="block text-xs font-semibold text-slate-600">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="2" className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg" /></label><button disabled={saving} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">{saving ? 'Recording...' : 'Record payment'}</button></form></div>}
    </div>
  );
};

export default PaymentManagement;
