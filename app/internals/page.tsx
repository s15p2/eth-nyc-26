"use client";

import { useState, useEffect, useRef } from "react";
import { useAuctionSimulation } from "@/hooks/useAuctionSimulation";

const API_BASE =
  "http://matching-engine-env.eba-mgf4rpvy.us-east-1.elasticbeanstalk.com";

interface ApiOrder {
  order_id: string;
  price: number;
  quantity: number;
  side: string;
  user_id: string;
  wallet_address: string;
}

interface AuctionStatus {
  status: "open" | "closed" | "idle";
  seconds_remaining: number;
  order_count: number;
  buy_orders: ApiOrder[];
  sell_orders: ApiOrder[];
}

interface AuctionResult {
  auction_id: string;
  clearing_price: number;
  matched_quantity: number;
  closed_at: string;
  trades: { trade_id: string; quantity: number; price: number }[];
  unmatched: ApiOrder[];
}

interface PriceLevel {
  price: number;
  quantity: number;
  userCount: number;
}

interface BookRow {
  price: number;
  bid: PriceLevel | null;
  ask: PriceLevel | null;
  isCrossing: boolean;
}

function aggregateLevels(orders: ApiOrder[]): PriceLevel[] {
  const map = new Map<number, { quantity: number; users: Set<string> }>();
  for (const o of orders) {
    const price = Math.round(o.price / 10) * 10;
    if (!map.has(price)) map.set(price, { quantity: 0, users: new Set() });
    const lvl = map.get(price)!;
    lvl.quantity += o.quantity;
    lvl.users.add(o.user_id);
  }
  return Array.from(map.entries()).map(([price, { quantity, users }]) => ({
    price,
    quantity,
    userCount: users.size,
  }));
}

function buildBook(status: AuctionStatus): BookRow[] {
  const bidLevels = aggregateLevels(status.buy_orders);
  const askLevels = aggregateLevels(status.sell_orders);

  const bestBid =
    bidLevels.length > 0 ? Math.max(...bidLevels.map((l) => l.price)) : -Infinity;
  const bestAsk =
    askLevels.length > 0 ? Math.min(...askLevels.map((l) => l.price)) : Infinity;

  const allPrices = [
    ...new Set([...bidLevels.map((l) => l.price), ...askLevels.map((l) => l.price)]),
  ].sort((a, b) => b - a);

  return allPrices.map((price) => {
    const bid = bidLevels.find((l) => l.price === price) ?? null;
    const ask = askLevels.find((l) => l.price === price) ?? null;
    const isCrossing =
      (bid !== null && price >= bestAsk) || (ask !== null && price <= bestBid);
    return { price, bid, ask, isCrossing };
  });
}

