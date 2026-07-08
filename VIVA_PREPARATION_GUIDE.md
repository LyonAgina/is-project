# Fursa — Viva & Presentation Preparation Guide
## University Final Project Defense

**Platform:** Fursa — Student Opportunity Recommendation Platform  
**Document Purpose:** Comprehensive Q&A preparation for viva, technical defense, and final presentation  
**Based on:** Direct codebase analysis of the implemented system

---

> **How to Use This Guide**
>
> This document contains 100 model Q&A pairs drawn from the actual implementation.
> Every answer references the real files, functions, and database tables in your project.
> Read each answer aloud at least once before the viva — the act of speaking trains
> verbal recall under pressure. Focus extra attention on the 25 Hard Questions at the end.

---

## Table of Contents

1. [System Overview](#section-1-system-overview) — Q1–Q8
2. [Problem Statement & Objectives](#section-2-problem-statement--objectives) — Q9–Q12
3. [System Architecture](#section-3-system-architecture) — Q13–Q18
4. [Technology Stack](#section-4-technology-stack) — Q19–Q28
5. [Project Folder Structure](#section-5-project-folder-structure) — Q29–Q31
6. [Database Design](#section-6-database-design) — Q32–Q42
7. [Authentication & Authorization](#section-7-authentication--authorization) — Q43–Q51
8. [User Management](#section-8-user-management) — Q52–Q55
9. [Opportunity Management](#section-9-opportunity-management) — Q56–Q59
10. [CV Upload & File Handling](#section-10-cv-upload--file-handling) — Q60–Q65
11. [PDF Parsing & Text Extraction](#section-11-pdf-parsing--text-extraction) — Q66–Q69
12. [Recommendation Engine](#section-12-recommendation-engine) — Q70–Q80
13. [Application Workflow](#section-13-application-workflow) — Q81–Q84
14. [Notifications](#section-14-notifications) — Q85–Q87
15. [Search, Filtering & API Design](#section-15-search-filtering--api-design) — Q88–Q91
16. [Frontend Architecture & State Management](#section-16-frontend-architecture--state-management) — Q92–Q94
17. [Report Generation](#section-17-report-generation) — Q95–Q97
18. [Security, Error Handling & Validation](#section-18-security-error-handling--validation) — Q98–Q100
19. [The 25 Hardest Examiner Questions](#the-25-hardest-examiner-questions)
20. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
21. [Strategy for a Confident Viva Performance](#strategy-for-a-confident-viva-performance)

---

## Section 1: System Overview

---

### Q1. What is Fursa and what problem does it solve?

**Fursa** (Swahili for "opportunity") is a full-stack web application that connects university students with jobs, internships, and scholarships posted by organisations. The core problem it solves is the fragmentation of opportunity discovery and the absence of any objective, data-driven mechanism to tell a student how well their profile matches a given opportunity before they apply.

Without Fursa, a student manually browses scattered listings, applies blindly with no feedback, and receives little or no communication about their application status. Fursa solves this by:

- Centralising listings from verified organisations.
- Running a **weighted multi-criteria recommendation engine** that scores every active opportunity against the student's profile.
- Notifying students automatically when a high-matching opportunity is posted.
- Allowing organisations to review, compare, and communicate with applicants.
- Giving administrators system-wide oversight and analytics.

---

### Q2. Who are the three actors in the system and what does each one do?

| Actor | Login Role | Primary Capabilities |
|-------|-----------|----------------------|
| **Student** | `role='student'` | Register, complete profile, upload CV, browse/apply to opportunities, receive recommendations and notifications, download application reports |
| **Organisation** | `role='organization'` | Register (pending admin approval), post opportunities with tag requirements and match thresholds, review/compare applicants, update application status, message students |
| **Administrator** | `role='admin'` | Verify or reject organisations, manage all users (activate/deactivate/delete), view platform analytics, manage all opportunities |

All three actors share the same `users` table and are distinguished by the `role ENUM('student','admin','organization')` column.

---

### Q3. Describe the end-to-end journey of a student from registration to receiving a recommendation.

1. Student registers via `POST /api/auth/register` → transaction creates `users` + `student_profiles` rows, sends verification email.
2. Student clicks verification link → `GET /api/auth/verify-email?token=<hex>` → `email_verified` set to 1.
3. Student logs in → receives a **JWT** stored in `localStorage`.
4. Student completes profile: uploads CV (`POST /api/student/profile/cv`), adds education, tags, location.
5. Student visits Recommendations page → `GET /api/student/recommendations` is called.
6. Server reads the CV from disk, extracts text via `pdf-parse`, then scores the student against every active opportunity using six weighted criteria.
7. Opportunities scoring at or above `notification_threshold` (default 70) trigger an in-app notification and a match email via Nodemailer.
8. Student sees results ranked by descending score, each with individual metric progress bars.

---

### Q4. What is the application's name in the codebase and where does this appear?

The platform is branded **"Fursa"**. This name appears in the email utility functions: every `sendMail` call uses `from: '"Fursa" <${process.env.SMTP_USER}>'`. It also appears in email subjects such as `"Verify your Fursa account"` and `"Reset your Fursa password"` in `sendVerificationEmail.js` and `sendPasswordResetEmail.js`. The `layout.tsx` metadata names the browser tab `"Opportunity Match — your opportunity, scored"`.

---

### Q5. How does a student know their recommendation score is meaningful rather than arbitrary?

The score is not arbitrary — it is computed from six independently measurable criteria, each contributing a defined percentage weight. The breakdown is persisted in the `match_scores` table with separate columns (`skills_score`, `education_score`, `location_score`, `experience_score`, `interest_score`, `text_similarity_score`). These breakdown values are returned to the organisation's applicant view and rendered as individual progress bars in the compare page (`/dashboard/organization/opportunities/[id]/compare`), allowing both the student and the recruiter to see exactly what drove the total score.

---

### Q6. What is the application architecture type and how are the frontend and backend connected?

The system uses a **decoupled three-tier architecture**:

- **Presentation tier**: Next.js 16 (App Router), served independently on its own port.
- **Application tier**: Node.js/Express REST API.
- **Data tier**: MySQL relational database + local filesystem for uploaded files.

They are connected via **HTTP/HTTPS REST calls**. The frontend uses the `apiFetch` utility in `frontend/lib/api.js`:

```javascript
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
```

The API base URL is configured via the `NEXT_PUBLIC_API_URL` environment variable, making the two tiers independently deployable.

---

### Q7. How many database tables does the system use and can you name them all?

The system uses **10 core tables** defined in `database/schema.sql`:

1. `users` — core auth (email, password hash, role, verification state)
2. `student_profiles` — student-specific profile data
3. `organizations` — organisation profile and verification state
4. `tags` — shared skills and interests master vocabulary
5. `student_tags` — many-to-many: students ↔ tags
6. `opportunities` — job/internship/scholarship listings
7. `opportunity_tags` — many-to-many: opportunities ↔ required tags
8. `applications` — student applications to opportunities
9. `match_scores` — scoring breakdown for every student–opportunity pair
10. `notifications` — in-app notification inbox for students
11. `reports` — admin report audit log (stub table)

---

### Q8. What transactional email types does the system send and what triggers each one?

| Email Type | Trigger | Utility Function |
|-----------|---------|-----------------|
| Email verification | User registers | `sendVerificationEmail.js` |
| Password reset | `POST /api/auth/forgot-password` | `sendPasswordResetEmail.js` |
| Match alert | Score ≥ student's `notification_threshold` during recommendations | `sendMatchEmail.js` |
| Application status update | Organisation changes application status | `sendApplicationStatusEmail.js` |
| Organisation message | `POST /api/organization/message-student` or `message-applicants` | `sendOrgMessageEmail.js` |

All emails are dispatched via **Nodemailer** using a shared `transporter` configured in `backend/config/email.js` with STARTTLS on port 587.

---

## Section 2: Problem Statement & Objectives

---

### Q9. What specific problems does the recommendation engine address?

The recommendation engine addresses two problems simultaneously:

1. **Student-side discovery gap**: Students have no way to self-assess fit before applying. The engine ranks opportunities by how well the student's CV text, skills, education, location, experience, and interests align, giving each student a personalised ranked list rather than a chronological dump.

2. **Organisation-side selection noise**: When many students apply to one opportunity, the organisation must manually evaluate each one. The engine pre-sorts applicants by `total_score` in the `GET /api/organization/opportunities/:id/applicants` query (`ORDER BY ms.total_score DESC`), surfacing the most-qualified candidates first.

---

### Q10. Why is organisation verification an objective of the system?

Without organisation verification, any registered account could post fraudulent or misleading opportunities to students. The `verification_status ENUM('pending','verified','rejected')` field in `organizations` table — enforced by the `createOpportunity` controller check — means only organisations explicitly approved by an admin can post. This protects students and maintains the integrity of the listing catalogue.

---

### Q11. What objective does the `minimum_match_score` field on an opportunity serve?

It serves the **auto-rejection objective**: giving organisations a mechanism to automatically decline applications from students whose profile score falls below a defined threshold. When set, the `applyToOpportunity` controller computes `totalScore`, and if `totalScore < opp.minimum_match_score`, the application is inserted with `status='rejected'` immediately. The student receives both an in-app notification and an email explaining the reason. This saves organisations from manually reviewing clearly unqualified applications.

---

### Q12. What objective does the `notification_threshold` field on a student profile serve?

It gives students control over their match notification sensitivity. The default is 70 (70%), meaning the student only receives a push notification and match email when a new opportunity scores ≥ 70. A student who wants to be notified of all opportunities can lower this to 0; a highly selective student can raise it to 90. It is clamped to the range 0–100 server-side: `Math.min(100, Math.max(0, Number(merged.notificationThreshold) || 70))` in `studentController.updateProfile`.

---

## Section 3: System Architecture

---

### Q13. Draw and explain the system architecture.

```
Browser (Next.js 16)
     │  HTTP + Bearer JWT
     ▼
Express.js REST API (Node.js)
     ├── authRoutes        → authController
     ├── studentRoutes     → studentController + matchController
     ├── organizationRoutes→ organizationController
     ├── adminRoutes       → adminController
     └── tagRoutes         → tagController
          │
     Middleware: verifyToken · requireRole · Multer
          │
     mysql2/promise pool   Nodemailer SMTP
          │
     MySQL database        uploads/ (filesystem)
     (is_project DB)
```

The `backend/index.js` file is the entry point. It mounts `cors()` and `express.json()` globally, then registers each route group. The static `/uploads` directory is served directly by Express via `express.static()`. All configuration (DB credentials, JWT secret, SMTP settings) comes from `.env` via `dotenv`.

---

### Q14. Why was a decoupled architecture chosen over a monolithic server-side rendered approach?

A decoupled architecture separates concerns cleanly:

- The Next.js frontend can be deployed to a CDN or Vercel independently.
- The Express API can be scaled horizontally without touching the UI.
- Different teams (or different timelines) can develop frontend and backend independently.
- The REST API is reusable — a mobile app could consume the same endpoints.

For a monolithic SSR approach, every page request would hit the server and database. With the decoupled model, static assets (JS, CSS, fonts) are served separately, and the API only handles data requests.

---

### Q15. How does the backend know which user is making a request?

Through the **JWT payload**. When a user logs in, the server signs:
```javascript
jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
```
The frontend attaches this token to every request as `Authorization: Bearer <token>`. The `verifyToken` middleware decodes it:
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // { id, role }
```
Every controller then uses `req.user.id` to scope queries to the authenticated user — for example, `WHERE user_id = ?` bound to `req.user.id`.

---

### Q16. How does the system prevent one organisation from accessing another organisation's data?

By always joining through the `organizations` table with a `WHERE org.user_id = ?` clause. For example, the `getApplicants` controller:

```sql
SELECT a.* FROM applications a
JOIN opportunities o ON a.opportunity_id = o.id
JOIN organizations org ON o.organization_id = org.id
WHERE a.opportunity_id = ? AND org.user_id = ?
```

The second `AND org.user_id = ?` is bound to `req.user.id`. Even if an attacker substitutes a different `opportunityId` in the URL, the query will return zero rows unless that opportunity also belongs to the requesting organisation's user account.

---

### Q17. What role does the `uploads/` directory play and how is it accessed?

`backend/uploads/` is the on-disk store for all uploaded CV and avatar files. Express exposes it as a static route:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```
Files are accessed publicly at `http://api-host/uploads/<filename>`. The `cv_url` column stores the relative path `/uploads/<filename>`, and the frontend constructs the full URL as `${NEXT_PUBLIC_API_URL}${applicant.cv_url}`. This means clicking a CV link in the browser downloads the file directly from the Express static handler.

---

### Q18. How does the frontend know which dashboard to show after login?

The login page stores three values in `localStorage` after a successful response:
```javascript
localStorage.setItem('token', data.token);
localStorage.setItem('role', data.role);
localStorage.setItem('userId', data.userId);
```
It then routes: `router.push('/dashboard/${data.role}')`. Each dashboard layout (e.g., `student/layout.tsx`) independently validates the role on mount:
```javascript
const role = localStorage.getItem('role');
if (role !== 'student') { router.push('/login'); return; }
```
This two-layer approach (API-driven redirect + client-side guard) means even a direct URL visit to `/dashboard/admin` is rejected if the stored role is `'student'`.

---

## Section 4: Technology Stack

---

### Q19. Why was Node.js chosen for the backend rather than Python/Django or Java/Spring?

- **Non-blocking I/O**: Node.js event loop handles concurrent recommendation scoring (file reads + DB queries) without thread blocking, which suits the I/O-heavy nature of this application.
- **Single language**: Both frontend and backend use JavaScript/TypeScript, reducing the mental context switch and enabling code-sharing of utility logic.
- **npm ecosystem**: Direct access to `pdf-parse`, `mammoth`, `multer`, `bcrypt`, and `nodemailer` — all critical to this system's features — without external process calls.
- **Express.js** is deliberately minimal; it does not impose an MVC structure, giving full control over route organisation.

---

### Q20. Why was MySQL chosen over MongoDB or PostgreSQL?

**MySQL was chosen because the data is highly relational.** The recommendation engine's correctness depends entirely on referential integrity: a `match_scores` row must always have a valid `student_id` and `opportunity_id`; deleting a student must cascade and delete their scores, applications, and notifications. MongoDB (document store) has no native foreign key enforcement. PostgreSQL would also work, but MySQL is more widely available in shared/university hosting environments, and `mysql2/promise` provides first-class async/await support.

The schema comment in `schema.sql` explicitly states: *"Raw SQL schema for MySQL (no ORM, used with mysql2 in Node/Express)"*.

---

### Q21. Why was no ORM (like Sequelize or Prisma) used?

Three reasons, directly relevant to this project:

1. **Scoring queries involve complex JOINs**: The `getApplicants` query spans 6 tables. Writing this as an ORM association chain would be verbose, harder to read, and potentially generate inefficient SQL.
2. **The UPSERT pattern** (`INSERT ... ON DUPLICATE KEY UPDATE`) has no clean equivalent in Sequelize without raw SQL escapes — we use it in `scoreStudentAgainstOpportunity`.
3. **Educational transparency**: For a university project, writing raw SQL directly demonstrates understanding of relational database operations.

---

### Q22. Why was Next.js chosen instead of plain React (Create React App)?

Next.js provides **App Router** with per-segment layouts. This is exactly what the project needs: `/dashboard/student/*` uses a student-specific sidebar layout, `/dashboard/organization/*` uses a different org layout, and `/dashboard/admin/*` uses an admin layout — all defined as `layout.tsx` files in their respective folders. In plain React, this would require a manual nested router setup. Next.js also handles font optimisation for the three-font system (`Space Grotesk`, `IBM Plex Sans`, `IBM Plex Mono`) automatically via `next/font/google`.

---

### Q23. Why was Tailwind CSS v4 used and what are the design tokens in the project?

Tailwind v4 is used primarily for utility classes in organisation and admin dashboard pages. The project defines a set of **CSS custom properties (design tokens)** in `app/globals.css`:

- `--color-ink` — primary text colour
- `--color-muted` — secondary/subdued text
- `--color-line` — border colour
- `--color-paper` — background surface

These tokens are referenced as `var(--color-ink)` in inline styles throughout pages, providing a consistent visual system. The three fonts are injected as CSS variables in `layout.tsx`: `--font-disp`, `--font-body-text`, `--font-data`.

---

### Q24. Explain the role of `bcrypt` and why 10 salt rounds were chosen.

`bcrypt` is an **adaptive hashing function** — it is intentionally slow, making brute-force attacks computationally expensive. It automatically generates and embeds a random salt in the hash output, preventing rainbow table attacks.

The cost factor of **10 rounds** means bcrypt performs 2¹⁰ = 1,024 iterations of its internal key schedule. On a modern server, this takes approximately 100ms per hash — fast enough that legitimate users don't notice, but slow enough that an attacker attempting 1,000 passwords per second would need ~100 seconds per hash attempt.

Usage in `authController.js`:
```javascript
const passwordHash = await bcrypt.hash(password, 10);
// ...on login:
const isValid = await bcrypt.compare(password, user.password_hash);
```

---

### Q25. What is the purpose of `pdf-parse` and `mammoth` and why are two different libraries needed?

- **`pdf-parse`**: Parses the binary **PDF** format (`.pdf`). It wraps Mozilla's `pdf.js` engine to extract the text layer from PDF pages. Returns a `.text` property containing all content as a plain string.
- **`mammoth`**: Parses **Office Open XML** format (`.docx`). It reads the XML inside the DOCX ZIP archive and returns raw text via `extractRawText()`.

Two libraries are needed because PDF and DOCX are fundamentally different binary formats. The `extractCvText.js` function dispatches to the correct library based on the file extension:
```javascript
const ext = path.extname(filePath).toLowerCase();
if (ext === '.pdf') { ... pdfParse(buffer) ... }
if (ext === '.docx') { ... mammoth.extractRawText({ path }) ... }
```

---

### Q26. Why was `jsonwebtoken` used for authentication instead of server-side sessions?

**Stateless scalability.** Server-side sessions require the server to maintain a session store (Redis or DB), and every request must look up the session. JWT is **self-contained**: the token carries the payload `{ id, role }`, verified cryptographically without a database lookup on every request. This means:

- The `verifyToken` middleware only needs `process.env.JWT_SECRET` — no DB call.
- Multiple API server instances can all verify the same token without shared session state.

The trade-off (no revocation) is noted as a limitation, but for the scale of this project the 7-day expiry is acceptable.

---

### Q27. Why was `multer` used for file uploads?

**Multer** is the standard Express middleware for handling `multipart/form-data` (the only way to upload files via HTTP forms). It provides:
- `diskStorage` — writes files directly to disk without loading them fully into memory.
- Configurable `filename` function — used to generate `cv_<userId>_<timestamp>.<ext>` preventing filename collisions.
- `limits.fileSize` — enforces the 5 MB (CV) and 2 MB (avatar) caps before the file is fully received.
- `fileFilter` — the avatar uploader filters to `image/*` MIME types, rejecting non-image files at the middleware level.

---

### Q28. What are `jsPDF` and `SheetJS` and why are they used client-side?

- **jsPDF (v4.2.1) + jspdf-autotable (v5.0.8)**: Construct PDF documents in the browser. `doc.save()` triggers a browser download. Used to generate the student's application report PDF.
- **SheetJS/xlsx (v0.18.5)**: Constructs Excel `.xlsx` workbooks in the browser. `XLSX.writeFile()` triggers download. Used for the Excel variant of the same report.

Both run **entirely in the browser** — no server round-trip. The data is already in browser memory (from the applications list already fetched), so generating a report avoids an additional API call and server-side file generation overhead.

---

## Section 5: Project Folder Structure

---

### Q29. Explain the separation between `backend/controllers/` and `backend/routes/`.

**Routes** define the HTTP method + path mapping and apply middleware. They are thin:
```javascript
// studentRoutes.js
router.post('/applications', c.applyToOpportunity);
```
**Controllers** contain all business logic: database queries, data transformation, email dispatch, and response construction. This separation means:
- Adding a new route variant doesn't touch business logic.
- Controller functions can be reused across routes (e.g., `scoreStudentAgainstOpportunity` is called from both `studentController.applyToOpportunity` and `matchController.getRecommendations`).

---

### Q30. What is the purpose of `backend/utils/` and how is it different from `controllers/`?

`utils/` contains **pure utility functions** that have no routing concern and are reused across multiple controllers:

| Utility | Used By |
|---------|---------|
| `extractCvText.js` | `matchController.js` |
| `textSimilarity.js` | `matchController.js` |
| `sendVerificationEmail.js` | `authController.js` |
| `sendPasswordResetEmail.js` | `authController.js` |
| `sendMatchEmail.js` | `matchController.js` |
| `sendApplicationStatusEmail.js` | `studentController.js`, `organizationController.js` |
| `sendOrgMessageEmail.js` | `organizationController.js` |

Controllers orchestrate these utilities in response to HTTP requests. Utilities are decoupled from Express entirely.

---

### Q31. Why does the frontend have a `lib/` folder with only one file?

`frontend/lib/api.js` contains the `apiFetch` function, which is the **single point of entry for all API calls** in the frontend. Every page component imports and uses this function. Centralising it in `lib/` means:
- The base URL (`NEXT_PUBLIC_API_URL`) is set in exactly one place.
- JWT attachment logic is defined once.
- If the auth mechanism changes (e.g., moving from `localStorage` to a cookie), only `api.js` needs to change.

---

## Section 6: Database Design

---

### Q32. Why does the `users` table use `VARCHAR(191)` for the email column?

MySQL's InnoDB engine with `utf8mb4` character set uses up to **4 bytes per character**. The maximum byte length for an index key in older MySQL versions (5.x) is 767 bytes. For a `UNIQUE` index on a `utf8mb4` column: 767 ÷ 4 = 191.75, rounded down to **191 characters**. Using `VARCHAR(255)` would cause an index creation failure on MySQL 5.x. The schema is conservative for compatibility even though MySQL 8.x lifts this restriction.

---

### Q33. What is the 1-to-1 extension pattern and why is it used here?

Rather than putting all student fields on the `users` table, a separate `student_profiles` table extends `users` with a `user_id UNIQUE FOREIGN KEY`. Similarly, `organizations` extends `users` for organisation-specific fields.

**Why:**
- The `users` table stays clean for role-agnostic operations: login, user listing, notification dispatch.
- Student-specific fields (CV URL, education level, tags) have no meaning for organisations or admins and would clutter the base table.
- `ON DELETE CASCADE` on the foreign key ensures profile data is automatically cleaned up when a user is deleted.

---

### Q34. Why does the `tags` table use a composite unique key `(name, type)`?

The same word can exist as both a `skill` and an `interest`. For example, "Machine Learning" might be added as a skill tag by some organisations and as an interest tag by students. The composite unique key `UNIQUE KEY uniq_tag (name, type)` prevents duplicate entries of the same `(name, type)` pair while allowing `("Python", "skill")` and `("Python", "interest")` to coexist as separate records. The `type` column feeds directly into the scoring weight split: skills tags contribute to the 10% skills score; interest tags contribute to the 10% interest score.

---

### Q35. How does the database prevent a student from applying to the same opportunity twice?

At the **database layer**, via a composite unique key:
```sql
UNIQUE KEY uniq_student_opportunity (student_id, opportunity_id)
```
MySQL will raise an `ER_DUP_ENTRY` error on duplicate insertion. The `applyToOpportunity` controller catches this specifically:
```javascript
if (err.code === 'ER_DUP_ENTRY') {
  return res.status(409).json({ error: 'You already applied to this opportunity' });
}
```
This is a defense-in-depth approach: the application layer could check first, but the DB constraint is the authoritative guard.

---

### Q36. Why does `match_scores` use UPSERT instead of INSERT?

The score for a student–opportunity pair should reflect the **current state** of the student's profile. If a student updates their CV or adds new skills tags and then browses recommendations again, the scores must be refreshed. Using `INSERT ... ON DUPLICATE KEY UPDATE` achieves this atomically: if a score row already exists, it updates all score columns and sets `generated_at = NOW()`. A separate `SELECT` + conditional `INSERT` or `UPDATE` would require two queries and is vulnerable to race conditions.

```sql
INSERT INTO match_scores (student_id, opportunity_id, skills_score, ...)
VALUES (?, ?, ?, ...)
ON DUPLICATE KEY UPDATE
  skills_score = ?, ..., generated_at = NOW()
```

---

### Q37. Why does `notifications.opportunity_id` use `ON DELETE SET NULL` instead of `ON DELETE CASCADE`?

If an opportunity is deleted, we want to **preserve the notification history** in the student's inbox — the student may have already read the notification or it may document a meaningful event (e.g., "You were accepted to X"). `CASCADE` would delete the notification row entirely, creating a confusing gap in the student's inbox history. `SET NULL` keeps the notification but clears the foreign key reference, preventing a referential integrity violation while preserving the message text.

---

### Q38. What is the purpose of the `verification_status` field in `organizations` and how is it enforced?

`verification_status ENUM('pending','verified','rejected')` is the **organisation gatekeeper**. Every new organisation starts as `'pending'`. The admin changes it via `PUT /api/admin/organizations/:id/verify`. The enforcement happens in `createOpportunity`:

```javascript
const [[org]] = await connection.query(
  'SELECT id, verification_status FROM organizations WHERE user_id = ?',
  [req.user.id]
);
if (org.verification_status !== 'verified') {
  return res.status(403).json({ error: 'Organization must be verified before posting opportunities' });
}
```

Without this check, any registered organisation — including spam accounts — could immediately post opportunities to students.

---

### Q39. What does `ON DELETE CASCADE` mean in the context of `student_tags`?

```sql
FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
FOREIGN KEY (tag_id)     REFERENCES tags(id) ON DELETE CASCADE
```

If a `student_profiles` row is deleted (which happens when the parent `users` row is deleted, due to its own cascade), all `student_tags` rows for that student are automatically deleted. Similarly, if a `tags` row is deleted, all associations with that tag are removed. This maintains referential integrity without requiring the application to manually clean up junction table rows.

---

### Q40. Why does `student_profiles` store `experience_years` as `DECIMAL(4,1)` rather than `INT`?

Real-world experience is often reported in fractional years (e.g., 1.5 years from a six-month internship plus a one-year contract). `DECIMAL(4,1)` stores up to 999.9 years with one decimal place. Using `INT` would force the `experienceScore` function to round down all values, reducing scoring precision for the `(studentYears / minYears) × 100` calculation.

---

### Q41. Explain the entity relationships in the database.

```
users ──1:1──► student_profiles ──M:N──► tags (via student_tags)
users ──1:1──► organizations    ──1:N──► opportunities ──M:N──► tags (via opportunity_tags)
student_profiles ──M:N──► opportunities  (via applications)
student_profiles ──M:N──► opportunities  (via match_scores)
student_profiles ──1:N──► notifications
organizations    ──1:N──► notifications  (sent_by_org_id)
```

- **1:1** — `users` to profile tables (enforced by `UNIQUE` on `user_id`).
- **1:N** — one organisation posts many opportunities; one student has many applications/notifications.
- **M:N** — students have many tags, tags belong to many students (via `student_tags`); same for opportunity tags.

---

### Q42. Why is the `reports` table in the schema but not used by the reporting system?

The `reports` table is a **stub for a future audit log** — it was designed to record which admin generated which report type and when. In the current implementation, report data is served by live SQL aggregation queries in `adminController.getReports()` (monthly registrations, application trends, etc.). The table represents an incomplete feature: an intended audit trail that was not yet integrated into the report generation controllers. This is acknowledged as a limitation in the project.

---

## Section 7: Authentication & Authorization

---

### Q43. Walk through exactly what happens when a user logs in.

1. `POST /api/auth/login { email, password }` reaches `authController.login`.
2. `SELECT * FROM users WHERE email = ?` — if no row, return 401.
3. `bcrypt.compare(password, user.password_hash)` — if false, return 401. Both failures use the same message ("Invalid email or password") to prevent username enumeration.
4. `if (!user.is_active)` → 403 "Your account has been deactivated."
5. `if (!user.email_verified)` → 403 "Please verify your email before logging in."
6. `jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })`.
7. Return `{ token, role, userId }`.
8. Frontend stores all three in `localStorage` and calls `router.push('/dashboard/${data.role}')`.

---

### Q44. How does the `requireRole` middleware work and where is it applied?

```javascript
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};
```

It's a **middleware factory** — `requireRole('student')` returns a middleware function. Applied via `router.use()` at the top of each route file:

```javascript
// studentRoutes.js
router.use(verifyToken, requireRole('student'));
```

This means every handler registered on that router automatically passes through both `verifyToken` and `requireRole`. An org account's JWT trying to reach `/api/student/*` will fail at `requireRole` with 403.

---

### Q45. Why does the `forgotPassword` endpoint return the same response whether the email exists or not?

```javascript
const genericResponse = { message: 'If that account exists, a password reset link has been sent.' };
if (rows.length === 0) return res.json(genericResponse);
```

This prevents **user enumeration attacks** — an attacker probing the API to discover which email addresses are registered. If the endpoint returned "email not found", an attacker could systematically confirm valid email addresses. By always returning the same message, the existence of an account is not revealed.

---

### Q46. What does the verification token look like and how is it generated?

```javascript
const verificationToken = crypto.randomBytes(32).toString('hex');
```

`crypto.randomBytes(32)` generates **32 cryptographically random bytes** from the OS's CSPRNG (Cryptographically Secure Pseudo-Random Number Generator). `.toString('hex')` converts to a **64-character lowercase hexadecimal string** (e.g., `a3f7c2...`). This is sufficiently large to be unpredictable — an attacker guessing at random would need to try 2²⁵⁶ combinations. The same approach is used for password reset tokens.

---

### Q47. What happens if a verification token has expired?

```javascript
if (new Date(user.token_expires_at) < new Date()) {
  return res.status(400).json({ error: 'Verification link expired. Please request a new one.' });
}
```

The token is compared against the current time. Tokens expire **30 minutes** after generation:
```javascript
const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
```
The student must use `POST /api/auth/resend-verification { email }` to generate a fresh token.

---

### Q48. How does the system prevent an admin from accidentally locking themselves out?

`adminController.toggleUserActive` and `adminController.deleteUser` both check:
```javascript
if (parseInt(id) === req.user.id) {
  return res.status(400).json({ error: 'Cannot deactivate/delete your own account' });
}
```
`req.user.id` comes from the JWT payload. This is a hard guard — even if the admin explicitly targets their own user ID via the API, the server rejects it.

---

### Q49. Are passwords ever returned from the API?

No. The `password_hash` column is **never included in SELECT responses**. Profile fetches use explicit column lists or join only the `email` from `users`. The `getProfile` queries select `sp.*` from `student_profiles` and `org.*` from `organizations` — neither of which contains the password hash. The only time `SELECT * FROM users` is used is inside `authController.login`, and even then the full user object (including hash) is used locally for `bcrypt.compare` and never serialised into the response.

---

### Q50. Can a student's JWT be invalidated before its 7-day expiry?

**No — this is a known limitation.** JWT is stateless; the server has no record of issued tokens. If a student's account is deactivated (`is_active = false`), the existing token will still pass `verifyToken` (signature is valid). The `is_active` check only occurs during `login`. A token-blacklist pattern (storing revoked tokens in Redis) or short-lived access tokens with refresh tokens would solve this — both are noted as future improvements.

---

### Q51. What is the difference between `verifyToken` and `requireRole` and why are they separate?

- `verifyToken` answers: **"Is this a valid, unexpired, signed JWT?"** It does not care about the role.
- `requireRole` answers: **"Does this authenticated user have the right role for this resource?"**

Separating them follows the **Single Responsibility Principle** and enables flexibility: the `tagRoutes` could expose some endpoints with `verifyToken` but without a role restriction (any authenticated user), while `studentRoutes` applies both. The `/api/auth` routes apply neither — they are public.

---

## Section 8: User Management

---

### Q52. How does an admin search for users?

`GET /api/admin/users` accepts three optional query parameters:

```javascript
if (search) query += ' AND email LIKE ?'; params.push('%' + search + '%');
if (role && ['student','admin','organization'].includes(role)) {
  query += ' AND role = ?'; params.push(role);
}
if (status === 'active') query += ' AND is_active = 1';
else if (status === 'inactive') query += ' AND is_active = 0';
```

The `role` parameter is validated against an **allowlist** before being concatenated into the SQL string. The `search` term uses a parameterised `LIKE` — the `?` placeholder prevents SQL injection even though `LIKE %term%` formatting is applied.

---

### Q53. What is the difference between deactivating and deleting a user?

- **Deactivating** (`PUT /api/admin/users/:id/toggle-active`): Sets `is_active = false`. The user cannot log in, but all their data (profile, applications, scores, notifications) remains intact. This is a **reversible** soft-disable — the admin can reactivate the same account.
- **Deleting** (`DELETE /api/admin/users/:id`): Hard-deletes the `users` row. Because of `ON DELETE CASCADE` on all foreign keys referencing `users`, this also deletes the student profile, all applications, all match scores, and all notifications. This is **irreversible**.

---

### Q54. How does an admin verify an organisation?

```
PUT /api/admin/organizations/:id/verify { decision: "verified" | "rejected" }
```

```javascript
await pool.query(
  'UPDATE organizations SET verification_status = ?, verified_by = ?, verified_at = NOW() WHERE id = ?',
  [decision, req.user.id, id]
);
```

- `verified_by` records which admin made the decision (the admin's `user_id`).
- `verified_at` timestamps the decision.
- `decision` is validated: only `'verified'` or `'rejected'` are accepted.

---

### Q55. How can an admin send a notification to a specific user?

`POST /api/admin/users/:id/notify { message }` dispatches to either:
- A **student** — inserts into `notifications (student_id, message, type='admin')` after looking up the student's `student_profiles.id`.
- An **organisation or admin** — inserts into `notifications (user_id, message, type='admin')` using the raw `user_id` column.

This dual-path logic exists because the `notifications` table's primary recipient field is `student_id` (a `student_profiles` reference), but non-student users need notification support too.

---

## Section 9: Opportunity Management

---

### Q56. What fields make up an opportunity and which ones affect recommendation scoring?

| Field | Scoring Role |
|-------|-------------|
| `title` | Not directly scored |
| `category` | Not directly scored (display only) |
| `description` | **50% weight** — compared against CV text via cosine similarity |
| `min_education` | **10% weight** — compared against `student_profiles.education_level` |
| `min_academic_grade` | Part of education score |
| `min_experience` | **10% weight** — compared against `student_profiles.experience_years` |
| `location` | **10% weight** — text-matched against `student_profiles.location` |
| `tags` (via `opportunity_tags`) | **20% weight** — 10% skills + 10% interests |
| `minimum_match_score` | Auto-reject threshold (not a scoring input) |
| `deadline`, `status` | Control visibility; `'active'` opportunities are scored |

---

### Q57. Why can organisations only post opportunities after admin verification?

This is the **trust model** of the platform. Without verification, any account with `role='organization'` could immediately flood the platform with spam listings. The verification step, enforced in `createOpportunity` by checking `verification_status !== 'verified'`, means an admin has reviewed the organisation's registration details (`name`, `type`, `description`, `website`) before any student-facing listing can be created.

---

### Q58. How does the organisation delete an opportunity, and what happens to related data?

```sql
DELETE o FROM opportunities o
JOIN organizations org ON o.organization_id = org.id
WHERE o.id = ? AND org.user_id = ?
```

The JOIN ensures only the owner can delete. Because `applications`, `opportunity_tags`, and `match_scores` all have `FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE`, deleting the opportunity row also removes all associated applications, tag links, and score records. `notifications.opportunity_id` uses `ON DELETE SET NULL`, so notification history is preserved.

---

### Q59. What does the `status ENUM('active','closed','draft')` control?

- `'active'` — visible to students in `GET /api/student/opportunities` and included in recommendation scoring.
- `'draft'` — the default on insert (schema comment); not yet visible.
- `'closed'` — removed from student browsing but retained for org reporting.

The `browseOpportunities` query filters `WHERE o.status = 'active'`, and the recommendation engine also selects `WHERE o.status = 'active'`. In the admin reports, a CASE expression classifies past-deadline active listings as `'expired'` for display purposes, without altering the stored status.

---

## Section 10: CV Upload & File Handling

---

### Q60. Walk through exactly what happens when a student uploads their CV.

1. Student submits a `multipart/form-data` request to `POST /api/student/profile/cv` with field `cv`.
2. `upload.single('cv')` Multer middleware intercepts the request before the controller.
3. Multer writes the file to `backend/uploads/` with filename `cv_<userId>_<timestamp>.<ext>` (e.g., `cv_42_1720000000123.pdf`).
4. If file size exceeds **5 MB**, Multer rejects with a 400 error before the controller runs.
5. Controller checks `if (!req.file) return res.status(400).json({ error: 'No file uploaded' })`.
6. Constructs `cvUrl = '/uploads/' + req.file.filename` and stores `cvFilename = req.file.originalname`.
7. `UPDATE student_profiles SET cv_url = ?, cv_filename = ? WHERE user_id = ?`
8. Returns `{ message: 'CV uploaded', cvUrl, cvFilename }`.

---

### Q61. Why is the filename for CVs generated server-side rather than using the original filename?

The original filename could be:
- **A path traversal attack**: a filename like `../../etc/passwd` could, if saved directly, overwrite system files (mitigated by `multer`'s destination being fixed, but still a risk).
- **Conflicting**: two students uploading `CV.pdf` would overwrite each other's files.
- **Non-unique**: subsequent uploads by the same student would collide.

The pattern `cv_<userId>_<timestamp>.<ext>` guarantees uniqueness per user per upload and removes attacker control over the stored filename.

---

### Q62. How does the system enforce file type for avatar uploads?

The `avatarUpload` Multer instance in `middleware/upload.js` has a `fileFilter`:
```javascript
fileFilter: (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'));
}
```
This checks the `Content-Type` MIME header reported by the browser. The CV upload has no MIME filter — any file type is accepted — because the `extractCvText` dispatcher handles unsupported formats gracefully by returning an empty string rather than crashing.

---

### Q63. What happens if a student uploads a new CV — does the old one get deleted?

The old file **remains on disk** but is overwritten in the database. `UPDATE student_profiles SET cv_url = ?, cv_filename = ?` simply replaces the stored paths. The old file at `backend/uploads/cv_<userId>_<old_timestamp>.pdf` continues to exist on the filesystem. This is a storage leak — acknowledged as a limitation. A production system would delete the old file using `fs.unlink()` before or after writing the new one.

---

### Q64. How is a CV downloaded by an organisation reviewing applicants?

The `getApplicants` response includes `sp.cv_url` (e.g., `/uploads/cv_42_1720000000.pdf`). The organisation's applicant view constructs the download URL as:
```javascript
href={`${process.env.NEXT_PUBLIC_API_URL}${applicant.cv_url}`}
```
The browser follows this to `http://api-host/uploads/cv_42_1720000000.pdf`, which is served by Express's `express.static` handler — no controller involved.

---

### Q65. Is there any authentication required to download a CV file?

**No — this is a known security limitation.** The `/uploads` route is a raw `express.static` mount with no middleware. Anyone who knows or can guess the filename can download any CV. In production, this would be addressed by replacing `express.static` with a controller endpoint that verifies the requesting user is authorised to view that file (e.g., the student who owns it, or an organisation that received an application from them), or by using signed URLs from object storage with a short TTL.

---

## Section 11: PDF Parsing & Text Extraction

---

### Q66. How exactly does the system extract text from a PDF CV?

In `backend/utils/extractCvText.js`:

```javascript
const filename = cvUrl.replace(/^\/uploads\//, '');
const filePath = path.join(__dirname, '..', 'uploads', filename);

if (ext === '.pdf') {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}
```

1. The stored URL path (`/uploads/cv_42.pdf`) is stripped to just the filename.
2. The absolute filesystem path is constructed.
3. The file is read into a binary `Buffer` synchronously (`readFileSync`).
4. `pdfParse(buffer)` processes the buffer through pdf.js, extracting all text nodes from each page.
5. `data.text` is the raw extracted string (with newlines between sections).

---

### Q67. What happens if the CV file is missing from disk?

```javascript
if (!fs.existsSync(filePath)) {
  console.error('CV file not found on disk:', filePath);
  return '';
}
```

The function returns an empty string. `textSimilarityScore('' , description)` then returns **50** (the neutral default):
```javascript
if (tokensA.length === 0 || tokensB.length === 0) return 50;
```
The student is neither penalised nor rewarded for the missing file — a deliberate design choice to avoid crashing the recommendation pipeline when a file is absent.

---

### Q68. What types of CV files are NOT supported and what happens?

Any extension that is not `.pdf` or `.docx` falls through to:
```javascript
console.warn('Unsupported CV format for text extraction:', ext);
return '';
```
This includes `.doc` (legacy Word binary format — mammoth does not support it), `.odt`, `.txt`, `.png`, `.jpg`, and `.rtf`. The same neutral-50 default applies. The student is not told their format is unsupported — a better UX would be to reject unsupported formats at upload time.

---

### Q69. Why does `pdf-parse` fail on scanned PDFs?

Scanned PDFs store pages as **rasterised images** (JPEG or PNG layers) rather than text objects. `pdf-parse` (and pdf.js underneath) can only extract the **text layer** — the machine-readable character data embedded in a text-based PDF. A scanned PDF has no text layer; it is purely graphical. The result is either an empty string or a minimal string containing only metadata. OCR (Optical Character Recognition) — e.g., Tesseract.js — would be needed to convert the image pixels into text, which is a noted future improvement.

---

## Section 12: Recommendation Engine

---

### Q70. Explain the complete recommendation scoring formula.

$$\text{totalScore} = 0.50 \cdot T_{text} + 0.10 \cdot T_{skills} + 0.10 \cdot T_{edu} + 0.10 \cdot T_{loc} + 0.10 \cdot T_{exp} + 0.10 \cdot T_{int}$$

Where each component is a value from 0 to 100:
- $T_{text}$: **CV–description cosine similarity** (stretched with square root × 100)
- $T_{skills}$: **Skills tag overlap** `(matched / required) × 100`
- $T_{edu}$: **Education level + grade ordinal comparison**
- $T_{loc}$: **Location text match** (100 exact, 60 partial, 0 none)
- $T_{exp}$: **Experience years ratio** `min(1, years/required) × 100`
- $T_{int}$: **Interest tag overlap** `(matched / required) × 100`

---

### Q71. Walk through the `textSimilarityScore` function step by step.

**File:** `backend/utils/textSimilarity.js`

**Step 1 — Tokenise both texts:**
```javascript
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}
```
Lowercase, strip non-alphanumeric, split on whitespace, remove short words and 29 stopwords.

**Step 2 — Build term frequency maps:**
```javascript
function termFrequency(tokens) {
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  return freq;
}
```

**Step 3 — Cosine similarity:**
$$\cos(\vec{A}, \vec{B}) = \frac{\sum_t A_t B_t}{\sqrt{\sum_t A_t^2} \cdot \sqrt{\sum_t B_t^2}}$$

**Step 4 — Square-root stretch:**
```javascript
const stretched = Math.sqrt(sim);
return Math.round(stretched * 100);
```

---

### Q72. Why is a square-root transformation applied to the cosine similarity result?

Raw TF cosine similarity between a CV document (hundreds of words) and an opportunity description (dozens of words) typically produces values in the range **0.01 to 0.15**, because the two documents share relatively few tokens out of their respective total vocabularies. Without transformation:
- A "perfect" matching CV might score 0.15 × 100 = **15%** of the 50% text component.
- All candidates would cluster near the low end, making differentiation impossible.

`Math.sqrt(0.15) ≈ 0.387`, giving **38.7** — a more usable value. Crucially, `sqrt` preserves the **relative ordering** of candidates (if A > B, then √A > √B), so ranking is not distorted. The neutral default of 50 for empty CVs sits naturally in this stretched range.

---

### Q73. How is the education score calculated when both `min_education` and `min_academic_grade` are set?

```javascript
function educationScore(studentLevel, studentGrade, minLevel, minGrade) {
  // ...
  if (minLevel && minGrade) return (levelScore + gradeScore) / 2;
}
```

Both sub-scores are computed independently and averaged. For level scoring:
```javascript
const sRank = EDU_RANK[studentLevel] || 0;  // { certificate:1, diploma:2, undergraduate:3, graduate:4 }
const rRank = EDU_RANK[minLevel] || 0;
levelScore = sRank >= rRank ? 100 : Math.max(0, (sRank / rRank) * 100);
```
A graduate student applying for a position requiring undergraduate-level education gets 100 (overqualified is not penalised). An undergraduate applying for a graduate-required position gets `(3/4) × 100 = 75`.

---

### Q74. How does the location scoring work and why is it text-based rather than GPS-based?

```javascript
function locationScore(studentLoc, oppLoc) {
  if (!oppLoc) return 100;
  if (!studentLoc) return 0;
  const s = studentLoc.trim().toLowerCase();
  const o = oppLoc.trim().toLowerCase();
  if (s === o) return 100;
  if (s.includes(o) || o.includes(s)) return 60;
  return 0;
}
```

**Three tiers:**
- Exact case-insensitive match → 100
- One string contains the other (e.g., "Nairobi West" contains "Nairobi") → 60
- No relationship → 0

**Why text-based:** The schema comment explicitly states *"Location is plain text — matched by exact/partial text comparison, not haversine."* The platform targets users entering freeform locations like "Nairobi", "Lagos", or "Remote". There are no coordinates stored, so geodesic distance computation is not possible.

---

### Q75. What is `tagOverlapScore` and how are the two different tag types handled separately?

```javascript
function tagOverlapScore(studentTagIds, requiredTagIds) {
  if (!requiredTagIds.length) return 100;
  const overlap = requiredTagIds.filter((id) => studentTagIds.includes(id)).length;
  return (overlap / requiredTagIds.length) * 100;
}
```

The function takes two arrays of **integer tag IDs**. For the skills score, it is called with skill-filtered IDs; for the interest score, interest-filtered IDs:

```javascript
const studentSkillIds = studentTagRows.filter((t) => t.type === 'skill').map((t) => t.tag_id);
const studentInterestIds = studentTagRows.filter((t) => t.type === 'interest').map((t) => t.tag_id);
// ...
const skillsScore = tagOverlapScore(studentSkillIds, reqSkillIds);   // → 10%
const interestScore = tagOverlapScore(studentInterestIds, reqInterestIds); // → 10%
```

If an opportunity has no required tags of a given type, the score defaults to 100 (no penalty for a missing requirement).

---

### Q76. Where are match scores stored and why?

Match scores are persisted in the `match_scores` table with **one row per (student, opportunity) pair**, including breakdown columns: `skills_score`, `education_score`, `location_score`, `experience_score`, `interest_score`, `text_similarity_score`, `total_score`.

**Why persist:**
1. The organisation's applicant view (`GET /api/organization/opportunities/:id/applicants`) JOINs this table to include scores without re-computing them.
2. The compare view displays individual metric bars per candidate — only possible because breakdowns are stored.
3. Scores can be audited and debugged: if a student disputes their score, the breakdown is available.
4. The UPSERT pattern (`ON DUPLICATE KEY UPDATE`) keeps scores current when students update their profiles.

---

### Q77. When are match notifications sent and how is duplicate notification prevented?

Notifications are sent when:
1. `totalScore >= student.notification_threshold` (user-configurable, default 70).
2. The opportunity has **not** been previously notified to this student.

The deduplication check:
```javascript
const [alreadyNotified] = await pool.query(
  'SELECT opportunity_id FROM notifications WHERE student_id = ? AND type = \'match\'',
  [student.id]
);
const notifiedOppIds = new Set(alreadyNotified.map((r) => r.opportunity_id));
```
If the `opportunity_id` is in `notifiedOppIds`, no new notification is inserted. This prevents the student from being spammed every time they refresh their recommendations page.

---

### Q78. Why does the recommendation engine run on every GET request to `/api/student/recommendations` rather than being pre-computed?

This is a **compute-on-demand** strategy. Pre-computing scores asynchronously (e.g., triggered when opportunities are posted) would require a background job scheduler (not in the current implementation). On-demand scoring ensures:
- Scores always reflect the **current state** of both the student's profile and the opportunity description.
- No cached stale scores are served if the student has recently updated their CV.
- Implementation is simpler — no need for a job queue, worker processes, or event triggers.

The trade-off (latency proportional to number of active opportunities) is acknowledged as a scalability limitation.

---

### Q79. How does the scoring engine handle a student with no CV uploaded?

`extractCvText(null)` returns `''` immediately (`if (!cvUrl) return ''`). Then:
```javascript
function textSimilarityScore(textA, textB) {
  const tokensA = tokenize(textA); // []
  if (tokensA.length === 0) return 50;
}
```
The text similarity score defaults to **50** — a neutral value that neither penalises nor rewards. The student still receives partial scores from the other five criteria. The frontend shows a warning: *"Upload your CV before applying"* — linking to the profile page.

---

### Q80. How does the `computeAndSaveRecommendations` function avoid blocking the database with excessive writes?

It processes opportunities in a **sequential `for...of` loop** (not `Promise.all`). This means at any moment, only one `scoreStudentAgainstOpportunity` call (with its DB reads and the UPSERT write) is in flight per recommendation request. This was a deliberate choice to avoid:
- Race conditions on the `match_scores` table UPSERT from concurrent coroutines.
- Flooding the connection pool with 50+ simultaneous queries.

The trade-off is linear latency. The system is designed to handle the expected scale (tens to hundreds of active opportunities) rather than thousands.

---

## Section 13: Application Workflow

---

### Q81. What validations occur before an application is accepted?

In `studentController.applyToOpportunity`:

1. **CV required**: `if (!profile.cv_url) return 400 { error: 'Please upload your CV', code: 'CV_REQUIRED' }`.
2. **Opportunity exists**: opportunity is looked up; if not found, 404.
3. **Duplicate prevention**: Database `UNIQUE KEY` raises `ER_DUP_ENTRY` → 409.
4. **Auto-reject gate**: if `opp.minimum_match_score !== null && totalScore < opp.minimum_match_score`, application is inserted with `status='rejected'` and student is notified.

---

### Q82. Explain the auto-rejection workflow in detail.

When an organisation sets `minimum_match_score = 60` on an opportunity:

1. Student applies → `scoreStudentAgainstOpportunity(studentId, oppId)` computes `totalScore = 45`.
2. `45 < 60` → auto-reject branch:
   ```javascript
   const initialStatus = autoReject ? 'rejected' : 'submitted';
   await pool.query('INSERT INTO applications ... status = ?', [initialStatus]);
   ```
3. A notification is inserted: *"Thank you for applying to [title]. Unfortunately, your profile did not meet the minimum match score."*
4. `sendApplicationStatusEmail` dispatches a rejection email.
5. HTTP 201 returned with `{ autoRejected: true, score: 45 }`.

The student sees `autoRejected: true` in the response — the frontend should display this transparently.

---

### Q83. What are the four application statuses and who controls each transition?

| Status | Set By | Meaning |
|--------|--------|---------|
| `submitted` | System (on application) | Application received, awaiting review |
| `under_review` | Organisation | Organisation is actively evaluating |
| `accepted` | Organisation | Application successful |
| `rejected` | Organisation OR System (auto-reject) | Application not successful |

Status updates by organisations use `PUT /api/organization/applications/:appId/status`. The valid statuses are validated server-side against `['submitted','under_review','accepted','rejected']`.

---

### Q84. What happens when an organisation updates an application status to 'accepted'?

In `organizationController.updateApplicationStatus`:

1. Application status updated: `UPDATE applications SET status = 'accepted', status_updated_at = NOW() WHERE id = ?`.
2. A notification inserted for the student: message is the org's custom message OR the default: *"Congratulations! Your application has been accepted."*
3. `sendApplicationStatusEmail(student.email, 'accepted', message)` dispatches an email with subject *"Your application was accepted!"*
4. HTTP 200 returned to the organisation.

---

## Section 14: Notifications

---

### Q85. How many notification types exist and what distinguishes them in the database?

Four types, stored in `notifications.type VARCHAR(50)`:

| Type | Origin | `sent_by_org_id` |
|------|--------|----------------|
| `'match'` | Recommendation engine | NULL |
| `'application'` | Organisation status change or auto-reject | NULL (system) |
| `'admin'` | Manual admin notification | NULL |
| `'org_message'` | Direct org message | Organisation's ID |

The `type` column is used by the frontend inbox to style notifications differently and display the sender's name (from `sent_by_org_name` in the JOIN).

---

### Q86. How does the unread notification count badge work in the student nav?

In `student/layout.tsx`:
```javascript
const fetchUnread = async () => {
  const res = await apiFetch('/api/student/notifications');
  const data = await res.json();
  if (Array.isArray(data)) setUnreadCount(data.filter((n) => !n.is_read).length);
};

useEffect(() => {
  fetchUnread();
  const interval = setInterval(fetchUnread, 60_000); // every 60 seconds
  return () => clearInterval(interval); // cleanup on unmount
}, []);
```

The interval is established on layout mount and cleared on unmount to prevent memory leaks. The badge renders `unreadCount > 0` with the count number. This is a polling approach — acknowledged as less efficient than WebSocket push.

---

### Q87. How can an organisation broadcast a message to all applicants of an opportunity?

`POST /api/organization/message-applicants { opportunityId, message }`:

```javascript
const [applicants] = await pool.query(`
  SELECT sp.id AS student_id, u.email
  FROM applications a
  JOIN student_profiles sp ON a.student_id = sp.id
  JOIN users u ON sp.user_id = u.id
  JOIN opportunities o ON a.opportunity_id = o.id
  WHERE a.opportunity_id = ? AND o.organization_id = ?
`, [opportunityId, org.id]);

for (const applicant of applicants) {
  await pool.query('INSERT INTO notifications ... VALUES (?, ?, ?, ?)',
    [applicant.student_id, message, 'org_message', org.id]);
  await sendOrgMessageEmail(applicant.email, org.name, message);
}
```

One notification row and one email per applicant. The `o.organization_id = ?` check ensures the org can only broadcast to applicants of their own opportunities.

---

## Section 15: Search, Filtering & API Design

---

### Q88. Where is search/filtering done — client-side or server-side — and why?

**It depends on the feature:**

| Feature | Filtering Location | Rationale |
|---------|-------------------|-----------|
| Student opportunity browsing | Client-side (`useMemo`) | All active opportunities returned once; filter on keypress without re-fetching |
| Student application history | Client-side (`useMemo`) | Personal list is small |
| Admin user list | **Server-side** (`LIKE`, `role=`, `is_active=`) | Total user count may be large; avoids transferring all users |

Client-side filtering uses `useMemo` to only recompute when `apps`, `statusFilter`, or `search` changes — avoiding unnecessary re-renders.

---

### Q89. Explain the API versioning strategy.

There is **no explicit versioning** in the current implementation. All routes are under `/api/` without a version prefix (e.g., `/api/v1/`). This is a deliberate simplification for a university project. In a production system, versioning (`/api/v1/`, `/api/v2/`) would allow breaking changes without disrupting existing clients. This is acknowledged as a future improvement.

---

### Q90. How does the system handle CORS and why is it necessary?

```javascript
app.use(cors()); // backend/index.js
```

CORS (Cross-Origin Resource Sharing) headers are added to every response. This is necessary because the frontend (e.g., `http://localhost:3000`) and the backend API (e.g., `http://localhost:5000`) run on different origins. Without `cors()`, browsers would block the frontend's fetch requests due to the same-origin policy. The current configuration uses `cors()` with default settings (all origins allowed), which is appropriate for development. Production should restrict to the known frontend origin.

---

### Q91. What does the `/api/health` endpoint do and why does it exist?

```javascript
app.get('/api/health', async (req, res) => {
  const [rows] = await pool.query('SELECT 1 + 1 AS result');
  res.json({ status: 'ok', dbTest: rows[0].result });
});
```

It is a **liveness and database connectivity check**. It verifies both that the Express server is running and that the `mysql2` connection pool can successfully execute a query. This endpoint can be polled by a load balancer, container orchestrator (Kubernetes), or monitoring tool to determine whether the backend is healthy. No authentication is required.

---

## Section 16: Frontend Architecture & State Management

---

### Q92. How does the frontend manage state across multiple pages?

State is managed **locally per component** using React `useState`. There is no global state manager (no Redux, Zustand, or Context API). The reasoning:
- Each page independently fetches its own data — no cross-page sharing is needed.
- The only "global" state (token, role, userId) is stored in `localStorage` and read by any component that needs it via `localStorage.getItem('token')`.

The `apiFetch` utility centralises the token attachment so components never directly interact with `localStorage` for API calls.

---

### Q93. Explain the student profile page architecture and how edits are handled.

The profile page (`dashboard/student/profile/page.tsx`) holds a single `profile` state object and renders five card components: `HeroCard`, `AboutCard`, `EducationCard`, `SkillsCard`, `CVCard`.

Each card:
1. Receives relevant fields as props.
2. Manages its own `editing` boolean state.
3. On save: calls `apiFetch('/api/student/profile', { method: 'PUT', body: JSON.stringify(updates) })`.
4. On success: calls `onSaved(updates)` which bubbles the change to the parent via the `patch(updates)` helper:
   ```javascript
   const patch = (updates) => setProfile((prev) => ({ ...prev, ...updates }));
   ```
This pattern keeps each card self-contained while keeping the master profile state in the page-level component.

---

### Q94. How does the Next.js App Router layout system work in this project?

Three layout trees exist under `app/dashboard/`:

- `student/layout.tsx` — renders student sidebar nav, handles student auth guard, polls notifications.
- `organization/layout.tsx` — renders org sidebar nav, handles org auth guard.
- `admin/layout.tsx` — renders admin sidebar nav, handles admin auth guard.

Each is a `'use client'` component that reads `localStorage` on mount. The layouts are **persistent** across their child routes — navigating from `/dashboard/student/profile` to `/dashboard/student/applications` does not unmount the layout, preserving the notification polling interval and the sidebar state.

---

## Section 17: Report Generation

---

### Q95. How is a PDF report generated for student applications?

In `frontend/app/dashboard/student/applications/page.tsx`, triggered by the `ReportModal`:

```javascript
const doc = new jsPDF();
doc.text('My Applications', 14, 15);
autoTable(doc, {
  head: [['Opportunity', 'Organization', 'Category', 'Status', 'Applied']],
  body: filtered.map((a) => [
    a.title, a.organization_name, a.category,
    STATUS_LABELS[a.status],
    new Date(a.applied_at).toLocaleDateString()
  ]),
  startY: 25,
  styles: { fontSize: 9 },
});
doc.save('my-applications.pdf');
```

The entire generation happens **in the browser** using jsPDF (v4.2.1) and jspdf-autotable (v5.0.8). No server call is made — the data is already in the browser's `apps` state. `doc.save()` triggers a browser file download.

---

### Q96. How does the Excel export differ from the PDF export?

The Excel export uses **SheetJS (xlsx v0.18.5)**:

```javascript
const ws = XLSX.utils.json_to_sheet(filtered.map((a) => ({
  Opportunity: a.title,
  Organization: a.organization_name,
  Category: a.category,
  Status: STATUS_LABELS[a.status],
  'Applied At': new Date(a.applied_at).toLocaleDateString(),
})));
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Applications');
XLSX.writeFile(wb, 'my-applications.xlsx');
```

Key differences from PDF:
- Output is a structured `.xlsx` file (an Excel workbook with a sheet named "Applications").
- Data is editable and can be further analysed in Excel/Google Sheets.
- Column headers are the JavaScript object keys.
- `XLSX.writeFile()` handles the browser download.

Both formats export the **currently filtered** view (respects the active status filter and search term).

---

### Q97. What charts does the organisation reports page show and what data feeds them?

Five charts powered by **Recharts**, all from `GET /api/organization/reports`:

| Chart | Type | Data Source |
|-------|------|-------------|
| Opportunities by status | Pie chart | `oppsByStatus` (active/closed/draft/expired) |
| Opportunities by category | Pie chart | `oppsByCategory` (job/internship/scholarship) |
| Applications by status | Bar chart | `appsByStatus` (submitted/under_review/accepted/rejected) |
| Monthly application trend | Line chart | `monthlyApplications` (last 6 months) |
| Top opportunities by applicants | Horizontal bar chart | `topOpportunities` (top 8 by applicant count) |

The "expired" category in the status pie is computed server-side with a `CASE WHEN deadline < CURDATE() THEN 'expired' ELSE status END` expression, without modifying stored data.

---

## Section 18: Security, Error Handling & Validation

---

### Q98. What measures prevent SQL injection in this system?

**Every database query uses parameterised statements** via mysql2's `?` placeholder syntax:
```javascript
pool.query('SELECT id FROM users WHERE email = ?', [email]);
```
mysql2 sends the query and parameters separately to the MySQL server, which processes them independently — user-supplied values are **never interpolated into the SQL string** and can never be interpreted as SQL syntax.

The only near-exception is the admin user search, where `role` is concatenated after being validated against an explicit allowlist:
```javascript
if (role && ['student', 'admin', 'organization'].includes(role)) {
  query += ' AND role = ?';
  params.push(role);
}
```
Even here, `role` is added as a parameterised value (`?`), not concatenated directly.

---

### Q99. How are errors handled consistently across the backend?

Every controller function uses `try/catch`:
```javascript
try {
  // ... business logic
} catch (err) {
  console.error(err); // full error logged server-side
  res.status(500).json({ error: 'Human-readable message' }); // sanitised message to client
}
```
Key patterns:
- **Specific MySQL error codes** are caught before the generic catch: `if (err.code === 'ER_DUP_ENTRY') return res.status(409)`.
- **Database transactions** are rolled back in catch: `await connection.rollback()`.
- **Email failures** are caught in nested try/catch and logged without failing the main response — email is non-critical.
- The full error object (including stack trace) is `console.error`'d server-side but **never sent to the client**, preventing information leakage.

---

### Q100. What is the most significant security vulnerability in the current implementation and how would you fix it?

The most significant vulnerability is **unauthenticated CV file access**. The `express.static` mount on `/uploads` serves all files publicly without any identity check. An attacker who can guess or enumerate filenames (the pattern `cv_<userId>_<timestamp>.<ext>` is somewhat predictable if they know a user's ID) can download any student's CV.

**Fix:**
Replace `express.static` with a protected controller endpoint:
```javascript
app.get('/api/files/cv/:filename', verifyToken, async (req, res) => {
  const { filename } = req.params;
  // Check: does req.user own this file, OR are they an org that received an
  // application from the student who owns this file?
  const [[record]] = await pool.query(
    'SELECT id FROM student_profiles WHERE user_id = ? AND cv_url LIKE ?',
    [req.user.id, '%' + filename]
  );
  if (!record) return res.status(403).json({ error: 'Access denied' });
  res.sendFile(path.join(__dirname, 'uploads', filename));
});
```
Or migrate to object storage with **signed URLs** that expire after a short TTL.

---

## The 25 Hardest Examiner Questions

> **Warning:** These questions are designed to test deep understanding. Generic answers will be marked down. Every answer should reference specific code, files, or database design choices.

---

**H1.** Your text similarity component carries 50% of the total score. How do you justify this high weight, and what happens to the recommendation quality if a student uploads an irrelevant document as their "CV"?

> **Model Answer:** The 50% weight reflects the premise that CV text is the richest holistic representation of a student — it captures skills, projects, education, and language simultaneously. If an irrelevant document is uploaded (e.g., an essay), `extractCvText` will return text whose tokens have low cosine overlap with any job description's tokens. `textSimilarityScore` will return a low-but-non-zero value (not 0, because `sqrt(tiny_value) > 0`). The student will rank lower on recommendations. There is no malicious exploitation concern here — a low score merely hurts the student's ranking. To address gaming, one could add a minimum token count check and reject uploads with fewer than N meaningful tokens.

---

**H2.** The `computeAndSaveRecommendations` function runs in a `for...of` loop. What are the performance implications of this choice and how would you refactor it for scale?

> **Model Answer:** Sequential processing means the total latency is `N × (file_read_time + DB_query_time + compute_time)` where N = number of active opportunities. With 100 opportunities, this could take several seconds. The choice was made to avoid race conditions on the `match_scores` UPSERT. Refactoring options: (1) Move to `Promise.all` with careful UPSERT — mysql2's parameterised queries are safe for concurrent execution. (2) Implement a background job queue (BullMQ + Redis) — scoring triggered asynchronously when a student updates their profile or when a new opportunity is posted. The `/recommendations` endpoint would then serve pre-computed scores instantly.

---

**H3.** What would happen if two students submitted their profiles simultaneously and both triggered scoring against the same opportunity? Could there be a race condition?

> **Model Answer:** The UPSERT query `INSERT INTO match_scores ... ON DUPLICATE KEY UPDATE` is atomic at the MySQL level — each execution either inserts or updates a single row. Two concurrent UPSERTs for different `(student_id, opportunity_id)` pairs operate on different rows and cannot conflict. Two concurrent UPSERTs for the *same* pair (impossible here, as each student's recommendation request uses their own `student_id`) would serialize on the row lock. There is no race condition in practice.

---

**H4.** Why is the `text_similarity_score` column added to `match_scores` if the original schema only shows `skills_score`, `education_score`, `location_score`, `experience_score`, `interest_score`, and `total_score`?

> **Model Answer:** The `match_scores` table was extended after initial schema design to include `text_similarity_score` because the recommendation engine evolved — the 50% text component was added later, and the column was added via the UPSERT query in `scoreStudentAgainstOpportunity`. The schema.sql file represents the initial design; the actual running system has this additional column. This is a schema migration management gap — in production, ALTER TABLE migrations would track this change. It's a honest limitation to acknowledge.

---

**H5.** The `minimum_match_score` threshold auto-rejects students. Is this ethically justifiable, and does the implementation communicate this to the student fairly?

> **Model Answer:** Ethically, the threshold is the organisation's prerogative — it filters unqualified candidates. The implementation communicates transparently: the rejection notification message explicitly states *"your profile did not meet the minimum match score"* and the `autoRejected: true` flag in the API response allows the frontend to display a specific message. However, the student is not told what the minimum score was or what their score was at the point of rejection — only a vague threshold explanation. An improvement would be to show the student their score and the threshold, empowering them to improve their profile.

---

**H6.** JWT tokens expire after 7 days, but there is no revocation mechanism. Describe three scenarios where this is a problem and how each would be mitigated.

> **Scenario 1:** An admin deactivates a student's account. The student's existing JWT is still valid for up to 7 days. Mitigation: short-lived tokens (15 min) + refresh tokens stored as HttpOnly cookies; deactivating an account deletes the refresh token.
>
> **Scenario 2:** A user changes their password after a security breach. Old tokens remain valid. Mitigation: include a `password_hash_version` or `password_changed_at` timestamp in the JWT; verify on each request that it hasn't changed.
>
> **Scenario 3:** A token is stolen (XSS or MITM). The attacker can use it for 7 days. Mitigation: store tokens in HttpOnly cookies (not localStorage) to prevent XSS access; enforce HTTPS to prevent MITM.

---

**H7.** Explain exactly what the `Math.sqrt` transformation does to the cosine similarity score. Prove that it preserves ranking order.

> **Mathematical proof:** For any two cosine similarities $a$ and $b$ where $0 \leq a < b \leq 1$, we need to show $\sqrt{a} < \sqrt{b}$. Since $\sqrt{}$ is a strictly monotonically increasing function on $[0, \infty)$, $a < b \Rightarrow \sqrt{a} < \sqrt{b}$. QED. The ranking order is provably preserved. The transformation only changes the *magnitude* of scores, not their relative order, so candidate A who ranks above candidate B on raw cosine will still rank above B after the sqrt transformation.

---

**H8.** The `student_tags` table is wiped and reinserted on every profile update. What are the risks of this approach and when would it cause problems?

> **Risk 1 — Data loss on partial failure:** If the DELETE succeeds but the loop of INSERT statements fails halfway (e.g., DB connection drops), the student ends up with fewer tags than they intended. This is mitigated because `updateProfile` wraps the operation in a transaction — `beginTransaction` / `commit` / `rollback`.
>
> **Risk 2 — Concurrent requests:** If the student's frontend sends two rapid profile updates, one DELETE might run after the other's INSERT, leaving an empty `student_tags` state. Mitigation: pessimistic locking or an idempotent UPSERT pattern.
>
> **Risk 3 — Performance:** For students with many tags, deleting and reinserting all rows on every save is wasteful. A diff-based approach (only insert new, delete removed) would be more efficient but more complex.

---

**H9.** How would you add a new `remote` option to the location system? What would need to change?

> `locationScore` would need a special case: if `oppLoc === 'remote'`, any student location matches → return 100. If `studentLoc === 'remote'` and `oppLoc` is physical, the score depends on policy (0 or 60). Changes needed: `matchController.locationScore()`, the `opportunities` table `location` field (could use a standard sentinel like 'Remote'), and the frontend opportunity creation form.

---

**H10.** The `reports` table exists in the schema but is never written to by the report generation code. Is this a bug or a design decision?

> It is an **incomplete feature** — a design intention that was not fully implemented. The table was designed as an audit log of who generated what report and when. The actual reporting system serves live SQL aggregations from `adminController.getReports()` without writing to this table. Whether it's a "bug" depends on requirements: if the requirement was to log report generation, it's a bug; if the requirement was only to serve report data, the table is unused scaffolding. Either way, acknowledging this discrepancy between schema design and implementation is a mark of thorough understanding.

---

**H11.** What would happen if the SMTP server is down when a student registers?

> The email send in `authController.register` is wrapped in a separate `try/catch`:
> ```javascript
> try {
>   await sendVerificationEmail(email, verificationToken);
> } catch (emailErr) {
>   console.error('Failed to send verification email:', emailErr);
> }
> ```
> The user account is **already created** (transaction committed before the email attempt). The server returns HTTP 201 as if registration succeeded. The student will receive the success message but no email arrives — they will need to use the `POST /api/auth/resend-verification` endpoint. This is intentional: a failed email should not roll back a successful registration.

---

**H12.** How does the system handle a student applying to an opportunity that gets deleted after the application is submitted?

> `applications.opportunity_id` has `FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE`. Deleting the opportunity **cascades and deletes the application row** as well. The student's application disappears from their applications list without explanation. There is no "soft delete" for opportunities in the current system. A better design would use `ON DELETE SET NULL` or retain a `deleted_opportunities` archive table to preserve application history.

---

**H13.** Why does `browseOpportunities` return all active opportunities without pagination, and at what point does this become a problem?

> All active opportunities are returned in a single query ordered by deadline. This is acceptable for the current expected scale (tens of opportunities). It becomes a problem when: (1) the response payload exceeds what can comfortably be rendered in the browser, (2) the client-side filter loop becomes slow with thousands of items, or (3) mobile users on slow connections experience long load times. The fix is server-side `LIMIT`/`OFFSET` pagination with a `page` and `pageSize` query parameter, paired with a paginator component in the frontend.

---

**H14.** The `apiFetch` function stores the JWT in `localStorage`. What security risk does this create and what is the alternative?

> **Risk:** `localStorage` is accessible to JavaScript running on the page. Any **Cross-Site Scripting (XSS)** attack that injects JavaScript into the page can read `localStorage.getItem('token')` and steal the JWT.
>
> **Alternative:** Store the JWT in an **HttpOnly cookie**. HttpOnly cookies are not accessible to JavaScript — only the browser sends them automatically with each request. This eliminates the XSS token theft vector. The trade-off is that HttpOnly cookies require CSRF protection (e.g., SameSite=Strict or a CSRF token header), adding implementation complexity.

---

**H15.** Describe what happens end-to-end when an organisation sends a broadcast message to all applicants of opportunity #5.

> 1. `POST /api/organization/message-applicants { opportunityId: 5, message: "..." }` arrives at `organizationController.sendMessageToApplicants`.
> 2. Org's `id` fetched from `organizations WHERE user_id = req.user.id`.
> 3. All applicants queried: `JOIN applications a ON a.opportunity_id = 5 JOIN opportunities o WHERE o.organization_id = org.id` — ensures ownership.
> 4. For each applicant: `INSERT INTO notifications (student_id, message, type='org_message', sent_by_org_id=org.id)`.
> 5. For each applicant: `sendOrgMessageEmail(student.email, org.name, message)`.
> 6. HTTP 200 returned. Email failures are logged but do not halt the loop.
> 7. Each student now sees the message in their inbox (`GET /api/student/notifications`) with `sent_by_org_name` displayed.

---

**H16.** Cosine similarity only considers term frequency. What information is it missing that would improve matching quality?

> **TF-IDF would add IDF (Inverse Document Frequency):** A term like "experience" appears in almost every CV and every job description. In pure TF, it counts equally with a rare term like "kubernetes". In TF-IDF, "experience" would have a low IDF (high document frequency → low discriminating value) and "kubernetes" would have a high IDF. This means rare, specific skill terms would drive matching more than generic language, improving precision. The current TF model over-weights common words despite the stopword list (which only removes a small set of function words).

---

**H17.** What does `mammoth.extractRawText` return for a DOCX file with tables? Would a student's skills listed in a table be captured?

> `mammoth.extractRawText` converts all document content to plain text — it traverses XML nodes including table cells, paragraphs, list items, and headings. Text within `<w:t>` (text run) elements inside table cells is extracted sequentially, row by row. Yes, skills listed in a DOCX table would be captured. The resulting text may not have perfect sentence structure around table content, but the tokens would be present for the cosine similarity tokeniser to pick up.

---

**H18.** The connection pool has `connectionLimit: 10`. What happens if 11 simultaneous requests arrive?

> The 11th request waits because `waitForConnections: true` is set in the pool configuration (`db.js`). mysql2 queues the connection request internally and fulfils it as soon as one of the 10 connections is released. If the queue grows very large or connections are held for a long time (e.g., a slow recommendation scoring loop holding a connection across multiple queries), requests may time out. This is the key reason why long-running operations like `computeAndSaveRecommendations` should eventually be moved to a background worker with its own connection pool, freeing the web-tier pool for rapid response routes.

---

**H19.** Why is `bcrypt.hash` called with `await` in an async controller, and what would happen if `await` was accidentally omitted?

> `bcrypt.hash` returns a **Promise**. With `await`, execution pauses until the hash is complete and assigns the resolved value (the hash string) to `passwordHash`. Without `await`:
> ```javascript
> const passwordHash = bcrypt.hash(password, 10); // Promise object, not the hash string
> ```
> `passwordHash` would be a `Promise` object. `INSERT ... VALUES (?, ...)` would bind the string representation `"[object Promise]"` as the password hash. The user would be created but could never log in (bcrypt.compare would always return false). This is a silent, hard-to-debug bug.

---

**H20.** How would you modify the system to support "Remote" as a valid location with 100% score for any student?

> Change `locationScore` in `matchController.js`:
> ```javascript
> function locationScore(studentLoc, oppLoc) {
>   if (!oppLoc) return 100;
>   const o = oppLoc.trim().toLowerCase();
>   if (o === 'remote') return 100;  // remote matches any student
>   if (!studentLoc) return 0;
>   const s = studentLoc.trim().toLowerCase();
>   if (s === 'remote') return 100;  // student is remote-capable
>   if (s === o) return 100;
>   if (s.includes(o) || o.includes(s)) return 60;
>   return 0;
> }
> ```
> Also update the opportunity creation form's location field to include "Remote" as an option.

---

**H21.** The `student/layout.tsx` reads `localStorage` to check the role. What security concern does this introduce and can it be bypassed?

> `localStorage` is readable and writable by JavaScript. A user could open the browser console and type `localStorage.setItem('role', 'admin')` to pass the client-side role check. However, this **does not grant API access** — the JWT stored in `token` was signed for `role: 'student'`. All API calls would still be rejected by the `requireRole('admin')` middleware with HTTP 403. The client-side guard is only a UX convenience to prevent accidental navigation; the server-side JWT check is the authoritative security control.

---

**H22.** Why is there both `config/email.js` and `utils/mailer.js`? Which one is actually used?

> `config/email.js` is the **active transporter**: it exports a single shared `nodemailer` transporter configured from environment variables and is imported by all five `send*Email` utility functions.
>
> `utils/mailer.js` is a **duplicate/legacy file**: it creates its own standalone transporter and contains a `sendVerificationEmail` function that uses OTP-based verification (different from the token-based verification in the live system). It is not imported anywhere in the active application flow.
>
> This is a code maintenance issue — `mailer.js` should be deleted to avoid confusion. The discrepancy suggests it was an earlier prototype that was superseded by the `config/email.js` approach.

---

**H23.** How would you implement a "Save for later" feature for opportunities? What database and API changes would be needed?

> The system already implements this! `studentRoutes.js` shows:
> ```javascript
> router.post('/saved', c.toggleSaveOpportunity);
> router.get('/saved', c.getSavedOpportunities);
> ```
> And the frontend has `dashboard/student/saved/page.tsx`. The database would need a `saved_opportunities` junction table (or it may already be implemented in `studentController.js` beyond what was read). The API persists a `(student_id, opportunity_id)` relationship and the toggle endpoint adds or removes the row.

---

**H24.** What is the purpose of `test-cv-parse.js` in the backend root?

> `test-cv-parse.js` is a **standalone manual test script** — not part of the application flow. It was likely written to verify that `pdf-parse` correctly extracted text from a sample PDF before integrating it into the recommendation engine. Running `node test-cv-parse.js` directly would test the `extractCvText` utility against a real file. This is ad-hoc testing rather than a formal test suite (no Jest or Mocha). Its presence indicates testing was done manually during development rather than through automated tests.

---

**H25.** If you had to defend the choice of 10% weight for skills tags over a higher weight (say 30%), what would your argument be?

> The skills tag system has a fundamental limitation: it only captures **explicitly declared tags**. If a student lists 3 out of 10 required skills in their `student_tags`, they score 30% on skills. But their CV might describe deep experience with the other 7 skills in natural language — the text similarity component (at 50%) captures this broader context. Assigning 30% to skills tags and reducing text similarity would penalise students who express competence through narrative rather than keyword lists. The 50/10 split acknowledges that the structured tag system is a weak signal compared to the richer unstructured CV text signal.

---

## Common Mistakes to Avoid

> **Critical:** These are the most frequent reasons for viva marks being reduced. Review this section the evening before your defense.

---

### Mistake 1: Describing features you didn't implement

If an examiner asks about a feature (e.g., "How does WebSocket real-time notification work?"), do not invent an implementation. The system uses **polling every 60 seconds** — say that clearly, then explain why WebSockets would be better and that it's a future improvement. Honesty about limitations scores higher than fabrication.

---

### Mistake 2: Saying "we use JWT for security" without explaining how

Every student says "JWT". Examiners want to hear: what is in the payload (`{ id, role }`), who signs it (`JWT_SECRET`), where it's stored (`localStorage`), how it's transmitted (`Authorization: Bearer`), which middleware validates it (`verifyToken` in `authMiddleware.js`), what happens when it's invalid (401), and what its weakness is (no revocation, 7-day window, XSS vulnerability).

---

### Mistake 3: Not knowing the scoring weights

The recommendation engine is the core of the project. Know these by heart:
- **Text similarity: 50%**
- Skills: 10%, Education: 10%, Location: 10%, Experience: 10%, Interests: 10%

And know that the formula is `textScore * 0.5 + skillsScore * 0.1 + ...` not a simple average.

---

### Mistake 4: Confusing `student_profiles.id` with `users.id`

These are different! `users.id` is the authentication identity. `student_profiles.id` is the profile identity. The `match_scores` and `applications` tables use `student_id` referencing `student_profiles.id`. When a student logs in, `req.user.id = users.id`. Controllers must look up `student_profiles.id` from `users.id` before using it in scoring queries.

---

### Mistake 5: Not being able to explain the square-root transformation

This is the most technically interesting design decision in the text similarity algorithm. Practice explaining: raw cosine is low (0.01–0.15), `sqrt(0.10) = 0.316`, preserves ranking, stretches the useful range. If you can prove mathematically that ranking is preserved, do it.

---

### Mistake 6: Claiming the system is "fully secure"

No system is fully secure. The correct answer is to enumerate the security features you have (bcrypt, JWT, parameterised queries, RBAC, token TTL, email verification) AND acknowledge the known limitations (unauthenticated file access, localStorage JWT, no rate limiting, no HTTPS enforcement in the codebase).

---

### Mistake 7: Not knowing which library does what

| Library | What It Does |
|---------|-------------|
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT sign and verify |
| `multer` | File upload handling (multipart/form-data) |
| `pdf-parse` | PDF text extraction |
| `mammoth` | DOCX text extraction |
| `nodemailer` | SMTP email sending |
| `mysql2` | MySQL database driver (NOT an ORM) |
| `jsPDF` | PDF generation in browser |
| `xlsx (SheetJS)` | Excel generation in browser |
| `recharts` | Charts in React |

---

### Mistake 8: Saying "we used React" instead of "we used Next.js"

These are different. Next.js is built on React but adds: **App Router**, file-based routing, per-segment layouts, server/client component model, built-in font optimisation. Know why Next.js was chosen over plain React (App Router layouts for multi-role dashboards, font optimisation).

---

### Mistake 9: Saying the filter is "done by the API" when it's actually client-side

For opportunity browsing and application filtering, filtering happens **in the browser** using `useMemo`. Only admin user search (`/api/admin/users?search=&role=&status=`) is server-side. Be specific.

---

### Mistake 10: Not knowing what happens when the CV is a scanned PDF

**pdf-parse cannot extract text from scanned PDFs** (image-based). The function returns an empty string. `textSimilarityScore` returns 50 (neutral). The student is not penalised but also not rewarded. The fix (OCR) is a future improvement. Know this cold.

---

## Strategy for a Confident Viva Performance

### Before the Viva

**The night before:**
1. Re-read the three most important sections of this guide: Section 12 (Recommendation Engine), Section 7 (Authentication), and Section 6 (Database Design).
2. Open your codebase and trace through `scoreStudentAgainstOpportunity` function line by line. Say each step out loud.
3. Draw the database entity-relationship diagram from memory. Check it against the schema.
4. Write the scoring formula on paper without looking: `0.50×text + 0.10×skills + 0.10×edu + 0.10×loc + 0.10×exp + 0.10×int`.

**The morning of:**
1. Know the full names of every library in your `package.json`.
2. Know the exact file path of three things: the main entry point (`backend/index.js`), the scoring engine (`backend/controllers/matchController.js`), and the text similarity utility (`backend/utils/textSimilarity.js`).

---

### During the Viva

**When you know the answer:**
- State the answer directly, then explain the mechanism, then reference the file/function.
- Example: *"JWTs are verified in `authMiddleware.js` using `jwt.verify`. The decoded payload `{ id, role }` is attached to `req.user`, which all subsequent controllers use to scope their queries."*

**When you partially know the answer:**
- State what you know with certainty, then say what you believe to be true but are less certain about.
- Example: *"I know the score is computed in `matchController.js` using cosine similarity. I believe the exact threshold comparison happens in `applyToOpportunity` but I'd need to check the exact line."*

**When you don't know the answer:**
- Do not invent an answer. Say: *"I don't have that detail memorised, but I can reason through it: given [principle], I would expect [logical deduction]."*

**On "why" questions:**
- Always answer with a trade-off: every design decision has a benefit AND a cost. Show you understand both sides.
- Example: *"We chose client-side filtering with `useMemo` because the data set is small and this avoids additional API calls. The trade-off is that this would not scale if the opportunity list grew to thousands of items — at that point we'd add server-side pagination."*

---

### How to Handle Questions About Limitations

**Wrong approach:** Become defensive or make up mitigations that don't exist.

**Right approach:** Own every limitation and follow it immediately with a specific, implementable fix.

Template:
> *"Yes, [limitation] is a known issue in the current implementation. The fix would be to [specific technical solution]. I chose not to implement this in the current version because [honest reason: time constraints, complexity, out of scope for the project brief], but it is documented as a future improvement."*

---

### Scoring Yourself Before the Viva

Use this checklist. If you cannot confidently answer a question with a file/function reference, re-read the relevant section.

- [ ] I can explain the 6-component scoring formula and all weights from memory.
- [ ] I can trace a user registration from HTTP request to database row.
- [ ] I can explain what `verifyToken` and `requireRole` do and why they are separate.
- [ ] I can explain the difference between `users.id` and `student_profiles.id`.
- [ ] I can explain why `sqrt(cosine)` preserves ranking order mathematically.
- [ ] I can name all 10 database tables and their purpose.
- [ ] I can explain 3 security features and 3 security limitations.
- [ ] I can explain why no ORM was used.
- [ ] I can explain why report generation happens client-side.
- [ ] I can name the library for PDF upload, DOCX upload, PDF generation, and Excel generation.

---

> **Final Note:** You built this system. Every answer in this guide is grounded in code that you wrote. The examiner cannot know your own implementation better than you do. Your advantage is that you can always fall back to: *"Let me show you in the code."*

---

*Document generated from direct codebase analysis. All answers are based strictly on the implemented system in `backend/`, `frontend/`, and `database/` source files.*
