/**
 * CSV bulk import for Lead Companies and Contacts.
 * The column lists below are the standard CSV format: the downloadable template is generated from them,
 * headers are matched case-insensitively (a trailing * or extra spaces are ignored), and each row is
 * validated with the same rules as the "Add lead" / "Add contact" forms before anything is saved.
 */

import leadCompanyService from './api/leadCompanyService';
import contactService from './api/contactService';
import strapiClient from './strapiClient';

export const MAX_IMPORT_ROWS = 1000;
const CONCURRENCY = 3;

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED', 'CLIENT'];
const SOURCES = ['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'COLD_CALL', 'TRADE_SHOW', 'PARTNER', 'OTHER'];
const CONTACT_STATUSES = ['ACTIVE', 'INACTIVE', 'LEAD'];
const CONTACT_METHODS = ['EMAIL', 'PHONE', 'LINKEDIN', 'WHATSAPP'];

/**
 * @typedef {{ header: string, field: string, required?: boolean, type?: 'text'|'email'|'number'|'date'|'enum'|'user'|'leadCompany',
 *   options?: string[], defaultValue?: string, example?: string, group?: 'contact' }} ImportColumn
 */

/** @type {ImportColumn[]} */
const LEAD_COLUMNS = [
  { header: 'Company Name', field: 'companyName', required: true, example: 'Acme Logistics Pvt Ltd' },
  { header: 'Industry', field: 'industry', required: true, example: 'Logistics' },
  { header: 'Status', field: 'status', type: 'enum', options: LEAD_STATUSES, defaultValue: 'NEW', example: 'NEW' },
  { header: 'Source', field: 'source', type: 'enum', options: SOURCES, defaultValue: 'OTHER', example: 'REFERRAL' },
  { header: 'Website', field: 'website', example: 'https://acme.example' },
  { header: 'Company Email', field: 'email', type: 'email', example: 'info@acme.example' },
  { header: 'Company Phone', field: 'phone', example: '+91 98765 43210' },
  { header: 'Address', field: 'address', example: '12 MG Road' },
  { header: 'City', field: 'city', example: 'Pune' },
  { header: 'State', field: 'state', example: 'Maharashtra' },
  { header: 'Country', field: 'country', example: 'India' },
  { header: 'Zip Code', field: 'zipCode', example: '411001' },
  { header: 'Employees', field: 'employees', example: '50-100' },
  { header: 'Founded', field: 'founded', example: '2015' },
  { header: 'Deal Value', field: 'dealValue', type: 'number', example: '250000' },
  { header: 'Next Connect Date', field: 'nextConnectDate', type: 'date', example: '2026-12-01' },
  { header: 'LinkedIn', field: 'linkedIn', example: 'https://linkedin.com/company/acme' },
  { header: 'Twitter', field: 'twitter', example: '' },
  { header: 'Description', field: 'description', example: 'Fleet of 40 delivery bikes' },
  { header: 'Notes', field: 'notes', example: 'Met at EV expo' },
  { header: 'Assigned To (email)', field: 'assignedTo', type: 'user', example: '' },
  { header: 'Contact First Name', field: 'firstName', group: 'contact', example: 'Riya' },
  { header: 'Contact Last Name', field: 'lastName', group: 'contact', example: 'Sharma' },
  { header: 'Contact Email', field: 'email', type: 'email', group: 'contact', example: 'riya@acme.example' },
  { header: 'Contact Phone', field: 'phone', group: 'contact', example: '+91 91234 56789' },
  { header: 'Contact Job Title', field: 'jobTitle', group: 'contact', example: 'Operations Head' },
];

/** @type {ImportColumn[]} */
const CONTACT_COLUMNS = [
  { header: 'First Name', field: 'firstName', required: true, example: 'Riya' },
  { header: 'Last Name', field: 'lastName', required: true, example: 'Sharma' },
  { header: 'Email', field: 'email', type: 'email', required: true, example: 'riya@acme.example' },
  { header: 'Phone', field: 'phone', example: '+91 91234 56789' },
  { header: 'Job Title', field: 'jobTitle', example: 'Operations Head' },
  { header: 'Department', field: 'department', example: 'Operations' },
  { header: 'Company Name', field: 'companyName', example: 'Acme Logistics Pvt Ltd' },
  { header: 'Lead Company', field: 'leadCompany', type: 'leadCompany', example: 'Acme Logistics Pvt Ltd' },
  { header: 'Status', field: 'status', type: 'enum', options: CONTACT_STATUSES, defaultValue: 'ACTIVE', example: 'ACTIVE' },
  { header: 'Source', field: 'source', type: 'enum', options: SOURCES, defaultValue: 'OTHER', example: 'REFERRAL' },
  { header: 'Preferred Contact Method', field: 'preferredContactMethod', type: 'enum', options: CONTACT_METHODS, example: 'PHONE' },
  { header: 'LinkedIn', field: 'linkedIn', example: 'https://linkedin.com/in/riya' },
  { header: 'Twitter', field: 'twitter', example: '' },
  { header: 'Address', field: 'address', example: '12 MG Road' },
  { header: 'City', field: 'city', example: 'Pune' },
  { header: 'State', field: 'state', example: 'Maharashtra' },
  { header: 'Country', field: 'country', example: 'India' },
  { header: 'Zip Code', field: 'zipCode', example: '411001' },
  { header: 'Timezone', field: 'timezone', example: 'Asia/Kolkata' },
  { header: 'Birth Date', field: 'birthDate', type: 'date', example: '' },
  { header: 'Notes', field: 'notes', example: '' },
  { header: 'Assigned To (email)', field: 'assignedTo', type: 'user', example: '' },
];

const normalizeHeader = (h) => String(h || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const normalizeKey = (v) => String(v || '').trim().toLowerCase();
const enumKey = (v) => String(v || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

/** Accepts YYYY-MM-DD, DD-MM-YYYY or DD/MM/YYYY; returns YYYY-MM-DD or null. */
function parseDate(raw) {
  const s = String(raw || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let y;
  let mo;
  let d;
  if (m) [, y, mo, d] = m;
  else {
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (!m) return null;
    [, d, mo, y] = m;
  }
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (date.getUTCMonth() !== Number(mo) - 1 || date.getUTCDate() !== Number(d)) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseNumber(raw) {
  const cleaned = String(raw || '').replace(/[₹$,\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || '').trim());

function convertCell(col, raw, context, errors) {
  const value = String(raw ?? '').trim();
  if (!value) {
    if (col.required) errors.push(`${col.header} is required`);
    return col.defaultValue ?? undefined;
  }
  switch (col.type) {
    case 'email':
      if (!isEmail(value)) errors.push(`${col.header} "${value}" is not a valid email`);
      return value;
    case 'number': {
      const n = parseNumber(value);
      if (Number.isNaN(n)) errors.push(`${col.header} "${value}" is not a number`);
      return n ?? undefined;
    }
    case 'date': {
      const d = parseDate(value);
      if (!d) errors.push(`${col.header} "${value}" is not a date (use YYYY-MM-DD)`);
      return d ?? undefined;
    }
    case 'enum': {
      const key = enumKey(value);
      if (!col.options.includes(key)) errors.push(`${col.header} "${value}" must be one of ${col.options.join(', ')}`);
      return key;
    }
    case 'user': {
      const user = context.usersByEmail.get(normalizeKey(value));
      if (!user) errors.push(`${col.header} "${value}" is not a member of this organization`);
      return user?.id;
    }
    case 'leadCompany': {
      const lead = context.leadsByName.get(normalizeKey(value));
      if (!lead) errors.push(`Lead Company "${value}" was not found (create the lead first or leave it empty)`);
      return lead?.id;
    }
    default:
      return value;
  }
}

function prune(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

const ENTITY_CONFIG = {
  leads: {
    label: 'leads',
    templateName: 'bikewo-leads-import-template.csv',
    columns: LEAD_COLUMNS,
    /** Existing records for duplicate checks + lookups the columns need. */
    async loadContext() {
      const [usersRes, leads] = await Promise.all([
        strapiClient.getBikeWoUsers({ pageSize: 500 }).catch(() => ({ data: [] })),
        leadCompanyService.fetchAll({ 'fields[0]': 'companyName' }),
      ]);
      return {
        usersByEmail: new Map((usersRes?.data || []).filter((u) => u?.email).map((u) => [normalizeKey(u.email), u])),
        existingKeys: new Set(leads.map((l) => normalizeKey(l.companyName)).filter(Boolean)),
        leadsByName: new Map(),
      };
    },
    duplicateKey: (payload) => normalizeKey(payload.companyName),
    duplicateLabel: 'a lead with this company name already exists',
    buildPayloads(values, errors) {
      const lead = prune({ ...values.main, segment: 'WARM' });
      const contactValues = prune(values.contact);
      let contact = null;
      if (Object.keys(contactValues).length) {
        if (!contactValues.firstName || !contactValues.lastName) {
          errors.push('Contact First Name and Contact Last Name are required when any contact column is filled');
        }
        contact = prune({
          ...contactValues,
          companyName: lead.companyName,
          status: 'ACTIVE',
          source: 'LEAD_COMPANY',
          isPrimaryContact: true,
          contactRole: 'PRIMARY_CONTACT',
          assignedTo: lead.assignedTo,
        });
      }
      return { payload: lead, contact };
    },
    async save({ payload, contact }) {
      const created = await leadCompanyService.create(payload);
      const leadId = created?.id ?? created?.data?.id;
      let warning = null;
      if (contact && leadId) {
        try {
          await contactService.create({ ...contact, leadCompany: leadId });
        } catch (err) {
          warning = `Lead created, but its contact failed: ${err?.message || 'unknown error'}`;
        }
      }
      return { warning };
    },
  },
  contacts: {
    label: 'contacts',
    templateName: 'bikewo-contacts-import-template.csv',
    columns: CONTACT_COLUMNS,
    async loadContext() {
      const [usersRes, contacts, leads] = await Promise.all([
        strapiClient.getBikeWoUsers({ pageSize: 500 }).catch(() => ({ data: [] })),
        contactService.fetchAll(),
        leadCompanyService.fetchAll({ 'fields[0]': 'companyName' }),
      ]);
      return {
        usersByEmail: new Map((usersRes?.data || []).filter((u) => u?.email).map((u) => [normalizeKey(u.email), u])),
        existingKeys: new Set(contacts.map((c) => normalizeKey(c.email)).filter(Boolean)),
        leadsByName: new Map(leads.filter((l) => l?.companyName).map((l) => [normalizeKey(l.companyName), l])),
      };
    },
    duplicateKey: (payload) => normalizeKey(payload.email),
    duplicateLabel: 'a contact with this email already exists',
    buildPayloads(values) {
      const contact = prune(values.main);
      if (contact.leadCompany) contact.source = 'LEAD_COMPANY';
      return { payload: contact, contact: null };
    },
    async save({ payload }) {
      await contactService.create(payload);
      return { warning: null };
    },
  },
};

export function getImportConfig(entity) {
  return ENTITY_CONFIG[entity];
}

/** Template = header row (* marks required) + one example row. */
export function buildTemplateRows(entity) {
  const { columns } = ENTITY_CONFIG[entity];
  return [columns.map((c) => (c.required ? `${c.header}*` : c.header)), columns.map((c) => c.example ?? '')];
}

/**
 * Validate parsed CSV rows. Returns one item per data row:
 * { rowNumber, label, status: 'ready' | 'error' | 'duplicate', errors: string[], payload, contact }
 */
export function prepareRows(entity, csvRows, context) {
  const config = ENTITY_CONFIG[entity];
  const [headerRow = [], ...dataRows] = csvRows;
  const index = new Map(headerRow.map((h, i) => [normalizeHeader(h), i]));
  const missingHeaders = config.columns
    .filter((c) => c.required && !index.has(normalizeHeader(c.header)))
    .map((c) => c.header);
  if (missingHeaders.length) {
    return { headerError: `Missing required column(s): ${missingHeaders.join(', ')}. Download the template to see the format.`, items: [] };
  }
  if (!dataRows.length) return { headerError: 'The file has no data rows.', items: [] };
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return { headerError: `Too many rows (${dataRows.length}). Import at most ${MAX_IMPORT_ROWS} at a time.`, items: [] };
  }

  const seen = new Set(context.existingKeys);
  const items = dataRows.map((cells, i) => {
    const errors = [];
    const values = { main: {}, contact: {} };
    config.columns.forEach((col) => {
      const at = index.get(normalizeHeader(col.header));
      const raw = at === undefined ? '' : cells[at];
      const converted = convertCell(col, raw, context, errors);
      values[col.group === 'contact' ? 'contact' : 'main'][col.field] = converted;
    });
    const { payload, contact } = config.buildPayloads(values, errors);
    const key = config.duplicateKey(payload);
    let status = errors.length ? 'error' : 'ready';
    if (status === 'ready' && key) {
      if (seen.has(key)) {
        status = 'duplicate';
        errors.push(context.existingKeys.has(key) ? config.duplicateLabel : 'appears earlier in this file');
      } else {
        seen.add(key);
      }
    }
    const label =
      entity === 'leads'
        ? payload.companyName || '(no company name)'
        : [payload.firstName, payload.lastName].filter(Boolean).join(' ') || '(no name)';
    return { rowNumber: i + 2, label, status, errors, payload, contact };
  });
  return { headerError: null, items };
}

/** Save ready rows a few at a time. onProgress(done, total). Returns per-row results. */
export async function runImport(entity, items, onProgress) {
  const config = ENTITY_CONFIG[entity];
  const queue = items.filter((it) => it.status === 'ready');
  const total = queue.length;
  const results = [];
  let done = 0;
  const worker = async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        const { warning } = await config.save(item);
        results.push({ ...item, outcome: warning ? 'warning' : 'created', message: warning });
      } catch (err) {
        results.push({ ...item, outcome: 'failed', message: err?.message || 'Could not save' });
      }
      done += 1;
      onProgress?.(done, total);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  return results.sort((a, b) => a.rowNumber - b.rowNumber);
}
