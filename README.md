# 🚀 Yentech Recruitment Portal | v1.1

A state-of-the-art, high-fidelity recruitment assessment platform built for the modern hiring workflow. Designed with a focus on **Visual Excellence**, **Candidate Integrity**, and **Real-time Data Persistence**.

---

## ✨ Key Features

### 💎 Premium Candidate Experience
- **Fluid UI/UX**: Powered by **Framer Motion**, featuring glassmorphism, smooth transitions, and high-contrast typography.
- **Dynamic Assessment Page**: Context-aware questions for AI/ML, Graphics/Media, and General domains.
- **Mobile Responsive**: Fully optimized for professional assessment on any desktop device.

### 🛡️ Advanced Anti-Cheating & Integrity
- **Fullscreen Enforcement**: Candidates must maintain fullscreen mode; exiting triggers a violation warning.
- **Smart Blur Detection**: Detects when a candidate switches tabs or windows.
- **Instant Termination**: Auto-submission and session invalidation after repeated integrity violations.

### ☁️ Real-time Data Persistence
- **Cloud Sync (Debounced)**: Every character typed is automatically synced to the database after 2 seconds of inactivity.
- **Sync Status Indicator**: Real-time feedback for candidates (Syncing/Saved/Error) ensuring zero data loss.
- **Session Restoration**: Candidates can refresh their page or recover from crashes without losing progress.

### 📊 Comprehensive Admin Dashboard
- **Invite Management**: Individual or **Bulk Invite** functionality with one click.
- **Assessment Reports**: Live monitoring of candidate progress via the "View Assessment" overlay.
- **Automated Workflow**: Real-time status transitions (Registered → Invited → In Progress → Completed).

---

## 🛠️ Technical Stack

- **Core**: [Next.js 16.2 (Turbo)](https://nextjs.org), [React 19](https://reactjs.org)
- **Styling**: Tailwind CSS (Custom Design System)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL, RLS, SSR)
- **Emailing**: Nodemailer with SMTP Integration
- **Icons**: [Lucide React](https://lucide.dev)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- A Supabase Project
- SMTP Credentials (e.g., Gmail App Password)

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin Security
ADMIN_PASSWORD=your-secret-password
SESSION_SECRET=your-session-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema
Run the SQL scripts located in the `scripts/` directory in your Supabase SQL Editor to initialize the `registrations` and `test_sessions` tables with proper **Row Level Security (RLS)**.

### 4. Installation & Development
```bash
npm install
npm run dev
```

---

## 🔒 Security & Architecture
- **Server Actions**: All database interactions are secured via Next.js Server Actions with built-in validation.
- **RLS (Row Level Security)**: Strict PostgreSQL policies ensure candidates can only update their own assessments.
- **Server-side Verification**: Link IDs are cryptographically verified and checked against timestamps on every interaction.

---

## 🤝 Project Credits
Developed with a mission to simplify technical recruitment without compromising on security or design quality.

© 2026 Yentech Recruitment. All rights reserved.
