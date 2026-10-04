import Link from 'next/link'
import Header from '@/components/header'

const categories = [
  ['Calculators', 'Quick mortgage and income calculations for everyday loan scenarios.'],
  ['Workflows', 'Simple systems for prospecting, follow-up, client management, and production.'],
  ['Planning Tools', 'Business planning, goal setting, activity tracking, and production management.'],
  ['Programs & Resources', 'Useful mortgage programs, reference tools, and originator resources.'],
]

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="mx-auto flex min-h-[600px] max-w-[1000px] flex-col items-center justify-center px-8 py-24 text-center">
          <div className="eyebrow mb-5">BUILT FOR LOAN ORIGINATORS</div>
          <h1 className="max-w-[780px] text-[46px] leading-[1.02] tracking-[-2px] md:text-[60px] md:leading-[1.01]">
            The tools you actually use.
            <br />
            <span className="text-primary">In one place.</span>
          </h1>

          <p className="mt-7 max-w-[720px] text-[17px] leading-7 text-muted-foreground">
            LG Loan Toolbox is a free workspace for mortgage professionals. Create an account,
            build your personal toolbox, and access practical tools designed to make originating
            loans simpler and more organized.
          </p>

          <div className="mt-8">
            <Link href="/signup" className="btn-primary">Create Free Account</Link>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Free account. No credit card. No Toolbox subscription required.
          </p>
        </section>

        <section className="border-y border-border bg-white">
          <div className="mx-auto max-w-[1200px] px-8 py-16">
            <div className="mx-auto max-w-[760px] text-center">
              <div className="eyebrow mb-4">WHAT YOU&apos;LL FIND</div>
              <h2 className="text-[32px] leading-[1.15]">
                Practical tools for running a mortgage business.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The toolbox is built around useful categories instead of complicated software bundles.
                Add what you need and ignore what you don&apos;t.
              </p>
            </div>

            <div className="mt-12 grid gap-[18px] md:grid-cols-2">
              {categories.map(([title, copy]) => (
                <article key={title} className="border border-border bg-background p-7 text-left">
                  <h3 className="text-[21px] font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] px-8 py-20 text-center">
          <div className="eyebrow mb-4">SIMPLE BY DESIGN</div>
          <h2 className="text-[32px] leading-[1.15]">The toolbox is free.</h2>
          <p className="mx-auto mt-4 max-w-[680px] text-sm leading-6 text-muted-foreground">
            Some tools are built directly into LG Loan Toolbox. Others may link to outside tools or
            standalone software. Free and paid products are clearly labeled, and any paid product
            handles its own subscription separately.
          </p>

          <div className="mt-8">
            <Link href="/signup" className="btn-primary">Create Free Account</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-5 px-8 py-10 text-xs text-muted-foreground">
          <span>LG Loan Toolbox · Part of The Lehman Group</span>
          <span>Practical tools for loan originators</span>
        </div>
      </footer>
    </div>
  )
}
