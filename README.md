# LG Loan Toolbox Hub

Central marketplace and launcher for loan origination tools.

Free accounts get every free tool. A single **Pro** subscription ($100/month)
unlocks every premium tool, which launch via SSO while staying independent
products under their own brands.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · Supabase · Stripe

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

### Environment variables

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. **Server only — bypasses RLS.** |
| `NEXT_PUBLIC_HUB_URL` | `http://localhost:3000` locally; the canonical origin in production |
| `HUB_SSO_SECRET` | Shared secret. Must match Strike Price exactly. |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same page |
| `STRIPE_WEBHOOK_SECRET` | Created when you add the webhook endpoint |
| `STRIPE_PRO_PRICE_ID` | The recurring $100/month price |

### Database

`supabase/schema.sql` is idempotent — run it in the Supabase SQL editor. It
creates the tables, indexes, `updated_at` triggers, RLS policies and the
`hub_pro_status` function, and promotes `daniel@lehmangrp.com` to admin
(run it *after* that account has signed up).

## Architecture

### Free vs Pro

There is no per-tool billing. `tools.monthly_price` is the single switch:

- `0` → free tool, available to every account
- `> 0` → Pro tool, unlocked by the Pro subscription

`isProTool()` in `lib/types.ts` is the only place that decision is made.

### Authorisation

Every paywall and ownership check is re-verified on the server. The UI hides
locked tools, but `/api/library` and `/api/sso/generate-token` never rely on
that — they re-check the session, the tool's published state, library
membership and Pro status on each call.

`isPro()` checks `current_period_end` as well as `status`, so a missed Stripe
webhook cannot leave a stale `active` row granting access forever.

Admin writes authorise in application code (`requireAdmin`) and *then* use the
service-role client, so they don't depend on how the `tools` RLS policies
happen to be written.

### SSO handoff

When a Pro user launches a Pro tool:

1. `POST /api/sso/generate-token` re-verifies session, library membership and Pro status.
2. It signs a JWT with `HUB_SSO_SECRET`, valid for **5 minutes**.
3. The browser opens `<tool.tool_url>?token=<jwt>`.

Token payload:

```json
{
  "userId": "<supabase uuid>",
  "email": "user@example.com",
  "name": "Jane Originator",
  "subscription": "pro",
  "tool": "strike-price",
  "iss": "lg-toolbox-hub",
  "jti": "<uuid>",
  "exp": 1234567890
}
```

The `tool` claim is derived from the tool's name via `toolSlug()`
("Strike Price" → `strike-price`). A tool's `tool_url` is its SSO entry
point, e.g. `https://strikeprice.com/sso`.

### Subscription validation (for Strike Price)

`POST /api/validate-subscription` answers "does this email have an active hub
Pro plan?" for Strike Price's middleware.

**This endpoint is not public.** It reports subscription status for an
arbitrary email, so it requires the shared secret and compares it in constant
time. Call it only from a trusted backend.

```bash
curl -X POST https://lgtoolbox.com/api/validate-subscription \
  -H "Authorization: Bearer $HUB_SSO_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
# -> { "pro": true, "current_period_end": "2026-10-20T00:00:00Z" }
```

`auth.users` is not exposed over PostgREST, so the lookup goes through the
`hub_pro_status` SECURITY DEFINER function, which is execute-revoked from
`anon` and `authenticated`.

## Stripe webhook

Point a Stripe webhook at `/api/stripe/webhook` and subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

The route reads the raw body (required for signature verification) and returns
500 on a handler fault so Stripe retries.

## Design system

Flat and editorial: Poppins (400/500/600), copper `#a26028` on `#f5f5f5`,
**square corners everywhere**, hairline dividers, negative tracking on
headings and positive tracking on eyebrows.

Tailwind 4 is CSS-first — the tokens in the `@theme` block of
`app/globals.css` *are* the config. There is deliberately no
`tailwind.config.ts`; v4 does not load one.

The radius scale is zeroed, so a stray `rounded-lg` can never soften the
aesthetic by accident.

> Note: this is **not** the same design system as the `lender-ui` package
> (ivory/clay, Anthropic Sans, rounded). The hub has its own language.

## Project layout

```
app/
  page.tsx                        landing
  signup/ login/                  auth
  auth/callback/                  email confirmation code exchange
  marketplace/ library/           browse and own tools
  admin/ upgrade/                 tool management, Stripe checkout
  api/
    tools/ tools/[id]/            CRUD (admin only for writes)
    library/                      add and remove
    stripe/checkout/ webhook/     billing
    sso/generate-token/           Pro tool handoff
    validate-subscription/        server-to-server check
components/                       header, tool-card, admin-tool-form, admin-tool-list
lib/
  env.ts                          lazy, validated env access
  auth.ts                         getUser / isAdmin / isPro / getViewer
  types.ts                        DB types, isProTool, toolSlug
  supabase/                       browser, server and service-role clients
proxy.ts                          session refresh and route guards
supabase/schema.sql               tables, RLS, triggers, hub_pro_status
```

### A note on `NEXT_PUBLIC_*`

`lib/env.ts` writes each public variable out as a literal
`process.env.NEXT_PUBLIC_FOO`. Next inlines these into the client bundle by
static analysis, so a dynamic `process.env[name]` lookup is **not** substituted
and reads as `undefined` in the browser. Keep them literal.
