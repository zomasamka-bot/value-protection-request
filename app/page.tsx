"use client";

import { useState } from "react";
import { usePiAuth, type WalletStatus } from "@/contexts/pi-auth-context";
import { useAppState } from "@/hooks/use-app-state";
import { ActionManager, VALUE_PROTECTION_CONFIG } from "@/lib/action-config";
import { type ActionRecord, type RequestFormData, type RequestStatus } from "@/lib/core-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EvidencePack } from "@/components/evidence-pack";
import { HooksMonitor } from "@/components/hooks-monitor";
import { OperationLog } from "@/components/operation-log";
import { StatusBadge } from "@/components/status-badge";
import { RecordCard } from "@/components/record-card";
import { DomainBadge } from "@/components/domain-badge";
import { TestnetIndicator } from "@/components/testnet-indicator";
import {
  Shield, FileText, Wallet, ChevronRight,
  Loader2, AlertCircle, CheckCircle2, X,
  ArrowLeft, Info, RefreshCw, Globe,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Form validation ──────────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof RequestFormData, string>>;

function validateForm(data: RequestFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.address.trim())
    errors.address = "Wallet address is required.";
  else if (!/^[A-Za-z0-9]{32,}$/.test(data.address.trim()))
    errors.address = "Enter a valid Pi wallet address (alphanumeric, 32+ chars).";
  if (!data.amount.trim())
    errors.amount = "Amount is required.";
  else if (Number.isNaN(Number(data.amount)) || Number(data.amount) <= 0)
    errors.amount = "Enter a positive numeric amount.";
  if (!data.policyType)
    errors.policyType = "Select a policy type.";
  if (!data.reason.trim())
    errors.reason = "Reason is required.";
  else if (data.reason.trim().length < 10)
    errors.reason = "Reason must be at least 10 characters.";
  return errors;
}

const EMPTY_FORM: RequestFormData = {
  address:    "",
  label:      "",
  amount:     "",
  policyType: "freeze",
  reason:     "",
  reference:  "",
};

// ─── Flow step tracker ────────────────────────────────────────────────────────

type FlowStep = "form" | "pending" | "approved" | "rejected";

