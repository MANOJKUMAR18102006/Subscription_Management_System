# Subscription Management System — Module 1: Authentication & Role-Based Access Control (RBAC)

A secure, enterprise-grade authentication and role-based authorization system built with the **MERN stack** (MongoDB, Express, React, Node.js) with Tailwind CSS, JWT authentication, Bcrypt password hashing, and role isolation.

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

