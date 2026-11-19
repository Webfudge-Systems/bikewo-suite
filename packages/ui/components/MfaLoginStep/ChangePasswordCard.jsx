'use client'

import { useState } from 'react'
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import { flattenUser, useAuth } from '@webfudge/auth'
import { Button } from '../Button'
import { Card } from '../Card'
import { Input } from '../Input'
import { InfoSection } from '../EntityDetailLayout'
import { MfaCodeInput, MfaError, SubmitButton } from './MfaParts'

function PasswordField({ id, label, value, onChange, autoComplete, hint }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-dark">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

/**
 * Profile card: change your own password. Asks for the current password and, when 2FA is on, a
 * code from the authenticator app. Other devices are signed out; this one stays signed in.
 */
export function ChangePasswordCard() {
  const { user, changePassword } = useAuth()
  const flat = flattenUser(user) || {}
  const mfaEnabled = !!flat.mfaEnabled
  const minLength = Number(flat.passwordMinLength) || 8

  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const reset = () => {
    setOpen(false)
    setCurrent('')
    setNext('')
    setConfirm('')
    setCode('')
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (next.length < minLength) return setError(`Your new password must be at least ${minLength} characters.`)
    if (next !== confirm) return setError('The new passwords do not match.')
    if (next === current) return setError('Choose a password different from your current one.')
    setBusy(true)
    try {
      await changePassword({ currentPassword: current, newPassword: next, code: mfaEnabled ? code : undefined })
      reset()
      setDone(true)
    } catch (err) {
      setError(err?.message || 'Could not change your password. Please try again.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const ready = current && next && confirm && (!mfaEnabled || code.length === 6)

  return (
    <Card className="border border-gray-200 p-6">
      <InfoSection title="Password" icon={Lock} isFirst>
        <div className="mt-4 space-y-4">
          {!open && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-xl text-sm text-gray-600">
                Change the password you use to sign in to CRM, PM and Accounts. Other devices will be signed out.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setDone(false)
                  setOpen(true)
                }}
              >
                Change password
              </Button>
            </div>
          )}

          {done && !open && (
            <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Password changed. You&apos;re still signed in here, and every other device has been signed out.
            </div>
          )}

          {open && (
            <form onSubmit={submit} className="max-w-sm space-y-4">
              <MfaError message={error} />
              <PasswordField
                id="current-password"
                label="Current password"
                value={current}
                onChange={setCurrent}
                autoComplete="current-password"
              />
              <PasswordField
                id="new-password"
                label="New password"
                value={next}
                onChange={setNext}
                autoComplete="new-password"
                hint={`At least ${minLength} characters.`}
              />
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
              />
              {mfaEnabled && (
                <div>
                  <label htmlFor="change-password-code" className="mb-1.5 block text-sm font-medium text-brand-dark">
                    Code from your authenticator app
                  </label>
                  <MfaCodeInput id="change-password-code" value={code} onChange={setCode} autoFocus={false} />
                </div>
              )}
              <SubmitButton busy={busy} disabled={!ready} busyLabel="Changing…">
                Change password
              </SubmitButton>
              <button type="button" onClick={reset} className="text-sm text-gray-500 hover:text-brand-dark">
                Cancel
              </button>
            </form>
          )}
        </div>
      </InfoSection>
    </Card>
  )
}

export default ChangePasswordCard
