"use client";

import { useState, useEffect, useRef } from "react";
import EthOrderBookHorizontal from "@/components/EthOrderBookHorizontal";
import TradingViewChart from "@/components/TradingViewChart";
import { useAuctionSimulation } from "@/hooks/useAuctionSimulation";

const API_BASE = "/api/proxy";

interface AuctionStatus {
  status: "open" | "closed" | "idle";
  end_time: string;
  seconds_remaining: number;
  order_count: number;
  buy_orders: ApiOrder[];
  sell_orders: ApiOrder[];
}

interface ApiOrder {
  order_id: string;
  price: number;
  quantity: number;
  side: string;
  user_id: string;
  wallet_address: string;
}

interface Trade {
  trade_id: string;
  buyer: string;
  seller: string;
  price: number;
  quantity: number;
  notional_usdc: number;
  buyer_wallet: string;
  seller_wallet: string;
}

interface CantonResponse {
  transactionId?: string;
  updateId?: string;
  completionOffset?: number;
  createdContracts?: Record<string, string>;
  status?: string;
}

interface AuctionResult {
  auction_id: string;
  clearing_price: number;
  matched_quantity: number;
  closed_at: string;
  trades: Trade[];
  unmatched: ApiOrder[];
  settlement?: {
    instructions: unknown[];
    canton_response: CantonResponse;
  } | null;
}

interface SubmittedOrder {
  id: string;
  side: "buy" | "sell";
  price: string;
  quantity: string;
  placedAt: string;
}

