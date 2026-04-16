import React, { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FiscalYearContext } from "../context/FiscalYearContext";
import { getUsageData } from "../services/dashboardApi";
import DashboardHeader from "../components/layout/DashboardHeader";
import KpiCard from "../components/dashboard/KpiCard";
import ChartContainer from "../components/dashboard/ChartContainer";

const T = "#234FA2"; const TD = "#1C3F82"; const C = "#e07c3a"; const GRID = "#f1f5f9";
const PALETTE = ["#234FA2","#e07c3a","#3b82f6","#8b5cf6","#0075BE","#f59e0b","#e05252","#0891b2"];

const BASE = {
  font: { family: "Inter, sans-serif", size: 12, color: "#475569" },
  paper_bgcolor: "#fff", plot_bgcolor: "#fff",
  margin: { l: 40, r: 24, t: 18, b: 60 },
  hoverlabel: { bgcolor: "#0f172a", font: { size: 12, family: "Inter, sans-serif", color: "#fff" }, bordercolor: "#0f172a" },
};
const CFG = { displayModeBar: false, responsive: true };
function safe(v) { return v == null || isNaN(Number(v)) ? 0 : Number(v); }
function fmt(v)  { return safe(v).toLocaleString("en-IN"); }

export default function UsageAnalysis() {
  const { selectedFy } = useContext(FiscalYearContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedFy) return;
    let c = false;
    getUsageData(selectedFy).then(d => { if (!c) setData(d); });
    return () => { c = true; };
  }, [selectedFy]);

  const kpis   = data?.kpis   || {};
  const charts = data?.charts || {};

  return (
    <>
      <DashboardHeader title="Usage Analysis" subtitle="Machine usage patterns, MTTF, failure timing and RPM heatmaps" badge="Usage" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Mean Time to Failure",  value:`${fmt(kpis.mttf)} hrs`,                         variant:"primary",   subtitle:"Avg. run hours at failure",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label:"Avg. Age at Failure",   value:`${safe(kpis.avg_age_at_failure).toFixed(1)} mo`, variant:"secondary", subtitle:"Installation → failure",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { label:"High-Usage Failures",   value:fmt(kpis.high_usage_failures),                   variant:"warning",   subtitle:"Run hours > 5,000",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
          { label:"Dominant Segment",      value:kpis.dominant_segment || "N/A",                  variant:"info",      subtitle:"Highest avg. run hours",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
        ].map((k,i)=>(
          <div key={i} className={`delay-${(i+1)*100}`}><KpiCard {...k} /></div>
        ))}
      </div>

      {/* Failure Distribution (full-width) */}
      <div className="mb-6">
        <ChartContainer
          title='Failure Distribution — The "Bathtub" Curve'
          subtitle="Complaint counts binned by operating run hours at point of failure"
          badge="Distribution"
          badgeVariant="amber"
        >
          {charts.failure_distribution?.length > 0 && (
            <Plot
              data={[{
                x: charts.failure_distribution.map(d => d.bin),
                y: charts.failure_distribution.map(d => d.count),
                type: "bar",
                marker: { color: charts.failure_distribution.map((_,i) => i===0 ? C : T), opacity: 0.88 },
                text: charts.failure_distribution.map(d => d.count),
                textposition: "outside", textfont: { size: 11, color: "#475569" },
                hovertemplate: "<b>%{x} hrs</b><br>Failures: %{y}<extra></extra>",
              }]}
              layout={{ ...BASE, height:340,
                xaxis:{ title:{text:"Run Hours",font:{size:11}}, showgrid:false, linecolor:GRID, color:"#94a3b8" },
                yaxis:{ showgrid:true, gridcolor:GRID, zeroline:false, color:"#94a3b8" },
                showlegend:false,
                annotations:[{ x:charts.failure_distribution[0]?.bin, y:charts.failure_distribution[0]?.count,
                  text:"ZHC Zone<br>(< 24 hrs)", showarrow:true, arrowhead:2, arrowcolor:C,
                  font:{size:10,color:C}, ax:45, ay:-30 }],
              }}
              config={CFG} useResizeHandler style={{ width:"100%", height:340 }}
            />
          )}
        </ChartContainer>
      </div>

      {/* App vs Usage + Time to Failure */}
      <div className="section-label">Operational Patterns</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartContainer title="Application vs Usage Hours" subtitle="Box plot of run-hours distribution per market segment" badge="Box Plot" badgeVariant="violet">
          {charts.app_vs_usage?.length > 0 && (
            <Plot
              data={charts.app_vs_usage.map((seg,i) => ({
                y: seg.values, name: seg.segment, type: "box",
                marker: { color: PALETTE[i % PALETTE.length] },
                boxmean: true,
                hovertemplate: `<b>${seg.segment}</b><br>%{y} hrs<extra></extra>`,
              }))}
              layout={{ ...BASE, height:340,
                margin:{l:60,r:20,t:18,b:80},
                xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-20,tickfont:{size:10.5}},
                yaxis:{title:{text:"Run Hours",font:{size:11}},showgrid:true,gridcolor:GRID,zeroline:false,color:"#94a3b8"},
                showlegend:false,
              }}
              config={CFG} useResizeHandler style={{ width:"100%", height:340 }}
            />
          )}
        </ChartContainer>

        <ChartContainer title="Time to Failure Trend" subtitle="Age at complaint (months from installation) over time" badge="Scatter">
          {charts.time_to_failure?.length > 0 && (
            <Plot
              data={[{ x:charts.time_to_failure.map(d=>d.date), y:charts.time_to_failure.map(d=>d.months),
                type:"scatter", mode:"markers",
                marker:{color:T, size:5, opacity:0.55, line:{color:TD,width:0.5}},
                hovertemplate:"<b>%{x}</b><br>Age: %{y:.1f} months<extra></extra>",
              }]}
              layout={{ ...BASE, height:340,
                margin:{l:60,r:20,t:18,b:80},
                xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-30,tickfont:{size:10}},
                yaxis:{title:{text:"Months",font:{size:11}},showgrid:true,gridcolor:GRID,zeroline:false,color:"#94a3b8"},
                showlegend:false,
              }}
              config={CFG} useResizeHandler style={{ width:"100%", height:340 }}
            />
          )}
        </ChartContainer>
      </div>

      {/* RPM Heatmap (full-width) */}
      <div className="section-label">RPM vs Complaint Heatmap</div>
      <div className="mb-6">
        <ChartContainer title="RPM vs Nature of Complaint" subtitle="Cross-tabulation of operating RPM ranges and top complaint types" badge="Heatmap" badgeVariant="primary">
          {charts.rpm_heatmap?.matrix?.length > 0 && (
            <Plot
              data={[{ z:charts.rpm_heatmap.matrix, x:charts.rpm_heatmap.rpm_bins, y:charts.rpm_heatmap.complaints,
                type:"heatmap",
                colorscale:[[0,"#f0faf8"],[0.25,"#a8e0d8"],[0.5,T],[0.75,"#0d6b60"],[1,TD]],
                hoverongaps:false, showscale:true,
                colorbar:{title:{text:"Count",font:{size:11}},tickfont:{size:10}},
                hovertemplate:"<b>%{y}</b><br>RPM: %{x}<br>Count: %{z}<extra></extra>",
              }]}
              layout={{ ...BASE, height:400,
                margin:{l:210,r:90,t:18,b:60},
                xaxis:{title:{text:"RPM Range",font:{size:11}},showgrid:false,color:"#94a3b8"},
                yaxis:{showgrid:false,color:"#475569",autorange:"reversed",tickfont:{size:11}},
              }}
              config={CFG} useResizeHandler style={{ width:"100%", height:400 }}
            />
          )}
        </ChartContainer>
      </div>
    </>
  );
}
