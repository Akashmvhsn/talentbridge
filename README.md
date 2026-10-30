# TalentBridge (MERN)

Referral job board: employees share openings, seekers contact them by email.

## Structure
```
talentbridge/
├─ server/                     Express + Mongoose API
│  ├─ server.js                entry (env, DB connect, listen)
│  └─ src/
│     ├─ app.js                middleware + route mounting
│     ├─ config/db.js
│     ├─ models/               User, Opening, Placement
│     ├─ controllers/          auth, user, opening
│     ├─ routes/               auth, user, opening
│     ├─ middleware/           auth (JWT), error
│     ├─ utils/                asyncHandler, httpError
│     └─ seed.js               sample data from the UI
└─ client/                     React (Vite)
   └─ src/
      ├─ api/client.js         fetch wrapper + token store
      ├─ context/AuthContext   session state
      ├─ context/UiContext     theme, saved openings, toasts
      ├─ pages/                Login, Explore, MyOpenings, Saved, Profile
      └─ components/           Sheet, OpeningCard, OpeningDetailSheet,
                               OpeningFormSheet, EditProfileSheet, BottomNav
```

## Run
```bash
# API
cd server && cp .env.example .env     # put your MONGO_URI + JWT_SECRET
npm install
npm run seed                          # optional sample opening
npm run dev                           # http://localhost:5000

# Web (new terminal)
cd client && npm install
npm run dev                           # http://localhost:5173 (proxies /api)
```
Seed login: `asha@northstarlabs.com` / `Password123`

## Deploy (Render, free tier — one service for API + web)
In production Express serves `client/dist`, so the site and API share one URL (no CORS setup).

1. **MongoDB Atlas** → Network Access → add `0.0.0.0/0` (Render has no fixed IP).
2. Push this folder to a GitHub repo (`.env` files are git-ignored, so secrets stay local).
3. [render.com](https://render.com) → **New → Blueprint** → pick the repo. It reads `render.yaml`.
4. When prompted, paste your `MONGO_URI`. `JWT_SECRET` is generated for you.
5. Wait for the deploy, then open `https://<your-service>.onrender.com`. Run `npm run seed` locally once if you want the demo account on the login page to work.

Manual setup instead of the Blueprint: Build `npm run build`, Start `npm start`, env `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `NODE_ENV=production`.

Local production check: `npm run build && PORT=5000 npm start` from the repo root, then open http://localhost:5000.

## API (all except /auth/register|login need `Authorization: Bearer <token>`)
| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/register, /login | create profile / sign in |
| GET | /api/auth/me | current user |
| PUT | /api/users/me | edit profile |
| GET | /api/users/me/stats | verified placements, community signals |
| GET | /api/openings?q=&workMode=&employmentType=&sort=newest\|trusted\|oldest | explore + search + filter + sort |
| GET | /api/openings/mine | my openings |
| POST/GET/PUT/DELETE | /api/openings(/:id) | create / read / edit / delete (owner only for edit/delete) |
| POST | /api/openings/:id/reveal-phone | optional phone reveal |
| POST | /api/openings/parse-jd | upload PDF/DOCX/TXT JD, returns fields to pre-fill the form (not saved). Rule-based, no paid API |
| POST | /api/openings/:id/signal | records email/apply click |
| POST | /api/openings/:id/placements | confirm successful placement |
