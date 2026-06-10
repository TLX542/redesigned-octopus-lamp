function SalesAnalytics() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
          Revenue analysis
        </p>
        <h2 className="mt-2 text-2xl font-light tracking-tight text-slate-800">
          Revenue and Profit Overview
        </h2>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <input
          type="date"
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-500"
        />
        <input
          type="date"
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-500"
        />
        <button
          type="button"
          className="rounded-xl bg-slate-800 px-5 py-3 text-sm uppercase tracking-[0.22em] text-white transition hover:bg-slate-700"
        >
          Calculate
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Revenue</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-800">12,500 USD</h3>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Profit</p>
          <h3 className="mt-3 text-2xl font-semibold text-emerald-700">3,400 USD</h3>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Loss</p>
          <h3 className="mt-3 text-2xl font-semibold text-rose-700">700 USD</h3>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
        Revenue chart placeholder
      </div>
    </section>
  );
}

export default SalesAnalytics;