import PageShell from "../components/PageShell";

function AboutPage({ searchProps, cartCount = 0, wishlistCount = 0, onCartClick }) {
  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex-1 px-6 py-10 sm:px-10 lg:px-14">
        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border border-slate-200 bg-white px-8 py-10 shadow-sm sm:px-10">
            <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">About us</p>
            <h1 className="mt-4 text-4xl font-light tracking-tight text-slate-800 sm:text-5xl">
              A fragrance storefront with a calmer shopping flow.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              We built this experience around a simple idea: luxury shopping should feel focused,
              clear, and composed. Instead of overwhelming visitors, the interface puts discovery,
              search, and product detail at the center.
            </p>
          </div>

          <div className="grid gap-6">
            {[
              [
                "Curated presentation",
                "Products are surfaced with a cleaner visual hierarchy so browsing feels more intentional.",
              ],
              [
                "Faster discovery",
                "The improved header and search system help users move through the catalog without layout jumps.",
              ],
              [
                "Room to grow",
                "This page now gives the route a polished base that can later hold team, brand, or sourcing content.",
              ],
            ].map(([title, text]) => (
              <article key={title} className="border border-slate-200 bg-[#f8faf9] px-7 py-7 shadow-sm">
                <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">Focus</p>
                <h2 className="mt-3 text-2xl font-light tracking-tight text-slate-800">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export default AboutPage;
