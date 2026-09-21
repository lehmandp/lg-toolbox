import Link from 'next/link'

/** Small square outline chip beside a section heading, e.g. `00`. */
export function CountBadge({ value }: { value: number }) {
  return <span className="count-badge">{String(value).padStart(2, '0')}</span>
}

/** Thin-stroke outline cube, the empty-state mark. */
export function CubeIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

/** Copper text link with a permanent rule and a trailing arrow. */
export function RuleLink({
  href,
  children,
  external = false,
}: {
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  const content = (
    <>
      {children}
      <span aria-hidden>↗</span>
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="link-rule">
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className="link-rule">
      {content}
    </Link>
  )
}

/** Centered empty state: cube, heading, one muted line, then a rule link. */
export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string
  body: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="flex flex-col items-center px-8 py-24 text-center">
      <span className="mb-6 text-primary">
        <CubeIcon />
      </span>
      <h3 className="mb-2">{title}</h3>
      <p className="mb-8 max-w-md text-sm text-muted-foreground">{body}</p>
      <RuleLink href={actionHref}>{actionLabel}</RuleLink>
    </div>
  )
}
