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

    async function resolve(nextUser: User | null) {
      setUser(nextUser)
      if (nextUser) {
        // The admin_users RLS policy lets a user read their own row.
        const { data } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', nextUser.id)
          .maybeSingle()
        setAdmin(data !== null)
      } else {
        setAdmin(false)
      }
      setReady(true)
    }

    supabase.auth.getUser().then(({ data }) => resolve(data.user))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

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
