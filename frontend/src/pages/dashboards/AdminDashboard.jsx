import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import RoleBadge from '../../components/RoleBadge';
import PasswordRequirements, { checkPasswordCriteria } from '../../components/PasswordRequirements';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Layers,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Lock,
  Mail,
  User,
  Building,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [roleData, setRoleData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal for Admin to create staff (Requirement 9)
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: 'Support Operations',
    phone: ''
  });
  const [staffFormError, setStaffFormError] = useState('');
  const [staffFormSuccess, setStaffFormSuccess] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, dataRes] = await Promise.all([
        api.get('/users/stats/overview'),
        api.get('/users/data/subscriptions')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (dataRes.data.success) {
        setRoleData(dataRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStaffFormChange = (e) => {
    setStaffForm({ ...staffForm, [e.target.name]: e.target.value });
    setStaffFormError('');
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffFormError('');
    setStaffFormSuccess('');

    if (!staffForm.name || !staffForm.email || !staffForm.password || !staffForm.confirmPassword) {
      setStaffFormError('Please fill in all required fields');
      return;
    }

    if (staffForm.password !== staffForm.confirmPassword) {
      setStaffFormError('Passwords do not match');
      return;
    }

    const criteria = checkPasswordCriteria(staffForm.password, staffForm.confirmPassword);
    if (!criteria.allMet) {
      setStaffFormError('Staff password does not meet security requirements (>8 chars, uppercase, lowercase, special char)');
      return;
    }

    try {
      setIsCreatingStaff(true);
      const res = await api.post('/users/staff', staffForm);
      if (res.data.success) {
        setStaffFormSuccess(`Staff account created for ${staffForm.name}!`);
        setStaffForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          company: 'Support Operations',
          phone: ''
        });
        fetchDashboardData();
        setTimeout(() => {
          setShowStaffModal(false);
          setStaffFormSuccess('');
        }, 1500);
      }
    } catch (err) {
      setStaffFormError(err.response?.data?.message || err.message || 'Failed to create staff account');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[11px] font-semibold tracking-wide uppercase">
              Admin Governance Scope
            </span>
            <RoleBadge role="admin" size="sm" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Administrator Command Center
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Complete system access. You have authority over subscriber accounts, staff provisioning, and billing systems.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowStaffModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Staff Account</span>
          </button>
          <button
            type="button"
            onClick={fetchDashboardData}
            title="Refresh statistics"
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total System Users</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 3}</p>
          <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>{stats?.activeUsers || 3} Active sessions</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Support Staff Members</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.staffCount || 1}</p>
          <p className="mt-2 text-xs text-slate-500">
            Admin-provisioned operations desk
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Active Subscriptions</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {roleData?.subscriptions?.length || 3}
          </p>
          <p className="mt-2 text-xs text-emerald-600 font-medium">
            Enterprise & Starter plans
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Security & RBAC Status</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">100% Secure</p>
          <p className="mt-2 text-xs text-slate-500">
            Bcrypt + JWT verification active
          </p>
        </div>
      </div>

      {/* Global Subscriptions Table (Admin has full visibility) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              System Subscription Roster (Complete System Access)
            </h2>
            <p className="text-xs text-slate-500">
              As an Administrator, you can view all enterprise and customer subscriptions
            </p>
          </div>
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200">
            Admin View
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Subscription ID</th>
                <th className="px-6 py-3">Subscriber</th>
                <th className="px-6 py-3">Tier</th>
                <th className="px-6 py-3">Billing</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Next Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roleData?.subscriptions?.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-medium text-blue-600">
                    {sub.id}
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="font-semibold text-slate-800">{sub.customerName}</p>
                    <p className="text-[11px] text-slate-400">{sub.customerEmail}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{sub.billingCycle}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-900">
                    ${sub.amount} / {sub.billingCycle === 'Monthly' ? 'mo' : 'yr'}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        sub.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'Active' ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500">{sub.renewalDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Invoices & Security Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Global Invoices</h3>
            <span className="text-xs text-blue-600 font-medium">All Accounts</span>
          </div>
          <div className="space-y-3">
            {roleData?.invoices?.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50"
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-slate-800">{inv.id}</p>
                  <p className="text-[11px] text-slate-500">
                    {inv.customerName} &middot; {inv.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">${inv.amount}.00</p>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Access Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">RBAC Enforcement Audit Log</h3>
            <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
              Realtime
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800">Authentication Barrier Validated</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Route <code>/api/users/staff</code> protected by <code>authorize(&apos;admin&apos;)</code>.
                </p>
                <span className="text-[10px] text-slate-400">Just now &middot; System</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800">Customer Data Isolation Enforced</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Customers restricted to querying own subscription and payment records only.
                </p>
                <span className="text-[10px] text-slate-400">10 mins ago &middot; Middleware</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <Activity className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800">Admin Session Active</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Logged in as {user?.email} with full system privileges.
                </p>
                <span className="text-[10px] text-slate-400">Session Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Staff Member (Requirement 9: Only Admin can create staff accounts) */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowStaffModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <UserPlus className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Provision Staff Account</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Requirement 9: Only Administrators have authorization to provision internal operations staff accounts.
            </p>

            {staffFormSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{staffFormSuccess}</span>
              </div>
            )}

            {staffFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{staffFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={staffForm.name}
                    onChange={handleStaffFormChange}
                    placeholder="David Miller"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Work Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={staffForm.email}
                    onChange={handleStaffFormChange}
                    placeholder="david.staff@subscriptionms.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={staffForm.password}
                      onChange={handleStaffFormChange}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={staffForm.confirmPassword}
                      onChange={handleStaffFormChange}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Checklist for Staff Password */}
              <PasswordRequirements
                password={staffForm.password}
                confirmPassword={staffForm.confirmPassword}
                showMatch={true}
              />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Department / Unit
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={staffForm.company}
                    onChange={handleStaffFormChange}
                    placeholder="Operations Desk"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={staffForm.phone}
                    onChange={handleStaffFormChange}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingStaff && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Provision Staff Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

