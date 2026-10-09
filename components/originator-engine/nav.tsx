'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  ['Activity', '/originator-engine'],
  ['Progress', '/originator-engine/progress'],
  ['Goals', '/originator-engine/goals'],
] as const

export default function OriginatorEngineNav() {
  const pathname = usePathname()
  return (
    <div className="mb-[18px] flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[#d8dee8] bg-white px-3 py-2.5">
      <div className="text-sm font-black">Originator Engine</div>
      <nav className="flex flex-wrap gap-1.5">
        {links.map(([label, href]) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={
                'rounded-[9px] px-3 py-2 text-xs font-extrabold no-underline transition-colors ' +
                (active ? 'bg-[#1f4b7a] text-white' : 'text-[#1f2937] hover:bg-[#eef4fa]')
              }
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
