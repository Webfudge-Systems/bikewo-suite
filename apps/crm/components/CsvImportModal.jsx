'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileUp, Loader2 } from 'lucide-react';
import { Badge, Button, Modal } from '@webfudge/ui';
import { parseCsv, downloadCsv } from '../lib/csv';
import { buildTemplateRows, getImportConfig, MAX_IMPORT_ROWS, prepareRows, runImport } from '../lib/bulkImport';

const STATUS_BADGE = {
  ready: { variant: 'success', label: 'Ready' },
  error: { variant: 'danger', label: 'Error' },
  duplicate: { variant: 'warning', label: 'Skipped' },
};

/**
 * Bulk import Leads or Contacts from a CSV that follows the standard template.
 * Steps: choose file → preview (validation + duplicates) → import (progress) → summary.
 *
 * @param {{ entity: 'leads' | 'contacts', isOpen: boolean, onClose: () => void, onImported?: () => void }} props
 */
const plural = (n, label) => `${n} ${n === 1 ? label.slice(0, -1) : label}`;

export default function CsvImportModal({ entity, isOpen, onClose, onImported }) {
  const config = getImportConfig(entity);
  const fileInput = useRef(null);
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState([]);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setError('');
    setItems([]);
    setResults([]);
    setProgress({ done: 0, total: 0 });
    if (fileInput.current) fileInput.current.value = '';
  };

  const close = () => {
    if (step === 'importing') return;
    reset();
    onClose();
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    if (!/\.csv$/i.test(file.name)) {
      setError('Please choose a .csv file (in Excel: File → Save As → CSV UTF-8).');
      return;
    }
    setBusy(true);
    setFileName(file.name);
    try {
      const rows = parseCsv(await file.text());
      const context = await config.loadContext();
      const { headerError, items: prepared } = prepareRows(entity, rows, context);
      if (headerError) {
        setError(headerError);
        return;
      }
      setItems(prepared);
      setStep('preview');
    } catch (err) {
      setError(err?.message || 'Could not read the file.');
    } finally {
      setBusy(false);
    }
  };

  const startImport = async () => {
    const ready = items.filter((it) => it.status === 'ready').length;
    setProgress({ done: 0, total: ready });
    setStep('importing');
    const out = await runImport(entity, items, (done, total) => setProgress({ done, total }));
    setResults(out);
    setStep('done');
    if (out.some((r) => r.outcome !== 'failed')) onImported?.();
  };

  const downloadReport = () => {
    const skipped = items.filter((it) => it.status !== 'ready');
    const failed = results.filter((r) => r.outcome !== 'created');
    const rows = [
      ['Row', 'Record', 'Result', 'Details'],
      ...[...skipped, ...failed]
        .sort((a, b) => a.rowNumber - b.rowNumber)
        .map((it) => [
          it.rowNumber,
          it.label,
          it.outcome || (it.status === 'duplicate' ? 'skipped (duplicate)' : 'skipped (error)'),
          it.message || it.errors.join('; '),
        ]),
    ];
    downloadCsv(`${entity}-import-report.csv`, rows);
  };

  const counts = {
    ready: items.filter((it) => it.status === 'ready').length,
    error: items.filter((it) => it.status === 'error').length,
    duplicate: items.filter((it) => it.status === 'duplicate').length,
  };
  const created = results.filter((r) => r.outcome === 'created' || r.outcome === 'warning').length;
  const failed = results.filter((r) => r.outcome === 'failed').length;
  const warnings = results.filter((r) => r.outcome === 'warning').length;
  const previewRows = [...items].sort((a, b) => (a.status === 'ready') - (b.status === 'ready')).slice(0, 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`Import ${config.label} from CSV`}
      subtitle="Bulk-add records using the standard BikeWo CSV format"
      size="xl"
      closeOnBackdrop={step !== 'importing'}
      showCloseButton={step !== 'importing'}
    >
      <div className="space-y-5">
        {step === 'upload' && (
          <>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-medium text-gray-900">1. Download the template and fill one row per {config.label.slice(0, -1)}.</p>
              <p className="mt-1">
                Columns marked * are required. Keep the header row as it is; extra columns are ignored. Dates use
                YYYY-MM-DD. Up to {MAX_IMPORT_ROWS} rows per file.
              </p>
              <p className="mt-1">
                Existing records are skipped, never overwritten (matched by{' '}
                {entity === 'leads' ? 'company name' : 'email'}).
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => downloadCsv(config.templateName, buildTemplateRows(entity))}
              >
                <Download className="mr-2 h-4 w-4" /> Download CSV template
              </Button>
            </div>

            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-brand-primary hover:bg-brand-primary/5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files?.[0]);
              }}
            >
              {busy ? <Loader2 className="h-8 w-8 animate-spin text-gray-400" /> : <FileUp className="h-8 w-8 text-gray-400" />}
              <span className="text-sm font-medium text-gray-800">
                {busy ? `Checking ${fileName}…` : '2. Drop your CSV here or click to choose a file'}
              </span>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
                disabled={busy}
              />
            </label>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
              </div>
            ) : null}
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-gray-900">{fileName}</span>
              <Badge variant="success">{counts.ready} ready</Badge>
              {counts.error ? <Badge variant="danger">{counts.error} with errors</Badge> : null}
              {counts.duplicate ? <Badge variant="warning">{counts.duplicate} duplicates skipped</Badge> : null}
            </div>
            <p className="text-sm text-gray-600">
              Only rows marked Ready will be imported. Fix the others in your file and import them again later.
            </p>
            <div className="max-h-80 overflow-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">{entity === 'leads' ? 'Company' : 'Name'}</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((it) => (
                    <tr key={it.rowNumber}>
                      <td className="px-3 py-2 text-gray-500">{it.rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{it.label}</td>
                      <td className="px-3 py-2">
                        <Badge variant={STATUS_BADGE[it.status].variant} size="sm">
                          {STATUS_BADGE[it.status].label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{it.errors.join('; ') || (it.contact ? 'With primary contact' : '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length > previewRows.length ? (
              <p className="text-xs text-gray-500">Showing {previewRows.length} of {items.length} rows (problems first).</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="muted" onClick={reset}>
                Choose another file
              </Button>
              <Button variant="primary" onClick={startImport} disabled={!counts.ready}>
                Import {plural(counts.ready, config.label)}
              </Button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div className="space-y-3 py-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-primary" />
            <p className="text-sm font-medium text-gray-900">
              Importing {progress.done} of {progress.total}… please keep this window open.
            </p>
            <div className="mx-auto h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-brand-primary transition-all"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {step === 'done' && (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  Imported {plural(created, config.label)}.
                </p>
                <p className="mt-1">
                  {failed ? `${failed} failed to save. ` : ''}
                  {warnings ? `${warnings} saved with a warning. ` : ''}
                  {counts.error + counts.duplicate ? `${counts.error + counts.duplicate} were skipped in the preview.` : ''}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {failed + warnings + counts.error + counts.duplicate ? (
                <Button variant="outline" onClick={downloadReport}>
                  <Download className="mr-2 h-4 w-4" /> Download report
                </Button>
              ) : null}
              <Button variant="primary" onClick={close}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
