import React from "react";

export default function NarrativeBanner({ icon, headline, bullets }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #E6F1F8 0%, #E6F1F8 100%)",
      border: "1px solid #b8ddd8",
      borderLeft: "4px solid #234FA2",
      borderRadius: 12,
      padding: "1rem 1.25rem",
      marginBottom: "1.25rem",
      display: "flex",
      gap: "0.85rem",
      alignItems: "flex-start",
    }}>
      {/* Icon bubble */}
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: "#234FA2", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: "0 2px 8px rgba(35,79,162,0.3)",
      }}>
        {icon || (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Headline */}
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: "#0f172a",
          lineHeight: 1.4, marginBottom: bullets?.length ? 7 : 0,
        }}>
          {headline || "Loading insights…"}
        </div>

        {/* Bullets */}
        {bullets?.length > 0 && (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ display: "flex", alignItems: "baseline", gap: 7, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#234FA2", display: "inline-block",
                  flexShrink: 0, marginTop: 5,
                }} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
