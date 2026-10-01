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

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setAdmin(false)
      return
    }
    let cancelled = false
    const supabase = createClient()
    supabase.rpc('is_admin')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('[header] admin check failed:', error.message)
        setAdmin(data === true)
      })
    return () => { cancelled = true }
  }, [user])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    ...(user ? [{ label: 'My Toolbox', href: '/library' }] : []),
    { label: 'Marketplace', href: '/marketplace' },
    ...(admin ? [{ label: 'Admin', href: '/admin' }] : []),
  ]

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex min-h-[72px] max-w-[1200px] items-center justify-between gap-6 px-8 py-4">
        <Link href={user ? '/library' : '/'} aria-label="LG Loan Toolbox home">
          <Logo />
        </Link>

        <div className="flex items-center gap-7">
          <nav className="flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={
                    'border-b-2 px-0 py-1 text-[13px] font-medium transition-colors ' +
                    (isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-primary')
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {ready && user && (
            <div className="hidden items-center gap-3 border-l border-border pl-5 md:flex">
              <div className="flex h-9 w-9 items-center justify-center bg-primary text-xs font-semibold text-white">
                {(user.email?.slice(0, 2) ?? 'LG').toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-medium">{user.email}</div>
                <button
                  onClick={handleSignOut}
                  className="text-[10px] text-muted-foreground transition-colors hover:text-primary"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          {ready && !user && (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm hover:text-primary">Sign in</Link>
              <Link href="/signup" className="btn-primary">Get started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
