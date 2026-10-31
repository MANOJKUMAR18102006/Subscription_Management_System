import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import CustomerPortal from './pages/customer/CustomerPortal';

// Admin / Staff Management
import StaffManagement from './pages/admin/StaffManagement';
import UserManagement from './pages/admin/UserManagement';

// Product Management (Module 3)
import ProductList from './pages/products/ProductList';
import PaymentManagement from './pages/payments/PaymentManagement';

// Subscription Plan Management (Module 4)
import PlanList from './pages/plans/PlanList';
import SubscriptionManagement from './pages/subscriptions/SubscriptionManagement';

// User Account
import Profile from './pages/Profile';

// Errors
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

// Root redirect handler
const RootRedirect = () => {
  const { user, isAuthenticated, loading, getDashboardPath } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected Routes inside Dashboard Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin Only Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* Module 3: Products & Catalog (Admin & Staff) */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ProductList />
            </ProtectedRoute>
          }
        />
        {/* Module 4: Subscription Plans (Admin, Staff, Customer) */}
        <Route
          path="/plans"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <PlanList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <PaymentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SubscriptionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff Only Routes */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/subscribers"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <SubscriptionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/support"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Customer Only Routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerPortal initialTab="subscriptions" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/invoices"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerPortal initialTab="billing" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/payments"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerPortal initialTab="billing" />
            </ProtectedRoute>
          }
        />

        {/* Shared Authenticated Routes */}
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Special Pages */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
