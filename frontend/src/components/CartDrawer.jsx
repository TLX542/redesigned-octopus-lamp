import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function CartDrawer({ open, cart, products, removingItemId = null, onClose, onRemoveItem }) {
  const { isLoggedIn } = useAuth();
  const productsByApiId = new Map(products.map((product) => [product.apiId, product]));
  const items = cart?.items ?? [];
  const totalAmount = Number(cart?.total_amount ?? 0);
  const navigate = useNavigate();

  return (
    <>
      <div
        role="presentation"
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,248,0.98))] shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
        aria-modal={open}
        role="dialog"
        aria-labelledby="cart-drawer-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 id="cart-drawer-title" className="text-3xl font-light tracking-tight text-slate-800">
            Cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700"
            aria-label="Close cart"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="border border-slate-200 bg-slate-50 px-5 py-6 text-sm leading-7 text-slate-600">
              Your cart is empty.
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => {
                const product = productsByApiId.get(item.product_id);
                const unitPrice = Number(item.unit_price);

                return (
                  <div key={item.id} className="flex gap-4 border-b border-slate-200 pb-5">
                    {product && (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.src = product.fallbackImage;
                        }}
                        className="h-20 w-16 shrink-0 object-cover"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">
                        {product?.name ?? `Product #${item.product_id}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Quantity: {item.quantity}</p>
                      <p className="mt-1 text-sm text-slate-500">{unitPrice} USD each</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem?.(item.id)}
                      disabled={removingItemId === item.id}
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-200 text-lg leading-none text-slate-400 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove ${product?.name ?? `product ${item.product_id}`} from cart`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white/80 px-6 py-5 backdrop-blur">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Total</span>
            <span className="font-medium text-slate-900">{totalAmount} USD</span>
          </div>

          <div className="group relative mt-4">
            {!isLoggedIn && items.length > 0 && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 w-max max-w-[15rem] -translate-x-1/2 rounded-md bg-slate-900 px-3 py-2 text-center text-xs leading-5 text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
                You need to log in to complete checkout.
                <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-900" />
              </div>
            )}
            <button
              type="button"
              disabled={items.length === 0}
              title={!isLoggedIn && items.length > 0 ? "You need to log in to complete checkout." : undefined}
              onClick={() => {
                onClose?.();
                navigate("/checkout");
              }}
              className="w-full rounded-full bg-slate-900 px-4 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Checkout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default CartDrawer;