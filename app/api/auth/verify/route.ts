import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/verify
 *
 * Verifies a Pi Network access token by calling the Pi Platform /v2/me
 * endpoint with the user's own Bearer token.
 *
 * Note: PI_API_KEY is NOT required here — the Pi /v2/me endpoint authenticates
 * via the user's access_token (Bearer), not the app's server key.
 * PI_API_KEY is only needed for payment approve/complete operations.
 *
 * Body:    { access_token: string }
 * Returns: { uid: string; username: string }
 */

const PI_API_BASE = "https://api.minepi.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const access_token: string | undefined = body?.access_token;

    if (!access_token || typeof access_token !== "string" || !access_token.trim()) {
      return NextResponse.json(
        { error: "access_token is required" },
        { status: 400 }
      );
    }

    // Call Pi Platform /v2/me with the user's Bearer access token.
    // No PI_API_KEY needed for this endpoint.
    const piRes = await fetch(`${PI_API_BASE}/v2/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!piRes.ok) {
      const errorText = await piRes.text().catch(() => piRes.statusText);
      console.error("[auth/verify] Pi /v2/me rejected:", piRes.status, errorText);
      return NextResponse.json(
        { error: "Pi token verification failed", detail: errorText },
        { status: 401 }
      );
    }

    const piUser = await piRes.json();
    const uid: string      = piUser?.uid;
    const username: string = piUser?.username;

    if (!uid || !username) {
      console.error("[auth/verify] Unexpected /v2/me shape:", JSON.stringify(piUser));
      return NextResponse.json(
        { error: "Unexpected response from Pi Platform" },
        { status: 502 }
      );
    }

    return NextResponse.json({ uid, username }, { status: 200 });

  } catch (err) {
    console.error("[auth/verify] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
