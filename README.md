# FinCoach Pro

A personal finance coaching web application that helps users track their budget, manage debt, build savings, and get AI-powered financial advice — built with Angular 17 (frontend) and Spring Boot 3.2 (backend).

---

## What the app does

| Feature | Description |
|---|---|
| **Financial Profile** | Enter monthly income, fixed/variable expenses, savings, and debt to receive a scored financial health report (A–F) |
| **Action Plans** | Automatically-generated smart goals (emergency fund, debt reduction, savings rate) based on your profile |
| **AI Chat** | Real-time chat with a French-language financial coach powered by OpenAI GPT-4o Mini (or built-in demo responses when no API key is configured) |
| **Market Data** | Live prices and 30-day charts for 34 instruments — indices, stocks, crypto, commodities, and forex via TwelveData |
| **Authentication** | Email/password with verification, plus OAuth2 sign-in via Google, Microsoft, and Apple |

---

## How to run locally

### Prerequisites

- Docker and Docker Compose
- (Optional) API keys for OpenAI and TwelveData

### 1. Clone the repository

```bash
git clone https://github.com/warlaxx/FinCoach-Pro.git
cd FinCoach-Pro
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the values you need:

```dotenv
# Database (required)
POSTGRES_DB=fincoach
POSTGRES_USER=fincoach
POSTGRES_PASSWORD=changeme

# Security (required)
JWT_SECRET=your-256-bit-base64-secret

# AI Chat (optional — app works without it using built-in demo responses)
OPENAI_API_KEY=sk-...

# Market data (optional — only needed for live prices on the Markets page)
TWELVEDATA_API_KEY=your-key

# OAuth2 providers (optional — email/password auth works without these)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

# Email (optional — verification emails are printed to the console if not set)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=noreply@example.com
MAIL_PASSWORD=
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true

# URLs
FRONTEND_URL=http://localhost:4200
```

### 3. Start the full stack

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Angular frontend | http://localhost:4200 |
| Spring Boot API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### 4. Run the frontend in development mode (optional)

```bash
cd frontend
npm install
npm start   # hot-reload on http://localhost:4200, proxies /api/* to localhost:8080
```

---

## Folder structure

```text
FinCoach-Pro/
├── backend/                           # Spring Boot 3.2 (Java 21) REST API
│   └── src/main/java/com/fincoach/
│       ├── config/                    # Security, CORS, AppConstants
│       ├── controller/                # REST endpoints
│       ├── dto/                       # Request / response objects
│       ├── model/                     # JPA entities
│       ├── repository/                # Spring Data repositories
│       ├── security/                  # JWT filter, OAuth2 handlers
│       ├── service/                   # Business logic
│       └── util/                      # Shared utilities
│
├── frontend/                          # Angular 17 SPA
│   └── src/app/
│       ├── core/
│       │   ├── guards/                # authGuard (route protection)
│       │   └── interceptors/          # JWT HTTP interceptor
│       ├── shared/
│       │   ├── config/                # app.config.ts — all UI constants
│       │   └── models/                # TypeScript interfaces
│       └── features/                  # Feature-based modules
│           ├── auth/                  # Auth service + all auth pages
│           │   ├── auth.service.ts
│           │   ├── login/
│           │   ├── register/
│           │   ├── auth-callback/
│           │   ├── email-confirmation/
│           │   ├── email-verified/
│           │   ├── forgot-password/
│           │   └── reset-password/
│           ├── dashboard/             # Dashboard component + service
│           ├── action-plan/           # Action plan component + service
│           ├── chat/                  # AI chat component + service
│           ├── markets/               # Markets + Landing page + TwelveData service
│           │   └── landing/
│           └── settings/              # Account settings + profile service
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_DB` | Yes | PostgreSQL database name |
| `POSTGRES_USER` | Yes | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `JWT_SECRET` | Yes | Base64-encoded 256-bit HMAC secret for JWT signing |
| `OPENAI_API_KEY` | No | OpenAI API key. Leave blank to run in demo mode |
| `TWELVEDATA_API_KEY` | No | TwelveData API key for live market data |
| `GOOGLE_CLIENT_ID` | No | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth2 client secret |
| `MICROSOFT_CLIENT_ID` | No | Microsoft OAuth2 client ID |
| `MICROSOFT_CLIENT_SECRET` | No | Microsoft OAuth2 client secret |
| `APPLE_CLIENT_ID` | No | Apple Sign In service ID |
| `APPLE_TEAM_ID` | No | Apple developer team ID |
| `APPLE_KEY_ID` | No | Apple Sign In key ID |
| `APPLE_PRIVATE_KEY` | No | Apple Sign In private key (PEM, newlines as `\n`) |
| `MAIL_HOST` | No | SMTP host. Omit to print emails to the console instead |
| `MAIL_PORT` | No | SMTP port (default: 587) |
| `MAIL_USERNAME` | No | SMTP login |
| `MAIL_PASSWORD` | No | SMTP password |
| `MAIL_SMTP_AUTH` | No | Enable SMTP authentication (default: `true`) |
| `MAIL_SMTP_STARTTLS` | No | Enable STARTTLS encryption (default: `true`) |
| `FRONTEND_URL` | No | Base URL for verification/reset email links (default: `http://localhost:4200`) |

---

## API overview

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Email/password signup |
| `POST` | `/api/auth/login` | — | Email/password login |
| `GET` | `/api/auth/verify-email?token=` | — | Verify email address |
| `GET` | `/api/auth/me` | JWT | Current user info |
| `PUT` | `/api/auth/profile` | JWT | Update name / change password |
| `POST` | `/api/auth/forgot-password` | — | Request password reset email |
| `POST` | `/api/auth/reset-password` | — | Reset password with token |
| `GET` | `/api/dashboard/{userId}` | JWT | Financial profile + action plans + stats |
| `POST` | `/api/profile` | JWT | Save financial profile (triggers score + action generation) |
| `GET` | `/api/actions/{userId}` | JWT | List action plans |
| `POST` | `/api/actions` | JWT | Create action plan |
| `PUT` | `/api/actions/{id}/status` | JWT | Update progress / status |
| `DELETE` | `/api/actions/{id}` | JWT | Delete action plan |
| `GET` | `/api/chat/{userId}` | JWT | Chat history |
| `POST` | `/api/chat` | JWT | Send message and receive AI reply |
| `DELETE` | `/api/chat/{userId}` | JWT | Clear chat history |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17, TypeScript 5.9, Chart.js 4, RxJS 7 |
| Backend | Java 21, Spring Boot 3.2, Spring Security, Spring Data JPA |
| Database | PostgreSQL 16 (schema managed by Flyway) |
| Auth | JWT (HMAC-SHA256) + OAuth2 OIDC (Google, Microsoft, Apple) |
| AI | OpenAI GPT-4o Mini (built-in demo mode requires no API key) |
| Market data | TwelveData REST API (free tier: 8 requests/min) |
| Containerisation | Docker, Docker Compose |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
