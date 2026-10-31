import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  Briefcase,
  UserCheck
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected with session_expired or message
  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get('session_expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(email, password);
      // Requirement 11: Redirect users to the appropriate dashboard after login
      const targetDashboard = getDashboardPath(res.user.role);
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Login Quick-Fill
  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to manage subscriptions and invoices"
    >
      {/* Demo Credentials Quick Switcher */}
      <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            Quick Test Demo Accounts:
          </span>
          <span className="text-[10px] text-slate-400">Click to fill</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('admin@subscriptionms.com', 'Admin@123456')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-center group"
          >
            <Shield className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-purple-900">Admin</span>
            <span className="text-[9px] text-purple-600">Full Access</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('staff@subscriptionms.com', 'Staff@123456')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-center group"
          >
            <Briefcase className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-amber-900">Staff</span>
            <span className="text-[9px] text-amber-600">Daily Ops</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemoAccount('customer@subscriptionms.com', 'Customer@123456')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-center group"
          >
            <UserCheck className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-emerald-900">Customer</span>
            <span className="text-[9px] text-emerald-600">Self-Service</span>
          </button>
        </div>
      </div>

      {sessionExpired && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Your session has expired. Please log in again to continue.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Registration Link */}
      <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-5">
        Don&apos;t have an account yet?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
          Create customer account
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;

