import { useAccountStore } from "../stores/account";
import { useBudgetTargetStore } from "../stores/budgetTarget";
import { useCategoryRuleStore } from "../stores/categoryRule";
import { useHouseholdStore } from "../stores/household";
import { useImportStore } from "../stores/import";
import { useImportErrorStore } from "../stores/importError";
import { useNetWorthStore } from "../stores/netWorth";
import { useSimplefinStore } from "../stores/simplefin";
import { useTransactionStore } from "../stores/transaction";
import { useUserStore } from "../stores/user";

// Wipes every store holding household-scoped data. Call on any change of
// who is logged in, logging out, and logging *in* too.
//
// Logging in matters because the landing page previews the dashboard as the
// read-only demo account (authStore.startPreview) through these same stores.
// Without a reset, signing in from the landing page carries the demo
// household's data straight into the new user's dashboard, and it only
// looks right after a refresh, at which point the router sends the
// authenticated user to /dashboard and the landing page never mounts.
//
// Keep this list complete: every store here except auth holds data scoped
// to one household, and a missed one is a data-leak-shaped bug between two
// accounts on the same browser.
export function resetHouseholdStores() {
  useAccountStore().$reset();
  useBudgetTargetStore().$reset();
  useCategoryRuleStore().$reset();
  useHouseholdStore().$reset();
  useImportStore().$reset();
  useImportErrorStore().$reset();
  useNetWorthStore().$reset();
  useSimplefinStore().$reset();
  useTransactionStore().$reset();
  useUserStore().$reset();
}
