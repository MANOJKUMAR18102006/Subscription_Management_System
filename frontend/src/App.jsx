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
import ReportsDashboard from './pages/reports/ReportsDashboard';

// Admin / Staff Management
import StaffManagement from './pages/admin/StaffManagement';
import UserManagement from './pages/admin/UserManagement';

// Product Management (Module 3)
import ProductList from './pages/products/ProductList';
import PaymentManagement from './pages/payments/PaymentManagement';

// Subscription Plan Management (Module 4) & Subscriptions (Module 6)
import PlanList from './pages/plans/PlanList';
import SubscriptionManagement from './pages/subscriptions/SubscriptionManagement';
import SubscriptionDetail from './pages/subscriptions/SubscriptionDetail';

// Tax Management & Discount Management
import TaxManagement from './pages/taxes/TaxManagement';
import DiscountManagement from './pages/discounts/DiscountManagement';

// Invoice Management & Recurring Billing
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import InvoicePDFView from './pages/invoices/InvoicePDFView';

// Quotation Management (Module 5)
import QuotationList from './pages/quotations/QuotationList';
import QuotationForm from './pages/quotations/QuotationForm';
import QuotationDetail from './pages/quotations/QuotationDetail';
import QuotationPDFView from './pages/quotations/QuotationPDFView';
import QuotationTemplates from './pages/quotations/QuotationTemplates';

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
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ReportsDashboard />
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
        {/* Module 5: Quotation Management */}
        <Route
          path="/quotations"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <QuotationList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <QuotationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <QuotationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <QuotationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/:id/print"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <QuotationPDFView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotation-templates"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <QuotationTemplates />
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

        {/* Module 6: Subscription Management */}
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <SubscriptionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <SubscriptionDetail />
            </ProtectedRoute>
          }
        />

        {/* Tax Management */}
        <Route
          path="/taxes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <TaxManagement />
            </ProtectedRoute>
          }
        />

        {/* Discount Management */}
        <Route
          path="/discounts"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <DiscountManagement />
            </ProtectedRoute>
          }
        />

        {/* Invoice Management & Recurring Billing */}
        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <InvoiceList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <InvoiceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id/print"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
              <InvoicePDFView />
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
