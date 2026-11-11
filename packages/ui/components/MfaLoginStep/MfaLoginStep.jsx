'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@webfudge/auth'
import { MfaCodeInput, MfaError, MfaRecoveryCodes, MfaSetupQr, SubmitButton } from './MfaParts'

/**
 * Second sign-in step, shown by each app's login page after a correct password.
 *
 * @param {{
 *   mfaToken: string,
 *   mode: 'verify' | 'setup',   // 'setup' when the organization requires 2FA and it isn't set up yet
 *   onDone: () => void,         // signed in
 *   onCancel: () => void,       // back to email/password
 * }} props
 */
export function MfaLoginStep({ mfaToken, mode, onDone, onCancel }) {
  const { verifyMfa, enableMfaDuringLogin } = useAuth()
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [recovery, setRecovery] = useState(null) // { recoveryCodes, complete }

  const expired = /expired/i.test(error)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'setup') {
        setRecovery(await enableMfaDuringLogin(mfaToken, code))
      } else {
        await verifyMfa(mfaToken, code)
        onDone()
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  if (recovery) {
    return (
      <MfaRecoveryCodes
        codes={recovery.recoveryCodes}
        continueLabel="Continue to dashboard"
        onContinue={() => {
          recovery.complete()
          onDone()
        }}
      />
    )
  }

  const codeReady = useRecovery ? code.replace(/-/g, '').length === 8 : code.length === 6

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-indigo/10">
          <ShieldCheck className="h-5 w-5 text-brand-indigo" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            {mode === 'setup' ? 'Set up two-factor authentication' : 'Two-factor authentication'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {mode === 'setup'
              ? 'Your organization requires an authenticator app to sign in. This takes about a minute.'
              : useRecovery
                ? 'Enter one of your recovery codes.'
                : 'Enter the 6-digit code from your authenticator app.'}
          </p>
        </div>
      </div>

      <MfaError message={error} />

      {mode === 'setup' && !expired && <MfaSetupQr mfaToken={mfaToken} onError={setError} />}

      {!expired && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <MfaCodeInput value={code} onChange={setCode} recovery={useRecovery} />
          <SubmitButton busy={busy} disabled={!codeReady}>
            {mode === 'setup' ? 'Turn on and sign in' : 'Verify and sign in'}
          </SubmitButton>
        </form>
      )}

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-brand-dark">
          ← Back to sign in
        </button>
        {mode === 'verify' && !expired && (
          <button
            type="button"
            onClick={() => {
              setUseRecovery((v) => !v)
              setCode('')
              setError('')
            }}
            className="font-medium text-brand-indigo hover:underline"
          >
            {useRecovery ? 'Use authenticator code' : 'Use a recovery code'}
          </button>
        )}
      </div>
    </div>
  )
}

export default MfaLoginStep
