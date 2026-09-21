'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Header from '@/components/header'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/library'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // With email confirmation on, there is no session yet.
    if (data.session) {
      router.push(next)
      router.refresh()
    } else {
      setNotice(`Check ${email} for a confirmation link to finish setting up your account.`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="field-label">Full name</label>
        <input
          id="fullName"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="field-input"
          placeholder="Jane Originator"
        />
      </div>

      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
          placeholder="At least 8 characters"
        />
      </div>

      {error && (
        <p className="border border-primary bg-white px-4 py-3 text-sm text-primary" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="border border-border bg-white px-4 py-3 text-sm text-foreground" role="status">
          {notice}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creating account…' : 'Create free account'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary border-b border-primary pb-px">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-[480px] px-8 py-20">
        <div className="eyebrow mb-6">GET STARTED</div>
        <h1 className="mb-4">Create your account</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Free forever. No credit card required. Upgrade to Pro any time to unlock
          every premium tool.
        </p>
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
