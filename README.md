# CredLayer Lending Desk (demo)

A single-page lending desk where a lender enters a borrower's wallet address and the app
retrieves that wallet's **live CredLayer trust score** before showing an illustrative
lending decision. No mock scores are used anywhere.

## Architecture

- **TanStack Start (React 19 + TypeScript + Tailwind CSS v4)** — this project's fixed stack.
  The brief mentioned Next.js; the equivalent here is a TanStack **server function**
  instead of a Next.js API route. Behaviour is identical: the call happens on the server.
- `src/lib/credlayer.functions.ts` — `checkBorrower`, a server-only function that validates
  the wallet, calls CredLayer, normalises the score and applies the demo threshold.
- `src/routes/index.tsx` — the lending dashboard UI (verification form, borrower profile,
  demo decision, loan request, session request list).

Flow: browser → `checkBorrower` (server) → CredLayer → real score → demo decision.

## How CredLayer is used

```
GET {CREDLAYER_BASE_URL}/scores/{wallet}
Headers: X-API-Key: <server-side key>, Accept: application/json
```

The score is read from the response (`data.trustScore`, with fallbacks for `score`,
`trust_score`, etc.). Every other field CredLayer returns is displayed as-is, plus the
full raw JSON — no fields are invented.

## Environment setup

Copy `.env.example` and set the values (in Lovable these are stored as project secrets):

| Variable | Purpose |
| --- | --- |
| `CREDLAYER_API_KEY` | Server-side API key. Required. |
| `CREDLAYER_BASE_URL` | Defaults to `https://ideal-unity-production-3165.up.railway.app/api/v1` |
| `CREDLAYER_MIN_SCORE` | Demo eligibility threshold, default `600` |

## Running

```
bun install
bun run dev
```

## Security considerations

- The key is read with `process.env` **inside the server handler only**; it is never
  bundled into client code, never placed in a URL, and never logged.
- No `VITE_`/`NEXT_PUBLIC_` variant of the key exists.
- `.env*` files are git-ignored; `.env.example` contains no secret.
- Wallet input is validated server-side before the outbound request.

## Demo lending decision

Purely illustrative — not credit underwriting. If CredLayer returns a numeric score:

- `score >= CREDLAYER_MIN_SCORE` → "Eligible for demo loan"
- otherwise → "Not eligible for demo loan"

The threshold lives in the backend and is passed to the UI with the result. If no numeric
score is returned, no decision is shown. Loan requests are kept in browser session state
only; no funds move.

## Example API response (real, test wallet)

```json
{
  "success": true,
  "data": {
    "address": "8A7FbUBoWzwajELuxCX6QTGA6HtJYaxrs3LtUP78a172",
    "trustScore": 500,
    "trustLevel": "low",
    "riskLevel": "medium",
    "confidence": 0.0,
    "fraudProbability": 0.5,
    "network": "solana",
    "explanation": "ML service connection error to http://127.0.0.1:8001/... (All connection attempts failed)"
  },
  "message": null
}
```

## Known limitations / findings

- The documented base URL `.../api/v1/api-keys` returns **404**; the working path is
  `.../api/v1/scores/{wallet}`. The app uses the working path.
- **CredLayer currently returns the same score (500) for every wallet tested**, with
  `confidence: 0.0` and an `explanation` stating its internal ML scoring service is
  unreachable. This is a CredLayer-side scoring issue, not an app issue — the score shown
  is genuinely what the API returns.
- Loan requests are not persisted to a database.
- Error handling covers invalid wallets, missing key, 401/403, 404, 422, 429, 5xx,
  network failures and a 15s timeout.
