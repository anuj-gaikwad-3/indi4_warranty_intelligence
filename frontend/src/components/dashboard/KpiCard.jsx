import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const VARIANTS = {
  primary:   { accent: "#234FA2", dark: "#1C3F82", light: "#E6F1F8", border: "#bfdbfe" },
  secondary: { accent: "#e07c3a", dark: "#b86128", light: "#fef3eb", border: "#f5c9a0" },
  warning:   { accent: "#f59e0b", dark: "#b45309", light: "#fffbeb", border: "#fde68a" },
  info:      { accent: "#3b82f6", dark: "#1d4ed8", light: "#eff6ff", border: "#bfdbfe" },
  rose:      { accent: "#e05252", dark: "#b91c1c", light: "#fef2f2", border: "#fecaca" },
  violet:    { accent: "#8b5cf6", dark: "#6d28d9", light: "#f5f3ff", border: "#ddd6fe" },
  emerald:   { accent: "#0075BE", dark: "#152F61", light: "#E6F1F8", border: "#bfdbfe" },
};

export default function KpiCard({ label, value, subtitle, trend, variant = "primary", icon }) {
  const c = VARIANTS[variant] || VARIANTS.primary;

  return (
    <div className="kpi-card animate-fade-in-up" style={{ padding: "1.2rem 1.4rem", minHeight: 118 }}>
      {/* Top gradient accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${c.dark}, ${c.accent})`,
        borderRadius: "12px 12px 0 0",
      }} />

      {/* Label + icon row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem", paddingTop: 2 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8" }}>
          {label}
        </span>
        {icon && (
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: c.light, border: `1px solid ${c.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: c.accent, flexShrink: 0,
          }}>{icon}</div>
        )}
      </div>

      {/* Value */}
      <div style={{
        fontSize: "1.85rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.5px",
        color: c.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        marginBottom: "0.5rem",
      }}>
        {value ?? "—"}
      </div>

      {/* Trend pill + subtitle */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {trend && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: trend.direction === "up" ? "#fef2f2" : "#E6F1F8",
            color:      trend.direction === "up" ? "#e05252"  : "#0075BE",
          }}>
            {trend.direction === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.value}
          </span>
        )}
        {subtitle && <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{subtitle}</span>}
      </div>
    </div>
  );
}
