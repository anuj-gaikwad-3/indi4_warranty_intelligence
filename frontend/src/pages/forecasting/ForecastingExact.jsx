import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ForecastingExact() {
  const location = useLocation();
  const iframeRef = useRef(null);
  const [frameHeight, setFrameHeight] = useState("1000px");

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "RESIZE") {
        setFrameHeight(`${event.data.height}px`);
      }
      if (event.data && event.data.type === "NAVIGATE") {
        // Not needed for parent listener, but for reference
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const hash = location.hash.replace("#", "") || "summary";
      iframeRef.current.contentWindow.postMessage({ type: "NAVIGATE", tab: hash }, "*");
    }
  }, [location.hash]);

  const initialHash = location.hash || "#summary";

  return (
    <div style={{ margin: "-1.5rem -1rem -2rem", overflow: "hidden", minHeight: "100vh" }}>
      <iframe
        ref={iframeRef}
        title="Forecasting Dashboard (Exact)"
        src={`/static/index.html${initialHash}`}
        style={{
          width: "100%",
          height: frameHeight,
          border: "none",
          display: "block",
          background: "transparent",
        }}
      />
    </div>
  );
}
