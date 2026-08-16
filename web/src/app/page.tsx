import { redirect } from "next/navigation";

// RichBuild is the standalone v1 product now (see MIGRATION_PLAN.md / project map
// §13) — root sends everyone there regardless of auth state, since RichBuild's own
// Home screen already handles the guest/member split (spec §3). The old dashboard
// stays reachable directly at /portfolio, /login, etc. for anyone with those links.
export default function Home() {
  redirect("/richbuild");
}
