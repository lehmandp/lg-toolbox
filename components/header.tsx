'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Logo from '@/components/logo'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState(false)
  const [ready, setReady] = useState(false)

  // Track the session only. Deliberately does NOT call the database from
  // inside onAuthStateChange: the Supabase client holds an internal lock
  // while that callback runs, and awaiting another Supabase call inside it
  // can deadlock, so the admin check would silently never resolve.
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Admin lookup runs in its own effect, outside the auth callback.
  useEffect(() => {
    if (!user) {
      setAdmin(false)
      return
    }

    let cancelled = false
    const supabase = createClient()

    supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          // Most likely a missing RLS select policy on admin_users.
          console.error('[header] admin check failed:', error.message)
        }
        setAdmin(data !== null)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    ...(user ? [{ label: 'My library', href: '/library' }] : []),
    { label: 'Marketplace', href: '/marketplace' },
    ...(admin ? [{ label: 'Admin', href: '/admin' }] : []),
  ]

  return (
    <header className="bg-white">
      <div
        className="mx-auto flex max-w-[1200px] items-center justify-between px-8"
        style={{ height: '140px' }}
      >
        <Link href="/" aria-label="LG Loan Toolbox home">
          <Logo />
        </Link>

        <nav className="flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm transition-colors ${
                  isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            )
          })}

          {/* Render nothing until auth resolves, to avoid flashing the wrong CTA. */}
          {ready &&
            (user ? (
              <button
                onClick={handleSignOut}
                className="text-sm text-foreground transition-colors hover:text-primary"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-foreground transition-colors hover:text-primary"
                >
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary">
                  Get started
                </Link>
              </>
            ))}
        </nav>
      </div>
    </header>
  )
}
