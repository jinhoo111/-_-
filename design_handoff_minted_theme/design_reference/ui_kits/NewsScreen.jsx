import React from "react";
import { Card } from "../../components/display/Card.jsx";
import { Badge } from "../../components/display/Badge.jsx";
import { Tabs } from "../../components/core/Tabs.jsx";
import { PriceChange } from "../../components/data/PriceChange.jsx";

const NEWS = [
  { source: "Yonhap Finance", time: "12 min ago", title: "Samsung Electronics lifts Q3 guidance on HBM demand", tickers: [{ t: "005930", chg: 2.1 }], tag: null },
  { source: "Reuters", time: "48 min ago", title: "Fed officials signal patience on rate cuts through autumn", tickers: [], tag: "Macro" },
  { source: "Korea Economic Daily", time: "1 h ago", title: "KOSDAQ biotech rally cools as lockups expire", tickers: [{ t: "KOSDAQ", chg: -0.4 }], tag: null },
  { source: "Bloomberg", time: "2 h ago", title: "Won steadies near 1,318 as exporters repatriate", tickers: [{ t: "USD/KRW", chg: -0.2 }], tag: "FX" },
  { source: "Maeil Business", time: "3 h ago", title: "Hyundai Motor unveils solid-state battery roadmap", tickers: [{ t: "005380", chg: -1.2 }], tag: null },
];

export function NewsScreen() {
  const [tab, setTab] = React.useState("For you");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>News</div>
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginTop: 6 }}>Only stories that touch your holdings and watchlist.</div>
        </div>
        <Tabs items={["For you", "Market", "Company"]} value={tab} onChange={setTab} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {NEWS.map((n, i) => <NewsItem key={i} item={n} />)}
        </div>
        <Card title="Analyst pulse" subtitle="Your holdings, past 7 days">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PulseRow name="Samsung Elec" dist={[70, 24, 6]} note="21 ratings · mostly buy" />
            <PulseRow name="NVIDIA" dist={[82, 15, 3]} note="34 ratings · strong buy" />
            <PulseRow name="Hyundai Motor" dist={[44, 43, 13]} note="16 ratings · split" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function NewsItem({ item }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "var(--surface-2)" : "var(--surface-1)",
        border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)",
        padding: "16px 20px", cursor: "pointer",
        transition: "background var(--duration-fast) var(--ease-out)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
        <span style={{ fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{item.source}</span>
        <span>·</span>
        <span>{item.time}</span>
        {item.tag ? <Badge tone="info" size="sm">{item.tag}</Badge> : null}
      </div>
      <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", marginTop: 6, lineHeight: "var(--leading-snug)" }}>{item.title}</div>
      {item.tickers.length ? (
        <div style={{ display: "flex", gap: 12, marginTop: 10, alignItems: "center" }}>
          {item.tickers.map((tk) => (
            <span key={tk.t} style={{ display: "inline-flex", gap: 8, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              {tk.t} <PriceChange value={tk.chg} size="sm" />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PulseRow({ name, dist, note }) {
  const colors = ["var(--positive)", "var(--text-muted)", "var(--negative)"];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: 6 }}>
        <span style={{ color: "var(--text-primary)", fontWeight: "var(--weight-semibold)" }}>{name}</span>
        <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>{note}</span>
      </div>
      <div style={{ display: "flex", height: 8, borderRadius: "var(--radius-pill)", overflow: "hidden", gap: 2 }}>
        {dist.map((p, i) => <span key={i} style={{ width: p + "%", background: colors[i], opacity: i === 0 ? 1 : 0.55 }}></span>)}
      </div>
    </div>
  );
}
