# Kinetic Gallery — Product Ordering Dashboard

A full-stack web application for packaging design companies. Designers publish product mockups; clients browse, order, and track fulfilment — all in one responsive interface.

**Live demo →** [https://product-ordering-theta.vercel.app](https://product-ordering-theta.vercel.app)  
**API base →** [https://product-ordering-ajlh.onrender.com/api/health](https://product-ordering-ajlh.onrender.com/api/health)

---

## Overview

| Role | What they can do |
|---|---|
| **Designer** | Upload mockups (name, description, price, category, image), edit/delete own work, accept or progress orders, view dashboard stats |
| **Client** | Browse all mockups, place orders with quantity, track order status in real-time, cancel pending orders |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Tailwind CSS, Zod, Axios |
| Backend | Node.js, Express, MongoDB + Mongoose |
| Auth | JSON Web Tokens (JWT) with role-based protected routes |
| Uploads | Multer — switchable between local disk and Cloudinary |
| Validation | Zod (frontend) + express-validator (backend) |
| Security | helmet, express-rate-limit, express-mongo-sanitize |
| Deploy | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## Features

- **JWT authentication** — register as a designer or client, protected routes on both ends
- **Role-based dashboards** — designers see performance metrics and manage mockups; clients see their order history and catalogue
- **Image uploads** — drag-and-drop preview, MIME-type validation, pluggable Cloudinary or local storage
- **Full order workflow** — `pending → accepted → in_production → shipped → completed` (or `cancelled`)
- **Real-time status updates** — lightweight 5-second API polling, pauses automatically when the tab is hidden
- **Comprehensive validation** — schema-level on the client (Zod), declarative chains on the server (express-validator)
- **Production security** — security headers (helmet), brute-force protection (rate-limit), NoSQL injection prevention (mongo-sanitize), safe file extension handling
- **Responsive layout** — sidebar navigation, mobile menu, works on all screen sizes

---

## Project structure

```
kinetic-gallery/
├── backend/                  # Express + MongoDB REST API
│   ├── config/               # Database connection
│   ├── controllers/          # Route handlers (auth, mockups, orders)
│   ├── middleware/           # JWT auth, upload, rate-limit, error handler
│   ├── models/               # Mongoose schemas (User, Mockup, Order)
│   ├── routes/               # Express routers
│   ├── validators/           # express-validator rule sets
│   ├── uploads/              # Local image storage (UPLOAD_STRATEGY=local)
│   ├── seed.js               # Demo data seeder
│   └── server.js             # App entry point
├── frontend/                 # React (Vite) SPA
│   └── src/
│       ├── api/              # Axios instance with auth interceptor
│       ├── components/       # Shared UI (AppShell, ProtectedRoute, StatusBadge…)
│       ├── context/          # AuthContext
│       ├── pages/            # Login, Register, Dashboard, Mockups, Upload, Orders, Profile
│       └── schemas/          # Zod validation schemas
├── postman/
│   └── Product-Ordering-Dashboard.postman_collection.json
└── README.md
```

---

## Local setup

### Prerequisites

- Node.js 18+
- MongoDB (local instance **or** [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- Optional: [Cloudinary](https://cloudinary.com/) free account for remote image storage

### 1. Clone and install

```bash
git clone <repo-url>
cd kinetic-gallery

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure environment variables

Create `backend/.env` (reference: `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/kinetic_gallery
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173

# "local" (default) stores files in /uploads — "cloudinary" sends them to Cloudinary CDN
UPLOAD_STRATEGY=local

# Required only when UPLOAD_STRATEGY=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Seed demo data

```bash
cd backend && npm run seed
```

Creates two ready-to-use accounts:

| Role | Email | Password |
|---|---|---|
| Designer | designer@example.com | password123 |
| Client | client@example.com | password123 |

### 4. Start development servers

```bash
# Terminal 1 — API
cd backend && npm run dev       # → http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm run dev      # → http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to port 5000, so no CORS configuration is needed locally.

---

## Navigation

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Sign in |
| `/register` | Public | Create a designer or client account |
| `/dashboard` | Authenticated | Role-specific performance overview |
| `/mockups` | Authenticated | Browse or manage mockups |
| `/mockups/new` | Designer | Upload a new mockup |
| `/mockups/:id/edit` | Designer (owner) | Edit an existing mockup |
| `/orders` | Authenticated | Order list with live status polling |
| `/profile` | Authenticated | Account details |

---

## REST API

Base URL (production): `https://product-ordering-ajlh.onrender.com/api`  
Base URL (local): `http://localhost:5000/api`

All protected endpoints require the header:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/auth/register` | `{ name, email, password, confirmPassword, role }` | `{ token, user }` |
| `POST` | `/auth/login` | `{ email, password }` | `{ token, user }` |
| `GET` | `/auth/me` | — | `{ user }` |

### Mockups

| Method | Endpoint | Role | Notes |
|---|---|---|---|
| `GET` | `/mockups` | Any | Designers see own; clients see all. Filter: `?category=` |
| `GET` | `/mockups/:id` | Any | Designers restricted to own mockups |
| `POST` | `/mockups` | Designer | `multipart/form-data`, field name: `image` |
| `PUT` | `/mockups/:id` | Owning designer | `multipart/form-data`, `image` optional |
| `DELETE` | `/mockups/:id` | Owning designer | Blocked if active orders exist |

### Orders

| Method | Endpoint | Role | Notes |
|---|---|---|---|
| `GET` | `/orders` | Any | Scoped by role. Filter: `?status=` |
| `GET` | `/orders/stats` | Designer | Dashboard aggregates |
| `GET` | `/orders/:id` | Owner or owning designer | |
| `POST` | `/orders` | Client | `{ mockupId, quantity, notes? }` |
| `PATCH` | `/orders/:id/status` | Owning designer | `{ status }` |
| `DELETE` | `/orders/:id` | Owning client | Only when status is `pending` |

Full request/response examples are in the Postman collection — import `postman/Product-Ordering-Dashboard.postman_collection.json` and set the `baseUrl` and `token` collection variables.

---

## Data models

```js
User    { name, email, password (bcrypt, 12 rounds), role: 'designer'|'client' }

Mockup  { name, description, price, category, imageUrl, imagePublicId, designer → User }

Order   { client → User, mockup → Mockup, quantity, unitPrice, totalPrice,
          status: 'pending'|'accepted'|'in_production'|'shipped'|'completed'|'cancelled',
          notes }
```

---

## Security

| Concern | Mitigation |
|---|---|
| Brute-force login | `express-rate-limit` — 10 attempts / 15 min / IP on all auth routes |
| NoSQL injection | `express-mongo-sanitize` + explicit `String()` coercion on query params |
| Security headers | `helmet` (CSP, HSTS, X-Frame-Options, CORP, etc.) |
| File upload abuse | MIME-type whitelist; extension derived from MIME, not filename; files served with `Content-Disposition: attachment` |
| JWT leakage | Fail-fast boot if `JWT_SECRET` is unset; `select: false` on password field |
| CORS | Strict origin allow-list via `CLIENT_ORIGIN`; no wildcard with credentials |
| Password storage | bcrypt, 12 salt rounds |

---

## Deployment

### Backend → Render

1. Connect the repository to a new **Web Service** on [Render](https://render.com/).
2. Build command: `npm install` — Start command: `node server.js`
3. Set these environment variables in the Render dashboard:

```
MONGO_URI          → MongoDB Atlas connection string
JWT_SECRET         → long random string (node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
CLIENT_ORIGIN      → https://your-app.vercel.app
NODE_ENV           → production
UPLOAD_STRATEGY    → cloudinary   (Render's disk is ephemeral — use Cloudinary in production)
CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
```

### Frontend → Vercel

1. Import the repository in [Vercel](https://vercel.com/).
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite** — Build: `npm run build` — Output: `dist`
4. Set environment variable: `VITE_API_URL=https://your-render-url.onrender.com`

The `frontend/vercel.json` rewrite rule is already in place — all routes serve `index.html` so React Router handles client-side navigation correctly.

---

## Cloudinary setup

The upload strategy is controlled by a single env var — no code changes needed.

1. Create a free account at [cloudinary.com](https://cloudinary.com/users/register/free)
2. Copy **Cloud Name**, **API Key**, **API Secret** from the dashboard
3. Add to `backend/.env` (or Render environment variables):

```env
UPLOAD_STRATEGY=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Uploaded images are stored under `kinetic_gallery/mockups/`. Deleting a mockup also removes the image from Cloudinary automatically.

---

## Scripts

| Location | Command | Description |
|---|---|---|
| `backend` | `npm run dev` | Start API with nodemon (watch mode) |
| `backend` | `npm start` | Start API with node (production) |
| `backend` | `npm run seed` | Reset and seed demo data |
| `frontend` | `npm run dev` | Vite dev server with API proxy |
| `frontend` | `npm run build` | Production build to `dist/` |
| `frontend` | `npm run preview` | Preview the production build locally |

---

## Design decisions

**Tailwind CSS over Material-UI** — keeps the bundle lean and matches the Kinetic Gallery reference design pixel-for-pixel without fighting component overrides.

**API polling over WebSockets** — the order status feature requires near-real-time updates but not instant delivery. A 5-second poll is stateless, works identically on Render free tier and serverless, and requires zero extra infrastructure. The implementation pauses automatically when the browser tab is hidden to avoid unnecessary load.

**Pluggable upload strategy** — a single `UPLOAD_STRATEGY` env var switches between local disk (ideal for development) and Cloudinary (required for production on stateless hosts like Render). No code changes, no separate branches.

**Zod + express-validator** — Zod on the frontend catches errors before a request is ever sent; express-validator on the backend ensures the API is safe regardless of client behaviour. Both share the same field names so error messages are consistent end-to-end.

---

## License

MIT
