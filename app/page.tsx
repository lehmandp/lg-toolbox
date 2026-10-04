import Link from 'next/link'
import Header from '@/components/header'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-[1200px] px-8 py-20">
        <div className="grid grid-cols-2 items-center gap-12">
          <div>
            <h1 className="mb-0">
              Your tools.<br />
              <span className="text-primary">All in one place.</span>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-6">
            <p className="max-w-md text-right text-muted-foreground">
              LG Loan Toolbox is a free hub for loan officers. Use free tools, save your favorites,
              and discover independent software products from one marketplace.
            </p>
            <Link href="/signup" className="btn-primary">
              <span className="text-xl">+</span>
              Create Free Account
            </Link>
          </div>
        </div>
      </div>

      <div className="hairline" />

      <div className="mx-auto max-w-[1200px] px-8 py-20">
        <div className="eyebrow mb-6">HOW IT WORKS</div>
        <h2 className="mb-12">Build your perfect toolkit</h2>
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="text-sm text-primary">01 /</div>
            <h3 className="text-xl font-medium">Browse marketplace</h3>
            <p className="text-sm text-muted-foreground">
              Explore free native tools, free external resources, and paid software products built for loan originators.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-primary">02 /</div>
            <h3 className="text-xl font-medium">Add to My Toolbox</h3>
            <p className="text-sm text-muted-foreground">
              Save any tool to your personal toolbox. Your LG Loan Toolbox account is always free.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-primary">03 /</div>
            <h3 className="text-xl font-medium">Launch & work</h3>
            <p className="text-sm text-muted-foreground">
              Native tools open here. External tools launch on their own sites, where paid products manage their own subscriptions.
            </p>
          </div>
        </div>
      </div>

      <div className="hairline" />

      <footer className="mx-auto max-w-[1200px] px-8 py-12">
        <div className="grid grid-cols-3 gap-8 text-sm">
          <div className="eyebrow">LG LOAN TOOLBOX</div>
          <div className="text-center text-muted-foreground">Part of The Lehman Group</div>
          <div className="text-right">
            <a href="https://lehmangrp.com" target="_blank" rel="noopener noreferrer" className="border-b border-primary pb-1 font-medium text-primary">
              lehmangrp.com ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
