'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Check, Copy, Loader2 } from 'lucide-react'
import { authService } from '@webfudge/auth'
import { Button } from '../Button'
import { Input } from '../Input'

export function MfaError({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}

/** 6-digit code field (or a recovery code when `recovery` is true). */
export function MfaCodeInput({ value, onChange, recovery = false, autoFocus = true, id = 'mfa-code' }) {
  return (
    <Input
      id={id}
      name="code"
      value={value}
      onChange={(e) => {
        const next = recovery
          ? e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9)
          : e.target.value.replace(/\D/g, '').slice(0, 6)
        onChange(next)
      }}
      inputMode={recovery ? 'text' : 'numeric'}
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      placeholder={recovery ? 'XXXX-XXXX' : '123456'}
      className="w-full text-center font-mono text-lg tracking-[0.3em]"
    />
  )
}

export function SubmitButton({ busy, disabled, children, busyLabel = 'Checking…' }) {
  return (
    <Button type="submit" disabled={busy || disabled} className="w-full" variant="primary">
      {busy ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {busyLabel}
        </span>
      ) : (
        children
      )}
    </Button>
  )
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (_) {
      /* clipboard blocked: the text is still visible to copy by hand */
    }
  }
  return [copied, copy]
}

/**
 * Step 1 of setup: fetch a secret and show the QR code + manual key.
 * `mfaToken` is the pending login token (org requires 2FA); omit it from the profile page.
 */
export function MfaSetupQr({ mfaToken, onError }) {
  const [setup, setSetup] = useState(null)
  const [copied, copy] = useCopy()

  useEffect(() => {
    let active = true
    authService
      .startMfaSetup(mfaToken)
      .then((data) => active && setSetup(data))
      .catch((err) => active && onError?.(err.message))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mfaToken])

  if (!setup) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing setup…
      </div>
    )
  }

  const grouped = setup.secret.replace(/(.{4})/g, '$1 ').trim()

  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
        <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, Authy…).</li>
        <li>Scan this QR code, or enter the key by hand.</li>
        <li>Type the 6-digit code the app shows.</li>
      </ol>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={setup.qrDataUrl} alt="QR code for your authenticator app" width={180} height={180} className="rounded-lg bg-white p-2" />
        <button
          type="button"
          onClick={() => copy(setup.secret)}
          className="flex items-center gap-2 rounded-lg px-2 py-1 font-mono text-xs text-gray-700 hover:bg-white"
          title="Copy setup key"
        >
          {grouped}
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
        </button>
      </div>
    </div>
  )
}

/** Shows freshly generated recovery codes once, with copy, before continuing. */
export function MfaRecoveryCodes({ codes, onContinue, continueLabel = 'I have saved these codes' }) {
  const [copied, copy] = useCopy()
  const [saved, setSaved] = useState(false)
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Two-factor authentication is on. Save these recovery codes somewhere safe. Each one works once
        if you lose access to your authenticator app. They won&apos;t be shown again.
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm text-gray-800">
        {codes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={() => copy(codes.join('\n'))}>
        {copied ? 'Copied' : 'Copy codes'}
      </Button>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        I have saved my recovery codes
      </label>
      <Button type="button" variant="primary" className="w-full" disabled={!saved} onClick={onContinue}>
        {continueLabel}
      </Button>
    </div>
  )
}
