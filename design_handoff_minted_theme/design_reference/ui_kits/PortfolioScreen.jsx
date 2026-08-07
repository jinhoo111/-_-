import React from "react";
import { Card } from "../../components/display/Card.jsx";
import { Button } from "../../components/core/Button.jsx";
import { Badge } from "../../components/display/Badge.jsx";
import { Tabs } from "../../components/core/Tabs.jsx";
import { StatCard } from "../../components/data/StatCard.jsx";
import { PriceChange } from "../../components/data/PriceChange.jsx";
import { Sparkline } from "../../components/data/Sparkline.jsx";
import { TickerRow } from "../../components/data/TickerRow.jsx";

const RANGES = {
  "1D": { chg: 0.4, amt: "+₩96,300", note: "vs. yesterday", data: [22.9, 23.1, 23.0, 23.3, 23.2, 23.5, 23.9, 24.0, 24.18] },
  "7D": { chg: 1.1, amt: "+₩263,100", note: "past 7 days", data: [23.4, 23.6, 23.3, 23.7, 23.9, 23.8, 24.18] },
  "1M": { chg: 4.2, amt: "+₩974,200", note: "You're ahead of your plan", data: [22.8, 23.0, 22.7, 23.2, 23.1, 23.5, 23.4, 23.8, 24.0, 24.18] },
  "3M": { chg: 8.9, amt: "+₩1,976,400", note: "since May", data: [21.4, 21.9, 21.6, 22.3, 22.1, 22.8, 23.2, 23.0, 23.6, 24.18] },
  "9M": { chg: 16.4, amt: "+₩3,406,900", note: "since last November", data: [19.6, 20.1, 19.8, 20.6, 21.2, 20.9, 21.8, 22.5, 23.1, 24.18] },
  "YTD": { chg: 14.7, amt: "+₩3,099,500", note: "since January 1", data: [20.4, 20.9, 20.5, 21.3, 21.0, 21.9, 22.4, 23.0, 23.5, 24.18] },
  "1Y": { chg: 21.3, amt: "+₩4,246,800", note: "past 12 months", data: [18.2, 18.6, 18.1, 19.4, 19.2, 20.8, 20.3, 21.9, 22.4, 23.1, 22.8, 24.18] },
  "All": { chg: 38.6, amt: "+₩6,734,200", note: "since you started, 18 months ago", data: [16.1, 16.8, 16.4, 17.5, 18.2, 18.0, 19.1, 19.8, 20.6, 21.4, 22.5, 23.2, 24.18] },
};
const RANGE_NAMES = { "1D": "1 day", "7D": "7 days", "1M": "1 month", "3M": "3 months", "9M": "9 months", "YTD": "Year to date", "1Y": "1 year", "All": "All time" };
const HOLDINGS = [
  { symbol: "SE", name: "Samsung Elec", sub: "12 shares", value: "₩8,940,000", chg: 2.1 },
  { symbol: "NV", name: "NVIDIA", sub: "4 shares", value: "₩6,212,300", chg: -0.8 },
  { symbol: "KO", name: "KODEX 200", sub: "ETF · 31 units", value: "₩4,102,900", chg: 0.6 },
  { symbol: "AP", name: "Apple", sub: "6 shares", value: "₩2,871,400", chg: 1.3 },
  { symbol: "HY", name: "Hyundai Motor", sub: "8 shares", value: "₩2,053,900", chg: -1.2 },
];
const ALLOC = [
  { label: "KR equity", pct: 42, color: "var(--chart-line)" },
  { label: "US equity", pct: 33, color: "var(--chart-alt-1)" },
  { label: "ETFs", pct: 17, color: "var(--chart-alt-2)" },
  { label: "Cash", pct: 8, color: "var(--chart-alt-3)" },
];

export function PortfolioScreen({ name = "Jiwoo" }) {
  const [range, setRange] = React.useState("1M");
  const r = RANGES[range];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Good evening, {name}</div>
        <div style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginTop: 6 }}>18 months invested · 62-day saving streak</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "stretch" }}>
        <StatCard label="Total portfolio" value="₩24,180,500"
          action={<RangeDropdown value={range} onChange={setRange} />}
          change={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><PriceChange value={r.chg} badge /><span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{r.amt}</span></span>} note={r.note}
          spark={<Sparkline data={r.data} height={88} />} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <StatCard label="Dividends this year" value="₩132,400"
            change={<Badge tone="accent" size="sm">3 payers</Badge>} note="Next: Samsung Elec · Aug 14"
            style={{ flex: 1 }} />
          <StatCard label="Cash available" value="₩1,934,000" note="Ready to invest"
            change={<Button size="sm" variant="secondary">Invest cash</Button>}
            style={{ flex: 1 }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, alignItems: "start" }}>
        <Card title="Holdings" subtitle="Updated 2 min ago" action={<Button variant="secondary" size="sm">Add an investment</Button>}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {HOLDINGS.map((h) => (
              <TickerRow key={h.symbol} symbol={h.symbol} name={h.name} sub={h.sub} value={h.value}
                change={<PriceChange value={h.chg} size="sm" />} onClick={() => {}} />
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Allocation">
            <div style={{ display: "flex", height: 14, borderRadius: "var(--radius-pill)", overflow: "hidden", gap: 2 }}>
              {ALLOC.map((a) => <span key={a.label} style={{ width: a.pct + "%", background: a.color }}></span>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {ALLOC.map((a) => (
                <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-sm)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }}></span>
                  <span style={{ color: "var(--text-secondary)", flex: 1 }}>{a.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{a.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Next step" subtitle="A little goes a long way">
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--leading-normal)", marginBottom: 16 }}>
              You usually invest ₩300,000 around this time of month. Keep the streak going?
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Button size="sm">Invest ₩300,000</Button>
              <Badge tone="accent">62-day streak</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RangeDropdown({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(null);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 12px",
          background: open ? "var(--surface-2)" : "transparent",
          border: "1px solid " + (open ? "var(--border-focus)" : "var(--border-strong)"),
          borderRadius: "var(--radius-md)", cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-primary)",
          fontWeight: "var(--weight-medium)", whiteSpace: "nowrap",
          transition: "border-color var(--duration-fast) var(--ease-out)",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: "var(--radius-pill)", display: open ? "inline-block" : "none" }}>{value}</span>
        {RANGE_NAMES[value]}
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>▾</span>
      </button>
      {open ? (
        <React.Fragment>
          <span onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 29 }}></span>
          <div style={{
            position: "absolute", top: 42, right: 0, zIndex: 30, width: 200,
            background: "var(--surface-1)", border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-raised)", padding: 6,
            display: "flex", flexDirection: "column",
          }}>
            {Object.keys(RANGES).map((k) => (
              <button
                key={k}
                onClick={() => { onChange(k); setOpen(false); }}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, height: 40, padding: "0 10px",
                  background: hover === k ? "var(--surface-2)" : "transparent",
                  border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", textAlign: "left",
                  color: k === value ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: k === value ? "var(--weight-semibold)" : "var(--weight-regular)",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)",
                  color: k === value ? "var(--accent)" : "var(--text-secondary)",
                  background: k === value ? "var(--accent-soft)" : "var(--surface-2)",
                  padding: "2px 0", borderRadius: "var(--radius-pill)", width: 40, textAlign: "center", flexShrink: 0,
                }}>{k}</span>
                {RANGE_NAMES[k]}
                {k === value ? <span style={{ marginLeft: "auto", color: "var(--accent)" }}>✓</span> : null}
              </button>
            ))}
          </div>
        </React.Fragment>
      ) : null}
    </span>
  );
}
