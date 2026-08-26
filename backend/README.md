# ByteBack Backend (Node.js / Sails.js + MySQL)

REST API for the public-user flow: register, login, submit a complaint,
view your complaints, track a complaint by reference number.

## 1. Set up MySQL

Make sure MySQL is installed and running, then create the database. In a
MySQL shell (`mysql -u root -p`):

```sql
CREATE DATABASE byteback;
```

## 2. Configure the connection

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to match your MySQL user/password, e.g.:

```
DATABASE_URL=mysql://root:yourpassword@localhost:3306/byteback
```

## 3. Install & run

```bash
npm install
npm run dev
```

You should see `ByteBack backend running at http://localhost:1337`.
Sails/Waterline will automatically create the `user` and `complaint` tables
in your `byteback` database the first time it runs (see `config/models.js`,
`migrate: 'alter'`).

## 4. Test in Postman

Base URL: `http://localhost:1337`

Postman note: make sure Postman is sending/storing cookies (it does this by
default) — the session cookie is what keeps you "logged in" between
requests, the same way a browser would.

### Register
`POST /api/register`
```json
{
  "fullName": "Jane Dela Cruz",
  "email": "jane@example.com",
  "phone": "09171234567",
  "password": "SuperSecret123"
}
```
Response: `201` with the created user, and sets a session cookie.

### Login
`POST /api/login`
```json
{ "email": "jane@example.com", "password": "SuperSecret123" }
```

### Who am I (confirms the session cookie works)
`GET /api/me`

### Logout
`POST /api/logout`

### Forgot password
`POST /api/forgot-password`
```json
{ "email": "jane@example.com" }
```

### Submit a complaint (must be logged in — same Postman cookie jar as login)
`POST /api/complaints`
```json
{
  "category": "phishing",
  "title": "Fake bank email asking for OTP",
  "description": "Received an email pretending to be from my bank asking me to confirm my OTP...",
  "incidentDate": "2026-07-10",
  "evidence": ["screenshot1.png", "email-header.txt"]
}
```
Response includes a generated `referenceNumber` like `CR-2026-4821`.

### List my complaints (Dashboard page)
`GET /api/complaints`

### Get one complaint
`GET /api/complaints/1`

### Track a complaint by reference number (public, no login needed)
`GET /api/complaints/track/CR-2026-4821`

## 5. Categories accepted

`online_scam`, `identity_theft`, `cyberbullying`, `phishing`, `hacking`, `impersonation`

## 6. Newer endpoints (email verification, profile, settings, notifications)

### Verify email (after registering)
`POST /api/verify-email`
```json
{ "code": "123456" }
```
Note: since there's no real email service wired up yet, `register` and
`resend-verification` both return a `devVerificationCode` field in the
response body purely so you can test this locally. Remove that field once
you wire up a real email provider (e.g. SendGrid, Postmark, Nodemailer).

### Resend verification code
`POST /api/resend-verification` (no body needed, uses the session)

### Update profile
`PUT /api/profile`
```json
{ "fullName": "Jane D. Cruz", "phone": "09171234567" }
```

### Change password
`POST /api/change-password`
```json
{ "currentPassword": "SuperSecret123", "newPassword": "EvenBetterSecret456" }
```

### List my notifications
`GET /api/notifications` — a notification is auto-created whenever you submit a complaint.

### Mark one notification read
`POST /api/notifications/:id/read`

### Mark all notifications read
`POST /api/notifications/read-all`

## 7. Staff roles (Investigator / Supervisor / Admin)

On first run, the server auto-creates a default **admin** account (see
`config/bootstrap.js`) since there's no other way to bootstrap staff
accounts:

```
email:    admin@byteback.local
password: ChangeMe123!
```

(Override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`.)

Log in as this admin at `/login.html`, go to **User Management**, and
create your real investigator/supervisor/admin accounts from there — then
change the seed admin's password from Settings.

### Investigator
- `GET  /api/investigator/dashboard` — case counts + recently updated
- `GET  /api/investigator/cases` — cases assigned to me
- `GET  /api/investigator/cases/:id` — full case + notes (Investigation Workspace)
- `POST /api/investigator/cases/:id/notes` — `{ "note": "..." }`
- `GET  /api/investigator/cases/:id/timeline` — status history
- `POST /api/investigator/cases/:id/status` — `{ "status": "investigating", "note": "..." }`

### Supervisor
- `GET  /api/supervisor/dashboard`
- `GET  /api/supervisor/unassigned` — cases with no investigator yet
- `POST /api/supervisor/cases/:id/assign` — `{ "investigatorId": 3 }`
- `GET  /api/supervisor/investigators` — performance stats per investigator
- `GET  /api/supervisor/workload` — case counts per investigator

### Admin
- `GET  /api/admin/dashboard`
- `GET  /api/admin/complaints?status=&category=` — all complaints, filterable
- `PUT  /api/admin/complaints/:id` — `{ "status": "...", "priority": "..." }` (override)
- `GET  /api/admin/users`
- `POST /api/admin/users` — `{ "fullName", "email", "password", "role" }` (create staff account)
- `PUT  /api/admin/users/:id/role` — `{ "role": "investigator" }`
- `GET  /api/admin/reports` — aggregate analytics
- `GET  /api/admin/audit-logs` — role changes, status overrides, user creation
- `GET  /api/admin/security-logs` — login success/failure history

Every endpoint above checks `RoleGuard` (`api/services/RoleGuard.js`) and
returns `403` if the logged-in user's role isn't allowed.

## 8. Connecting the website frontend

The `frontend/` site expects this API at `http://localhost:1337` by default
— see `frontend/js/api.js`. Since the frontend is plain HTML/CSS/JS served
from a different origin (e.g. opened via Live Server on port 5500), CORS
and cookies need to work cross-origin. This is already handled:
- `config/cors.js` allows `http://localhost:5500` (Live Server's default) with credentials
- `frontend/js/api.js` sends `credentials: 'include'` on every request

If you serve the frontend from a different port, add it to
`config/cors.js`.

## Troubleshooting

- **`ER_NOT_SUPPORTED_AUTH_MODE` or similar auth errors on connect:** newer
  MySQL (8+) defaults to `caching_sha2_password`. If `sails-mysql` can't
  connect, either upgrade the driver or run in MySQL:
  `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yourpassword';`
- **`ECONNREFUSED`:** MySQL isn't running, or the port/host in
  `DATABASE_URL` doesn't match your local setup.
- **`ER_BAD_DB_ERROR: Unknown database 'byteback'`:** you skipped step 1 —
  run `CREATE DATABASE byteback;` first.
