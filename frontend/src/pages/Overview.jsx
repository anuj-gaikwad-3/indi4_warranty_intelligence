import React, { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FiscalYearContext } from "../context/FiscalYearContext";
import { getTrends, getKpis } from "../services/dashboardApi";
import DashboardHeader from "../components/layout/DashboardHeader";
import KpiCard from "../components/dashboard/KpiCard";
import ChartContainer from "../components/dashboard/ChartContainer";

const T = "#234FA2";
const TD = "#1C3F82";
const C = "#e07c3a";
const GRAY = "#c8d3dc";
const GRID = "#f1f5f9";

const BASE = {
  font: { family: "Inter, sans-serif", size: 12, color: "#475569" },
  paper_bgcolor: "#ffffff", plot_bgcolor: "#ffffff",
  margin: { l: 40, r: 24, t: 18, b: 60 },
  hoverlabel: { bgcolor: "#0f172a", font: { size: 12, family: "Inter, sans-serif", color: "#fff" }, bordercolor: "#0f172a" },
};
const CFG = { displayModeBar: false, responsive: true };

function safe(v) { return v == null || Number.isNaN(Number(v)) ? 0 : Number(v); }
function fmt(v)  { return safe(v).toLocaleString("en-IN"); }

const MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];

export default function Overview() {
  const { selectedFy } = useContext(FiscalYearContext);
  const [kpis, setKpis]     = useState(null);
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    if (!selectedFy) return;
    let cancelled = false;
    Promise.all([getTrends(selectedFy), getKpis(selectedFy)]).then(([tr, kp]) => {
      if (cancelled) return;
      setTrends(tr); setKpis(kp);
    });
    return () => { cancelled = true; };
  }, [selectedFy]);

  const growth = safe(kpis?.growth);
  const isUp   = growth > 0;

  return (
    <>
      <DashboardHeader title="Warranty Claims Overview" subtitle="Historical trends, fiscal year comparison and model-stage breakdown" badge="Overview" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Complaints", value: fmt(kpis?.total_complaints), variant: "primary", subtitle: kpis?.curr_fy,
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
          { label: "YoY Growth", value: `${Math.abs(growth).toFixed(1)}%`, variant: isUp ? "rose" : "emerald",
            subtitle: isUp ? "YoY Increase" : "YoY Decrease",
            trend: { direction: isUp ? "up" : "down", value: `${Math.abs(growth).toFixed(1)}%` },
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
          { label: "Open Complaints", value: fmt(kpis?.open_complaints), variant: "warning",
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
          { label: "Zero Hour Claims", value: fmt(kpis?.zhc_count), variant: "info",
            subtitle: `Rate: ${safe(kpis?.zhc_rate).toFixed(1)}%`,
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
        ].map((k, i) => (
          <div key={i} className={`delay-${(i+1)*100}`}>
            <KpiCard {...k} />
          </div>
        ))}
      </div>

      {/* 10-Year Trend */}
      <div className="mb-6">
        <ChartContainer title="10-Year Complaint Trend" subtitle="Total warranty claims filed per fiscal year" badge="Historical">
          {trends && (
            <Plot
              data={[{
                x: (trends.yoy || []).map(d => d.fy_year),
                y: (trends.yoy || []).map(d => safe(d.count)),
                mode: "lines+markers+text",
                line: { color: T, width: 3, shape: "spline" },
                marker: { size: 9, color: T, line: { color: "#fff", width: 2 } },
                text: (trends.yoy || []).map(d => safe(d.count).toLocaleString("en-IN")),
                textposition: "top center",
                textfont: { size: 10.5, color: TD },
                fill: "tozeroy", fillcolor: "rgba(35,79,162,0.08)",
                hovertemplate: "<b>FY %{x}</b><br>%{y} complaints<extra></extra>",
              }]}
              layout={{
                ...BASE,
                height: 320,
                xaxis: { showgrid: false, linecolor: GRID, zeroline: false, color: "#94a3b8", tickfont: { size: 11 } },
                yaxis: { showgrid: true, gridcolor: GRID, zeroline: false, showticklabels: false },
                showlegend: false,
              }}
              config={CFG} useResizeHandler style={{ width: "100%", height: 320 }}
            />
          )}
        </ChartContainer>
      </div>

      {/* Monthly + Quarterly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartContainer title="Monthly Comparison" subtitle="Current vs previous fiscal year" badge="Monthly">
          {trends && (() => {
            const all   = [...(trends.monthly || [])].sort((a,b) => safe(a.fy_month_idx)-safe(b.fy_month_idx));
            const curr  = all.filter(d => d.fy_year === trends.curr_fy);
            const prev  = all.filter(d => d.fy_year === trends.prev_fy);
            return (
              <Plot
                data={[
                  prev.length ? { x: prev.map(d=>d.fy_month_name), y: prev.map(d=>safe(d.count)), mode:"lines",
                    name: trends.prev_fy, line:{color:GRAY,width:2,shape:"spline",dash:"dot"},
                    fill:"tozeroy", fillcolor:"rgba(200,211,220,0.12)",
                    hovertemplate:`<b>%{x}</b> ${trends.prev_fy}: %{y}<extra></extra>` } : null,
                  curr.length ? { x: curr.map(d=>d.fy_month_name), y: curr.map(d=>safe(d.count)), mode:"lines+markers",
                    name: trends.curr_fy, line:{color:T,width:3,shape:"spline"},
                    marker:{size:7,color:T,line:{color:"#fff",width:2}},
                    hovertemplate:`<b>%{x}</b> ${trends.curr_fy}: %{y}<extra></extra>` } : null,
                ].filter(Boolean)}
                layout={{
                  ...BASE, height: 300,
                  xaxis: { categoryorder:"array", categoryarray:MONTHS, showgrid:false, linecolor:GRID, color:"#94a3b8", tickfont:{size:11} },
                  yaxis: { showgrid:true, gridcolor:GRID, zeroline:false, showticklabels:false },
                  legend: { orientation:"h", yanchor:"top", y:-0.18, xanchor:"center", x:0.5, font:{size:11,color:"#475569"} },
                }}
                config={CFG} useResizeHandler style={{ width:"100%", height:300 }}
              />
            );
          })()}
        </ChartContainer>

        <ChartContainer title="Quarterly Comparison" subtitle="Q1–Q4 performance vs prior year" badge="Quarterly">
          {trends && (() => {
            const all  = trends.quarterly || [];
            const curr = all.filter(d => d.fy_year === trends.curr_fy);
            const prev = all.filter(d => d.fy_year === trends.prev_fy);
            return (
              <Plot
                data={[
                  prev.length ? { x:prev.map(d=>d.quarter), y:prev.map(d=>safe(d.count)), mode:"lines",
                    name:trends.prev_fy, line:{color:GRAY,width:2,shape:"spline",dash:"dot"},
                    fill:"tozeroy", fillcolor:"rgba(200,211,220,0.12)",
                    hovertemplate:`<b>%{x}</b> ${trends.prev_fy}: %{y}<extra></extra>` } : null,
                  curr.length ? { x:curr.map(d=>d.quarter), y:curr.map(d=>safe(d.count)), mode:"lines+markers+text",
                    name:trends.curr_fy, line:{color:C,width:3,shape:"spline"},
                    marker:{size:10,color:C,line:{color:"#fff",width:2}},
                    text:curr.map(d=>safe(d.count)), textposition:"top center", textfont:{size:10.5,color:TD},
                    hovertemplate:`<b>%{x}</b> ${trends.curr_fy}: %{y}<extra></extra>` } : null,
                ].filter(Boolean)}
                layout={{
                  ...BASE, height: 300,
                  xaxis: { categoryorder:"array", categoryarray:["Q1","Q2","Q3","Q4"], showgrid:false, linecolor:GRID, color:"#94a3b8", tickfont:{size:11} },
                  yaxis: { showgrid:true, gridcolor:GRID, zeroline:false, showticklabels:false },
                  legend: { orientation:"h", yanchor:"top", y:-0.18, xanchor:"center", x:0.5, font:{size:11,color:"#475569"} },
                }}
                config={CFG} useResizeHandler style={{ width:"100%", height:300 }}
              />
            );
          })()}
        </ChartContainer>
      </div>

      {/* Single + Dual Stage */}
      <div className="section-label">Model Stage Breakdown</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartContainer title="Single-Stage Models" subtitle="Top models by complaint volume" badge="Single Stage">
          {trends && (() => {
            const data = (trends.single_stage || []);
            return (
              <Plot
                data={[{ x:data.map(d=>d.model), y:data.map(d=>safe(d.count)),
                  type:"bar", marker:{color:T, opacity:0.85},
                  text:data.map(d=>safe(d.count)), textposition:"outside", textfont:{size:10.5,color:TD},
                  hovertemplate:"<b>%{x}</b><br>%{y} complaints<extra></extra>" }]}
                layout={{ ...BASE, height:300, showlegend:false,
                  xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-30,tickfont:{size:10.5}},
                  yaxis:{showgrid:true,gridcolor:GRID,zeroline:false,showticklabels:false} }}
                config={CFG} useResizeHandler style={{ width:"100%", height:300 }}
              />
            );
          })()}
        </ChartContainer>

        <ChartContainer title="Dual-Stage Models" subtitle="Top models by complaint volume" badge="Dual Stage" badgeVariant="accent">
          {trends && (() => {
            const data = (trends.dual_stage || []);
            return (
              <Plot
                data={[{ x:data.map(d=>d.model), y:data.map(d=>safe(d.count)),
                  type:"bar", marker:{color:C, opacity:0.85},
                  text:data.map(d=>safe(d.count)), textposition:"outside", textfont:{size:10.5,color:"#8a4a1e"},
                  hovertemplate:"<b>%{x}</b><br>%{y} complaints<extra></extra>" }]}
                layout={{ ...BASE, height:300, showlegend:false,
                  xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-30,tickfont:{size:10.5}},
                  yaxis:{showgrid:true,gridcolor:GRID,zeroline:false,showticklabels:false} }}
                config={CFG} useResizeHandler style={{ width:"100%", height:300 }}
              />
            );
          })()}
        </ChartContainer>
      </div>
    </>
  );
}
