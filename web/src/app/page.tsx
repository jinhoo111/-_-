import { redirect } from "next/navigation";

// RichBuild is the standalone v1 product now (see MIGRATION_PLAN.md / project map
// §13) — root sends everyone to its Home screen regardless of auth state, since
// RichBuild's own Home already handles the guest/member split (spec §3). The old
// dashboard stays in the codebase as unused routes at /portfolio etc.
export default function Home() {
  redirect("/home");
}
