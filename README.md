# VendorBridge — Odoo Hackathon

A procurement management backend built with Node.js, Express, and PostgreSQL. Manages the full vendor procurement lifecycle: RFQs → Quotations → Approvals → Purchase Orders → Invoices.

---

## Tech Stack

- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL (raw SQL via `node-postgres`)
- **Auth**: JWT (role-based access control)
- **PDF**: PDFKit (invoice generation)
- **Validation**: express-validator

---

## Roles & Permissions

| Action | Admin | Procurement Officer | Manager | Vendor |
|---|---|---|---|---|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage vendors | ✅ | ✅ | ❌ | ❌ |
| Create / manage RFQs | ✅ | ✅ | ❌ (view only) | ❌ |
| Submit quotations | ❌ | ❌ | ❌ | ✅ |
| View quotations | ✅ | ✅ | ✅ | own only |
| Request approval | ❌ | ✅ | ❌ | ❌ |
| Approve / reject | ✅ | ❌ | ✅ | ❌ |
| Create POs & Invoices | ✅ | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ❌ | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ✅ (own) |

---

## Project Structure

```
Odoo--VendorBridge/
├── backend/
│   ├── server.js               # Entry point
│   ├── .env.example
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── db.js           # PostgreSQL pool
│   │   │   └── migrate.js      # Auto-creates all tables on startup
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── models/             # All SQL queries (one file per entity)
│   │   ├── routes/             # Express routers
│   │   ├── middleware/
│   │   │   ├── auth.js         # authenticate + authorize(roles)
│   │   │   ├── validate.js     # express-validator helpers
│   │   │   └── errorHandler.js
│   │   └── utils/
│   │       ├── activityLogger.js
│   │       └── generateNumber.js
│   └── uploads/
├── VendorBridge.postman_collection.json
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (default install, running on port 5432)

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd VendorBridge--Odoo-Hackathon/backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set DB_PASSWORD and JWT_SECRET

# 4. Create the database
psql -U postgres -c "CREATE DATABASE vendorbridge;"

# 5. Start the server (tables are auto-created on first run)
npm start
```

Server runs at `http://localhost:3000`. All tables are created automatically via `migrate.js` — no manual migrations needed.

---

## Environment Variables

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendorbridge
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

---

## API Overview

| Prefix | Description |
|---|---|
| `POST /api/auth/register` | Register (roles: admin, procurement_officer, manager, vendor) |
| `POST /api/auth/login` | Login — returns JWT |
| `GET /api/auth/me` | Current user info |
| `/api/users` | User management (admin only) |
| `/api/vendors` | Vendor directory |
| `/api/rfqs` | Request for Quotations |
| `/api/quotations` | Vendor quotations |
| `/api/approvals` | Approval workflow |
| `/api/purchase-orders` | Purchase orders |
| `/api/invoices` | Invoices + PDF download |
| `/api/dashboard` | Role-aware dashboard KPIs |
| `/api/reports` | Procurement analytics |
| `/api/activity/logs` | Audit logs (admin) |
| `/api/activity/notifications` | Per-user notifications |

All endpoints (except register/login) require `Authorization: Bearer <token>`.

---

## Postman Collection

Import `VendorBridge.postman_collection.json` into Postman. The collection:

- Auto-captures tokens into collection variables (`officerToken`, `adminToken`, `vendorToken`, `managerToken`) after login/register
- Auto-captures resource IDs (`rfqId`, `vendorId`, `quotationId`, `poId`, `invoiceId`, `approvalId`)
- Includes 403 boundary tests for role enforcement

---

## Vendor Registration Note

When registering with `role: "vendor"`, pass the company details in the same request body — a vendor profile is automatically created:

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

---

## Currency

All monetary values are in **INR (₹)**. Invoice PDFs display amounts with the ₹ symbol.
