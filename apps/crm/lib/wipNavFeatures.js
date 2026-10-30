/**
 * WIP builders still under construction.
 *
 * - `master`: keep `false` so Automation / Proposals / Invoices stay out of the sidebar
 *   (and quick actions). Routes and pages remain in the repo.
 * - `feature/wip-builders`: set to `true` while finishing those products, then merge
 *   back to master when ready (flip this flag or drop the gate).
 *
 * Direct URLs (/automations, /clients/proposals, /clients/invoices) still work.
 */
export const SHOW_WIP_BUILDER_NAV = false

/** Sidebar / FAB ids gated by {@link SHOW_WIP_BUILDER_NAV}. */
export const WIP_BUILDER_NAV_IDS = new Set(['automations', 'proposals', 'invoices'])
