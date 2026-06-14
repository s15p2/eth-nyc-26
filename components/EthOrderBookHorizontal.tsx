"use client";

import React, { useEffect, useRef, useState } from "react";

type Order = [number, number];
type HighlightedTrade = { price: number; side: "B" | "A" };

const COL_WIDTH = 72; // px per column (w-16 = 64px + mx-1*2 = 8px)
const SIDE_LEVELS = 40; // build a wide book; we'll slice to fit

function formatPrice(num: number) {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function buildFullBook(bids: Order[], asks: Order[], sideLevels: number) {
  if (bids.length === 0 || asks.length === 0) return [];
  const tick = 0.1;
  const bestBid = Math.max(...bids.map(([p]) => p));
  const bestAsk = Math.min(...asks.map(([p]) => p));
  if (bestAsk <= bestBid) return [];
  const startPrice = parseFloat((bestBid - sideLevels * tick).toFixed(1));
  const endPrice = parseFloat((bestAsk + sideLevels * tick).toFixed(1));
  const levels: { price: number; bidSize: number; askSize: number }[] = [];
  let price = startPrice;
  const maxLevels =
    sideLevels * 2 + Math.round((bestAsk - bestBid) / tick) + 1;
  while (price <= endPrice && levels.length < maxLevels) {
    const bid = bids.find(([p]) => Math.abs(p - price) < 1e-6);
    const ask = asks.find(([p]) => Math.abs(p - price) < 1e-6);
    levels.push({
      price: parseFloat(price.toFixed(1)),
      bidSize: bid ? bid[1] : 0,
      askSize: ask ? ask[1] : 0,
    });
    price = parseFloat((price + tick).toFixed(1));
  }
  return levels;
}

export default function EthOrderBookHorizontal() {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [highlightedTrades, setHighlightedTrades] = useState<HighlightedTrade[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const tradesWsRef = useRef<WebSocket | null>(null);

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  // L2 book websocket
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
      if (msg.channel === "l2Book" && msg.data?.levels) {
        setBids(
          msg.data.levels[0].map((l: { px: string; sz: string }) => [
            parseFloat(l.px),
            parseFloat(l.sz),
          ])
        );
        setAsks(
          msg.data.levels[1].map((l: { px: string; sz: string }) => [
            parseFloat(l.px),
            parseFloat(l.sz),
          ])
        );
      }
    };
    return () => wsRef.current?.close();
  }, []);

  // Trades websocket for highlights
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
              prev.filter(
                (t) => Math.abs(t.price - price) > 1e-6 || t.side !== side
              )
            );
          }, 300);
        });
      }
    };
    return () => tradesWsRef.current?.close();
  }, []);

  const allLevels = buildFullBook(bids, asks, SIDE_LEVELS);
  const numCols = containerWidth > 0 ? Math.floor(containerWidth / COL_WIDTH) : 0;

  // Slice levels centered on mid-price
  let displayLevels = allLevels;
  if (numCols > 0 && allLevels.length > 0 && bids.length > 0 && asks.length > 0) {
    const midPrice =
      (Math.max(...bids.map(([p]) => p)) + Math.min(...asks.map(([p]) => p))) / 2;
    const midIdx = allLevels.reduce(
      (best, lvl, idx) =>
        Math.abs(lvl.price - midPrice) < Math.abs(allLevels[best].price - midPrice)
          ? idx
          : best,
      0
    );
    const half = Math.floor(numCols / 2);
    const start = Math.max(0, midIdx - half);
    displayLevels = allLevels.slice(start, start + numCols);
  }

  return (
    <div ref={containerRef} className="w-full py-3 px-2 overflow-hidden">
      <div className="flex flex-row flex-nowrap justify-center">
        {displayLevels.map((level, i) => {
          const highlight = highlightedTrades.find(
            (t) => Math.abs(t.price - level.price) < 1e-6
          );
          const bidSize = Math.round(level.bidSize);
          const askSize = Math.round(level.askSize);
          const color =
            bidSize > 0
              ? "text-green-400"
              : askSize > 0
              ? "text-red-400"
              : "text-gray-500";
          return (
            <div
              key={i}
              className={`flex flex-col items-center w-16 mx-1 shrink-0 transition-all duration-200 ${
                highlight
                  ? highlight.side === "B"
                    ? "ring-2 ring-green-400 bg-green-100/10"
                    : "ring-2 ring-red-400 bg-red-100/10"
                  : ""
              }`}
            >
              <span className={`text-xs font-mono ${color}`}>
                {formatPrice(level.price)}
              </span>
              <span className={`text-xs font-mono ${color}`}>
                {bidSize > 0 ? bidSize : askSize > 0 ? askSize : "0"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
