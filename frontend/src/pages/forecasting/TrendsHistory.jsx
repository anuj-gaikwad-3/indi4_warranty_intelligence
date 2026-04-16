import React, { useState, useEffect, useCallback } from "react";
import Plot from "react-plotly.js";
import { getTotalComplaints, getCuratedPlots, getInsights } from "../../services/forecastApi";
import { COLORS, baseLayout } from "../../components/forecasting/plotlyTheme";
import DashboardHeader from "../../components/layout/DashboardHeader";
import HeroPlot from "../../components/forecasting/HeroPlot";
import SupportingPlots from "../../components/forecasting/SupportingPlots";
import NarrativeBanner from "../../components/forecasting/NarrativeBanner";
import Lightbox from "../../components/forecasting/Lightbox";

const RANK_BADGE = {
  1: { bg: "#fefce8", color: "#92400e", border: "#fde68a" },
  2: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  3: { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" },
};

const FORECAST_METHODS = [
  { key: "Holt-Winters",     label: "Holt-Winters" },
  { key: "SARIMA",           label: "SARIMA" },
  { key: "Prophet",          label: "Prophet" },
  { key: "LightGBM",        label: "LightGBM" },
  { key: "Ensemble (Top-3)", label: "Combined Best" },
];

export default function TrendsHistory() {
  const [totalComplaints, setTotalComplaints] = useState(null);
  const [curatedPlots, setCuratedPlots]       = useState(null);
  const [insights, setInsights]               = useState(null);
  const [lightboxUrl, setLightboxUrl]         = useState(null);
  const [lightboxCaption, setLightboxCaption] = useState("");
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tc, cp, ins] = await Promise.all([
          getTotalComplaints(),
          getCuratedPlots(),
          getInsights(),
        ]);
        if (cancelled) return;
        setTotalComplaints(tc);
        setCuratedPlots(cp);
        setInsights(ins);
      } catch (err) {
        console.error("TrendsHistory fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const openLightbox = useCallback((url, caption) => {
    setLightboxUrl(url);
    setLightboxCaption(caption || "");
  }, []);
  const closeLightbox = useCallback(() => {
    setLightboxUrl(null);
    setLightboxCaption("");
  }, []);

  const totalInsight  = insights?.total;
  const bulletEntries = totalInsight
    ? Object.entries(totalInsight).filter(([k]) => k !== "headline").map(([, v]) => v)
    : [];

  const actuals    = totalComplaints?.actuals    || [];
  const comparison = totalComplaints?.comparison || [];
  const forecast   = totalComplaints?.forecast   || [];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 380, gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid #234FA2", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontSize: 13, color: "#94a3b8" }}>Loading trend data…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── Page Header ── */}
      <DashboardHeader
        title="Trends &amp; Historical Analysis"
        subtitle="Long-term complaint patterns and forecast methodology performance"
        badge="Trends"
      />

      {/* ── Narrative Banner ── */}
      <NarrativeBanner
        headline={totalInsight?.headline}
        bullets={bulletEntries}
      />

      {/* ── Hero Plot ── */}
      <HeroPlot
        category="total_complaints_forecast"
        curatedPlots={curatedPlots}
        openLightbox={openLightbox}
      />

      {/* ── Two-column: Bar chart + Comparison table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Actuals vs Predicted bar chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>Bar Chart</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Recent Actuals vs Predictions</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Monthly comparison of actual vs. ensemble forecast</div>
            </div>
          </div>
          <div className="chart-card-body">
            {actuals.length > 0 ? (
              <Plot
                data={[
                  {
                    x: actuals.map(r => r.Month),
                    y: actuals.map(r => r.Actual),
                    name: "Actual",
                    type: "bar",
                    marker: { color: COLORS.emerald },
                    hovertemplate: "<b>%{x}</b><br>Actual: %{y}<extra></extra>",
                  },
                  {
                    x: actuals.map(r => r.Month),
                    y: actuals.map(r => r["Ensemble (Top-3)"] ?? r.Predicted),
                    name: "Predicted (Ensemble)",
                    type: "bar",
                    marker: { color: COLORS.primary, opacity: 0.75 },
                    hovertemplate: "<b>%{x}</b><br>Predicted: %{y}<extra></extra>",
                  },
                ]}
                layout={baseLayout({
                  barmode: "group",
                  margin: { l: 45, r: 10, t: 10, b: 60 },
                  xaxis: { gridcolor: "transparent", linecolor: COLORS.border, tickfont: { size: 10, color: COLORS.textMuted }, tickangle: -40 },
                  yaxis: { gridcolor: COLORS.gridLine, linecolor: "transparent", tickfont: { size: 10, color: COLORS.textMuted }, title: { text: "Complaints", font: { size: 11, color: COLORS.textMuted } } },
                })}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler
                style={{ width: "100%", height: 300 }}
              />
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No actuals data available</div>
            )}
          </div>
        </div>

        {/* Forecast Method Performance table */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="badge badge-violet" style={{ marginBottom: 5, display: "inline-flex" }}>Performance</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Forecast Method Performance</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Ranked by Test MAE (lower is better)</div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            {comparison.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Method</th>
                    <th style={{ textAlign: "right" }}>Avg Error (MAE)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => {
                    const rank = i + 1;
                    const rb   = RANK_BADGE[rank] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
                    return (
                      <tr key={i}>
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 26, height: 26, borderRadius: "50%",
                            background: rb.bg, color: rb.color,
                            border: `1px solid ${rb.border}`,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {rank}
                          </span>
                        </td>
                        <td style={{ fontWeight: rank <= 3 ? 700 : 400 }}>{row.Model}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>
                          {Number(row["Test MAE"]).toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No comparison data available</div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3-Month Forward Predictions ── */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: 5, display: "inline-flex" }}>Forward Forecast</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>3-Month Forward Predictions — All Methods</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Side-by-side comparison of all forecast models</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          {forecast.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  {FORECAST_METHODS.map(m => (
                    <th key={m.key} style={{
                      textAlign: "right",
                      color: m.key === "Ensemble (Top-3)" ? "#234FA2" : undefined,
                    }}>
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.Month}</td>
                    {FORECAST_METHODS.map(m => {
                      const isCombined = m.key === "Ensemble (Top-3)";
                      return (
                        <td
                          key={m.key}
                          style={{
                            textAlign: "right",
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: isCombined ? 800 : 400,
                            color: isCombined ? "#234FA2" : undefined,
                            background: isCombined ? "#E6F1F8" : undefined,
                          }}
                        >
                          {row[m.key] != null ? Math.round(row[m.key]).toLocaleString() : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No forecast data available</div>
          )}
        </div>
      </div>

      {/* ── Supporting Charts ── */}
      <div className="section-label">Detailed Analysis Charts</div>
      <SupportingPlots
        category="total_complaints_forecast"
        curatedPlots={curatedPlots}
        openLightbox={openLightbox}
      />

      <Lightbox url={lightboxUrl} caption={lightboxCaption} onClose={closeLightbox} />
    </div>
  );
}
