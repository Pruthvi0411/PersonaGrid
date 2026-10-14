"use client";

/**
 * PersonaGrid - Real-Time Wallet SSE Stream Hook
 * Architecture Philosophy: "Antigravity"
 *  - Native browser EventSource (SSE) with zero WebSocket framing overhead.
 *  - Unidirectional push: HTTP/2 multiplexed, proxy-friendly, auto-reconnecting.
 *  - High-precision balance accounting without IEEE 754 floating-point drift.
 *  - Optimistic client-side state reconciliation with exponential backoff + jitter.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type StreamConnectionStatus =
  | "IDLE"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "DISCONNECTED"
  | "ERROR";

export interface RoyaltyEvent {
  transaction_id: string;
  persona_id: string;
  amount: string; // Stored as decimal string to avoid float precision loss
  similarity: number;
  currency: string;
  timestamp: number;
}

export interface UseWalletStreamOptions {
  apiBaseUrl?: string;
  initialBalance?: string;
  initialCurrency?: string;
  maxRecentEvents?: number;
  onRoyaltyReceived?: (royalty: RoyaltyEvent) => void;
  onError?: (error: Event) => void;
}

export interface UseWalletStreamReturn {
  balance: string;
  currency: string;
  connectionStatus: StreamConnectionStatus;
  lastRoyalty: RoyaltyEvent | null;
  recentRoyalties: RoyaltyEvent[];
  totalEarningsSession: string;
  reconnect: () => void;
  refreshBalance: () => Promise<void>;
}

/**
 * High-precision string addition for micro-unit financial balances.
 * Avoids JavaScript 0.1 + 0.2 = 0.30000000000000004 floating-point flaws.
 */
function addMicroBalances(a: string, b: string): string {
  const [aInt = "0", aDec = "000000"] = a.split(".");
  const [bInt = "0", bDec = "000000"] = b.split(".");

  const aPadded = aDec.padEnd(6, "0").slice(0, 6);
  const bPadded = bDec.padEnd(6, "0").slice(0, 6);

  const aMicros = BigInt(aInt) * 1_000_000n + BigInt(aPadded);
  const bMicros = BigInt(bInt) * 1_000_000n + BigInt(bPadded);

  const sumMicros = aMicros + bMicros;
  const sumInt = sumMicros / 1_000_000n;
  const sumDec = (sumMicros % 1_000_000n).toString().padStart(6, "0");

  return `${sumInt}.${sumDec}`;
}

export function useWalletStream(
  accountId: string | null | undefined,
  options: UseWalletStreamOptions = {}
): UseWalletStreamReturn {
  const {
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    initialBalance = "0.000000",
    initialCurrency = "CREDIT",
    maxRecentEvents = 50,
    onRoyaltyReceived,
    onError,
  } = options;

  const [balance, setBalance] = useState<string>(initialBalance);
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [connectionStatus, setConnectionStatus] = useState<StreamConnectionStatus>("IDLE");
  const [lastRoyalty, setLastRoyalty] = useState<RoyaltyEvent | null>(null);
  const [recentRoyalties, setRecentRoyalties] = useState<RoyaltyEvent[]>([]);
  const [totalEarningsSession, setTotalEarningsSession] = useState<string>("0.000000");

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch verified balance snapshot from FastAPI backend
  const refreshBalance = useCallback(async () => {
    if (!accountId) return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/wallet/${accountId}/balance`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setCurrency(data.currency);
      }
    } catch (err) {
      console.error("[useWalletStream] Failed to refresh wallet balance:", err);
    }
  }, [accountId, apiBaseUrl]);

  // Clean tear-down of any active stream connection
  const closeStream = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Connect or Reconnect SSE stream
  const connectStream = useCallback(() => {
    if (!accountId || typeof window === "undefined") {
      setConnectionStatus("IDLE");
      return;
    }

    closeStream();
    setConnectionStatus(retryCountRef.current > 0 ? "RECONNECTING" : "CONNECTING");

    const streamUrl = `${apiBaseUrl}/api/v1/wallet/stream/${accountId}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    // Handle generic open
    es.onopen = () => {
      setConnectionStatus("CONNECTED");
      retryCountRef.current = 0; // Reset backoff on successful handshake
    };

    // Handle explicit connected handshake event from FastAPI
    es.addEventListener("connected", () => {
      setConnectionStatus("CONNECTED");
      retryCountRef.current = 0;
    });

    // Handle real-time micro-leasing royalty receipt
    es.addEventListener("royalty_received", (event: MessageEvent) => {
      try {
        const payload: RoyaltyEvent = JSON.parse(event.data);

        setLastRoyalty(payload);
        setRecentRoyalties((prev) => [payload, ...prev.slice(0, maxRecentEvents - 1)]);

        // Optimistically increment wallet balance with micro-precision
        setBalance((prev) => addMicroBalances(prev, payload.amount));
        setTotalEarningsSession((prev) => addMicroBalances(prev, payload.amount));

        onRoyaltyReceived?.(payload);
      } catch (parseError) {
        console.error("[useWalletStream] Malformed royalty event received:", parseError);
      }
    });

    // Handle stream error & exponential backoff reconnection
    es.onerror = (err) => {
      onError?.(err);
      closeStream();

      // Exponential backoff with full jitter: delay = min(30s, 1s * 2^retries + jitter)
      retryCountRef.current += 1;
      const baseDelay = Math.min(30000, 1000 * Math.pow(2, retryCountRef.current));
      const jitter = Math.random() * 1000;
      const nextDelay = baseDelay + jitter;

      setConnectionStatus("RECONNECTING");
      retryTimeoutRef.current = setTimeout(() => {
        connectStream();
      }, nextDelay);
    };
  }, [accountId, apiBaseUrl, closeStream, maxRecentEvents, onError, onRoyaltyReceived]);

  // Initial balance hydration and stream lifecycle binding
  useEffect(() => {
    if (!accountId) {
      setConnectionStatus("IDLE");
      return;
    }

    // Refresh balance snapshot on account switch
    refreshBalance();
    connectStream();

    return () => {
      closeStream();
    };
  }, [accountId, connectStream, closeStream, refreshBalance]);

  return {
    balance,
    currency,
    connectionStatus,
    lastRoyalty,
    recentRoyalties,
    totalEarningsSession,
    reconnect: connectStream,
    refreshBalance,
  };
}
