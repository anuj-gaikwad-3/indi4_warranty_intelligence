import React, { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { getComplaintTypes } from "../../services/forecastApi";
import { COLORS, PALETTE, baseLayout, formatINR } from "../../components/forecasting/plotlyTheme";
import DashboardHeader from "../../components/layout/DashboardHeader";
import NarrativeBanner from "../../components/forecasting/NarrativeBanner";

const PLOT_CFG = { displayModeBar: false, responsive: true };

export default function PartsInventory() {
  const [raw, setRaw] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getComplaintTypes().then(res => {
      if (!cancelled) setRaw(res?.raw || []);
    });
    return () => { cancelled = true; };
  }, []);

  const parts = useMemo(() => {
    const filtered = raw.filter(r => (r.Forecast_p50 ?? 0) > 0);
    const map = new Map();
    for (const r of filtered) {
      const part = r.Predicted_Part || "Unknown";
      if (!map.has(part)) {
        map.set(part, { part, qty_p50: 0, qty_p90: 0, unit_cost: r.Est_Unit_Cost ?? 0, types: new Set(), models: new Set() });
      }
      const agg = map.get(part);
      agg.qty_p50  += r.Forecast_p50 ?? 0;
      agg.qty_p90  += r.Forecast_p90 ?? 0;
      if (r.Est_Unit_Cost) agg.unit_cost = r.Est_Unit_Cost;
      if (r.Complaint_Type) agg.types.add(r.Complaint_Type);
      if (r.Model_masked || r.Model) agg.models.add(r.Model_masked || r.Model);
    }
    return [...map.values()].sort((a, b) => b.qty_p50 * b.unit_cost - a.qty_p50 * a.unit_cost);
  }, [raw]);

  const topPart       = parts[0]?.part || "N/A";
  const totalBudget   = parts.reduce((s, p) => s + p.qty_p50 * p.unit_cost, 0);
  const worstBudget   = parts.reduce((s, p) => s + p.qty_p90 * p.unit_cost, 0);
  const topPartModels = parts[0] ? [...parts[0].models].join(", ") : "";

  const detailRows = useMemo(() => (
    [...raw]
      .filter(r => (r.Est_Cost_p50 ?? 0) > 0)
      .sort((a, b) => (b.Est_Cost_p50 ?? 0) - (a.Est_Cost_p50 ?? 0))
      .slice(0, 25)
  ), [raw]);

  return (
    <>
      {/* ── Page Header ── */}
      <DashboardHeader
        title="Parts &amp; Inventory Planning"
        subtitle="Predicted spare-part requirements with budget estimates for the forecast period"
        badge="Parts"
      />

      {/* ── Narrative Banner ── */}
      <NarrativeBanner
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        }
        headline={`Stock ${parts[0]?.qty_p90?.toLocaleString() ?? "—"} units of '${topPart}' to cover worst-case demand`}
        bullets={[
          `Expected budget: ${formatINR(totalBudget)} · Worst-case budget: ${formatINR(worstBudget)}`,
          topPartModels ? `'${topPart}' is required for models: ${topPartModels}` : null,
          `${parts.length} distinct parts required across all models`,
        ].filter(Boolean)}
      />

      {/* ── Bar Chart ── */}
      <div className="chart-card" style={{ marginBottom: "1rem" }}>
        <div className="chart-card-header">
          <div>
            <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>Demand Forecast</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Parts Demand Forecast</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Expected vs. worst-case quantity per spare part</div>
          </div>
        </div>
        <div className="chart-card-body">
          <Plot
            data={[
              {
                x: parts.map(p => p.part),
                y: parts.map(p => p.qty_p50),
                type: "bar", name: "Expected Qty",
                marker: { color: COLORS.primary },
                hovertemplate: "<b>%{x}</b><br>Expected: %{y}<extra></extra>",
              },
              {
                x: parts.map(p => p.part),
                y: parts.map(p => p.qty_p90),
                type: "bar", name: "Worst Case Qty",
                marker: { color: COLORS.amberDim },
                hovertemplate: "<b>%{x}</b><br>Worst Case: %{y}<extra></extra>",
              },
            ]}
            layout={baseLayout({
              barmode: "group",
              xaxis: { gridcolor: "transparent", linecolor: COLORS.border, tickfont: { size: 10, color: COLORS.textMuted }, tickangle: -35 },
              yaxis: { gridcolor: COLORS.gridLine, linecolor: "transparent", tickfont: { size: 11, color: COLORS.textMuted } },
            })}
            config={PLOT_CFG}
            useResizeHandler
            style={{ width: "100%", height: 380 }}
          />
        </div>
      </div>

      {/* ── Recommended Stocking Table ── */}
      <div className="section-label">Recommended Stocking Levels</div>
      <div className="chart-card" style={{ marginBottom: "1rem" }}>
        <div className="chart-card-header">
          <div>
            <span className="badge badge-accent" style={{ marginBottom: 5, display: "inline-flex" }}>Stocking Plan</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Recommended Parts Stocking</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Aggregated requirements across all models and failure types</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Part / Component</th>
                <th style={{ textAlign: "right" }}>Units (Expected)</th>
                <th style={{ textAlign: "right" }}>Units (Worst Case)</th>
                <th style={{ textAlign: "right" }}>Unit Cost</th>
                <th style={{ textAlign: "right" }}>Total Budget</th>
                <th>Primary Failure Types</th>
                <th>Models</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{p.part}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{Math.round(p.qty_p50).toLocaleString()}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{Math.round(p.qty_p90).toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>{formatINR(p.unit_cost)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "#234FA2" }}>{formatINR(Math.round(p.qty_p50 * p.unit_cost))}</td>
                  <td style={{ color: "#475569", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {[...p.types].join(", ") || "—"}
                  </td>
                  <td style={{ color: "#475569", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {[...p.models].join(", ") || "—"}
                  </td>
                </tr>
              ))}
              {!parts.length && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No parts data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Part Requirements by Model ── */}
      <div className="section-label">Part Requirements by Model</div>
      <div className="chart-card" style={{ marginBottom: "1.5rem" }}>
        <div className="chart-card-header">
          <div>
            <span className="badge badge-violet" style={{ marginBottom: 5, display: "inline-flex" }}>Detail</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Part Requirements by Model</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Breakdown of expected spare parts per model and failure type</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Failure Type</th>
                <th>Likely Part</th>
                <th style={{ textAlign: "right" }}>Qty Expected</th>
                <th style={{ textAlign: "right" }}>Qty Worst Case</th>
                <th style={{ textAlign: "right" }}>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{d.Model_masked || d.Model}</td>
                  <td style={{ color: "#475569" }}>{d.Complaint_Type}</td>
                  <td>{d.Predicted_Part || "—"}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{(d.Forecast_p50 ?? 0).toLocaleString()}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12, color: "#f59e0b" }}>{(d.Forecast_p90 ?? 0).toLocaleString()}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "#234FA2" }}>{formatINR(d.Est_Cost_p50 ?? 0)}</td>
                </tr>
              ))}
              {!detailRows.length && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No detail data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
