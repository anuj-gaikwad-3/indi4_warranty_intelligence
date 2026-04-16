import React, { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { getComplaintTypeCosts } from "../../services/forecastApi";
import { COLORS, PALETTE, baseLayout, formatINR, monthLabel } from "../../components/forecasting/plotlyTheme";
import KpiCard from "../../components/dashboard/KpiCard";

const PLOT_CFG = { displayModeBar: false, responsive: true };

export default function CostOutlook() {
  const [costData, setCostData] = useState(null);
  const [month, setMonth]       = useState("all");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getComplaintTypeCosts(month === "all" ? undefined : month)
      .then(d => !cancelled && setCostData(d))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [month]);

  const months  = costData?.available_months ?? [];
  const summary = useMemo(() => (
    (costData?.cost_summary ?? []).slice().sort((a, b) => (b.cost_p50 ?? 0) - (a.cost_p50 ?? 0))
  ), [costData]);
  const raw = costData?.raw ?? [];

  const totals = useMemo(() => {
    const p10 = raw.reduce((s, r) => s + (r.Est_Cost_p10 ?? 0), 0);
    const p50 = raw.reduce((s, r) => s + (r.Est_Cost_p50 ?? 0), 0);
    const p90 = raw.reduce((s, r) => s + (r.Est_Cost_p90 ?? 0), 0);
    return { p10, p50, p90 };
  }, [raw]);

  const modelCosts = useMemo(() => {
    const map = {};
    raw.forEach(r => {
      const m = r.Model ?? r.model ?? "Unknown";
      map[m] = (map[m] ?? 0) + (r.Est_Cost_p50 ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [raw]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #234FA2", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 20, padding: "3px 11px",
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.88)",
                letterSpacing: 1.3, textTransform: "uppercase",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0075BE", display: "inline-block" }} />
                Forecasting
              </span>
              <span style={{
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 20, padding: "3px 10px",
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 1,
              }}>Cost Outlook</span>
            </div>
            <h1 style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900,
              color: "#fff", lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 4,
            }}>Warranty Cost Outlook</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", fontWeight: 400 }}>
              Projected warranty spend by failure type, model, and scenario
            </p>
          </div>
          {/* Month filter */}
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 9, padding: "7px 12px",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="all" style={{ background: "#1C3F82", color: "#fff" }}>All Months</option>
            {months.map(m => (
              <option key={m} value={m} style={{ background: "#1C3F82", color: "#fff" }}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Total Estimated Cost"
          value={formatINR(totals.p50)}
          subtitle="Expected scenario"
          variant="primary"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <KpiCard
          label="Best Case"
          value={formatINR(totals.p10)}
          subtitle="Optimistic scenario (p10)"
          variant="emerald"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
        />
        <KpiCard
          label="Worst Case"
          value={formatINR(totals.p90)}
          subtitle="Pessimistic scenario (p90)"
          variant="warning"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Cost by Failure Type (wider) */}
        <div className="chart-card lg:col-span-3">
          <div className="chart-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>By Failure Type</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Cost Breakdown by Failure Type</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Expected vs. worst-case cost per complaint category</div>
            </div>
          </div>
          <div className="chart-card-body">
            <Plot
              data={[
                {
                  x: summary.map(d => d.Complaint_Type),
                  y: summary.map(d => d.cost_p50 ?? 0),
                  type: "bar", name: "Expected Cost",
                  marker: { color: COLORS.primary },
                  hovertemplate: "<b>%{x}</b><br>Expected: ₹%{y:,.0f}<extra></extra>",
                },
                {
                  x: summary.map(d => d.Complaint_Type),
                  y: summary.map(d => d.cost_p90 ?? 0),
                  type: "bar", name: "Worst Case",
                  marker: { color: COLORS.amberDim },
                  hovertemplate: "<b>%{x}</b><br>Worst Case: ₹%{y:,.0f}<extra></extra>",
                },
              ]}
              layout={baseLayout({
                barmode: "group",
                margin: { l: 60, r: 20, t: 20, b: 120 },
                xaxis: { gridcolor: "transparent", linecolor: COLORS.border, tickfont: { size: 10, color: COLORS.textMuted }, tickangle: -40 },
                yaxis: { gridcolor: COLORS.gridLine, linecolor: "transparent", tickfont: { size: 10, color: COLORS.textMuted } },
              })}
              config={PLOT_CFG}
              useResizeHandler
              style={{ width: "100%", height: 380 }}
            />
          </div>
        </div>

        {/* Cost by Model (narrower) */}
        <div className="chart-card lg:col-span-2">
          <div className="chart-card-header">
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 5, display: "inline-flex" }}>By Model</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Cost by Model (Top 10)</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Expected warranty spend per compressor model</div>
            </div>
          </div>
          <div className="chart-card-body">
            <Plot
              data={[{
                y: modelCosts.map(([m]) => m),
                x: modelCosts.map(([, v]) => v),
                type: "bar", orientation: "h",
                marker: { color: modelCosts.map((_, i) => PALETTE[i % PALETTE.length]) },
                hovertemplate: "<b>%{y}</b><br>Cost: ₹%{x:,.0f}<extra></extra>",
              }]}
              layout={baseLayout({
                showlegend: false,
                margin: { l: 140, r: 20, t: 20, b: 50 },
                xaxis: { gridcolor: COLORS.gridLine, linecolor: "transparent", tickfont: { size: 10, color: COLORS.textMuted } },
                yaxis: { gridcolor: "transparent", linecolor: COLORS.border, tickfont: { size: 10, color: COLORS.textMuted }, autorange: "reversed" },
              })}
              config={PLOT_CFG}
              useResizeHandler
              style={{ width: "100%", height: 380 }}
            />
          </div>
        </div>
      </div>

      {/* ── Detailed Cost Forecast Table ── */}
      <div className="section-label">Detailed Cost Forecast</div>
      <div className="chart-card" style={{ marginBottom: "1.5rem" }}>
        <div className="chart-card-header">
          <div>
            <span className="badge badge-rose" style={{ marginBottom: 5, display: "inline-flex" }}>Full Detail</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Warranty Cost Forecast by Failure Type</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Best / expected / worst-case cost scenarios per complaint category</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Failure Type</th>
                <th>Most Likely Part</th>
                <th style={{ textAlign: "right" }}>Part Cost</th>
                <th style={{ textAlign: "right" }}>Claims</th>
                <th style={{ textAlign: "right" }}>Expected Total</th>
                <th style={{ textAlign: "right", color: "#10b981" }}>Best Case</th>
                <th style={{ textAlign: "right", color: "#f59e0b" }}>Worst Case</th>
                <th>Models Affected</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.Complaint_Type}</td>
                  <td style={{ color: "#475569" }}>{row.Predicted_Part ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>{row.unit_cost != null ? formatINR(row.unit_cost) : "—"}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{(row.total_p50 ?? 0).toLocaleString("en-IN")}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{formatINR(row.cost_p50 ?? 0)}</td>
                  <td style={{ textAlign: "right", color: "#10b981", fontWeight: 600 }}>{formatINR(row.cost_p10 ?? 0)}</td>
                  <td style={{ textAlign: "right", color: "#f59e0b", fontWeight: 600 }}>{formatINR(row.cost_p90 ?? 0)}</td>
                  <td style={{ color: "#475569", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.Models_Affected ?? row.models ?? "—"}
                  </td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No cost data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
