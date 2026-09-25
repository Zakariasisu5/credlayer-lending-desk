CredLayer Lending Desk

A simple Web3 lending application that uses the CredLayer API to verify a borrower's wallet trust score before making an illustrative lending decision.

The application demonstrates how developers can integrate CredLayer into a lending workflow using an API key.

«Demo only: This application does not provide real credit underwriting, approve real loans, or transfer funds.»

How It Works

The lending flow is simple:

1. A lender enters a borrower's wallet address.
2. The application sends the wallet address to the server.
3. The server securely calls the CredLayer API using an API key.
4. CredLayer returns the wallet's trust information.
5. The application displays the returned trust score and available risk information.
6. A demo lending decision is calculated using the configured minimum score.
7. The lender can submit a demo loan request.

Lender
  ↓
Enter Wallet Address
  ↓
Lending App
  ↓
CredLayer API
  ↓
Trust Score & Risk Data
  ↓
Demo Lending Decision

CredLayer Integration

The application uses the CredLayer score endpoint:

GET https://ideal-unity-production-3165.up.railway.app/api/v1/scores/{wallet}

Authentication is handled with an API key:

X-API-Key: YOUR_API_KEY
Accept: application/json

The API key is used only on the server.

It is never exposed to the browser, placed in a URL, or included in client-side code.

Example Response

A real response from the CredLayer API currently looks like:

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

The application displays the information returned by CredLayer rather than creating or inventing its own trust data.

Demo Lending Decision

The lending decision is illustrative only.

The application uses a configurable minimum trust score:

Score >= minimum score
        ↓
Eligible for demo loan

Score < minimum score
        ↓
Not eligible for demo loan

The default minimum score is "600".

This threshold is not a statement about real-world creditworthiness and should not be used for actual lending decisions.

Environment Variables

Create a ".env" or ".env.local" file using the following variables:

CREDLAYER_API_KEY=your_test_api_key
CREDLAYER_BASE_URL=https://ideal-unity-production-3165.up.railway.app/api/v1
CREDLAYER_MIN_SCORE=600

Variables

Variable| Description
"CREDLAYER_API_KEY"| Secret API key used to authenticate with CredLayer
"CREDLAYER_BASE_URL"| CredLayer API base URL
"CREDLAYER_MIN_SCORE"| Minimum score used for the illustrative lending decision

Never commit your real API key to GitHub.

Running the App

Install dependencies:

bun install

Start the development server:

bun run dev

Open the application in your browser and enter a wallet address to test the CredLayer integration.

Security

The CredLayer API key is a server-side secret.

The application follows these rules:

- API keys are stored in environment variables.
- API keys are never exposed to the browser.
- API keys are never included in URLs.
- API keys are never logged.
- Secret environment files are excluded from Git.
- Wallet input is validated before the request is sent to CredLayer.

For production applications, developers should also implement appropriate authentication, authorization, rate limiting, key rotation, monitoring, and secure secret management.

Current CredLayer Status

The application successfully demonstrates the CredLayer API integration, but the current CredLayer scoring service has an issue that affects the returned score.

During testing, multiple wallets returned a trust score of "500" with:

confidence: 0.0

and an explanation indicating that the internal ML scoring service could not be reached.

This means the lending application is displaying the actual response from CredLayer, but the current score should not be treated as a reliable production trust assessment until the underlying ML service is available.

This is an API/scoring-service issue rather than a UI issue in this demo application.

Current Limitations

- Trust scores depend on the availability and correctness of the CredLayer scoring service.
- Loan requests are currently stored only in browser session state.
- No real funds are transferred.
- Lending decisions are illustrative and not financial underwriting.
- Persistent loan management, authentication, and production lending infrastructure are not included.

Purpose

This project demonstrates a practical integration of CredLayer into a Web3 lending workflow.

The core idea is simple:

«A lending application can use CredLayer's trust and reputation data as an input when evaluating a wallet.»

Developers can use this pattern as a starting point for integrating CredLayer into their own lending, credit, DeFi, or financial applications.