export default function AuctionPage() {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const USER_ID = "ETH_NYC_TRADER";
  const WALLET_ADDRESS = "0xa3f8b2c1d4e97605f3a2b8c4d1e6f0a9b5c3d7e2";
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<AuctionStatus | null>(null);
  const [auctionResult, setAuctionResult] = useState<AuctionResult | null>(null);
  const [auctionDuration, setAuctionDuration] = useState("5");
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const fetchResult = async () => {
    try {
      const res = await fetch(`${API_BASE}/auction/result`);
      if (res.ok) {
        const data = await res.json();
        if (data.clearing_price !== undefined && data.matched_quantity !== undefined) setAuctionResult(data);
      }
    } catch {
      // silently fail
    }
  };

  // Poll auction status every 5s; detect open→closed transition
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/auction/status`);
        if (!res.ok) return;
        const data: AuctionStatus = await res.json();
        setAuctionStatus(data);

        if (data.status === "open") {
          setLocalSeconds(Math.floor(data.seconds_remaining));
        } else {
          setLocalSeconds(null);
          // Fetch result if we just transitioned from open → closed
          if (prevStatusRef.current === "open") fetchResult();
        }
        prevStatusRef.current = data.status;
      } catch {
        // silently fail
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Smooth local countdown; attempt result fetch 2s after hitting 0
  useEffect(() => {
    if (localSeconds === null || localSeconds <= 0) {
      if (localSeconds === 0) {
        const t = setTimeout(fetchResult, 2000);
        return () => clearTimeout(t);
      }
      return;
    }
    const timer = setTimeout(
      () => setLocalSeconds((s) => (s !== null ? Math.max(0, s - 1) : null)),
      1000
    );
    return () => clearTimeout(timer);
  }, [localSeconds]);

  const isOpen = auctionStatus?.status === "open";
  useAuctionSimulation(isOpen);
  const mins = localSeconds !== null ? Math.floor(localSeconds / 60) : 0;
  const secs = localSeconds !== null ? localSeconds % 60 : 0;
  const timeDisplay =
    isOpen && localSeconds !== null
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : "—";

  const total =
    price && quantity
      ? (parseFloat(price) * parseFloat(quantity)).toFixed(2)
      : "—";

  async function startAuction() {
    setIsStarting(true);
    setAuctionResult(null);
    try {
      const res = await fetch(`${API_BASE}/auction/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration_minutes: parseFloat(auctionDuration) }),
      });
      const data = await res.json();
      if (data.status === "started") {
        setAuctionStatus((prev) => ({
          ...(prev ?? ({} as AuctionStatus)),
          status: "open",
          end_time: data.end_time,
          seconds_remaining: parseFloat(auctionDuration) * 60,
          order_count: 0,
          buy_orders: [],
          sell_orders: [],
        }));
        setLocalSeconds(Math.floor(parseFloat(auctionDuration) * 60));
        prevStatusRef.current = "open";
      }
    } catch {
      // ignore
    } finally {
      setIsStarting(false);
    }
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!price || !quantity) return;
    setIsSubmitting(true);
    setOrderError(null);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side,
          price: parseFloat(price),
          quantity: parseFloat(quantity),
          user_id: USER_ID,
          wallet_address: WALLET_ADDRESS,
        }),
      });
      const data = await res.json();
      if (data.order_id) {
        setOrders((prev) => [
          { id: data.order_id, side, price, quantity, placedAt: new Date().toLocaleTimeString() },
          ...prev,
        ]);
        setPrice("");
        setQuantity("");
      } else {
        setOrderError(data.error ?? "Order rejected.");
      }
    } catch {
      setOrderError("Failed to reach API.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="flex flex-col bg-[#232323] text-[#dcd5dd]"
      style={{ height: "calc(95vh - 88px)" }}
    >
      {/* Order book */}
      <div className="-mt-5 shrink-0">
        <EthOrderBookHorizontal />
      </div>

      {/* Chart + Order form */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-4 px-6 py-3">
        <div className="col-span-2 rounded-xl overflow-hidden border border-[#3a3a3a]">
          <TradingViewChart />
        </div>

        <div className="col-span-1 bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-5 flex flex-col gap-3 overflow-y-auto">
          <h2 className="text-xs font-mono font-bold tracking-widest uppercase">
            Place Limit Order
          </h2>

          <div className="flex rounded-lg overflow-hidden border border-[#3a3a3a]">
            <button
              className={`flex-1 py-2 text-xs font-mono font-bold transition-colors ${
                side === "buy" ? "bg-green-700 text-white" : "bg-transparent text-[#888] hover:text-[#dcd5dd]"
              }`}
              onClick={() => setSide("buy")}
            >
              BUY
            </button>
            <button
              className={`flex-1 py-2 text-xs font-mono font-bold transition-colors ${
                side === "sell" ? "bg-red-700 text-white" : "bg-transparent text-[#888] hover:text-[#dcd5dd]"
              }`}
              onClick={() => setSide("sell")}
            >
              SELL
            </button>
          </div>

          <form onSubmit={submitOrder} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-[#888]">Limit Price (USD)</label>
              <input
                type="number" step="0.1" min="0" placeholder="0.00"
                value={price} onChange={(e) => setPrice(e.target.value)}
                className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm font-mono text-[#dcd5dd] placeholder-[#555] focus:outline-none focus:border-[#595759]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-[#888]">Quantity (ETH)</label>
              <input
                type="number" step="0.001" min="0" placeholder="0.000"
                value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm font-mono text-[#dcd5dd] placeholder-[#555] focus:outline-none focus:border-[#595759]"
              />
            </div>
            <div className="flex justify-between items-center py-2 border-t border-[#3a3a3a]">
              <span className="text-xs font-mono text-[#888]">Total</span>
              <span className="text-sm font-mono">${total}</span>
            </div>
            {orderError && <p className="text-xs font-mono text-red-400">{orderError}</p>}
            <button
              type="submit"
              disabled={isSubmitting || !isOpen}
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                side === "buy" ? "bg-green-700 hover:bg-green-600 text-white" : "bg-red-700 hover:bg-red-600 text-white"
              }`}
            >
              {isSubmitting ? "SUBMITTING..." : !isOpen ? "AUCTION NOT OPEN" : side === "buy" ? "SUBMIT BUY ORDER" : "SUBMIT SELL ORDER"}
            </button>
          </form>
        </div>
      </div>

      {/* Auction details + Orders / Results */}
      <div className="shrink-0 grid grid-cols-2 gap-4 px-6 pb-4" style={{ height: "180px" }}>

        {/* Auction details */}
        <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono font-bold tracking-widest uppercase">
              Auction Details
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="number" min="1" max="60"
                value={auctionDuration} onChange={(e) => setAuctionDuration(e.target.value)}
                className="w-12 bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-0.5 text-xs font-mono text-[#dcd5dd] focus:outline-none text-center"
              />
              <span className="text-xs font-mono text-[#888]">min</span>
              <button
                onClick={startAuction}
                disabled={isStarting || isOpen}
                className="px-3 py-0.5 rounded text-xs font-mono font-bold bg-[#595759] hover:bg-[#6a686a] text-[#dcd5dd] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isStarting ? "STARTING…" : "START"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-2">
            {([
              ["Status", auctionStatus?.status?.toUpperCase() ?? "—"],
              ["Orders", auctionStatus?.order_count?.toString() ?? "—"],
              ["Time Remaining", timeDisplay],
              ["Clearing Price", auctionResult ? `$${auctionResult.clearing_price}` : "—"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-mono text-[#888]">{label}</span>
                <span className={`text-sm font-mono ${label === "Status" && isOpen ? "text-green-400" : label === "Clearing Price" && auctionResult ? "text-[#dcd5dd] font-bold" : "text-[#dcd5dd]"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Results panel (after close) or Your Orders (during/before) */}
        <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-4 overflow-y-auto">
          {auctionResult ? (
            <>
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase mb-3 text-[#dcd5dd]">
                Auction Result
                <span className="ml-2 text-[#888] font-normal normal-case">
                  {auctionResult.matched_quantity} ETH matched @ ${auctionResult.clearing_price}
                </span>
              </h2>
              {auctionResult.trades.length === 0 ? (
                <p className="text-xs font-mono text-[#555]">No trades matched.</p>
              ) : (
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-[#888] border-b border-[#3a3a3a]">
                      <th className="text-left pb-2">Buyer</th>
                      <th className="text-left pb-2">Seller</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Notional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auctionResult.trades.map((t) => (
                      <tr key={t.trade_id} className="border-b border-[#2f2f2f]">
                        <td className="py-1.5 text-green-400">{t.buyer}</td>
                        <td className="py-1.5 text-red-400">{t.seller}</td>
                        <td className="text-right py-1.5">{t.quantity}</td>
                        <td className="text-right py-1.5">${t.notional_usdc.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {(() => {
                const cr = auctionResult.settlement?.canton_response;
                if (!cr?.transactionId) return null;
                const txId = cr.transactionId;
                const shortTx = `${txId.slice(0, 10)}…${txId.slice(-6)}`;
                return (
                  <div className="mt-3 pt-3 border-t border-[#3a3a3a]">
                    <p className="text-xs font-mono font-bold tracking-widest uppercase text-[#888] mb-2">
                      Canton Settlement
                    </p>
                    <div className="flex flex-col gap-1 text-xs font-mono">
                      <div className="flex justify-between gap-2">
                        <span className="text-[#888] shrink-0">Tx ID</span>
                        <span className="text-[#a78bfa] truncate" title={txId}>{shortTx}</span>
                      </div>
                      {cr.completionOffset !== undefined && (
                        <div className="flex justify-between gap-2">
                          <span className="text-[#888] shrink-0">Offset</span>
                          <span className="text-[#dcd5dd]">{cr.completionOffset}</span>
                        </div>
                      )}
                      {cr.createdContracts && Object.entries(cr.createdContracts).map(([tmpl, cid]) => (
                        <div key={tmpl} className="flex justify-between gap-2">
                          <span className="text-[#888] shrink-0 truncate">{tmpl.split(":").pop()}</span>
                          <span className="text-[#dcd5dd] truncate" title={cid}>{`${cid.slice(0, 8)}…`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase mb-3">
                Your Orders
              </h2>
              {orders.length === 0 ? (
                <p className="text-xs font-mono text-[#555]">No orders placed.</p>
              ) : (
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-[#888] border-b border-[#3a3a3a]">
                      <th className="text-left pb-2">Side</th>
                      <th className="text-right pb-2">Price</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-[#2f2f2f]">
                        <td className={`py-1.5 font-bold ${o.side === "buy" ? "text-green-400" : "text-red-400"}`}>
                          {o.side.toUpperCase()}
                        </td>
                        <td className="text-right py-1.5">${o.price}</td>
                        <td className="text-right py-1.5">{o.quantity}</td>
                        <td className="text-right py-1.5 text-[#888]">{o.placedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
