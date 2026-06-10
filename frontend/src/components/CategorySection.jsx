function CategorySection({
  categories = [],
  selectedCategoryId = "",
  onCategorySelect,
  onClearCategory,
}) {
  const hasSelectedCategory = Boolean(selectedCategoryId);

  return (
    <section
      className="border-b border-slate-200/80 px-6 py-10 sm:px-10 lg:px-14"
      aria-label="Browse by category"
    >
      <div className="mx-auto max-w-6xl">
        <div className="animate-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="sans-ui text-[11px] tracking-[0.3em] text-slate-500 uppercase">
              Browse by category
            </p>
            <h2 className="mt-2 text-3xl font-light tracking-tight text-slate-900">
              Start from a mood, not just a menu.
            </h2>
          </div>
          {hasSelectedCategory && (
            <button
              type="button"
              onClick={onClearCategory}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-[11px] tracking-[0.22em] text-slate-600 uppercase transition hover:border-slate-500 hover:text-slate-900"
            >
              Clear category
            </button>
          )}
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => {
            const categoryId = String(category.id);
            const isSelected = selectedCategoryId === categoryId;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategorySelect?.(categoryId)}
                className={`group animate-rise-soft relative overflow-hidden border px-6 py-6 text-left shadow-[0_24px_45px_-38px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 ${
                  isSelected
                    ? "border-slate-800 bg-slate-900 text-white"
                    : "border-slate-200/90 bg-white/80 hover:border-slate-300 hover:bg-white"
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className={`absolute -right-6 -top-8 h-24 w-24 rounded-full transition ${
                    isSelected ? "bg-white/10" : "bg-slate-100 group-hover:bg-[#f3ede4]"
                  }`}
                />
                <span
                  className={`sans-ui relative text-[10px] tracking-[0.26em] uppercase ${
                    isSelected ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  Category
                </span>
                <span className="relative mt-4 text-xl font-light tracking-tight">
                  {category.name}
                </span>
                {category.description && (
                  <span
                    className={`relative mt-3 text-sm leading-7 ${
                      isSelected ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {category.description}
                  </span>
                )}
                <span
                  className={`sans-ui relative mt-6 text-[11px] tracking-[0.22em] uppercase ${
                    isSelected ? "text-white" : "text-slate-500"
                  }`}
                >
                  {isSelected ? "Selected" : "View selection"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
