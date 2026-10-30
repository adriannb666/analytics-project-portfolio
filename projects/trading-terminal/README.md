# Trading Research and Risk Terminal

A web application that brings trading plans, position sizing, pre-trade checks, trade journals, market briefings, and decentralized-exchange risk monitoring into one workspace.

**Source status:** sanitized snapshot of the existing `base44-assistant` repository, main commit `ccbeb3d74e5dec6764bcf51f468c2f45c840f36d`. The original private repository keeps its history. This copy contains source and entity schemas, with the deployment binding omitted.

## Scope

- React interface with reusable dashboard and terminal components.
- Trading-plan questionnaire, coherence rules, and plan generation.
- Position-sizing and staged-entry calculations.
- Pre-trade checklist and journal statistics.
- Backend monitoring logic for Hyperliquid and Lighter account/position data.
- Account management, authentication routes, and entity definitions.

**Stack:** JavaScript, TypeScript, React, Vite, Tailwind, Base44 SDK, React Query, Recharts.

## Run

```sh
cd projects/trading-terminal/source
npm ci
cp .env.example .env.local
# Set your own Base44 app configuration in .env.local.
npm run dev
```

The hosted backend requires your own authorized Base44 configuration. No account, position, trading, or user records are included. Publishing this source snapshot does not deploy the application. Runtime behavior and backend permissions have not been validated by this archival pass.
