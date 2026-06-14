"use client";

import { useEffect, useRef } from "react";

const API_BASE = "/api/proxy";

const INSTITUTIONS = [
  "Blackwater Capital", "Meridian Fund", "Atlas Asset Management",
  "Horizon Investments", "Apex Trading", "Summit Capital",
  "Vertex Partners", "Nexus Capital", "Pinnacle Fund", "Sterling Group",
  "Vortex Trading", "Cascade Capital", "Solaris Fund", "Ironwood Capital",
  "Redwood Partners", "Titan Strategies", "Cobalt Asset Management",
  "Dune Capital", "Tempest Trading", "Glacier Investments",
];

const INDIVIDUALS = [
  "Alice Chen", "Bob Martinez", "Carol Singh", "David Wu",
  "Emma Taylor", "Frank Okafor", "Grace Kim", "Henry Patel",
  "Isabel Santos", "James Liu", "Karen Johnson", "Leo Zhang",
  "Mia Brown", "Noah Williams", "Olivia Davis", "Patrick O'Brien",
  "Quinn Reed", "Rachel Foster", "Sam Nakamura", "Tara Osei",
];

const ALL_NAMES = [...INSTITUTIONS, ...INDIVIDUALS];

function randomName() {
  return ALL_NAMES[Math.floor(Math.random() * ALL_NAMES.length)];
}

function randomWallet() {
  const hex = Array.from({ length: 40 }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)]
  ).join("");
  return "0x" + hex;
}

// Box-Muller normal distribution
function randn(mean: number, std: number) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function randomPrice(side: "buy" | "sell"): number {
  const mean = side === "buy" ? 1660 : 1700;
  const raw = randn(mean, 20);
  // Clamp to 5% of 1680 (1596–1764) and round to integer
  return Math.round(Math.max(1596, Math.min(1764, raw)));
}

function randomQuantity(): number {
  const r = Math.random();
  if (r < 0.75) {
    // Small trades: 1–100
    return Math.floor(Math.random() * 100) + 1;
  } else if (r < 0.92) {
    // Medium trades: 101–10,000
    return Math.floor(Math.random() * 9_900) + 101;
  } else {
    // Large institutional: 1,000,000–100,000,000
    return Math.floor(Math.random() * 99_000_000) + 1_000_000;
  }
}

export function useAuctionSimulation(isOpen: boolean) {
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    if (!isOpen) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let active = true;

    const placeOrder = async () => {
      const side: "buy" | "sell" = Math.random() < 0.5 ? "buy" : "sell";
      try {
        await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            side,
            price: randomPrice(side),
            quantity: randomQuantity(),
            user_id: randomName(),
            wallet_address: randomWallet(),
          }),
        });
      } catch {
        // silently ignore — auction may have just closed
      }
    };

    const schedule = () => {
      if (!active || !isOpenRef.current) return;
      // Place an order every 50–200ms (~10x original pace)
      const delay = 50 + Math.random() * 150;
      timeoutId = setTimeout(async () => {
        await placeOrder();
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [isOpen]);
}
