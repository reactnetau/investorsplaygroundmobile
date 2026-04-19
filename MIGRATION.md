# Investors Playground — Migration Notes

## Overview

This document describes the migration from the original `investorsplayground.com` Next.js app to:

- **Backend**: `investorsplaygroundbackend` — AWS Amplify Gen 2 (TypeScript)
- **Mobile**: `investorsplaygroundmobile` — Expo React Native (TypeScript)

---

## Architecture

### Original (Next.js)
```
Next.js 15 + Prisma + PostgreSQL
NextAuth.js (credentials, JWT)
Stripe one-off payment
Yahoo Finance (server-side price fetching)
Railway deployment
```

### New (Amplify + Expo)
```
AWS Amplify Gen 2 (AppSync GraphQL + Cognito + DynamoDB + Lambda)
Expo / React Native mobile app
Stripe one-off payment (via Lambda + Checkout)
Yahoo Finance (fetched in Lambda, cached in DynamoDB)
EAS Build for mobile
```

---

## Model Mapping

| Prisma Model | Amplify Data Model | Notes |
|---|---|---|
| `User` | `UserProfile` | Cognito handles identity/auth; UserProfile extends with `plan`, `currency`, `stripeCustomerId` |
| `Portfolio` | `Portfolio` | Direct port; `activeProfileId` replaced by client-side state |
| `Holding` | `Holding` | Direct port; added `owner` field for Amplify owner auth |
| `Price` | Lambda-only DynamoDB table (`PriceCache`) | Not exposed via AppSync; written/read by Lambda functions only |

**Dropped fields:**
- `User.passwordHash`, `User.salt`, `User.resetToken`, `User.resetTokenExpiry` — Cognito handles auth and password resets natively
- `User.activeProfileId` — handled client-side in mobile app state

---

## Custom Mutations / Queries

| Operation | Type | Lambda | Notes |
|---|---|---|---|
| `initializeUserProfile` | mutation | `create-user-profile` | Called after Cognito sign-up to create UserProfile |
| `createPortfolio` | mutation | `create-portfolio` | Enforces free-plan 1-portfolio limit |
| `buyHolding` | mutation | `buy-holding` | Validates cash balance + free-plan 5-holding limit |
| `sellHolding` | mutation | `sell-holding` | Calculates P&L, restores cash |
| `resetPortfolio` | mutation | `reset-portfolio` | Deletes all holdings, resets cash to `startingCash` |
| `fetchPrice` | query | `fetch-price` | Yahoo Finance lookup with 24h DynamoDB cache |
| `refreshPrices` | mutation | `refresh-prices` | Batch refresh all holdings' `currentPrice` in a portfolio |
| `stripeCreateCheckout` | query | `stripe-checkout` | Stripe one-off Checkout session (mode: `payment`) |

Stripe webhook is exposed via a separate HTTP API Gateway endpoint, not AppSync.

---

## Required Amplify Secrets

Set these via `npx ampx secret set <name>` before deploying:

| Secret | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_...) |
| `STRIPE_PRICE_ID` | Stripe Price ID for the Pro one-off payment |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_...) |

---

## Required Environment Variables (Non-Secret)

Set `APP_URL` in the backend build environment (e.g. `investorsplayground://` for mobile deep links, or `https://investorsplayground.com` for web):

```bash
APP_URL=investorsplayground://
```

---

## Local Development Commands

### Backend
```bash
cd investorsplaygroundbackend
yarn install
yarn sandbox              # starts Amplify sandbox, writes amplify_outputs.json to ../investorsplaygroundmobile
```

### Mobile
```bash
cd investorsplaygroundmobile
yarn install
# Copy amplify_outputs.json from backend after running sandbox
yarn start                # Expo dev server
yarn ios                  # Run on iOS simulator
yarn android              # Run on Android emulator
```

---

## Deployment Commands

### Backend
```bash
cd investorsplaygroundbackend

# Set secrets (once per environment):
npx ampx secret set STRIPE_SECRET_KEY
npx ampx secret set STRIPE_PRICE_ID
npx ampx secret set STRIPE_WEBHOOK_SECRET

# Deploy (from CI/CD):
yarn deploy
```

### Mobile (EAS Build)
```bash
cd investorsplaygroundmobile
eas build --profile preview --platform all     # Preview build
eas build --profile production --platform all  # Production build
eas submit --platform ios                      # Submit to App Store
eas submit --platform android                  # Submit to Play Store
```

---

## Stripe Setup

1. Create a **one-off Price** in Stripe Dashboard (not recurring). Note the Price ID.
2. Set it as the `STRIPE_PRICE_ID` Amplify secret.
3. After deploying, copy the **StripeWebhookUrl** stack output from CloudFormation.
4. Add it to Stripe Dashboard → Webhooks → Add Endpoint.
5. Subscribe to events: `checkout.session.completed`, `checkout.session.async_payment_failed`

---

## Known Gaps / TODOs

| Gap | Notes |
|---|---|
| **Cron price refresh** | Original Next.js app had a Railway cron that refreshed all prices daily at 7 UTC. In the Amplify version, users refresh prices manually via the "Refresh" button in HoldingsScreen. A scheduled EventBridge rule can be added to call a separate Lambda if daily background refresh is needed. |
| **Email notifications** | Original app sent admin emails on upgrade (Gmail API). Not ported — can be added via SES in the Stripe webhook Lambda. |
| **Support form** | Original `/support` page sent emails via Gmail. Not ported to mobile. |
| **Marketing pages** | Home, pricing, how-it-works, paper trading guide, ASX vs NASDAQ pages are web-only and not included in the mobile app. |
| **FX rate conversion** | Original app cached AUDUSD/USDINR FX rates for portfolio value in base currency. The mobile app shows values in each holding's native currency. Full FX conversion can be added to `refresh-prices` Lambda. |
| **Yahoo Finance rate limits** | Yahoo Finance has unofficial rate limits. For production, consider a paid market data API (e.g. Polygon.io) or add exponential backoff to the Lambda functions. |
| **App icon** | Placeholder path `src/assets/icon.png` — replace with the actual Investors Playground logo. |
| **Partial sell** | Sell screen supports partial quantity input, and the Lambda handles it, but the current UX defaults to "sell all". Refine if needed. |

---

## Design System Mapping

| Web (CSS variable / Tailwind) | Mobile (theme/index.ts) |
|---|---|
| `--accent: #22c55e` | `colors.primary` |
| `--accent-dark: #16a34a` | `colors.primaryDark` |
| `--app-bg: #f9fafb` | `colors.background` |
| `--surface-strong: #ffffff` | `colors.surface` |
| `--surface-muted: #eef7f1` | `colors.surfaceSecondary` |
| `--ink-strong: #0f172a` | `colors.text` |
| `--ink-soft: #475569` | `colors.textSecondary` |
| `--ink-muted: #64748b` | `colors.textMuted` |
| `--danger: #ef4444` | `colors.error` |
| `--good: #16a34a` | `colors.gain` |
| `--bad: #dc2626` | `colors.loss` |
| `.theme-panel` (rounded-[28px]) | `globalStyles.panel` (borderRadius: 28) |
| `.theme-card` (rounded-3xl) | `globalStyles.card` (borderRadius: 24) |
| `.theme-button-primary` | `globalStyles.primaryButton` |
| `.theme-kicker` | `globalStyles.kicker` |
