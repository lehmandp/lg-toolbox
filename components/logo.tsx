/**
 * LG | LOAN TOOLBOX wordmark.
 *
 * The LG monogram is the real mark (public/lg-monogram.png), applied as a
 * CSS mask so it inherits currentColor instead of being baked black — that
 * keeps it correct on any background and lets it invert if needed.
 *
 * The wordmark is set in Cache in the original artwork. Cache is not a web
 * font and is not installed here, so --font-display is the stand-in until
 * the real face is supplied. See README.
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-stretch gap-[15px] leading-none text-foreground ${className}`}
      aria-label="LG Loan Toolbox"
    >
      {/* Monogram — native ratio 412 x 779. */}
      <span aria-hidden className="logo-monogram h-[64px] w-[34px]" />

      {/* Hairline rule */}
      <span aria-hidden className="block w-px shrink-0 bg-foreground" />

      {/* Stacked lockup */}
      <span
        aria-hidden
        className="font-display flex flex-col justify-center text-[27px] font-bold uppercase tracking-[0.2em]"
      >
        <span className="leading-[1.08]">Loan</span>
        <span className="leading-[1.08]">Toolbox</span>
      </span>
    </span>
  )
}
