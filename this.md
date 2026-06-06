# VendorBridge Login & Auth Reference

Extracted from `VendorBridge.postman_collection.json`.

## Login and user details

| Name | Role | Email | Password | Login account? | Token variable | Notes |
|---|---|---|---|---|---|---|
| Admin User | admin | admin@vendorbridge.com | admin123 | Yes | adminToken | Register and login use `/auth/register` and `/auth/login`. |
| Procurement Officer | procurement_officer | officer@vendorbridge.com | officer123 | Yes | officerToken | Used for operational APIs and password change. |
| Manager User | manager | manager@vendorbridge.com | manager123 | Yes | managerToken | Used for approval workflows and manager dashboard. |
| Vendor User | vendor | vendor@acmecorp.com | vendor123 | Yes | vendorToken | Used for vendor dashboard and quotations. |
| New Manager | manager | manager2@vendorbridge.com | pass123 | No | - | Created via `POST /users` by admin. |
| New Officer | procurement_officer | officer2@vendorbridge.com | pass123 | No | - | Created via `POST /users` by admin. |
| Vendor Contact | vendor contact | john@acmecorp.com | N/A | No | - | Used in `POST /vendors`; not a login account. |

## Auth details

- Login request: `POST {{baseUrl}}/auth/login`
- Register request: `POST {{baseUrl}}/auth/register`
- Login payload: JSON with `email` and `password`
- Register payload: JSON with `name`, `email`, `password`, and `role`
- Successful auth test scripts store the returned token in collection variables:
  - `adminToken`
  - `officerToken`
  - `managerToken`
  - `vendorToken`
- Protected requests use the header `Authorization: Bearer {{token-variable}}`
- Password change example in the collection:
  - `currentPassword`: `officer123`
  - `newPassword`: `newpassword123`

## Role to endpoint summary

| Token | Primary usage |
|---|---|
| `adminToken` | `/users` and `/users/:id` |
| `officerToken` | `/auth/me`, `/auth/change-password`, `/dashboard`, `/vendors`, `/rfqs`, `/approvals`, `/purchase-orders`, `/invoices` |
| `managerToken` | `/dashboard` and approval processing endpoints |
| `vendorToken` | `/dashboard/vendor` and quotation endpoints |

## Email list found in the collection

- `admin@vendorbridge.com`
- `officer@vendorbridge.com`
- `manager@vendorbridge.com`
- `vendor@acmecorp.com`
- `manager2@vendorbridge.com`
- `officer2@vendorbridge.com`
- `john@acmecorp.com`
