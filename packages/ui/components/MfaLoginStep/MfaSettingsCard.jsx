'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { authService, flattenUser, useAuth } from '@webfudge/auth'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import { InfoSection } from '../EntityDetailLayout'
import { MfaCodeInput, MfaError, MfaRecoveryCodes, MfaSetupQr, SubmitButton } from './MfaParts'

/** Profile card: turn the signed-in user's authenticator-app 2FA on or off. */
export function MfaSettingsCard() {
  const { user, setUser } = useAuth()
  const flat = flattenUser(user) || {}
  const enabled = !!flat.mfaEnabled
  const requiredByOrg = !!flat.mfaRequiredByOrg

  const [step, setStep] = useState('idle') // idle | setup | codes | disable
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [codes, setCodes] = useState([])

  const reset = () => {
    setStep('idle')
    setCode('')
    setError('')
  }

  const markEnabled = (value) => {
    setUser((prev) => ({ ...(prev || {}), mfaEnabled: value }))
    authService.getCurrentUser().then((fresh) => fresh && setUser(fresh)).catch(() => {})
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (step === 'setup') {
        const data = await authService.enableMfa(code)
        setCodes(data.recoveryCodes || [])
        setStep('codes')
        setCode('')
        markEnabled(true)
      } else {
        await authService.disableMfa(code)
        markEnabled(false)
        reset()
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border border-gray-200 p-6">
      <InfoSection title="Two-factor authentication" icon={KeyRound} isFirst>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-gray-600">
              Ask for a 6-digit code from an authenticator app each time you sign in to CRM, PM or Accounts.
            </p>
            <Badge variant={enabled ? 'success' : 'default'} size="sm">
              {enabled ? 'On' : 'Off'}
            </Badge>
          </div>

          {step === 'idle' && !enabled && (
            <Button variant="primary" onClick={() => setStep('setup')}>
              Turn on two-factor authentication
            </Button>
          )}

          {step === 'idle' && enabled && (
            requiredByOrg ? (
              <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                Your organization requires two-factor authentication, so it can&apos;t be turned off.
                If you lose your phone, sign in with a recovery code or ask an admin to reset it.
              </p>
            ) : (
              <Button variant="outline" onClick={() => setStep('disable')}>
                Turn off
              </Button>
            )
          )}

          {step === 'codes' && (
            <MfaRecoveryCodes
              codes={codes}
              continueLabel="Done"
              onContinue={reset}
            />
          )}

          {(step === 'setup' || step === 'disable') && (
            <div className="max-w-sm space-y-4">
              <MfaError message={error} />
              {step === 'setup' && <MfaSetupQr onError={setError} />}
              {step === 'disable' && (
                <p className="text-sm text-gray-600">
                  Enter a code from your authenticator app to turn it off.
                </p>
              )}
              <form onSubmit={submit} className="space-y-3">
                <MfaCodeInput id="mfa-settings-code" value={code} onChange={setCode} />
                <SubmitButton busy={busy} disabled={code.length !== 6}>
                  {step === 'setup' ? 'Confirm and turn on' : 'Turn off two-factor authentication'}
                </SubmitButton>
              </form>
              <button type="button" onClick={reset} className="text-sm text-gray-500 hover:text-brand-dark">
                Cancel
              </button>
            </div>
          )}
        </div>
      </InfoSection>
    </Card>
  )
}

export default MfaSettingsCard
