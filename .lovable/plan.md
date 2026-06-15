# Skyrovix Internship Portal — MVP Build Plan

A task-based virtual internship platform with user + admin dashboards, auto offer letters, digital ID cards, payment verification, and auto certificate generation — built on TanStack Start + Lovable Cloud (Supabase).

## Brand & Assets (provided)
- Logo (purple/silver Skyrovix SK mark) → `src/assets/logo.jpg`
- Seal stamp → `src/assets/seal.jpg`
- MSME logo → `src/assets/msme.png`
- Founder signature (Hariharan S, Founder & CEO) → `src/assets/sig-founder.jpg`
- Co-founder signature (Maheshwaran S, Co-founder) → `src/assets/sig-cofounder.jpg`
- Theme: deep navy + electric purple gradient (matches logo), silver accents, dark mode first.
- Fonts: Space Grotesk (headings) + Inter (body).

## Roles
- **admin** — seeded for `hariharan@skyrovix.com` on first signup
- **user** — default for everyone else

## Domains (10)
Full Stack · Frontend · Backend · Data Science · AI/ML · UI/UX · Python · Java · Cyber Security · Digital Marketing. Each has a 5-task curriculum.

## Payment
GPay UPI: `hariharanmahesh34@okhdfcbank` · Payee: Hariharan Mahesh · Fee: ₹100 · QR generated client-side from UPI string.

---

## Phase 1 — Foundation
1. Enable Lovable Cloud.
2. Design system: tokens in `src/styles.css` (navy/purple/silver), Skyrovix branded `Navbar`, `Footer`, `Logo` components.
3. Save logos/signatures/seal as project assets.

## Phase 2 — Database (one migration)
Tables (all with RLS + grants):
- `profiles` (id→auth.users, full_name, email, phone, college, course, year, photo_url, created_at)
- `user_roles` (id, user_id, role enum: admin|user) + `has_role()` security-definer
- `applications` (id, user_id, domain, status: pending|approved, intern_id [SKX-YYYY-####], offer_issued_at, created_at)
- `tasks` (id, domain, task_number 1-5, title, description, resources) — seeded
- `submissions` (id, application_id, task_id, github_url, deployed_url, notes, status: pending|approved|rejected, feedback, submitted_at, reviewed_at)
- `payments` (id, application_id, utr_number, screenshot_url, amount, status: pending|verified|rejected, verified_at)
- `certificates` (id, application_id, certificate_id [SKX-CERT-####], issued_at, verification_hash)
- Storage buckets: `profile-photos`, `payment-screenshots` (public read for cert verification only on certs)
- Trigger: on `auth.users` insert → create profile + assign role (admin if email matches seed, else user)

## Phase 3 — Auth + Public Pages
- Landing page (`/`) — hero with logo, domain grid, "How it works" (Apply → Offer → 5 Tasks → Payment → Certificate), testimonials placeholder, footer with MSME badge.
- `/auth` — email/password sign-in & sign-up.
- `/domains`, `/domains/$slug`, `/verify-certificate` (public).
- SEO: per-route titles, descriptions, OG tags.

## Phase 4 — User Dashboard (`/_authenticated/dashboard/*`)
- Dashboard home: status timeline (Applied → Offer → Tasks → Payment → Certificate).
- **Apply**: form (name, phone, college, course, year, photo, domain) → on submit creates application + generates intern ID `SKX-YYYY-####` + immediately renders:
  - **Offer Letter** (PDF via `@react-pdf/renderer`) with seal, both signatures, MSME footer, downloadable.
  - **Digital ID Card** (gradient card with photo, intern ID, domain, QR to verify).
- **Tasks**: 5 sequential tasks for chosen domain; unlock next on approval. Submission form: GitHub URL + deployed URL + notes.
- **Payment**: shown only after all 5 tasks approved. GPay QR (qrcode.react) + UPI ID copy button + UTR input + screenshot upload.
- **Certificate**: shown after payment verified. Auto-generated PDF certificate with cert ID, QR code linking to `/verify-certificate?id=…`, seal, both signatures, MSME logo.

## Phase 5 — Admin Dashboard (`/_authenticated/admin/*`, gated by `has_role('admin')`)
- Overview: counts of applications, pending submissions, pending payments, certificates issued.
- **Applications**: list/search/filter.
- **Submissions Review**: pending queue, approve/reject with feedback.
- **Payments**: pending queue with screenshot preview + UTR, verify/reject. Verifying auto-issues certificate.
- **Certificates**: list with revoke option.

## Phase 6 — Certificate Verification
- Public `/verify-certificate` page: input cert ID → shows intern name, domain, issue date, "Verified ✓" with seal.

## Technical Notes
- PDFs: `@react-pdf/renderer` (works in browser, no native deps).
- QR: `qrcode.react`.
- Server functions (`createServerFn` + `requireSupabaseAuth`) for: create application/issue intern ID, submit task, approve/reject (admin), verify payment + issue certificate (admin), public `verifyCertificate` (admin client, no auth).
- Storage uploads via browser supabase client with RLS-scoped policies.
- All admin actions check `has_role(userId, 'admin')` server-side.

## Out of scope for v1 (can add later)
- Email notifications, real payment gateway, plagiarism checks, chat/mentorship.

---

I'll build this in the order above, starting by enabling Cloud and saving your brand assets. Approve to proceed.