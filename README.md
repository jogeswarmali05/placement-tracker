# Placement Tracker (MERN)

Track student progress for placements and careers: groups, subjects, progress reports, analytics and markdown notes.

## Folder structure

```
placement-tracker/
├── backend/
│   ├── server.js              # Express entry point
│   ├── config/db.js           # Mongo connection
│   ├── middleware/            # auth (JWT guard), error handling
│   ├── models/                # User, Group, Subject, Report, Note
│   ├── controllers/           # business logic
│   ├── routes/                # /api/auth, users, groups, subjects, reports, notes
│   └── utils/helpers.js       # ApiError, asyncHandler, pick
└── frontend/
    └── src/
        ├── main.jsx, App.jsx  # router + providers
        ├── services/api.js    # axios instance, token handling, API modules
        ├── context/AuthContext.jsx
        ├── components/        # Layout (sidebar), ProtectedRoute, AuthShell, ui.jsx
        └── pages/             # Login, Register, Dashboard, Groups, Reports, Notes, Profile
```

## Run locally

Prerequisites: Node 18+, MongoDB running locally (or an Atlas URI).

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env     # then edit JWT_SECRET (and MONGO_URI if needed)
npm run dev              # http://localhost:5000
```

`.env` variables:

| Variable | Example | Purpose |
|---|---|---|
| PORT | 5000 | API port |
| MONGO_URI | mongodb://127.0.0.1:27017/placement_tracker | Mongo connection string |
| JWT_SECRET | (long random string) | Signs tokens. Required |
| JWT_EXPIRES_IN | 7d | Token lifetime |
| CLIENT_URL | http://localhost:5173 | Allowed CORS origin |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```
In dev, Vite proxies `/api` to `localhost:5000`, so no env file is needed. For production builds set `VITE_API_URL` to your API's URL (e.g. `https://api.example.com/api`) and `CLIENT_URL` on the backend to your site's origin.

## API summary

| Method | Route | Notes |
|---|---|---|
| POST | /api/auth/register, /login | returns `{ token, user }` |
| GET | /api/auth/me | current user |
| PUT | /api/users/profile, /password | |
| GET/POST | /api/groups; PUT/DELETE /api/groups/:id | delete cascades to subjects, reports, notes |
| GET/POST | /api/subjects (`?group=`); PUT/DELETE /:id | |
| GET/POST | /api/reports (`?subject=&status=&from=&to=`); PUT/DELETE /:id | |
| GET | /api/reports/analytics | group progress, strengths, weak areas, weekly hours |
| GET/POST | /api/notes (`?subject=&q=`); GET/PUT/DELETE /:id | markdown content |

All routes except register/login require `Authorization: Bearer <token>`. Every query is scoped to the logged-in user.

## How progress and "weak areas" are computed
- Subject progress comes from its latest report status: Not Started 0%, In Progress 50%, Completed 100%. Group progress is the average across its subjects.
- Strengths: average score of 75% or more. Weak areas: average score below 60%. Subjects with no reports are listed under "Not started".
- Thresholds are in `backend/controllers/reportController.js` if you want to change them.

## Security notes
JWT auth, bcrypt (cost 12), Helmet, CORS allow-list, rate-limiting on auth routes, field whitelisting on writes, and ownership checks on every referenced id. The token is kept in `localStorage` for simplicity; for stricter setups move it to an httpOnly cookie.
