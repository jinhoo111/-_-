/* Minted DS loader. Prefers the compiled _ds_bundle.js; if absent, fetches the
   component JSX sources, strips imports/exports, transpiles with Babel, and
   returns a namespace object. Usage: loadMintedNS("../../").then(NS => …) */
window.loadMintedNS = async function (root) {
  function scan() {
    for (const g of ["Minted", "MintedDS", "DS", "DesignSystem"]) {
      if (window[g] && window[g].Button && window[g].Card) return window[g];
    }
    for (const k in window) {
      try {
        const v = window[k];
        if (v && typeof v === "object" && v.Button && v.Card && v.PriceChange) return v;
      } catch (e) {}
    }
    return null;
  }
  try {
    const r = await fetch(root + "_ds_bundle.js");
    if (r.ok) {
      new Function(await r.text())();
      const ns = scan();
      if (ns) return ns;
    }
  } catch (e) {}
  const files = [
    "components/core/Switch.jsx", "components/core/Button.jsx", "components/core/IconButton.jsx",
    "components/core/Input.jsx", "components/core/Select.jsx", "components/core/Tabs.jsx",
    "components/display/Card.jsx", "components/display/Badge.jsx", "components/display/Toast.jsx",
    "components/display/EmptyState.jsx", "components/display/Skeleton.jsx",
    "components/data/PriceChange.jsx", "components/data/Sparkline.jsx",
    "components/data/StatCard.jsx", "components/data/TickerRow.jsx",
    "ui_kits/minted/AppShell.jsx", "ui_kits/minted/LoginScreen.jsx",
    "ui_kits/minted/PortfolioScreen.jsx", "ui_kits/minted/IndicesScreen.jsx",
    "ui_kits/minted/NewsScreen.jsx", "ui_kits/minted/JournalScreen.jsx",
    "ui_kits/minted/FlowScreen.jsx", "ui_kits/minted/MonitorScreen.jsx",
  ];
  const names = [];
  let src = "";
  for (const f of files) {
    let t = await (await fetch(root + f)).text();
    t = t.replace(/^import[^\n]*$/gm, "");
    t = t.replace(/export function (\w+)/g, function (m, n) { names.push(n); return "function " + n; });
    src += t + "\n";
  }
  src = "window.__mintedBuild = function (React) {\n" + src + "\nreturn {" + names.join(",") + "};\n};";
  const code = Babel.transform(src, { presets: ["react"] }).code;
  new Function(code)();
  const ns = window.__mintedBuild(React);
  window.Minted = ns;
  return ns;
};
