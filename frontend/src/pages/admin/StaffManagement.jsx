import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import RoleBadge from '../../components/RoleBadge';
import PasswordRequirements, { checkPasswordCriteria } from '../../components/PasswordRequirements';
import {
  UserPlus,
  Users,
  Shield,
  Lock,
  Mail,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Power
} from 'lucide-react';

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: 'Operations Desk',
    phone: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=staff');
      if (res.data.success) {
        setStaffList(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const criteria = checkPasswordCriteria(formData.password, formData.confirmPassword);
    if (!criteria.allMet) {
      setFormError('Password must contain > 8 characters, 1 uppercase, 1 lowercase, and 1 special character');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/users/staff', formData);
      if (res.data.success) {
        setFormSuccess(`Staff account created successfully for ${formData.name}`);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          company: 'Operations Desk',
          phone: ''
        });
        fetchStaff();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create staff account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/users/${userId}/toggle-status`);
      if (res.data.success) {
        fetchStaff();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
              Requirement 9 Enforced
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Account Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Only System Administrators have authorization to provision and manage internal Operations Staff accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Staff Form Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Provision New Staff</h2>
          </div>

          {formSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Sarah Ops"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="sarah@subscriptionms.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Temporary Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <PasswordRequirements
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              showMatch={true}
            />

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Unit / Role Note
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Operations Desk"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Staff Member</span>
            </button>
          </form>
        </div>

        {/* Staff Roster Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Active Staff Directory ({staffList.length})
            </h2>
            <button
              type="button"
              onClick={fetchStaff}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Refresh List
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No staff members registered yet. Use the form on the left to provision one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Staff Member</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                            {st.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{st.name}</p>
                            <p className="text-[11px] text-slate-400">{st.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{st.company || 'Operations'}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            st.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${st.isActive ? 'bg-emerald-600' : 'bg-red-600'}`} />
                          {st.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {new Date(st.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(st._id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
                            st.isActive
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{st.isActive ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;

