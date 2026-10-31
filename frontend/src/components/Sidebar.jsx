import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Receipt,
  Layers,
  Settings,
  LogOut,
  X,
  Sparkles,
  ClipboardList,
  ShieldAlert,
  Headphones
} from 'lucide-react';

const Sidebar = ({ mobileOpen, closeMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build role-tailored navigation items
  const getNavItems = () => {
    const role = user?.role || 'customer';

    if (role === 'admin') {
      return [
        { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Staff Management', to: '/admin/staff', icon: UserPlus, badge: 'Admin Only' },
        { label: 'User Directory', to: '/admin/users', icon: Users },
        { label: 'Subscriptions Oversight', to: '/admin/subscriptions', icon: Layers },
        { label: 'Audit Logs', to: '/admin/audit', icon: ClipboardList }
      ];
    }

    if (role === 'staff') {
      return [
        { label: 'Operations Desk', to: '/staff/dashboard', icon: LayoutDashboard },
        { label: 'Subscribers', to: '/staff/subscribers', icon: Users },
        { label: 'Active Subscriptions', to: '/staff/subscriptions', icon: Layers },
        { label: 'Support Queue', to: '/staff/support', icon: Headphones, badge: 'Daily Ops' }
      ];
    }

    // Customer
    return [
      { label: 'My Portal', to: '/customer/dashboard', icon: LayoutDashboard },
      { label: 'My Subscriptions', to: '/customer/subscriptions', icon: Layers },
      { label: 'Invoices & Receipts', to: '/customer/invoices', icon: Receipt },
      { label: 'Payment Methods', to: '/customer/payments', icon: CreditCard }
    ];
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
              SubScribe
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/60">
                SaaS
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Subscription & RBAC</p>
          </div>
        </div>

        {/* Close mobile sidebar */}
        <button
          type="button"
          onClick={closeMobileSidebar}
          className="lg:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Access Scope:</span>
        <RoleBadge role={user?.role} size="sm" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Workspace Navigation
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-800">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Preferences & Settings
          </p>
          <NavLink
            to="/profile"
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Account Security</span>
          </NavLink>
        </div>
      </nav>

      {/* Bottom User Profile Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

