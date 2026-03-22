"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import { setApiAuthToken } from "@/lib/api";
import {
  initializeGlobalPayment,
  checkIncompletePayments,
} from "@/lib/pi-payment";

// ─── Public types ─────────────────────────────────────────────────────────────

export type WalletStatus =
  | "idle"           // initial state, no attempt made
  | "connecting"     // SDK loading / authenticate in progress
  | "connected"      // successfully authenticated
  | "disconnected"   // user explicitly disconnected
  | "error";         // connection attempt failed

export type LoginDTO = {
  uid: string;
  username: string;
};

interface PiAuthContextType {
  // ── State ──────────────────────────────────────────────────────────────────
  walletStatus: WalletStatus;
  /** True only when walletStatus === "connected" */
  isAuthenticated: boolean;
  /** Human-readable message describing current step or last error */
  authMessage: string;
  hasError: boolean;
  piAccessToken: string | null;
  userData: LoginDTO | null;
  // ── Actions ────────────────────────────────────────────────────────────────
  /** Initiates wallet connection (load SDK → init → authenticate → verify) */
  connect: () => Promise<void>;
  /** Clears session state so the user can reconnect */
  disconnect: () => void;
  /** Alias for connect — kept for backward compat */
  reinitialize: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

// ─── SDK loader ───────────────────────────────────────────────────────────────

const loadPiSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded — skip
    if (typeof window !== "undefined" && typeof window.Pi !== "undefined") {
      resolve();
      return;
    }
    // Script already in DOM (e.g. hot-reload)
    if (document.querySelector(`script[src="${PI_NETWORK_CONFIG.SDK_URL}"]`)) {
      const poll = setInterval(() => {
        if (typeof window.Pi !== "undefined") {
          clearInterval(poll);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.src = PI_NETWORK_CONFIG.SDK_URL;
    script.async = true;
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error("SDK failed to load. Check your network connection."));
    document.head.appendChild(script);
  });
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [walletStatus,  setWalletStatus]  = useState<WalletStatus>("idle");
  const [authMessage,   setAuthMessage]   = useState<string>("");
  const [piAccessToken, setPiAccessToken] = useState<string | null>(null);
  const [userData,      setUserData]      = useState<LoginDTO | null>(null);

  // ── Internal helpers ──────────────────────────────────────────────────────

  const getErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error)) return "An unexpected error occurred.";
    const m = error.message;
    if (m.includes("SDK failed to load")) return m;
    if (m.includes("authenticate"))       return "Pi authentication failed. Please try again.";
    if (m.includes("login"))              return "Backend login failed. Please try again.";
    return m;
  };

  // ── connect ───────────────────────────────────────────────────────────────

  const connect = useCallback(async (): Promise<void> => {
    // Prevent double-connect
    if (walletStatus === "connecting" || walletStatus === "connected") return;

    try {
      setWalletStatus("connecting");
      setAuthMessage("Loading Pi Network SDK...");

      await loadPiSDK();

      if (typeof window.Pi === "undefined") {
        throw new Error("SDK failed to load. Check your network connection.");
      }

      setAuthMessage("Initializing Pi Network...");
      await window.Pi.init({
        version: "2.0",
        sandbox: PI_NETWORK_CONFIG.SANDBOX,
      });

      setAuthMessage("Authenticating with Pi Network...");
      const piAuthResult = await window.Pi.authenticate(
        ["username", "payments"],
        async (payment) => {
          // Give the SDK a moment to settle before recovering incomplete payments
          await new Promise((r) => setTimeout(r, 1500));
          await checkIncompletePayments(payment);
        }
      );

      if (!piAuthResult?.accessToken) {
        throw new Error("No access token received from Pi Network.");
      }

      setAuthMessage("Verifying identity...");

      // Verify the token server-side via our own Next.js route handler.
      // This calls the Pi Platform API using PI_API_KEY — never exposed to the browser.
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: piAuthResult.accessToken }),
      });

      if (!verifyRes.ok) {
        const errBody = await verifyRes.json().catch(() => ({}));
        throw new Error(
          errBody?.error ?? `Token verification failed (${verifyRes.status})`
        );
      }

      const verifiedUser: LoginDTO = await verifyRes.json();

      setPiAccessToken(piAuthResult.accessToken);
      setApiAuthToken(piAuthResult.accessToken);
      setUserData(verifiedUser);

      initializeGlobalPayment();

      setWalletStatus("connected");
      setAuthMessage(`Connected as @${verifiedUser.username}`);
    } catch (err) {
      console.error("Pi wallet connection failed:", err);
      setWalletStatus("error");
      setAuthMessage(getErrorMessage(err));
    }
  }, [walletStatus]);

  // ── disconnect ────────────────────────────────────────────────────────────

  const disconnect = useCallback((): void => {
    setPiAccessToken(null);
    setApiAuthToken(null as unknown as string);
    setUserData(null);
    setWalletStatus("disconnected");
    setAuthMessage("Wallet disconnected.");
  }, []);

  // ── Auto-connect on mount ─────────────────────────────────────────────────

  useEffect(() => {
    connect();
    // Intentionally omit connect from deps — run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value: PiAuthContextType = {
    walletStatus,
    isAuthenticated: walletStatus === "connected",
    authMessage,
    hasError: walletStatus === "error",
    piAccessToken,
    userData,
    connect,
    disconnect,
    reinitialize: connect,
  };

  return (
    <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthProvider");
  }
  return context;
}
