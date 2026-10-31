# Subscription Management System

A secure, enterprise-grade subscription management and recurring billing platform built with the **MERN stack** (MongoDB, Express, React, Node.js), Tailwind CSS, Recharts, JWT authentication, and MongoDB Aggregation Pipelines.

---

## 📌 Module Overview

- **Module 1: Authentication & Role-Based Access Control (RBAC)** — Complete
- **Module 2: Business & Operational Dashboards** — Complete
- **Module 3: Product Management with Dynamic Variants & Auto-Pricing** — Complete
- **Module 4: Subscription Plan Management & Agreed Pricing Retention** — Complete

---

## 📋 Module 4: Subscription Plan Management

### 1. Plan Capabilities & Roles
- **Admin:** Full lifecycle control — create, edit, toggle status, delete, archive plans, and trigger auto-close scans.
- **Staff:** Read-only operational oversight — view plans catalog, inspect availability schedules, and run auto-close scans.
- **Customer:** Self-service subscription — browse available active plans and subscribe with quantity selector respecting minimum thresholds.

### 2. Plan Fields & Schema
- **Plan Name:** e.g., "Enterprise Cloud Suite", "Business Automation Annual".
- **Description:** Clear target audience description and entitlement overview.
- **Linked Product(s):** Multi-product linking (`linkedProducts` array) with primary flag and product-specific minimum quantity.
- **Billing Frequency:** `Daily`, `Weekly`, `Monthly`, `Yearly`.
- **Price:** Recurring base rate per billing cycle.
- **Minimum Quantity:** Enforced minimum license threshold (e.g. 1, 2, 5 units).
- **Available From Date:** Availability start timestamp.
- **Available Until Date:** Expiration timestamp (optional / perpetual).
- **Auto Close Setting:** Automatically transitions plan status to `Closed` when `availableUntil` passes.
- **Allow Early Closure:** Contract toggle permitting or prohibiting early subscription cancellation.
- **Allow Pause:** Contract toggle permitting or prohibiting temporary subscription hold.
- **Allow Renewal:** Contract toggle permitting or prohibiting recurring/manual contract renewal.
- **Plan Status:** `Active`, `Draft`, `Inactive`, `Closed`, `Archived`.
- **Features / Entitlements:** Array of feature deliverables.

### 3. Fulfillments & Safeguards
1. **Multi-Product Linking (Req 1):** One or more products can be bundled into a single plan.
2. **Minimum Quantities (Req 2):** Subscriptions cannot order fewer units than `plan.minQuantity`.
3. **Date Validation (Req 3):** Pre-validation ensures `availableUntil >= availableFrom`.
4. **Auto-Close Processing (Req 4):** Expired plans with `autoClose: true` automatically update to `Closed`.
5. **Contract Lifecycle Permissions (Req 5):** Early closure, pause, and renewal are strictly enforced based on the plan's admin settings.
6. **Unavailable Plan Blocking (Req 6):** Subscriptions are blocked from using expired, scheduled, draft, or closed plans.
7. **Agreed Pricing Retention (Req 7):** Existing subscriptions store a frozen `unitPrice`, `amount`, and `planSnapshot`, guaranteeing their pricing never changes when the original plan is edited.
8. **Plan Listing & Filters (Req 8):** Full server-side pagination, regex search, frequency filters, status filters, and availability filters.
9. **Two-Way Deletion Protection:**
   - Products linked to active plans cannot be deleted.
   - Plans linked to active subscriptions cannot be deleted.

---

## 📦 Module 3: Product Management & Dynamic Pricing

### 1. Product Capabilities & Roles
- **Admin:** Full CRUD access — create, view, edit, archive, and delete products.
- **Staff:** Read-only access — view products catalog, examine variant matrices, and run price calculations.
- **Customer:** Blocked from product management (cannot create, edit, or delete).

