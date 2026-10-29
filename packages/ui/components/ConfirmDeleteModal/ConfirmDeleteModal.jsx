'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '../Button'
import { Modal } from '../Modal'

/**
 * Shared destructive confirmation dialog used by CRM / PM / Accounts list tables.
 */
export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete',
  description = 'Are you sure you want to delete this item?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  loadingLabel = 'Deleting…',
  warningText = 'This action cannot be undone',
  size = 'md',
  children,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (loading) return
        onClose?.()
      }}
      title={title}
      size={size}
      closeOnBackdrop={!loading}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
          <p className="text-sm text-red-900">
            <span className="font-semibold">{warningText}</span>
          </p>
        </div>
        {description ? <p className="text-sm text-gray-700">{description}</p> : null}
        {children}
        <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="muted"
            disabled={loading}
            onClick={onClose}
            className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={loading}
            onClick={onConfirm}
            className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDeleteModal
