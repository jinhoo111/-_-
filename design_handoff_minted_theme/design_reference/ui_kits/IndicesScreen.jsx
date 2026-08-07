import React from "react";
import { StatCard } from "../../components/data/StatCard.jsx";
import { PriceChange } from "../../components/data/PriceChange.jsx";
import { Sparkline } from "../../components/data/Sparkline.jsx";
import { Card } from "../../components/display/Card.jsx";
import { Badge } from "../../components/display/Badge.jsx";
import { Tabs } from "../../components/core/Tabs.jsx";

const INDICES = [
  { label: "KOSPI", cat: "Korea", value: "2,791.41", chg: 0.9, delta: "+24.87", status: "closed", hours: "opens 09:00 KST", data: [40, 44, 42, 48, 47, 52, 50, 56, 58, 62] },
  { label: "KOSDAQ", cat: "Korea", value: "912.87", chg: -0.4, delta: "−3.66", status: "closed", hours: "opens 09:00 KST", data: [55, 52, 56, 50, 53, 48, 50, 46, 48, 44], losing: true },
  { label: "S&P 500", cat: "US", value: "6,412.20", chg: 1.4, delta: "+88.53", status: "pre", hours: "opens 23:30 KST", data: [30, 34, 33, 38, 41, 40, 46, 49, 52, 58] },
  { label: "NASDAQ", cat: "US", value: "21,904.55", chg: 1.8, delta: "+387.25", status: "pre", hours: "opens 23:30 KST", data: [28, 33, 31, 39, 42, 45, 44, 51, 56, 61] },
  { label: "USD/KRW", cat: "FX", value: "1,318.40", chg: -0.2, delta: "−2.60", status: "open", hours: "24/5", data: [50, 51, 49, 50, 48, 49, 47, 48, 47, 46], losing: true },
  { label: "JPY/KRW", cat: "FX", value: "881.20", chg: 0.3, delta: "+2.64", status: "open", hours: "24/5", data: [42, 43, 41, 44, 43, 45, 44, 46, 45, 47] },
  { label: "US 10Y", cat: "Rates", value: "3.92%", chg: 0.1, delta: "+0.4 bp", status: "pre", hours: "opens 23:30 KST", data: [44, 45, 43, 46, 45, 47, 46, 47, 48, 48] },
  { label: "KR 3Y", cat: "Rates", value: "2.84%", chg: -0.1, delta: "−0.3 bp", status: "closed", hours: "opens 09:00 KST", data: [48, 47, 48, 46, 47, 45, 46, 44, 45, 44], losing: true },
  { label: "Bitcoin", cat: "Crypto", value: "₩161,240,000", chg: 2.6, delta: "+₩4,086,000", status: "open", hours: "24/7", data: [20, 28, 24, 36, 30, 44, 38, 52, 48, 60] },
  { label: "Gold", cat: "Commodities", value: "$2,410.80", chg: 0.5, delta: "+$12.10", status: "open", hours: "COMEX", data: [40, 41, 43, 42, 45, 44, 47, 46, 48, 50] },
];
const CATS = ["Korea", "US", "FX", "Rates", "Crypto", "Commodities"];

export function IndicesScreen() {
  const [range, setRange] = React.useState("1M");
  const [cats, setCats] = React.useState([]);
  const toggleCat = (c) => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c]);
  const shown = cats.length ? INDICES.filter((ix) => cats.includes(ix.cat)) : INDICES;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Markets</div>
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginTop: 6 }}>Calm week so far. Your watchlist is quiet.</div>
        </div>
        <Tabs items={["1W", "1M", "3M", "1Y"]} value={range} onChange={setRange} size="sm" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <FilterChip label="All" active={cats.length === 0} onClick={() => setCats([])} />
        {CATS.map((c) => <FilterChip key={c} label={c} active={cats.includes(c)} onClick={() => toggleCat(c)} />)}
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginLeft: 8 }}>{shown.length} of {INDICES.length}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {shown.map((ix) => (
          <StatCard key={ix.label} label={ix.label} value={ix.value} compact
            action={<MarketStatus status={ix.status} hours={ix.hours} />}
            change={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><PriceChange value={ix.chg} size="sm" /><span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>{ix.delta}</span></span>}
            spark={<Sparkline data={ix.data} height={36} stroke={ix.losing ? "var(--price-down)" : "var(--chart-line)"} fill={!ix.losing} />} />
        ))}
      </div>
      <Card title="Yield curve" subtitle="KR treasury spread, 10Y − 2Y" action={<Badge tone="info">Weekly</Badge>}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xl)", fontWeight: 600, color: "var(--text-primary)" }}>+0.42%p</span>
          <PriceChange value={0.06} suffix="%p" size="sm" />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Steepening gently — usually a good sign for growth.</span>
        </div>
        <Sparkline data={[20, 18, 16, 17, 15, 18, 22, 26, 25, 30, 34, 38]} height={64} stroke="var(--chart-alt-1)" style={{ marginTop: 16 }} />
      </Card>
    </div>
  );
}

function MarketStatus({ status, hours }) {
  const cfg = {
    open: { color: "var(--positive)", label: "Open" },
    pre: { color: "var(--warning)", label: "Pre-market" },
    closed: { color: "var(--text-muted)", label: "Closed" },
  }[status] || { color: "var(--text-muted)", label: status };
  return (
    <span title={hours} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: status === "closed" ? "var(--text-muted)" : cfg.color, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, boxShadow: status === "open" ? "0 0 0 3px " + "var(--positive-soft)" : "none" }}></span>
      {cfg.label}
    </span>
  );
}

function FilterChip({ label, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 36, padding: "0 16px", cursor: "pointer",
        borderRadius: "var(--radius-pill)",
        background: active ? "var(--accent-soft)" : hover ? "var(--surface-2)" : "var(--surface-1)",
        border: "1px solid " + (active ? "var(--accent-soft-border)" : "var(--border-default)"),
        color: active ? "var(--accent)" : "var(--text-secondary)",
        fontFamily: "var(--font-body)", fontSize: "var(--text-sm)",
        fontWeight: active ? "var(--weight-semibold)" : "var(--weight-medium)",
        transition: "background var(--duration-fast) var(--ease-out)",
      }}
    >
      {label}
    </button>
  );
}
