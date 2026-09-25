import { createServerFn } from "@tanstack/react-start";

export type CredLayerResult = {
  ok: boolean;
  status: number;
  wallet: string;
  score: number | null;
  threshold: number;
  eligible: boolean | null;
  raw: unknown;
  error?: string;
};

function findScore(payload: unknown): number | null {
  if (payload == null) return null;
  if (typeof payload === "number") return payload;
  if (typeof payload !== "object") return null;

  const keys = [
    "score",
    "trust_score",
    "trustScore",
    "credit_score",
    "creditScore",
    "value",
  ];
  const obj = payload as Record<string, unknown>;

  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
  }
  for (const nested of ["data", "result", "score"]) {
    const v = obj[nested];
    if (v && typeof v === "object") {
      const found = findScore(v);
      if (found !== null) return found;
    }
  }
  return null;
}

export const checkBorrower = createServerFn({ method: "POST" })
  .inputValidator((data: { wallet: string }) => {
    const wallet = (data?.wallet ?? "").trim();
    if (!wallet) throw new Error("Wallet address is required.");
    if (!/^[A-Za-z0-9:_-]{20,120}$/.test(wallet)) {
      throw new Error("That does not look like a valid wallet address.");
    }
    return { wallet };
  })
  .handler(async ({ data }): Promise<CredLayerResult> => {
    const apiKey = process.env["CREDLAYER_API_KEY"];
    const baseUrl =
      process.env["CREDLAYER_BASE_URL"] ??
      "https://ideal-unity-production-3165.up.railway.app/api/v1/api-keys";
    const threshold = Number(process.env["CREDLAYER_MIN_SCORE"] ?? 60);

    const base: CredLayerResult = {
      ok: false,
      status: 0,
      wallet: data.wallet,
      score: null,
      threshold,
      eligible: null,
      raw: null,
    };

    if (!apiKey) {
      return {
        ...base,
        error:
          "CredLayer API key is not configured on the server. Add CREDLAYER_API_KEY and try again.",
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(
        `${baseUrl}/scores/${encodeURIComponent(data.wallet)}`,
        {
          method: "GET",
          headers: { "X-API-Key": apiKey, Accept: "application/json" },
          signal: controller.signal,
        },
      );

      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        /* keep raw text */
      }

      if (!res.ok) {
        const messages: Record<number, string> = {
          400: "CredLayer rejected the request (400). Check the wallet format.",
          401: "CredLayer authentication failed (401). The API key is invalid.",
          403: "CredLayer denied access (403). The API key lacks permission for this endpoint.",
          404: "No CredLayer record found for this wallet (404).",
          422: "CredLayer could not validate the wallet address (422).",
          429: "CredLayer rate limit reached (429). Try again shortly.",
        };
        return {
          ...base,
          status: res.status,
          raw: parsed,
          error:
            messages[res.status] ??
            `CredLayer returned an unexpected error (${res.status}).`,
        };
      }

      const score = findScore(parsed);
      return {
        ...base,
        ok: true,
        status: res.status,
        raw: parsed,
        score,
        eligible: score === null ? null : score >= threshold,
      };
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      return {
        ...base,
        error: aborted
          ? "CredLayer did not respond within 15 seconds."
          : "Could not reach CredLayer. Check the network or service status.",
      };
    } finally {
      clearTimeout(timer);
    }
  });
