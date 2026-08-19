# 🚀 Assessify AI (QuizPulse) - Next-Gen AI-Powered Assessment Platform

**Assessify AI** is an enterprise-grade, full-stack, AI-powered online assessment and quiz platform built with **React.js**, **Node.js/Express.js**, **Prisma ORM**, **Supabase PostgreSQL**, **Google Gemini AI SDK**, and **Clerk Authentication**.

---

## 🌟 Core Features Matrix

### 🎓 Student Portal
- **Interactive Timed Quiz Engine**: Responsive quiz attempt interface with live countdown timers, question navigation, answer persistence, and server-side submission.
- **Automated Instant Server Scoring**: Fail-safe server-side scoring algorithm calculating exact marks, percentage accuracy, and pass/fail thresholds.
- **Detailed Solution & Answer Review**: Question-by-question breakdown featuring color-coded feedback (Green ✓ for correct answers, Red ✕ for wrong choices), correct answer outlines, and educational rationale notes.
- **AI-Powered Diagnostic Feedback**: Custom AI study guide generator analyzing student strengths, weak areas, and actionable revision roadmaps.
- **Student Analytics Dashboard**: Performance progression trend charts (Recharts `AreaChart`), category domain mastery breakdown, and quick action launchers.
- **Dynamic Leaderboards**: Global and category-wise rankings with Top 3 Gold/Silver/Bronze visual podiums, time filter pills, and a sticky personal standing footer.

### 🛡️ Admin Command Center
- **Gemini AI Quiz Generator**: One-click AI quiz generation from topic inputs, generating structured multiple-choice questions, options, and explanations.
- **Quiz Preview & Bulk Save Pipeline**: Interactive preview modal allowing admins to inspect, edit, publish, or save draft quizzes directly to PostgreSQL.
- **Assessment Management**: Full CRUD operations for quizzes, categories, and question item banks.
- **Executive Platform Analytics**: Real-time KPI dashboards, daily attempt timeline charts, popular quiz bar charts, pass/fail donut charts, and live attempt audit streams.

---

## 🏗️ Tech Stack & System Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React 18, Vite 5, Tailwind CSS, Lucide React Icons |
| **Data Visualization** | Recharts Responsive Charts |
| **Backend Server** | Node.js, Express.js (REST API Architecture) |
| **Database & ORM** | PostgreSQL (Supabase IPv4 Pooler), Prisma ORM 5 |
| **AI Integration** | Google Gemini SDK (`@google/genai` & `@google/generative-ai`) |
| **Authentication** | Clerk Auth (`@clerk/clerk-react` & `@clerk/express`) |
| **Security & Headers** | Helmet-style security headers, Rate Limiting, Input Sanitization |

```
+-----------------------------------------------------------------------+
|                           STUDENT & ADMIN UI                          |
|                       React.js + Vite + Tailwind                      |
+-----------------------------------------------------------------------+
                                   |
                         (REST API / HTTPS / Clerk)
                                   v
+-----------------------------------------------------------------------+
|                        EXPRESS.JS BACKEND SERVER                      |
| Security Headers | Rate Limiter | Input Sanitizer | Auth Middleware   |
+-----------------------------------------------------------------------+
            |                                         |
     (Prisma ORM Client)                      (Gemini SDK API)
            v                                         v
+-----------------------+                 +-----------------------+
|  SUPABASE POSTGRESQL  |                 |    GOOGLE GEMINI AI   |
| (Pooler Port 6543/5432)|                |  Quiz & Feedback Gen  |
+-----------------------+                 +-----------------------+
```

---

## 📡 REST API Reference

### 🔐 Authentication & Users (`/api/users`)
- `GET /api/users/me` — Resolve logged-in user profile & role.
- `POST /api/users/sync` — Synchronize Clerk user identity with PostgreSQL DB.

### 📁 Categories (`/api/categories`)
- `GET /api/categories` — List all assessment domain categories.
- `POST /api/categories` — Create new category (Admin only).

### 📝 Quizzes (`/api/quizzes`)
- `GET /api/quizzes` — Fetch published quiz catalog with search/filter.
- `GET /api/quizzes/:id` — Get quiz details & student question view.
- `POST /api/quizzes/generate-ai` — Generate quiz via Gemini AI SDK.
- `POST /api/quizzes/save-ai-quiz` — Bulk save AI-generated quiz to DB.
- `PATCH /api/quizzes/:id/status` — Toggle status (`DRAFT` <-> `PUBLISHED`).

### ⏱️ Attempts & Scoring (`/api/attempts`)
- `POST /api/attempts/submit` — Submit answers & execute automated server scoring.
- `GET /api/attempts` — Get user attempt history.
- `GET /api/attempts/:id` — Get detailed attempt result & solution breakdown.
- `POST /api/attempts/:id/feedback` — Generate AI diagnostic study feedback.

### 📊 Analytics (`/api/analytics`)
- `GET /api/analytics/student/:userId` — Fetch student metrics & category mastery.
- `GET /api/analytics/overview` — Fetch platform executive analytics.

### 🏆 Leaderboard (`/api/leaderboard`)
- `GET /api/leaderboard` — Fetch overall & category-wise rankings with user rank.

---

## 💻 Local Setup & Installation

### 1. Repository Setup
```bash
git clone https://github.com/Sarthak170306/-Assessify.git
cd -Assessify
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
```
Create `backend/.env` matching `backend/.env.example`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
GEMINI_API_KEY="your-google-gemini-key"
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```
Run backend dev server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create `frontend/.env` matching `frontend/.env.example`:
```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_API_URL="http://localhost:5000/api"
```
Run frontend dev server:
```bash
npm run dev
```

---

## 🧪 Test Execution Scripts

- **System Health Check**:
  ```bash
  node backend/health-check.js
  ```
- **End-to-End Security & Integration Test Suite**:
  ```bash
  node backend/test-day13-e2e.js
  ```
- **Leaderboards & Analytics Verification**:
  ```bash
  node test-day12.js
  ```

---

## 🚀 Production Deployment Configuration

- **Frontend Deployment (Vercel)**:
  - Output directory: `dist`
  - Build command: `npm run build`
  - Client-side routing rewrites included in `frontend/vercel.json`.
- **Backend Deployment (Render/Railway)**:
  - Build command: `npm run build` (`npx prisma generate`)
  - Start command: `npm start` (`node server.js`)
