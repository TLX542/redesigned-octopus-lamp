import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import PageShell from "../components/PageShell";

function money(value) {
  return `${Number(value ?? 0).toFixed(2)} USD`;
}

function WishlistPage({
  searchProps,
  products = [],
  isLoading = false,
  error = "",
  syncError = "",
  discountNotifications = [],
  discountNotificationsLoading = false,
  discountNotificationsError = "",
  onMarkDiscountNotificationsRead,
  cartCount = 0,
  wishlistCount = 0,
  onCartClick,
  onToggleWishlist,
  isWishlisted,
}) {
  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Wishlist</p>
              <h1 className="mt-2 text-4xl font-light tracking-tight text-slate-900">
                Saved fragrances
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Keep products here for quick access before you decide what to purchase.
            </p>
          </div>

          <section className="mb-8 border border-slate-200 bg-white/90 p-5 shadow-sm" aria-label="Discount notifications">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">
                  Discount notifications
                </p>
                <h2 className="mt-2 text-2xl font-light tracking-tight text-slate-800">
                  Wishlist price drops
                </h2>
              </div>

              {discountNotifications.some((notification) => !notification.is_read) && (
                <button
                  type="button"
                  onClick={onMarkDiscountNotificationsRead}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-500"
                >
                  Mark all read
                </button>
              )}
            </div>

            {discountNotificationsLoading ? (
              <p className="mt-4 text-sm text-slate-600">Loading discount notifications...</p>
            ) : discountNotificationsError ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {discountNotificationsError}
              </p>
            ) : discountNotifications.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {discountNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={`/product/${notification.product_id}`}
                    className={`block rounded-xl border px-4 py-4 text-sm transition hover:border-slate-400 ${
                      notification.is_read
                        ? "border-slate-200 bg-slate-50 text-slate-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-900"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{notification.product_name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] opacity-75">
                          {Number(notification.discount_rate).toFixed(2)}% off
                        </p>
                      </div>
                      <p className="font-semibold">
                        {money(notification.original_price)} to {money(notification.discounted_price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-slate-600">
                No wishlist discount notifications yet.
              </p>
            )}

            {syncError && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {syncError}
              </p>
            )}
          </section>

          <section className="flex min-h-[40vh] flex-1 flex-col" aria-label="Wishlist products">
            {isLoading ? (
              <div className="mx-auto w-full max-w-xl border border-slate-200 bg-white/90 px-8 py-10 text-center shadow-sm backdrop-blur">
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Wishlist</p>
                <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">Loading wishlist.</h1>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Product information is being loaded from the API.
                </p>
              </div>
            ) : error ? (
              <div className="mx-auto w-full max-w-xl border border-slate-200 bg-white/90 px-8 py-10 text-center shadow-sm backdrop-blur">
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Wishlist</p>
                <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">Wishlist is unavailable.</h1>
                <p className="mt-4 text-sm leading-7 text-slate-600">{error}</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={isWishlisted?.(product.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto w-full max-w-xl border border-slate-200 bg-white/90 px-8 py-10 text-center shadow-sm backdrop-blur">
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Wishlist</p>
                <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">
                  Your wishlist is empty.
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Save products from the homepage or product details to see them here.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </PageShell>
  );
}

export default WishlistPage;
