import { useEffect, useMemo, useState } from "react";
import DiscountManager from "../components/DiscountManager";
import InvoiceTable from "../components/InvoiceTable";
import SalesAnalytics from "../components/SalesAnalytics";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

function money(value) {
  return `${Number(value ?? 0).toFixed(2)} USD`;
}

function SalesManagerPage() {
  const { currentUser, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const data = await api.listProducts();
        if (!isMounted) return;
        setProducts(data);
      } catch (error) {
        if (!isMounted) return;
        setProductsError(error.message);
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  useEffect(() => {
    if (!selectedProduct) {
      setPriceInput("");
      return;
    }

    setPriceInput(String(selectedProduct.price ?? ""));
  }, [selectedProduct]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitMessage("");

    if (!selectedProductId) {
      setSubmitMessage("Please select a product first.");
      return;
    }

    const numericPrice = Number(priceInput);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setSubmitMessage("Please enter a valid price greater than 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedProduct = await api.updateProductPrice(token, selectedProductId, numericPrice);

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product,
        ),
      );

      setSubmitMessage(
        `Price updated successfully for ${updatedProduct.name}. New price: ${money(updatedProduct.price)}.`,
      );
    } catch (error) {
      setSubmitMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleProductsUpdated(updatedProducts) {
    const productsById = new Map(
      updatedProducts.map((product) => [product.id, product]),
    );

    setProducts((currentProducts) =>
      currentProducts.map((product) => productsById.get(product.id) ?? product),
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-6xl space-y-10">
        <section>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Manager panel
          </p>
          <h1 className="mt-2 text-3xl font-light tracking-tight text-slate-800">
            Sales Manager Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Manage discounts, review invoices, analyze revenue and profit, and update product prices.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
            Signed in as {currentUser?.full_name ?? "Sales manager"}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Product pricing
            </p>
            <h2 className="mt-2 text-2xl font-light tracking-tight text-slate-800">
              Update product prices
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Select a product, enter a new price, and submit the update through the sales manager API.
            </p>
          </div>

          {productsLoading ? (
            <div className="rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-600">
              Loading products...
            </div>
          ) : productsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">
              {productsError}
            </div>
          ) : (
            <form className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">
                    Select product
                  </span>
                  <select
                    value={selectedProductId}
                    onChange={(event) => setSelectedProductId(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500"
                  >
                    <option value="">Choose a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {money(product.price)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">
                    New price
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={priceInput}
                    onChange={(event) => setPriceInput(event.target.value)}
                    placeholder="Enter updated price"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-slate-800 px-5 py-3 text-sm uppercase tracking-[0.22em] text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Updating..." : "Update price"}
                </button>

                {submitMessage && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
                    {submitMessage}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Selected product
                </p>

                {selectedProduct ? (
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</p>
                      <p className="mt-1 font-medium text-slate-900">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Model</p>
                      <p className="mt-1">{selectedProduct.model}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current price</p>
                      <p className="mt-1">{money(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Stock</p>
                      <p className="mt-1">{selectedProduct.quantity_in_stock}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Serial number</p>
                      <p className="mt-1">{selectedProduct.serial_number}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    Select a product to view its current pricing details.
                  </p>
                )}
              </div>
            </form>
          )}
        </section>

        <DiscountManager
          products={products}
          loading={productsLoading}
          error={productsError}
          token={token}
          onProductsUpdated={handleProductsUpdated}
        />
        <InvoiceTable token={token} />
        <SalesAnalytics />
      </div>
    </div>
  );
}

export default SalesManagerPage;
