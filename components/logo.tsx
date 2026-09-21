/**
 * LG | LOAN TOOLBOX wordmark.
 *
 * Live text rather than an image so it stays sharp at any size and remains
 * readable to screen readers. The monogram is an L and a G in a condensed
 * grotesque, the G dropped and pulled left so the two interlock.
 *
 * Sizes are tuned to the reference lockup: the monogram's visual height
 * matches the two-line text block, and the rule spans both.
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display inline-flex items-stretch gap-[15px] leading-none text-foreground ${className}`}
      aria-label="LG Loan Toolbox"
    >
      {/* Monogram — G sits down and right, overlapping the L's foot. */}
      <span aria-hidden className="relative block h-[64px] w-[58px] shrink-0 text-[74px] font-bold">
        <span className="absolute left-0 top-[-8px] leading-[0.78]">L</span>
        <span className="absolute left-[20px] top-[10px] leading-[0.78]">G</span>
      </span>

      {/* Hairline rule */}
      <span aria-hidden className="block w-px shrink-0 bg-foreground" />

      {/* Stacked lockup */}
      <span
        aria-hidden
        className="flex flex-col justify-center text-[27px] font-bold tracking-[0.2em]"
      >
        <span className="leading-[1.08]">LOAN</span>
        <span className="leading-[1.08]">TOOLBOX</span>
      </span>
    </span>
  )
}
