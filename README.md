# VendorBridge

A full-stack procurement management platform built for the Odoo Hackathon. Manages the complete vendor procurement lifecycle — from RFQ creation through quotation comparison, approval, purchase orders, and invoice payment — with role-based access, OTP authentication, AI chatbot, and real-time audit logs.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
- [Features](#features)
- [Roles & Permissions](#roles--permissions)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Procurement Workflow](#procurement-workflow)

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| PostgreSQL + `pg` | Database (raw SQL, no ORM) |
| JWT (`jsonwebtoken`) | Authentication tokens (7-day expiry) |
| `bcryptjs` | Password hashing + OTP hashing |
| `nodemailer` | OTP email delivery |
| `pdfkit` | Invoice PDF generation |
| `qrcode` | RFQ QR code generation |
| `@google/generative-ai` | Gemini 1.5 Flash AI chatbot |
| `express-validator` | Request validation |
| `helmet` + `cors` | Security headers |
| `multer` | File uploads |
| `uuid` | UUID primary keys |

### Frontend
| Package | Purpose |
|---|---|
| React 18 + Vite | SPA framework |
| `react-router-dom` v6 | Client-side routing |
| `axios` | HTTP client with JWT interceptor |

---

## Database Design

### Philosophy: Local-first, No ORM, Full Ownership

VendorBridge deliberately avoids third-party procurement SaaS APIs or external ERP connectors. Every feature — quotation comparison, approval routing, invoice payment, OTP delivery, AI chat context — is implemented as a **custom REST API backed by a relational PostgreSQL schema we own entirely**. This means:

- No vendor lock-in to any external procurement platform
- Full control over business logic (e.g. auto-rejecting competing quotations on approval)
- The schema can be extended or migrated without depending on a third party's release cycle
- All data stays local — no data leaves the system except OTP emails and Gemini AI chat messages

The database layer uses **raw SQL via `node-postgres` (`pg`)** with no ORM. Every query is hand-written in the model files, giving precise control over joins, window functions (e.g. `RANK()` for quotation comparison), and conditional aggregations. Tables are auto-created on startup via `migrate.js` — no external migration tool required.

---

### Schema Overview

12 tables cover the entire procurement domain:

```
users ──────────────────────────────────────────────┐
  │                                                  │
  ├── vendors (user_id → users)                      │
  │     │                                            │
  │     ├── rfq_vendors (vendor_id, rfq_id)          │
  │     ├── quotations (vendor_id, rfq_id)           │
  │     │     └── approvals (quotation_id)           │
  │     ├── purchase_orders (vendor_id, quotation_id)│
  │     └── invoices (vendor_id, po_id)              │
  │                                                  │
  ├── rfqs (created_by → users)                      │
  │     └── rfq_items (rfq_id)                       │
  │                                                  │
  ├── activity_logs (user_id → users)                │
  ├── notifications (user_id → users)                │
  └── otp_requests (email, purpose, payload)─────────┘
```

---

### Table Definitions

#### `users`
Core identity table. Roles are stored as a plain varchar — checked in middleware, not enforced by a DB enum — so role names can evolve without a schema migration.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `name` | varchar | |
| `email` | varchar | Unique |
| `password` | varchar | bcrypt hash |
| `role` | varchar | `admin / procurement_officer / manager / vendor` |
| `is_active` | boolean | Soft-disable without deleting |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

#### `vendors`
Separate from `users` so a vendor account has a business profile. Linked 1-to-1 with a user row.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users |
| `company_name` | varchar | |
| `gst_number` | varchar | |
| `contact_person` | varchar | |
| `email` | varchar | |
| `phone` | varchar | |
| `address` | text | |
| `category` | varchar | |
| `status` | varchar | `active / inactive` |
| `rating` | numeric | 0–5 |

#### `rfqs`
The starting point of every procurement cycle.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `title` | varchar | |
| `description` | text | |
| `quantity` | integer | |
| `unit` | varchar | |
| `deadline` | date | |
| `status` | varchar | `draft → open/published → awarded` |
| `created_by` | uuid | FK → users |

#### `rfq_items`
Line items for an RFQ (multiple items per RFQ).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `rfq_id` | uuid | FK → rfqs |
| `item_name` | varchar | |
| `quantity` | integer | |
| `unit` | varchar | |
| `description` | text | |

#### `rfq_vendors`
Many-to-many join: which vendors are invited to quote on which RFQ.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `rfq_id` | uuid | FK → rfqs |
| `vendor_id` | uuid | FK → vendors |
| `invited_at` | timestamp | |

#### `quotations`
Vendor bids on an RFQ. One vendor, one quotation per RFQ (enforced in application logic). Uses a `RANK()` window function in the compare query to surface the cheapest and fastest bids.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `rfq_id` | uuid | FK → rfqs |
| `vendor_id` | uuid | FK → vendors |
| `price` | numeric | Quoted amount in INR |
| `delivery_days` | integer | |
| `notes` | text | |
| `status` | varchar | `draft → submitted → accepted / rejected` |
| `submitted_at` | timestamp | |

#### `approvals`
One approval record per quotation. Auto-created when a manager acts directly from the Quotations page. When a quotation is approved, all sibling quotations on the same RFQ are rejected in a single bulk UPDATE — enforced in the API, not a DB trigger, so the logic is visible and testable.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `quotation_id` | uuid | FK → quotations |
| `approved_by` | uuid | FK → users (manager/admin) |
| `status` | varchar | `pending → approved / rejected` |
| `remarks` | text | Optional manager note |

#### `purchase_orders`
Created only from an accepted quotation. Carries `vendor_id` and `rfq_id` denormalized for fast lookups without multi-level joins on every list query.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `quotation_id` | uuid | FK → quotations |
| `po_number` | varchar | Auto-generated `PO-XXXXXXXX` |
| `vendor_id` | uuid | FK → vendors (denormalized) |
| `rfq_id` | uuid | FK → rfqs (denormalized) |
| `total_amount` | numeric | |
| `status` | varchar | `draft → sent → acknowledged → completed / cancelled` |
| `notes` | text | |
| `created_by` | uuid | FK → users |

#### `invoices`
Linked to a PO. Created at `sent` status so they are immediately actionable — no manual publish step for new invoices. A CHECK constraint on `status` enforces the allowed transitions at the DB level.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `po_id` | uuid | FK → purchase_orders |
| `invoice_number` | varchar | Auto-generated `INV-XXXXXXXX` |
| `vendor_id` | uuid | FK → vendors (denormalized) |
| `subtotal` | numeric | |
| `tax` | numeric | Default 0 |
| `total` | numeric | subtotal + tax |
| `status` | varchar | `draft / sent / paid / overdue / cancelled` (CHECK constraint) |
| `due_date` | date | |

#### `otp_requests`
Stores hashed OTPs for both registration and password change. `purpose` distinguishes the two flows. `payload` (JSONB) holds the pending registration data so the user row is only written after OTP verification — avoiding orphaned unverified accounts.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | varchar | |
| `user_id` | uuid | Null until verified (password change flow) |
| `purpose` | varchar | `registration / password_change` |
| `payload` | jsonb | Pending user data (name, role, hashed password, etc.) |
| `otp_hash` | varchar | bcrypt hash of the 6-digit OTP |
| `attempts` | integer | Brute-force counter |
| `expires_at` | timestamp | 10-minute window |
| `verified_at` | timestamp | Set on success, null = unverified |

#### `activity_logs`
Append-only audit trail. Every significant API action writes a row here via `activityLogger.js`. Login and registration events are included but filtered out of the dashboard feed for non-admin roles at the query level.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users |
| `action` | varchar | e.g. `RFQ_CREATED`, `APPROVAL_APPROVED`, `INVOICE_STATUS_UPDATED` |
| `entity_type` | varchar | e.g. `rfq`, `quotation`, `invoice` |
| `entity_id` | uuid | The affected record |
| `metadata` | jsonb | Extra context (remarks, status values, etc.) |
| `created_at` | timestamp | |

#### `notifications`
Per-user notification inbox. Marked read individually or in bulk. Decoupled from activity logs so users only see notifications relevant to them.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users |
| `title` | varchar | |
| `message` | text | |
| `is_read` | boolean | Default false |
| `type` | varchar | Notification category |
| `entity_id` | uuid | Linked record |

---

### Design Decisions

**UUIDs everywhere** — all primary keys use `gen_random_uuid()`. No sequential integer IDs that expose record counts or enable enumeration attacks.

**Denormalized vendor_id on POs and Invoices** — avoids a 3-table join (`invoices → purchase_orders → quotations → vendors`) on every list query. The vendor doesn't change after a PO is issued so this is safe.

**JSONB payload on otp_requests** — the entire pending registration (name, role, hashed password, company details) is stored in the OTP row. The `users` and `vendors` tables stay clean until the OTP is verified. No cleanup job needed for abandoned registrations — expired rows are simply ignored.

**No triggers** — business rules like auto-rejecting sibling quotations live in the API controllers and model functions, not database triggers. This keeps the logic visible in version control, unit-testable, and portable across database engines.

**Raw SQL, no ORM** — each model file is a set of plain `pool.query()` calls. Complex queries (window functions for ranking, conditional aggregates for vendor performance, multi-table joins for comparison) are written exactly as needed without fighting an ORM's abstraction layer.

---

## Features

### Authentication & Accounts
- **OTP-based registration** — 2-step flow: submit details → receive OTP via email → verify to create account
- **OTP-based password change** — current + new password → OTP sent to email → verify to apply
- **JWT authentication** — all protected routes require `Authorization: Bearer <token>`
- **Role-based access control** — 4 roles: `admin`, `procurement_officer`, `manager`, `vendor`
- **Admin accounts cannot be self-registered** — blocked at both frontend and backend
- **Auto-logout on token expiry** — axios interceptor redirects to `/login` on 401

### Dashboard
- **Role-aware KPI cards** — Active RFQs, Pending Approvals, Active POs, Total Vendors, Monthly Spend, Pending Invoices
- **Recent activity feed** — live list of procurement events with color-coded action dots
- **Login/register events hidden** from manager and officer feeds (admin-only visibility)
- **Vendor dashboard** — own quotation stats, acceptance rate, revenue, recent quotes

### RFQ Management (Request for Quotation)
- Create, edit, and delete RFQs with title, description, quantity, unit, and deadline
- **Publish RFQ** — transitions from `draft` to `open` and notifies assigned vendors
- **Assign vendors** to specific RFQs — vendors only see RFQs they are assigned to
- **QR code generation** per RFQ for quick vendor access
- Status lifecycle: `draft → open/published → awarded`

### Quotations
- Vendors submit quotations with price, delivery days, and notes
- **Quotations tab** — officer/manager sees all quotations per RFQ with status badges
- **Compare tab** — side-by-side visual comparison cards showing:
  - Vendor name, contact, rating
  - Quoted price with relative bar chart
  - Delivery days with relative bar chart
  - BEST PRICE (green) and FASTEST (blue) badges
  - Summary table below cards
- **View modal** — full quotation detail with Approve / Reject buttons for manager/admin
- **Auto-reject** — when one quotation is approved, all other submitted quotations for the same RFQ are automatically rejected and their pending approvals are closed

### Approval Workflow
- Procurement officer can request approval for a specific quotation
- Manager/admin sees a **Pending Review** banner with count of awaiting approvals
- **Pending cards** with explicit Approve / Reject buttons (no dropdown)
- Manager can approve/reject **directly from the Quotations page** — no separate approval request step required (auto-creates approval record)
- Processing modal shows full quotation summary card with remarks field
- Approved/rejected status propagated back to the quotation record

### Purchase Orders
- Procurement officer creates POs from **approved quotations only**
- **Card picker** — select approved quotation by RFQ title, vendor name, and price (no UUID dropdowns)
- PO number auto-generated (`PO-XXXXXXXX` format)
- Status lifecycle: `draft → sent → acknowledged → completed → cancelled`
- Officer can update PO status inline

### Invoices
- Procurement officer creates invoices linked to a Purchase Order
- **Card picker** — select PO by PO number, vendor, RFQ title, and amount
- Auto-fills subtotal from PO total amount; live total preview (subtotal + tax)
- New invoices start at `sent` status immediately (skips draft)
- **Publish button** — moves any `draft` invoice to `sent`
- **Pay button** — one-click payment: marks invoice `paid` and triggers animated confirmation overlay
- **Payment animation** — full-screen modal with bouncing green checkmark, invoice number, amount, and vendor name
- **PDF download** — authenticated blob fetch with `INR` prefix on amounts (compatible with all PDF viewers)
- Status lifecycle: `draft → sent → paid` (or `cancelled`)

### Vendor Management
- Admin and procurement officer can view, create, edit, and manage vendors
- Vendor profile: company name, GST number, contact person, phone, address, category, rating
- Vendor self-service profile editing via Vendor Profile page
- Vendor performance table in Reports: total quotations, accepted, avg amount, acceptance rate

### Reports & Analytics
- **Procurement Overview** — RFQ stats by status, PO stats by status
- **Top Vendors by Spend** — ranked by total PO value
- **Vendor Performance** — acceptance rate, avg quote amount per vendor
- **Monthly Trends** — RFQs created, quotations submitted, POs raised, total spend per month

### Audit Logs (Admin only)
- Full activity log table: action, user, entity type, entity ID, timestamp
- Filter by action name or entity type
- Login and registration events visible to admin only

### AI Chatbot (Gemini 1.5 Flash)
- Floating chat button available on all authenticated pages
- **Topic-based navigation** — Overview, RFQs, Vendors, Quotations, Purchase Orders, Invoices
- **Item picker** — select a specific record to ask about
- Context-aware suggested prompt chips
- Markdown rendering: bold, code, bullet lists
- Graceful error handling for missing/invalid API key

### Notifications
- Per-user notification feed via `/api/activity/notifications`
- Mark individual or all notifications as read

### UI & UX
- Clean sidebar layout with SVG nav icons per role
- No emojis anywhere in the UI — all icons are inline SVG
- Global link style: no underlines, inherited color
- Light/dark mode toggle on landing page
- Responsive landing page with Benefits, How It Works, Features, CTA sections, and full footer
- Status badges with consistent color coding across all entities
- Empty state handling on all tables

---

## Roles & Permissions

| Feature | Admin | Officer | Manager | Vendor |
|---|:---:|:---:|:---:|:---:|
| Manage users | Yes | No | No | No |
| Manage vendors | Yes | Yes | No | No |
| Create / manage RFQs | Yes | Yes | View only | No |
| Submit quotations | No | No | No | Yes |
| View all quotations | Yes | Yes | Yes | Own only |
| Request approval | No | Yes | No | No |
| Approve / reject quotations | Yes | No | Yes | No |
| Approve from Quotations page | Yes | No | Yes | No |
| Create Purchase Orders | Yes | Yes | No | No |
| Create Invoices | Yes | Yes | No | No |
| Pay invoices | Yes | Yes | Yes | No |
| View Reports | Yes | Yes | Yes | No |
| View Audit Logs | Yes | No | No | No |
| View own Dashboard | Yes | Yes | Yes | Yes |
| Self-register | No | Yes | Yes | Yes |

---

## Project Structure

```
Odoo--VendorBridge/
├── backend/
│   ├── server.js
│   ├── .env
│   └── src/
│       ├── app.js
│       ├── config/
│       │   ├── db.js               # PostgreSQL pool
│       │   └── migrate.js          # Auto-creates all tables on startup
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── approvalController.js
│       │   ├── chatController.js
│       │   ├── dashboardController.js
│       │   ├── invoiceController.js
│       │   ├── purchaseOrderController.js
│       │   ├── quotationController.js
│       │   ├── rfqController.js
│       │   ├── reportController.js
│       │   ├── userController.js
│       │   └── vendorController.js
│       ├── models/
│       │   ├── Approval.js
│       │   ├── Invoice.js
│       │   ├── PurchaseOrder.js
│       │   ├── Quotation.js
│       │   ├── RFQ.js
│       │   ├── Report.js
│       │   ├── User.js
│       │   └── Vendor.js
│       ├── routes/
│       │   ├── activityRoutes.js
│       │   ├── approvalRoutes.js
│       │   ├── authRoutes.js
│       │   ├── chatRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── invoiceRoutes.js
│       │   ├── purchaseOrderRoutes.js
│       │   ├── quotationRoutes.js
│       │   ├── reportRoutes.js
│       │   ├── rfqRoutes.js
│       │   ├── userRoutes.js
│       │   └── vendorRoutes.js
│       ├── middleware/
│       │   ├── auth.js             # authenticate + authorize(...roles)
│       │   ├── validate.js
│       │   └── errorHandler.js
│       ├── services/
│       │   └── chatService.js      # Gemini API integration
│       └── utils/
│           ├── activityLogger.js
│           └── generateNumber.js
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── api/
│       │   ├── client.js           # Axios instance with JWT interceptor
│       │   └── index.js            # All API helper functions
│       ├── context/
│       │   └── AuthContext.jsx     # Auth state, login, register, OTP verify
│       ├── components/
│       │   ├── Chatbot.jsx
│       │   ├── Layout.jsx          # Sidebar + nav per role
│       │   ├── LandingNavBar.jsx
│       │   ├── Modal.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── StatusBadge.jsx
│       │   └── Table.jsx
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx        # 2-step OTP registration
│       │   ├── ChangePassword.jsx  # 2-step OTP password change
│       │   ├── Dashboard.jsx
│       │   ├── RFQs.jsx
│       │   ├── Quotations.jsx      # Quotations + Compare tabs
│       │   ├── Approvals.jsx
│       │   ├── PurchaseOrders.jsx
│       │   ├── Invoices.jsx        # Pay button + payment animation
│       │   ├── Vendors.jsx
│       │   ├── VendorProfile.jsx
│       │   ├── Reports.jsx
│       │   ├── Activity.jsx        # Audit logs
│       │   ├── MyQuotations.jsx
│       │   └── Users.jsx
│       ├── index.css               # Global styles + component CSS
│       └── App.jsx
├── VendorBridge.postman_collection.json
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running on port 5432

### Backend Setup

```bash
cd Odoo--VendorBridge/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in DB_PASSWORD, JWT_SECRET, GEMINI_API_KEY, and email credentials

# Create the database
psql -U postgres -c "CREATE DATABASE vendorbridge;"

# Start the server (all tables auto-created on first run)
npm run dev
```

Server runs at `http://localhost:3000`. Tables are auto-created by `migrate.js` on startup — no manual SQL migrations needed.

### Frontend Setup

```bash
cd Odoo--VendorBridge/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendorbridge
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email (for OTP delivery)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
AUTH_EMAIL=your_gmail@gmail.com
AUTH_EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_gmail@gmail.com

# AI Chatbot
GEMINI_API_KEY=your_gemini_api_key
```

---

## API Reference

All endpoints except `/api/auth/register` and `/api/auth/login` require:
```
Authorization: Bearer <token>
```

### Auth
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Step 1 — send OTP to email | Public |
| POST | `/api/auth/register/verify` | Step 2 — verify OTP, create account | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| GET | `/api/auth/me` | Current user info | All |
| PUT | `/api/auth/change-password` | Step 1 — send OTP for password change | All |
| PUT | `/api/auth/change-password/verify` | Step 2 — verify OTP, update password | All |

### Users
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/users` | List all users | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Vendors
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/vendors` | List all vendors | Officer, Admin |
| POST | `/api/vendors` | Create vendor | Officer, Admin |
| GET | `/api/vendors/:id` | Vendor detail | Officer, Admin |
| PUT | `/api/vendors/:id` | Update vendor | Officer, Admin |
| GET | `/api/vendors/profile` | Own profile | Vendor |
| PUT | `/api/vendors/profile` | Update own profile | Vendor |

### RFQs
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/rfqs` | List RFQs (vendor: assigned only) | All |
| POST | `/api/rfqs` | Create RFQ | Officer, Admin |
| GET | `/api/rfqs/:id` | RFQ detail | All |
| PUT | `/api/rfqs/:id` | Update RFQ | Officer, Admin |
| DELETE | `/api/rfqs/:id` | Delete RFQ | Officer, Admin |
| POST | `/api/rfqs/:id/assign-vendors` | Assign vendors to RFQ | Officer, Admin |
| PATCH | `/api/rfqs/:id/publish` | Publish RFQ | Officer, Admin |
| GET | `/api/rfqs/:id/qr` | Get QR code | All |

### Quotations
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/quotations/rfq/:rfqId` | Quotations for an RFQ | Officer, Manager, Admin |
| GET | `/api/quotations/rfq/:rfqId/compare` | Side-by-side comparison | Officer, Manager, Admin |
| GET | `/api/quotations/my` | Own quotations | Vendor |
| POST | `/api/quotations` | Submit quotation | Vendor |
| PUT | `/api/quotations/:id` | Update quotation | Vendor |

### Approvals
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/approvals` | List approvals | All |
| POST | `/api/approvals` | Request approval | Officer |
| GET | `/api/approvals/:id` | Approval detail | All |
| PATCH | `/api/approvals/:id/process` | Approve or reject | Manager, Admin |
| PATCH | `/api/approvals/quotation/:quotationId/process` | Direct approve/reject from quotation | Manager, Admin |

### Purchase Orders
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/purchase-orders` | List POs | All |
| POST | `/api/purchase-orders` | Create PO from approved quotation | Officer, Admin |
| GET | `/api/purchase-orders/:id` | PO detail | All |
| PATCH | `/api/purchase-orders/:id/status` | Update PO status | Officer, Admin |

### Invoices
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/invoices` | List invoices | All |
| POST | `/api/invoices` | Create invoice | Officer |
| GET | `/api/invoices/:id` | Invoice detail | All |
| PATCH | `/api/invoices/:id/status` | Update status (sent/paid/cancelled) | Officer, Manager, Admin |
| GET | `/api/invoices/:id/download` | Download PDF | All |

### Dashboard
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/dashboard` | KPIs + recent activity | Admin, Officer, Manager |
| GET | `/api/dashboard/vendor` | Vendor KPIs + recent quotations | Vendor |

### Reports
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/reports/procurement-stats` | RFQ, PO, invoice counts + top vendors | Admin, Officer, Manager |
| GET | `/api/reports/vendor-performance` | Per-vendor quotation stats | Admin, Officer, Manager |
| GET | `/api/reports/monthly-trends` | Monthly RFQ and spend trends | Admin, Officer, Manager |

### Activity
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/activity/logs` | Full audit log | Admin |
| GET | `/api/activity/notifications` | Own notifications | All |
| PATCH | `/api/activity/notifications/:id/read` | Mark read | All |
| PATCH | `/api/activity/notifications/read-all` | Mark all read | All |

### Chat
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/chat` | Send message to Gemini AI | All |
| GET | `/api/chat/items/:type` | List items for chat context | All |

---

## Procurement Workflow

```
1. Officer creates RFQ (draft)
        ↓
2. Officer assigns vendors + publishes RFQ (open)
        ↓
3. Vendors submit quotations
        ↓
4. Manager/Officer compares quotations side-by-side
        ↓
5. Manager approves one quotation
   → All other quotations for the same RFQ are auto-rejected
        ↓
6. Officer creates Purchase Order from the approved quotation
        ↓
7. Officer creates Invoice linked to the PO (starts at "sent")
        ↓
8. Officer/Manager clicks Pay → Invoice marked paid + payment animation
```

---

## Currency

All monetary values are in **INR**. Invoice PDFs display amounts with the `INR` prefix for maximum compatibility across PDF viewers and fonts.

---

## Postman Collection

Import `VendorBridge.postman_collection.json` into Postman. The collection:

- Auto-captures JWT tokens into collection variables (`officerToken`, `adminToken`, `vendorToken`, `managerToken`) after login
- Auto-captures resource IDs (`rfqId`, `vendorId`, `quotationId`, `poId`, `invoiceId`, `approvalId`)
- Covers all happy-path flows end-to-end
- Includes 403 boundary tests for role enforcement

---

## Vendor Registration

When registering as a vendor, include company details in the request body — a vendor profile is automatically created:

```json
{
  "name": "John Doe",
  "email": "john@acmecorp.com",
  "password": "secret123",
  "role": "vendor",
  "company_name": "Acme Corp",
  "gst_number": "22AAAAA0000A1Z5",
  "contact_person": "John Doe",
  "phone": "+91-9876543210",
  "address": "Mumbai, India",
  "category": "IT"
}
```

After submitting, an OTP is sent to the email. Verify with:

```json
POST /api/auth/register/verify
{
  "email": "john@acmecorp.com",
  "otp": "123456"
}
```
