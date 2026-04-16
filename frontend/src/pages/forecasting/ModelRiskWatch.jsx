import React, { useEffect, useState, useCallback } from "react";
import Plot from "react-plotly.js";
import {
  getModelWise,
  getModelWiseValidation,
  getCuratedPlots,
  getInsights,
} from "../../services/forecastApi";
import { COLORS, baseLayout, monthLabel } from "../../components/forecasting/plotlyTheme";
import HeroPlot from "../../components/forecasting/HeroPlot";
import SupportingPlots from "../../components/forecasting/SupportingPlots";
import NarrativeBanner from "../../components/forecasting/NarrativeBanner";
import Lightbox from "../../components/forecasting/Lightbox";

const PLOT_CFG = { displayModeBar: false, responsive: true };

function confidenceBadge(level) {
  if (level === "High")
    return <span className="badge badge-emerald">High</span>;
  if (level === "Medium")
    return <span className="badge badge-amber">Medium</span>;
  return <span className="badge badge-rose">Low</span>;
}

export default function ModelRiskWatch() {
  const [month, setMonth]               = useState("");
  const [months, setMonths]             = useState([]);
  const [modelWise, setModelWise]       = useState(null);
  const [modelValidation, setModelValidation] = useState(null);
  const [curatedPlots, setCuratedPlots] = useState(null);
  const [insights, setInsights]         = useState(null);
  const [lightbox, setLightbox]         = useState({ url: null, caption: null });

  const openLightbox  = useCallback((url, caption) => setLightbox({ url, caption }), []);
  const closeLightbox = useCallback(() => setLightbox({ url: null, caption: null }), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getModelWise(), getModelWiseValidation(), getCuratedPlots(), getInsights()])
      .then(([mw, mv, cp, ins]) => {
        if (cancelled) return;
        setModelWise(mw);
        setModelValidation(mv);
        setCuratedPlots(cp);
        setInsights(ins);
        const avail = mw?.available_months || [];
        setMonths(avail);
        if (avail.length) setMonth(avail[0]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    getModelWise(null, month).then(mw => { if (!cancelled) setModelWise(mw); });
    return () => { cancelled = true; };
  }, [month]);

  const rows = (modelWise?.forecasts || [])
    .filter(d => !month || d["Complaint Date"] === month)
    .sort((a, b) => (b.predicted_complaints ?? 0) - (a.predicted_complaints ?? 0));

  const valRows = modelValidation?.summary || [];

  const insightModels = insights?.models || {};
  const headline = insightModels.headline || "Loading model insights…";
  const bullets  = Object.entries(insightModels).filter(([k]) => k !== "headline").map(([, v]) => v);

  return (
    <>
      <Lightbox url={lightbox.url} caption={lightbox.caption} onClose={closeLightbox} />

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
              }}>Model Risk</span>
            </div>
            <h1 style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900,
              color: "#fff", lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 4,
            }}>Model Risk Watch</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", fontWeight: 400 }}>
              Per-model forecasts with confidence intervals and validation metrics
            </p>
          </div>
          {/* Month filter */}
          {months.length > 0 && (
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 9, padding: "7px 12px",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                outline: "none", backdropFilter: "blur(4px)",
              }}
            >
              {months.map(m => (
                <option key={m} value={m} style={{ background: "#1C3F82", color: "#fff" }}>{monthLabel(m)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Narrative ── */}
      <NarrativeBanner headline={headline} bullets={bullets} />

      {/* ── Hero Plot ── */}
      <HeroPlot category="model_wise" curatedPlots={curatedPlots} openLightbox={openLightbox} />

      {/* ── Expected Claims Bar Chart ── */}
      <div className="chart-card" style={{ marginBottom: "1rem" }}>
        <div className="chart-card-header">
          <div>
            <span className="badge badge-rose" style={{ marginBottom: 5, display: "inline-flex" }}>Risk</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Expected Claims by Model</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Best / Expected / Worst case scenarios per model</div>
          </div>
        </div>
        <div className="chart-card-body">
          <Plot
            data={[
              {
                x: rows.map(d => d.Model_masked),
                y: rows.map(d => d.p90 ?? 0),
                type: "bar", name: "Worst Case",
                marker: { color: COLORS.amberDim },
                hovertemplate: "<b>%{x}</b><br>Worst Case: %{y}<extra></extra>",
              },
              {
                x: rows.map(d => d.Model_masked),
                y: rows.map(d => d.predicted_complaints ?? 0),
                type: "bar", name: "Expected",
                marker: { color: COLORS.primary },
                hovertemplate: "<b>%{x}</b><br>Expected: %{y}<extra></extra>",
              },
              {
                x: rows.map(d => d.Model_masked),
                y: rows.map(d => d.p10 ?? 0),
                type: "bar", name: "Best Case",
                marker: { color: "#2ca58d" },
                hovertemplate: "<b>%{x}</b><br>Best Case: %{y}<extra></extra>",
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

      {/* ── Two side-by-side tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: "1.5rem" }}>
        {/* Forecast Details */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="badge badge-primary" style={{ marginBottom: 5, display: "inline-flex" }}>Forecast</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Model Forecast Details</div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th style={{ textAlign: "right", color: "#10b981" }}>Best Case</th>
                  <th style={{ textAlign: "right", color: "#234FA2" }}>Expected</th>
                  <th style={{ textAlign: "right", color: "#f59e0b" }}>Worst Case</th>
                  <th style={{ textAlign: "right" }}>± Range</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => {
                  const range = (d.p90 ?? 0) - (d.p10 ?? 0);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{d.Model_masked}</td>
                      <td style={{ textAlign: "right", color: "#10b981", fontFamily: "monospace", fontSize: 12 }}>
                        {(d.predicted_p10 ?? d.p10 ?? 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#234FA2", fontFamily: "monospace", fontSize: 12 }}>
                        {(d.predicted_complaints ?? 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", color: "#f59e0b", fontFamily: "monospace", fontSize: 12 }}>
                        {(d.predicted_p90 ?? d.p90 ?? 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>
                        ±{Math.round(range / 2).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Forecast Reliability */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: 5, display: "inline-flex" }}>Reliability</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Forecast Reliability</div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th style={{ textAlign: "right" }}>Actual</th>
                  <th style={{ textAlign: "right" }}>Predicted</th>
                  <th style={{ textAlign: "center" }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {valRows.map((d, i) => {
                  const accuracy = 100 - (d.mae ?? 0) * 10;
                  const level = accuracy >= 80 ? "High" : accuracy >= 60 ? "Medium" : "Low";
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{d.Model_masked || d.model}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{(d.total_actual ?? 0).toLocaleString()}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{(d.total_predicted ?? 0).toLocaleString()}</td>
                      <td style={{ textAlign: "center" }}>{confidenceBadge(level)}</td>
                    </tr>
                  );
                })}
                {!valRows.length && (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No validation data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Supporting Charts ── */}
      <div className="section-label">Detailed Analysis</div>
      <SupportingPlots category="model_wise" curatedPlots={curatedPlots} openLightbox={openLightbox} />
    </>
  );
}
