# Tetrix Game

A modern, ad-free block puzzle game built with React, TypeScript, and Vite. Place shapes on a 10×10 grid, clear lines, and beat your high score!

> **🔗 Related Repository**: This is the frontend app. The backend API is at [tetrix-game-backend](https://github.com/tannerbroberts/tetrix-game).
> Both repositories are deployed separately on Railway and work together to provide the complete game experience.

## 🌱 For Mom

I'm building this for my mom, who was caught red-handed, multiple times, playing an ad with a game attached. You heard me right—she was playing an **AD with a game attached**. This is that game, minus the ads. ❤️

📫 How to reach me: tannerbroberts@gmail.com

---

## Features

- 🎮 **Block Puzzle Gameplay**: Drag and drop Tetris-style shapes onto a 10×10 grid
- 🏆 **Leaderboard**: Compete with other players for the top score
- 💾 **Cloud Save**: Your progress syncs across devices via backend API
- 🎨 **Smooth Animations**: Polished UI with Material-UI and custom animations
- 🔐 **User Accounts**: Secure authentication with email/password
- 📱 **PWA Ready**: Install on mobile devices for offline play
- 🚀 **Railway Deployment**: Deployed as Docker container on Railway

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.x for fast development
- **UI Library**: Material-UI (MUI) 7.x
- **State Management**: React hooks + Context API
- **Styling**: CSS Modules + MUI styled components
- **Testing**: Playwright for E2E tests
- **Deployment**: Docker + Railway

## Quick Start

### Prerequisites

- Node.js 20+ installed
- Backend API running (see [tetrix-game-backend](https://github.com/tannerbroberts/tetrix-game-backend))

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables (if needed)
cp .env.example .env.local

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Railway Deployment

This app is deployed on Railway as a **separate frontend service** alongside the backend API. The frontend serves the React SPA while the backend handles authentication and game state.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Railway Project                          │
├──────────────────────┬──────────────────────┬────────────────┤
│   Frontend Service   │   Backend Service    │   PostgreSQL   │
│   (this repo)        │   (tetrix-backend)   │   Database     │
│                      │                      │                │
│   Port: 3000         │   Port: 3000         │   Port: 5432   │
│   Type: Docker       │   Type: Nixpacks     │   Managed DB   │
│                      │                      │                │
│   Serves: React SPA  │   Serves: REST API   │   Stores:      │
│   via serve          │   via Express        │   - Users      │
│                      │                      │   - Sessions   │
│                      │                      │   - Game State │
└──────────────────────┴──────────────────────┴────────────────┘
         │                       │                      │
         │                       │                      │
         └───── CORS ────────────┘                      │
         │      cookies                                 │
         │                                              │
         └────────── DATABASE_URL ─────────────────────┘
```

### Production URLs

- **Frontend**: Serves the React app (this service)
- **Backend**: `https://humorous-education-production-b86a.up.railway.app` (API endpoints)
- **Database**: PostgreSQL managed by Railway (accessed by backend)

### Setup

#### 1. Create Railway Project

```bash
# Login to Railway
railway login

# Link this repository to a service
railway link

# Or create new service from dashboard
# Go to Railway → New → GitHub Repo → Select tetrix-game
```

#### 2. Configure Frontend Service

**Environment Variables** (optional, set in Railway dashboard):

```bash
# API URL (if not using default)
VITE_API_URL=https://your-backend-service.up.railway.app
```

**Railway Configuration** (`railway.json`):

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Dockerfile** (multi-stage build):

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build:prod

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD sh -c "serve -s dist -l ${PORT:-3000}"
```

**Key Features**:
- Multi-stage build reduces image size
- Uses `serve` to serve static files with SPA fallback
- Respects Railway's `PORT` environment variable

#### 3. Deploy

```bash
# Deploy via GitHub push (recommended)
git push origin main

# Railway auto-deploys when detecting push to main branch

# Or deploy manually from local
railway up

# View logs
railway logs
```

### Deployment Flow

1. **Push to GitHub** → Triggers Railway webhook
2. **Railway builds** → Docker multi-stage build
   - Stage 1: `npm install` + `npm run build:prod`
   - Stage 2: Copy dist files + install `serve`
3. **Railway starts** → `serve -s dist -l $PORT`
4. **React app ready** → Accessible at Railway-assigned URL

### Environment Variables Reference

| Variable | Purpose | Set By | Required |
|----------|---------|--------|----------|
| `PORT` | Server port | Railway (auto) | ✅ |
| `VITE_API_URL` | Backend API URL | Manual (optional) | ❌ |

**Note**: API calls default to relative URLs, which works when CORS is configured on the backend to allow the frontend origin.

### Continuous Deployment

Railway automatically deploys when:
1. New commits pushed to `main` branch on GitHub
2. Environment variables changed in dashboard
3. Manual deploy triggered via CLI or dashboard

**Build Cache**: Docker layer caching speeds up subsequent builds.

### Monitoring & Debugging

```bash
# View frontend service logs
railway logs

# Check service status
railway status

# Open Railway dashboard
railway open

# Access production shell
railway shell
```

### Troubleshooting

**Build Failures**:
```bash
# Check build logs
railway logs | grep build

# Verify Dockerfile syntax
docker build -t tetrix-test .
```

**CORS Issues**:
- Ensure backend `FRONTEND_URL` env var matches frontend Railway URL
- Check backend CORS configuration in `src/index.ts`

**Session/Cookie Issues**:
- Frontend and backend must be on same top-level domain for cookies
- Or backend must set `sameSite: 'none'` with `secure: true`

**Deployment Stuck**:
```bash
# Cancel and retry
railway service delete <service-id>
railway up --service <service-id>
```

## Project Structure

```
src/
├── App/                    # Root app component with routing
├── AuthProvider/           # Authentication context
├── GamePage/               # Main game screen (protected route)
├── LoginPage/              # Login/register screen
├── Grid/                   # Game board (10×10 grid)
├── DraggingShape/          # Shape drag-and-drop overlay
├── ShapeSelector/          # Shape queue display
├── Header/                 # Top bar with user info
├── api/
│   └── client.ts           # API client (fetch wrapper)
├── hooks/
│   └── useShapePlacement/  # Shape placement logic
├── models/
│   └── types.ts            # TypeScript type definitions
└── utils/
    └── shapes.ts           # Shape generation utilities

e2e/                        # Playwright E2E tests
├── authentication.spec.ts  # Auth flow tests
├── complete-placement-game-over.spec.ts
├── game-over-bug.spec.ts
└── production-auth.spec.ts # Production smoke tests
```

## API Integration

The frontend communicates with the backend via REST API:

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create user account |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/logout` | POST | End session |
| `/api/auth/me` | GET | Get current user |
| `/api/game/state` | GET | Load game state |
| `/api/game/state` | POST | Save game state |
| `/api/game/place-shape` | POST | Validate and place shape |
| `/api/leaderboard/public` | GET | Get top players |

### API Client (`src/api/client.ts`)

```typescript
// All requests include credentials (cookies)
fetch(url, {
  credentials: 'include',  // Send session cookie
  headers: {
    'Content-Type': 'application/json'
  }
})
```

**Authentication Flow**:
1. User logs in → Backend creates session → Sets `tetrix.sid` cookie
2. Frontend stores nothing in localStorage (session-only)
3. All API requests include cookie automatically
4. Backend validates session on protected routes

## Development

### Adding New Features

1. **UI Components**: Add to `src/` with TypeScript + MUI
2. **API Calls**: Add to `src/api/client.ts`
3. **State Management**: Use React hooks + Context
4. **Routing**: Update `src/App/index.tsx`

### Testing

```bash
# Run specific test file
npx playwright test e2e/authentication.spec.ts

# Run with headed browser
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### Building for Production

```bash
# Production build (minified, tree-shaken)
npm run build:prod

# Analyze bundle size
npx vite-bundle-visualizer
```

## Security

- ✅ Session-based authentication (no JWT in localStorage)
- ✅ HTTP-only cookies prevent XSS attacks
- ✅ CORS configured for trusted origins only
- ✅ Input validation on both frontend and backend
- ✅ HTTPS enforced in production (Railway default)

## Performance

- ⚡ Vite for fast dev server and HMR
- ⚡ React.memo for expensive components
- ⚡ Code splitting via React.lazy
- ⚡ Docker multi-stage build for smaller images
- ⚡ `serve` with gzip compression enabled

## License

MIT

---

Made with ❤️ for mom
