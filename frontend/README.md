# ByteBack Website (HTML / CSS / JavaScript)

Plain static site, no build step, no framework — just open it.

Pages: Landing (`index.html`) → Register/Login → Dashboard → File a
Complaint (Category → Details → Review → Success) → Track a complaint.

## Run it

You need to serve these files (not just double-click `index.html`), because
`fetch()` calls to the API work more reliably from an actual `http://`
origin, and the cookie-based login needs a real origin too. Easiest options:

**In VS Code:** install the "Live Server" extension, right-click
`index.html` → "Open with Live Server". It serves on `http://localhost:5500`,
which is already whitelisted in the backend's CORS config.

**Or with Node (no extension needed):**
```bash
cd frontend
npx serve -l 5500
```

Then open `http://localhost:5500` in your browser.

Make sure the backend is running first at `http://localhost:1337` (see
`../backend/README.md`).

## If you serve it from a different port

Edit `API_BASE_URL` in `js/api.js` if your backend runs somewhere other than
`localhost:1337`, and add your frontend's origin to
`backend/config/cors.js` if it's not `5500`/`3000`.
