"use client";

import { useState } from "react";
import EthOrderBookHorizontal from "@/components/EthOrderBookHorizontal";
import TradingViewChart from "@/components/TradingViewChart";

interface LimitOrder {
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
  const [orders, setOrders] = useState<LimitOrder[]>([]);

  const total =
    price && quantity
      ? (parseFloat(price) * parseFloat(quantity)).toFixed(2)
      : "—";

  function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!price || !quantity) return;
    const order: LimitOrder = {
      id: crypto.randomUUID(),
      side,
      price,
      quantity,
      placedAt: new Date().toLocaleTimeString(),
    };
    setOrders((prev) => [order, ...prev]);
    setPrice("");
    setQuantity("");
  }

  return (
    <div className="min-h-screen bg-[#232323] text-[#dcd5dd]">
      {/* Order book */}
      <div className="-mt-5">
        <EthOrderBookHorizontal />
      </div>

      {/* Chart + Order form */}
      <div className="grid grid-cols-3 gap-4 px-6 pb-4">
        {/* Chart */}
        <div className="col-span-2 h-[420px] rounded-xl overflow-hidden border border-[#3a3a3a]">
          <TradingViewChart />
        </div>

        {/* Order form */}
        <div className="col-span-1 bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-5 flex flex-col gap-4">
          <h2 className="text-xs font-mono font-bold tracking-widest text-[#dcd5dd] uppercase">
            Place Limit Order
          </h2>

          {/* Buy / Sell toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[#3a3a3a]">
            <button
              className={`flex-1 py-2 text-xs font-mono font-bold transition-colors ${
                side === "buy"
                  ? "bg-green-700 text-white"
                  : "bg-transparent text-[#888] hover:text-[#dcd5dd]"
              }`}
              onClick={() => setSide("buy")}
            >
              BUY
            </button>
            <button
              className={`flex-1 py-2 text-xs font-mono font-bold transition-colors ${
                side === "sell"
                  ? "bg-red-700 text-white"
                  : "bg-transparent text-[#888] hover:text-[#dcd5dd]"
              }`}
              onClick={() => setSide("sell")}
            >
              SELL
            </button>
          </div>

          <form onSubmit={submitOrder} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-[#888]">
                Limit Price (USD)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm font-mono text-[#dcd5dd] placeholder-[#555] focus:outline-none focus:border-[#595759]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-[#888]">
                Quantity (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm font-mono text-[#dcd5dd] placeholder-[#555] focus:outline-none focus:border-[#595759]"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-t border-[#3a3a3a]">
              <span className="text-xs font-mono text-[#888]">Total</span>
              <span className="text-sm font-mono text-[#dcd5dd]">
                ${total}
              </span>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-widest transition-colors ${
                side === "buy"
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-red-700 hover:bg-red-600 text-white"
              }`}
            >
              {side === "buy" ? "SUBMIT BUY ORDER" : "SUBMIT SELL ORDER"}
            </button>
          </form>
        </div>
      </div>

      {/* Auction details + User orders */}
      <div className="grid grid-cols-2 gap-4 px-6 pb-8">
        {/* Auction details */}
        <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-5">
          <h2 className="text-xs font-mono font-bold tracking-widest text-[#dcd5dd] uppercase mb-4">
            Auction Details
          </h2>
          <div className="grid grid-cols-2 gap-y-3">
            {[
              ["Status", "Inactive"],
              ["Round", "—"],
              ["Time Remaining", "—"],
              ["Clearing Price", "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-mono text-[#888]">{label}</span>
                <span className="text-sm font-mono text-[#dcd5dd]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User orders */}
        <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-5">
          <h2 className="text-xs font-mono font-bold tracking-widest text-[#dcd5dd] uppercase mb-4">
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
                  <th className="text-right pb-2">Qty (ETH)</th>
                  <th className="text-right pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#2f2f2f]">
                    <td
                      className={`py-1.5 font-bold ${
                        o.side === "buy" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {o.side.toUpperCase()}
                    </td>
                    <td className="text-right py-1.5">${o.price}</td>
                    <td className="text-right py-1.5">{o.quantity}</td>
                    <td className="text-right py-1.5 text-[#888]">
                      {o.placedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
