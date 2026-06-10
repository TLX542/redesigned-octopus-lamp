import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import {
  buildInvoicePdfDataUrl,
  enrichInvoiceItems,
  formatInvoiceDate,
} from "../lib/invoicePdf";

function CheckoutPage({
  searchProps,
  cartCount = 0,
  wishlistCount = 0,
  onCartClick,
  onCheckout,
  isCheckingOut = false,
  checkoutMessage = "",
  products = [],
}) {
  const { isLoggedIn, openAuth, currentUser } = useAuth();
  const navigate = useNavigate();

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const productsByApiId = new Map(products.map((product) => [product.apiId, product]));
  const invoiceItems = enrichInvoiceItems(invoice, productsByApiId);
  const invoicePdfUrl = invoice ? buildInvoicePdfDataUrl(invoice, productsByApiId) : "";

  const handleMockPayment = async () => {
    setError("");

    const paymentFields = [cardName, cardNumber, expiry, cvv];

    if (paymentFields.some((field) => field.trim().length < 3)) {
      setError("Please enter at least 3 characters in each payment field.");
      return;
    }

    try {
      const result = await onCheckout();
      setInvoice(result);
      setPaymentComplete(true);
    } catch (err) {
      setError(err.message || "Checkout failed.");
    }
  };

  if (!isLoggedIn) {
    return (
      <PageShell
        searchProps={searchProps}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
      >
        <main className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-14">
          <div className="max-w-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Checkout
            </p>
            <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">
              Sign in required
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Users must log in before completing the checkout process.
            </p>

            <button
              type="button"
              onClick={openAuth}
              className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-slate-700"
            >
              Sign In to Continue
            </button>
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
      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <div className="border border-slate-200 bg-white px-8 py-10 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Checkout
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-slate-700">
              Mock Payment Page
            </h1>

            {!paymentComplete ? (
              <>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  This is a mock payment step for the checkout flow. When payment is
                  confirmed, the system creates the order and returns invoice data.
                </p>

                <div className="mt-8 grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      minLength={3}
                      required
                      className="w-full border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      minLength={3}
                      required
                      className="w-full border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                      placeholder="1111 2222 3333 4444"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        minLength={3}
                        required
                        className="w-full border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                        placeholder="MM/YY"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        minLength={3}
                        required
                        className="w-full border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                {(error || checkoutMessage) && (
                  <p className="mt-4 text-sm text-rose-600">{error || checkoutMessage}</p>
                )}

                <button
                  type="button"
                  onClick={handleMockPayment}
                  disabled={isCheckingOut}
                  className="mt-8 rounded-full bg-slate-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCheckingOut ? "Processing..." : "Complete Mock Payment"}
                </button>
              </>
            ) : (
              invoice && (
                <div className="mt-8">
                  <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700">
                        Payment confirmed
                      </p>
                      <h2 className="mt-3 text-3xl font-light tracking-tight text-slate-800">
                        Invoice
                      </h2>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                        Thank you for shopping with us. Your order has been created,
                        and a PDF copy of this invoice has been emailed to your registered address.
                      </p>
                      {checkoutMessage && (
                        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                          {checkoutMessage}
                        </p>
                      )}
                    </div>
                    <div className="border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
                      <p><strong>Order ID:</strong> {invoice.order_id}</p>
                      <p><strong>Status:</strong> {invoice.status}</p>
                      <p><strong>Date:</strong> {formatInvoiceDate(invoice.created_at)}</p>
                    </div>
                  </div>

                  <div className="grid gap-6 border-b border-slate-200 py-8 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                        Customer
                      </h3>
                      <div className="mt-4 text-sm leading-7 text-slate-700">
                        <p>{invoice.customer_name ?? currentUser?.full_name ?? "Customer"}</p>
                        <p>{invoice.customer_email ?? currentUser?.email}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                        Summary
                      </h3>
                      <div className="mt-4 text-sm leading-7 text-slate-700">
                        <p><strong>Item Count:</strong> {invoice.item_count}</p>
                        <p><strong>Total:</strong> {Number(invoice.total_amount).toFixed(2)} USD</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto py-8">
                    <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-4 py-3 font-medium">Product</th>
                          <th className="px-4 py-3 font-medium">Quantity</th>
                          <th className="px-4 py-3 font-medium">Unit Price</th>
                          <th className="px-4 py-3 text-right font-medium">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceItems.map((item, index) => (
                          <tr key={`${item.product_id}-${index}`} className="border-b border-slate-100">
                            <td className="px-4 py-4 text-slate-800">{item.product_name}</td>
                            <td className="px-4 py-4 text-slate-600">{item.quantity}</td>
                            <td className="px-4 py-4 text-slate-600">
                              {Number(item.unit_price).toFixed(2)} USD
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-slate-800">
                              {Number(item.line_total).toFixed(2)} USD
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-6 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <a
                      href={invoicePdfUrl}
                      download={`${invoice.order_id}-invoice.pdf`}
                      className="rounded-full border border-slate-300 bg-white px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                    >
                      Download Invoice PDF
                    </a>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total paid</p>
                      <p className="mt-2 text-2xl font-light tracking-tight text-slate-900">
                        {Number(invoice.total_amount).toFixed(2)} USD
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="rounded-full bg-slate-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-slate-700"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export default CheckoutPage;
