/**
 * Pi Network SDK Type Definitions
 * stable.pi — Value Protection Request
 *
 * Based on the official Pi SDK v2 surface area.
 * Authoritative reference: https://github.com/pi-apps/pi-platform-docs
 */

// ─── Scopes ───────────────────────────────────────────────────────────────────

type PiScope = "username" | "payments" | "wallet_address";

// ─── Auth ─────────────────────────────────────────────────────────────────────

interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
    /** Only present when "wallet_address" scope is requested */
    walletAddress?: string;
  };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

interface PiPaymentData {
  /** Amount in Pi. Use a small positive value for authorization-only flows. */
  amount: number;
  /** Short human-readable description shown to the user in the wallet prompt. */
  memo: string;
  /** Arbitrary JSON metadata attached to the payment record. */
  metadata: Record<string, unknown>;
}

interface PiPayment {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction: null | {
    txid: string;
    verified: boolean;
    _link: string;
  };
}

interface PiPaymentCallbacks {
  /** Called when the payment is ready to be approved server-side. */
  onReadyForServerApproval: (paymentId: string) => void;
  /** Called when the blockchain transaction is confirmed and ready to complete. */
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  /** Called when the user cancels the payment. */
  onCancel: (paymentId: string) => void;
  /** Called on any SDK-level error. */
  onError: (error: Error, payment: PiPayment | null) => void;
}

// ─── SDK ──────────────────────────────────────────────────────────────────────

interface PiSDK {
  /**
   * Must be called once before any other SDK method.
   * sandbox: true  → Pi Testnet
   * sandbox: false → Pi Mainnet
   */
  init(config: { version: string; sandbox: boolean }): Promise<void>;

  /**
   * Authenticates the current Pi Browser user.
   * @param scopes    Array of permission scopes to request.
   * @param onIncompletePaymentFound  Called if a previous payment was not completed.
   */
  authenticate(
    scopes: PiScope[],
    onIncompletePaymentFound: (payment: PiPayment) => void
  ): Promise<PiAuthResult>;

  /**
   * Opens the Pi Wallet payment approval screen.
   * For authorization-only flows, use a minimal amount (e.g. 0.001 Pi).
   */
  createPayment(
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ): void;
}

// ─── Window augmentation ─────────────────────────────────────────────────────

interface Window {
  Pi: PiSDK;
}
