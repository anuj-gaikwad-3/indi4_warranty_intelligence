import React from "react";

export default function ChartContainer({ title, subtitle, badge, action, badgeVariant = "primary", children }) {
  return (
    <div className="chart-card">
      {title && (
        <div className="chart-card-header">
          <div style={{ minWidth: 0 }}>
            {badge && (
              <span className={`badge badge-${badgeVariant}`} style={{ marginBottom: 5, display: "inline-flex" }}>
                {badge}
              </span>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.25 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>{subtitle}</div>}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      <div className="chart-card-body">{children}</div>
    </div>
  );
}
