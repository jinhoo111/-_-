import React from "react";
import { Switch } from "../../components/core/Switch.jsx";
import { Button } from "../../components/core/Button.jsx";
import { IconButton } from "../../components/core/IconButton.jsx";
import { Input } from "../../components/core/Input.jsx";
import { Select } from "../../components/core/Select.jsx";

const NAV = ["Portfolio", "Indices", "News", "Journal", "Flow", "Monitor"];

export function AppShell({ active, onNav, onLogout, theme, onTheme, convention, onConvention, name, onName, children }) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)", fontFamily: "var(--font-body)" }}>
      <header style={{ borderBottom: "1px solid var(--border-default)", background: "var(--surface-0)", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", flexShrink: 0 }}>
            minted<span style={{ color: "var(--accent)" }}>.</span>
          </span>
          <nav style={{ display: "flex", gap: 4, flex: 1 }}>
            {NAV.map((item) => (
              <NavItem key={item} label={item} active={item === active} onClick={() => onNav && onNav(item)} />
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, position: "relative" }}>
            <IconButton label="Settings" active={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </IconButton>
            <Button variant="ghost" size="sm" onClick={onLogout}>Log out</Button>
            {settingsOpen ? (
              <SettingsPanel
                theme={theme} onTheme={onTheme}
                convention={convention} onConvention={onConvention}
                name={name} onName={onName}
                onClose={() => setSettingsOpen(false)}
              />
            ) : null}
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 64px" }}>{children}</main>
    </div>
  );
}

function SettingsPanel({ theme, onTheme, convention, onConvention, name, onName, onClose }) {
  const [lang, setLang] = React.useState("English");
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 19 }}></div>
      <div style={{
        position: "absolute", top: 52, right: 0, zIndex: 20, width: 320,
        background: "var(--surface-1)", border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-raised)",
        padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: 20,
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>Settings</div>
        <Input label="Display name" value={name} onChange={(e) => onName && onName(e.target.value)} />
        <Select label="Language" options={["English", "한국어"]} value={lang} onChange={(e) => setLang(e.target.value)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>Light theme</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>Dark is the default</div>
            </div>
            <Switch checked={theme === "light"} onChange={(v) => onTheme && onTheme(v ? "light" : "dark")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>KR price colors</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>Up red · down blue</div>
            </div>
            <Switch checked={convention === "kr"} onChange={(v) => onConvention && onConvention(v ? "kr" : "western")} />
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>Done</Button>
      </div>
    </React.Fragment>
  );
}

function NavItem({ label, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 40, padding: "0 16px", border: "none", cursor: "pointer",
        borderRadius: "var(--radius-pill)",
        background: active ? "var(--accent-soft)" : hover ? "var(--surface-2)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        fontFamily: "var(--font-body)", fontSize: "var(--text-base)",
        fontWeight: active ? "var(--weight-semibold)" : "var(--weight-medium)",
        transition: "background var(--duration-fast) var(--ease-out)",
      }}
    >
      {label}
    </button>
  );
}
