"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView: {
      widget: new (config: object) => void;
    };
  }
}

export default function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerId = "tradingview_eth_chart";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: containerId,
          symbol: "COINBASE:ETHUSD",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#232323",
          enable_publishing: false,
          hide_top_toolbar: false,
          save_image: false,
          backgroundColor: "#232323",
          gridColor: "#2f2f2f",
          width: "100%",
          height: "100%",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return <div id="tradingview_eth_chart" ref={containerRef} className="w-full h-full" />;
}
