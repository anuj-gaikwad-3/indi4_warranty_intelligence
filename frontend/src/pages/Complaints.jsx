import React, { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FiscalYearContext } from "../context/FiscalYearContext";
import { getComplaintsData } from "../services/dashboardApi";
import DashboardHeader from "../components/layout/DashboardHeader";
import KpiCard from "../components/dashboard/KpiCard";
import ChartContainer from "../components/dashboard/ChartContainer";

const T = "#234FA2"; const C = "#e07c3a"; const TD = "#1C3F82"; const GRID = "#f1f5f9";
const STAGE_COLORS = { "Single Stage": T, "Dual Stage": C };

const BASE = {
  font: { family: "Inter, sans-serif", size: 12, color: "#475569" },
  paper_bgcolor: "#fff", plot_bgcolor: "#fff",
  margin: { l: 40, r: 24, t: 18, b: 60 },
  hoverlabel: { bgcolor: "#0f172a", font: { size: 12, family: "Inter, sans-serif", color: "#fff" }, bordercolor: "#0f172a" },
};
const CFG = { displayModeBar: false, responsive: true };

function safe(v) { return v == null || isNaN(Number(v)) ? 0 : Number(v); }
function fmt(v)  { return safe(v).toLocaleString("en-IN"); }

function stackedTraces(rows, xKey, isHorizontal = false) {
  const stages = Array.from(new Set(rows.map(d => d.model_stage || "Unknown")));
  return stages.map(stage => {
    const sub = rows.filter(d => d.model_stage === stage);
    const color = STAGE_COLORS[stage] || T;
    return isHorizontal
      ? { name: stage, type: "bar", orientation: "h",
          y: sub.map(d => d[xKey]), x: sub.map(d => safe(d.count)),
          marker: { color, opacity: 0.88 },
          hovertemplate: `<b>%{y}</b><br>${stage}: %{x}<extra></extra>` }
      : { name: stage, type: "bar",
          x: sub.map(d => d[xKey]), y: sub.map(d => safe(d.count)),
          marker: { color, opacity: 0.88 },
          hovertemplate: `<b>%{x}</b><br>${stage}: %{y}<extra></extra>` };
  });
}

export default function Complaints() {
  const { selectedFy } = useContext(FiscalYearContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedFy) return;
    let c = false;
    getComplaintsData(selectedFy).then(d => { if (!c) setData(d); });
    return () => { c = true; };
  }, [selectedFy]);

  const kpis   = data?.kpis || {};
  const charts = data?.charts || {};

  const topDealer   = [...(charts.dealer   || [])].sort((a,b)=>safe(b.count)-safe(a.count)).slice(0,8);
  const topCustomer = [...(charts.customer  || [])].sort((a,b)=>safe(b.count)-safe(a.count)).slice(0,8);
  const appSorted   = [...(charts.app_stage || [])].sort((a,b)=>safe(b.count)-safe(a.count)).slice(0,8);
  const issueSorted = [...(charts.issue_stage||[])].sort((a,b)=>safe(b.count)-safe(a.count)).slice(0,10);

  return (
    <>
      <DashboardHeader title="Complaints Analysis" subtitle="Dealer, customer, segment and issue-frequency breakdown" badge="Complaints" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Unique Dealers",         value:fmt(kpis.unique_dealers),          variant:"primary",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { label:"Unique Customers",       value:fmt(kpis.unique_customers),        variant:"secondary",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { label:"Top Segment",            value:kpis.top_segment || "N/A",         variant:"info",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
          { label:"Avg Complaints / Dealer",value:safe(kpis.avg_complaints_per_dealer).toFixed(1), variant:"warning",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
        ].map((k,i)=>(
          <div key={i} className={`delay-${(i+1)*100}`}><KpiCard {...k} /></div>
        ))}
      </div>

      {/* Dealer + Customer charts */}
      <div className="section-label">Network Analysis</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartContainer title="Complaints by Dealer" subtitle="Top 8 dealers by volume" badge="Dealers">
          <Plot
            data={[{ x:topDealer.map(d=>d.dealer_name), y:topDealer.map(d=>safe(d.count)),
              type:"bar", marker:{color:T,opacity:0.85},
              text:topDealer.map(d=>safe(d.count)), textposition:"outside", textfont:{size:10.5,color:TD},
              hovertemplate:"<b>%{x}</b><br>%{y} complaints<extra></extra>" }]}
            layout={{ ...BASE, height:300, showlegend:false,
              xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-30,tickfont:{size:10}},
              yaxis:{showgrid:true,gridcolor:GRID,zeroline:false,showticklabels:false} }}
            config={CFG} useResizeHandler style={{ width:"100%", height:300 }}
          />
        </ChartContainer>

        <ChartContainer title="Complaints by Customer" subtitle="Top 8 customers by volume" badge="Customers" badgeVariant="accent">
          <Plot
            data={[{ x:topCustomer.map(d=>d.customer_name), y:topCustomer.map(d=>safe(d.count)),
              type:"bar", marker:{color:C,opacity:0.85},
              text:topCustomer.map(d=>safe(d.count)), textposition:"outside", textfont:{size:10.5,color:"#8a4a1e"},
              hovertemplate:"<b>%{x}</b><br>%{y} complaints<extra></extra>" }]}
            layout={{ ...BASE, height:300, showlegend:false,
              xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-30,tickfont:{size:10}},
              yaxis:{showgrid:true,gridcolor:GRID,zeroline:false,showticklabels:false} }}
            config={CFG} useResizeHandler style={{ width:"100%", height:300 }}
          />
        </ChartContainer>
      </div>

      {/* Segment + Issue charts */}
      <div className="section-label">Segment & Issue Breakdown</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartContainer title="Application vs Model Stage" subtitle="Stacked complaint distribution by segment" badge="Segment">
          <Plot
            data={stackedTraces(appSorted, "application_market_segment")}
            layout={{ ...BASE, height:320, barmode:"stack",
              xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-25,tickfont:{size:10}},
              yaxis:{showgrid:true,gridcolor:GRID,zeroline:false,showticklabels:false},
              legend:{orientation:"h",yanchor:"top",y:-0.2,xanchor:"center",x:0.5,font:{size:11,color:"#475569"}} }}
            config={CFG} useResizeHandler style={{ width:"100%", height:320 }}
          />
        </ChartContainer>

        <ChartContainer title="Issue Frequency by Stage" subtitle="Top 10 complaint types — Single vs Dual Stage" badge="Issues" badgeVariant="rose">
          <Plot
            data={stackedTraces(issueSorted, "nature_of_complaint", true)}
            layout={{ ...BASE, height:340, barmode:"stack",
              margin:{...BASE.margin, l:160},
              xaxis:{showgrid:true,gridcolor:GRID,zeroline:false,color:"#94a3b8"},
              yaxis:{showgrid:false,linecolor:GRID,color:"#475569",automargin:true,tickfont:{size:10.5}},
              legend:{orientation:"h",yanchor:"top",y:-0.14,xanchor:"center",x:0.5,font:{size:11,color:"#475569"}} }}
            config={CFG} useResizeHandler style={{ width:"100%", height:340 }}
          />
        </ChartContainer>
      </div>
    </>
  );
}