### 2. Product Fields
- **Product Name:** e.g., "Business Software", "Cloud CRM Suite".
- **Product Type:** Software, Service, Add-on, Subscription Plan, Hardware.
- **Sales Price:** Base sales price (e.g. ₹2000).
- **Cost Price:** Unit cost to business (e.g. ₹1200).
- **Description / Notes:** Detailed specifications and entitlement notes.
- **Product Image:** Optional thumbnail or hero image URL.
- **Product Status:** `Active`, `Archived`, `Draft`, `Inactive`.

### 3. Dynamic Product Variants & Automatic Price Calculation
- Products support multiple variants (e.g., **Brand**, **Edition**, **Storage**, **Tier**).
- Each variant has option values (e.g. for Brand: `Odoo`, `SAP`, `Salesforce`).
- Each option has an `additionalPrice` (e.g. `₹560`).
- **Automatic Final Price Calculation:**
  $$\text{Final Price} = \text{Base Price} + \sum \text{Option Additional Prices}$$
- **Example:**
  - Product: **Business Software**
  - Base Price: **₹2000**
  - Variant: **Brand** &rarr; Option: **Odoo** (Additional: **₹560**)
  - Final Calculated Price: **₹2560**

### 4. Subscription Protection Guard
- Products linked to active customer subscriptions cannot be deleted directly.
- The system returns an explicit notification: *"Cannot delete 'Product' because it is linked to X active subscription(s). You can safely archive it instead."*
- Safe Archiving retired products allows existing subscription contracts to continue uninterrupted while blocking new signups.

### 5. Search, Filter & Pagination
- **Search:** Search across product name, description, and variant option values.
- **Filters:** Filter by Status (`Active`, `Archived`, `Draft`, `Inactive`) and Type (`Software`, `Service`, `Add-on`, etc.).
- **Pagination:** Server-side pagination with `totalProducts`, `totalPages`, and `currentPage`.

---

## 📊 Module 2: Role-Tailored Business Dashboards

### 1. Executive Admin Dashboard (`/admin/dashboard`)
1. **Total Customers:** Live database count of registered customer accounts, plus new registrations in selected period.
2. **Total Active Subscriptions:** Live count of serviceable subscriptions (`status: 'active'`).
3. **Total Revenue:** Dynamic MongoDB aggregation summing succeeded payment volume within the selected date filter (and lifetime total).
4. **Pending Payments:** Aggregation of unsettled payments and pending invoices.
5. **Overdue Invoices:** Aggregated volume and count of invoices past due date.
6. **Monthly Recurring Revenue (MRR):** Calculated via MongoDB `$cond` aggregation normalizing monthly plans (`amount`) and annual plans (`amount / 12`).
7. **Annual Recurring Revenue (ARR):** Annualized contract value calculated as `MRR * 12`.
8. **Recent Subscriptions:** Chronological list of newest subscriptions populated with customer information.
9. **Recent Payments:** Chronological list of latest transaction references, payment methods, and timestamps.
10. **Revenue Overview Chart:** Multi-month historical revenue trend powered by **Recharts AreaChart**.
11. **Subscription Status Distribution Chart:** Donut chart powered by **Recharts PieChart** mapping active, trialing, past due, and canceled plans.

### 2. Operations Staff Dashboard (`/staff/dashboard`)
1. **Total Customers:** Registered customer directory counter.
2. **Active Subscriptions:** Active customer accounts requiring daily operational support.
3. **Pending Invoices:** Invoices awaiting payment verification and reminder dispatch.
4. **Overdue Invoices:** Escalated invoices requiring subscriber assistance.
5. **Recent Customer Activities:** Live audit trail of events (e.g. payment successes, payment failures, subscription renewals, plan upgrades).
- **Renewal Queue:** Quick actions for staff to dispatch reminders and operational notices.

