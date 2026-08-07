import React from "react";
import { Card } from "../../components/display/Card.jsx";
import { Badge } from "../../components/display/Badge.jsx";
import { Tabs } from "../../components/core/Tabs.jsx";
import { StatCard } from "../../components/data/StatCard.jsx";
import { PriceChange } from "../../components/data/PriceChange.jsx";

const INSIDER = [
  { company: "Samsung Elec", who: "Lee J. · EVP Memory", side: "Buy", shares: "12,000", value: "₩8.9B", date: "Aug 1", chg: 2.1 },
  { company: "Hyundai Motor", who: "Chung K. · Director", side: "Buy", shares: "4,500", value: "₩1.1B", date: "Aug 1", chg: -1.2 },
  { company: "Kakao", who: "Park S. · CFO", side: "Sell", shares: "22,000", value: "₩0.9B", date: "Jul 31", chg: -2.4 },
  { company: "SK Hynix", who: "Kim D. · SVP", side: "Buy", shares: "3,100", value: "₩0.6B", date: "Jul 31", chg: 3.2 },
  { company: "NAVER", who: "Choi H. · Director", side: "Sell", shares: "1,800", value: "₩0.4B", date: "Jul 30", chg: 0.4 },
  { company: "LG Energy", who: "Kwon Y. · EVP", side: "Buy", shares: "2,400", value: "₩0.9B", date: "Jul 30", chg: 1.7 },
];
const FUNDS = [
  { company: "NVIDIA", who: "Berkshire-style value fund", side: "New", shares: "1.2M", value: "$210M", date: "Q2 13F", chg: 1.8 },
  { company: "Samsung Elec (GDR)", who: "Tiger Global", side: "Add", shares: "+840K", value: "$96M", date: "Q2 13F", chg: 2.1 },
  { company: "Coupang", who: "Baillie Gifford", side: "Trim", shares: "−2.1M", value: "$48M", date: "Q2 13F", chg: -0.6 },
  { company: "Sea Ltd", who: "Tiger Global", side: "Exit", shares: "−600K", value: "$41M", date: "Q2 13F", chg: -1.1 },
];
const SIDE_TONE = { Buy: "info", Sell: "warning", New: "accent", Add: "info", Trim: "warning", Exit: "negative" };

export function FlowScreen() {
  const [tab, setTab] = React.useState("Insider trades");
  const rows = tab === "Fund 13F" ? FUNDS : INSIDER;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Flow</div>
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginTop: 6 }}>Follow what insiders and big funds actually do — not what they say.</div>
        </div>
        <Tabs items={["Insider trades", "Fund 13F"]} value={tab} onChange={setTab} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="Biggest buy this week" value="₩8.9B" compact note="Samsung Elec · EVP Memory" change={<Badge tone="info" size="sm">Buy</Badge>} />
        <StatCard label="Insider buys vs sells, 7d" value="14 : 5" compact note="Buyers are leading" change={<Badge tone="accent" size="sm">Bullish tilt</Badge>} />
        <StatCard label="New 13F positions" value="8" compact note="In your watchlist universe" />
      </div>
      <Card padding="var(--space-3) 0">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2.2fr 90px 1fr 1fr 80px", gap: 12, padding: "8px 24px", fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: "var(--weight-medium)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase" }}>
          <span>Company</span><span>{tab === "Fund 13F" ? "Fund" : "Insider"}</span><span>Action</span>
          <span style={{ textAlign: "right" }}>Shares</span><span style={{ textAlign: "right" }}>Value</span><span style={{ textAlign: "right" }}>Date</span>
        </div>
        {rows.map((r, i) => <FlowRow key={i} r={r} last={i === rows.length - 1} />)}
      </Card>
    </div>
  );
}

function FlowRow({ r, last }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid", gridTemplateColumns: "2fr 2.2fr 90px 1fr 1fr 80px", gap: 12, alignItems: "center",
        padding: "14px 24px", cursor: "pointer",
        background: hover ? "var(--surface-2)" : "transparent",
        borderTop: "1px solid var(--border-default)",
        transition: "background var(--duration-fast) var(--ease-out)",
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.company}</span>
        <PriceChange value={r.chg} size="sm" />
      </span>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.who}</span>
      <span><Badge tone={SIDE_TONE[r.side] || "neutral"} size="sm">{r.side}</Badge></span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{r.shares}</span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{r.value}</span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{r.date}</span>
    </div>
  );
}
