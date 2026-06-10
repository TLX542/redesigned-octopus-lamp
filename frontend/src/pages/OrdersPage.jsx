import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const ORDER_STATUS_LABELS = {
  processing: "Processing",
  "in-transit": "In Transit",
  delivered: "Delivered",
};

const ORDER_STATUS_CLASSES = {
  processing: "border-amber-200 bg-amber-50 text-amber-700",
  "in-transit": "border-sky-200 bg-sky-50 text-sky-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function formatOrderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrdersPage({ searchProps, cartCount = 0, wishlistCount = 0, onCartClick }) {
  const { token, isLoggedIn, openAuth } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn || !token) {
      return;
    }

    let isMounted = true;

    api
      .getMyOrders(token)
      .then((nextOrders) => {
        if (isMounted) {
          setError("");
          setOrders(nextOrders);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, token]);

  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex-1 px-6 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] tracking-[0.3em] text-slate-500 uppercase">Order history</p>
          <h1 className="mt-3 text-4xl font-light tracking-tight text-slate-800">My Orders</h1>

          {!isLoggedIn ? (
            <div className="mt-8 border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">Sign in to view your order history.</p>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="mt-5 rounded-full bg-slate-900 px-6 py-3 text-xs tracking-[0.2em] text-white uppercase"
              >
                Sign in
              </button>
            </div>
          ) : loading ? (
            <div className="mt-8 border border-slate-200 bg-white p-8 text-sm text-slate-600">
              Loading orders.
            </div>
          ) : error ? (
            <div className="mt-8 border border-red-100 bg-red-50 p-8 text-sm text-red-600">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-8 border border-slate-200 bg-white p-8 text-sm text-slate-600">
              No orders yet.
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {orders.map((order) => (
                <article key={order.id} className="border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">
                        Order #{order.id}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{formatOrderDate(order.created_at)}</p>
                    </div>
                    <span
                      className={`inline-flex border px-3 py-1 text-[11px] tracking-[0.18em] uppercase ${
                        ORDER_STATUS_CLASSES[order.status] ?? "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm text-slate-600">
                        <span>
                          {item.product_name} &times; {item.quantity}
                        </span>
                        <span>{Number(item.unit_price * item.quantity).toFixed(2)} USD</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-500">Total</span>
                    <span className="font-medium text-slate-900">{Number(order.total_amount).toFixed(2)} USD</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}

export default OrdersPage;
