"use client";

import React, { useEffect, useRef, useState } from "react";

type Order = [number, number];
type HighlightedTrade = { price: number; side: "B" | "A" };

function formatPrice(num: number) {
  return num.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatSize(num: number) {
  return Math.round(num).toString();
}

function buildFullBook(bids: Order[], asks: Order[], sideLevels: number = 15) {
  if (bids.length === 0 || asks.length === 0) return [];
  const tick = 0.1;
  const bestBid = Math.max(...bids.map(([p]) => p));
  const bestAsk = Math.min(...asks.map(([p]) => p));
  if (bestAsk <= bestBid) return [];
  const startPrice = parseFloat((bestBid - sideLevels * tick).toFixed(1));
  const endPrice = parseFloat((bestAsk + sideLevels * tick).toFixed(1));
  const levels: { price: number; bidSize: number; askSize: number }[] = [];
  let price = startPrice;
  let count = 0;
  const maxLevels = (sideLevels * 2) + Math.round((bestAsk - bestBid) / tick) + 1;
  while (price <= endPrice && count < maxLevels) {
    const bid = bids.find(([p]) => Math.abs(p - price) < 1e-6);
    const ask = asks.find(([p]) => Math.abs(p - price) < 1e-6);
    levels.push({
      price: parseFloat(price.toFixed(1)),
      bidSize: bid ? bid[1] : 0,
      askSize: ask ? ask[1] : 0,
    });
    price = parseFloat((price + tick).toFixed(1));
    count++;
  }
  return levels;
}

export default function EthOrderBookHorizontal() {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [highlightedTrades, setHighlightedTrades] = useState<HighlightedTrade[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const tradesWsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "l2Book", coin: "ETH" },
        })
      );
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.channel === "l2Book" && msg.data && msg.data.levels) {
        const bids = msg.data.levels[0].map((level: { px: string; sz: string }) => [parseFloat(level.px), parseFloat(level.sz)]);
        const asks = msg.data.levels[1].map((level: { px: string; sz: string }) => [parseFloat(level.px), parseFloat(level.sz)]);
        setBids(bids);
        setAsks(asks);
      }
    };
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (tradesWsRef.current) tradesWsRef.current.close();
    const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");
    tradesWsRef.current = ws;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "trades", coin: "ETH" },
        })
      );
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.channel === "trades" && Array.isArray(msg.data)) {
        msg.data.forEach((trade: { px: string; side: "B" | "A" }) => {
          const price = parseFloat(trade.px);
          const side = trade.side;
          setHighlightedTrades((prev) => [...prev, { price, side }]);
          setTimeout(() => {
            setHighlightedTrades((prev) =>
              prev.filter((t) => Math.abs(t.price - price) > 1e-6 || t.side !== side)
            );
          }, 300);
        });
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  const bookLevels = buildFullBook(bids, asks, 15);

  return (
    <div className="w-full py-3 px-2 flex flex-col items-center">
      <div className="w-full max-w-7xl flex flex-col gap-2">
        <div className="flex w-full gap-0">
          <div className="flex-1 flex flex-row justify-center w-full">
            {bookLevels.map((level, i) => {
              const highlight = highlightedTrades.find(
                (t) => Math.abs(t.price - level.price) < 1e-6
              );
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center w-20 mx-2 transition-all duration-200 ${
                    highlight
                      ? highlight.side === "B"
                        ? "ring-2 ring-green-400 bg-green-100/10"
                        : "ring-2 ring-red-400 bg-red-100/10"
                      : ""
                  }`}
                >
                  <span
                    className={
                      level.bidSize > 0
                        ? "text-green-400 text-xs font-mono"
                        : level.askSize > 0
                        ? "text-red-400 text-xs font-mono"
                        : "text-gray-500 text-xs font-mono"
                    }
                  >
                    {formatPrice(level.price)}
                  </span>
                  <span
                    className={
                      level.bidSize > 0
                        ? "text-green-400 text-xs font-mono"
                        : level.askSize > 0
                        ? "text-red-400 text-xs font-mono"
                        : "text-gray-500 text-xs font-mono"
                    }
                  >
                    {level.bidSize > 0
                      ? formatSize(level.bidSize)
                      : level.askSize > 0
                      ? formatSize(level.askSize)
                      : "0"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
