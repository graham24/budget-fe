import { useTransactionStore } from "../stores/transaction";

// Mirrors auth_utils.DEMO_USER_ID / the seeded demo household on the backend.
export const DEMO_HOUSEHOLD_ID = -1;

// The demo household's transactions are a one-off static seed covering a
// single month, and nothing re-seeds them (scripts/seed_demo_data.sql does
// not exist in the backend repo, see its CLAUDE.md). The dashboard's focus
// month otherwise tracks the real calendar, so once the calendar moved past
// the seeded month every figure on the demo, and on the landing page
// previews that share these stores, read 0.
//
// Pinning the demo to the month the seed actually covers is a stopgap. The
// real fix is a seed script that writes transactions relative to today, at
// which point this whole file goes away.
export const DEMO_FOCUS_MONTH = { year: 2026, month: 8 }; // August 2026

// monthsAgo is an offset from today: the focus month is (monthsAgo + 1)
// months back. Derive the offset from the fixed target on every load so it
// keeps resolving to the same calendar month as time passes, rather than
// drifting the way a hardcoded offset would.
export function monthsAgoForMonth(
  target: { year: number; month: number },
  now: Date = new Date()
): number {
  const monthsBack =
    (now.getFullYear() - target.year) * 12 + (now.getMonth() + 1 - target.month);
  return monthsBack - 1;
}

export function isDemoHousehold(household?: { id: number } | null): boolean {
  return !!household && household.id === DEMO_HOUSEHOLD_ID;
}

// Call after the household loads and before transactions are fetched.
// Returns true if the focus month was pinned.
export function pinDemoFocusMonth(
  household?: { id: number } | null
): boolean {
  if (!isDemoHousehold(household)) return false;
  useTransactionStore().monthsAgo = monthsAgoForMonth(DEMO_FOCUS_MONTH);
  return true;
}
