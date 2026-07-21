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
```

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

Open http://localhost:5173 in your browser.

### 6. Deploy

**Frontend → Vercel:**
```bash
cd frontend
npx vercel
```
Set `VITE_API_URL` environment variable to your backend URL.

**Backend → Railway or Render:**
- Connect your Git repo
- Set environment variable: `GEMINI_API_KEY`
- Set build command: `npm run build`
- Set start command: `npm start`

## API

### POST /api/analyze

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
| `PORT` | Optional | Backend port (default: 3001) |

