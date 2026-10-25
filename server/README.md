# MERN Server (Express 5 + Better Auth + MongoDB)

## Quick start

```bash
npm i          # installs deps AND creates .env (with a generated BETTER_AUTH_SECRET)
npm run dev    # needs MongoDB running at MONGODB_URI
```

Check it works:

```bash
curl http://localhost:5000/api/health
curl -i http://localhost:5000/api/users/me    # 401 without a session
```

## Requirements
- Node.js >= 20.6
- MongoDB (local, Docker, or Atlas). Set `MONGODB_URI` in `.env`.
  Quick local option: `docker run -d -p 27017:27017 --name mongo mongo:7`

## Auth
Better Auth is mounted at `/api/auth/*`.
- Email + password works immediately.
- Google / Facebook turn on automatically once you fill their client ID and secret in `.env`.
  - Google redirect URI:   `http://localhost:5000/api/auth/callback/google`
  - Facebook redirect URI: `http://localhost:5000/api/auth/callback/facebook`

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with auto-restart |
| `npm start` | Production start (set env vars on your host) |
| `npm test` | Vitest + Supertest |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## Structure
```
src/
  config/        env validation, mongoose, better-auth
  middlewares/   auth guard, rate limit, validation, errors
  modules/       feature modules (controller + routes)
  routes/        central API router
  utils/         logger, ApiError
  app.js         Express app (no listen)
  server.js      entry point, graceful shutdown
```
