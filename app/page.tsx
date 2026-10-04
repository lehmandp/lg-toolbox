'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/header'

const categories = [
  ['Calculators', '÷', 'Quick mortgage and income calculations for everyday loan scenarios.'],
  ['Workflows', '↳', 'Simple systems for prospecting, follow-up, client management, and production.'],
  ['Planning Tools', '⌁', 'Business planning, goal setting, activity tracking, and production management.'],
  ['Programs & Resources', '+', 'Useful mortgage programs, reference tools, and originator resources.'],
]

export default function Home() {
  useEffect(() => {
    document.body.classList.add('home-loaded')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('home-reveal-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14 }
    )

    document.querySelectorAll('.home-reveal').forEach((element) => observer.observe(element))

    return () => {
      document.body.classList.remove('home-loaded')
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <section className="home-hero-wrap">
          <div className="home-hero-grid" aria-hidden />
          <div className="home-hero-glow" aria-hidden />

          <div className="home-hero mx-auto flex min-h-[620px] max-w-[1000px] flex-col items-center justify-center px-8 py-24 text-center">
            <div className="home-hero-eyebrow eyebrow">BUILT FOR LOAN ORIGINATORS</div>
            <div className="home-hero-accent" aria-hidden />

            <h1 className="home-hero-title max-w-[800px] text-[46px] leading-[1.02] tracking-[-2px] md:text-[60px] md:leading-[1.01]">
              The tools you actually use.
              <br />
              <span className="text-primary">In one place.</span>
            </h1>

            <p className="home-hero-copy mt-7 max-w-[720px] text-[17px] leading-7 text-muted-foreground">
              LG Loan Toolbox is a free workspace for mortgage professionals. Create an account,
              build your personal toolbox, and access practical tools designed to make originating
              loans simpler and more organized.
            </p>

            <div className="home-hero-cta mt-8">
              <Link href="/signup" className="btn-primary home-primary-cta">Create Free Account</Link>
            </div>

            <p className="home-hero-micro mt-3 text-xs text-muted-foreground">
              Free account. No credit card. No Toolbox subscription required.
            </p>
          </div>
        </section>

        <section className="home-reveal border-y border-border bg-white">
          <div className="mx-auto max-w-[1200px] px-8 py-20">
            <div className="mx-auto max-w-[760px] text-center">
              <div className="eyebrow mb-4">WHAT YOU&apos;LL FIND</div>
              <h2 className="text-[34px] leading-[1.15]">
                Practical tools for running a mortgage business.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                The toolbox is built around useful categories instead of complicated software bundles.
                Add what you need and ignore what you don&apos;t.
              </p>
            </div>

            <div className="mt-12 grid gap-[18px] md:grid-cols-2">
              {categories.map(([title, icon, copy]) => (
                <article key={title} className="home-category-card border border-border bg-background p-7 text-left">
                  <div className="flex items-center justify-between gap-5">
                    <h3 className="text-[22px] font-medium">{title}</h3>
                    <div className="home-category-icon" aria-hidden>{icon}</div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-reveal mx-auto max-w-[1200px] px-8 py-20">
          <div className="mx-auto max-w-[760px] text-center">
            <div className="eyebrow mb-4">HOW IT WORKS</div>
            <h2 className="text-[34px] leading-[1.15]">
              Simple enough to become part of your daily routine.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              One account gives you a place to organize the tools and resources you actually want to use.
            </p>
          </div>

          <div className="mt-12 grid border border-border bg-white md:grid-cols-3">
            {[
              ['01 / CREATE', 'Make a free account', 'No credit card and no LG Loan Toolbox subscription.'],
              ['02 / BUILD', 'Build your toolbox', 'Choose the calculators, workflows, planning tools, and resources useful to you.'],
              ['03 / USE', 'Open and work', 'Use native tools directly or launch external resources from the same organized hub.'],
            ].map(([step, title, copy], index) => (
              <article
                key={step}
                className={'p-7 ' + (index > 0 ? 'border-t border-border md:border-l md:border-t-0' : '')}
              >
                <div className="text-[11px] font-semibold tracking-[.12em] text-primary">{step}</div>
                <h3 className="mt-3 text-[20px] font-medium">{title}</h3>
                <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-reveal home-final-cta">
          <div className="home-final-glow" aria-hidden />
          <div className="relative z-[1] mx-auto max-w-[900px] px-8 py-20 text-center text-white">
            <div className="mb-4 text-[12px] font-medium uppercase tracking-[1.8px] text-[#d7a171]">
              SIMPLE BY DESIGN
            </div>
            <h2 className="text-[36px] leading-[1.15] text-white">The toolbox is free.</h2>
            <p className="mx-auto mt-4 max-w-[680px] text-sm leading-7 text-[#d7e0e8]">
              Some tools are built directly into LG Loan Toolbox. Others may link to outside resources
              or standalone software. Free and paid products are clearly labeled, and any paid product
              handles its own subscription separately.
            </p>

            <div className="mt-8">
              <Link href="/signup" className="home-light-cta">Create Free Account</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-5 px-8 py-10 text-xs text-muted-foreground">
          <span>LG Loan Toolbox · Part of The Lehman Group</span>
          <span>Practical tools for loan originators</span>
        </div>
      </footer>
    </div>
  )
}
