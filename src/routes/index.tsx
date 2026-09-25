import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { checkBorrower, type CredLayerResult } from "@/lib/credlayer.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CredLayer Lending Desk — Borrower Trust Verification" },
      {
        name: "description",
        content:
          "Check a borrower wallet against live CredLayer trust scores and model a demo lending decision.",
      },
      { property: "og:title", content: "CredLayer Lending Desk" },
      {
        property: "og:description",
        content:
          "Verify borrower wallets with live CredLayer trust scores and model a demo loan.",
      },
    ],
  }),
  component: LendingDesk,
});

type LoanRequest = {
  id: string;
  wallet: string;
  amount: number;
  months: number;
  rate: number;
  repayment: number;
  score: number | null;
  createdAt: string;
};

function returnedFields(raw: unknown): [string, string][] {
  if (!raw || typeof raw !== "object") return [];
  const root = raw as Record<string, unknown>;
  const src =
    root["data"] && typeof root["data"] === "object"
      ? (root["data"] as Record<string, unknown>)
      : root;
  return Object.entries(src)
    .filter(
      ([k, v]) =>
        !["address", "wallet", "trustScore", "score"].includes(k) &&
        (typeof v === "string" || typeof v === "number" || typeof v === "boolean"),
    )
    .map(([k, v]) => [k, String(v)]);
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function LendingDesk() {
  const check = useServerFn(checkBorrower);

  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("5000");
  const [months, setMonths] = useState("12");
  const [rate, setRate] = useState("9.5");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CredLayerResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const principal = Number(amount) || 0;
  const term = Number(months) || 0;
  const apr = Number(rate) || 0;
  const repayment = principal * (1 + (apr / 100) * (term / 12));

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setResult(null);
    setSubmitted(false);
    setLoading(true);
    try {
      const res = await check({ data: { wallet: wallet.trim() } });
      setResult(res);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Verification request failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function onRequestLoan() {
    if (!result?.ok) return;
    const entry: LoanRequest = {
      id: crypto.randomUUID(),
      wallet: result.wallet,
      amount: principal,
      months: term,
      rate: apr,
      repayment,
      score: result.score,
      createdAt: new Date().toISOString(),
    };
    setRequests((prev) => [entry, ...prev]);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              CredLayer Lending Desk
            </h1>
            <p className="text-sm text-muted-foreground">
              Borrower trust verification, powered by the live CredLayer API
            </p>
          </div>
          <span className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Demo environment
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Check a borrower</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The wallet is sent to our server, which queries CredLayer with a
            server-side API key. No key ever reaches the browser.
          </p>

          <form onSubmit={onCheck} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="wallet"
                className="text-sm font-medium text-foreground"
              >
                Borrower wallet address
              </label>
              <input
                id="wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="8A7FbUBoWzwajELuxCX6QTGA6HtJYaxrs3LtUP78a172"
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="text-sm font-medium text-foreground"
              >
                Requested amount (USD)
              </label>
              <input
                id="amount"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div>
              <label
                htmlFor="months"
                className="text-sm font-medium text-foreground"
              >
                Duration (months)
              </label>
              <input
                id="months"
                type="number"
                min="1"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Checking CredLayer…" : "Check borrower"}
              </button>
            </div>
          </form>

          {formError && (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
        </section>

        {result && !result.ok && (
          <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-base font-semibold text-destructive">
              Verification failed
            </h2>
            <p className="mt-1 text-sm text-foreground">{result.error}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              CredLayer HTTP status: {result.status || "no response"}
            </p>
            {result.raw != null && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-secondary p-3 font-mono text-xs">
                {JSON.stringify(result.raw, null, 2)}
              </pre>
            )}
          </section>
        )}

        {result?.ok && (
          <>
            <section className="rounded-lg border border-border bg-card p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold">Borrower profile</h2>
                <span className="text-xs text-muted-foreground">
                  CredLayer HTTP {result.status}
                </span>
              </div>

              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Wallet
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm">
                    {result.wallet}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Trust score
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold">
                    {result.score ?? "Not returned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Verification
                  </dt>
                  <dd className="mt-1 text-sm">
                    Retrieved live from CredLayer
                  </dd>
                </div>
              </dl>

              {returnedFields(result.raw).length > 0 && (
                <dl className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                  {returnedFields(result.raw).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                        {k}
                      </dt>
                      <dd className="mt-0.5 break-words text-sm">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Full CredLayer response
                </summary>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-secondary p-3 font-mono text-xs">
                  {JSON.stringify(result.raw, null, 2)}
                </pre>
              </details>
            </section>

            <section className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-base font-semibold">Demo Lending Decision</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This is an illustrative threshold check, not a credit decision
                or financial underwriting.
              </p>

              {result.score === null ? (
                <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
                  CredLayer did not return a numeric score for this wallet, so
                  no demo decision can be calculated.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span
                    className={
                      result.eligible
                        ? "rounded-md bg-success/15 px-3 py-1.5 text-sm font-semibold text-success"
                        : "rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-semibold text-destructive"
                    }
                  >
                    {result.eligible
                      ? "Eligible for demo loan"
                      : "Not eligible for demo loan"}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Score {result.score} vs. server-configured threshold{" "}
                    {result.threshold}. Scores at or above the threshold pass.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-base font-semibold">Loan request</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Amount
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatMoney(principal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Duration
                  </p>
                  <p className="mt-1 text-sm font-medium">{term} months</p>
                </div>
                <div>
                  <label
                    htmlFor="rate"
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Interest rate (APR %)
                  </label>
                  <input
                    id="rate"
                    type="number"
                    step="0.1"
                    min="0"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Estimated repayment
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatMoney(repayment)}
                  </p>
                </div>
              </div>

              <button
                onClick={onRequestLoan}
                className="mt-5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Request loan
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Records the request in this session only. No funds are moved.
              </p>

              {submitted && (
                <p className="mt-3 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                  Demo loan request submitted
                </p>
              )}
            </section>
          </>
        )}

        {requests.length > 0 && (
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-base font-semibold">
              Demo requests this session
            </h2>
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Wallet</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Term</th>
                  <th className="pb-2 font-medium">Repayment</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="max-w-[12rem] truncate py-2 font-mono text-xs">
                      {r.wallet}
                    </td>
                    <td className="py-2">{r.score ?? "—"}</td>
                    <td className="py-2">{formatMoney(r.amount)}</td>
                    <td className="py-2">{r.months} mo</td>
                    <td className="py-2">{formatMoney(r.repayment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Demo application. Trust scores come from CredLayer; lending outcomes are
        illustrative only.
      </footer>
    </div>
  );
}
