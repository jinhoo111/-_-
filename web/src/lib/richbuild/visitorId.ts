"use client";

const VISITOR_ID_KEY = "richbuild_visitor_id";

// Shared by useVisitTracking (first/last visit) and event logging (e.g.
// signup_completed) so both attribute to the same visitor without duplicating the
// localStorage fallback-id logic.
export function getVisitorId(userId: string | null): string {
  if (userId) return userId;
  let id = window.localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}
