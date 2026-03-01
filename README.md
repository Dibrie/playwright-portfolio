# FinTrack — Full Stack Playwright Portfolio

A personal finance dashboard application built as a full stack portfolio project, demonstrating end-to-end test automation with Playwright.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Testing | Playwright (TypeScript) |
| DevOps | Docker Compose, GitHub Actions |

## Project Structure

```
playwright-portfolio/
├── fintech-dashboard/     # React frontend + Node/Express backend
├── playwright-tests/      # Playwright end-to-end test suite
└── docker-compose.yml     # Orchestrates all services
```

## Running Locally

**Prerequisites:** Docker Desktop

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/playwright-portfolio.git
cd playwright-portfolio

# Start all services
npm run docker:up
```

The app will be available at `http://localhost:5173`.

## Running the Tests

**Prerequisites:** Node.js, Playwright browsers installed

```bash
# Install dependencies (first time only)
cd playwright-tests
npm install
npx playwright install

# Run the full test suite
npx playwright test

# Run a specific spec file
npx playwright test tests/specs/auth.spec.ts

# Open the HTML report after a run
npx playwright show-report
```

## Test Suite

The Playwright suite covers:

- **Auth** — login, registration, logout, token handling, route guards
- **Dashboard** — summary cards, spending chart, recent transactions
- **Transactions** — search, filtering, sorting, pagination, CSV export
- **Profile** — account updates, password change, account deletion

Tests use the Page Object Model pattern with shared fixtures and API-seeded test data for isolation.

## Todo

- [ ] Add npm scripts at root level for running tests (`npm test`)
- [ ] Expand Playwright suite coverage
- [ ] Add visual regression tests