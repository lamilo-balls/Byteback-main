# ByteBack 

Stack: **Node.js (Sails.js) + MySQL** backend, **plain HTML/CSS/JS**
frontend - no frameworks, no build step.

```
byteback/
├── backend/     Sails.js REST API + MySQL (test with Postman)
└── frontend/    Static HTML/CSS/JS site that talks to the backend
```

## Getting this into VS Code

1. Download this project (zip) and unzip it anywhere.
2. In VS Code: **File → Open Folder…** → select the unzipped `byteback` folder
   (or `cd` into it and run `code .`).
3. Open two terminals inside VS Code (`` Ctrl+` `` / `` Cmd+` ``, click the `+`):
   - Terminal 1 (API): `cd backend && npm install && npm run dev`
   - Terminal 2 (site): open `frontend/index.html` with the VS Code "Live Server" extension, or run `cd frontend && npx serve -l 5500`

## Database

Uses MySQL via `sails-mysql`. `backend/config/datastores.js` reads the
connection string from `DATABASE_URL` - copy `backend/.env.example` to
`backend/.env` and fill in your credentials. Tables are created
automatically on the first run.

## Logging in as each role

- **Public user:** register normally at `/register.html`. (got tired to make one so....gg pagawa na algn)
- **Investigator / Supervisor / Admin:** the server auto-creates a default
  Log in as that admin, go to **User
  Management**, and create your real staff accounts from there.
  **Milo i sent my .env file to you, in case you didnt see it**
  
## What's built

**Public User:** Landing, Register (with Terms/User Agreement/Privacy
Consent), Email Verification, Login, Forgot Password, Dashboard, File a
Complaint (Category → Details → Review → Success), Complaint Details,
Profile, Notifications, Settings, Logout.

**Investigator:** Dashboard, Assigned Cases, and a combined Investigation
Workspace screen (case details, evidence review, notes, status timeline,
and status updates all in one page.

**Supervisor:** Dashboard, Case Assignment (assign unassigned cases to an
investigator), Investigator Performance, Workload Distribution.

**Admin:** Dashboard (real 6-month user growth chart, security event feed),
Complaint Management (filter + override + CSV export), User Management
(create staff, change roles, suspend/reactivate), Reports & Analytics (real
resolution-time-by-category math, CSV report generation), Audit Logs,
Security Logs (real IP capture on every login attempt), Notification Center
(derived from real audit/security events, not fabricated), and platform-wide
Settings (name/support contact + policy toggles, persisted server-side).

## Notes on scope

- I made very role-restricted endpoint that is protected server-side via
  `backend/api/services/RoleGuard.js` - the frontend hiding a link isn't
  what keeps someone out, the API call itself is checked.
- Every chart and metric across all four roles is computed from real data
  in the database (status history, audit logs, login attempts) - noothing
  is hardcoded placeholder data, even where the Figma mockup showed
  specific sample numbers.
- Email verification codes are returned directly in the API response
  (`devVerificationCode`) since no real email service is wired up yet -
  Tingnan mo na lang yung  note sa `backend/README.md` for where to plug one in.
- A few sections (Settings → Security Policy / Roles & Permissions /
  Notifications tabs) are shown as informational placeholders in the UI -
  Yung Figma design ko technically didn't specify their exact controls, so I left them
  clearly marked as future work rather than guessing. hehe (I'm grieving - sue me :| )