### 3. Customer Self-Service Portal (`/customer/dashboard`)
1. **My Active Subscriptions:** Isolated customer plan details, billing cycle, renewal dates, and plan entitlements.
2. **Next Billing Date:** Earliest upcoming scheduled renewal with remaining days countdown badge.
3. **Outstanding Invoices:** Personal unpaid or overdue invoices.
4. **Total Payments:** Total payments settled by this customer with transaction counter.
5. **Recent Invoices & Payment History:** Downloadable PDF invoice receipts and card transaction records.

---

## 🗓️ Dynamic Date Filtering

All dashboards dynamically filter metrics and aggregations via:
- **Today**
- **This Month**
- **Last Month**
- **This Year**
- **All Time**

---

## 🚀 Features & Requirements Fulfilled

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **1. Registration & Login Pages** | Clean, responsive SaaS design with instant demo account switchers, password visibility toggles, and live feedback. | ✅ |
| **2. Registration Fields** | Full Name, Email, Password, Confirm Password, optional Company and Phone. | ✅ |
| **3. Unique Email Constraint** | Case-insensitive MongoDB unique index and controller pre-check. | ✅ |
| **4. Password Complexity** | Strict enforcement: **> 8 characters**, **1 uppercase letter**, **1 lowercase letter**, and **1 special character**. Interactive real-time checklist UI. | ✅ |
| **5. Bcrypt Password Hashing** | Salt round 12 hashing in Mongoose pre-save hook. Passwords never stored in plain text. | ✅ |
| **6. JWT Authentication** | Signed tokens (`id`, `role`), returned on authentication and verified via Bearer header or HTTP-only cookies. | ✅ |
| **7. Forgot & Reset Password** | Secure crypto tokens hashed with SHA-256 and 15-minute expiration. Email reset link dispatched via Nodemailer with dev simulator. | ✅ |
| **8. Three Defined Roles** | **Admin** (Complete system access), **Staff** (Limited access to daily operations), and **Customer** (Self-service access only to own records). | ✅ |
| **9. Admin-Only Staff Provisioning** | Public registration is restricted to Customer role. Only Admin users can create Staff accounts via `/api/users/staff`. | ✅ |
| **10. API Route Protection** | `protect` JWT middleware and `authorize('admin', 'staff', ...)` role middlewares blocking unauthorized HTTP requests with 401/403. | ✅ |
| **11. Role-Based Redirection** | Users are automatically redirected to their role dashboard after login (`/admin/dashboard`, `/staff/dashboard`, `/customer/dashboard`). | ✅ |
| **12. Frontend Route Protection** | `ProtectedRoute` guards frontend routes and sidebar navigation; unauthorized requests trigger a sleek 403 Forbidden page. | ✅ |

---

## 🔐 Demo Credentials

The database comes pre-seeded with accounts for all three roles:

