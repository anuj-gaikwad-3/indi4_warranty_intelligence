import React, { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { FiscalYearContext } from "../context/FiscalYearContext";
import { getZhcData } from "../services/dashboardApi";
import DashboardHeader from "../components/layout/DashboardHeader";
import KpiCard from "../components/dashboard/KpiCard";
import ChartContainer from "../components/dashboard/ChartContainer";

const T = "#234FA2"; const TD = "#1C3F82"; const C = "#e07c3a"; const GRID = "#f1f5f9";
const BASE = {
  font: { family: "Inter, sans-serif", size: 12, color: "#475569" },
  paper_bgcolor: "#fff", plot_bgcolor: "#fff",
  margin: { l: 40, r: 24, t: 18, b: 60 },
  hoverlabel: { bgcolor: "#0f172a", font: { size: 12, family: "Inter, sans-serif", color: "#fff" }, bordercolor: "#0f172a" },
};
const CFG = { displayModeBar: false, responsive: true };
function safe(v) { return v == null || isNaN(Number(v)) ? 0 : Number(v); }
function fmt(v)  { return safe(v).toLocaleString("en-IN"); }

export default function ZhcAnalysis() {
  const { selectedFy } = useContext(FiscalYearContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!selectedFy) return;
    let c = false;
    getZhcData(selectedFy).then(d => { if (!c) setData(d); });
    return () => { c = true; };
  }, [selectedFy]);

  const kpis   = data?.kpis   || {};
  const charts = data?.charts || {};
  const growth = safe(kpis.zhc_growth);
  const isUp   = growth > 0;

  return (
    <>
      <DashboardHeader
        title="ZHC Analysis"
        subtitle="Zero Hour Complaints — units failing within first 24 operating hours"
        badge="ZHC"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Total ZHC Cases",     value:fmt(kpis.total_zhc), variant:"rose", subtitle:selectedFy,
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
          { label:"ZHC Rate",           value:`${safe(kpis.zhc_rate).toFixed(1)}%`, variant:"secondary", subtitle:"Of total complaints",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> },
          { label:"Primary Failure Part",value:kpis.primary_failure_part || "N/A", variant:"warning",
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
          { label:"ZHC Growth YoY",     value:`${Math.abs(growth).toFixed(1)}%`, variant: isUp ? "rose" : "emerald",
            subtitle: isUp ? "YoY Increase" : "YoY Decrease",
            trend: { direction: isUp ? "up" : "down", value: `${Math.abs(growth).toFixed(1)}%` },
            icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
        ].map((k,i)=>(
          <div key={i} className={`delay-${(i+1)*100}`}><KpiCard {...k} /></div>
        ))}
      </div>

      {/* Pareto Chart (full width) */}
      <div className="mb-6">
        <ChartContainer
          title="Pareto Analysis — Nature of ZHC Complaints"
          subtitle="80/20 analysis: complaint types driving the majority of Zero Hour Cases"
          badge="Pareto"
          badgeVariant="rose"
        >
          {charts.pareto?.length > 0 && (
            <Plot
              data={[
                { x:charts.pareto.map(d=>d.nature_of_complaint), y:charts.pareto.map(d=>d.count),
                  type:"bar", name:"Count", marker:{color:T, opacity:0.85},
                  text:charts.pareto.map(d=>d.count), textposition:"outside", textfont:{size:10,color:TD},
                  hovertemplate:"<b>%{x}</b><br>Count: %{y}<extra></extra>" },
                { x:charts.pareto.map(d=>d.nature_of_complaint), y:charts.pareto.map(d=>d.cumulative_pct),
                  type:"scatter", mode:"lines+markers", name:"Cumulative %", yaxis:"y2",
                  line:{color:C,width:2.5,shape:"spline"}, marker:{size:6,color:C,line:{color:"#fff",width:1.5}},
                  hovertemplate:"<b>%{x}</b><br>Cumulative: %{y:.1f}%<extra></extra>" },
              ]}
              layout={{ ...BASE, height:380,
                margin:{l:50,r:55,t:20,b:130},
                xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-40,tickfont:{size:10.5}},
                yaxis:{showgrid:true,gridcolor:GRID,zeroline:false,color:"#475569",title:{text:"Count",font:{size:11}}},
                yaxis2:{title:{text:"Cumulative %",font:{size:11}},overlaying:"y",side:"right",range:[0,105],showgrid:false,color:C},
                legend:{orientation:"h",yanchor:"top",y:-0.3,xanchor:"center",x:0.5,font:{size:11,color:"#475569"}},
              }}
              config={CFG} useResizeHandler style={{ width:"100%", height:380 }}
            />
          )}
        </ChartContainer>
      </div>

      {/* ZHC by Model + Top Parts */}
      <div className="section-label">Model & Parts Analysis</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartContainer title="ZHC by Model" subtitle="Zero Hour Complaint count per compressor model" badge="Models">
          {charts.zhc_by_model?.length > 0 && (
            <Plot
              data={[{ x:charts.zhc_by_model.map(d=>d.model), y:charts.zhc_by_model.map(d=>d.count),
                type:"bar", marker:{color:T,opacity:0.85},
                text:charts.zhc_by_model.map(d=>d.count), textposition:"outside", textfont:{size:10.5,color:TD},
                hovertemplate:"<b>%{x}</b><br>ZHC: %{y}<extra></extra>" }]}
              layout={{ ...BASE, height:320, showlegend:false,
                xaxis:{showgrid:false,linecolor:GRID,color:"#94a3b8",tickangle:-35,tickfont:{size:10.5}},
                yaxis:{showgrid:true,gridcolor:GRID,zeroline:false,showticklabels:false} }}
              config={CFG} useResizeHandler style={{ width:"100%", height:320 }}
            />
          )}
        </ChartContainer>

        <ChartContainer title="Top 10 Parts Replaced in ZHC" subtitle="Most frequently replaced components in zero-hour failures" badge="Parts" badgeVariant="accent">
          {charts.top_parts?.length > 0 && (
            <Plot
              data={[{ y:charts.top_parts.map(d=>d.part), x:charts.top_parts.map(d=>d.count),
                type:"bar", orientation:"h", marker:{color:C,opacity:0.85},
                text:charts.top_parts.map(d=>d.count), textposition:"outside", textfont:{size:10.5,color:"#8a4a1e"},
                hovertemplate:"<b>%{y}</b><br>Frequency: %{x}<extra></extra>" }]}
              layout={{ ...BASE, height:320, showlegend:false,
                margin:{l:190,r:30,t:20,b:40},
                xaxis:{showgrid:true,gridcolor:GRID,zeroline:false,color:"#94a3b8"},
                yaxis:{showgrid:false,color:"#475569",autorange:"reversed",tickfont:{size:10.5}} }}
              config={CFG} useResizeHandler style={{ width:"100%", height:320 }}
            />
          )}
        </ChartContainer>
      </div>
    </>
  );
}