export default function InternalsPage() {
  const [status, setStatus] = useState<AuctionStatus | null>(null);
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [result, setResult] = useState<AuctionResult | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const fetchResult = async () => {
    try {
      const res = await fetch(`${API_BASE}/auction/result`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.error) setResult(data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/auction/status`);
        if (!res.ok) return;
        const data: AuctionStatus = await res.json();
        setStatus(data);
        setLastUpdated(new Date());
        if (data.status === "open") {
          setLocalSeconds(Math.floor(data.seconds_remaining));
          setResult(null); // clear stale result when new auction opens
        } else {
          setLocalSeconds(null);
          if (prevStatusRef.current === "open") fetchResult(); // transition → fetch
        }
        prevStatusRef.current = data.status;
      } catch {
        // silently fail
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Smooth local countdown; fetch result 2s after hitting 0
  useEffect(() => {
    if (localSeconds === null || localSeconds <= 0) {
      if (localSeconds === 0) {
        const t = setTimeout(fetchResult, 2000);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(
      () => setLocalSeconds((s) => (s !== null ? Math.max(0, s - 1) : null)),
      1000
    );
    return () => clearTimeout(t);
  }, [localSeconds]);

  const isOpen = status?.status === "open";
  useAuctionSimulation(isOpen);
  const book = status ? buildBook(status) : [];
  const crossingCount = book.filter((r) => r.isCrossing).length;

  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Keep the crossing zone centred in the scroll container
  useEffect(() => {
    const container = tableScrollRef.current;
    if (!container || book.length === 0) return;
    const firstCrossingIdx = book.findIndex((r) => r.isCrossing);
    const targetIdx = firstCrossingIdx >= 0 ? firstCrossingIdx : Math.floor(book.length / 2);
    const ROW_HEIGHT = 37; // py-2.5 rows ≈ 37px
    const scrollTop = targetIdx * ROW_HEIGHT - container.clientHeight / 2 + ROW_HEIGHT / 2;
    container.scrollTop = Math.max(0, scrollTop);
  }, [book]);

  return (
    <div className="h-screen overflow-hidden bg-[#232323] text-[#dcd5dd] px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xs font-mono font-bold tracking-widest uppercase text-[#888] mb-1">
            Active Auction Internals
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isOpen ? "bg-green-400" : "bg-[#555]"
              }`}
            />
            <span className="text-sm font-mono">
              {isOpen ? "OPEN" : status?.status?.toUpperCase() ?? "—"}
            </span>
            {status && (
              <span className="text-xs font-mono text-[#555]">
                {status.order_count} order{status.order_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Countdown */}
        <div className="text-right">
          <div className="text-xs font-mono text-[#888] mb-1 uppercase tracking-widest">
            Time Remaining
          </div>
          <div
            className={`text-5xl font-mono font-bold tabular-nums ${
              localSeconds !== null && localSeconds <= 30
                ? "text-red-400"
                : "text-[#dcd5dd]"
            }`}
          >
            {localSeconds !== null
              ? `${Math.floor(localSeconds / 60)
                  .toString()
                  .padStart(2, "0")}:${(localSeconds % 60)
                  .toString()
                  .padStart(2, "0")}`
              : "—"}
          </div>
          {lastUpdated && (
            <div className="text-xs font-mono text-[#444] mt-1">
              updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Order book */}
      {!status || !isOpen ? (
        <div className="flex flex-col items-center justify-center h-64 gap-6">
          {result ? (
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl px-12 py-8 flex flex-col items-center gap-4">
              <div className="text-xs font-mono text-[#888] uppercase tracking-widest">
                Auction Closed
              </div>
              <div className="flex gap-16 items-end">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-mono text-[#888]">Clearing Price</span>
                  <span className="text-4xl font-mono font-bold text-[#dcd5dd]">
                    ${result.clearing_price.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-mono text-[#888]">Volume Matched</span>
                  <span className="text-4xl font-mono font-bold text-[#dcd5dd]">
                    {result.matched_quantity.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-xs font-mono text-[#555] mt-2">
                {new Date(result.closed_at).toLocaleString("en-US", {
                  timeZone: "America/New_York",
                  dateStyle: "medium",
                  timeStyle: "long",
                })}
              </div>
            </div>
          ) : (
            <div className="text-[#555] font-mono text-sm">
              {status?.status === "closed" ? "Auction closed." : "No active auction."}
            </div>
          )}
        </div>
      ) : (
        <>
          {crossingCount > 0 && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-900/30 border border-yellow-600/40 text-xs font-mono text-yellow-400">
              {crossingCount} price level{crossingCount !== 1 ? "s" : ""} crossing —
              orders will match at auction close.
            </div>
          )}

          <div className="rounded-xl border border-[#3a3a3a] overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-[#2a2a2a] border-b border-[#3a3a3a]">
                  <th className="text-right py-3 px-4 text-[#888] font-normal w-1/6">Users</th>
                  <th className="text-right py-3 px-4 text-green-400 font-normal w-1/6">Bid Qty</th>
                  <th className="text-center py-3 px-6 text-[#888] font-normal w-1/6">Price</th>
                  <th className="text-left py-3 px-4 text-red-400 font-normal w-1/6">Ask Qty</th>
                  <th className="text-left py-3 px-4 text-[#888] font-normal w-1/6">Users</th>
                </tr>
              </thead>
            </table>
            {/* Scrollable body — height fills remaining page space */}
            <div
              ref={tableScrollRef}
              className="overflow-y-auto"
              style={{ height: "calc(100vh - 300px)" }}
            >
              <table className="w-full text-xs font-mono">
              <tbody>
                {book.map((row) => (
                  <tr
                    key={row.price}
                    className={`border-b border-[#2f2f2f] transition-colors ${
                      row.isCrossing
                        ? "bg-yellow-900/20 hover:bg-yellow-900/30"
                        : "hover:bg-[#2a2a2a]"
                    }`}
                  >
                    {/* Bid users */}
                    <td className="text-right py-2.5 px-4 text-[#888]">
                      {row.bid ? row.bid.userCount : ""}
                    </td>
                    {/* Bid qty */}
                    <td className="text-right py-2.5 px-4">
                      {row.bid ? (
                        <span className="text-green-400 font-bold">
                          {row.bid.quantity}
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                    {/* Price */}
                    <td className="text-center py-2.5 px-6">
                      <span
                        className={`font-bold ${
                          row.isCrossing ? "text-yellow-400" : "text-[#dcd5dd]"
                        }`}
                      >
                        ${row.price.toLocaleString()}
                        {row.isCrossing && (
                          <span className="ml-2 text-yellow-500 text-xs">✕</span>
                        )}
                      </span>
                    </td>
                    {/* Ask qty */}
                    <td className="text-left py-2.5 px-4">
                      {row.ask ? (
                        <span className="text-red-400 font-bold">
                          {row.ask.quantity}
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                    {/* Ask users */}
                    <td className="text-left py-2.5 px-4 text-[#888]">
                      {row.ask ? row.ask.userCount : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
