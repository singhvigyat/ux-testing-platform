# Argus

## What It Does

Submit any website URL. The system:

1. 📸 **Captures screenshots** using Playwright (desktop, mobile, full-page)
2. 🤖 **Runs 4 AI persona agents** using Google Gemini Vision:
   - **Margaret, 68** — Elderly non-technical user
   - **Alex, 27** — Software developer
   - **Jordan, 32** — First-time visitor
   - **Sam, 45** — Low-vision / accessibility user
3. 📊 **Aggregates findings** and detects UX conflicts between personas
4. 🎯 **Displays a structured report** with issues, conflicts, and recommendations

## What Makes It Different

Traditional UX tools (Hotjar, Maze, axe-core) are rule-based or analytics-driven. This system uses **AI-native visual reasoning** — each agent looks at the real screenshot and thinks as a specific human user would.

Key innovations:
- Visual reasoning over screenshots (not DOM analysis)
- Multiple persona agents with distinct perspectives
- Conflict detection: "Expert users find this intuitive, but elderly users are confused"

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Screenshot capture | Playwright (Chromium) |
| AI Vision | Google Gemini 2.0 Flash (`@google/genai` SDK) |

## Project Structure

```
ux-tester-platform/
├── frontend/             # React + Vite + TypeScript
│   └── src/
│       ├── pages/        # HomePage, ReportPage
│       ├── components/   # UI components
│       ├── services/     # API client
│       └── types/        # TypeScript types
│
├── backend/              # Node.js + Express
    └── src/
        ├── agents/       # Persona configs + analyzer
        ├── aggregator/   # Report builder + conflict detection
        ├── ai/           # Gemini vision service
        ├── controllers/  # Route handlers
        ├── crawler/      # Playwright screenshot service
        ├── routes/       # Express routes
        └── types/        # TypeScript types

```

## Setup

### Prerequisites

- Node.js 18+
- A Google Gemini API key (free — get one at https://aistudio.google.com/apikey)
- A Google Cloud OAuth Client ID (free — see **Google Sign-In** below)

### 1. Clone / Navigate

```bash
cd ux-tester-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
npx playwright install chromium

# Copy environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Configure Environment

Edit `backend/.env`:

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
SESSION_SECRET=replace-with-a-long-random-string
DAILY_ANALYSIS_LIMIT=3
GLOBAL_DAILY_LIMIT=40
FRONTEND_URL=http://localhost:5173
```

### Google Sign-In (free, including strangers)

Google does not charge per login. Anyone with a Google account can sign in once the OAuth consent screen is **published**.

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a project (or pick one), then **Create credentials → OAuth client ID → Web application**
3. Authorized JavaScript origins:
   - `http://localhost:5173`
   - your Vercel URL, e.g. `https://your-app.vercel.app`
4. Copy the Client ID into `GOOGLE_CLIENT_ID` (no client secret needed for this flow)
5. OAuth consent screen:
   - User type: **External**
   - Scopes: `email`, `profile`, `openid` (non-sensitive)
   - Click **Publish app**. While it stays in **Testing**, only 100 emails you add can sign in. After you publish, any Google account can sign in. Google verification is not required for these basic scopes.

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Each Google account gets `DAILY_ANALYSIS_LIMIT` readings per UTC day (default 3). `GLOBAL_DAILY_LIMIT` caps the whole server so Gemini quota cannot be drained.

### 5. Run

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser. Sign in with Google, then submit a URL.

### 6. Deploy

**Frontend → Vercel:**
```bash
cd frontend
npx vercel
```
Set `VITE_API_URL` to your backend URL (no trailing slash). Add the Vercel origin to the Google OAuth client's Authorized JavaScript origins.

**Backend → Render:**
- Root directory: `backend`
- Build: `npm install && npx playwright install chromium && npm run build`
- Start: `npm start`
- Env: `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `SESSION_SECRET`, `FRONTEND_URL` (your Vercel URL), `NODE_ENV=production`, `DAILY_ANALYSIS_LIMIT`, `GLOBAL_DAILY_LIMIT`

## API

### POST /api/analyze

Requires a signed-in Google session cookie.

```json
{ "url": "https://example.com" }
```

Response:
```json
{ "jobId": "uuid", "message": "Analysis started" }
```

### GET /api/analyze/:jobId

Returns the current job status and report (poll every 2-3 seconds until `status === 'complete'`).

## Architecture

```
URL Input → POST /api/analyze
    ↓
Playwright captures 3 screenshots
    ↓
4x Gemini Vision calls (seated per persona)
    ↓
Aggregator builds report + detects conflicts
    ↓
Frontend polls GET /api/analyze/:jobId
    ↓
React displays structured UX report
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Web client ID |
| `SESSION_SECRET` | ✅ | Random secret used to sign login cookies |
| `FRONTEND_URL` | Production | Vercel origin allowed by CORS, e.g. `https://your-app.vercel.app` |
| `DAILY_ANALYSIS_LIMIT` | Optional | Readings per Google account per UTC day (default 3) |
| `GLOBAL_DAILY_LIMIT` | Optional | Total readings per day for the whole server (default 40) |
| `PORT` | Optional | Backend port (default: 3001) |
| `VITE_API_URL` | Production | Frontend: Render backend URL, no trailing slash |

