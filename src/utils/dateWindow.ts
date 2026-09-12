// src/utils/dateWindow.ts
import type { Transaction } from "../types";

// Index of the first transaction whose date is < cutoff, in an array sorted
// descending by date (i.e. the first index belonging to a date range that
// ends before `cutoff`). Assumes `transactions` is sorted descending.
function lowerBoundDescending(transactions: Transaction[], cutoff: Date): number {
  const cutoffIso = cutoff.toISOString();
  let lo = 0;
  let hi = transactions.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (new Date(transactions[mid].date).toISOString() >= cutoffIso) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

// Slices a descending-sorted transaction array to the half-open date range
// [start, end). `transactions` must already be sorted descending by date , 
// callers are responsible for that invariant (see src/stores/transaction.ts).
export function sliceByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date
): Transaction[] {
  const from = lowerBoundDescending(transactions, end);
  const to = lowerBoundDescending(transactions, start);
  return transactions.slice(from, to);
}
