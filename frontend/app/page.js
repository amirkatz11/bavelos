export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-xs font-bold tracking-tight">
              B
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Bavelos
              </div>
              <div className="text-[11px] text-slate-400">
                Working-capital & cash-flow copilot (MVP)
              </div>
            </div>
          </div>

          <button className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800 transition">
            Join MVP waitlist
          </button>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start">
          {/* Left column – hero copy */}
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              MVP • Agentic finance assistant for SMEs
            </div>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              See your <span className="text-emerald-300">cash runway</span>,  
              <br className="hidden md:block" />
              <span className="text-slate-300">
                and next 3 working-capital moves.
              </span>
            </h1>

            <p className="max-w-xl text-sm text-slate-300">
              Bavelos connects to your invoices and bank data, then surfaces
              simple, concrete actions: which customers to nudge, which
              suppliers to negotiate with, and how today&apos;s decisions
              change your 90-day runway.
            </p>

            <div className="flex flex-col gap-3 text-xs text-slate-300 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400 md:w-64"
                  placeholder="you@company.com"
                />
                <button className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-300 transition">
                  Get early access
                </button>
              </div>
              <span className="text-[11px] text-slate-500">
                No dashboards to build. Plug in, get 3 recommended actions.
              </span>
            </div>
          </div>

          {/* Right column – simple MVP panel */}
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-100 md:mt-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">
                Today&apos;s playbook (demo)
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
                Sample data
              </span>
            </div>

            <ul className="space-y-3">
              <li className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300">
                    Collect $48,200 faster
                  </span>
                  <span className="text-[10px] text-emerald-300">
                    +9 days runway
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300">
                  Prioritize 7 invoices &gt; 30 days overdue,  
                  send pre-written follow-up emails, and flag 2 high-risk
                  accounts for manual review.
                </p>
              </li>

              <li className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-300">
                    Negotiate supplier terms
                  </span>
                  <span className="text-[10px] text-amber-300">
                    +5 days DPO
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300">
                  3 suppliers with &gt; $10k / month spend have headroom for
                  15–30 day extensions without breaching historic patterns.
                </p>
              </li>

              <li className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-sky-300">
                    Scenario: lose top 2 customers
                  </span>
                  <span className="text-[10px] text-sky-300">
                    –31% runway
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300">
                  Models impact on cash runway and highlights 4 levers to offset
                  risk through pricing and OPEX trims.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-[11px] text-slate-500">
            Bavelos MVP • Private beta
          </span>
          <span className="text-[11px] text-slate-600">
            Built for founders & finance leads who hate dead dashboards.
          </span>
        </div>
      </footer>
    </main>
  );
}
