'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { label: 'My library', href: '/library' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Admin', href: '/admin' },
  ]

  return (
    <header className="bg-white">
      <div className="max-w-[1200px] mx-auto px-8 flex items-center justify-between" style={{ height: '140px' }}>
        {/* Logo */}
        <Link href="/" className="text-foreground text-lg font-medium tracking-tight">
          LG | LOAN TOOLBOX
        </Link>

        {/* Navigation */}
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
        </nav>
      </div>
    </header>
  )
}
