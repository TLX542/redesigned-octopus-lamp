import { useNavigate } from "react-router-dom";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden border-b border-slate-200/80 px-6 py-14 sm:px-10 lg:px-14 lg:py-18"
      aria-label="Hero"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-6 h-52 w-52 rounded-full bg-stone-200/55 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-100/45 blur-3xl" />
        <div className="absolute bottom-0 right-20 h-44 w-44 rounded-full bg-amber-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="animate-rise">
          <p className="sans-ui text-[11px] tracking-[0.32em] text-slate-500 uppercase">
            Curated fragrances
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-light leading-[0.95] tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl">
            Discover a scent
            <span className="block text-slate-500">with presence.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
            Explore luxury perfumes and colognes through a calmer, more editorial shopping
            experience. From bright citrus openings to smoky evening signatures, the catalog is
            arranged to help you find a bottle that feels precise.
          </p>
          <div className="sans-ui mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/collections")}
              className="rounded-full border border-slate-900 bg-slate-900 px-6 py-3 text-[11px] tracking-[0.24em] text-white uppercase transition hover:bg-slate-800"
            >
              Explore collections
            </button>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-[11px] tracking-[0.24em] text-slate-700 uppercase transition hover:border-slate-500 hover:text-slate-900"
            >
              Read our story
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="animate-rise-soft stagger-1 border border-white/70 bg-white/70 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
            <p className="sans-ui text-[10px] tracking-[0.28em] text-slate-400 uppercase">Mood</p>
            <p className="mt-3 text-2xl font-light tracking-tight text-slate-900">Day to night</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Fresh daytime bottles, warmer evening signatures, and versatile all-rounders.
            </p>
          </div>
          <div className="animate-rise-soft stagger-2 border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.7)]">
            <p className="sans-ui text-[10px] tracking-[0.28em] text-slate-400 uppercase">Selection</p>
            <p className="mt-3 text-2xl font-light tracking-tight">Quiet luxury</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Clean structure, restrained color, and product detail that stays easy to scan.
            </p>
          </div>
          <div className="animate-rise-soft stagger-3 border border-slate-200 bg-[#f7f2ea] p-6 sm:col-span-2">
            <p className="sans-ui text-[10px] tracking-[0.28em] text-slate-400 uppercase">Browse notes</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Citrus", "Oud", "Iris", "Amber", "Marine", "Vetiver"].map((note) => (
                <span
                  key={note}
                  className="sans-ui rounded-full border border-slate-300/80 px-3 py-1.5 text-[11px] tracking-[0.22em] text-slate-600 uppercase"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
