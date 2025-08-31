````markdown
# AccessAble – Inclusive Professional Network

AccessAble is a professional networking platform designed with accessibility at its core—an inclusive space where everyone can connect, share, and grow their careers.

---

## ✨ Complete Features

### 🔐 Authentication & Accounts
- Secure sign-up / login (Supabase Auth)
- Email password reset
- Profile & account settings
- Avatar upload with cropping

### 👤 Professional Profiles
- Detailed profiles (skills, experience, education, certifications)
- Accessibility needs & preferences
- View other users’ profiles

### 📱 Social Networking
- Dynamic feed (text, images, media)
- Likes, comments (threaded), shares
- Post privacy controls
- Media/file uploads

### 💼 Jobs Platform
- Browse jobs with filters (type, location, accessibility)
- Post new jobs
- Apply via application links
- **Job Recommendation AI** (built-in; no setup needed)

### 🔍 Search & Discovery
- People search (name, skills, location)
- Job search (title, company, location)
- Company discovery
- Advanced filters & sorting; paginated results

### 🌐 Network Management
- Follow / Unfollow
- Followers / Following lists
- Suggested connections

### 🔔 Notifications
- Real-time notifications (likes, comments, follows, job alerts)
- Per-user preferences

### ♿ Accessibility (WCAG 2.1 AA)
- Full keyboard navigation with visible focus
- Screen reader support (semantic HTML + ARIA)
- High-contrast mode
- Large text scaling (50–200%)
- Skip links, focus management
- Clear error identification & messaging

### 🛡️ Security & Moderation
- **AI Moderation (Google Perspective API)** – detects toxicity, profanity, threats, identity attacks  
  - Already integrated (no setup required)  
  - Local fallback filter if API is unavailable  
- Supabase Row Level Security (RLS)
- JWT-based secure authentication
- User content reporting

### ⚡ Performance
- Code splitting & lazy loading
- Next.js image optimization (WebP/AVIF)
- Edge caching & CDN-friendly
- Bundle optimization & tree shaking
- Mobile-first responsive design
- Progressive enhancement (works with minimal JS)

### 📊 Extra Features
- Real-time updates (feed, notifications)
- Data export for user profiles
- Analytics dashboard (activity insights)
- RESTful API endpoints (internal routes)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+  
- npm

### 1. Clone
```bash
git clone https://github.com/your-username/AccessAble-1.git
cd AccessAble-1
````

### 2. Install

```bash
npm install
```

### 3. Environment

Create `.env.local` in the project root with **only** your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://orrvmkjcjfctubwrqgxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycnZta2pjamZjdHVid3JxZ3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzM4MjIsImV4cCI6MjA2ODM0OTgyMn0.0w8S0wYDrbYseQFngnNcmE8Sw0B4hfQ-qiIMRgZR8-g

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

👉 That’s it.

* **AI Moderation** and **Job Recommendation AI** already work out of the box.
* No extra API keys or setup required.

### 4. Build & Start (⚠️ use only these)

```bash
npm run build
npm run start
```

App runs at: [http://localhost:3000](http://localhost:3000)

> ⚠️ **Important:** Do NOT use `npm run dev`. Always use `npm run build` and `npm start`.

---

## 🏗️ Project Structure

```
AccessAble-1/
├─ app/              # Next.js routes (auth, jobs, posts, profiles, etc.)
├─ components/       # UI (shadcn/ui), auth, profile, accessibility
├─ lib/              # supabaseClient, moderation, utilities
├─ hooks/            # Custom React hooks
├─ styles/           # Tailwind config & global styles
├─ public/           # Static assets
└─ docs/             # Documentation
```

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15, React 19, TypeScript 5, Tailwind CSS, Radix UI, shadcn/ui
* **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime, RLS)
* **AI:** Google Perspective API (moderation), Job Recommendation AI (built-in)
* **Deploy:** Vercel-friendly

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch:

   ```bash
   git checkout -b feature/new-feature
   ```
3. Commit:

   ```bash
   git commit -m "Add new feature"
   ```
4. Push:

   ```bash
   git push origin feature/new-feature
   ```
5. Open a Pull Request

**Accessibility requirements for PRs:**

* Keyboard accessible interactions
* Proper ARIA roles/labels
* Screen reader checks
* Contrast compliance
* Respect focus order & visible focus states

---

## 📄 License

MIT

---

<div align="center">

**Made with ❤️ for an inclusive digital world**

</div>
```
