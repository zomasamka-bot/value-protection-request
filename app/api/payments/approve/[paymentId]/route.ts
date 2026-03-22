import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/approve/[paymentId]
 *
 * Server-side step 2 of the Pi payment lifecycle.
 * Must be called inside onReadyForServerApproval() — never skip it.
 *
 * The Pi Platform POST /approve endpoint requires:
 *   - Authorization: Key <PI_API_KEY>
 *   - Content-Type: application/json
 *   - A JSON body (even if empty: {})
 *
 * Omitting the body causes Pi to return 400, which is the exact cause
 * of the payment timeout — the SDK never receives the "approved" signal.
 *
 * 200/409/400 from Pi are all treated as "already approved / success"
 * so the flow can continue to onReadyForServerCompletion.
 */

const PI_API_BASE = "https://api.minepi.com";

/** Simple exponential-backoff retry for transient 5xx / network errors. */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, options);
      // Retry only on 5xx (server errors), not on 4xx (client/auth errors)
      if (res.status >= 500 && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
  }
  throw lastErr;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    console.error("[payments/approve] PI_API_KEY is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const piRes = await fetchWithRetry(
      `${PI_API_BASE}/v2/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        // Pi Platform requires a body on this endpoint.
        // An empty JSON object satisfies the requirement.
        body: JSON.stringify({}),
      }
    );

    // 200 — freshly approved
    // 400 — Pi returns this when the payment was already approved (idempotent)
    // 409 — explicit "already approved" conflict response
    // All three mean the payment IS approved — safe to continue to /complete.
    if (piRes.ok || piRes.status === 400 || piRes.status === 409) {
      const data = await piRes.json().catch(() => ({}));
      return NextResponse.json(
        { approved: true, alreadyApproved: piRes.status !== 200, ...data },
        { status: 200 }
      );
    }

    const errorText = await piRes.text().catch(() => piRes.statusText);
    console.error("[payments/approve] Pi Platform rejected:", piRes.status, errorText);
    return NextResponse.json(
      { error: "Pi approve failed", detail: errorText, piStatus: piRes.status },
      { status: piRes.status }
    );

  } catch (err) {
    console.error("[payments/approve] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
