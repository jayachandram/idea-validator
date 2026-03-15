# 💡 Idea Validator Pro — Complete Setup Guide

A production-grade AI startup idea validation platform with authentication, chat history, and thinking profile analysis.

---

## 🏗️ TECH STACK

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + React Router + Zustand | Fast SPA, simple global state |
| **Backend** | Node.js + Express | Lightweight, async-first |
| **Database** | MongoDB Atlas | Flexible schema, free tier, cloud-hosted |
| **Auth** | Firebase Auth + JWT | Google OAuth, Phone OTP, email/password |
| **AI** | Anthropic Claude API | Best-in-class reasoning for critique |
| **Email** | Nodemailer + Gmail SMTP | Free, reliable transactional email |
| **SMS/OTP** | Twilio | Industry standard for phone verification |
| **Cache/OTP** | Redis (Redis Cloud free) | Fast OTP storage, rate limiting |
| **Hosting** | Railway (backend) + Vercel (frontend) | Both have generous free tiers |

---

## 📋 STEP-BY-STEP SETUP (Do these in order)

---

### STEP 1 — MongoDB Atlas (Database)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new **free M0 cluster** (any region)
3. Go to **Database Access** → Add a database user (remember username + password)
4. Go to **Network Access** → Add IP `0.0.0.0/0` (allow all — fine for dev)
5. Go to **Connect** → Drivers → Copy the connection string
6. Replace `<password>` in the string with your DB user password
7. Paste into `MONGODB_URI` in backend `.env`

---

### STEP 2 — Firebase Project (Google Auth + Phone OTP)

1. Go to https://console.firebase.google.com
2. Create a new project (disable Google Analytics — not needed)
3. **Enable Authentication:**
   - Go to Authentication → Sign-in method
   - Enable **Google** (add your support email)
   - Enable **Phone** (no config needed)
   - Enable **Email/Password**
4. **Get Admin SDK credentials (for backend):**
   - Go to Project Settings (gear icon) → Service Accounts
   - Click "Generate new private key" → Download JSON
   - Copy values into backend `.env`:
     - `FIREBASE_PROJECT_ID` = project_id
     - `FIREBASE_CLIENT_EMAIL` = client_email
     - `FIREBASE_PRIVATE_KEY` = private_key (keep the \n characters)
5. **Get Web Config (for frontend):**
   - Go to Project Settings → Your Apps → Add Web App
   - Copy the firebaseConfig object values into frontend `.env`
6. **Add Authorized Domains:**
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add `localhost` and your production domain later

---

### STEP 3 — Anthropic API Key (AI Validation)

1. Go to https://console.anthropic.com
2. Create account → Go to API Keys → Create Key
3. Copy key into `ANTHROPIC_API_KEY` in backend `.env`
4. Fund your account — Claude API has pay-per-use pricing (~$0.003/1K tokens)

---

### STEP 4 — Gmail App Password (Email Verification)

1. Go to your Google Account → Security → 2-Step Verification (must be ON)
2. Go to https://myaccount.google.com/apppasswords
3. Create app password for "Mail" → copy the 16-char password
4. Fill in backend `.env`:
   - `EMAIL_USER` = your-gmail@gmail.com
   - `EMAIL_PASS` = the 16-char app password

---

### STEP 5 — Twilio (SMS OTP)

1. Go to https://console.twilio.com → Create free account
2. Get a free trial phone number (US number works globally)
3. Copy into backend `.env`:
   - `TWILIO_ACCOUNT_SID` = from Dashboard
   - `TWILIO_AUTH_TOKEN` = from Dashboard
   - `TWILIO_PHONE_NUMBER` = your Twilio number (e.g. +15551234567)
4. **Note:** Free trial requires verified numbers. To send to any number, upgrade to paid ($15 minimum).

---

### STEP 6 — Redis Cloud (OTP Cache)

1. Go to https://redis.com/try-free/
2. Create a free database (30MB — more than enough)
3. Copy the public endpoint + password
4. Format: `redis://default:<password>@<host>:<port>`
5. Paste into `REDIS_URL` in backend `.env`

> **Alternative:** Skip Redis for local dev — the code has an in-memory fallback that works fine for development. Just don't use it in production.

---

### STEP 7 — JWT Secrets

Generate two random secrets in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run twice — one for `JWT_SECRET`, one for `JWT_REFRESH_SECRET`.

---

## 🚀 RUNNING THE APP LOCALLY

### Backend
```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
# Server starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Fill in Firebase config values
npm install
npm start
# Opens http://localhost:3000
```

---

## 📁 PROJECT STRUCTURE

