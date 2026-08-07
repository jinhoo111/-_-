import React from "react";
import { Card } from "../../components/display/Card.jsx";
import { Button } from "../../components/core/Button.jsx";
import { Input } from "../../components/core/Input.jsx";

export function LoginScreen({ onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--font-body)" }}>
      <div style={{ width: 400, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
            minted<span style={{ color: "var(--accent)" }}>.</span>
          </span>
          <div style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", marginTop: 10 }}>Good to see you again.</div>
        </div>
        <Card padding="var(--space-8)">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Email" type="email" placeholder="you@example.com" />
            <Input label="Password" type="password" placeholder="••••••••" hint="8+ characters" />
            <Button full onClick={onLogin} style={{ marginTop: 4 }}>Sign in</Button>
            <Button full variant="ghost" size="sm">Forgot your password?</Button>
          </div>
        </Card>
        <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          New here? <span style={{ color: "var(--accent)", fontWeight: "var(--weight-semibold)", cursor: "pointer" }}>Create an account</span> — it takes two minutes.
        </div>
      </div>
    </div>
  );
}
