import React from "react";
import { Card } from "../../components/display/Card.jsx";
import { Button } from "../../components/core/Button.jsx";
import { Badge } from "../../components/display/Badge.jsx";
import { Tabs } from "../../components/core/Tabs.jsx";
import { StatCard } from "../../components/data/StatCard.jsx";
import { PriceChange } from "../../components/data/PriceChange.jsx";

const DAY_DATA = {
  1: { dots: ["var(--chart-alt-1)"] },
  3: { dots: ["var(--accent)", "var(--chart-alt-1)"] },
};
const ENTRIES = {
  1: [
    { kind: "note", time: "21:40", title: "Monthly plan check-in", body: "Rebalanced nothing. Plan says sit tight — sitting tight." },
  ],
  3: [
    { kind: "trade", time: "10:12", side: "Buy", name: "NVIDIA", qty: "2 shares · ₩1,540,000", pnl: null },
    { kind: "trade", time: "13:47", side: "Sell", name: "KODEX 200", qty: "5 units · ₩661,000", pnl: 3.1 },
    { kind: "note", time: "22:05", title: "Why I sold", body: "Hit my +3% target. Following the rule, not the feeling." },
  ],
};

export function JournalScreen() {
  const [tab, setTab] = React.useState("Trades");
  const [day, setDay] = React.useState(3);
  const entries = ENTRIES[day] || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Journal</div>
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginTop: 6 }}>Write it down — future you will thank you.</div>
        </div>
        <Tabs items={["Trades", "Habits", "Notes"]} value={tab} onChange={setTab} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="Saving streak" value="62 days" compact note="Personal best" change={<Badge tone="accent" size="sm">Keep going</Badge>} />
        <StatCard label="Entries this month" value="4" compact note="2 trades · 2 notes" />
        <StatCard label="Win rate, 3 months" value="58%" compact change={<PriceChange value={6} suffix="%p" size="sm" />} note="vs. previous 3 months" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, alignItems: "start" }}>
        <Card title="August 2026" subtitle="Mint dot = trade · sky dot = note">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--text-muted)", padding: "6px 0", fontWeight: "var(--weight-medium)" }}>{d}</div>
            ))}
            {Array.from({ length: 6 }).map((_, i) => <div key={"pad" + i}></div>)}
            {Array.from({ length: 31 }).map((_, i) => {
              const d = i + 1;
              const info = DAY_DATA[d];
              const today = d === 3;
              const selected = d === day;
              const future = d > 3;
              return (
                <button key={d} onClick={() => setDay(d)} style={{
                  aspectRatio: "1", border: "1px solid " + (selected ? "var(--accent-soft-border)" : "transparent"),
                  borderRadius: "var(--radius-md)", cursor: "pointer",
                  background: selected ? "var(--accent-soft)" : "transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)",
                  color: future ? "var(--text-disabled)" : today ? "var(--accent)" : "var(--text-primary)",
                  fontWeight: today ? "var(--weight-bold)" : "var(--weight-regular)",
                }}>
                  {d}
                  <span style={{ display: "flex", gap: 3, height: 5 }}>
                    {(info ? info.dots : []).map((c, j) => <span key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: c }}></span>)}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
        <Card title={"August " + day} subtitle={entries.length ? entries.length + " entries" : "No entries"}
          action={<Button size="sm">New entry</Button>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.length === 0 ? (
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", padding: "24px 0", textAlign: "center" }}>
                Nothing logged this day. Quiet days count too.
              </div>
            ) : entries.map((e, i) => (
              e.kind === "trade" ? (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-md)" }}>
                  <Badge tone={e.side === "Buy" ? "info" : "warning"} size="sm">{e.side}</Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{e.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{e.qty}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {e.pnl !== null ? <PriceChange value={e.pnl} size="sm" /> : null}
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{e.time}</div>
                  </div>
                </div>
              ) : (
                <div key={i} style={{ padding: "12px 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{e.title}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{e.time}</span>
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 4, lineHeight: "var(--leading-normal)" }}>{e.body}</div>
                </div>
              )
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
