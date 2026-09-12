import type { Household } from "../types";

// Free-trial length shown in the UI. This is copy only, the trial actually
// granted is set server-side by STRIPE_TRIAL_DAYS in routes/billing.py, so
// change both together or the marketing will lie.
export const TRIAL_DAYS = 30;

// The backend grants a trial only to households with no billing history at
// all (see is_first_subscription in routes/billing.py), a household that
// subscribed once and cancelled doesn't get a second free month. Advertise
// it on the same terms, so nobody is promised a trial checkout won't apply.
//
// The backend also checks stripe_subscription_id, which isn't exposed to the
// client; subscription_status is the half we can see, and the webhook always
// writes both together, so in practice they agree.
export const isTrialEligible = (household?: Household | null): boolean =>
  !!household && !household.subscription_status;
