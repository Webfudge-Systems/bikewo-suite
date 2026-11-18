/**
 * CSV export helpers for CRM list pages (Lead Companies, Contacts, Client Accounts).
 */

import { downloadCsv } from './csv';

const EXPORT_PAGE_SIZE = 100; // Strapi REST maxLimit
const MAX_EXPORT_PAGES = 100; // safety cap: 10,000 rows

/**
 * Load every page of a server-paginated list.
 * @param {(page: number, pageSize: number) => Promise<{ data?: unknown[], meta?: any }>} fetchPage
 */
export async function fetchAllPages(fetchPage) {
  const all = [];
  for (let page = 1; page <= MAX_EXPORT_PAGES; page += 1) {
    const res = await fetchPage(page, EXPORT_PAGE_SIZE);
    const rows = Array.isArray(res?.data) ? res.data : [];
    all.push(...rows);
    const pageCount = res?.meta?.pagination?.pageCount ?? 1;
    if (!rows.length || page >= pageCount) break;
  }
  return all;
}

/** "client-accounts" -> "client-accounts-2026-11-17.csv" */
export function exportFilename(name) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${name}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
}

/**
 * @param {string} name file name prefix
 * @param {Array<{ header: string, value: (record: any) => unknown }>} columns
 * @param {any[]} records
 */
export function downloadRecordsCsv(name, columns, records) {
  downloadCsv(exportFilename(name), [
    columns.map((c) => c.header),
    ...records.map((r) => columns.map((c) => c.value(r) ?? '')),
  ]);
}

export function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}
