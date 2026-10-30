# Lead Company Short / Detailed Form

## Summary

The CRM **Add New Lead Company** page (`/sales/lead-companies/new`) now has a **Short** / **Detailed** toggle so sales users can quick-add a lead with essentials, or fill the full form when they have more data.

## Scope

- App: `apps/crm`
- Page: `apps/crm/app/sales/lead-companies/new/page.js`
- Edit flow unchanged (`[id]/edit`)

## Details

### Toggle

- Segmented control under the page header: **Short** (default) | **Detailed** (active state uses BikeWo indigo `brand-indigo`)
- Switching modes clears validation errors; field values are kept so users can expand without retyping

### Short form

**Company**

- Required: Company Name, Industry
- Optional: Company Type, Phone, Company Email, Lead Source, Assigned To

**Contact**

- Single optional contact (First Name, Last Name, Email, Phone)
- Contact names are required only if any contact field is filled
- No multi-contact, job title, department, LinkedIn, or role

**Hidden (defaults apply)**

- Address / location, website, size, founded, deal value, socials, description, notes
- Lead Status section (status defaults to `NEW`; source defaults to `WEBSITE` unless changed in Short)

### Detailed form

Same as the previous full create experience: all company fields, multiple contacts with roles, and Lead Status (status, source, next connect date).

## Usage

1. Open **Sales → Lead Companies → Add New**
2. Use **Short** for a quick create, or **Detailed** for the full form
3. Submit as before — API payload still only sends non-empty optional fields
