# HFI Utility Center

## By MAKERs'

HFI Utility Center is a bilingual campus facility reservation and administration
application. It uses Next.js App Router, React, TypeScript, shadcn/ui (Radix primitives), Tailwind CSS, next-intl, React Hook Form, and Zod.

## Development

```bash
pnpm install
pnpm dev
```

The development server uses `http://localhost:3000` by default.

Environment variables:

- `NEXT_PUBLIC_API_BASE_URL` selects the backend used by the browser and
  defaults to `https://api.hfiuc.org`.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` enables the real Cloudflare Turnstile
  widget. Password login on localhost requires that site key to allow the
  `localhost` hostname; there is no development verification bypass.

Copy `.env.example` to `.env.local` and replace the example values when a real
backend or Turnstile widget is required.

## Architecture

- `src/app/` contains routes and feature-specific UI. Route pages coordinate
  data; large interactive views are split into named feature components.
- `src/app/globals.css` holds all global CSS: theme tokens, base element styles,
  and the feature sections inlined in the order they used to be imported. Prefer
  Tailwind utilities at the usage site; keep a rule here for state selectors,
  pseudo-elements, and media queries. Colocated CSS modules remain for
  route-specific styles.
- `src/lib/api/` contains the backend transport, endpoint functions, API types,
  and focused administrator resource/mutation hooks.
- `src/lib/locale.tsx` holds the shared locale context, imported by both routes
  and components.
- `src/lib/reservations/` contains pure reservation availability rules.
- `src/components/ui/` contains the shadcn/ui components used by
  public and administrator views.
- `src/messages/` contains the English and Simplified Chinese translation
  catalogs.

All application source lives under `src/`. Imports use the `@/*` alias, which
maps to `./src/*`.

The browser calls the configured backend directly. The API client targets
the existing response and payload contracts, including the occupied-interval
availability response.

## Quality Checks

```bash
pnpm format:check
pnpm typecheck
pnpm lint
pnpm build
```

Use `pnpm format` to format TypeScript and JavaScript configuration files.

## Deployment

The app deploys to Cloudflare Workers through OpenNext.

```bash
pnpm build:cf   # opennextjs-cloudflare build
pnpm preview    # build:cf, then opennextjs-cloudflare preview
pnpm upload     # build:cf, then opennextjs-cloudflare upload
pnpm deploy     # build:cf, then opennextjs-cloudflare deploy
```

`pnpm cf-typegen` regenerates `cloudflare-env.d.ts` from the Wrangler
configuration after the bindings change.
