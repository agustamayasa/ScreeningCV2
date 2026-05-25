# ScreeningCV2 (Rekruta)

AI-based CV Screening Assistant — automates recruitment by scanning Gmail for CV attachments, analyzing them against a job description using Google Gemini AI, and writing results to Google Sheets.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 15.5.0 |
| Frontend Language | JavaScript (React) | React 19.1.0 |
| Styling | Tailwind CSS | v4 |
| Animation | Framer Motion | 12.23.x |
| HTTP Client | Axios | 1.11.0 |
| Backend | FastAPI (Python) | latest |
| Backend Language | Python | 3.10+ |
| AI/ML | Google Gemini API (`google-generativeai`) | Gemini 2.5 Flash |
| PDF Extraction | pdfplumber | latest |
| Google APIs | google-api-python-client, google-auth-oauthlib, gspread | latest |
| Deployment | Vercel (serverless) | configured via `vercel.json` |
| License | MIT | Copyright 2025 Agus Tamayasa |

## Directory Structure

```
ScreeningCV2/
├── api/
│   └── index.py                   # Monolithic FastAPI backend (1,114 lines) — single Vercel serverless function
├── app/
│   ├── layout.js                  # Root layout with Geist fonts, title "Rekruta"
│   ├── globals.css                # Global CSS + Tailwind v4 import
│   ├── page.js                    # Marketing landing page (1,002 lines)
│   ├── page.module.css            # CSS modules for landing page (1,021 lines)
│   ├── icon.png                   # Favicon
│   └── screening/
│       └── page.js                # Main screening dashboard (2,512 lines)
├── public/
│   ├── logo.jpg, logo2.png        # Logo assets
│   ├── rekruta1.jpg               # Main branding image
│   ├── *.svg                      # UI icons
│   └── templates/
│       └── Template_Deskripsi_Pekerjaan.docx  # Downloadable JD template
├── .gitignore
├── LICENSE                        # MIT License
├── README.md                      # Documentation (Bahasa Indonesia)
├── package.json                   # Frontend dependencies (npm)
├── package-lock.json
├── next.config.mjs                # Next.js configuration
├── postcss.config.mjs             # PostCSS/Tailwind config
├── jsconfig.json                  # JS path aliases (@/ -> ./)
├── vercel.json                    # Vercel deployment rewrites
└── requirements.txt               # Python backend dependencies
```

## Architecture

### Backend: `api/index.py` (1,114 lines)

Single-file FastAPI application deployed as a Vercel serverless function. All routes prefixed with `/api/` and rewritten by `vercel.json`.

**API Endpoints:**

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/login` | GET | Initiates Google OAuth 2.0 flow |
| `/api/auth/callback` | POST | OAuth callback — exchanges code for credentials, stores in HTTP-only cookies |
| `/api/auth-status` | GET | Checks if valid auth cookie exists |
| `/api/logout` | POST | Clears auth cookies |
| `/api/set-screening-config` | POST | Saves job position name and email subject filters |
| `/api/get-screening-config` | GET | Returns current screening configuration |
| `/api/upload-job-description` | POST | Uploads and extracts text from a PDF job description |
| `/api/start-screening` | POST | Initiates CV screening with SSE streaming progress |
| `/api/get-results` | GET | Returns all screening results from Google Sheets |
| `/api/clear-results` | POST | Clears results from Google Sheets and Drive files |
| `/api/list-spreadsheets` | GET | Lists available spreadsheet results |

**Key Features:**

- **Auth Flow:** Google OAuth 2.0 with cookie-based session storage (httponly, secure, SameSite=Lax, 7-day expiry)
- **Google Services:** Creates Gmail, Drive, and Sheets service objects from cookie-stored credentials
- **Folder Management:** Auto-creates `AI Resume Screening > Screening - [Position] > CV` folder hierarchy in Google Drive
- **Spreadsheet Management:** Auto-creates/opens Google Sheets with 12-column headers, placed in the screening folder
- **PDF Text Extraction:** Uses `pdfplumber` for text extraction from binary PDF data
- **Gemini AI Analysis:** Sends JD + CV text to Gemini 2.5 Flash with a detailed Indonesian-language prompt, returns structured JSON with 12 fields (name, email, phone, education, strengths, weaknesses, risk factors, reward factors, overall fit score 0-100, justification)
- **Duplicate Detection:** MD5 hash based on filename + first 1000 characters of CV text, stored in `CV_Hash` column
- **Gmail Query Builder:** Builds Gmail search queries from user-configured email subjects with `has:attachment filename:pdf` filter; limited to 30 emails max
- **SSE Streaming:** Returns `StreamingResponse` with `text/event-stream`, sending real-time progress updates (init, query, processing, complete, error stages)

### Frontend: Next.js App Router

#### `app/page.js` — Landing Page (1,002 lines)

Marketing page with Hero, Features, About, Contact sections, and Footer. Contains inline sub-components (Navbar, HeroSection, FeaturesSection, etc.), scroll-based active section tracking via IntersectionObserver, and smooth scrolling.

#### `app/screening/page.js` — Screening Dashboard (2,512 lines)

Single `"use client"` component handling the entire application:

- Auth check on mount with loading spinner
- Configuration form (job position name + multiple email subjects)
- File upload with drag-and-drop support
- AI analysis trigger with SSE progress streaming (real-time progress bar with shimmer animation, checked/processed/skipped counters)
- Results table with: search, sort (by Name, Education, Score, Date), pagination (5/10/25/50 per page)
- Detailed candidate modal
- Stats summary (total CVs, high/medium match counts, average score)
- Google login/logout with state reset
- Clear results functionality

## Notable Patterns and Concerns

### Code Organization

- **Monolithic components:** The screening page is a single 2,512-line React component with no sub-components, custom hooks, or utility files extracted
- **No TypeScript:** Despite Next.js 15, the entire project uses plain JavaScript (`.js`/`.mjs`)
- **Mixed CSS approach:** Tailwind CSS v4 (most components), CSS Modules (landing page), and inline `<style jsx>` (animation keyframes)

### Production Concerns

1. **Global state in backend:** Screening configs (`job_description_text`, `job_position_name`, `email_subjects`) are stored in Python global variables. This is **not safe in a stateless serverless environment** — state can leak between concurrent users/requests.
2. **No tests:** Zero test files, no test frameworks, no CI/CD configuration
3. **No Python lockfile:** `requirements.txt` exists but has no pinned versions or hash verification
4. **Auth migration remnants:** Old file-based token storage functions (`clear_credentials()`, `check_auth_status()`, `load_credentials`, `save_credentials`) still exist but are unused by the main cookie-based flow

### Localization

All user-facing text, AI prompts, and documentation are in **Bahasa Indonesia**. The Gemini prompt instructs the AI in Indonesian with specific formatting rules.

## Development Activity

- **Repository:** `https://github.com/agustamayasa/ScreeningCV2.git`
- **Branch:** `main` (single-track development)
- **Author:** Agus Tamayasa
- **Last update:** 2025-11-04
- **Recent commits:** All recent commits are README refinements only
- **Pattern:** Single-developer project, no merge commits or branching activity
