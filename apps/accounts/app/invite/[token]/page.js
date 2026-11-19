'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService, flattenUser, useAuth } from '@webfudge/auth'
import { AlertCircle, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react'
import {
  Button,
  Input,
  LoginBrandCorner,
  LoginMobileBrandHeader,
  LoginProductCredit,
  MfaLoginStep,
} from '@webfudge/ui'
import { ACCOUNTS_SITE } from '../../../lib/site'

function Field({ id, label, children, hint }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-dark">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      {message}
    </div>
  )
}

export default function AcceptInvitationPage() {
  const { token } = useParams()
  const router = useRouter()
  const { acceptInvitation, isAuthenticated, user, logout } = useAuth()

  const [invite, setInvite] = useState(null) // validate response
  const [loadError, setLoadError] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mfa, setMfa] = useState(null) // { mode, token }

  useEffect(() => {
    let cancelled = false
    authService
      .validateInvitation(String(token || ''))
      .then((data) => !cancelled && setInvite(data))
      .catch((err) => !cancelled && setLoadError(err?.message || 'Could not check this invitation.'))
    return () => {
      cancelled = true
    }
  }, [token])

  const signedInEmail = flattenUser(user)?.email || ''
  const signedInAsSomeoneElse =
    isAuthenticated && invite?.valid && signedInEmail.toLowerCase() !== String(invite.email).toLowerCase()
  const minLength = invite?.passwordMinLength || 8
  const existingUser = !!invite?.existingUser

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!existingUser) {
      if (!firstName.trim()) return setError('Enter your first name.')
      if (password.length < minLength) return setError(`Your password must be at least ${minLength} characters.`)
      if (password !== confirm) return setError('The passwords do not match.')
    } else if (!password) {
      return setError('Enter your password.')
    }
    setBusy(true)
    try {
      const result = await acceptInvitation({ token, password, firstName, lastName })
      if (result?.success) router.replace('/')
      else if (result?.mfaRequired || result?.mfaSetupRequired) {
        setMfa({ mode: result.mfaSetupRequired ? 'setup' : 'verify', token: result.mfaToken })
      }
    } catch (err) {
      setError(err?.message || 'Could not accept the invitation. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  let content
  if (!invite && !loadError) {
    content = (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    )
  } else if (loadError || !invite?.valid) {
    content = (
      <div className="space-y-5">
        <h2 className="text-2xl font-semibold text-brand-dark">Invitation not available</h2>
        <ErrorBox message={loadError || invite?.message} />
        <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
          Go to sign in
        </Button>
      </div>
    )
  } else if (mfa) {
    content = (
      <MfaLoginStep
        mfaToken={mfa.token}
        mode={mfa.mode}
        onDone={() => router.replace('/')}
        onCancel={() => router.push('/login')}
      />
    )
  } else if (signedInAsSomeoneElse) {
    content = (
      <div className="space-y-5">
        <h2 className="text-2xl font-semibold text-brand-dark">You&apos;re signed in as someone else</h2>
        <p className="text-sm text-gray-600">
          This invitation is for <strong>{invite.email}</strong>, but this browser is signed in as{' '}
          <strong>{signedInEmail}</strong>. Sign out to accept it, or open the link in a private window.
        </p>
        <Button variant="primary" className="w-full" onClick={logout}>
          Sign out and continue
        </Button>
      </div>
    )
  } else {
    content = (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-indigo/10">
            <MailCheck className="h-5 w-5 text-brand-indigo" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-brand-dark">Join {invite.organizationName}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {invite.invitedByName ? `${invite.invitedByName} invited you` : 'You were invited'} as{' '}
              <strong>{invite.roleLabel}</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <ErrorBox message={error} />
          <Field id="invite-email" label="Email">
            <Input id="invite-email" value={invite.email} disabled readOnly className="w-full" />
          </Field>

          {existingUser ? (
            <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
              You already have a BikeWo Suite account. Enter its password to accept.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="invite-first-name" label="First name">
                <Input
                  id="invite-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  className="w-full"
                />
              </Field>
              <Field id="invite-last-name" label="Last name">
                <Input
                  id="invite-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  className="w-full"
                />
              </Field>
            </div>
          )}

          <Field
            id="invite-password"
            label={existingUser ? 'Password' : 'Create a password'}
            hint={existingUser ? null : `At least ${minLength} characters.`}
          >
            <div className="relative">
              <Input
                id="invite-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={existingUser ? 'current-password' : 'new-password'}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </Field>

          {!existingUser && (
            <Field id="invite-confirm" label="Confirm password">
              <Input
                id="invite-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full"
              />
            </Field>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Accepting…
              </span>
            ) : (
              'Accept invitation'
            )}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-col justify-center bg-gradient-to-br from-brand-indigo to-brand-midnight px-16 py-20 lg:flex lg:w-1/2">
        <LoginBrandCorner brandLogoPath={ACCOUNTS_SITE.brandLogoReversedPath} brandName={ACCOUNTS_SITE.brandName} />
        <div className="max-w-lg">
          <LoginProductCredit productName={ACCOUNTS_SITE.name} creatorLine={ACCOUNTS_SITE.creatorLine} />
          <h1 className="mb-6 text-5xl font-bold text-white">You&apos;re invited</h1>
          <p className="mb-4 text-xl text-white/90">
            One account for BikeWo CRM, Project Management and Accounts.
          </p>
          <p className="leading-relaxed text-white/80">
            Create your password to get started. If your organization requires it, you&apos;ll also set up an
            authenticator app for two-factor sign-in.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-16">
        <div className="mx-auto w-full max-w-md">
          <LoginMobileBrandHeader
            brandLogoPath={ACCOUNTS_SITE.brandLogoPath}
            logoPath={ACCOUNTS_SITE.logoPath}
            productName={ACCOUNTS_SITE.name}
            creatorLine={ACCOUNTS_SITE.creatorLine}
          />
          {content}
        </div>
      </div>
    </div>
  )
}
