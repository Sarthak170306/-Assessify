# Assessify AI — Full-Stack Quiz & Assessment Platform 🚀

Assessify AI is an intelligent assessment platform for creating, evaluating, and managing interactive quizzes with real-time feedback, analytics, Prisma ORM, Supabase PostgreSQL, and Clerk Authentication.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router v6 (with v7 flags), `@clerk/clerk-react`
- **Backend**: Node.js, Express.js, `@prisma/client`, `@clerk/express`, CORS, dotenv
- **Database**: PostgreSQL (hosted on Supabase) with Prisma ORM
- **Authentication**: Clerk Auth (OAuth, Email/Password, Protected Routes, Session Management)

---

## 📁 Repository Structure

```
Assessify AI/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Prisma Schema for 7 Relational Models
│   ├── src/
│   │   └── config/
│   │       └── prisma.js        # Prisma client singleton
│   ├── server.js                # Express Server & Health Check API
│   ├── package.json             # Backend dependencies & scripts
│   └── .env.example             # Backend environment template
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx     # Protected Dashboard & Live API Health Monitor
    │   │   ├── SignInPage.jsx   # Clerk SignIn route
    │   │   └── SignUpPage.jsx   # Clerk SignUp route
    │   ├── App.jsx              # Main Router setup
    │   ├── main.jsx             # ClerkProvider & BrowserRouter
    │   └── index.css            # Tailwind & Glassmorphism design system
    ├── package.json             # Frontend dependencies & scripts
    └── .env.example             # Frontend environment template
```

---

## ⚙️ Getting Started

### 1. Backend Setup

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your DATABASE_URL and CLERK_SECRET_KEY

# Generate Prisma Client & Sync Database
npx prisma generate
npx prisma db push

# Start Backend Server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup

```bash
cd ../frontend
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your VITE_CLERK_PUBLISHABLE_KEY

# Start Frontend Dev Server (runs on http://localhost:5173 or 5174)
npm run dev
```

---

## 📡 API Endpoints

- `GET /api/health` — Telemetry endpoint returning server status, database connection, timestamp, and uptime.

---

## 📄 License

MIT License &copy; 2026 Assessify AI.
