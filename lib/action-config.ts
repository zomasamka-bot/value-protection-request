/**
 * Action Configuration Layer
 * Defines behavior for specific actions using the Core Engine.
 *
 * Payment lifecycle (Pi SDK v2):
 *   init  →  user approves in wallet
 *         →  onReadyForServerApproval  → POST /approve  (done inside pay())
 *         →  blockchain confirms
 *         →  onReadyForServerCompletion → POST /complete (done inside pay())
 *         →  pay() promise resolves with { paymentId, txid }
 *         →  record status moves to "approved"
 *
 * The promise returned by pay() ONLY resolves after /complete succeeds.
 * We never touch record state until that point.
 */

import { CoreEngine, type ActionRecord, type RequestFormData } from "./core-engine";
import { pay } from "./pi-payment";

// ─── Action configuration type ────────────────────────────────────────────────

export type ActionConfig = {
  name: string;
  description: string;
  domain: string;
  requiresWalletApproval: boolean;
  institutionalGrade: boolean;
  hooks: {
    limits: boolean;
    approvals: boolean;
    reporting: boolean;
  };
};

// ─── App-specific configuration ───────────────────────────────────────────────

export const VALUE_PROTECTION_CONFIG: ActionConfig = {
  name: "Value Protection Request",
  description:
    "Institutional-grade governance workflow for value protection policies with full audit trail and evidence pack",
  domain: "stable.pi",
  requiresWalletApproval: true,
  institutionalGrade: true,
  hooks: {
    limits: true,
    approvals: true,
    reporting: true,
  },
};

// ─── Action manager ───────────────────────────────────────────────────────────

export class ActionManager {
  private config: ActionConfig;

  constructor(config: ActionConfig) {
    this.config = config;
  }

  /**
   * Execute the full action state machine:
   *   draft → pending_approval → (wallet + server) → approved | rejected
   *
   * onStatusUpdate is called at each state transition so the UI can render
   * live progress. The final resolved record is returned.
   */
  async executeAction(
    formData: RequestFormData,
    onStatusUpdate?: (record: ActionRecord) => void
  ): Promise<ActionRecord> {
    // ── Draft ────────────────────────────────────────────────────────────────
    let record = CoreEngine.createActionRecord(this.config.domain, formData);
    onStatusUpdate?.(record);

    await this.delay(600);

    try {
      // ── Pending approval ─────────────────────────────────────────────────
      record = CoreEngine.updateStatus(
        record,
        "pending_approval",
        "submit_approval",
        `Submitted for Pi wallet authorization on ${this.config.domain}`
      );
      record.evidence.runtimeLog.push(
        `[${new Date().toISOString()}] Status: Pending Approval`,
        `[${new Date().toISOString()}] Opening Pi Wallet — awaiting user approval...`
      );
      onStatusUpdate?.(record);

      // ── Pi payment: init → approve → blockchain → complete ───────────────
      //
      // pay() only resolves after the full approve→complete round-trip.
      // Outside Pi Browser (preview / dev) it simulates the flow.
      const { paymentId, txid } = await this.executePayment(formData);

      // ── Approved ─────────────────────────────────────────────────────────
      record = CoreEngine.updateStatus(
        record,
        "approved",
        "wallet_approved",
        "Pi wallet authorization and server completion successful"
      );

      // Embed payment proof into the evidence pack
      record.evidence.paymentId = paymentId;
      record.evidence.txid      = txid;
      record.evidence.runtimeLog.push(
        `[${new Date().toISOString()}] Pi payment approved by user`,
        `[${new Date().toISOString()}] Server approve: OK`,
        `[${new Date().toISOString()}] Blockchain txid: ${txid}`,
        `[${new Date().toISOString()}] Server complete: OK`,
        `[${new Date().toISOString()}] Payment ID: ${paymentId}`,
        `[${new Date().toISOString()}] Evidence pack finalized`,
        `[${new Date().toISOString()}] Status: Approved`
      );
      onStatusUpdate?.(record);

      return record;
    } catch (error) {
      // ── Rejected ──────────────────────────────────────────────────────────
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      record = CoreEngine.updateStatus(
        record,
        "rejected",
        "wallet_rejected",
        `Authorization failed: ${errorMessage}`
      );
      record.evidence.runtimeLog.push(
        `[${new Date().toISOString()}] Error: ${errorMessage}`,
        `[${new Date().toISOString()}] Status: Rejected`
      );
      onStatusUpdate?.(record);
      throw error;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Invoke the Pi payment flow.
   * - Inside Pi Browser: calls window.Pi.createPayment via pay().
   *   pay() awaits onReadyForServerApproval (approve) then
   *   onReadyForServerCompletion (complete) before resolving.
   * - Outside Pi Browser (dev/preview): simulates the full round-trip.
   */
  private executePayment(
    formData: RequestFormData
  ): Promise<{ paymentId: string; txid: string }> {
    if (typeof window === "undefined" || !window.Pi) {
      // Simulation for non-Pi Browser environments
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              paymentId: `sim-pay-${Date.now()}`,
              txid:      `sim-tx-${Date.now()}`,
            }),
          1800
        )
      );
    }

    return pay({
      amount: 0.001,
      memo: `VPR | ${formData.policyType.toUpperCase()} | ${this.config.domain}`,
      metadata: {
        type:       "value_protection_authorization",
        domain:     this.config.domain,
        policyType: formData.policyType,
        address:    formData.address,
        reference:  formData.reference || null,
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getConfig(): ActionConfig {
    return this.config;
  }
}
