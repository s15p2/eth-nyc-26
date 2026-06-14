"use client";

import { useState } from "react";

interface DocPage {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface NavSection {
  title: string;
  pages: { id: string; title: string }[];
}

const nav: NavSection[] = [
  {
    title: "Getting Started",
    pages: [
      { id: "what-is-datum", title: "What is Datum?" },
      { id: "how-it-works", title: "How It Works" },
    ],
  },
  {
    title: "The Auction",
    pages: [
      { id: "submitting-orders", title: "Submitting Orders" },
      { id: "auction-mechanics", title: "Auction Mechanics" },
      { id: "clearing-price", title: "Clearing Price" },
    ],
  },
  {
    title: "Privacy",
    pages: [
      { id: "confidential-flow", title: "Confidential Order Flow" },
      { id: "canton-network", title: "Canton Network" },
      { id: "selective-disclosure", title: "Selective Disclosure" },
    ],
  },
  {
    title: "Settlement",
    pages: [
      { id: "trade-settlement", title: "Trade Settlement" },
      { id: "residual-orders", title: "Residual Orders" },
    ],
  },
];

const allPageIds = nav.flatMap((s) => s.pages.map((p) => p.id));

function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-blue-500/40 bg-blue-900/20 text-blue-300",
    warning: "border-yellow-500/40 bg-yellow-900/20 text-yellow-300",
    tip: "border-green-500/40 bg-green-900/20 text-green-300",
  };
  const icons = { info: "ℹ", warning: "⚠", tip: "✦" };
  return (
    <div className={`flex gap-3 border rounded-lg px-4 py-3 my-5 text-sm ${styles[type]}`}>
      <span className="mt-0.5 shrink-0">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3 my-4 text-xs font-mono text-[#dcd5dd] overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold text-[#dcd5dd] mb-2 font-sans">{children}</h1>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-[#dcd5dd] mt-10 mb-3 pb-2 border-b border-[#3a3a3a]">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#aaa] text-sm leading-7 mb-4">{children}</p>;
}
function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-[#aaa] text-sm leading-7 ml-4 list-disc">{children}</li>;
}

const pages: Record<string, DocPage> = {
  "what-is-datum": {
    id: "what-is-datum",
    title: "What is Datum?",
    content: (
      <div>
        <H1>What is Datum?</H1>
        <p className="text-[#888] text-sm mb-8">Getting Started</p>
        <P>
          Datum is an institutional-grade daily closing auction built on the Canton network.
          It enables large-scale private liquidity events where participants can rebalance
          their portfolios without revealing their positions, intentions, or trading aggression
          to the broader market.
        </P>
        <Callout type="tip">
          Datum is designed for institutions that need to move size — hedge funds, asset managers,
          and prime brokers — who currently pay wide spreads to market makers or signal their
          intent through slow TWAP execution.
        </Callout>
        <H2>The Problem</H2>
        <P>
          When a fund needs to rebalance a large position, they have limited options:
        </P>
        <ul className="mb-4 space-y-1">
          <Li>Execute a TWAP over the day — slow and still leaks intent via order flow</Li>
          <Li>Transact OTC with a market maker — pays a wide bid/ask spread</Li>
          <Li>Cross internally — only possible within a single firm</Li>
        </ul>
        <P>
          None of these options offer the combination of <strong className="text-[#dcd5dd]">price
          efficiency</strong>, <strong className="text-[#dcd5dd]">privacy</strong>, and
          <strong className="text-[#dcd5dd]"> scale</strong> that institutions need.
        </P>
        <H2>The Solution</H2>
        <P>
          Datum runs a daily closing auction where all participants submit limit orders
          confidentially during a fixed window. At the close, all crossing orders match at
          a single clearing price. No one sees anyone else's orders before settlement — not
          even Datum.
        </P>
      </div>
    ),
  },

  "how-it-works": {
    id: "how-it-works",
    title: "How It Works",
    content: (
      <div>
        <H1>How It Works</H1>
        <p className="text-[#888] text-sm mb-8">Getting Started</p>
        <P>
          Datum operates as a sealed-bid batch auction. Each auction runs for a fixed duration —
          typically 15 minutes — during which participants submit limit orders. At close, the
          engine matches all crossing orders at a single clearing price.
        </P>
        <H2>Auction Lifecycle</H2>
        <div className="flex flex-col gap-3 my-5">
          {[
            ["01 — Open", "The auction window opens. Participants submit buy and sell limit orders. No order details are visible to any other participant."],
            ["02 — Collection", "Orders accumulate over the auction period. The Canton ledger records each order under confidentiality contracts."],
            ["03 — Close", "The window closes. No further orders are accepted."],
            ["04 — Matching", "The matching engine processes all orders, finds the clearing price that maximises matched volume, and generates trade instructions."],
            ["05 — Settlement", "Settlement instructions are distributed to matched participants. Clearing price and total matched volume are published. Individual orders remain private."],
          ].map(([step, desc]) => (
            <div key={step} className="flex gap-4 p-4 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
              <span className="text-xs font-mono text-[#595759] shrink-0 mt-0.5 w-24">{step.split("—")[0]}</span>
              <div>
                <div className="text-xs font-mono text-[#dcd5dd] font-bold mb-1">{step.split("—")[1]?.trim()}</div>
                <div className="text-xs text-[#888] leading-5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <Callout type="info">
          The clearing price is always a single price for all matched trades in a given auction round —
          buyers pay no more than their limit, sellers receive no less than theirs.
        </Callout>
      </div>
    ),
  },

  "submitting-orders": {
    id: "submitting-orders",
    title: "Submitting Orders",
    content: (
      <div>
        <H1>Submitting Orders</H1>
        <p className="text-[#888] text-sm mb-8">The Auction</p>
        <P>
          During an active auction, participants submit limit orders specifying a side,
          price, and quantity. Orders are accepted only while the auction is open.
        </P>
        <H2>Order Fields</H2>
        <div className="overflow-hidden rounded-lg border border-[#3a3a3a] my-4">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-[#2a2a2a] border-b border-[#3a3a3a]">
                <th className="text-left px-4 py-3 text-[#888] font-normal">Field</th>
                <th className="text-left px-4 py-3 text-[#888] font-normal">Type</th>
                <th className="text-left px-4 py-3 text-[#888] font-normal">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["side", "\"buy\" | \"sell\"", "Direction of the order"],
                ["price", "number", "Limit price — worst acceptable execution price"],
                ["quantity", "number", "Number of units to buy or sell"],
                ["user_id", "string", "Participant identifier"],
                ["wallet_address", "string", "Settlement wallet address"],
              ].map(([field, type, desc]) => (
                <tr key={field} className="border-b border-[#2f2f2f]">
                  <td className="px-4 py-2.5 text-green-400">{field}</td>
                  <td className="px-4 py-2.5 text-[#888]">{type}</td>
                  <td className="px-4 py-2.5 text-[#aaa]">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <H2>Example</H2>
        <Code>{`POST /orders
{
  "side": "buy",
  "price": 1685,
  "quantity": 50000,
  "user_id": "fund_xyz",
  "wallet_address": "0xabc..."
}

→ { "order_id": "61596698-...", "status": "accepted" }`}</Code>
        <Callout type="warning">
          Orders submitted outside of an active auction window will be rejected. Always check
          auction status before submitting.
        </Callout>
      </div>
    ),
  },

  "auction-mechanics": {
    id: "auction-mechanics",
    title: "Auction Mechanics",
    content: (
      <div>
        <H1>Auction Mechanics</H1>
        <p className="text-[#888] text-sm mb-8">The Auction</p>
        <P>
          Datum uses a <strong className="text-[#dcd5dd]">uniform-price sealed-bid batch auction</strong>.
          All bids and offers remain sealed until the auction closes. At close, a single
          clearing price is determined and all eligible orders execute at that price.
        </P>
        <H2>Order Matching</H2>
        <P>
          After the auction closes, the matching engine:
        </P>
        <ul className="mb-6 space-y-1">
          <Li>Sorts all buy orders from highest to lowest price</Li>
          <Li>Sorts all sell orders from lowest to highest price</Li>
          <Li>Finds the price that maximises total matched volume</Li>
          <Li>Executes all crossing orders at that single clearing price</Li>
        </ul>
        <H2>Example</H2>
        <Code>{`Buy orders:  105 × 10,  103 × 20,  100 × 15
Sell orders: 100 × 10,  102 × 10,  104 × 5

Clearing price: 102.5 (midpoint of last crossing pair)
Matched:        20 units
Unmatched:      buy 100×15, sell 104×5 (returned)`}</Code>
        <Callout type="tip">
          Because all matched orders trade at the same price, buyers who bid high do not
          pay more — they simply have higher priority. This encourages honest limit pricing.
        </Callout>
      </div>
    ),
  },

  "clearing-price": {
    id: "clearing-price",
    title: "Clearing Price",
    content: (
      <div>
        <H1>Clearing Price</H1>
        <p className="text-[#888] text-sm mb-8">The Auction</p>
        <P>
          The clearing price is determined after the auction closes as the price that
          maximises matched volume across all buy and sell orders.
        </P>
        <H2>Calculation</H2>
        <P>
          The engine finds the price <code className="text-xs font-mono bg-[#1a1a1a] px-1.5 py-0.5 rounded text-[#dcd5dd]">P*</code> such that:
        </P>
        <ul className="mb-6 space-y-1">
          <Li>All buy orders with limit ≥ P* are filled</Li>
          <Li>All sell orders with limit ≤ P* are filled</Li>
          <Li>Total buy volume ≥ P* equals total sell volume ≤ P* (or the lesser side is fully filled)</Li>
        </ul>
        <P>
          When a range of prices would clear the same volume, the clearing price is set at
          the midpoint of that range.
        </P>
        <H2>Post-Auction Disclosure</H2>
        <P>
          Once settlement is complete, Datum publishes:
        </P>
        <ul className="mb-4 space-y-1">
          <Li>The clearing price</Li>
          <Li>Total matched volume</Li>
          <Li>Auction timestamp</Li>
        </ul>
        <P>
          Individual order details — who submitted what at what price — are never disclosed.
        </P>
      </div>
    ),
  },

  "confidential-flow": {
    id: "confidential-flow",
    title: "Confidential Order Flow",
    content: (
      <div>
        <H1>Confidential Order Flow</H1>
        <p className="text-[#888] text-sm mb-8">Privacy</p>
        <P>
          Privacy is the core value proposition of Datum. Large institutional orders
          reveal intent — and intent has market impact. Datum is designed so that no
          participant, counterparty, or intermediary ever sees another participant's orders.
        </P>
        <H2>What Stays Private</H2>
        <ul className="mb-6 space-y-1">
          <Li>The size of any individual order</Li>
          <Li>The limit price of any individual order</Li>
          <Li>Whether a given participant is a buyer or seller</Li>
          <Li>The current portfolio or target portfolio of any participant</Li>
          <Li>The degree of urgency or aggression of any participant</Li>
        </ul>
        <H2>What Is Published</H2>
        <ul className="mb-6 space-y-1">
          <Li>Clearing price (post-settlement)</Li>
          <Li>Total matched volume (post-settlement)</Li>
          <Li>Auction open and close times</Li>
        </ul>
        <Callout type="info">
          Each participant receives their own trade confirmation directly. They learn only
          that their order was matched (or not), at what price, and for what quantity.
          They never learn who was on the other side.
        </Callout>
      </div>
    ),
  },

  "canton-network": {
    id: "canton-network",
    title: "Canton Network",
    content: (
      <div>
        <H1>Canton Network</H1>
        <p className="text-[#888] text-sm mb-8">Privacy</p>
        <P>
          Datum is built on the <strong className="text-[#dcd5dd]">Canton network</strong>,
          a privacy-preserving distributed ledger designed for institutional financial applications.
          Canton's architecture makes it uniquely suited to Datum's confidentiality requirements.
        </P>
        <H2>Why Canton?</H2>
        <P>
          Unlike traditional blockchains where all transaction data is globally visible,
          Canton uses a <em className="text-[#dcd5dd]">sub-transaction privacy model</em>.
          Each piece of data is only visible to the parties that need to see it — enforced
          at the protocol level, not just by access controls.
        </P>
        <ul className="mb-6 space-y-1">
          <Li>Orders are submitted as Canton contracts visible only to the participant and the matching engine</Li>
          <Li>The matching engine processes orders without exposing them to other participants</Li>
          <Li>Settlement instructions are distributed directly to matched parties</Li>
          <Li>The ledger provides cryptographic proof of correct execution</Li>
        </ul>
        <Callout type="tip">
          Canton's privacy model means Datum can provide the auditability and finality of
          a distributed ledger without sacrificing the confidentiality that institutions require.
        </Callout>
      </div>
    ),
  },

  "selective-disclosure": {
    id: "selective-disclosure",
    title: "Selective Disclosure",
    content: (
      <div>
        <H1>Selective Disclosure</H1>
        <p className="text-[#888] text-sm mb-8">Privacy</p>
        <P>
          Canton's architecture allows Datum to implement granular, role-based views of
          auction data. Different stakeholders see different levels of detail — all enforced
          cryptographically.
        </P>
        <H2>Disclosure Model</H2>
        <div className="overflow-hidden rounded-lg border border-[#3a3a3a] my-4">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-[#2a2a2a] border-b border-[#3a3a3a]">
                <th className="text-left px-4 py-3 text-[#888] font-normal">Role</th>
                <th className="text-left px-4 py-3 text-[#888] font-normal">Sees</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Participant", "Their own orders and trade confirmations only"],
                ["Market", "Clearing price + total matched volume (post-settlement)"],
                ["Regulator", "Full market-by-order (MBO) data for all participants"],
                ["Other traders", "Nothing — auction is fully opaque during the window"],
                ["Datum", "Aggregate data only; individual orders processed in confidence"],
              ].map(([role, sees]) => (
                <tr key={role} className="border-b border-[#2f2f2f]">
                  <td className="px-4 py-2.5 text-[#dcd5dd] font-bold">{role}</td>
                  <td className="px-4 py-2.5 text-[#aaa]">{sees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="info">
          Regulatory access is enabled through Canton's selective disclosure primitives —
          regulators can be granted view rights over specific contract types without being
          party to every transaction.
        </Callout>
      </div>
    ),
  },

  "trade-settlement": {
    id: "trade-settlement",
    title: "Trade Settlement",
    content: (
      <div>
        <H1>Trade Settlement</H1>
        <p className="text-[#888] text-sm mb-8">Settlement</p>
        <P>
          When the auction closes and matching is complete, the engine generates settlement
          instructions for all matched participants. Each instruction specifies the net change
          in token and USDC balances for the participant's wallet.
        </P>
        <H2>Settlement Instruction Format</H2>
        <Code>{`{
  "wallet": "0xAAA...",
  "delta_token": 50000,     // positive = received tokens
  "delta_usdc": -84250000   // negative = paid USDC
}`}</Code>
        <H2>Settlement Flow</H2>
        <ul className="mb-6 space-y-1">
          <Li>Instructions are generated immediately at auction close</Li>
          <Li>Each participant receives only their own instruction</Li>
          <Li>Canton contracts enforce atomic settlement — both legs transfer or neither does</Li>
          <Li>Settlement is final and irrevocable once confirmed on-ledger</Li>
        </ul>
        <Callout type="warning">
          Settlement instructions in the current demo are placeholders. Production settlement
          will integrate with Canton's atomic DvP (Delivery vs Payment) primitives.
        </Callout>
      </div>
    ),
  },

  "residual-orders": {
    id: "residual-orders",
    title: "Residual Orders",
    content: (
      <div>
        <H1>Residual Orders</H1>
        <p className="text-[#888] text-sm mb-8">Settlement</p>
        <P>
          Not all orders in an auction will be matched. An order may go unmatched if there
          is insufficient crossing interest on the other side, or if the order's limit price
          does not reach the clearing price.
        </P>
        <H2>What Happens to Unmatched Orders</H2>
        <ul className="mb-6 space-y-1">
          <Li>Unmatched orders are returned to the participant with no execution</Li>
          <Li>No fees are charged for unmatched orders</Li>
          <Li>Participants may resubmit in a future auction</Li>
        </ul>
        <H2>Guaranteed Execution (Roadmap)</H2>
        <P>
          A key challenge for any closing auction is bootstrapping sufficient liquidity.
          Datum's roadmap includes a <strong className="text-[#dcd5dd]">residual liquidity facility</strong>:
          a backstop pool of committed liquidity providers who agree to fill unmatched order
          flow at a pre-agreed spread. This guarantees execution for participants even when
          natural crossing interest is insufficient.
        </P>
        <Callout type="tip">
          The residual facility turns Datum into a guaranteed execution venue — participants
          can submit with confidence that their order will fill, either via natural match or
          via the backstop, at a worst-case known spread.
        </Callout>
      </div>
    ),
  },
};

export default function LearnPage() {
  const [activeId, setActiveId] = useState("what-is-datum");
  const activePage = pages[activeId];
  const activeIdx = allPageIds.indexOf(activeId);
  const prevId = activeIdx > 0 ? allPageIds[activeIdx - 1] : null;
  const nextId = activeIdx < allPageIds.length - 1 ? allPageIds[activeIdx + 1] : null;

  const prevTitle = prevId
    ? nav.flatMap((s) => s.pages).find((p) => p.id === prevId)?.title
    : null;
  const nextTitle = nextId
    ? nav.flatMap((s) => s.pages).find((p) => p.id === nextId)?.title
    : null;

  return (
    <div
      className="flex bg-[#232323] text-[#dcd5dd] overflow-hidden"
      style={{ height: "calc(100vh - 88px)" }}
    >
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[#2f2f2f] overflow-y-auto py-6 px-4">
        <div className="text-xs font-mono text-[#555] uppercase tracking-widest mb-6 px-2">
          Documentation
        </div>
        {nav.map((section) => (
          <div key={section.title} className="mb-5">
            <div className="text-xs font-mono font-bold text-[#888] uppercase tracking-widest px-2 mb-2">
              {section.title}
            </div>
            <ul className="flex flex-col gap-0.5">
              {section.pages.map((page) => (
                <li key={page.id}>
                  <button
                    onClick={() => setActiveId(page.id)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors font-sans ${
                      activeId === page.id
                        ? "bg-[#595759]/40 text-[#dcd5dd] font-medium"
                        : "text-[#888] hover:text-[#dcd5dd] hover:bg-[#2a2a2a]"
                    }`}
                  >
                    {page.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-10 py-10">
          {activePage?.content}

          {/* Prev / Next navigation */}
          <div className="flex justify-between mt-16 pt-6 border-t border-[#2f2f2f]">
            {prevId ? (
              <button
                onClick={() => setActiveId(prevId)}
                className="flex flex-col items-start gap-0.5 text-left group"
              >
                <span className="text-xs font-mono text-[#555] group-hover:text-[#888] transition-colors">
                  ← Previous
                </span>
                <span className="text-sm text-[#dcd5dd] group-hover:text-white transition-colors">
                  {prevTitle}
                </span>
              </button>
            ) : <div />}
            {nextId ? (
              <button
                onClick={() => setActiveId(nextId)}
                className="flex flex-col items-end gap-0.5 text-right group"
              >
                <span className="text-xs font-mono text-[#555] group-hover:text-[#888] transition-colors">
                  Next →
                </span>
                <span className="text-sm text-[#dcd5dd] group-hover:text-white transition-colors">
                  {nextTitle}
                </span>
              </button>
            ) : <div />}
          </div>
        </div>
      </main>
    </div>
  );
}
