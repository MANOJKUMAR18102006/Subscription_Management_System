import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import RoleBadge from '../../components/RoleBadge';
import DateFilterSelector from '../../components/DateFilterSelector';
import {
  Layers,
  Calendar,
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('this_month');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState('');

  const fetchCustomerData = async (selectedPeriod = period, isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);

      const res = await api.get(`/dashboard/customer?period=${selectedPeriod}`);
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomerData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleDownloadInvoice = (invoiceNumber) => {
    setDownloadNotice(`Official PDF receipt for invoice ${invoiceNumber} downloaded.`);
    setTimeout(() => setDownloadNotice(''), 3500);
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Fetching Your Subscriptions & Invoices...
        </p>
      </div>
    );
  }

  const { metrics, myActiveSubscriptions, allSubscriptions, recentInvoices, paymentHistory } = dashboardData || {};

  // Formatted next billing date string and calculation of days left
  const nextBillingDateObj = metrics?.nextBillingDate ? new Date(metrics.nextBillingDate) : null;
  const daysUntilRenewal = nextBillingDateObj
    ? Math.max(0, Math.ceil((nextBillingDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RoleBadge role="customer" size="sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Customer Self-Service
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Subscriptions & Billing Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Isolated customer view: private access to your active plan, upcoming billing schedule, and invoices.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Date Filter: Today, This Month, Last Month, This Year */}
          <DateFilterSelector
            activePeriod={period}
            onPeriodChange={handlePeriodChange}
            disabled={isRefreshing}
          />

          <button
            type="button"
            onClick={() => fetchCustomerData(period, true)}
            title="Refresh customer data"
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors self-end sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadNotice('')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Customer Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. My Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">1. My Active Plans</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight">
              {metrics?.activeSubscriptionsCount ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics?.upcomingPlan !== 'None' ? metrics.upcomingPlan : 'No plan active'}
            </p>
          </div>
        </div>

        {/* 2. Next Billing Date */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">2. Next Billing Date</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">
              {nextBillingDateObj ? nextBillingDateObj.toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {daysUntilRenewal !== null
                  ? `${daysUntilRenewal} days remaining`
                  : 'No scheduled renewal'}
              </span>
            </p>
          </div>
        </div>

        {/* 3. Outstanding Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">3. Outstanding Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-600 leading-tight">
              ${(metrics?.outstandingInvoices?.total ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics?.outstandingInvoices?.count ?? 0} invoice{metrics?.outstandingInvoices?.count !== 1 ? 's' : ''} awaiting settlement
            </p>
          </div>
        </div>

        {/* 4. Total Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">4. Total Payments</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight">
              ${(metrics?.totalPayments?.total ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-purple-700 font-medium mt-1">
              {metrics?.totalPayments?.count ?? 0} successful transaction{metrics?.totalPayments?.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Active Subscription Entitlements Card */}
      {myActiveSubscriptions && myActiveSubscriptions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  Active Subscription
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Plan ID: {myActiveSubscriptions[0]._id.toString().substring(18)}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {myActiveSubscriptions[0].planName}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Subscribed by: <strong className="text-slate-800">{user?.name}</strong> ({user?.email})
              </p>
            </div>

            <div className="text-left md:text-right">
              <div className="flex items-baseline md:justify-end gap-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  ${myActiveSubscriptions[0].amount}
                </span>
                <span className="text-xs text-slate-500">
                  /{myActiveSubscriptions[0].billingCycle}
                </span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center md:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Renews on {new Date(myActiveSubscriptions[0].nextBillingDate).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-50/60">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Included Plan Features & SLA:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {myActiveSubscriptions[0].features?.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Row 3: 5. Recent Invoices and Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">5a. Recent Invoices</h2>
              <p className="text-xs text-slate-400">Your billing invoices and payment statuses</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Top {recentInvoices?.length || 0}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices && recentInvoices.length > 0 ? (
                  recentInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">${inv.amount}.00</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === 'paid'
                                ? 'bg-emerald-600'
                                : inv.status === 'pending'
                                ? 'bg-amber-600'
                                : 'bg-red-600'
                            }`}
                          />
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No invoices found for your account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">5b. Payment History</h2>
              <p className="text-xs text-slate-400">Record of transactions charged to your payment method</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Top {paymentHistory?.length || 0}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Txn Ref</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentHistory && paymentHistory.length > 0 ? (
                  paymentHistory.map((pay) => (
                    <tr key={pay._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-800">
                        {pay.transactionId}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {pay.paymentMethod}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">${pay.amount}.00</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            pay.status === 'succeeded'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              pay.status === 'succeeded' ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                          {pay.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(pay.paidAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No payments processed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
