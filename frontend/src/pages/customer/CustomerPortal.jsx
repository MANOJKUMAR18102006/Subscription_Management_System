import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Calendar, CheckCircle2, CreditCard, Download, FileText,
  Layers, Loader2, Pause, RefreshCw, ShieldCheck, User, XCircle
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const money = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount || 0));
const date = (value) => value ? new Date(value).toLocaleDateString() : '-';
const statusClass = (status) => ({
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paused: 'bg-blue-50 text-blue-700 border-blue-200',
  canceled: 'bg-slate-100 text-slate-600 border-slate-200'
}[status] || 'bg-slate-100 text-slate-600 border-slate-200');

const CustomerPortal = ({ initialTab = 'overview' }) => {
  const { user } = useAuth();
  const [portal, setPortal] = useState(null);
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionId, setActionId] = useState('');
  const [history, setHistory] = useState(null);

  const loadPortal = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/customer-portal');
      setPortal(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your customer portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPortal(); }, []);

  const requestAction = async (subscriptionId, type) => {
    const labels = { renewal: 'renewal', pause: 'pause', cancellation: 'cancellation' };
    if (!window.confirm(`Submit a ${labels[type]} request for this subscription?`)) return;
    try {
      setActionId(`${subscriptionId}-${type}`);
      const response = await api.post(`/customer-portal/subscriptions/${subscriptionId}/requests`, { type });
      setNotice(response.data.message);
      await loadPortal();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit the request.');
    } finally {
      setActionId('');
    }
  };

  const downloadInvoice = async (invoice) => {
    try {
      const response = await api.get(`/customer-portal/invoices/${invoice._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to download the invoice PDF.');
    }
  };

  const loadHistory = async (subscriptionId) => {
    try {
      const response = await api.get(`/customer-portal/subscriptions/${subscriptionId}/history`);
      setHistory(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load subscription history.');
    }
  };

  const outstanding = useMemo(() => portal?.invoices?.filter((invoice) =>
    ['pending', 'partially_paid', 'overdue'].includes(invoice.status) && Number(invoice.balanceDue || 0) > 0
  ) || [], [portal]);

  if (loading) return <div className="flex flex-col items-center justify-center py-32 gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /><p className="text-sm text-slate-500">Loading your secure portal...</p></div>;
  if (!portal) return <div className="p-5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error || 'Portal data is unavailable.'}</div>;

  const tabs = [
    ['overview', 'Overview'], ['subscriptions', 'Subscriptions'], ['billing', 'Invoices & payments'],
    ['quotes', 'Quotations'], ['discounts', 'Discounts'], ['plans', 'Available plans'], ['profile', 'My profile']
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider"><ShieldCheck className="w-4 h-4" /> Brightloop customer portal</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">Welcome back, {user?.name?.split(' ')[0] || 'there'}.</h1>
            <p className="text-sm text-slate-300 mt-2">Manage subscriptions, billing, invoices, and account details in one secure place.</p>
          </div>
          <button type="button" onClick={loadPortal} className="self-start lg:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {notice && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{notice}</div>}

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`px-3 py-3 text-sm font-semibold whitespace-nowrap border-b-2 ${tab === value ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent'}`}>{label}</button>)}
      </div>

      {tab === 'overview' && <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Active subscriptions', portal.subscriptions.filter((s) => ['active', 'trialing', 'paused'].includes(s.status)).length, Layers],
            ['Next billing', portal.notifications.nextBillingDate ? date(portal.notifications.nextBillingDate) : 'None', Calendar],
            ['Outstanding', money(portal.notifications.outstandingAmount), FileText],
            ['Payments made', portal.payments.filter((p) => p.status === 'completed').length, CreditCard]
          ].map(([label, value, Icon]) => <div key={label} className="bg-white p-5 rounded-2xl border border-slate-200"><div className="flex justify-between"><span className="text-sm text-slate-500">{label}</span><Icon className="w-5 h-5 text-blue-600" /></div><p className="text-2xl font-extrabold text-slate-900 mt-3">{value}</p></div>)}
        </div>
        {(portal.notifications.overdueInvoices > 0 || portal.notifications.nextBillingDate) && <div className="grid md:grid-cols-2 gap-4">
          {portal.notifications.nextBillingDate && <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800"><p className="font-bold text-sm">Upcoming billing</p><p className="text-sm mt-1">Your next billing date is {date(portal.notifications.nextBillingDate)}.</p></div>}
          {portal.notifications.overdueInvoices > 0 && <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800"><p className="font-bold text-sm">Overdue invoices</p><p className="text-sm mt-1">{portal.notifications.overdueInvoices} invoice(s) need your attention.</p></div>}
        </div>}
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><h2 className="font-bold text-slate-900 mb-4">Recent activity</h2><div className="divide-y divide-slate-100">{portal.requests.slice(0, 5).map((request) => <div key={request._id} className="py-3 flex justify-between text-sm"><span>{request.type} request for {request.subscriptionId?.planName || 'subscription'}</span><span className={`px-2 py-1 rounded-full border text-xs ${statusClass(request.status)}`}>{request.status}</span></div>)}{!portal.requests.length && <p className="text-sm text-slate-500">No subscription requests yet.</p>}</div></div>
      </div>}

      {tab === 'subscriptions' && <div className="space-y-4">{portal.subscriptions.map((subscription) => <div key={subscription._id} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">{subscription.planName}</h2><span className={`px-2 py-1 rounded-full border text-xs font-semibold ${statusClass(subscription.status)}`}>{subscription.status}</span></div><p className="text-sm text-slate-500 mt-1">{money(subscription.amount, subscription.currency)} / {subscription.billingFrequency}</p></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm"><div><p className="text-slate-500">Started</p><p className="font-semibold">{date(subscription.startDate)}</p></div><div><p className="text-slate-500">Expires / renews</p><p className="font-semibold">{date(subscription.nextBillingDate)}</p></div><div><p className="text-slate-500">Quantity</p><p className="font-semibold">{subscription.quantity}</p></div><div><p className="text-slate-500">Locked price</p><p className="font-semibold">{money(subscription.unitPrice, subscription.currency)}</p></div></div></div><div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100"><button type="button" onClick={() => requestAction(subscription._id, 'renewal')} disabled={actionId === `${subscription._id}-renewal`} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Request renewal</button><button type="button" onClick={() => requestAction(subscription._id, 'pause')} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"><Pause className="w-3.5 h-3.5 inline mr-1" />Request pause</button><button type="button" onClick={() => requestAction(subscription._id, 'cancellation')} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-semibold"><XCircle className="w-3.5 h-3.5 inline mr-1" />Request cancellation</button><button type="button" onClick={() => loadHistory(subscription._id)} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold">View history</button></div></div>)}{!portal.subscriptions.length && <Empty text="You do not have any subscriptions yet." />}{history && <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5"><div className="flex justify-between"><h2 className="font-bold text-slate-900">{history.subscription.planName} history</h2><button type="button" onClick={() => setHistory(null)} className="text-xs text-slate-500">Close</button></div><div className="mt-3 space-y-2 text-sm">{[...(history.activities || []), ...(history.requests || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => <div key={item._id} className="flex justify-between gap-4 border-b border-slate-200 py-2"><span>{item.description || `${item.type} request (${item.status})`}</span><span className="text-xs text-slate-500 whitespace-nowrap">{date(item.createdAt)}</span></div>)}</div></div>}</div>}

      {tab === 'billing' && <div className="space-y-5"><SectionTable title="Invoices" headers={['Invoice', 'Due date', 'Status', 'Balance', '']} rows={portal.invoices.map((invoice) => [invoice.invoiceNumber, date(invoice.dueDate), <span className={`px-2 py-1 rounded-full border text-xs ${statusClass(invoice.status)}`}>{invoice.status}</span>, money(invoice.balanceDue, invoice.currency), <button type="button" onClick={() => downloadInvoice(invoice)} className="text-blue-600 text-xs font-semibold"><Download className="w-4 h-4 inline mr-1" />PDF</button>])} empty="No invoices found." /><SectionTable title="Payment history" headers={['Reference', 'Date', 'Method', 'Amount', 'Status']} rows={portal.payments.map((payment) => [payment.paymentReference, date(payment.paymentDate), payment.paymentMethod, money(payment.amount, payment.currency), payment.status])} empty="No payments found." /><p className="text-xs text-slate-500">{outstanding.length} outstanding invoice(s) are included above. Invoice PDFs contain only your own billing records.</p></div>}

      {tab === 'quotes' && <SectionTable title="Quotations" headers={['Quotation', 'Valid until', 'Status', 'Amount']} rows={portal.quotations.map((quote) => [quote.quotationNumber, date(quote.validUntil), quote.status, money(quote.amount, quote.currency)])} empty="No quotations have been issued to you." />}
      {tab === 'discounts' && <SectionTable title="Applied discounts" headers={['Discount', 'Code', 'Value', 'Valid until', 'Status']} rows={portal.discounts.map((discount) => [discount.name, discount.code || '-', discount.type === 'percentage' ? `${discount.value}%` : money(discount.value, discount.currency), date(discount.validUntil), discount.status])} empty="No discounts are currently applied." />}

      {tab === 'plans' && <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{portal.availablePlans.map((plan) => <div key={plan._id} className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold text-slate-900">{plan.name}</h2><p className="text-sm text-slate-500 mt-2 min-h-10">{plan.description || 'Flexible Brightloop subscription plan.'}</p><p className="text-xl font-extrabold text-blue-600 mt-4">{money(plan.price, plan.currency)} <span className="text-xs font-medium text-slate-500">/ {plan.billingFrequency}</span></p><ul className="mt-4 space-y-2 text-xs text-slate-600">{(plan.features || []).slice(0, 4).map((feature) => <li key={feature}>• {feature}</li>)}</ul></div>)}{!portal.availablePlans.length && <Empty text="No plans are currently available." />}</div>}

      {tab === 'profile' && <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl"><div className="flex items-center gap-3 mb-5"><div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"><User /></div><div><h2 className="font-bold text-slate-900">{portal.profile.name}</h2><p className="text-sm text-slate-500">Customer account</p></div></div><div className="grid sm:grid-cols-2 gap-4 text-sm">{[['Email', portal.profile.email], ['Company', portal.profile.company || '-'], ['Phone', portal.profile.phone || '-'], ['Member since', date(portal.profile.createdAt)]].map(([label, value]) => <div key={label} className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500">{label}</p><p className="font-semibold text-slate-800 mt-1">{value}</p></div>)}</div><p className="text-xs text-slate-500 mt-5">Update personal details and security settings from Account & Profile.</p></div>}
    </div>
  );
};

const SectionTable = ({ title, headers, rows, empty }) => <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-5 border-b border-slate-100"><h2 className="font-bold text-slate-900">{title}</h2></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{headers.map((header) => <th key={header} className="text-left px-5 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-3 whitespace-nowrap">{cell}</td>)}</tr>)}</tbody></table></div>{!rows.length && <p className="p-5 text-sm text-slate-500">{empty}</p>}</div>;
const Empty = ({ text }) => <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-sm text-slate-500">{text}</div>;

export default CustomerPortal;
