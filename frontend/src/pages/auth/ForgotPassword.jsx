import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setDevResetUrl('');

    if (!email) {
      setError('Please provide your account email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await forgotPassword(email);
      setSuccessMessage(data.message || 'If an account exists, a password reset link has been dispatched.');
      if (data.resetUrl) {
        setDevResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to request password reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a secure link to reset your account password"
    >
      {successMessage ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Email Dispatched</span>
            </div>
            <p className="text-emerald-700 leading-relaxed">
              {successMessage}
            </p>
            <p className="mt-2 text-slate-500 text-[11px]">
              The link will remain active for <strong>15 minutes</strong>. Remember to check your spam folder.
            </p>
          </div>

          {/* Dev Test Helper */}
          {devResetUrl && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2">
              <span className="font-semibold text-blue-900 block">
                🛠️ Quick Testing Simulator:
              </span>
              <p className="text-slate-600 text-[11px]">
                Click the direct reset link below to proceed without needing external email client:
              </p>
              <Link
                to={devResetUrl.replace('http://localhost:5173', '')}
                className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 underline text-xs break-all"
              >
                <span>Follow generated reset password link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Sign in</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Registered Email Address
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <>
                <span>Send Password Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to login</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;

