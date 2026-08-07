import React from "react";
import { Card } from "../../components/display/Card.jsx";
import { Button } from "../../components/core/Button.jsx";
import { Badge } from "../../components/display/Badge.jsx";
import { Input } from "../../components/core/Input.jsx";
import { PriceChange } from "../../components/data/PriceChange.jsx";
import { Sparkline } from "../../components/data/Sparkline.jsx";

const WATCH = [
  { symbol: "SE", name: "Samsung Elec", price: "₩74,500", chg: 2.1, data: [40, 44, 42, 48, 47, 52, 56], alerts: ["Earnings Aug 14"] },
  { symbol: "SK", name: "SK Hynix", price: "₩198,400", chg: 3.2, data: [30, 36, 34, 44, 48, 54, 60], alerts: ["52w high"] },
  { symbol: "KA", name: "Kakao", price: "₩41,150", chg: -2.4, data: [60, 55, 57, 50, 48, 44, 40], losing: true, alerts: ["Volume spike"] },
  { symbol: "NV", name: "NVIDIA", price: "$182.40", chg: 1.8, data: [35, 40, 38, 46, 50, 55, 58], alerts: [] },
  { symbol: "CP", name: "Coupang", price: "$24.90", chg: -0.6, data: [50, 48, 51, 47, 48, 46, 45], losing: true, alerts: [] },
];
const SIGNALS = [
  { tone: "warning", label: "Earnings", text: "Samsung Elec reports Aug 14 — 11 days out." },
  { tone: "accent", label: "52w high", text: "SK Hynix closed at a 52-week high." },
  { tone: "info", label: "Volume", text: "Kakao volume 3.1× its 30-day average." },
];
const MEMOS = [
  { ticker: "SE", date: "Aug 1", text: "If it dips under ₩70,000 before earnings, add 2 shares." },
  { ticker: "KA", date: "Jul 29", text: "Watching the turnaround story — no position until two green quarters." },
];

export function MonitorScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Monitor</div>
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginTop: 6 }}>Your watchlist, with the signals that matter.</div>
        </div>
        <Input placeholder="Add a ticker to watch…" prefix="⌕" style={{ width: 280 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, alignItems: "start" }}>
        <Card title="Watchlist" subtitle={WATCH.length + " tickers"} padding="var(--space-3) var(--space-6)">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {WATCH.map((w) => <WatchRow key={w.symbol} w={w} />)}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Radar" subtitle="Past 24 hours">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SIGNALS.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Badge tone={s.tone} size="sm" style={{ flexShrink: 0, marginTop: 1 }}>{s.label}</Badge>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--leading-snug)" }}>{s.text}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Memos" action={<Button variant="ghost" size="sm">New memo</Button>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MEMOS.map((m, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--accent)" }}>{m.ticker}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{m.date}</span>
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--leading-snug)" }}>{m.text}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function WatchRow({ w }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14, minHeight: 60, padding: "8px 12px", margin: "0 -12px",
        borderRadius: "var(--radius-md)", cursor: "pointer",
        background: hover ? "var(--surface-2)" : "transparent",
        transition: "background var(--duration-fast) var(--ease-out)",
      }}
    >
      <span style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", color: "var(--accent)", fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", fontSize: "var(--text-sm)" }}>{w.symbol}</span>
      <span style={{ minWidth: 0, width: 130, flexShrink: 0 }}>
        <span style={{ display: "block", fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</span>
        {w.alerts.length ? <Badge tone="warning" size="sm" style={{ marginTop: 3 }}>{w.alerts[0]}</Badge> : null}
      </span>
      <span style={{ flex: 1, minWidth: 40 }}>
        <Sparkline data={w.data} height={30} fill={false} stroke={w.losing ? "var(--price-down)" : "var(--chart-line)"} />
      </span>
      <span style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{w.price}</span>
        <PriceChange value={w.chg} size="sm" />
      </span>
    </div>
  );
}
