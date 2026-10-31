import React, { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Download, FileBarChart, Loader2, RefreshCw } from 'lucide-react';
import api from '../../api/axiosInstance';

const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value) => value ? new Date(value).toLocaleDateString() : '-';
const initialFilters = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), granularity: 'daily', customerId: 'all', planId: 'all', status: 'all', page: 1 };
};

const ReportsDashboard = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value && value !== 'all')).toString(), [filters]);
  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/reports?${query}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [query]);

  const exportReport = async (format) => {
    try {
      const response = await api.get(`/reports/export?${query}&format=${format}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `subscription-report.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to export ${format.toUpperCase()} report.`);
    }
  };

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const metrics = data?.metrics || {};
  const cards = [
    ['Active subscriptions', metrics.activeSubscriptions],
    ['Total customers', metrics.customers],
    ['Collected payments', money(metrics.paymentsReceived)],
    ['Invoiced revenue', money(metrics.invoicedRevenue)],
    ['MRR', money(metrics.mrr)],
    ['ARR', money(metrics.arr)],
    ['Outstanding balance', money(metrics.outstandingAmount)],
    ['Overdue invoices', metrics.overdueInvoices],
    ['Renewals', metrics.renewalCount],
    ['Cancelled / closed', metrics.canceledSubscriptions]
  ];

  if (loading && !data) return <div className="flex flex-col items-center justify-center py-32 gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /><p className="text-sm text-slate-500">Calculating financial reports...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div><span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">Module 12: Reports & Analytics</span><h1 className="text-2xl font-extrabold text-slate-900 mt-3">Financial reporting center</h1><p className="text-sm text-slate-500 mt-1">Actual recorded payments, invoices, and subscription records for finance and administration.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={load} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"><RefreshCw className="w-4 h-4 inline mr-1" />Refresh</button><button type="button" onClick={() => exportReport('csv')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"><Download className="w-4 h-4 inline mr-1" />CSV</button><button type="button" onClick={() => exportReport('pdf')} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"><FileBarChart className="w-4 h-4 inline mr-1" />PDF</button></div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">{cards.map(([label, value]) => <div key={label} className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-extrabold text-slate-900 mt-2">{value ?? 0}</p></div>)}</div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-600">From<input type="date" value={filters.from} onChange={(event) => update('from', event.target.value)} className="block mt-1 px-2 py-2 border border-slate-200 rounded-lg text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">To<input type="date" value={filters.to} onChange={(event) => update('to', event.target.value)} className="block mt-1 px-2 py-2 border border-slate-200 rounded-lg text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">Revenue grouping<select value={filters.granularity} onChange={(event) => update('granularity', event.target.value)} className="block mt-1 px-2 py-2 border border-slate-200 rounded-lg text-sm font-normal"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
        <label className="text-xs font-semibold text-slate-600">Customer<select value={filters.customerId} onChange={(event) => update('customerId', event.target.value)} className="block mt-1 min-w-44 px-2 py-2 border border-slate-200 rounded-lg text-sm font-normal"><option value="all">All customers</option>{(data?.options.customers || []).map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Plan<select value={filters.planId} onChange={(event) => update('planId', event.target.value)} className="block mt-1 min-w-40 px-2 py-2 border border-slate-200 rounded-lg text-sm font-normal"><option value="all">All plans</option>{(data?.options.plans || []).map((plan) => <option key={plan._id} value={plan._id}>{plan.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Subscription status<select value={filters.status} onChange={(event) => update('status', event.target.value)} className="block mt-1 px-2 py-2 border border-slate-200 rounded-lg text-sm font-normal"><option value="all">All statuses</option>{['active', 'trialing', 'past_due', 'paused', 'canceled', 'closed', 'expired'].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Collected revenue by period"><ResponsiveContainer width="100%" height={280}><AreaChart data={data?.charts.revenue || []}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => money(value)} /><Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#bfdbfe" name="Collected" /></AreaChart></ResponsiveContainer></ChartCard>
        <ChartCard title="New subscriptions by period"><ResponsiveContainer width="100%" height={280}><BarChart data={data?.charts.subscriptionTrends || []}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="newSubscriptions" fill="#10b981" name="New subscriptions" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Subscription status"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={data?.charts.subscriptionStatuses || []} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} label>{(data?.charts.subscriptionStatuses || []).map((entry, index) => <Cell key={entry.status} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Payments by method"><ResponsiveContainer width="100%" height={280}><BarChart data={data?.charts.paymentMethods || []}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="method" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="amount" fill="#8b5cf6" name="Collected amount" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5"><ReportTable title="Invoice report" headers={['Invoice', 'Customer', 'Status', 'Amount', 'Balance']} rows={(data?.details.invoices || []).map((item) => [item.invoiceNumber, item.customerId?.name || '-', item.status, money(item.amount), money(item.balanceDue)])} /><ReportTable title="Payment history" headers={['Reference', 'Customer', 'Method', 'Amount', 'Date']} rows={(data?.details.payments || []).map((item) => [item.paymentReference, item.customerId?.name || '-', item.paymentMethod, money(item.amount), date(item.paymentDate)])} /></div>
      <ReportTable title="Subscription report" headers={['Plan', 'Customer', 'Status', 'Amount', 'Created']} rows={(data?.details.subscriptions || []).map((item) => [item.planName, item.customerId?.name || '-', item.status, money(item.amount), date(item.createdAt)])} />
    </div>
  );
};

const ChartCard = ({ title, children }) => <div className="bg-white rounded-2xl border border-slate-200 p-5"><h2 className="font-bold text-slate-900 mb-3">{title}</h2>{children}</div>;
const ReportTable = ({ title, headers, rows }) => <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-5 border-b border-slate-100"><h2 className="font-bold text-slate-900">{title}</h2></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr>{headers.map((header) => <th key={header} className="text-left px-5 py-3 text-xs text-slate-500">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-3 whitespace-nowrap">{cell}</td>)}</tr>)}</tbody></table></div>{!rows.length && <p className="p-5 text-sm text-slate-500">No records found for the selected filters.</p>}</div>;

export default ReportsDashboard;