```
idea-validator-pro/
├── backend/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   ├── firebase.js       # Firebase Admin SDK
│   │   └── redis.js          # Redis client + fallback
│   ├── middleware/
│   │   └── auth.js           # JWT protect middleware + token utils
│   ├── models/
│   │   ├── User.js           # User schema with thinking profile
│   │   └── ChatSession.js    # Chat session + messages schema
│   ├── routes/
│   │   ├── auth.js           # Register, login, Google, phone OTP
│   │   ├── chat.js           # Sessions, messages, search
│   │   └── user.js           # Profile, thinking profile, dashboard
│   ├── services/
│   │   ├── aiService.js      # Anthropic chat + analysis
│   │   ├── emailService.js   # Nodemailer email templates
│   │   └── otpService.js     # Twilio SMS OTP
│   ├── server.js             # Express app entry point
│   ├── package.json
│   └── .env.example          # Copy to .env
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx         # Session list sidebar
    │   │   ├── MessageBubble.jsx   # Formatted chat messages
    │   │   └── ProtectedRoute.jsx  # Auth guard
    │   ├── hooks/
    │   │   ├── useAuthStore.js     # Zustand auth state
    │   │   └── useChatStore.js     # Zustand chat state
    │   ├── pages/
    │   │   ├── LoginPage.jsx       # Email + Google + Phone login
    │   │   ├── RegisterPage.jsx    # Registration
    │   │   ├── ChatPage.jsx        # Main chat interface
    │   │   └── DashboardPage.jsx   # Profile + thinking analysis
    │   ├── utils/
    │   │   ├── api.js              # Axios client with token refresh
    │   │   └── firebase.js         # Firebase web SDK
    │   ├── App.jsx                 # Routes
    │   └── index.js
    ├── package.json
    └── .env.example
```

---

## 🔐 HOW AUTH WORKS

```
EMAIL FLOW:
Register → hash password → save user → send verification email
→ user clicks link → verify token → JWT issued → logged in

GOOGLE FLOW:
Click Google → Firebase popup → get idToken → send to backend
→ verify with Firebase Admin → find/create user → JWT issued

PHONE FLOW:
Enter phone → backend sends SMS via Twilio → store OTP in Redis (10min TTL)
→ user enters OTP → verify → find/create user → JWT issued

JWT STRATEGY:
Access Token:  15 minute expiry (stored in memory + httpOnly cookie)
Refresh Token: 30 day expiry (httpOnly cookie only)
Auto-refresh:  Axios interceptor silently refreshes on 401
```

---

## 🧠 HOW THINKING PROFILE WORKS

Every time a user sends a message:
1. The message is stored in MongoDB with extracted metadata (keywords, category, thinking signals)
2. Every 10th user message triggers a full re-analysis
3. The AI reads ALL the user's messages across ALL sessions
4. Returns: dominant style, 6 trait scores, gaps, strengths, suggestions, themes
5. Stored on the User document and shown on the Dashboard

---

## 🌐 DEPLOYING TO PRODUCTION

### Backend → Railway
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
# Add all .env variables in Railway dashboard
```

### Frontend → Vercel
```bash
npm install -g vercel
cd frontend
vercel --prod
# Add REACT_APP_ env vars in Vercel dashboard
```

### After deploying:
1. Update `FRONTEND_URL` in backend `.env` to your Vercel URL
2. Update `REACT_APP_API_URL` in frontend `.env` to your Railway URL
3. Add your production domain to Firebase Authorized Domains
4. Add your production domain to MongoDB Network Access

---

## 📦 API REFERENCE

### Auth Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Email registration |
| GET | /api/auth/verify-email | Email verification |
| POST | /api/auth/login | Email login |
| POST | /api/auth/google | Google OAuth |
| POST | /api/auth/phone/send-otp | Send SMS OTP |
| POST | /api/auth/phone/verify-otp | Verify OTP + login |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Clear session |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/forgot-password | Send reset email |
| POST | /api/auth/reset-password | Set new password |

### Chat Endpoints (all protected)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/chat/sessions | List sessions |
| POST | /api/chat/sessions | Create session |
| GET | /api/chat/sessions/:id | Get session + messages |
| POST | /api/chat/sessions/:id/messages | **Send message → get AI reply** |
| PATCH | /api/chat/sessions/:id | Update (pin/rename/archive) |
| DELETE | /api/chat/sessions/:id | Delete session |
| GET | /api/chat/search?q=xxx | Full-text search |

### User Endpoints (all protected)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/user/profile | Full profile + stats |
| PATCH | /api/user/profile | Update profile |
| GET | /api/user/thinking-profile | AI thinking analysis |
| GET | /api/user/dashboard | Dashboard data |

---

## ⚡ ESTIMATED MONTHLY COSTS (at small scale)

| Service | Free Tier | Paid |
|---------|-----------|------|
| MongoDB Atlas | 512MB — enough for ~50K sessions | $57/mo M2 |
| Firebase | 50K auth users/month | $0.0055/user after |
| Anthropic | Pay per use | ~$5-15/mo at low volume |
| Twilio | $15 trial credit | ~$0.0075/SMS |
| Redis Cloud | 30MB free | $7/mo for 100MB |
| Railway | $5/mo hobby | Scales with usage |
| Vercel | Free for hobby | $20/mo pro |

**Total at low volume: ~$10-20/month**
