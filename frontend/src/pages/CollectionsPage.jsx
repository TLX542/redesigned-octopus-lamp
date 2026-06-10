import PageShell from "../components/PageShell";

function CollectionsPage({ searchProps, cartCount = 0, wishlistCount = 0, onCartClick }) {
  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex-1 px-6 py-10 sm:px-10 lg:px-14">
        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(226,232,240,0.85),_transparent_52%),linear-gradient(135deg,_#fff,_#f3f6f7)] px-8 py-12 sm:px-12">
              <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">
                Fragrance wardrobe
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-light tracking-tight text-slate-800 sm:text-5xl">
                Collections shaped around mood, season, and presence.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
                Explore composed edits built for crisp mornings, formal evenings, weekends away,
                and everyday signatures. Each collection helps narrow the catalog into a more
                confident starting point.
              </p>
            </div>

            <div className="grid gap-0 sm:grid-cols-2">
              {[
                ["Fresh Starts", "Citrus, neroli, and airy woods for clean daytime wear."],
                ["After Dark", "Smoky, amber-rich compositions with warmer projection."],
                ["Quiet Luxury", "Elegant iris, musk, and soft-spice profiles with restraint."],
                ["Statement Bottles", "Memorable signatures built to leave a distinct trail."],
              ].map(([title, text]) => (
                <article key={title} className="border-t border-slate-200 px-8 py-8">
                  <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">Collection</p>
                  <h2 className="mt-3 text-2xl font-light tracking-tight text-slate-800">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="border border-slate-200 bg-[#eef3f2] px-7 py-8 shadow-sm">
              <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">
                How to browse
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <li>Use search to jump directly to a note, feature, or product family.</li>
                <li>Open product pages to compare details, features, and bottle sizes.</li>
                <li>Return here when you want a curated starting point instead of the full grid.</li>
              </ul>
            </div>

            <div className="border border-slate-200 bg-white px-7 py-8 shadow-sm">
              <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">
                Current direction
              </p>
              <p className="mt-4 text-3xl font-light tracking-tight text-slate-800">
                Clean, editorial, and easier to scan.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                This page now gives the collections route a deliberate visual treatment instead of
                leaving it as placeholder text, which makes the overall frontend feel more cohesive.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}

export default CollectionsPage;
