"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Segment {
  id: string;
  label: string;
  number: string;
  color: string;
  route: string;
  description: string;
  width: number;
}

const segments: Segment[] = [
  {
    id: "learn",
    label: "Learn",
    number: "01",
    color: "from-[#dcd5dd] to-[#dcd5dd]",
    route: "/learn",
    description: "Read our docs on confidential order matching and Canton-powered privacy.",
    width: 1,
  },
  {
    id: "auction",
    label: "Auction",
    number: "02",
    color: "from-[#595759] to-[#595759]",
    route: "/auction",
    description: "Submit limit orders to the daily institutional rebalancing auction. Orders that cross match privately — no information leakage, no market impact.",
    width: 3,
  },
  {
    id: "internals",
    label: "Active Auction Internals",
    number: "03",
    color: "from-[#dcd5dd] to-[#dcd5dd]",
    route: "/internals",
    description: "Live view of all placed orders, crossing levels, and time remaining in the active auction (for demo purposes).",
    width: 3,
  },
  {
    id: "about",
    label: "About",
    number: "04",
    color: "from-[#595759] to-[#595759]",
    route: "/learn",
    description: "Coming soon (click for docs).",
    width: 1,
  },
];

export default function NavigationWheel() {
  const router = useRouter();
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const handleSegmentClick = (route: string) => {
    router.push(route);
  };

  const totalWidth = segments.reduce((sum, s) => sum + s.width, 0);

  return (
    <div className="flex items-start justify-center pt-8 pb-16 bg-[#232323]">
      <div className="relative w-full max-w-6xl">
        <div className="relative w-full h-96 bg-linear-to-r from-gray-900 to-gray-800 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 flex">
            {segments.map((segment, index) => {
              const isHovered = hoveredSegment === segment.id;
              const segmentWidth = (segment.width / totalWidth) * 100;

              return (
                <div
                  key={segment.id}
                  className="relative h-full cursor-pointer transition-all duration-300 ease-out"
                  style={{ width: `${segmentWidth}%` }}
                  onMouseEnter={() => setHoveredSegment(segment.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => handleSegmentClick(segment.route)}
                >
                  <div
                    className={`absolute inset-0 bg-linear-to-b ${segment.color} transition-all duration-300 ease-out ${
                      isHovered ? "scale-110 z-10 shadow-2xl" : "scale-100"
                    }`}
                    style={{
                      left: isHovered ? "-5%" : "0%",
                      right: isHovered ? "-5%" : "0%",
                    }}
                  />

                  <div
                    className={`relative h-full flex flex-col items-center justify-center text-[#232323] transition-all duration-300 ${
                      isHovered ? "scale-110" : "scale-100"
                    }`}
                  >
                    <div className="text-xs font-mono opacity-70 mb-1">
                      {segment.number}
                    </div>
                    <div className="text-sm font-mono font-bold text-center px-2">
                      {segment.label}
                    </div>
                  </div>

                  {isHovered && (
                    <div className="absolute inset-2 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg z-10">
                      <div className="text-sm font-mono font-bold text-center px-2 text-[#dcd5dd]">
                        {segment.description}
                      </div>
                    </div>
                  )}

                  {index < segments.length - 1 && (
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-600/50 z-5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-8">
          <div className="text-xs text-[#dcd5dd] font-mono">
            INSTITUTIONAL REBALANCING, PRIVATELY
          </div>
        </div>
      </div>
    </div>
  );
}
