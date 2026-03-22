/**
 * Unified Core Engine
 * Reusable across all applications - behavior defined through Action Configuration
 */

export type RequestStatus = "draft" | "pending_approval" | "approved" | "rejected";

/** Form data submitted by the user for a Value Protection Request */
export type RequestFormData = {
  /** Pi wallet address or identifier of the protected party */
  address: string;
  /** Human-readable label for the address (optional) */
  label: string;
  /** Requested protection amount in Pi */
  amount: string;
  /** Policy type */
  policyType: "freeze" | "limit" | "escrow" | "governance";
  /** Reason / justification for the request */
  reason: string;
  /** Optional supporting reference (external ID, proposal number, etc.) */
  reference: string;
};

export type ActionHook = "limits" | "approvals" | "reporting";

export type HookStatus = {
  name: ActionHook;
  enabled: boolean;
  lastCheck: string;
  status: "active" | "monitoring" | "error";
};

export type Evidence = {
  apiLog: string;
  referenceId: string;
  timestamp: string;
  manifest: {
    domain: string;
    hooks: Record<ActionHook, boolean>;
    releaseTag: string;
    freezeId: string;
  };
  runtimeLog: string[];
  /** Pi payment identifier — set after server /complete succeeds */
  paymentId?: string;
  /** On-chain transaction ID — set after blockchain confirms */
  txid?: string;
};

export type ActionRecord = {
  id: string;
  referenceId: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  formData: RequestFormData;
  evidence: Evidence;
  operationLog: OperationLogEntry[];
  hookStatus: HookStatus[];
};

export type OperationLogEntry = {
  timestamp: string;
  action: string;
  status: RequestStatus;
  details: string;
};

export class CoreEngine {
  /**
   * Generate a reference ID in the format: VPR-STABLE-YYYYMMDD-XXXX
   */
  static generateReferenceId(domain: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    
    const domainPrefix = domain.split(".")[0].toUpperCase();
    return `VPR-${domainPrefix}-${year}${month}${day}-${random}`;
  }

  /**
   * Generate evidence pack with full audit trail
   */
  static generateEvidence(
    referenceId: string,
    domain: string,
    formData?: RequestFormData
  ): Evidence {
    const timestamp = new Date().toISOString();
    const freezeId = `FREEZE-${Date.now()}`;
    const releaseTag = `v1.0.0-stable-${new Date().getFullYear()}`;

    const runtimeLog = [
      `[${timestamp}] Core Engine initialized`,
      `[${timestamp}] Domain bound: ${domain}`,
      `[${timestamp}] Evidence pack generated`,
    ];

    if (formData) {
      runtimeLog.push(
        `[${timestamp}] Address: ${formData.address}`,
        `[${timestamp}] Amount: ${formData.amount} Pi`,
        `[${timestamp}] Policy: ${formData.policyType}`,
        `[${timestamp}] Reason recorded`
      );
    }

    return {
      apiLog: `[${timestamp}] Action initiated on ${domain}`,
      referenceId,
      timestamp,
      manifest: {
        domain,
        hooks: {
          limits: true,
          approvals: true,
          reporting: true,
        },
        releaseTag,
        freezeId,
      },
      runtimeLog,
    };
  }

  /**
   * Create operation log entry
   */
  static createLogEntry(
    action: string,
    status: RequestStatus,
    details: string
  ): OperationLogEntry {
    return {
      timestamp: new Date().toISOString(),
      action,
      status,
      details,
    };
  }

  /**
   * Initialize monitoring hooks
   */
  static initializeHooks(): HookStatus[] {
    const now = new Date().toISOString();
    const hooks: ActionHook[] = ["limits", "approvals", "reporting"];
    
    return hooks.map((hook) => ({
      name: hook,
      enabled: true,
      lastCheck: now,
      status: "active" as const,
    }));
  }

  /**
   * Initialize a new action record
   */
  static createActionRecord(domain: string, formData: RequestFormData): ActionRecord {
    const referenceId = this.generateReferenceId(domain);
    const evidence = this.generateEvidence(referenceId, domain, formData);
    const now = new Date().toISOString();

    return {
      id: `record-${Date.now()}`,
      referenceId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      formData,
      evidence,
      operationLog: [
        this.createLogEntry(
          "initialize",
          "draft",
          `Request created on ${domain} — address: ${formData.address}, amount: ${formData.amount} Pi, policy: ${formData.policyType}`
        ),
      ],
      hookStatus: this.initializeHooks(),
    };
  }

  /**
   * Update action record status
   */
  static updateStatus(
    record: ActionRecord,
    newStatus: RequestStatus,
    action: string,
    details: string
  ): ActionRecord {
    const logEntry = this.createLogEntry(action, newStatus, details);

    return {
      ...record,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      operationLog: [...record.operationLog, logEntry],
    };
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  /**
   * Get status color
   */
  static getStatusColor(status: RequestStatus): string {
    switch (status) {
      case "draft":
        return "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-950";
      case "pending_approval":
        return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
      case "approved":
        return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950";
      case "rejected":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950";
    }
  }

  /**
   * Get status label
   */
  static getStatusLabel(status: RequestStatus): string {
    switch (status) {
      case "draft":
        return "Draft";
      case "pending_approval":
        return "Pending Approval";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  }
}
