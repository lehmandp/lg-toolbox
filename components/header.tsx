'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

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

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = user
    ? [
        { label: 'My library', href: '/library' },
        { label: 'Marketplace', href: '/marketplace' },
      ]
    : [{ label: 'Marketplace', href: '/marketplace' }]

  return (
    <header className="bg-white">
      <div
        className="mx-auto flex max-w-[1200px] items-center justify-between px-8"
        style={{ height: '140px' }}
      >
        <Link href="/" className="text-lg font-medium tracking-tight text-foreground">
          LG | LOAN TOOLBOX
        </Link>

        <nav className="flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            )
          })}

          {/* Render nothing until auth state resolves, to avoid a flash of
              the wrong call to action. */}
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
