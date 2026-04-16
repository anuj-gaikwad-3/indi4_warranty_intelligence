import React, { useEffect } from "react";

export default function Lightbox({ url, caption, onClose }) {
  useEffect(() => {
    if (!url) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(7, 18, 36, 0.78)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "relative", zIndex: 10,
        maxWidth: "92vw", maxHeight: "92vh",
        background: "#fff", borderRadius: 16,
        boxShadow: "0 32px 80px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.22)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "fadeInUp 0.2s ease both",
      }}>
        {/* Header bar */}
        <div style={{
          padding: "0.7rem 1rem",
          background: "linear-gradient(135deg, #0d4a42, #1a7a6d)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12,
          flexShrink: 0,
        }}>
          {caption && (
            <span style={{
              fontSize: 13, fontWeight: 700, color: "#fff",
              lineHeight: 1.35, flex: 1, minWidth: 0,
            }}>
              {caption}
            </span>
          )}
          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              width: 30, height: 30, borderRadius: 8, border: "none",
              background: "rgba(255,255,255,0.15)", color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.28)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Image area */}
        <div style={{ overflow: "auto", background: "#f8fafc" }}>
          <img
            src={url}
            alt={caption || "Enlarged view"}
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
            }}
          />
        </div>
      </div>
    </div>
  );
}
