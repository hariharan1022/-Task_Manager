# skyrovix — Internship Task Manager

A full-stack platform where students apply to internships, complete 5 mentor-reviewed tasks, and earn verifiable certificates.

> **Status:** MVP foundation (Phase 1 of the master spec). Auth, models, internships browse/apply, applications, and the task submission flow are wired end-to-end. The remaining pages (Offer Letter PDF, Certificate, ID Card, Leaderboard, etc.) are routed and reachable — pages are stubbed and ready to be filled out in the next phases.

---

## Tech Stack

- **Frontend:** React 18 (Vite), Tailwind CSS, React Router 6, React Hook Form, Axios, Framer Motion, Lucide icons, react-hot-toast
- **Backend:** Node.js (ESM), Express 4, MongoDB + Mongoose, JWT, bcrypt, Helmet, CORS, rate-limit, Nodemailer, PDFKit, QRCode
- **Database:** MongoDB (local or Atlas)

---

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (`mongod`) **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 2. Backend

```powershell
cd "server"
copy .env.example .env       # already done — MONGO_URI defaults to mongodb://localhost:27017/skyrovix
npm install
npm run dev                  # http://localhost:5000
```

Health check: `http://localhost:5000/api/health`

### 3. Seed demo data (optional but recommended)

```powershell
cd "server"
npm run seed
```

This creates:
- **Admin** — `admin@skyrovix.local` / `Admin@12345`
- **Student** — `student@skyrovix.local` / `Student@12345`
- 4 internship programs: **MEAN Stack**, **MERN Stack**, Flutter UI/UX, and HTML/CSS/JS — 5 tasks each

To add new programs without wiping users: `npm run seed:programs`

> If login fails with "Can't reach the server", make sure the backend is running (`npm run dev` in the `server` folder) and that MongoDB is reachable. The Login page now shows a live server-status banner so you can tell at a glance.

### 4. Frontend

```powershell
cd "client"
copy .env.example .env       # VITE_API_URL=/api  (default uses Vite proxy)
npm install
npm run dev                  # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`.

---

## GitHub Pages (live site)

**Frontend:** https://hariharan1022.github.io/-Task_Manager/  
**API (Render):** https://skyrovix-task-manager-api.onrender.com/api

GitHub Pages cannot run Node.js or MongoDB. Deploy the API once on Render:

1. **Pages:** Repo **Settings → Pages → Source:** **GitHub Actions**.
2. **API:** Open [Render Blueprint](https://dashboard.render.com/select-repo?type=blueprint), connect repo `hariharan1022/-Task_Manager`, apply `render.yaml`. Wait until **skyrovix-task-manager-api** is **Live** (first start ~2–3 min; free tier may sleep when idle).
3. **Retry login** on the site. Demo user after seed: `student@skyrovix.local` / `Student@12345`.

Optional: set repo variable `VITE_API_URL` if your Render URL differs, then re-run the **Deploy frontend to GitHub Pages** workflow.

**Local dev:** `npm run dev` in `server` and `client` — uses `/api` proxy as usual.

---

## API Cheat Sheet

### Auth
- `POST /api/auth/register` — `{ fullName, email, password, ... }`
- `POST /api/auth/verify-email` — `{ email, otp }`
- `POST /api/auth/login` — `{ email, password }` → `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` — `{ refreshToken }`
- `POST /api/auth/logout` — auth required
- `GET  /api/auth/me` — auth required
- `POST /api/auth/forgot-password` — `{ email }`
- `POST /api/auth/reset-password` — `{ email, token, newPassword }`

### Internships
- `GET  /api/internships?domain=&q=` — public
- `GET  /api/internships/:id` — public
- `POST /api/internships` — admin
- `PUT  /api/internships/:id` — admin
- `DELETE /api/internships/:id` — admin (soft delete)

### Applications
- `POST /api/applications` — student applies
- `GET  /api/applications/my` — student's own applications
- `GET  /api/applications` — admin lists all
- `PUT  /api/applications/:id/status` — admin accept/reject

### Tasks
- `GET  /api/tasks/internship/:internshipId` — list 5 tasks
- `POST /api/tasks/:taskId/submit` — student submits
- `GET  /api/tasks/submissions` — admin views all submissions
- `PUT  /api/tasks/submissions/:id/review` — admin approves/rejects

### Users
- `GET/PUT /api/users/profile`
- `DELETE /api/users/account`

### Misc
- `GET /api/certificates/verify/:certId` — public certificate verification

---

## What's Built vs What's Next

### Built in this foundation (Phase 1 + 2 of the master spec)
- [x] Project scaffolding, env config, CORS, Helmet, rate limiting
- [x] All 7 database models
- [x] JWT auth (access + refresh), bcrypt password hashing, OTP verify, password reset
- [x] Public landing page, internships browse, internship detail with apply
- [x] Student dashboard: overview stats, my internships, 5-task flow with submit
- [x] Admin routes for applications and submissions
- [x] Certificate verification endpoint
- [x] Responsive sidebar + topbar + mobile nav
- [x] Toast notifications, loading skeletons, empty states
- [x] Live server-health check on the Login page

### Next phases (placeholders already routed)
- [ ] Offer letter PDF generation (PDFKit)
- [ ] LinkedIn URL submission + validation
- [ ] Certificate PDF generation with QR code
- [ ] ID Card PDF/PNG
- [ ] Profile photo upload via Cloudinary
- [ ] Leaderboard with filters
- [ ] Notifications system
- [ ] Help center
- [ ] Physical certificate order form (Razorpay)
- [ ] Dark mode toggle
- [ ] Email notifications (Nodemailer — already wired in dev)
- [ ] Deployment to Vercel + Render + Atlas

---

## Notes

- **Emails** are logged to the console in development. Configure SMTP in `.env` to send real emails.
- **Cloudinary** is optional. Profile photo uploads will fall back to local storage in future phases when keys are missing.
- **JWT secrets** in `.env.example` are placeholders only. Always replace before deploying.
- **Rate limiting** is set to 50 requests / 15 min on `/api/auth` to discourage brute force.

---

## License

MIT — built as part of an internship platform project.
