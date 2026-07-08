# Fursa — Student Opportunity Recommendation Platform
## Comprehensive Technical Documentation

**Document Type:** University Final Project Technical Documentation  
**Platform Name:** Fursa (Opportunity Match)  
**Architecture:** Decoupled REST API + Next.js Frontend  
**Database:** MySQL (raw SQL, no ORM)  
**Prepared for:** University Project Submission, Technical Viva/Defense, Final Presentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [System Objectives](#3-system-objectives)
4. [Overall System Architecture](#4-overall-system-architecture)
5. [High-Level Data Flow](#5-high-level-data-flow)
6. [Complete Technology Stack](#6-complete-technology-stack)
7. [Project Folder Structure](#7-project-folder-structure)
8. [Database Design](#8-database-design)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [User Registration and Login Flow](#10-user-registration-and-login-flow)
11. [Profile Management](#11-profile-management)
12. [CV/Resume Upload Process](#12-cvresume-upload-process)
13. [File Storage Mechanism](#13-file-storage-mechanism)
14. [PDF Parsing](#14-pdf-parsing)
15. [Recommendation Engine](#15-recommendation-engine)
16. [Opportunity Management](#16-opportunity-management)
17. [Application Workflow](#17-application-workflow)
18. [Notifications](#18-notifications)
19. [Search and Filtering](#19-search-and-filtering)
20. [Dashboard Analytics](#20-dashboard-analytics)
21. [Report Generation](#21-report-generation)
22. [API Architecture](#22-api-architecture)
23. [Backend Request Lifecycle](#23-backend-request-lifecycle)
24. [Frontend Component Flow](#24-frontend-component-flow)
25. [State Management](#25-state-management)
26. [Validation](#26-validation)
27. [Error Handling](#27-error-handling)
28. [Security Features](#28-security-features)
29. [Performance Optimizations](#29-performance-optimizations)
30. [Scalability Considerations](#30-scalability-considerations)
31. [Deployment Architecture](#31-deployment-architecture)
32. [End-to-End System Workflow](#32-end-to-end-system-workflow)
33. [Design Decisions](#33-design-decisions)
34. [Limitations of the Current Implementation](#34-limitations-of-the-current-implementation)
35. [Future Improvements](#35-future-improvements)

---

## 1. Executive Summary

**Fursa** (Swahili for "Opportunity") is a full-stack web application built to bridge the gap between university students seeking employment, internships, and scholarships, and the organisations that offer them. The platform is a three-actor system: **Students**, **Organisations** (companies, universities, NGOs, and government bodies), and **Administrators**.

At the core of Fursa is a **weighted multi-criteria recommendation engine** that scores every student profile against every active opportunity in real time. The score is computed from six dimensions — CV text similarity (50%), skills tag overlap (10%), education level and grade (10%), location match (10%), experience years (10%), and interest tag overlap (10%) — and the result is persisted in the database for audit and debugging purposes.

The backend is a **Node.js/Express REST API** that connects to a **MySQL** relational database using raw SQL through the `mysql2` driver. The frontend is a **Next.js 16** application written in TypeScript with **Tailwind CSS v4** for styling. Authentication uses **JWT bearer tokens**, and transactional emails (verification, password reset, match alerts, application status updates, organisation messages) are dispatched via **Nodemailer** over SMTP. File upload (CVs and avatars) is handled by **Multer** with disk storage. PDF text extraction uses **pdf-parse** and DOCX extraction uses **mammoth**. Reports are generated client-side using **jsPDF + jspdf-autotable** for PDFs and **SheetJS (xlsx)** for Excel.

---

## 2. Problem Statement

University students in developing markets — particularly East Africa — face a fragmented opportunity discovery landscape:

- Opportunity listings are scattered across disconnected portals, social media, and word-of-mouth.
- Students have no systematic way to assess how well their profile matches an opportunity before applying.
- Organisations have no platform to evaluate and compare applicants using objective criteria.
- Application tracking is largely manual, resulting in poor communication between applicants and organisations.
- There is no automated mechanism to notify students when a new, high-matching opportunity is posted.

Fursa addresses all five problems within a single integrated platform.

---

## 3. System Objectives

| # | Objective | Mechanism in Codebase |
|---|-----------|----------------------|
| 1 | Centralise opportunity discovery | Active opportunities browsable by all students via `GET /api/student/opportunities` |
| 2 | Score students against opportunities objectively | `scoreStudentAgainstOpportunity()` in `matchController.js` |
| 3 | Notify students of high-matching new opportunities | `computeAndSaveRecommendations()` triggered on `GET /api/student/recommendations` |
| 4 | Allow organisations to manage listings and applicants | Full CRUD in `organizationController.js` and `organizationRoutes.js` |
| 5 | Enable organisations to compare applicants side-by-side | `compare` page at `/dashboard/organization/opportunities/[id]/compare` |
| 6 | Give administrators system-wide oversight | `adminController.js` with user management, org verification, and analytics |
| 7 | Generate downloadable reports | jsPDF + SheetJS in `applications/page.tsx` and org `reports/page.tsx` |
| 8 | Parse CV content for smarter matching | `extractCvText.js` using `pdf-parse` and `mammoth` |

---

## 4. Overall System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                    │
│                                                     │
│  Next.js 16 (App Router, TypeScript, Tailwind v4)  │
│  ┌──────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │  Student  │ │Organization│ │     Admin        │  │
│  │ Dashboard │ │  Dashboard │ │    Dashboard     │  │
│  └──────────┘ └────────────┘ └──────────────────┘  │
│         HTTP Requests with JWT Bearer Token         │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS / REST
┌────────────────────────▼────────────────────────────┐
│              Node.js / Express.js API               │
│  ┌──────────────────────────────────────────────┐   │
│  │  Routes: /api/auth  /api/student             │   │
│  │          /api/organization  /api/admin        │   │
│  │          /api/tags  /uploads (static)         │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Middleware: verifyToken · requireRole        │   │
│  │  Upload:     Multer (disk storage)            │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Controllers:                                 │   │
│  │  authController · studentController           │   │
│  │  organizationController · adminController     │   │
│  │  matchController · tagController              │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Utils:                                       │   │
│  │  extractCvText · textSimilarity               │   │
│  │  sendVerificationEmail · sendMatchEmail        │   │
│  │  sendApplicationStatusEmail · sendOrgMessage   │   │
│  │  sendPasswordResetEmail · mailer               │   │
│  └──────────────────────────────────────────────┘   │
└──────────────┬─────────────────┬───────────────────┘
               │ mysql2/promise  │ nodemailer
┌──────────────▼──────┐  ┌───────▼──────────────────┐
│   MySQL Database    │  │      SMTP Mail Server     │
│   (is_project)      │  │  (Nodemailer / STARTTLS)  │
│                     │  └──────────────────────────┘
│  9 core tables:     │
│  users              │
│  student_profiles   │
│  organizations      │
│  opportunities      │
│  tags / student_tags│
│  opportunity_tags   │
│  applications       │
│  match_scores       │
│  notifications      │
│  reports            │
└─────────────────────┘
          │
┌─────────▼──────────┐
│  uploads/ (disk)   │
│  CVs, avatars      │
└────────────────────┘
```

The architecture is a classic **three-tier model**:
- **Presentation Tier**: Next.js App Router frontend served independently.
- **Application Tier**: Express.js REST API, stateless, communicates via JWT.
- **Data Tier**: MySQL relational database + local filesystem for uploaded files.

---

## 5. High-Level Data Flow

### Student Registration → Recommendation → Application

```
Student fills register form
        │
        ▼
POST /api/auth/register
  → bcrypt hashes password (salt rounds: 10)
  → DB transaction: INSERT users + INSERT student_profiles
  → crypto.randomBytes(32) generates verification token (30 min TTL)
  → sendVerificationEmail() dispatches link to SMTP
        │
Student clicks email link
        │
        ▼
GET /api/auth/verify-email?token=<hex>
  → Token looked up, expiry checked
  → UPDATE users SET email_verified = 1, token = NULL
        │
Student logs in
        │
        ▼
POST /api/auth/login
  → bcrypt.compare() validates password
  → jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' })
  → Token stored in localStorage by frontend
        │
Student visits /dashboard/student/recommendations
        │
        ▼
GET /api/student/recommendations (JWT verified, role=student)
  → computeAndSaveRecommendations(userId)
  → For each active opportunity:
      scoreStudentAgainstOpportunity(studentId, oppId)
        → Loads student tags (skills/interests)
        → Loads opportunity tags (skills/interests)
        → extractCvText(cv_url) → pdf-parse or mammoth
        → textSimilarityScore(cvText, oppDescription) → cosine similarity
        → tagOverlapScore(skills) × 0.10
        → educationScore(level, grade) × 0.10
        → locationScore(studentLoc, oppLoc) × 0.10
        → experienceScore(years) × 0.10
        → tagOverlapScore(interests) × 0.10
        → textScore × 0.50
        → UPSERT into match_scores
      If totalScore ≥ student.notification_threshold AND not previously notified:
        → INSERT notification
        → sendMatchEmail()
  → Results sorted descending by totalScore
  → Return JSON array
        │
Student applies to an opportunity
        │
        ▼
POST /api/student/applications { opportunityId, coverNote }
  → Checks cv_url exists (CV required)
  → scoreStudentAgainstOpportunity() run again (score refreshed)
  → If opp has minimum_match_score AND totalScore < threshold:
      → INSERT application with status='rejected'
      → INSERT notification (auto-reject message)
      → sendApplicationStatusEmail()
  → Else INSERT application status='submitted'
```

---

## 6. Complete Technology Stack

### Backend

| Technology | Version | Role | Justification |
|-----------|---------|------|---------------|
| **Node.js** | LTS | Runtime | Non-blocking I/O ideal for many concurrent API calls; single language across the team |
| **Express.js** | 5.2.1 | HTTP framework | Minimal, unopinionated; gives full control over routing and middleware without overhead of full MVC frameworks |
| **mysql2** | 3.22.5 | Database driver | `mysql2/promise` enables async/await syntax natively; connection pooling via `createPool()` with `connectionLimit: 10`; no ORM chosen deliberately to allow raw SQL for complex joins (e.g., applicant scoring queries) |
| **bcrypt** | 6.0.0 | Password hashing | Industry standard adaptive hashing with configurable cost factor (10 rounds used); resistant to rainbow tables |
| **jsonwebtoken** | 9.0.3 | Auth tokens | Stateless JWT (7-day expiry); `{ id, role }` payload allows single middleware check without additional DB lookup per request |
| **multer** | 2.2.0 | File upload | Disk storage strategy with configurable filename generation (`cv_<userId>_<timestamp>.<ext>`); separate `avatarUpload` instance with MIME-type filtering |
| **pdf-parse** | 1.1.1 | PDF text extraction | Pure JavaScript; reads PDF buffer, returns `.text` property with all extracted content; no native dependencies required |
| **mammoth** | 1.12.0 | DOCX text extraction | Converts `.docx` to raw text via `extractRawText()`; handles Microsoft Word format without COM automation |
| **nodemailer** | 9.0.3 | Transactional email | SMTP abstraction layer; configured with STARTTLS on port 587; single shared `transporter` instance in `config/email.js` |
| **cors** | 2.8.6 | Cross-Origin headers | Allows the Next.js frontend (different port/domain) to call the API |
| **dotenv** | 17.4.2 | Environment config | Keeps credentials (DB password, JWT secret, SMTP credentials) out of source control |
| **crypto** (Node built-in) | — | Token generation | `crypto.randomBytes(32).toString('hex')` generates cryptographically secure 64-char verification and reset tokens |

### Frontend

| Technology | Version | Role | Justification |
|-----------|---------|------|---------------|
| **Next.js** | 16.2.9 | React framework | App Router enables per-segment layouts (student/org/admin dashboards with their own nav); server components + `'use client'` hybrid |
| **React** | 19.2.4 | UI library | Component model, hooks (`useState`, `useEffect`, `useMemo`) for reactive data display |
| **TypeScript** | 5 | Type safety | Catches API contract mismatches at compile time; `// @ts-nocheck` pragmas used in pages that work with dynamic API shapes |
| **Tailwind CSS** | 4 | Utility CSS | CSS variables used for design tokens (`--color-ink`, `--color-muted`, `--color-line`); inline styles also used for dynamic values |
| **Recharts** | 3.9.1 | Charts | `BarChart`, `LineChart`, `PieChart` used in admin and organisation dashboards; `ResponsiveContainer` for fluid layout |
| **jsPDF** | 4.2.1 | PDF generation (client) | Constructs PDF in the browser; no server round-trip needed for report downloads |
| **jspdf-autotable** | 5.0.8 | PDF tables | Adds `autoTable` plugin to jsPDF for formatted tabular data in reports |
| **SheetJS (xlsx)** | 0.18.5 | Excel generation | `XLSX.utils.json_to_sheet()` + `XLSX.writeFile()` used to export application data as `.xlsx` |
| **Space Grotesk / IBM Plex Sans / IBM Plex Mono** | Google Fonts | Typography | Three-font system: display, body, and data/monospace; loaded via `next/font/google` for automatic subset optimisation |

### Database

| Technology | Role | Justification |
|-----------|------|---------------|
| **MySQL** | Relational store | Strong ACID compliance for financial-grade transaction integrity (registration, application); `utf8mb4_unicode_ci` collation for emoji/multi-language support |
| **InnoDB engine** | All tables | Foreign key enforcement, row-level locking, crash recovery |
| **Raw SQL** | Query layer | Complex multi-table scoring queries (6-table JOIN in `getApplicants`) would be verbose and opaque through an ORM; raw SQL is readable and debuggable |

---

## 7. Project Folder Structure

```
is-project/
├── package.json                  # Root (workspace manifest)
├── README.md
├── database/
│   └── schema.sql                # Full DDL for all 10 tables
├── backend/
│   ├── index.js                  # Express app bootstrap, route mounting, static /uploads
│   ├── db.js                     # mysql2 connection pool (singleton)
│   ├── package.json              # Backend dependencies
│   ├── test-cv-parse.js          # Manual test script for pdf-parse
│   ├── config/
│   │   └── email.js              # Shared nodemailer transporter (STARTTLS)
│   ├── controllers/
│   │   ├── authController.js     # register, login, verifyEmail, resendVerification, forgotPassword, resetPassword
│   │   ├── studentController.js  # profile CRUD, CV upload, avatar upload, browse/apply opportunities, notifications, saved
│   │   ├── organizationController.js # org profile, opportunity CRUD, applicants, application status, reports, messaging
│   │   ├── adminController.js    # stats, reports, user management, org verification, opportunity administration
│   │   ├── matchController.js    # scoreStudentAgainstOpportunity(), computeAndSaveRecommendations(), getRecommendations
│   │   └── tagController.js      # getAllTags, findOrCreateTag
│   ├── middleware/
│   │   ├── authMiddleware.js     # verifyToken (JWT), requireRole (RBAC)
│   │   └── upload.js             # Multer disk storage configs for CV (5 MB) and avatar (2 MB, images only)
│   ├── routes/
│   │   ├── authRoutes.js         # Public auth endpoints
│   │   ├── studentRoutes.js      # Student-only endpoints (verifyToken + requireRole('student'))
│   │   ├── organizationRoutes.js # Organisation-only endpoints
│   │   ├── adminRoutes.js        # Admin-only endpoints
│   │   └── tagRoutes.js          # Public tag listing + create
│   ├── utils/
│   │   ├── extractCvText.js      # PDF/DOCX text extraction dispatcher
│   │   ├── textSimilarity.js     # Tokeniser + TF cosine similarity
│   │   ├── mailer.js             # Legacy standalone transporter (unused in main flow)
│   │   ├── sendVerificationEmail.js
│   │   ├── sendPasswordResetEmail.js
│   │   ├── sendMatchEmail.js
│   │   ├── sendApplicationStatusEmail.js
│   │   └── sendOrgMessageEmail.js
│   └── uploads/                  # Uploaded CVs and avatars (served as static files)
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── eslint.config.mjs
    ├── postcss.config.mjs
    ├── AGENTS.md / CLAUDE.md      # AI coding agent instructions
    ├── app/
    │   ├── layout.tsx             # Root layout: font variables injected
    │   ├── globals.css            # CSS custom properties (design tokens)
    │   ├── page.tsx               # Landing/redirect page
    │   ├── login/page.tsx         # Login form
    │   ├── register/page.tsx      # Registration form (student or org)
    │   ├── verify-email/page.tsx  # Token consumption page
    │   ├── check-email/page.tsx   # Post-register instruction page
    │   ├── forgot-password/page.tsx
    │   ├── reset-password/page.tsx
    │   └── dashboard/
    │       ├── student/           # Student portal
    │       │   ├── layout.tsx     # Sidebar nav + auth guard + notification badge
    │       │   ├── page.tsx       # Student home
    │       │   ├── profile/       # Profile page + sub-components
    │       │   ├── opportunities/ # Browse + detail pages
    │       │   ├── recommendations/page.tsx
    │       │   ├── applications/page.tsx
    │       │   ├── saved/page.tsx
    │       │   └── inbox/page.tsx
    │       ├── organization/
    │       │   ├── layout.tsx
    │       │   ├── page.tsx       # Org home
    │       │   ├── create/page.tsx # New opportunity form
    │       │   ├── opportunities/ # List + applicants + compare
    │       │   ├── profile/       # Org profile edit
    │       │   └── reports/page.tsx
    │       └── admin/
    │           ├── layout.tsx
    │           ├── page.tsx       # Admin analytics dashboard
    │           ├── users/page.tsx
    │           ├── organizations/page.tsx
    │           └── opportunities/page.tsx
    ├── components/
    │   ├── AuthLayout.tsx         # Shared wrapper for auth pages
    │   ├── ReportModal.tsx        # PDF/Excel format picker modal
    │   └── TagPicker.jsx          # Shared tag selection component
    └── lib/
        └── api.js                 # apiFetch() — attaches JWT from localStorage
```

---

## 8. Database Design

All tables use the **InnoDB engine** with `utf8mb4_unicode_ci` collation (supporting full Unicode including emoji). The schema is defined in `database/schema.sql` and applied directly — there is no migration tool; the file is idempotent due to `CREATE TABLE IF NOT EXISTS` patterns.

### 8.1 `users` — Core Authentication Table

```sql
CREATE TABLE users (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  email               VARCHAR(191) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  role                ENUM('student', 'admin', 'organization') NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token  VARCHAR(255) NULL,
  token_expires_at    TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

**Purpose:** One row per login-capable account. This is the single source of truth for identity and role. The `role` ENUM field is the discriminator used by `requireRole()` middleware to enforce RBAC.

**Key Design Decisions:**
- `email VARCHAR(191)` — 191 is the maximum byte-safe length for a `UNIQUE` index on `utf8mb4` columns in MySQL 5.x (3 bytes/char × 191 = 573 < 767 byte index limit). MySQL 8 lifts this restriction but the constraint is maintained for compatibility.
- `password_hash` stores the bcrypt output which is always 60 characters, but `VARCHAR(255)` future-proofs for longer hash algorithms.
- `is_active` enables soft-disable (admins can deactivate accounts without deleting data).
- `verification_token` and `token_expires_at` are set to `NULL` after successful verification (one-time use, nullified on consumption).
- The `reset_token` and `reset_token_expires_at` columns (added by `forgotPassword` logic) are not in the original schema DDL but are used by `authController.js` — they extend the `users` table at runtime.

### 8.2 `student_profiles` — Student Detail Extension

```sql
CREATE TABLE student_profiles (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL UNIQUE,
  full_name        VARCHAR(150) NOT NULL,
  institution      VARCHAR(150),
  course_of_study  VARCHAR(150),
  education_level  ENUM('certificate','diploma','undergraduate','graduate') NOT NULL,
  experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  location         VARCHAR(150),
  bio              TEXT,
  cv_url           VARCHAR(255),
  cv_filename      VARCHAR(255),
  profile_picture_url VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**Purpose:** Extends `users` with student-specific data. The `1-to-1` relationship is enforced by `UNIQUE` on `user_id`. Cascade delete means removing a `users` row removes the profile automatically.

**Recommendation-relevant columns:**
- `education_level` — mapped to ordinal rank `{ certificate:1, diploma:2, undergraduate:3, graduate:4 }` in `matchController.js`.
- `academic_grade` (`first_class`, `second_upper`, `second_lower`, `pass`) — mapped to rank `{ pass:1, second_lower:2, second_upper:3, first_class:4 }`.
- `experience_years DECIMAL(4,1)` — supports fractional years (e.g., 1.5).
- `location VARCHAR(150)` — plain-text field compared against `opportunities.location` via string matching.
- `cv_url` — relative path like `/uploads/cv_5_1720000000.pdf`; used by `extractCvText.js` to locate the file on disk.
- `notification_threshold` (integer, 0–100) — minimum total score that triggers a match notification; defaults to 70.

### 8.3 `tags` — Shared Skills and Interests Vocabulary

```sql
CREATE TABLE tags (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('skill', 'interest') NOT NULL,
  UNIQUE KEY uniq_tag (name, type)
)
```

**Purpose:** Master vocabulary for all skills and interests. The composite unique key prevents duplicate `(name, type)` pairs. The `type` discriminator means "Python" as a `skill` and "Python" as an `interest` are distinct records, feeding into different score weights.

**Design Decision:** A single `tags` table (rather than separate `skills` and `interests` tables) was chosen to simplify tag creation, search, and the `TagPicker` component while still allowing differentiated scoring.

### 8.4 `student_tags` — Student ↔ Tag Junction

```sql
CREATE TABLE student_tags (
  student_id INT NOT NULL,
  tag_id     INT NOT NULL,
  PRIMARY KEY (student_id, tag_id),
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)     REFERENCES tags(id) ON DELETE CASCADE
)
```

**Purpose:** Many-to-many relationship between students and tags. The composite primary key prevents duplicate assignments. Both foreign keys cascade on delete to maintain referential integrity.

### 8.5 `organizations` — Organisation Profile

```sql
CREATE TABLE organizations (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL UNIQUE,
  name                VARCHAR(150) NOT NULL,
  type                ENUM('company','university','ngo','government') NOT NULL,
  description         TEXT,
  website             VARCHAR(255),
  logo_url            VARCHAR(255),
  location            VARCHAR(150),
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  verified_by         INT NULL,
  verified_at         TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
)
```

**Purpose:** Stores public profile and verification state. `verification_status` is the gatekeeper — `organizationController.createOpportunity()` rejects organisations that are not `'verified'`. `verified_by` references the admin `user_id` who approved/rejected; `ON DELETE SET NULL` prevents orphaned records if that admin is later deleted.

### 8.6 `opportunities` — Job/Internship/Scholarship Postings

```sql
CREATE TABLE opportunities (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  organization_id   INT NOT NULL,
  title             VARCHAR(200) NOT NULL,
  category          ENUM('job','internship','scholarship') NOT NULL,
  description       TEXT,
  min_education     ENUM('certificate','diploma','undergraduate','graduate'),
  min_experience    DECIMAL(4,1) NOT NULL DEFAULT 0,
  location          VARCHAR(150),
  deadline          DATE,
  status            ENUM('active','closed','draft') NOT NULL DEFAULT 'draft',
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
)
```

**Purpose:** Central entity connecting organisations to applicants. `minimum_match_score` (integer) is added by `organizationController.js` as an optional threshold for auto-rejection.

**Design Decision:** `status DEFAULT 'draft'` means new opportunities are not visible to students until explicitly set to `'active'`. The codebase's `createOpportunity` actually inserts directly as `'active'`, suggesting the draft concept is preserved for future UI support.

### 8.7 `opportunity_tags` — Opportunity ↔ Tag Junction

Mirrors `student_tags`: many-to-many between opportunities and required tags. Required tag IDs are compared with student tag IDs in `tagOverlapScore()`.

### 8.8 `applications` — Student Applications

```sql
CREATE TABLE applications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL,
  opportunity_id INT NOT NULL,
  status         ENUM('submitted','under_review','accepted','rejected') NOT NULL DEFAULT 'submitted',
  cover_note     TEXT NULL,
  applied_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_student_opportunity (student_id, opportunity_id),
  FOREIGN KEY ...
)
```

**Purpose:** Records every application attempt. The composite unique key `(student_id, opportunity_id)` prevents duplicate applications at the database level — the application layer also catches `ER_DUP_ENTRY` and returns HTTP 409. `status_updated_at` is set by `organizationController.updateApplicationStatus()`.

### 8.9 `match_scores` — Scoring Audit Table

```sql
CREATE TABLE match_scores (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  student_id       INT NOT NULL,
  opportunity_id   INT NOT NULL,
  skills_score     DECIMAL(5,2) NOT NULL,   -- 10%
  education_score  DECIMAL(5,2) NOT NULL,   -- 10%
  location_score   DECIMAL(5,2) NOT NULL,   -- 10%
  experience_score DECIMAL(5,2) NOT NULL,   -- 10%
  interest_score   DECIMAL(5,2) NOT NULL,   -- 10%
  text_similarity_score DECIMAL(5,2),       -- 50%
  total_score      DECIMAL(5,2) NOT NULL,
  generated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_match (student_id, opportunity_id)
)
```

**Purpose:** Persists the full scoring breakdown for every student–opportunity pair. The `UPSERT` (`INSERT ... ON DUPLICATE KEY UPDATE`) in `scoreStudentAgainstOpportunity()` means scores are refreshed each time the function is called, keeping data current. The breakdown columns enable the organisation's **compare applicants** view to display individual metric bars per candidate.

### 8.10 `notifications` — In-App Notifications

```sql
CREATE TABLE notifications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL,
  opportunity_id INT NULL,
  message        VARCHAR(255) NOT NULL,
  is_read        BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type           VARCHAR(50),               -- 'match', 'application', 'admin', 'org_message'
  sent_by_org_id INT NULL,                  -- set for org_message type
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL
)
```

**Purpose:** Feeds the student inbox. `type` distinguishes notification origin. `is_read` is toggled via `PUT /api/student/notifications/:id/read`. `sent_by_org_id` links to the organisation that sent a direct message. `opportunity_id ON DELETE SET NULL` preserves notification history even if the opportunity is deleted.

### 8.11 `reports` — Admin Report Log

```sql
CREATE TABLE reports (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT NOT NULL,
  report_type   VARCHAR(100) NOT NULL,
  generated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

**Purpose:** Audit log of admin-generated reports. Currently a stub — report data is served from live SQL aggregation queries in `adminController.getReports()`, not from this table.

### Entity Relationship Summary

```
users ──1:1──► student_profiles ──M:N──► tags
      └──1:1──► organizations   ──1:N──► opportunities ──M:N──► tags
                                          │
                              students ──M:N──► applications
                              students ──M:N──► match_scores
                              students ──1:N──► notifications
```

---

## 9. Authentication & Authorization

### JWT-Based Stateless Authentication

Authentication in Fursa is **stateless**: no server-side sessions. On successful login, the server signs a JWT with `jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })`. The token is stored in the browser's `localStorage` by the frontend (`login/page.tsx`).

Every subsequent API request attaches the token as `Authorization: Bearer <token>`. The `verifyToken` middleware in `backend/middleware/authMiddleware.js` intercepts all protected routes:

```javascript
// authMiddleware.js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // { id, role }
next();
```

If the token is missing, malformed, or expired, `401 Unauthorized` is returned immediately.

### Role-Based Access Control (RBAC)

After token verification, the `requireRole(...allowedRoles)` middleware factory checks `req.user.role` against the allowed roles for that route group:

```javascript
// studentRoutes.js
router.use(verifyToken, requireRole('student'));

// organizationRoutes.js
router.use(verifyToken, requireRole('organization'));

// adminRoutes.js
router.use(verifyToken, requireRole('admin'));
```

This means any request to `/api/student/*` from an organisation or admin JWT will receive `403 Forbidden`.

### Frontend Auth Guard

Each dashboard layout (`student/layout.tsx`, `organization/layout.tsx`, `admin/layout.tsx`) runs an `useEffect` on mount that reads `localStorage.getItem('role')`. If the role does not match the expected value, `router.push('/login')` is called immediately before any dashboard content renders.

---

## 10. User Registration and Login Flow

### Registration (Student)

1. User submits `{ email, password, role: 'student', fullName }` to `POST /api/auth/register`.
2. Role validation rejects anything other than `'student'` or `'organization'`.
3. Email uniqueness checked with `SELECT id FROM users WHERE email = ?`.
4. **Database transaction begins** (`connection.beginTransaction()`).
5. `bcrypt.hash(password, 10)` produces the stored hash.
6. `crypto.randomBytes(32).toString('hex')` generates a 64-character URL-safe verification token.
7. Token expiry set 30 minutes in the future.
8. `INSERT INTO users` stores email, hash, role, `email_verified=0`, token.
9. `INSERT INTO student_profiles` creates the minimal profile row with `education_level='undergraduate'` as default.
10. **Transaction commits**.
11. `sendVerificationEmail()` dispatches a link to `${FRONTEND_URL}/verify-email?token=<hex>`.
12. HTTP 201 returned with `{ userId, role, email, message }`.

### Registration (Organisation)

Same flow except step 9 creates an `organizations` row with `name`, `type`, and `verification_status='pending'`. The organisation cannot post opportunities until an admin changes the status to `'verified'`.

### Email Verification

`GET /api/auth/verify-email?token=<hex>`:
1. Token looked up in `users`.
2. If not found → 400 "Invalid or already-used verification link".
3. If `token_expires_at < NOW()` → 400 "Verification link expired".
4. `UPDATE users SET email_verified = 1, verification_token = NULL, token_expires_at = NULL`.
5. Response includes `{ role }` so the frontend can redirect appropriately.

### Login

`POST /api/auth/login { email, password }`:
1. `SELECT * FROM users WHERE email = ?`.
2. `bcrypt.compare(password, user.password_hash)`.
3. `is_active` check (deactivated accounts get 403).
4. `email_verified` check (unverified accounts get 403 with specific message).
5. JWT signed and returned with `{ token, role, userId }`.
6. Frontend stores all three in `localStorage` and routes to `/dashboard/<role>`.

### Password Reset

`POST /api/auth/forgot-password { email }`:
- A **timing-safe** generic response is always returned regardless of whether the email exists (prevents user enumeration).
- If email found: `crypto.randomBytes(32)` reset token, 30-minute TTL, stored in `users.reset_token`.
- `sendPasswordResetEmail()` dispatches link to `${FRONTEND_URL}/reset-password?token=<hex>`.

`POST /api/auth/reset-password { token, password }`:
- Token validated against expiry.
- `bcrypt.hash(newPassword, 10)` updates `password_hash`.
- `reset_token` and `reset_token_expires_at` cleared.

---

## 11. Profile Management

### Student Profile

**File:** `backend/controllers/studentController.js`  
**Route:** `GET /api/student/profile`, `PUT /api/student/profile`

`getProfile()` joins `student_profiles` with `users` to include `email`, then fetches all associated tags via `student_tags ⟶ tags`. The response shape is `{ ...profileRow, tags: [{ id, name, type }] }`.

`updateProfile()` uses a **merge strategy**: it first reads the current profile, then merges submitted fields with existing values (using `req.body.field !== undefined ? submitted : current` pattern). This means clients can send partial updates without nullifying omitted fields — a deliberate design choice to support component-by-component profile editing on the frontend.

The tag update is atomic within the same transaction: all `student_tags` for the student are deleted, then the new `tagIds` array is re-inserted one by one. This ensures the tag set is always consistent.

`notification_threshold` is clamped to 0–100 before storage: `Math.min(100, Math.max(0, Number(value) || 70))`.

### Organisation Profile

**File:** `backend/controllers/organizationController.js`  
**Route:** `GET /api/organization/profile`, `PUT /api/organization/profile`

Simpler than student profile: updates `name`, `type`, `description`, `website`, `location` in the `organizations` table. No tag system for organisations.

### Profile Sub-Components (Frontend)

The student profile page (`frontend/app/dashboard/student/profile/page.tsx`) is broken into five card components:

| Component | File | Managed Data |
|-----------|------|-------------|
| `HeroCard` | `components/HeroCard.tsx` | Name, course, education level, location, avatar |
| `AboutCard` | `components/AboutCard.tsx` | Bio text |
| `EducationCard` | `components/EducationCard.tsx` | Institution, course, level, academic grade |
| `SkillsCard` | `components/SkillsCard.tsx` | Experience years, skills tags, interest tags |
| `CVCard` | `components/CVCard.tsx` | CV upload, filename display |

Each card has its own `onSaved` callback that receives the updated fields and calls `patch(updates)` to update the parent `profile` state object.

---

## 12. CV/Resume Upload Process

**Route:** `POST /api/student/profile/cv` (multipart/form-data, field name `cv`)  
**Files involved:** `middleware/upload.js`, `studentController.uploadCv()`

### Step-by-Step

1. `upload.single('cv')` Multer middleware intercepts the multipart request.
2. Multer's `diskStorage` configuration assigns:
   - **Destination**: `backend/uploads/` (absolute path resolved with `path.join(__dirname, '../uploads')`)
   - **Filename**: `cv_<userId>_<timestamp>.<originalExtension>` (e.g., `cv_42_1720000000123.pdf`)
3. File size is limited to **5 MB** (`limits: { fileSize: 5 * 1024 * 1024 }`).
4. If no file is attached, `req.file` is `undefined` → 400 "No file uploaded".
5. `cvUrl = '/uploads/' + req.file.filename` (relative URL path).
6. `UPDATE student_profiles SET cv_url = ?, cv_filename = ? WHERE user_id = ?` persists both the path and the original filename.
7. Response: `{ message: 'CV uploaded', cvUrl, cvFilename }`.

### Avatar Upload

Handled by the separate `avatarUpload` Multer instance:
- File size limit: **2 MB**.
- MIME filter: only `image/*` accepted (rejects non-image files before they reach the controller).
- Filename pattern: `avatar_<userId>_<timestamp>.<ext>`.
- Stored path: `profile_picture_url` in `student_profiles`.

---

## 13. File Storage Mechanism

Uploaded files are stored on the **local filesystem** in `backend/uploads/`. The Express server exposes this directory as a static file path:

```javascript
// index.js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

This means a file stored at `backend/uploads/cv_5_1720000000.pdf` is publicly accessible at `http://api-host/uploads/cv_5_1720000000.pdf`. The `cv_url` stored in the database is the relative URL `/uploads/<filename>`, which the frontend constructs into an absolute URL using `process.env.NEXT_PUBLIC_API_URL`.

**Access Pattern for CV Download:** The organisation applicants view constructs CV download links as:
```
${API_URL}${applicant.cv_url}
```
Clicking this link serves the raw file from Express static middleware.

**Security Note:** File access is currently **unauthenticated** — anyone with the URL can download a CV. This is an accepted trade-off for simplicity in the current version (see Limitations, Section 34).

---

## 14. PDF Parsing

**File:** `backend/utils/extractCvText.js`

### Process

```javascript
async function extractCvText(cvUrl) {
  // 1. Resolve URL to filesystem path
  const filename = cvUrl.replace(/^\/uploads\//, '');
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  // 2. Guard: return '' if file not found
  if (!fs.existsSync(filePath)) return '';

  // 3. Dispatch by extension
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  // 4. Unsupported format (.doc, .png, etc.) — return ''
  return '';
}
```

### Libraries

**pdf-parse (v1.1.1)**:
- Reads the raw binary buffer of a PDF file.
- Internally uses Mozilla's `pdf.js` rendering engine to extract all text nodes from each page.
- Returns a result object with a `.text` property containing all extracted text as a single string, with newlines separating sections.
- No native C extensions; pure JavaScript.
- Handles standard text-based PDFs. Image-based/scanned PDFs (where text is embedded in images) will return empty or minimal text — this is a known limitation.

**mammoth (v1.12.0)**:
- Accepts `.docx` (Office Open XML format) files.
- `extractRawText({ path })` strips all XML markup and returns plain text.
- Handles paragraph breaks, headings, lists, and tables as plain text.
- Does not support the older binary `.doc` format (pre-Word 2007).

### What Happens with the Extracted Text

The extracted text string is passed to `textSimilarityScore(studentText, opportunityDescription)` in `textSimilarity.js`. If the file is not found or the format is unsupported, the function returns `''` (empty string), and `textSimilarityScore` returns `50` as a neutral score (see Section 15).

---

## 15. Recommendation Engine

**File:** `backend/controllers/matchController.js`  
**Utility:** `backend/utils/textSimilarity.js`

### Overview

The recommendation engine is a **weighted multi-criteria scoring model** inspired by Information Retrieval (IR) techniques. It scores every active opportunity against a student's profile across six dimensions and produces a single `totalScore` between 0 and 100.

### Score Components and Weights

| Component | Weight | Function | Data Sources |
|-----------|--------|----------|-------------|
| Text similarity (CV vs description) | **50%** | `textSimilarityScore()` | `student_profiles.cv_url` → `extractCvText()`, `opportunities.description` |
| Skills tag overlap | **10%** | `tagOverlapScore()` | `student_tags` (type='skill'), `opportunity_tags` (type='skill') |
| Education level + grade | **10%** | `educationScore()` | `student_profiles.education_level`, `.academic_grade`, `opportunities.min_education`, `.min_academic_grade` |
| Location match | **10%** | `locationScore()` | `student_profiles.location`, `opportunities.location` |
| Experience years | **10%** | `experienceScore()` | `student_profiles.experience_years`, `opportunities.min_experience` |
| Interest tag overlap | **10%** | `tagOverlapScore()` | `student_tags` (type='interest'), `opportunity_tags` (type='interest') |

**Formula:**
$$\text{totalScore} = 0.50 \cdot T_{text} + 0.10 \cdot T_{skills} + 0.10 \cdot T_{edu} + 0.10 \cdot T_{loc} + 0.10 \cdot T_{exp} + 0.10 \cdot T_{int}$$

### Text Similarity Algorithm (`textSimilarity.js`)

The core IR component uses **TF cosine similarity**:

1. **Tokenisation**: Both texts (CV content and opportunity description) are lowercased, stripped of non-alphanumeric characters, split on whitespace, filtered to words > 2 characters, and filtered against a stopword list (29 common English stopwords).

2. **Term Frequency**: A frequency map `{ term: count }` is built for each tokenised document.

3. **Cosine Similarity**:
$$\text{cosine}(A, B) = \frac{\sum_{t} A_t \cdot B_t}{\sqrt{\sum_t A_t^2} \cdot \sqrt{\sum_t B_t^2}}$$

4. **Score Stretching**: Raw cosine similarity produces very low values for most document pairs (typically 0.01–0.2). To stretch the usable range, a square-root transformation is applied:
$$T_{text} = \sqrt{\text{cosine}(A, B)} \times 100$$
   This preserves relative order while pulling low scores upward.

5. **Neutral Default**: If either text is empty (CV not uploaded, unsupported format, or description is empty), the function returns `50` — a neutral score that neither rewards nor penalises the student for missing CV content.

### Education Score (`educationScore()`)

Maps education level strings to ordinal ranks:
- `certificate = 1`, `diploma = 2`, `undergraduate = 3`, `graduate = 4`

For academic grades: `pass = 1`, `second_lower = 2`, `second_upper = 3`, `first_class = 4`

Logic: If student rank ≥ requirement rank → 100. Otherwise → `(studentRank / requiredRank) × 100`. When both `min_education` and `min_academic_grade` are set, the final score is the average of both sub-scores.

### Location Score (`locationScore()`)

Simple three-tier text match:
- Exact match (case-insensitive trimmed) → **100**
- One string contains the other (partial match) → **60** (e.g., "Nairobi West" contains "Nairobi")
- No match or student location not set → **0**

**Design Decision:** Haversine (geodesic distance) was explicitly ruled out in the schema comments because the project targets text-based location data, not coordinates.

### Experience Score (`experienceScore()`)

- No minimum required → **100**
- Student years ≥ minimum → **100**
- Below minimum → `(studentYears / minYears) × 100` (partial credit, floored at 0)

### Tag Overlap Score (`tagOverlapScore()`)

$$T_{overlap} = \frac{|\text{studentTagIds} \cap \text{requiredTagIds}|}{|\text{requiredTagIds}|} \times 100$$

If the opportunity has no required tags of that type → **100** (no penalty for a missing requirement).

### Recommendation Workflow

`computeAndSaveRecommendations(studentUserId)`:

1. Loads student profile (id, notification_threshold).
2. Loads user email.
3. Queries all active opportunities (`JOIN organizations`).
4. Loads already-notified opportunity IDs (to prevent duplicate match notifications).
5. For each opportunity, calls `scoreStudentAgainstOpportunity(studentId, oppId)` which:
   - Runs all six scoring functions.
   - **UPSERTs** the result into `match_scores`.
6. If `totalScore >= notification_threshold` AND opportunity not in notified set:
   - INSERTs a notification with type `'match'`.
   - Calls `sendMatchEmail()` to dispatch an email.
7. Returns all scored opportunities sorted descending by `totalScore`.

This function runs **synchronously per opportunity** in a `for...of` loop — a deliberate choice to avoid race conditions on `match_scores` upserts (see Limitations).

### Applicant Compare View

The organisation's compare view at `/dashboard/organization/opportunities/[id]/compare` fetches applicants (which includes all `match_scores` breakdown columns via the JOIN in `getApplicants()`). It renders individual `ScoreBar` components for each of the six metric dimensions, allowing recruiters to see exactly why each candidate scored as they did.

---

## 16. Opportunity Management

### Organisation Creates an Opportunity

**Route:** `POST /api/organization/opportunities`  
**Controller:** `organizationController.createOpportunity()`

1. Verifies organisation is `'verified'` (403 if not).
2. **Database transaction** begins.
3. Inserts into `opportunities` with status `'active'`, including optional `minimum_match_score` threshold.
4. Iterates `tagIds` array, inserting rows into `opportunity_tags`.
5. Transaction commits. Response: `{ message, id }`.

**Fields:** `title`, `category` (job/internship/scholarship), `description`, `minEducation`, `minAcademicGrade`, `minExperience`, `location`, `deadline`, `tagIds[]`, `minimumMatchScore`.

### Organisation Manages Opportunities

| Action | Route | Controller Method |
|--------|-------|-----------------|
| List own opportunities | `GET /api/organization/opportunities` | `getMyOpportunities()` |
| Update status | `PUT /api/organization/opportunities/:id/status` | `updateOpportunityStatus()` |
| Delete | `DELETE /api/organization/opportunities/:id` | `deleteOpportunity()` |
| View applicants | `GET /api/organization/opportunities/:id/applicants` | `getApplicants()` |

All mutations use a `JOIN organizations ... WHERE org.user_id = ?` clause to ensure organisations can only modify their own data (implicit ownership check).

### Admin Opportunity Management

Admins can view all opportunities across all organisations via `GET /api/admin/opportunities`. They can delete individual opportunities or bulk-delete all expired ones (past deadline) via `DELETE /api/admin/opportunities/expired`.

### Student Browsing

`GET /api/student/opportunities` returns all active opportunities ordered by deadline ascending, joined with organisation name. Filtering and search are done **client-side** in the frontend using `useMemo` — the API returns the full unfiltered active set.

---

## 17. Application Workflow

### Applying

`POST /api/student/applications { opportunityId, coverNote }`:

1. Loads student profile; checks `cv_url` is set (CV required to apply).
2. Loads opportunity; checks it exists.
3. Calls `scoreStudentAgainstOpportunity()` to refresh the match score.
4. **Auto-rejection gate**: if `opportunity.minimum_match_score` is set and `totalScore < minimum_match_score`:
   - Application inserted with `status = 'rejected'`.
   - Notification inserted with rejection message.
   - `sendApplicationStatusEmail()` dispatches rejection email.
   - HTTP 201 returned with `{ autoRejected: true, score }`.
5. Otherwise: Application inserted with `status = 'submitted'`.
6. `ER_DUP_ENTRY` from MySQL is caught and mapped to HTTP 409 "Already applied".

### Status Lifecycle

```
submitted ──► under_review ──► accepted
                          └──► rejected
```

Status transitions are triggered by the organisation via `PUT /api/organization/applications/:appId/status { status, message }`.

For each status change:
1. `applications.status` updated.
2. `status_updated_at` set to NOW().
3. A notification is inserted for the student.
4. `sendApplicationStatusEmail()` dispatches an email. Default messages are provided per status; organisations may override with a custom message.

### Student View

`GET /api/student/applications` returns a JOIN across `applications`, `opportunities`, and `organizations`, ordered by `applied_at DESC`. The frontend (`applications/page.tsx`) filters this list by status and keyword using `useMemo`, avoiding re-fetching.

---

## 18. Notifications

### Notification Types

| Type | Trigger | Sender |
|------|---------|--------|
| `match` | `computeAndSaveRecommendations()` when score ≥ threshold | System |
| `application` | Application status change by organisation | Organisation |
| `admin` | Manual notification from admin to user | Admin |
| `org_message` | Direct message from organisation to student | Organisation |

### Notification Storage

All notifications are stored in the `notifications` table with:
- `student_id` — the recipient student.
- `message` — human-readable string.
- `is_read` — toggled via `PUT /api/student/notifications/:id/read`.
- `type` — discriminates source/style in the frontend.
- `sent_by_org_id` — set for `org_message` type so student inbox can show sender name.

### Organisation Messaging

- **Direct message** (`POST /api/organization/message-student`): Sends to one student by their `student_id`; inserts one notification row.
- **Broadcast** (`POST /api/organization/message-applicants`): Queries all applicants of a given opportunity owned by the organisation, inserts a notification for each, and sends an email to each.

Both paths call `sendOrgMessageEmail()` and gracefully continue even if the email fails (`try/catch` on the email call).

### Unread Badge (Frontend)

The student layout (`student/layout.tsx`) polls `GET /api/student/notifications` every **60 seconds** to update the unread count badge on the "Inbox" nav link. The interval is cleared on component unmount via the cleanup function in `useEffect`.

---

## 19. Search and Filtering

### Student Opportunity Search

All filtering in the student opportunities and applications pages is done **client-side** in the browser using `useMemo`:

```javascript
const filtered = useMemo(() => {
  return apps.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.title?.toLowerCase().includes(q) ||
      a.organization_name?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });
}, [apps, statusFilter, search]);
```

This approach is acceptable because the full dataset is small (bounded by active opportunities or the student's personal application list). It avoids unnecessary API calls on every keystroke.

### Admin User Search

The admin `GET /api/admin/users` endpoint supports **server-side** filtering via query parameters:
- `search` — appends `AND email LIKE ?` (LIKE `%term%`)
- `role` — filters by `role ENUM` value (validated against allowed values to prevent injection)
- `status` — filters by `is_active` flag

This server-side filtering is used for admin user management where the total dataset may be large.

---

## 20. Dashboard Analytics

### Admin Dashboard (`/dashboard/admin`)

**API:** `GET /api/admin/stats` + `GET /api/admin/reports`

**Stats endpoint** returns a single aggregate row using sub-queries:
- `total_students`, `total_organizations`, `pending_organizations`
- `total_opportunities`, `active_opportunities`, `expired_opportunities`
- `total_applications`

**Reports endpoint** returns:
- `monthlyRegistrations` — student/org signups per month for last 6 months (grouped by `DATE_FORMAT(created_at, '%Y-%m')` and `role`).
- `monthlyApplications` — application count per month for last 6 months.
- `opportunitiesByCategory` — count per `category ENUM`.
- `opportunitiesByStatus` — count per status.
- `orgVerification` — org count per `verification_status`.

These are rendered using **Recharts** components: `BarChart`, `LineChart`, `PieChart`, wrapped in `ResponsiveContainer` for fluid width. The frontend merges `monthlyRegistrations` rows (which have one row per role per month) into a unified `{ month, students, organizations }` map for the stacked/grouped bar chart.

### Organisation Dashboard (`/dashboard/organization/reports`)

**API:** `GET /api/organization/reports`

Returns:
- `oppsByStatus` — with `CASE WHEN deadline < CURDATE() THEN 'expired' ELSE status END` to classify past-deadline active opportunities as expired.
- `oppsByCategory` — category breakdown.
- `appsByStatus` — application status breakdown.
- `monthlyApplications` — last 6 months of applications to this org's opportunities.
- `topOpportunities` — top 8 opportunities by applicant count.

All queries use `JOIN organizations ... WHERE org.user_id = ?` to scope results to the logged-in organisation.

### Student Dashboard Home

The student home page (`/dashboard/student`) displays profile completeness, recent notifications, and quick stats about their applications. These are assembled from the profile endpoint and application list endpoint.

---

## 21. Report Generation

### PDF Reports

**Library:** jsPDF (v4.2.1) + jspdf-autotable (v5.0.8)  
**Location:** `frontend/app/dashboard/student/applications/page.tsx`  
**Trigger:** `ReportModal` component (format picker) → `onPDF` callback

The PDF generation happens entirely in the browser:

```javascript
const doc = new jsPDF();
doc.text('My Applications', 14, 15);
autoTable(doc, {
  head: [['Opportunity', 'Organization', 'Category', 'Status', 'Applied']],
  body: filtered.map((a) => [
    a.title, a.organization_name, a.category, 
    STATUS_LABELS[a.status], new Date(a.applied_at).toLocaleDateString()
  ]),
  startY: 25,
  styles: { fontSize: 9 },
});
doc.save('my-applications.pdf');
```

`jspdf-autotable` renders the table with proper column sizing, pagination across pages, and header repetition.

### Excel Reports

**Library:** SheetJS/xlsx (v0.18.5)  
**Trigger:** `ReportModal` → `onExcel` callback

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

### ReportModal Component

**File:** `frontend/components/ReportModal.tsx`

A modal overlay (fixed position, backdrop) that presents a radio/button choice between PDF and Excel. On confirm, calls the appropriate handler prop (`onPDF` or `onExcel`) and closes. This component is reused across both the student applications page and (indirectly) any future pages that need report export.

### Organisation Chart Analytics

The organisation reports page renders five Recharts visualisations:
1. **Pie chart** — opportunities by status
2. **Pie chart** — opportunities by category
3. **Bar chart** — applications by status
4. **Line chart** — monthly applications (last 6 months)
5. **Horizontal bar chart** — top 8 opportunities by applicant count

These are visual-only; no PDF/Excel export is currently implemented for organisation-level reports.

---

## 22. API Architecture

### Base URL Structure

All API routes are prefixed with `/api/` and mounted in `backend/index.js`:

| Mount Point | Router File | Access |
|-------------|------------|--------|
| `/api/auth` | `authRoutes.js` | Public |
| `/api/student` | `studentRoutes.js` | JWT + role='student' |
| `/api/organization` | `organizationRoutes.js` | JWT + role='organization' |
| `/api/admin` | `adminRoutes.js` | JWT + role='admin' |
| `/api/tags` | `tagRoutes.js` | Public (GET) / authenticated (POST) |
| `/uploads` | Express static | Public (unauthenticated file access) |
| `/api/health` | Inline handler | Public — DB ping |

### Complete Route Inventory

#### Auth Routes (`/api/auth`)
| Method | Path | Action |
|--------|------|--------|
| POST | `/register` | Create user + profile, send verification email |
| POST | `/login` | Validate credentials, return JWT |
| GET | `/verify-email?token=` | Consume verification token |
| POST | `/resend-verification` | Re-issue verification email |
| POST | `/forgot-password` | Issue password reset token |
| POST | `/reset-password` | Consume reset token, update password |

#### Student Routes (`/api/student`)
| Method | Path | Action |
|--------|------|--------|
| GET | `/profile` | Get own profile + tags |
| PUT | `/profile` | Update profile + tags (merge strategy) |
| POST | `/profile/cv` | Upload CV (multipart) |
| POST | `/profile/avatar` | Upload avatar (multipart, images only) |
| GET | `/opportunities` | Browse all active opportunities |
| GET | `/opportunities/:id` | Get single opportunity detail |
| POST | `/applications` | Apply to opportunity |
| GET | `/applications` | Get own applications |
| GET | `/notifications` | Get all notifications |
| PUT | `/notifications/:id/read` | Mark notification read |
| GET | `/recommendations` | Trigger scoring + return ranked opportunities |
| POST | `/saved` | Toggle saved opportunity |
| GET | `/saved` | Get saved opportunities |

#### Organisation Routes (`/api/organization`)
| Method | Path | Action |
|--------|------|--------|
| GET | `/profile` | Get org profile |
| PUT | `/profile` | Update org profile |
| POST | `/opportunities` | Create opportunity (verified org only) |
| GET | `/opportunities` | List own opportunities |
| PUT | `/opportunities/:id/status` | Update opportunity status |
| DELETE | `/opportunities/:id` | Delete opportunity |
| GET | `/opportunities/:id/applicants` | Get applicants with scores |
| PUT | `/applications/:appId/status` | Update application status + notify |
| GET | `/reports` | Get analytics data |
| POST | `/message-student` | Send direct message to student |
| POST | `/message-applicants` | Broadcast to all applicants |

#### Admin Routes (`/api/admin`)
| Method | Path | Action |
|--------|------|--------|
| GET | `/stats` | Platform-wide aggregate stats |
| GET | `/reports` | Analytics data for charts |
| GET | `/organizations/pending` | List pending verification orgs |
| PUT | `/organizations/:id/verify` | Approve or reject org |
| GET | `/users` | List users (with search/filter) |
| PUT | `/users/:id/toggle-active` | Activate/deactivate user |
| DELETE | `/users/:id` | Hard-delete user |
| POST | `/users/:id/notify` | Send notification to user |
| GET | `/opportunities` | List all opportunities |
| DELETE | `/opportunities/:id` | Delete single opportunity |
| DELETE | `/opportunities/expired` | Delete all past-deadline opportunities |

---

## 23. Backend Request Lifecycle

A typical authenticated request (e.g., `GET /api/student/recommendations`) follows this lifecycle:

```
1. HTTP Request arrives at Express
        │
2. Global middleware stack
   ├── cors() — adds CORS headers
   └── express.json() — parses JSON body
        │
3. Route matching: /api/student → studentRouter
        │
4. router.use() chain:
   ├── verifyToken()
   │   ├── Extract "Bearer <token>" from Authorization header
   │   ├── jwt.verify(token, JWT_SECRET)
   │   ├── Attach decoded { id, role } to req.user
   │   └── next()
   └── requireRole('student')
       ├── Check req.user.role === 'student'
       └── next() or 403
        │
5. Route handler: matchController.getRecommendations()
   ├── computeAndSaveRecommendations(req.user.id)
   ├── DB queries via pool (connection from pool, auto-returned)
   ├── File I/O (fs.readFileSync for CV)
   ├── Text processing (tokenise, cosine)
   └── Nodemailer (async, non-blocking email sends)
        │
6. res.json(results) — Express serialises and sends response
        │
7. mysql2 connection returned to pool
```

**Error Handling in Controllers:** All controller functions are wrapped in `try/catch`. Caught errors log via `console.error(err)` and return `res.status(500).json({ error: 'Human-readable message' })`. MySQL duplicate-entry errors (`err.code === 'ER_DUP_ENTRY'`) are caught specifically for 409 responses.

---

## 24. Frontend Component Flow

### Page Initialization Pattern

Every data-driven page follows the same `useEffect` + `apiFetch` pattern:

```javascript
const [data, setData] = useState([]);
const [error, setError] = useState('');
const [loading, setLoading] = useState(true);

useEffect(() => { load(); }, []);

const load = async () => {
  setLoading(true);
  setError('');
  try {
    const res = await apiFetch('/api/student/...');
    const body = await res.json();
    if (!res.ok || !Array.isArray(body)) throw new Error(body.error || 'Failed to load');
    setData(body);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### `apiFetch` Utility (`frontend/lib/api.js`)

```javascript
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res;
}
```

This is the single point of truth for all API calls. It automatically attaches the JWT from `localStorage` and prepends the API base URL from the environment variable.

### Layout Hierarchy

```
RootLayout (app/layout.tsx)
  ├── Font variables injected (Space Grotesk, IBM Plex Sans, IBM Plex Mono)
  └── StudentLayout / OrgLayout / AdminLayout
        ├── Auth guard (localStorage role check on mount)
        ├── Sidebar navigation
        ├── Notification badge polling
        └── page.tsx (leaf route)
```

Each dashboard layout is a **client component** (`'use client'`) that handles auth checking, sidebar state, and profile name/avatar display in the nav.

### Student Profile Sub-Component Architecture

The student profile page composes five stateless card components. Each card:
1. Receives data as props.
2. Has an internal `editing` boolean state.
3. On edit: shows form fields pre-populated from props.
4. On save: calls `apiFetch('/api/student/profile', { method: 'PUT', body: JSON.stringify(updates) })`.
5. On success: calls the `onSaved(updates)` prop callback to bubble the change back to the parent page.

---

## 25. State Management

Fursa uses **local component state** exclusively via React `useState` and `useEffect` hooks. There is no global state management library (no Redux, no Zustand, no Context API for data).

**Rationale:** The application has limited cross-page state sharing needs. Each dashboard page independently fetches its own data. The only cross-cutting piece of state (the JWT token and role) is stored in `localStorage` and read by each component that needs it.

**Notification Badge State:** The unread count in the layout's nav badge is fetched independently from the inbox page — both call `GET /api/student/notifications`. This means the badge count and the inbox list can briefly diverge if notifications arrive between their respective polls.

---

## 26. Validation

### Backend Validation

Validation in the backend is **manual and inline** — there is no validation library (no Joi, no express-validator).

| Location | Validation |
|----------|-----------|
| `authController.register` | Role must be 'student' or 'organization'; email uniqueness enforced by DB UNIQUE |
| `authController.login` | Credentials validated via bcrypt; active + verified state checked |
| `authController.forgotPassword` | Email presence check |
| `authController.resetPassword` | Token and new password presence check |
| `organizationController.createOpportunity` | Org must be verified |
| `organizationController.updateApplicationStatus` | Status must be in allowed ENUM values |
| `organizationController.sendMessageToStudent` | studentId and message presence |
| `adminController.verifyOrganization` | Decision must be 'verified' or 'rejected' |
| `adminController.toggleUserActive` | Admin cannot deactivate own account |
| `adminController.deleteUser` | Admin cannot delete own account |
| `tagController.findOrCreateTag` | name required; type must be 'skill' or 'interest' |
| `studentController.uploadCv` | File presence check |
| `studentController.applyToOpportunity` | CV must be uploaded before applying |

Database-level constraints (NOT NULL, UNIQUE, ENUM, FOREIGN KEY) provide a secondary validation layer.

### Frontend Validation

Frontend validation is largely delegated to the browser via native HTML5 form attributes (`required`, `type="email"`, `type="password"`). No custom validation library is used. Error messages returned by the API are displayed directly to the user.

---

## 27. Error Handling

### Backend

- All async controller functions use `try/catch`.
- Specific MySQL error codes are caught (`ER_DUP_ENTRY` for duplicate applications).
- Errors are logged with `console.error(err)` (full error object, including stack trace).
- Non-sensitive error messages are returned to the client as `{ error: 'message' }`.
- Transactional operations (`register`, `updateProfile`, `createOpportunity`) call `connection.rollback()` in the catch block before re-throwing or responding.
- Email dispatch errors are caught in a nested `try/catch` and logged without failing the main response (email is non-critical).

### Frontend

- API responses are checked with `!res.ok` after `apiFetch`.
- `data.error` from JSON bodies is used as the error message.
- Error state is set to `err.message` and displayed inline in a styled red banner.
- Loading states are shown while data is being fetched.
- Empty states are shown when data arrays are empty.

---

## 28. Security Features

| Feature | Implementation | Location |
|---------|---------------|---------|
| **Password hashing** | bcrypt with 10 salt rounds (adaptive, computationally expensive) | `authController.register`, `authController.resetPassword` |
| **JWT authentication** | HS256 signed tokens, 7-day expiry, `JWT_SECRET` from env | `authController.login`, `authMiddleware.verifyToken` |
| **Role-based access control** | `requireRole()` middleware on every protected route group | `authMiddleware.js`, all route files |
| **Email verification** | `email_verified` flag; login blocked until verified | `authController.verifyEmail`, `authController.login` |
| **Cryptographically secure tokens** | `crypto.randomBytes(32)` for verification and reset tokens | `authController.js` |
| **Token time-to-live** | Verification and reset tokens expire in 30 minutes | `authController.js` |
| **Token one-time use** | Tokens set to NULL in DB after consumption | `authController.verifyEmail`, `authController.resetPassword` |
| **User enumeration prevention** | `forgotPassword` and `resendVerification` return identical responses regardless of email existence | `authController.js` |
| **Ownership enforcement** | All org mutations use `JOIN organizations WHERE org.user_id = ?` to prevent cross-org data access | `organizationController.js` |
| **Admin self-protection** | Admin cannot deactivate or delete their own account | `adminController.toggleUserActive`, `adminController.deleteUser` |
| **File size limits** | CV: 5 MB, Avatar: 2 MB enforced by Multer | `middleware/upload.js` |
| **Avatar MIME filtering** | Only `image/*` accepted for avatar upload | `middleware/upload.js` |
| **Input parameterisation** | All database queries use `?` placeholders with parameterised values | All controllers |
| **CORS** | `cors()` middleware on all routes | `index.js` |
| **Environment variables** | All secrets (DB credentials, JWT secret, SMTP credentials) in `.env` | `dotenv` in `db.js`, `config/email.js`, `authController.js` |
| **Account status check** | `is_active` flag checked on every login | `authController.login` |
| **Org verification gate** | Organisations cannot post until admin verifies them | `organizationController.createOpportunity` |
| **Auto-rejection transparency** | Auto-rejected applicants receive notification and email explaining score threshold | `studentController.applyToOpportunity` |

**SQL Injection Prevention:** All queries in the codebase use mysql2's parameterised query interface (`pool.query('SELECT ... WHERE id = ?', [id])`). No string concatenation is used for query building except in the admin user search, where `role` is validated against an allowlist before concatenation.

---

## 29. Performance Optimizations

| Optimization | Detail |
|-------------|--------|
| **Connection pooling** | mysql2 pool with `connectionLimit: 10`; connections reused across requests instead of creating new TCP connections |
| **`useMemo` for filtering** | Client-side search/filter on already-loaded lists avoids repeated API calls on every keystroke |
| **Partial profile updates** | Server-side merge strategy in `updateProfile` means only changed fields need to be sent |
| **UPSERT for match scores** | `INSERT ... ON DUPLICATE KEY UPDATE` refreshes scores without a separate SELECT first |
| **Notification deduplication** | Match notifications only sent once per (student, opportunity) pair — checked via `SELECT opportunity_id FROM notifications WHERE type='match'` before inserting |
| **Next.js font optimization** | Google Fonts loaded via `next/font/google` which auto-subsets, self-hosts, and applies `font-display: swap` |
| **`useMemo` for summary counts** | Application status counts are derived from already-loaded data, not a separate API call |
| **Static file serving** | Uploaded files served directly by Express static middleware (no controller overhead) |
| **`Promise.all` in admin dashboard** | Stats and reports fetched in parallel with `Promise.all([apiFetch('/stats'), apiFetch('/reports')])` |

---

## 30. Scalability Considerations

The current implementation is optimised for a **single-server, moderate-load** environment typical of a university project. The following are known scaling constraints:

| Constraint | Current State | Path to Scaling |
|-----------|--------------|----------------|
| **Match scoring loop** | Sequential `for...of` over all active opportunities per recommendation request | Batch with `Promise.all` or background job queue (Bull/BullMQ) |
| **File storage** | Local filesystem (`uploads/`) | Migrate to object storage (AWS S3, Cloudflare R2) with signed URLs |
| **Database connection pool** | Single server, `connectionLimit: 10` | Multiple read replicas for analytics queries; connection pool per worker |
| **Email sending** | Synchronous within request (non-critical path is try/catched) | Async queue (e.g., BullMQ + Redis) |
| **JWT invalidation** | No token revocation — 7-day tokens cannot be invalidated before expiry | Redis token blacklist or refresh token pattern |
| **Client-side filtering** | Works for small datasets | Add `LIMIT`/`OFFSET` pagination to opportunity endpoints |

---

## 31. Deployment Architecture

The project is structured for independent deployment of backend and frontend:

```
┌──────────────────────────────────────────────────┐
│  Production Environment (Single VPS / WSL Dev)   │
│                                                  │
│  ┌──────────────────────┐                        │
│  │  Next.js Frontend    │  Port 3000             │
│  │  next start          │  NEXT_PUBLIC_API_URL=  │
│  └──────────────────────┘  http://localhost:5000  │
│                                                  │
│  ┌──────────────────────┐                        │
│  │  Express API         │  Port 5000 (PORT env)  │
│  │  node index.js       │  DB_HOST, DB_USER, ... │
│  └──────────────────────┘                        │
│                                                  │
│  ┌──────────────────────┐                        │
│  │  MySQL Server        │  Port 3306             │
│  │  database: is_project│                        │
│  └──────────────────────┘                        │
│                                                  │
│  ┌──────────────────────┐                        │
│  │  SMTP (External)     │  Port 587 (STARTTLS)   │
│  │  e.g., Gmail/Mailtrap│                        │
│  └──────────────────────┘                        │
└──────────────────────────────────────────────────┘
```

**Environment Variables Required:**

Backend (`.env`):
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<password>
DB_NAME=is_project
JWT_SECRET=<long-random-string>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<app-password>
FRONTEND_URL=http://localhost:3000
```

Frontend (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 32. End-to-End System Workflow

The following narrates the complete lifecycle from a new user's first visit to downloading a report.

### Phase 1: Onboarding

1. Student visits the platform and clicks "Register".
2. Fills in name, email, password, role=student.
3. Backend validates, hashes password, creates `users` + `student_profiles` rows in a single transaction, sends verification email.
4. Student clicks the link in the email; `email_verified` flag is set to 1.
5. Student logs in; receives JWT stored in `localStorage`.
6. Redirected to `/dashboard/student`.

### Phase 2: Profile Completion

1. Student navigates to Profile.
2. Uploads CV (PDF or DOCX, max 5 MB); stored as `cv_<userId>_<timestamp>.pdf` in `uploads/`.
3. Edits education details (level, grade, institution, course).
4. Selects skills and interests from the tag picker.
5. Sets location and years of experience.
6. Each card edit calls `PUT /api/student/profile` with merged partial updates.

### Phase 3: Discovery and Recommendation

1. Student visits "Recommendations".
2. Frontend calls `GET /api/student/recommendations`.
3. Backend reads CV file from disk, extracts text with `pdf-parse`.
4. For each active opportunity: tokenises CV text and opportunity description, computes TF cosine similarity, evaluates all five other criteria, computes weighted total score, upserts into `match_scores`.
5. Opportunities where `totalScore >= notification_threshold` AND not previously notified trigger an in-app notification + match email.
6. Results returned sorted by `totalScore` descending.
7. Student sees cards with individual metric progress bars.

### Phase 4: Application

1. Student opens an opportunity detail page.
2. Views description, required tags, organisation name.
3. Clicks "Apply" (with optional cover note).
4. Backend re-scores the student, checks auto-reject threshold.
5. If score sufficient: application inserted with `status='submitted'`.
6. Student application visible in "Applications" page.

### Phase 5: Organisation Review

1. Organisation logs in (after admin verification).
2. Views applicant list for their opportunity, sorted by `total_score` descending.
3. Uses "Compare" view to view up to 4 applicants side-by-side with metric breakdown bars.
4. Updates application status to `under_review`.
5. Applicant receives in-app notification + email: "Your application is currently under review."
6. Organisation accepts or rejects the application with optional custom message.
7. Student receives final notification + email.

### Phase 6: Reporting

1. Student visits "Applications" page.
2. Filters by status "Accepted" and searches by organisation name.
3. Clicks "Generate Report" → ReportModal opens.
4. Selects PDF format → jsPDF constructs document, `autoTable` renders rows, `doc.save()` triggers browser download.

### Phase 7: Admin Oversight

1. Admin logs in via `/login`.
2. Views Platform Overview dashboard: KPI cards (total students, orgs, applications), trend charts (monthly registrations, monthly applications, opportunity category breakdown).
3. Reviews pending organisation verification requests.
4. Approves an organisation → `verification_status` set to 'verified'; organisation can now post opportunities.
5. Admin searches users, deactivates a spam account.
6. Admin bulk-deletes all expired opportunities.

---

## 33. Design Decisions

### Why No ORM?

The codebase deliberately uses raw SQL via `mysql2/promise` rather than an ORM like Sequelize or Prisma. The primary reasons are:

1. **Transparency**: The scoring queries (6-table JOINs with LEFT JOINs for optional scores) would be verbose and harder to reason about through Sequelize associations.
2. **Performance control**: Raw SQL allows explicit `ORDER BY`, `LIMIT`, and index-aware query patterns.
3. **Learning value**: For a university project, writing raw SQL demonstrates database competence directly.

### Why No Global State Manager?

React's built-in `useState`/`useEffect` is sufficient because:
- Data is page-scoped; no page needs another page's data.
- The JWT in `localStorage` is the only shared state, and it's trivially accessible.
- Adding Redux or Zustand would introduce complexity without benefit.

### Why Client-Side Report Generation?

Using jsPDF and SheetJS in the browser avoids:
- A server-side PDF/Excel generation endpoint.
- Managing file streams and cleanup on the server.
- Latency of a server round-trip for a report that is already available in the browser's memory.
The trade-off is that very large datasets could block the browser's main thread, but application lists are bounded.

### Why Weighted Multi-Criteria Scoring?

A binary match (pass/fail) would produce too many equal candidates. A single-criterion score (e.g., only skills) ignores the holistic nature of opportunity matching. The six-weight model was designed to reflect real-world hiring criteria hierarchy: CV content is the richest signal (50%), followed by equal weight on structured attributes (10% each).

### Why Text Similarity at 50% Weight?

CV text is the most holistic representation of a student's profile: it captures skills, experience, projects, academic background, and language all at once. The CV-to-description cosine similarity effectively captures whether the student's expressed profile aligns with the opportunity's requirements even when structured tags don't perfectly overlap.

### Why the Square-Root Stretch?

Raw TF cosine similarity between typical CV text and job descriptions is very low (0.01–0.15) because documents are long and sparse. Without transformation, the 50% text component would barely differentiate candidates. The `Math.sqrt(cosine)` transformation stretches the 0–0.15 range into a more useful 0–0.39 range while preserving relative ranking.

### Why ENUM for Role and Status Fields?

MySQL ENUMs enforce valid values at the storage layer, preventing invalid data from reaching the application. They also communicate the domain vocabulary directly in the schema. The trade-off (adding a value requires an `ALTER TABLE`) is acceptable given the small number of predefined values.

### Why the `1-to-1 Extension` Pattern for Student and Org Profiles?

Keeping identity (`users`) separate from profile (`student_profiles`, `organizations`) follows the principle of separation of concerns. It also simplifies role-agnostic queries on the `users` table (e.g., login, user list, notification dispatch) without joining domain-specific columns.

---

## 34. Limitations of the Current Implementation

| # | Limitation | Detail |
|---|-----------|--------|
| 1 | **Unauthenticated file access** | Files in `uploads/` are publicly accessible via URL without any JWT check. Any person with the URL can download a CV. |
| 2 | **Sequential recommendation scoring** | The `for...of` loop in `computeAndSaveRecommendations` processes opportunities one at a time. For 100+ opportunities, this adds latency proportional to opportunity count × (file I/O + SQL + computation). |
| 3 | **No refresh token mechanism** | JWTs cannot be revoked. A user who logs out or is deactivated can still use their token for up to 7 days. |
| 4 | **Image-based PDF CVs not parsed** | `pdf-parse` extracts text layer only; scanned PDFs with embedded images will return no text, defaulting the text score to 50. |
| 5 | **No `.doc` format support** | `mammoth` only handles `.docx` (Office Open XML). Legacy `.doc` files return an empty string. |
| 6 | **No rate limiting** | The API has no rate limiting middleware. Repeated calls to recommendation endpoint could stress both file I/O and the database. |
| 7 | **Local file storage** | `uploads/` on the server filesystem means files are lost if the server is re-deployed; not suitable for horizontal scaling. |
| 8 | **No input sanitisation for free-text fields** | `bio`, `description`, `message`, and `cover_note` fields are stored and returned as-is. XSS protection relies entirely on React's default HTML escaping. |
| 9 | **No pagination** | All list endpoints return complete datasets. For a large number of students or opportunities, this could impact both performance and memory. |
| 10 | **`mailer.js` is a duplicate** | `backend/utils/mailer.js` contains a standalone transporter and `sendVerificationEmail` function that duplicates `config/email.js`. It is not used in the main application flow. |
| 11 | **No DOCX CV text in tag scoring** | Text similarity uses the CV document. Tag scoring uses `student_tags` database rows. A student with skills listed in their DOCX but not entered as tags will score 0 on the skills tag overlap component even if their CV text mentions those skills. |
| 12 | **Report table not used** | The `reports` table in the schema is not written to by the current reporting system, which serves live SQL aggregations directly. |
| 13 | **Notification polling** | The student layout polls notifications every 60 seconds. WebSockets or Server-Sent Events would provide real-time notifications. |

---

## 35. Future Improvements

| # | Improvement | Rationale |
|---|------------|-----------|
| 1 | **Authenticated file serving** | Introduce a signed URL or a middleware-protected `/api/files/:filename` endpoint that verifies the requesting user owns or is permitted to access the file. |
| 2 | **Background job queue** | Move `computeAndSaveRecommendations` to a background queue (BullMQ + Redis). Trigger scoring when profiles are updated or new opportunities are posted, rather than on every recommendations page load. |
| 3 | **Refresh token system** | Issue short-lived (15-minute) access tokens with long-lived (30-day) refresh tokens stored as HttpOnly cookies. Enables token revocation and improves security. |
| 4 | **OCR for image-based PDFs** | Integrate Tesseract.js (client-side) or a cloud OCR API (AWS Textract, Google Document AI) to extract text from scanned PDF CVs. |
| 5 | **IDF weighting for text similarity** | Upgrade from TF to TF-IDF cosine similarity. Terms that are rare across all CVs/descriptions would receive higher discriminating weight, improving matching accuracy. |
| 6 | **Rate limiting** | Add `express-rate-limit` middleware, especially on the `/recommendations` endpoint and authentication routes. |
| 7 | **Object storage migration** | Migrate `uploads/` to an S3-compatible object store. Use pre-signed URLs for CV access with short TTLs. |
| 8 | **Input sanitisation** | Add a library like `DOMPurify` (client) or `sanitize-html` (server) for rich-text fields to prevent stored XSS. |
| 9 | **Server-side pagination** | Add `LIMIT` and `OFFSET` query parameters to opportunity and user list endpoints; implement infinite scroll or paginator in the frontend. |
| 10 | **Real-time notifications** | Replace the 60-second poll with WebSocket push (Socket.IO) or Server-Sent Events to deliver instant notification updates. |
| 11 | **Tag extraction from CV** | Post-process extracted CV text to automatically suggest skill/interest tags using keyword extraction (TF-IDF or Named Entity Recognition), pre-populating the student's tag selections. |
| 12 | **Organisation logo upload** | The `organisations.logo_url` column exists in the schema but there is no upload endpoint for it. Add a Multer-based logo upload route. |
| 13 | **Admin analytics export** | Extend the `ReportModal` pattern to the admin dashboard for downloading platform analytics as PDF/Excel. |
| 14 | **Unit and integration tests** | The `test-cv-parse.js` file is a manual test script. A full Jest test suite covering controllers, the scoring engine, and authentication flows would improve reliability. |
| 15 | **Docker Compose deployment** | Containerise the backend, frontend, and MySQL into a `docker-compose.yml` for reproducible, portable deployment. |

---

*Document generated from direct codebase analysis of the Fursa Student Opportunity Recommendation Platform.*  
*All claims are based on actual implementation found in `backend/`, `frontend/`, and `database/` source files.*
