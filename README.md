# Product Ordering Dashboard (MERN)

A responsive web application for a packaging design company, where **designers** upload product mockups and **clients** browse them, place orders, and track status in real-time. Built end-to-end with the MERN stack: MongoDB, Express, React, and Node.js.

> Implements every requirement from the task brief — JWT auth, role-based dashboards, Multer uploads (local or Cloudinary), Zod + express-validator validation, real-time status polling, and production-ready deploy configs for Vercel + Render.

---

## Features

- **JWT authentication** with protected routes on both client and server
- **Role-based experience** — designers upload and manage mockups, clients browse and order
- **Image uploads** via Multer, with a pluggable strategy for either local disk or **Cloudinary**
- **Order workflow** — pending → accepted → in production → shipped → completed (or cancelled)
- **Real-time status updates** via lightweight API polling (every 5 s, pauses when tab is hidden)
- **Validation** — Zod on the frontend, express-validator on the backend
- **Responsive UI** — Tailwind CSS, mobile menu, sidebar navigation
- **Clean error handling** — centralised Express error middleware, axios interceptors

---

## Project structure

```
BNV_MernStack_Task/
├── backend/               # Express + MongoDB API
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── validators/
│   ├── uploads/           # local image storage (when UPLOAD_STRATEGY=local)
│   ├── seed.js            # seeds demo users, mockups, orders
│   └── server.js
├── frontend/              # React (Vite) + Tailwind
│   └── src/
│       ├── api/           # axios instance with auth interceptor
│       ├── components/    # AppShell, ProtectedRoute, StatusBadge, ...
│       ├── context/       # AuthContext
│       ├── pages/         # Login, Register, Dashboard, Mockups, Upload, Orders, Profile
│       └── schemas/       # Zod validation schemas
├── postman/
│   └── Product-Ordering-Dashboard.postman_collection.json
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB — local instance **or** a free MongoDB Atlas cluster
- (Optional) a free [Cloudinary](https://cloudinary.com/) account if you want remote image storage

### 1. Clone and install

```bash
git clone <your-repo-url>
cd BNV_MernStack_Task

# backend
cd backend && npm install && cd ..

# frontend
cd frontend && npm install && cd ..
```

### 2. Configure environment

**`backend/.env`** (copy from `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/product_ordering
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173

# "local" (default) or "cloudinary"
UPLOAD_STRATEGY=local

# Only required when UPLOAD_STRATEGY=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**`frontend/.env`** (optional — defaults to the Vite proxy):

```env
VITE_API_URL=
```

### 3. Seed demo data (optional)

```bash
cd backend
npm run seed
```

This creates two demo accounts you can sign in with immediately:

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Designer | designer@example.com   | password123   |
| Client   | client@example.com     | password123   |

### 4. Run locally

Open two terminals:

```bash
# terminal 1 — backend
cd backend
npm run dev            # http://localhost:5000

# terminal 2 — frontend
cd frontend
npm run dev            # http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend, so no CORS setup is needed for local development.

---

## Navigation points

| Route               | Access                 | Purpose                             |
|---------------------|------------------------|-------------------------------------|
| `/login`            | Public                 | Sign in                             |
| `/register`         | Public                 | Create designer or client account   |
| `/dashboard`        | Authenticated          | Role-aware performance overview     |
| `/mockups`          | Authenticated          | Browse / manage mockups             |
| `/mockups/new`      | Designer only          | Upload a new mockup                 |
| `/mockups/:id/edit` | Designer (owner) only  | Edit an existing mockup             |
| `/orders`           | Authenticated          | Orders list with live polling       |
| `/profile`          | Authenticated          | Account details                     |

---

## REST API reference

Base URL: `http://localhost:5000/api`

All protected endpoints require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint          | Body                                      | Returns                  |
|--------|-------------------|-------------------------------------------|--------------------------|
| POST   | `/auth/register`  | `{ name, email, password, role }`         | `{ token, user }`        |
| POST   | `/auth/login`     | `{ email, password }`                     | `{ token, user }`        |
| GET    | `/auth/me`        | —                                         | `{ user }`               |

### Mockups

| Method | Endpoint        | Role                  | Notes                                       |
|--------|-----------------|-----------------------|---------------------------------------------|
| GET    | `/mockups`      | Any                   | Designers see own; clients see all          |
| GET    | `/mockups/:id`  | Any                   |                                             |
| POST   | `/mockups`      | Designer              | `multipart/form-data` — field `image`       |
| PUT    | `/mockups/:id`  | Owning designer       | `multipart/form-data` — `image` optional    |
| DELETE | `/mockups/:id`  | Owning designer       | Blocks delete if active orders exist        |

