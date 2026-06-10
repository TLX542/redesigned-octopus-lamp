import ProductCard from "../components/ProductCard";
import PageShell from "../components/PageShell";
import HeroSection from "../components/HeroSection";
import CategorySection from "../components/CategorySection";
import SortControls from "../components/SortControls";

function HomePage({
  searchProps,
  sortOption = "default",
  onSortChange,
  products = [],
  categories = [],
  selectedCategoryId = "",
  onCategorySelect,
  onClearCategory,
  isLoading = false,
  error = "",
  cartCount = 0,
  wishlistCount = 0,
  onCartClick,
  onToggleWishlist,
  isWishlisted,
}) {
  const hasProducts = products.length > 0;
  const isSearching = searchProps?.searchStatus !== "idle";
  const selectedCategory = categories.find(
    (category) => String(category.id) === selectedCategoryId,
  );

  if (isLoading) {
    return (
      <PageShell
        searchProps={searchProps}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
      >
        <main className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-14">
          <div className="max-w-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
            <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">
              Product catalog
            </p>
            <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">
              Loading products.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The catalog is being loaded from the API.
            </p>
          </div>
        </main>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell
        searchProps={searchProps}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
      >
        <main className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-14">
          <div className="max-w-xl border border-rose-200 bg-white px-8 py-10 text-center shadow-sm">
            <p className="text-[11px] tracking-[0.28em] text-rose-500 uppercase">
              Product catalog
            </p>
            <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">
              Catalog unavailable.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">{error}</p>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      {!isSearching && <HeroSection />}
      {!isSearching && (
        <CategorySection
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={onCategorySelect}
          onClearCategory={onClearCategory}
        />
      )}

      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">
                {isSearching ? "Filtered products" : "Featured products"}
              </p>
              <h2 className="mt-2 text-3xl font-light tracking-tight text-slate-700">
                {selectedCategory?.name ?? "Our Selection"}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="sans-ui inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] tracking-[0.22em] text-slate-500 uppercase">
                  {products.length} items in catalog
                </p>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={onClearCategory}
                    className="sans-ui inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] tracking-[0.22em] text-slate-600 uppercase transition hover:border-slate-500 hover:text-slate-900"
                  >
                    Clear category
                  </button>
                )}
              </div>
            </div>

            <SortControls sortOption={sortOption} onSortChange={onSortChange} />
          </div>

          <section className="flex min-h-[40vh] flex-1 flex-col" aria-label="Products">
            {hasProducts ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 xl:gap-7">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={isWishlisted?.(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto w-full max-w-xl rounded-[1.6rem] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">
                  Product catalog
                </p>
                <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">
                  No products to show.
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Products will appear here once they are added to the catalog.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </PageShell>
  );
}

export default HomePage;
