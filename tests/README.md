# E2E Tests

This directory contains Playwright end-to-end tests for the Tetrix game frontend.

## Test Files

- **`auth-ui.spec.ts`** - UI tests for authentication flows (login, register, logout)
- **`smoke-test.spec.ts`** - Critical path smoke tests (login, game state loading, shape placement)
- **`production.spec.ts`** - Production deployment tests (health checks, API validation, rate limiting)

## Running Tests

### Local Development Tests
```bash
npm run test:e2e              # Run all tests against local dev server
npm run test:e2e:ui           # Run tests in Playwright UI mode
```

### Production Smoke Tests
```bash
npm run test:smoke            # Run smoke tests against production
npm run test:smoke:headed     # Run smoke tests with browser visible
npm run test:production       # Run full production test suite
```

## Configuration

- **Playwright config**: `../playwright.config.ts`
- **Local tests**: Automatically start dev server on `http://localhost:5173`
- **Production tests**: Use `BASE_URL` environment variable to target production deployment
- **Test directory**: All tests must be in `tests/` folder
- **Workers**: Set to 1 to avoid rate limiting issues with production tests

## Notes

- Tests run sequentially (not in parallel) to avoid API rate limits
- Production tests use real API endpoints via `VITE_API_URL` configuration
- Smoke tests verify critical paths: authentication, game state loading, and shape placement
- Production tests include API contract validation and security checks
