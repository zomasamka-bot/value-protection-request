import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/complete/[paymentId]
 *
 * Server-side step 3 of the Pi payment lifecycle.
 * Called from the browser inside onReadyForServerCompletion().
 *
 * Body: { txid: string }
 *
 * The Pi Platform POST /complete endpoint requires:
 *   - Authorization: Key <PI_API_KEY>
 *   - Content-Type: application/json
 *   - Body: { txid: string }
 *
 * 400/409 from Pi means the payment was already completed — treated as success.
 */

const PI_API_BASE = "https://api.minepi.com";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, options);
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
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const txid: string | undefined = body?.txid;

  if (!txid || typeof txid !== "string" || !txid.trim()) {
    return NextResponse.json({ error: "txid is required in request body" }, { status: 400 });
  }

  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    console.error("[payments/complete] PI_API_KEY is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const piRes = await fetchWithRetry(
      `${PI_API_BASE}/v2/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
      }
    );

    // 200 — freshly completed
    // 400/409 — already completed (idempotent) — still a success for our flow
    if (piRes.ok || piRes.status === 400 || piRes.status === 409) {
      const data = await piRes.json().catch(() => ({}));
      return NextResponse.json(
        { completed: true, txid, alreadyCompleted: piRes.status !== 200, ...data },
        { status: 200 }
      );
    }

    const errorText = await piRes.text().catch(() => piRes.statusText);
    console.error("[payments/complete] Pi Platform rejected:", piRes.status, errorText);
    return NextResponse.json(
      { error: "Pi complete failed", detail: errorText, piStatus: piRes.status },
      { status: piRes.status }
    );

  } catch (err) {
    console.error("[payments/complete] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