### Orders

| Method | Endpoint               | Role                        | Notes                                                  |
|--------|------------------------|-----------------------------|--------------------------------------------------------|
| GET    | `/orders`              | Any                         | Scoped to role (own / own-mockups)                     |
| GET    | `/orders/stats`        | Designer                    | Dashboard aggregates                                   |
| GET    | `/orders/:id`          | Owner or owning designer    |                                                        |
| POST   | `/orders`              | Client                      | `{ mockupId, quantity, notes? }`                       |
| PATCH  | `/orders/:id/status`   | Owning designer             | `{ status }`                                           |
| DELETE | `/orders/:id`          | Owning client               | Cancels when still `pending`                           |

Full request/response examples live in `postman/Product-Ordering-Dashboard.postman_collection.json` — import it into Postman (or Insomnia) and set the `baseUrl` + `token` collection variables.

---

## Data models

```js
// User
{ name, email, password (hashed), role: 'designer' | 'client', createdAt, updatedAt }

// Mockup
{ name, description, price, category, imageUrl, imagePublicId, designer -> User }

// Order
{ client -> User, mockup -> Mockup, quantity, unitPrice, totalPrice,
  status: pending | accepted | in_production | shipped | completed | cancelled,
  notes, createdAt, updatedAt }
```

---

## Real-time status updates

The `/orders` page polls `GET /api/orders` every 5 seconds while the tab is visible. Each response embeds `serverTime`, which is used as the "last updated" marker. If a status changes between polls, a toast notification fires immediately — a lightweight alternative to WebSockets that keeps the stack simple and Render/Vercel-friendly.

---

## Deployment

### Backend → Render

1. Push the `backend` folder to GitHub.
2. Create a new **Web Service** on [Render](https://render.com/) pointing at the repo.
3. Build command: `npm install`. Start command: `node server.js`.
4. Add environment variables matching `backend/.env.example` (including `MONGO_URI` pointing at a MongoDB Atlas cluster).
5. Set `CLIENT_ORIGIN` to your Vercel URL, e.g. `https://kinetic-gallery.vercel.app`.
6. (Recommended) Set `UPLOAD_STRATEGY=cloudinary` on Render, because Render's disk is ephemeral. Provide the three `CLOUDINARY_*` keys.

### Frontend → Vercel

1. Push the `frontend` folder to GitHub (or use the same repo with a monorepo config).
2. Import the project in [Vercel](https://vercel.com/).
3. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
4. Set `VITE_API_URL` to your Render backend URL, e.g. `https://your-app.onrender.com`.

### Heroku (alternative for backend)

`heroku create`, push the `backend` folder, then `heroku config:set MONGO_URI=... JWT_SECRET=... UPLOAD_STRATEGY=cloudinary CLOUDINARY_*=...`.

---

## Scripts

| Location    | Command          | Description                                     |
|-------------|------------------|-------------------------------------------------|
| `backend`   | `npm run dev`    | Start API with nodemon                          |
| `backend`   | `npm start`      | Start API with node (for production)            |
| `backend`   | `npm run seed`   | Reset and seed demo data                        |
| `frontend`  | `npm run dev`    | Vite dev server with `/api` proxy               |
| `frontend`  | `npm run build`  | Production build to `dist/`                     |
| `frontend`  | `npm run preview`| Preview the built app                           |

---

## Tech choices

- **Tailwind CSS** (chosen over Material-UI) — keeps the bundle lean and matches the reference design (Kinetic Gallery) exactly.
- **Vite** — instant HMR, fast builds, zero ejection.
- **axios + interceptors** — automatic token injection and consistent error shape.
- **Zod** for client-side validation — the schema doubles as type-safety documentation.
- **express-validator** for server-side validation — declarative chains, great error messages.
- **Polling vs. sockets** — the brief explicitly asks for "real-time order status updates via API polling", so we kept it simple and stateless.

---

## Submission checklist

- [x] MongoDB models: `User` (designer/client), `Mockup` (imageUrl, designer), `Order` (client, mockup, status)
- [x] JWT auth with protected routes
- [x] Multer uploads — local folder + Cloudinary fallback
- [x] Zod (frontend) + express-validator (backend) validation
- [x] React Router, Tailwind CSS, responsive layout
- [x] Login / Register / Dashboard / Mockups / Orders pages
- [x] Image upload preview + order form with quantity/pricing
- [x] Real-time order status via polling
- [x] README with setup, API docs, deploy notes
- [x] Postman collection in `postman/`
- [ ] Live demo links — add after deploying to Vercel + Render
- [ ] Video walkthrough (2–5 min) — record post-deploy

---

## License

MIT
