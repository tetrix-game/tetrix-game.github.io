# Production API Integration Work Plan

**Created**: 2026-04-24  
**Status**: 🔴 In Progress  
**Priority**: High - Production tests failing

---

## 🎯 Objective

Fix API integration issues between the production frontend and backend services deployed on Railway. Currently, 19 of 23 Playwright tests are failing because API calls are not reaching the backend service.

---

## 📍 Project Locations

### Frontend (This Repository)
- **Path**: `/Users/tannerbrobers/dev/tetrix-game`
- **Service**: `tetrix-game-frontend-production`
- **URL**: `https://tetrix-game-frontend-production.up.railway.app/`
- **Tech**: React + TypeScript + Vite
- **Deployment**: Docker container on Railway

### Backend Repository
- **GitHub**: `https://github.com/tannerbroberts/tetrix-game-backend` (assumed)
- **Service**: Backend API
- **URL**: `https://humorous-education-production-b86a.up.railway.app`
- **Tech**: Node.js + Express + PostgreSQL
- **Deployment**: Nixpacks on Railway

---

## 🐛 Issues Identified

### 1. API Calls Returning HTML Instead of JSON
**Severity**: Critical  
**Impact**: All authentication, game state, and leaderboard features broken

**Symptoms**:
```
SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

**Affected Endpoints**:
- ❌ `/api/health` - Health check
- ❌ `/api/auth/register` - User registration
- ❌ `/api/auth/login` - User login
- ❌ `/api/auth/logout` - User logout
- ❌ `/api/game/state` - Game state load/save
- ❌ `/api/game/place-shape` - Shape placement
- ❌ `/api/leaderboard/public` - Public leaderboard
- ❌ `/api/leaderboard/user` - User leaderboard

**Root Cause**: Either:
1. Frontend not rebuilt after setting `VITE_API_URL` environment variable
2. CORS configuration blocking requests from frontend to backend
3. Backend service not running or accessible
4. Frontend routing intercepting `/api/*` calls

### 2. Registration Not Redirecting to /game
**Severity**: High  
**Impact**: Users can register but stay on login page

**Expected**: After registration → redirect to `/game`  
**Actual**: User stays on `/` (root page)

**Test Failures**:
- `auth-ui.spec.ts:32` - should register and redirect to game
- `auth-ui.spec.ts:63` - should logout and redirect to login page with leaderboard
- `production-auth.spec.ts:15` - should register, save game state, and verify server is source of truth

### 3. Error Messages Not Displaying
**Severity**: Medium  
**Impact**: Users don't see why login failed

**Test Failures**:
- `smoke-test.spec.ts:58` - should reject login with wrong password
- `smoke-test.spec.ts:73` - should reject login with non-existent account

**Expected**: Error message with text matching `/invalid/i`  
**Actual**: No error message displayed

### 4. Rate Limiting & Validation Not Working
**Severity**: Medium  
**Impact**: Security features not functioning

**Issues**:
- Email uniqueness check passing when should return 409 conflict
- Rate limiting not triggering on repeated requests
- Password reset token validation failing

---

## 🔍 Investigation Steps

### Step 1: Verify Environment Variables
```bash
cd /Users/tannerbrobers/dev/tetrix-game

# Check Railway environment variables for frontend service
railway variables --json

# Expected to see:
# VITE_API_URL=https://humorous-education-production-b86a.up.railway.app
```

### Step 2: Check Backend Service Health
```bash
# Test backend directly (bypass frontend)
curl https://humorous-education-production-b86a.up.railway.app/health

# Expected response:
# {"status":"ok","timestamp":"...","environment":"production"}
```

### Step 3: Test CORS Configuration
```bash
# Check CORS headers
curl -I -X OPTIONS \
  -H "Origin: https://tetrix-game-frontend-production.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  https://humorous-education-production-b86a.up.railway.app/api/auth/login

# Should see:
# Access-Control-Allow-Origin: https://tetrix-game-frontend-production.up.railway.app
# Access-Control-Allow-Credentials: true
```

### Step 4: Inspect Frontend Build
```bash
cd /Users/tannerbrobers/dev/tetrix-game

# Check if VITE_API_URL is baked into the build
npm run build
grep -r "humorous-education-production" dist/
# Should find the backend URL in compiled JS files
```

---

## 🔧 Required Fixes

### Fix 1: Rebuild Frontend with Correct API URL

**Location**: Railway dashboard → Frontend service → Settings

1. **Verify environment variable**:
   ```
   VITE_API_URL=https://humorous-education-production-b86a.up.railway.app
   ```

2. **Trigger rebuild**:
   - Option A: Push a commit to trigger automatic deployment
   - Option B: Manual redeploy from Railway dashboard
   - Option C: Use Railway CLI: `railway up`

3. **Verify build logs**:
   - Check that environment variable is available during build
   - Vite should show: `VITE_API_URL` in build output

### Fix 2: Configure Backend CORS

**Location**: Backend repository → `server.ts` or `app.ts` (CORS config)

**Required CORS settings**:
```typescript
app.use(cors({
  origin: [
    'https://tetrix-game-frontend-production.up.railway.app',
    'http://localhost:5173' // For local development
  ],
  credentials: true, // Allow cookies for session management
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Environment variable approach** (recommended):
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

**Railway env var**:
```
FRONTEND_URL=https://tetrix-game-frontend-production.up.railway.app
```

### Fix 3: Fix Redirect Logic After Registration

**Location**: `/Users/tannerbrobers/dev/tetrix-game/src/components/LoginOverlay.tsx` (or similar)

**Current behavior**: Registration completes but no redirect  
**Required behavior**: After successful registration → `navigate('/game')`

**Check these files**:
- `src/components/LoginOverlay.tsx`
- `src/components/AuthForm.tsx`
- `src/pages/Login.tsx`
- Any component handling registration

**Expected code pattern**:
```typescript
const handleRegister = async (username: string, email: string, password: string) => {
  try {
    const response = await api.register(username, email, password);
    // Should redirect to /game after successful registration
    navigate('/game');
  } catch (error) {
    // Show error message
    setError(error.message);
  }
};
```

### Fix 4: Improve Error Message Display

**Location**: Same as Fix 3 (authentication components)

**Required**: Display error messages from API failures

**Pattern to look for**:
```typescript
try {
  await api.login(email, password);
} catch (error) {
  // This should be displayed to the user
  setError(error.message); // ← Check this is working
}
```

---

## 📦 Publication Steps

### Local Testing First
```bash
cd /Users/tannerbrobers/dev/tetrix-game

# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Build with production API URL
VITE_API_URL=https://humorous-education-production-b86a.up.railway.app npm run build

# 3. Preview production build locally
npm run preview

# 4. Test in browser
# Navigate to http://localhost:4173
# Try to register/login and check browser console for errors
```

### Deploy to Railway (Frontend)

**Method 1: Git Push (Automatic)**
```bash
cd /Users/tannerbrobers/dev/tetrix-game

# Commit any changes
git add .
git commit -m "Fix: Configure production API URL and CORS"

# Push to trigger deployment
git push origin main

# Monitor deployment
railway logs --follow
```

**Method 2: Railway CLI (Manual)**
```bash
cd /Users/tannerbrobers/dev/tetrix-game

# Deploy current directory
railway up

# Check status
railway status

# View logs
railway logs
```

**Method 3: Railway Dashboard**
1. Go to Railway dashboard
2. Select frontend service
3. Click "Deploy" → "Redeploy"
4. Wait for build to complete

### Deploy Backend (If CORS Changes Needed)

**Locate backend repository first**:
```bash
# Find backend repository
find /Users/tannerbrobers/dev -name "tetrix-game-backend" -type d 2>/dev/null
# OR
ls -la /Users/tannerbrobers/dev/
```

**Once located**:
```bash
cd /Users/tannerbrobers/dev/tetrix-game-backend

# Make CORS changes
# Then commit and push
git add .
git commit -m "Fix: Add frontend URL to CORS whitelist"
git push origin main
```

---

## ✅ Verification & Testing

### Phase 1: Manual Smoke Test

**Access production site**:
```
https://tetrix-game-frontend-production.up.railway.app/
```

**Test checklist**:
- [ ] Page loads without console errors
- [ ] Login form visible
- [ ] Leaderboard visible on login page
- [ ] Register new user with unique email
- [ ] After registration, redirected to `/game`
- [ ] Game board loads
- [ ] Logout button works
- [ ] Login with same credentials works
- [ ] Game state persists after refresh

**Browser Console Checks**:
```javascript
// In browser console, verify API URL
// Should see requests going to humorous-education-production-b86a.up.railway.app
// NOT to tetrix-game-frontend-production.up.railway.app/api
```

### Phase 2: Automated Playwright Tests

**Run full test suite against production**:
```bash
cd /Users/tannerbrobers/dev/tetrix-game

# Run all tests
BASE_URL=https://tetrix-game-frontend-production.up.railway.app \
  npx playwright test

# Expected results:
# ✅ 23/23 tests passing (or close to it)
```

**Run specific test suites**:
```bash
# Test authentication flow
BASE_URL=https://tetrix-game-frontend-production.up.railway.app \
  npx playwright test tests/auth-ui.spec.ts

# Test production endpoints
BASE_URL=https://tetrix-game-frontend-production.up.railway.app \
  npx playwright test tests/production.spec.ts

# Test smoke tests
BASE_URL=https://tetrix-game-frontend-production.up.railway.app \
  npx playwright test tests/smoke-test.spec.ts

# Test production auth flow
BASE_URL=https://tetrix-game-frontend-production.up.railway.app \
  npx playwright test e2e/production-auth.spec.ts
```

**Test with headed browser (watch tests run)**:
```bash
BASE_URL=https://tetrix-game-frontend-production.up.railway.app \
  npx playwright test --headed --project=chromium
```

**Generate HTML report**:
```bash
npx playwright show-report
```

### Phase 3: API Endpoint Tests

**Test backend directly**:
```bash
# Health check
curl https://humorous-education-production-b86a.up.railway.app/health

# Public leaderboard (no auth required)
curl https://humorous-education-production-b86a.up.railway.app/api/leaderboard/public

# Test CORS preflight
curl -I -X OPTIONS \
  -H "Origin: https://tetrix-game-frontend-production.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  https://humorous-education-production-b86a.up.railway.app/api/auth/login
```

### Phase 4: Success Criteria

**All must pass**:
- ✅ Playwright tests: 23/23 passing
- ✅ Manual registration → redirects to game
- ✅ Manual login → redirects to game
- ✅ Game state loads after login
- ✅ Logout works and redirects to login
- ✅ No console errors about CORS or network failures
- ✅ API calls visible in Network tab going to backend URL
- ✅ Leaderboard loads data
- ✅ Error messages display for invalid credentials

---

## 📊 Test Results Tracking

### Baseline (Before Fixes)
**Date**: 2026-04-24  
**Results**: ❌ 4 passed, 19 failed

**Passing**:
- ✅ `auth-ui.spec.ts:15` - should show login page with leaderboard
- ✅ `auth-ui.spec.ts:92` - should not allow access to /game without login
- ✅ `auth-ui.spec.ts:104` - leaderboard should load data
- ✅ `smoke-test.spec.ts:15` - should hide game UI until logged in

**Failing** (grouped by category):

*Authentication Flow (6 tests)*:
- ❌ `auth-ui.spec.ts:32` - should register and redirect to game
- ❌ `auth-ui.spec.ts:63` - should logout and redirect to login page
- ❌ `production.spec.ts:97` - complete registration and login flow
- ❌ `production-auth.spec.ts:15` - register, save state, verify server truth
- ❌ `production-auth.spec.ts:60` - login existing user and load server state
- ❌ `production-auth.spec.ts:98` - reject unauthenticated access to game

*API Endpoints (7 tests)*:
- ❌ `production.spec.ts:5` - health check endpoint returns OK
- ❌ `production.spec.ts:15` - frontend loads successfully
- ❌ `production.spec.ts:26` - public leaderboard endpoint returns data
- ❌ `production.spec.ts:45` - registration endpoint validates input
- ❌ `production.spec.ts:76` - forgot password endpoint accepts email
- ❌ `production.spec.ts:90` - user leaderboard requires authentication
- ❌ `production.spec.ts:246` - game state requires authentication

*Leaderboard & Advanced Features (3 tests)*:
- ❌ `production.spec.ts:153` - authenticated user can access leaderboard
- ❌ `production.spec.ts:190` - rate limiting on user leaderboard endpoint
- ❌ `production.spec.ts:232` - password reset flow validates token

*Data Validation (2 tests)*:
- ❌ `production.spec.ts:251` - username must be unique
- ❌ `production.spec.ts:285` - email must be unique

*Smoke Tests (1 test)*:
- ❌ `smoke-test.spec.ts:26` - should successfully login and load game state
- ❌ `smoke-test.spec.ts:58` - should reject login with wrong password
- ❌ `smoke-test.spec.ts:73` - should reject login with non-existent account
- ❌ `smoke-test.spec.ts:89` - should successfully place a shape on the board

### After Fix 1 (Rebuild Frontend)
**Date**: _TBD_  
**Results**: _Run tests and update here_

### After Fix 2 (CORS Configuration)
**Date**: _TBD_  
**Results**: _Run tests and update here_

### After Fix 3 (Redirect Logic)
**Date**: _TBD_  
**Results**: _Run tests and update here_

### Final (All Fixes Applied)
**Date**: _TBD_  
**Results**: _Target: 23/23 passing_

---

## 🚨 Troubleshooting

### Issue: Tests still failing after rebuild

**Check 1: Is VITE_API_URL in the build?**
```bash
cd /Users/tannerbrobers/dev/tetrix-game
npm run build
grep -r "humorous-education" dist/assets/*.js
# Should find the backend URL
```

**Check 2: Are requests reaching backend?**
```bash
# Monitor backend logs during test run
railway logs --service=<backend-service-name> --follow
```

**Check 3: CORS headers present?**
```bash
curl -v https://humorous-education-production-b86a.up.railway.app/api/auth/login \
  -H "Origin: https://tetrix-game-frontend-production.up.railway.app"
# Look for Access-Control-Allow-Origin header
```

### Issue: Frontend not rebuilding

**Force rebuild**:
```bash
# Clear Railway build cache
railway service delete --service=<service-id>
railway up --force
```

### Issue: Backend not accessible

**Check Railway dashboard**:
1. Is backend service running?
2. Check backend logs for errors
3. Verify database connection
4. Check environment variables

**Test database connectivity**:
```bash
railway shell --service=<backend-service>
# Then in shell:
echo $DATABASE_URL
# Should see PostgreSQL connection string
```

---

## 📝 Notes

### Environment Variable Best Practices

**Frontend** (build-time):
```bash
VITE_API_URL=https://humorous-education-production-b86a.up.railway.app
```
- Must be set BEFORE build
- Gets baked into `dist/` files
- Requires rebuild to change

**Backend** (runtime):
```bash
FRONTEND_URL=https://tetrix-game-frontend-production.up.railway.app
DATABASE_URL=postgresql://...
SESSION_SECRET=...
NODE_ENV=production
```
- Can be changed without rebuild
- Takes effect on restart

### Key Files Reference

**Frontend**:
- `src/api/client.ts:47` - API base URL configuration
- `playwright.config.ts:22` - Test base URL configuration
- `tests/production.spec.ts` - Production API tests
- `tests/auth-ui.spec.ts` - Authentication UI tests
- `tests/smoke-test.spec.ts` - Basic smoke tests
- `e2e/production-auth.spec.ts` - Production auth E2E tests

**Backend** (need to verify):
- `server.ts` or `app.ts` - CORS configuration
- `routes/auth.ts` - Authentication endpoints
- `routes/game.ts` - Game state endpoints
- `routes/leaderboard.ts` - Leaderboard endpoints

---

## ✨ Success Definition

**This work is COMPLETE when**:
1. ✅ All 23 Playwright tests pass against production URL
2. ✅ Manual registration flow works end-to-end
3. ✅ Manual login flow works end-to-end
4. ✅ Game state persists across page refreshes
5. ✅ No CORS errors in browser console
6. ✅ No 404 errors for API calls in Network tab
7. ✅ Error messages display correctly for invalid input
8. ✅ API calls visible in backend logs

**Final verification command**:
```bash
cd /Users/tannerbrobers/dev/tetrix-game
BASE_URL=https://tetrix-game-frontend-production.up.railway.app npx playwright test --reporter=html
```

**Expected output**:
```
Running 23 tests using 1 worker

  ✓  [chromium] › tests/auth-ui.spec.ts (5 tests) - 45s
  ✓  [chromium] › tests/production.spec.ts (13 tests) - 120s
  ✓  [chromium] › tests/smoke-test.spec.ts (5 tests) - 60s

  23 passed (225s)
```

---

**Document maintained by**: Claude Code  
**Last updated**: 2026-04-24  
**Next review**: After each fix is applied
