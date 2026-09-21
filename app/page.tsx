import Link from 'next/link'
import Header from '@/components/header'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <div className="max-w-[1200px] mx-auto px-8 py-20">
        <div className="grid grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="mb-0">
              Your tools.<br />
              <span className="text-primary">All in one place.</span>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-6">
            <p className="text-muted-foreground text-right max-w-md">
              Browse the marketplace and add the tools you want to use. Free tools available instantly, premium tools with Pro subscription.
            </p>
            <Link href="/signup" className="btn-primary">
              <span className="text-xl">+</span>
              Get Started Free
            </Link>
          </div>
        </div>
      </div>

      <div className="hairline" />

      {/* Features */}
      <div className="max-w-[1200px] mx-auto px-8 py-20">
        <div className="eyebrow mb-6">HOW IT WORKS</div>
        <h2 className="mb-12">Build your perfect toolkit</h2>
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="text-primary text-sm">01 /</div>
            <h3 className="text-xl font-medium">Browse marketplace</h3>
            <p className="text-muted-foreground text-sm">
              Explore free calculators and premium workflow tools designed for loan originators.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-primary text-sm">02 /</div>
            <h3 className="text-xl font-medium">Add to library</h3>
            <p className="text-muted-foreground text-sm">
              One click to add free tools. Premium tools require Pro subscription ($100/month).
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-primary text-sm">03 /</div>
            <h3 className="text-xl font-medium">Launch & work</h3>
            <p className="text-muted-foreground text-sm">
              Access all your tools from one place. Single sign-on across the entire suite.
            </p>
          </div>
        </div>
      </div>

      <div className="hairline" />

      {/* Footer */}
      <footer className="max-w-[1200px] mx-auto px-8 py-12">
        <div className="grid grid-cols-3 gap-8 text-sm">
          <div className="eyebrow">LG LOAN TOOLBOX</div>
          <div className="text-center text-muted-foreground">Part of The Lehman Group</div>
          <div className="text-right">
            <a href="https://lehmangrp.com" target="_blank" rel="noopener noreferrer" className="text-primary font-medium border-b border-primary pb-1">
              lehmangrp.com ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
