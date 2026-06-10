import { useMemo, useState } from "react";
import { api } from "../lib/api";

function money(value) {
  return `${Number(value ?? 0).toFixed(2)} USD`;
}

function calculateDiscountedPrice(price, discountRate) {
  const numericPrice = Number(price);
  const numericRate = Number(discountRate);

  if (!Number.isFinite(numericPrice) || !Number.isFinite(numericRate)) {
    return 0;
  }

  return Math.max(numericPrice * (1 - numericRate / 100), 0.01);
}

function DiscountManager({
  products = [],
  loading = false,
  error = "",
  token = "",
  onProductsUpdated = () => {},
}) {
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [discountRate, setDiscountRate] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);

  const selectedProducts = useMemo(() => {
    const selectedIds = new Set(selectedProductIds);
    return products.filter((product) => selectedIds.has(product.id));
  }, [products, selectedProductIds]);

  const discountPreview = useMemo(
    () =>
      selectedProducts.map((product) => ({
        ...product,
        discountedPrice: calculateDiscountedPrice(product.price, discountRate),
      })),
    [selectedProducts, discountRate],
  );

  const allProductsSelected = products.length > 0 && selectedProductIds.length === products.length;
  const numericDiscountRate = Number(discountRate);
  const hasValidDiscountRate =
    Number.isFinite(numericDiscountRate) && numericDiscountRate > 0 && numericDiscountRate < 100;

  function toggleProduct(productId) {
    setAppliedDiscounts([]);
    setMessage("");
    setSelectedProductIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId],
    );
  }

  function toggleAllProducts() {
    setAppliedDiscounts([]);
    setMessage("");
    setSelectedProductIds(allProductsSelected ? [] : products.map((product) => product.id));
  }

  async function handleApplyDiscount(event) {
    event.preventDefault();
    setMessage("");
    setAppliedDiscounts([]);

    if (!token) {
      setMessage("Please sign in as a sales manager to apply discounts.");
      return;
    }

    if (selectedProductIds.length === 0) {
      setMessage("Please select at least one product.");
      return;
    }

    if (!hasValidDiscountRate) {
      setMessage("Enter a discount rate greater than 0 and less than 100.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.applyProductDiscount(
        token,
        selectedProductIds,
        numericDiscountRate,
      );
      const updatedDiscounts = response.updated_products ?? [];

      onProductsUpdated(updatedDiscounts.map((item) => item.product));
      setAppliedDiscounts(updatedDiscounts);
      setSelectedProductIds([]);
      setMessage(
        `Applied ${numericDiscountRate}% discount to ${updatedDiscounts.length} product(s). Created ${response.notification_count ?? 0} wishlist notification(s).`,
      );
    } catch (requestError) {
      setMessage(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
          Discount management
        </p>
        <h2 className="mt-2 text-2xl font-light tracking-tight text-slate-800">
          Apply discounts to selected products
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Select products, choose a discount rate, preview the discounted prices, and apply the update.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-600">
          Loading products...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-600">
          No products are available for discounting.
        </div>
      ) : (
        <form className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]" onSubmit={handleApplyDiscount}>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="block sm:max-w-xs">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">
                  Discount rate
                </span>
                <input
                  type="number"
                  min="0.01"
                  max="99.99"
                  step="0.01"
                  value={discountRate}
                  onChange={(event) => {
                    setDiscountRate(event.target.value);
                    setMessage("");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500"
                />
              </label>

              <button
                type="button"
                onClick={toggleAllProducts}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-500"
              >
                {allProductsSelected ? "Clear selection" : "Select all"}
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <div className="grid min-w-[640px] grid-cols-[72px_minmax(0,1fr)_120px_120px] bg-slate-50 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                <span>Select</span>
                <span>Product</span>
                <span>Current</span>
                <span>Discounted</span>
              </div>

              <div className="min-w-[640px] divide-y divide-slate-100">
                {products.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const discountedPrice = calculateDiscountedPrice(product.price, discountRate);

                  return (
                    <label
                      key={product.id}
                      className="grid cursor-pointer grid-cols-[72px_minmax(0,1fr)_120px_120px] items-center px-4 py-4 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(product.id)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900">
                          {product.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {product.model}
                        </span>
                      </span>
                      <span>{money(product.price)}</span>
                      <span className={isSelected ? "font-semibold text-emerald-700" : "text-slate-500"}>
                        {money(discountedPrice)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-800 px-5 py-3 text-sm uppercase tracking-[0.22em] text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Applying..." : "Apply discount"}
            </button>
          </div>

          <aside className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Price preview
            </p>

            {discountPreview.length > 0 ? (
              <div className="mt-4 space-y-3">
                {discountPreview.map((product) => (
                  <div key={product.id} className="rounded-xl bg-white p-4 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span>{money(product.price)}</span>
                      <span className="font-semibold text-emerald-700">
                        {money(product.discountedPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Select products to preview discounted prices.
              </p>
            )}

            {message && (
              <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm text-slate-700">
                {message}
              </p>
            )}

            {appliedDiscounts.length > 0 && (
              <div className="mt-5 space-y-3">
                {appliedDiscounts.map((item) => (
                  <div key={item.product.id} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="mt-2">
                      {money(item.original_price)} to {money(item.discounted_price)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </form>
      )}
    </section>
  );
}

export default DiscountManager;
