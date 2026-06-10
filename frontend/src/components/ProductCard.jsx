import { Link } from "react-router-dom";

function ProductCard({ product, isWishlisted = false, onToggleWishlist }) {
  const stockCount = product.stock ?? 0;
  const isOutOfStock = stockCount === 0;
  const isWishlistActive = isWishlisted === true;
  const wishlistLabel = isWishlistActive ? "Remove from wishlist" : "Add to wishlist";
  const wishlistSymbol = isWishlistActive ? "♥" : "♡";

  const handleWishlistClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleWishlist?.(product.id);
  };

  return (
    <article className="group animate-rise-soft relative overflow-hidden rounded-[1.6rem] border border-slate-200/90 bg-white/90 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.42)] transition hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-[0_36px_80px_-48px_rgba(15,23,42,0.5)]">
      <button
        type="button"
        onClick={handleWishlistClick}
        aria-label={wishlistLabel}
        title={wishlistLabel}
        className={`absolute right-4 top-4 z-10 h-10 w-10 rounded-full border text-lg leading-none transition ${
          isWishlistActive
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            : "border-slate-200 bg-white/95 text-slate-400 hover:text-rose-500"
        }`}
      >
        {wishlistSymbol}
      </button>
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fafb,#eef2f2)]">
          <div className="absolute inset-x-8 top-6 h-28 rounded-full bg-white/70 blur-2xl" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
          <img
            src={product.mainImage}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.src = product.fallbackImage;
            }}
            className="relative h-72 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />

          {isOutOfStock && (
            <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-[10px] tracking-[0.2em] text-white uppercase">
              Out of Stock
            </span>
          )}
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="sans-ui text-[10px] tracking-[0.26em] text-slate-400 uppercase">Signature bottle</p>
              <h3 className="mt-2 text-2xl font-light tracking-tight text-slate-900">{product.name}</h3>
            </div>
            <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
              {product.price} {product.currency}
            </p>
          </div>

          {product.volume && (
            <p className="sans-ui text-[11px] tracking-[0.2em] text-slate-500 uppercase">{product.volume}</p>
          )}

          <p className="text-sm leading-7 text-slate-600 line-clamp-2">{product.shortDescription}</p>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {isOutOfStock ? (
              <p className="text-sm font-medium text-red-500">Out of stock</p>
            ) : (
              <p className="text-sm text-emerald-700">In stock: {stockCount}</p>
            )}
            <span className="sans-ui text-[11px] tracking-[0.22em] text-slate-500 uppercase transition group-hover:text-slate-900">
              View product
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;
