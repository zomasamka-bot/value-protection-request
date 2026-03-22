"use client";

import type { ReactNode } from "react";
import { PiAuthProvider } from "@/contexts/pi-auth-context";

/**
 * AppWrapper only provides the PiAuthProvider.
 * Pages decide what to render based on walletStatus — there is no
 * global loading gate here, which allows each page to show its own
 * wallet connection UI with a proper "Connect Wallet" button.
 */
export function AppWrapper({ children }: { children: ReactNode }) {
  return <PiAuthProvider>{children}</PiAuthProvider>;
}
