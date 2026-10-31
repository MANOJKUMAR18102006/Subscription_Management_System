import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

const Unauthorized = () => {
  const { user, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const targetPath = user?.role ? getDashboardPath(user.role) : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50/50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-200">
            HTTP 403 &middot; Access Forbidden
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Role Permission Required
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your current account does not have sufficient role privileges to access this resource. Backend API middleware and frontend guards have blocked access.
          </p>
        </div>

        {user && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Your Current Role:</span>
            <RoleBadge role={user.role} />
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            to={targetPath}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all inline-flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Go to My Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

