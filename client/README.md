# MERN Client (React + Vite + Better Auth)

## Quick start

```bash
npm i          # installs deps AND creates .env
npm run dev    # http://localhost:5173
```

Start the backend first (`mern-server`, port 5000). The backend's `CLIENT_URL` must be
`http://localhost:5173` (the default) so CORS and cookies work.

## Pages
| Route | Access | Purpose |
|---|---|---|
| `/` | public | Landing page |
| `/login`, `/signup` | guests only | Email/password + Google + Facebook |
| `/dashboard` | logged in only | Shows session user and calls `GET /api/users/me` |

## Config
`.env`: `VITE_API_URL=http://localhost:5000` (the Express backend).

## Scripts
`npm run dev` · `npm run build` · `npm run preview` · `npm run lint`

## Production
`npm run build` outputs `dist/`. Set `VITE_API_URL` at build time, host `dist/` as a static
site with an SPA fallback to `index.html`, and set the backend's `CLIENT_URL` to the site's URL.
For cookies to work reliably, serve the frontend and API from the same site
(for example `app.example.com` and `api.example.com`).
