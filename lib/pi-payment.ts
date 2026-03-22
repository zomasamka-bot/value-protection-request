/**
 * Pi Network Payment Integration
 *
 * Implements the correct Pi SDK v2 payment lifecycle:
 *
 *   1. window.Pi.createPayment() — opens wallet prompt for user
 *   2. onReadyForServerApproval(paymentId)
 *        → POST /approve   (server marks payment approved)
 *   3. onReadyForServerCompletion(paymentId, txid)
 *        → POST /complete  (server finalises after blockchain confirms)
 *   4. Resolve / surface result to caller
 *
 * IMPORTANT:
 * - Never resolve the outer promise at step 2. The payment is NOT done yet —
 *   the blockchain hasn't confirmed. Resolving early leaves the payment
 *   permanently stuck as "incomplete" on the Pi Network side.
 * - Never skip approve() before complete(). Pi Platform will reject /complete
 *   on a payment that was never approved server-side.
 * - checkIncompletePayments must also call approve first, then complete.
 */

// No external backend dependency — all server calls go through our own
// Next.js route handlers which use PI_API_KEY on the server side.

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMetadata = Record<string, unknown>;

export type PaymentOptions = {
  amount: number;
  memo?: string;
  metadata: PaymentMetadata;
  onComplete?: (paymentId: string, txid: string, metadata: PaymentMetadata) => void;
  onError?: (error: Error, payment?: PiPayment) => void;
};

export type PiPaymentData = {
  amount: number;
  memo: string;
  metadata: PaymentMetadata;
};

export type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PiPayment) => void;
};

export type PiPayment = {
  identifier: string;
  amount: number;
  metadata: PaymentMetadata;
  transaction: {
    txid: string;
  } | null;
};

// ─── Global window extension ──────────────────────────────────────────────────

declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: PiPayment) => Promise<void>
      ) => Promise<{ accessToken: string; user: { uid: string; username: string } }>;
      createPayment: (data: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
    };
    pay: (options: PaymentOptions) => void;
  }
}

// ─── Reward handler ───────────────────────────────────────────────────────────

let rewardHandler: ((metadata: PaymentMetadata) => void) | null = null;

export const setPaymentRewardHandler = (
  handler: (metadata: PaymentMetadata) => void
): void => {
  rewardHandler = handler;
};

// ─── Server-side steps ────────────────────────────────────────────────────────

/**
 * Step 2: Approve the payment server-side.
 * Calls our own Next.js route handler which uses PI_API_KEY internally.
 * Must be called inside onReadyForServerApproval before doing anything else.
 */
const serverApprove = async (paymentId: string): Promise<void> => {
  const res = await fetch(`/api/payments/approve/${paymentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error ?? `Approve failed (${res.status})`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
};

/**
 * Step 3: Complete the payment server-side with the confirmed txid.
 * Calls our own Next.js route handler which uses PI_API_KEY internally.
 * Must be called inside onReadyForServerCompletion after approve has succeeded.
 */
const serverComplete = async (paymentId: string, txid: string): Promise<void> => {
  const res = await fetch(`/api/payments/complete/${paymentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txid }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Complete failed (${res.status})`);
  }
};

// ─── Core payment function ────────────────────────────────────────────────────

/**
 * Creates a Pi payment and returns a Promise that resolves only after the
 * full approve → blockchain confirm → complete sequence has finished.
 *
 * Returns { paymentId, txid } so the caller can store them in the record.
 */
export const pay = (options: PaymentOptions): Promise<{ paymentId: string; txid: string }> => {
  return new Promise((resolve, reject) => {
    const paymentData: PiPaymentData = {
      amount: options.amount,
      memo: options.memo ?? `Payment of ${options.amount} Pi`,
      metadata: options.metadata,
    };

    const callbacks: PiPaymentCallbacks = {
      /**
       * Step 2 — user has approved inside the wallet.
       * Call server /approve immediately. Do NOT resolve here.
       */
      onReadyForServerApproval: async (paymentId) => {
        try {
          await serverApprove(paymentId);
          // Approval done — wait for blockchain; SDK will fire onReadyForServerCompletion
        } catch (err) {
          reject(
            err instanceof Error
              ? err
              : new Error(`Approve failed for ${paymentId}`)
          );
        }
      },

      /**
       * Step 3 — blockchain has confirmed; txid is the on-chain transaction ID.
       * Call server /complete, then resolve the outer promise.
       */
      onReadyForServerCompletion: async (paymentId, txid) => {
        try {
          await serverComplete(paymentId, txid);

          if (rewardHandler && options.metadata) {
            rewardHandler(options.metadata);
          }

          options.onComplete?.(paymentId, txid, options.metadata);
          resolve({ paymentId, txid });
        } catch (err) {
          reject(
            err instanceof Error
              ? err
              : new Error(`Complete failed for ${paymentId}`)
          );
        }
      },

      onCancel: (paymentId) => {
        reject(new Error(`Payment cancelled (id: ${paymentId})`));
      },

      onError: (error, payment) => {
        options.onError?.(error, payment ?? undefined);
        reject(error);
      },
    };

    try {
      window.Pi.createPayment(paymentData, callbacks);
    } catch (err) {
      reject(
        err instanceof Error ? err : new Error("Failed to create payment")
      );
    }
  });
};

// ─── Incomplete payment recovery ──────────────────────────────────────────────

/**
 * Called by the Pi SDK during authenticate() when a previous payment was
 * left in an incomplete state (e.g. app closed mid-flow).
 *
 * Correct recovery sequence: approve first (idempotent on Pi side),
 * then complete. Never skip approve and jump straight to complete.
 */
export const checkIncompletePayments = async (payment: PiPayment): Promise<void> => {
  const { identifier: paymentId, transaction } = payment;

  try {
    // Step 1 — approve server-side. This is idempotent: Pi returns 400/409 if
    // already approved, and our route handler maps those to 200. So this call
    // will succeed whether or not the payment was previously approved.
    await serverApprove(paymentId);
  } catch (err) {
    // Approve failed for an unexpected reason — log and bail out.
    // Do NOT attempt complete on a payment that failed approval.
    console.error("[payment] Incomplete payment approve failed:", err);
    return;
  }

  // Step 2 — complete only if the blockchain transaction already exists.
  // If there is no txid, the chain hasn't confirmed yet and there is nothing
  // more this recovery path can do — the SDK will surface it again next session.
  if (!transaction?.txid) {
    return;
  }

  try {
    await serverComplete(paymentId, transaction.txid);
  } catch (err) {
    console.error("[payment] Incomplete payment complete failed:", err);
  }
};

// ─── Global initialisation ────────────────────────────────────────────────────

export const initializeGlobalPayment = (): void => {
  if (typeof window !== "undefined") {
    window.pay = pay;
  }
};