function statusToFlowStep(status: RequestStatus | null): FlowStep {
  if (!status) return "form";
  if (status === "draft" || status === "pending_approval") return "pending";
  if (status === "approved") return "approved";
  return "rejected";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Header wallet chip — shows connection state and acts as
 * Connect / Disconnect button depending on current status.
 */
function WalletChip({
  status,
  username,
  onConnect,
  onDisconnect,
}: {
  status: WalletStatus;
  username?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  if (status === "connected" && username) {
    return (
      <button
        type="button"
        onClick={onDisconnect}
        title="Click to disconnect wallet"
        className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-full pl-2.5 pr-3 py-1 hover:bg-emerald-500/20 transition-colors"
      >
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs font-semibold truncate max-w-[96px]">@{username}</span>
        <X className="h-3 w-3 flex-shrink-0 opacity-60" />
      </button>
    );
  }

  if (status === "connecting") {
    return (
      <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary rounded-full px-3 py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
        <span className="text-xs font-semibold">Connecting…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onConnect}
        className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-full px-3 py-1 hover:bg-destructive/20 transition-colors"
      >
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs font-semibold">Retry</span>
      </button>
    );
  }

  // idle | disconnected
  return (
    <button
      type="button"
      onClick={onConnect}
      className="flex items-center gap-1.5 bg-primary border border-primary/80 text-primary-foreground rounded-full px-3 py-1 hover:bg-primary/90 active:bg-primary/80 transition-colors"
    >
      <Wallet className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="text-xs font-semibold">Connect Wallet</span>
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  );
}

function FlowTracker({ step, referenceId }: { step: FlowStep; referenceId?: string }) {
  const steps: { key: FlowStep | "form"; label: string }[] = [
    { key: "form",     label: "Fill Form"       },
    { key: "pending",  label: "Wallet Approval" },
    { key: "approved", label: "Approved"        },
  ];

  const activeIndex = step === "rejected"
    ? 1
    : steps.findIndex((s) => s.key === step);

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-5">
      {/* Step rail */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((s, i) => {
          const done    = i < activeIndex;
          const active  = i === activeIndex && step !== "rejected";
          const isError = step === "rejected" && i === 1;
          return (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5 relative">
              {/* connector */}
              {i > 0 && (
                <div className={`absolute left-0 top-3.5 h-0.5 w-full -translate-y-1/2 -z-0
                  ${done || active ? "bg-primary/40" : "bg-border"}`}
                  style={{ right: "50%", left: "-50%" }}
                />
              )}
              {/* node */}
              <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center border-2 text-xs font-bold
                ${done    ? "bg-emerald-500 border-emerald-500 text-white"       :
                  isError ? "bg-destructive border-destructive text-white"       :
                  active  ? "bg-primary border-primary text-primary-foreground"  :
                            "bg-card border-border text-muted-foreground"        }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active && step === "pending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isError ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs font-medium text-center leading-tight
                ${done    ? "text-emerald-600 dark:text-emerald-400" :
                  isError ? "text-destructive"                         :
                  active  ? "text-foreground"                          :
                            "text-muted-foreground"                    }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live status line */}
      {step !== "form" && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono
          ${step === "approved" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" :
            step === "rejected" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                                  "bg-primary/10 text-primary border border-primary/20"}`}
        >
          {step === "pending"  && <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />}
          {step === "approved" && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />}
          {step === "rejected" && <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
          <span className="truncate">
            {step === "pending"  && "Waiting for wallet authorization..."}
            {step === "approved" && `Approved — ${referenceId ?? ""}`}
            {step === "rejected" && "Wallet authorization rejected."}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Slim wallet status banner (inline, non-blocking) ────────────────────────

function WalletBanner() {
  const { walletStatus, authMessage, connect } = usePiAuth();

  if (walletStatus === "connected") return null;

  if (walletStatus === "connecting") {
    return (
      <div className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
        <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
        <p className="text-xs text-primary font-medium truncate flex-1">{authMessage || "Connecting to Pi Network..."}</p>
      </div>
    );
  }

  if (walletStatus === "error") {
    return (
      <div className="flex items-center gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-xs text-destructive flex-1 leading-relaxed">{authMessage}</p>
        <button
          type="button"
          onClick={connect}
          className="flex items-center gap-1.5 text-xs font-semibold text-destructive underline underline-offset-2 flex-shrink-0"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  // idle | disconnected
  return (
    <div className="flex items-center gap-3 bg-muted/60 border border-border rounded-xl px-4 py-3">
      <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <p className="text-xs text-muted-foreground flex-1">
        Connect your Pi Wallet to submit requests.
      </p>
      <Button onClick={connect} size="sm" className="flex-shrink-0 h-7 px-3 text-xs font-semibold">
        Connect
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { walletStatus, isAuthenticated, userData, connect, disconnect } = usePiAuth();
  const { records, addRecord } = useAppState();

  const [form, setForm]                     = useState<RequestFormData>(EMPTY_FORM);
  const [errors, setErrors]                 = useState<FormErrors>({});
  const [isProcessing, setIsProcessing]     = useState(false);
  const [flowStep, setFlowStep]             = useState<FlowStep>("form");
  const [liveRecord, setLiveRecord]         = useState<ActionRecord | null>(null);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ActionRecord | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setField = <K extends keyof RequestFormData>(key: K, value: RequestFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const resetFlow = () => {
    setFlowStep("form");
    setLiveRecord(null);
    setSubmitError(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsProcessing(true);
    setSubmitError(null);
    setLiveRecord(null);

    const manager = new ActionManager(VALUE_PROTECTION_CONFIG);

    try {
      const finalRecord = await manager.executeAction(form, (record) => {
        setLiveRecord(record);
        setFlowStep(statusToFlowStep(record.status));
      });

      addRecord(finalRecord);
      setFlowStep("approved");
      setLiveRecord(finalRecord);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setSubmitError(msg);
      setFlowStep("rejected");
      if (liveRecord) addRecord(liveRecord);
    } finally {
      setIsProcessing(false);
    }
  };

  const canSubmit = !isProcessing && flowStep === "form";
  const showForm  = flowStep === "form";

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header — always visible ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-foreground leading-tight text-balance">
                Value Protection Request
              </h1>
              <DomainBadge domain={VALUE_PROTECTION_CONFIG.domain} size="sm" showVerified />
            </div>
          </div>
          {/* Wallet chip — connect / disconnect lives here, always in view */}
          <WalletChip
            status={walletStatus}
            username={userData?.username}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">

        {/* ── Wallet status banner — slim, non-blocking ────────────────────── */}
        <WalletBanner />

        {/* ── Flow tracker — always visible once connected ─────────────────── */}
        {isAuthenticated && (
        <FlowTracker
          step={flowStep}
          referenceId={liveRecord?.referenceId}
        />
        )}

        {/* ── Form panel ──────────────────────────────────────────────────── */}
        {showForm && (
          <section className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/40">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground leading-tight">New Protection Request</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Fields marked <span className="text-destructive font-semibold">*</span> are required</p>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold text-foreground">
                  Wallet Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Pi wallet address (alphanumeric, 32+ chars)"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className={`font-mono text-xs h-10 ${errors.address ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">Pi wallet address of the party to be protected</p>
                <FieldError message={errors.address} />
              </div>

              {/* Label (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="label" className="text-xs font-semibold text-foreground">
                  Address Label <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="label"
                  placeholder="e.g. Treasury wallet, @alice"
                  value={form.label}
                  onChange={(e) => setField("label", e.target.value)}
                  className="text-xs h-10"
                />
              </div>

              {/* Amount + Policy row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-semibold text-foreground">
                    Amount (Pi) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setField("amount", e.target.value)}
                    className={`text-xs h-10 ${errors.amount ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <FieldError message={errors.amount} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="policy" className="text-xs font-semibold text-foreground">
                    Policy Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.policyType}
                    onValueChange={(v) => setField("policyType", v as RequestFormData["policyType"])}
                  >
                    <SelectTrigger
                      id="policy"
                      className={`text-xs h-10 ${errors.policyType ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freeze">Freeze</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="escrow">Escrow</SelectItem>
                      <SelectItem value="governance">Governance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.policyType} />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs font-semibold text-foreground">
                  Reason / Justification <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  rows={3}
                  placeholder="Describe why this value protection request is needed (min. 10 characters)"
                  value={form.reason}
                  onChange={(e) => setField("reason", e.target.value)}
                  className={`text-xs resize-none leading-relaxed ${errors.reason ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                <div className="flex items-center justify-between gap-2">
                  <FieldError message={errors.reason} />
                  <span className={`text-xs ml-auto tabular-nums flex-shrink-0 ${
                    form.reason.length === 0       ? "text-muted-foreground" :
                    form.reason.length < 10        ? "text-destructive" :
                                                     "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {form.reason.length} / 10+
                  </span>
                </div>
              </div>

              {/* Reference (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="reference" className="text-xs font-semibold text-foreground">
                  External Reference <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="reference"
                  placeholder="Proposal #42, Governance ID, ticket ref…"
                  value={form.reference}
                  onChange={(e) => setField("reference", e.target.value)}
                  className="text-xs h-10"
                />
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-lg px-3.5 py-3">
                <Info className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Submitting opens a Pi Wallet authorization prompt in Pi Browser. No funds are transferred — this creates a governance record only.
                </p>
              </div>

              {/* Submit — disabled until wallet is connected */}
              {!isAuthenticated ? (
                <div className="space-y-2">
                  <Button
                    onClick={connect}
                    size="lg"
                    className="w-full font-semibold gap-2"
                    variant="outline"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet to Submit
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Connect your Pi Wallet using the button above or in the header.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  size="lg"
                  className="w-full font-semibold gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  {isProcessing ? "Connecting Wallet…" : "Submit & Authorize Wallet"}
                  {!isProcessing && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Button>
              )}
            </div>
          </section>
        )}

        {/* ── Pending state ────────────────────────────────────────────────── */}
        {flowStep === "pending" && liveRecord && (
          <section className="bg-card border border-primary/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Wallet Authorization in Progress</p>
                <p className="text-xs text-muted-foreground">Check Pi Browser for the authorization prompt</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1">
              <p className="text-xs text-muted-foreground">Request ID:</p>
              <p className="text-xs font-mono text-foreground break-all">{liveRecord.referenceId}</p>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {liveRecord.evidence.runtimeLog.map((line, i) => (
                <p key={i} className="text-xs text-muted-foreground font-mono leading-relaxed">{line}</p>
              ))}
            </div>
          </section>
        )}

        {/* ── Approved state ───────────────────────────────────────────────── */}
        {flowStep === "approved" && liveRecord && (
          <section className="space-y-4">
            {/* Success banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Request Approved</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono break-all">
                  {liveRecord.referenceId}
                </p>
              </div>
              <StatusBadge status={liveRecord.status} />
            </div>

            {/* Summary of submitted data */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-foreground">Request Summary</p>
              </div>
              <div className="p-4 space-y-2.5">
                {[
                  { label: "Address",  value: liveRecord.formData.address,    mono: true  },
                  liveRecord.formData.label ? { label: "Label", value: liveRecord.formData.label, mono: false } : null,
                  { label: "Amount",   value: `${liveRecord.formData.amount} Pi`, mono: false },
                  { label: "Policy",   value: liveRecord.formData.policyType, mono: false },
                  { label: "Reason",   value: liveRecord.formData.reason,     mono: false },
                  liveRecord.formData.reference ? { label: "Reference", value: liveRecord.formData.reference, mono: false } : null,
                ].filter(Boolean).map((row) => (
                  <div key={row!.label} className="flex items-start gap-3">
                    <span className="text-xs text-muted-foreground w-20 flex-shrink-0 pt-0.5 capitalize">{row!.label}</span>
                    <span className={`text-xs text-foreground break-all ${row!.mono ? "font-mono" : ""}`}>{row!.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Pack */}
            <EvidencePack evidence={liveRecord.evidence} />

            {/* Hooks Monitor */}
            <HooksMonitor hooks={liveRecord.hookStatus} />

            {/* Operation Log */}
            <OperationLog logs={liveRecord.operationLog} />

            {/* New request */}
            <Button variant="outline" onClick={resetFlow} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Create Another Request
            </Button>
          </section>
        )}

        {/* ── Rejected state ───────────────────────────────────────────────── */}
        {flowStep === "rejected" && (
          <section className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Authorization Failed</p>
                <p className="text-xs text-destructive/80 mt-0.5 leading-relaxed">{submitError}</p>
              </div>
            </div>
            {liveRecord && <OperationLog logs={liveRecord.operationLog} />}
            <Button variant="outline" onClick={resetFlow} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </section>
        )}

        {/* ── History list ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-foreground">Request History</h3>
            {records.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {records.length}
              </span>
            )}
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 px-4 bg-card border border-dashed border-border rounded-xl text-center">
              <div className="p-3 bg-muted/40 rounded-full">
                <FileText className="h-7 w-7 text-muted-foreground opacity-40" />
              </div>
              <p className="text-sm font-medium text-foreground">No requests yet</p>
              <p className="text-xs text-muted-foreground">Fill the form above to create your first request.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onClick={() => setSelectedRecord(record)}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* ── Detail dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              Request Details
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 pt-1">
              {/* Status + ref */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge status={selectedRecord.status} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
                  <p className="text-xs font-mono text-foreground break-all">{selectedRecord.referenceId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Domain</p>
                  <DomainBadge domain={VALUE_PROTECTION_CONFIG.domain} size="sm" showVerified />
                </div>
              </div>

              {/* Request data */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                  <p className="text-xs font-semibold text-foreground">Submitted Data</p>
                </div>
                <div className="p-4 space-y-2.5">
                  {[
                    { label: "Address",   value: selectedRecord.formData.address,    mono: true  },
                    selectedRecord.formData.label ? { label: "Label", value: selectedRecord.formData.label, mono: false } : null,
                    { label: "Amount",    value: `${selectedRecord.formData.amount} Pi`, mono: false },
                    { label: "Policy",    value: selectedRecord.formData.policyType, mono: false },
                    { label: "Reason",    value: selectedRecord.formData.reason,     mono: false },
                    selectedRecord.formData.reference ? { label: "Reference", value: selectedRecord.formData.reference, mono: false } : null,
                  ].filter(Boolean).map((row) => (
                    <div key={row!.label} className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground w-20 flex-shrink-0 pt-0.5 capitalize">{row!.label}</span>
                      <span className={`text-xs text-foreground break-all ${row!.mono ? "font-mono" : ""}`}>{row!.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <EvidencePack evidence={selectedRecord.evidence} />
              <HooksMonitor hooks={selectedRecord.hookStatus} />
              <OperationLog logs={selectedRecord.operationLog} />

              <Button variant="outline" onClick={() => setSelectedRecord(null)} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TestnetIndicator />
    </div>
  );
}
