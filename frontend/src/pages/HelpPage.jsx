import PageShell from "../components/PageShell";

function HelpPage({
  searchProps,
  cartCount = 0,
  wishlistCount = 0,
  onCartClick,
}) {
  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto w-full max-w-4xl">
          <section className="mb-10">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Help center
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-slate-800">
              Customer Support & Project Status
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              This page provides basic guidance for users and also reflects the
              current implementation status of key flows in the system.
            </p>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-medium text-slate-800">Shopping & Cart</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Users can browse products, search the catalog, add items to the
                cart, and remove items from the cart drawer.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-medium text-slate-800">Checkout Status</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                A checkout page is now available and the cart drawer checkout
                button directs users to this flow.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Payment processing and invoice generation are still pending
                backend integration, so the current checkout page acts as the
                frontend entry point of the checkout flow.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-medium text-slate-800">Orders & Invoices</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Invoice-related interfaces exist in the management side of the
                project, but full order creation, payment completion, and invoice
                generation are not yet connected end-to-end.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-medium text-slate-800">Notifications</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Wishlist-based in-app notifications are supported, while email
                notification support is still pending backend mailing
                integration.
              </p>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export default HelpPage;