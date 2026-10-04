import Link from 'next/link'
import Header from '@/components/header'

const showcase = [
  {
    code: 'OE',
    name: 'Originator Engine',
    description: 'Production planning and activity tracking',
    access: 'Free',
    type: 'Native',
  },
  {
    code: 'RP',
    name: 'Realtor Partner Engine',
    description: 'Prospecting and relationship management',
    access: 'Free',
    type: 'Native',
  },
  {
    code: 'SC',
    name: 'Income & Loan Calculators',
    description: 'Useful mortgage analysis tools',
    access: 'Free',
    type: 'External',
  },
  {
    code: 'SP',
    name: 'Standalone Software',
    description: 'Advanced products hosted separately',
    access: 'Paid',
    type: 'External',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="mx-auto grid max-w-[1200px] gap-14 px-8 py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-24">
          <div>
            <div className="eyebrow mb-5">BUILT FOR LOAN ORIGINATORS</div>
            <h1 className="max-w-[720px] text-[46px] leading-[1.02] tracking-[-2px] md:text-[58px] md:leading-[1.01]">
              The tools you actually use.
              <br />
              <span className="text-primary">In one place.</span>
            </h1>

            <p className="mt-7 max-w-[680px] text-[17px] leading-7 text-muted-foreground">
              LG Loan Toolbox is a free workspace for mortgage professionals. Use practical calculators,
              prospecting tools, business-development systems, and workflow helpers — then save the ones
              you use most to your personal toolbox.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary">Create Free Account</Link>
              <Link href="/marketplace" className="btn-secondary">Browse the Marketplace</Link>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Free account. No credit card. No Toolbox subscription required.
            </p>
          </div>

          <div className="border border-border bg-white p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow mb-1">MY TOOLBOX</div>
                <strong className="text-sm">Your working set</strong>
              </div>
              <span className="border border-primary px-2 py-1 text-[9px] font-semibold uppercase tracking-[.08em] text-primary">
                Free Account
              </span>
            </div>

            <div>
              {showcase.map((tool) => (
                <div key={tool.name} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-t border-border py-4 first:border-t-0">
                  <div className="flex h-[42px] w-[42px] items-center justify-center bg-muted text-xs font-semibold text-foreground">
                    {tool.code}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{tool.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{tool.description}</div>
                  </div>
                  <span className={
                    'border px-2 py-1 text-[9px] font-semibold uppercase tracking-[.08em] ' +
                    (tool.access === 'Free'
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground')
                  }>
                    {tool.access}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-white">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 px-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Free to Join', 'No Toolbox subscription'],
              ['Native + External', 'Everything in one toolbox'],
              ['Free + Paid', 'Clearly labeled in Marketplace'],
              ['Built for LOs', 'Practical mortgage workflows'],
            ].map(([title, copy], index) => (
              <div key={title} className={'py-6 lg:px-6 ' + (index < 3 ? 'lg:border-r lg:border-border' : '')}>
                <strong className="block text-[15px]">{title}</strong>
                <span className="text-[11px] text-muted-foreground">{copy}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-8 py-20" id="how-it-works">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <div className="eyebrow mb-4">HOW IT WORKS</div>
              <h2 className="max-w-[470px] text-[34px] leading-[1.12]">
                One place to organize the tools behind your business.
              </h2>
            </div>
            <p className="max-w-[650px] text-[15px] leading-7 text-muted-foreground">
              Loan officers use dozens of calculators, spreadsheets, scripts, trackers, and software products.
              LG Loan Toolbox brings them into a single, simple marketplace so you can build a working set
              around the way you actually originate loans.
            </p>
          </div>

          <div className="mt-12 grid gap-[18px] md:grid-cols-3">
            {[
              ['01 / BROWSE', 'Find useful tools', 'Explore calculators, prospecting systems, business-planning tools, workflow helpers, and software built specifically for mortgage professionals.'],
              ['02 / SAVE', 'Add them to My Toolbox', 'Create a free account and save the tools you use most. Your toolbox becomes your personal launchpad for running your business.'],
              ['03 / WORK', 'Open the tool and get to work', 'Native tools run inside LG Loan Toolbox. External tools launch on their own sites. Either way, you start from one organized place.'],
            ].map(([step, title, copy]) => (
              <article key={step} className="min-h-[230px] border border-border bg-white p-6">
                <div className="mb-6 text-[11px] font-semibold tracking-[.12em] text-primary">{step}</div>
                <h3 className="text-[20px] font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#232421] py-20 text-white">
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
              <div>
                <div className="mb-4 text-[12px] font-medium uppercase tracking-[1.8px] text-[#d7a171]">MARKETPLACE</div>
                <h2 className="max-w-[500px] text-[34px] leading-[1.12] text-white">
                  Free tools first. Great software when you need more.
                </h2>
              </div>
              <p className="max-w-[650px] text-[15px] leading-7 text-[#c8c8c1]">
                The Marketplace includes both free tools and paid products. Every item is clearly labeled.
                Paid products remain independent — LG Loan Toolbox simply helps you discover and launch them.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Free','Native','Originator Engine','Plan production goals, track activity, and keep your business-development effort focused.'],
                ['Free','Native','Realtor Partner Engine','Manage prospects, build referral relationships, and follow a repeatable agent-conversion process.'],
                ['Free','External','External Free Tools','Useful calculators hosted elsewhere can still be saved and launched from your toolbox.'],
                ['Paid','External','Standalone Software','Discover advanced products. Pricing, checkout, subscriptions, and support remain with each product.'],
              ].map(([access,type,name,copy]) => (
                <article key={name} className="flex min-h-[265px] flex-col border border-[#44463f] bg-[#2c2e2a] p-5">
                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className={'border px-2 py-1 text-[9px] font-semibold uppercase tracking-[.08em] ' + (access === 'Free' ? 'border-[#d7a171] text-[#d7a171]' : 'border-[#666960] text-[#d0d1ca]')}>
                      {access}
                    </span>
                    <span className="border border-[#666960] px-2 py-1 text-[9px] font-semibold uppercase tracking-[.08em] text-[#d0d1ca]">{type}</span>
                  </div>
                  <h3 className="text-[20px] font-medium text-white">{name}</h3>
                  <p className="mt-3 text-[13px] leading-6 text-[#c7c9c1]">{copy}</p>
                  <Link href="/marketplace" className="mt-auto pt-6 text-xs font-semibold text-[#e3ad7c]">
                    {access === 'Paid' ? 'View Product →' : 'Add to My Toolbox →'}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-8 py-20">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <div className="eyebrow mb-4">SIMPLE BY DESIGN</div>
              <h2 className="max-w-[470px] text-[34px] leading-[1.12]">
                No complicated membership tiers.
              </h2>
            </div>
            <p className="max-w-[650px] text-[15px] leading-7 text-muted-foreground">
              LG Loan Toolbox is designed to be useful before it ever asks you to buy anything.
              The hub is free. Paid software is optional and handled separately by the software product itself.
            </p>
          </div>

          <div className="mt-12 grid gap-[18px] lg:grid-cols-2">
            <article className="border border-border bg-white p-7">
              <div className="eyebrow">FREE TOOLS</div>
              <h3 className="mt-2 text-[25px] font-medium">Use them with your free account.</h3>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Free tools may run directly inside LG Loan Toolbox or on another site. Either way,
                there is no payment portal and no Toolbox subscription.
              </p>
              <ul className="mt-5 divide-y divide-border text-sm">
                {['Free account required','No credit card required','Add tools to My Toolbox','Native or external hosting'].map((item) => (
                  <li key={item} className="py-3"><span className="mr-2 text-primary">✓</span>{item}</li>
                ))}
              </ul>
            </article>

            <article className="border border-[#203d5a] bg-[#203d5a] p-7 text-white">
              <div className="text-[12px] font-medium uppercase tracking-[1.8px] text-[#d7a171]">PAID PRODUCTS</div>
              <h3 className="mt-2 text-[25px] font-medium text-white">Independent products, easy to discover.</h3>
              <p className="mt-4 text-sm leading-6 text-[#d7e0e8]">
                Paid products can still be added to My Toolbox. When launched, you go to that product&apos;s
                own site where pricing, trials, checkout, subscriptions, and support are managed.
              </p>
              <ul className="mt-5 divide-y divide-[#38536d] text-sm">
                {['Still visible in the Marketplace','Still addable to My Toolbox','No LG Toolbox paywall','Separate product subscription'].map((item) => (
                  <li key={item} className="py-3"><span className="mr-2 text-[#d7a171]">✓</span>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-8 pb-20">
          <div className="grid gap-8 border border-border bg-white p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <div className="eyebrow mb-2">START BUILDING YOUR TOOLBOX</div>
              <h2 className="text-[30px] leading-[1.15]">Create your free account.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Save the tools you use. Discover new ones. Keep everything organized in one place.
              </p>
            </div>
            <Link href="/signup" className="btn-primary">Create Free Account</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-5 px-8 py-10 text-xs text-muted-foreground">
          <span>LG Loan Toolbox · Part of The Lehman Group</span>
          <span>Free tools for loan originators · Independent paid products</span>
        </div>
      </footer>
    </div>
  )
}