| Role | Email Address | Password | Permissions & Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@subscriptionms.com` | `Admin@123456` | Complete system access: User & Staff management, Staff provisioning, global subscriptions, audit logs |
| **Operations Staff** | `staff@subscriptionms.com` | `Staff@123456` | Limited daily operations: Subscriber lookups, subscription renewal checks, operational tickets |
| **Customer** | `customer@subscriptionms.com` | `Customer@123456` | Self-service only: Private subscriptions, invoices, receipts, payment methods |

> **Tip:** The Login page includes one-click demo pill buttons to automatically fill and test any of the 3 roles!

---

## 🛠️ Architecture & Tech Stack

- **Backend:**
  - Node.js & Express.js (REST API)
  - MongoDB & Mongoose (ODM with unique indexes and schema validation)
  - `jsonwebtoken` for secure stateless JWT tokens
  - `bcryptjs` (salt 12) for strong password hashing
  - `crypto` for high-entropy password reset tokens
  - `nodemailer` for email reset links
- **Frontend:**
  - React 19 + Vite (Fast HMR)
  - Tailwind CSS v4 for clean SaaS styling
  - `react-router-dom` v7 for client-side routing & protected routes
  - `lucide-react` for modern icon set
  - `axios` with interceptors for automatic JWT injection and 401 handling

---

## 📁 Project Directory Structure

```
Subscription_Management_System/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Logout, Forgot & Reset Password
│   │   └── userController.js     # Staff creation (Admin), User list, Role data
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer verification
│   │   ├── roleMiddleware.js     # authorize('admin', 'staff', 'customer')
│   │   └── errorMiddleware.js    # Centralized error handler
│   ├── models/
│   │   └── User.js               # User schema with select:false sensitive fields
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   └── userRoutes.js         # /api/users routes
│   ├── utils/
│   │   ├── generateToken.js      # JWT generator
│   │   ├── sendEmail.js          # Nodemailer helper with dev logger
│   │   └── validator.js          # Regex & password requirement validation
│   ├── .env                      # Environment configuration
│   ├── seed.js                   # Seed script for demo accounts
│   ├── server.js                 # Express application entry point
│   └── verify-full-system.js     # Automated verification suite
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosInstance.js  # Axios with auth header interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # SaaS header with user menu & notifications
│   │   │   ├── PasswordRequirements.jsx # Real-time password validator checklist
│   │   │   ├── ProtectedRoute.jsx# Role-based route guard
│   │   │   ├── RoleBadge.jsx     # Visual indicator for Admin/Staff/Customer
│   │   │   └── Sidebar.jsx       # Role-tailored collapsible sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global authentication state
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx    # Split-screen SaaS authentication layout
│   │   │   └── DashboardLayout.jsx # App layout with sidebar & navbar
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── StaffManagement.jsx # Admin-only staff provisioning
│   │   │   │   └── UserManagement.jsx  # Global user directory
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx           # Sign in with demo switcher
│   │   │   │   ├── Register.jsx        # Customer registration
│   │   │   │   ├── ForgotPassword.jsx  # Request password reset link
│   │   │   │   └── ResetPassword.jsx   # Reset password via token
│   │   │   ├── dashboards/
│   │   │   │   ├── AdminDashboard.jsx  # Full system governance view
│   │   │   │   ├── StaffDashboard.jsx  # Daily operations desk
│   │   │   │   └── CustomerDashboard.jsx# Isolated customer portal
│   │   │   ├── Profile.jsx       # Account & password settings
│   │   │   ├── Unauthorized.jsx  # 403 Access Denied
│   │   │   └── NotFound.jsx      # 404 Not Found
│   │   ├── App.jsx               # Route definitions
│   │   ├── index.css             # Tailwind CSS styles
│   │   └── main.jsx              # React root mount
│   ├── index.html
│   └── vite.config.js            # Vite config with API proxy
└── README.md
```

---

## 🏃 Getting Started

### 1. Prerequisites
- **Node.js** v18+ installed
- **MongoDB** running locally on port 27017 (or MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed     # Seeds Admin, Staff, and Customer demo accounts
npm start        # Runs backend on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Runs frontend on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Verification Suite

To verify all 12 requirements programmatically:
```bash
cd backend
node verify-full-system.js
```

---

## 🔒 Security Best Practices Implemented

1. **Password Privacy (`select: false`):** Mongoose schema explicitly excludes `password`, `resetPasswordToken`, and `resetPasswordExpire` from default query projections.
2. **Safe Serialization (`toJSON`):** Custom `userSchema.methods.toJSON` strips out any sensitive internal properties before API response delivery.
3. **Password Hashing:** Passwords hashed with 12 bcrypt salt rounds prior to persistence.
4. **Token Hashing:** Password reset tokens are stored in the database hashed using SHA-256 (`crypto.createHash('sha256')`); only the raw token is sent in the link.
5. **Token Expiration:** Password reset tokens expire in 15 minutes.
6. **Strict RBAC Middleware:**
   - Public: `/api/auth/register` (Customer only), `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password/:token`
   - Customer Isolation: Customer can only query their own subscriptions and invoices.
   - Staff Scope: Limited to daily subscriber operations.
   - Admin Exclusive: `/api/users/staff` (Staff provisioning), user status toggle, and full system analytics.

