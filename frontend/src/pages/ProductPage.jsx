import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const REVIEW_STARS = [1, 2, 3, 4, 5];
const REVIEW_STATUS_LABELS = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
};
const REVIEW_STATUS_MESSAGES = {
  pending: "Your review is waiting for admin approval.",
  approved: "Your approved review is public.",
  rejected: "Your review was rejected. Update it to send it back for approval.",
};

function RatingStars({ rating = 0, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {REVIEW_STARS.map((star) => {
        const isActive = star <= Math.round(rating);
        const className = `text-xl leading-none ${isActive ? "text-amber-500" : "text-slate-300"}`;

        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`h-9 w-9 transition hover:text-amber-500 ${className}`}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            ★
          </button>
        ) : (
          <span key={star} className={className} aria-hidden>
            {isActive ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}

function formatReviewDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ProductPage({
  product,
  searchProps,
  cartCount = 0,
  wishlistCount = 0,
  onCartClick,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}) {
  const { token, currentUser, isLoggedIn, openAuth } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.mainImage ?? product.thumbnails?.[0]);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartSubmitting, setCartSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [deliveredProductIds, setDeliveredProductIds] = useState(new Set());
  const [ordersLoading, setOrdersLoading] = useState(false);

  const refreshReviews = useCallback(async () => {
    const nextReviews = await api.listProductReviews(product.apiId, token);
    setReviews(nextReviews);
    return nextReviews;
  }, [product.apiId, token]);

  useEffect(() => {
    setQuantity(1);
    setSelectedImage(product.mainImage ?? product.thumbnails?.[0]);
    setDetailsOpen(true);
    setCartMessage("");
    setCartError("");
    setReviewMessage("");
    setReviewError("");
  }, [product]);

  useEffect(() => {
    let isMounted = true;

    setReviewsLoading(true);
    setReviewsError("");

    api
      .listProductReviews(product.apiId, token)
      .then((nextReviews) => {
        if (isMounted) {
          setReviews(nextReviews);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setReviewsError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setReviewsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [product.apiId, token]);

  useEffect(() => {
    let isMounted = true;

    if (!isLoggedIn || !token) {
      setDeliveredProductIds(new Set());
      return () => {
        isMounted = false;
      };
    }

    setOrdersLoading(true);
    api
      .getMyOrders(token)
      .then((orders) => {
        if (!isMounted) return;
        const deliveredIds = new Set();
        orders
          .filter((order) => order.status === "delivered")
          .forEach((order) => {
            (order.items ?? []).forEach((item) => {
              if (item.product_id != null) {
                deliveredIds.add(Number(item.product_id));
              }
            });
          });
        setDeliveredProductIds(deliveredIds);
      })
      .catch(() => {
        if (isMounted) {
          setDeliveredProductIds(new Set());
        }
      })
      .finally(() => {
        if (isMounted) {
          setOrdersLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, token]);

  const ownReview = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    return reviews.find((review) => review.user_id === currentUser.id) ?? null;
  }, [currentUser, reviews]);

  const approvedReviews = useMemo(
    () => reviews.filter((review) => review.status === "approved"),
    [reviews],
  );
  const ratingReviews = useMemo(() => (reviews.length > 0 ? reviews : []), [reviews]);
  const canReviewDeliveredProduct =
    currentUser?.role === "admin" || deliveredProductIds.has(Number(product.apiId));

  useEffect(() => {
    if (ownReview) {
      setReviewRating(ownReview.rating);
      setReviewComment(ownReview.comment);
    } else {
      setReviewRating(5);
      setReviewComment("");
    }
  }, [ownReview, product.apiId]);

  const averageRating = useMemo(() => {
    if (ratingReviews.length > 0) {
      const total = ratingReviews.reduce((sum, review) => sum + review.rating, 0);
      return total / ratingReviews.length;
    }

    return product.averageRating ?? 0;
  }, [product.averageRating, ratingReviews]);

  const decreaseQuantity = () => setQuantity((current) => Math.max(1, current - 1));
  const stockCount = product.stock ?? 0;
  const increaseQuantity = () =>
    setQuantity((current) => Math.min(stockCount || 1, current + 1));
  const thumbnails = product.thumbnails ?? [];
  const totalPrice = product.price * quantity;
  const ratingCount = ratingReviews.length || product.ratingCount || 0;
  const ratingCountLabel = `${ratingCount} rating${ratingCount === 1 ? "" : "s"}`;

  const handleAddToCart = async () => {
    if (!onAddToCart) {
      return;
    }

    setCartSubmitting(true);
    setCartMessage("");
    setCartError("");

    try {
      await onAddToCart(product, quantity);
      setCartMessage(`${quantity} item${quantity === 1 ? "" : "s"} added to cart.`);
      onCartClick?.();
    } catch (error) {
      setCartError(error.message);
    } finally {
      setCartSubmitting(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!isLoggedIn || !token) {
      openAuth("login");
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage("");
    setReviewError("");

    try {
      const payload = {
        rating: reviewRating,
      };

      if (ownReview) {
        if (reviewComment !== ownReview.comment) {
          payload.comment = reviewComment;
        }
        await api.updateProductReview(token, product.apiId, ownReview.id, payload);
      } else {
        payload.comment = reviewComment;
        await api.createProductReview(token, product.apiId, payload);
      }

      await refreshReviews();
      const hasComment = reviewComment.trim().length > 0;
      const commentChanged = !ownReview || reviewComment !== ownReview.comment;
      setReviewMessage(
        hasComment && commentChanged ? "Rating saved. Comment submitted for approval." : "Rating saved.",
      );
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!ownReview || !window.confirm("Delete your review?")) {
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage("");
    setReviewError("");

    try {
      await api.deleteProductReview(token, product.apiId, ownReview.id);
      await refreshReviews();
      setReviewRating(5);
      setReviewComment("");
      setReviewMessage("Review deleted.");
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <div className="flex flex-1 flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%]">
          <section className="relative px-6 pb-10 pt-0 sm:px-10 lg:px-14">
            <div className="mt-10 grid grid-cols-[56px_1fr] gap-8 sm:grid-cols-[70px_1fr] lg:mt-14">
              <div className="flex flex-col gap-3">
                {thumbnails.map((thumbnail, index) => (
                  <button
                    type="button"
                    key={`${index}-${thumbnail}`}
                    className={`flex h-12 w-12 items-center justify-center overflow-hidden border bg-white shadow-sm sm:h-14 sm:w-14 ${selectedImage === thumbnail ? "border-slate-700" : "border-slate-300 hover:border-slate-500"}`}
                    onClick={() => setSelectedImage(thumbnail)}
                  >
                    <img
                      src={thumbnail}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      onError={(event) => {
                        event.currentTarget.src = product.fallbackImage;
                      }}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className="relative flex min-h-[34rem] items-center justify-center overflow-hidden border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(241,245,244,0.95)_55%,_rgba(233,239,238,1))]">
                <div className="absolute inset-x-16 top-8 h-32 rounded-full bg-white/70 blur-3xl" />
                <img
                  src={selectedImage}
                  alt={product.name}
                  onError={(event) => {
                    event.currentTarget.src = product.fallbackImage;
                  }}
                  className="relative h-[440px] w-[280px] object-contain sm:h-[500px] sm:w-[320px]"
                />
              </div>
            </div>
          </section>

          <aside className="border-l border-slate-200/80 bg-white/80 px-6 pb-10 pt-0 backdrop-blur sm:px-10">
            <div className="mx-auto mt-10 max-w-md">
              <p className="text-[11px] tracking-[0.3em] text-slate-500 uppercase">Product spotlight</p>
              <h1 className="mt-4 text-5xl font-light tracking-tight text-slate-900">{product.name}</h1>
              <p className="mt-4 text-[11px] tracking-[0.24em] text-slate-500 uppercase">
                {product.volume} • {product.price} {product.currency}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <RatingStars rating={averageRating} />
                <span>{ratingCount > 0 ? `${averageRating.toFixed(1)} (${ratingCountLabel})` : "No ratings yet"}</span>
              </div>

              <p className="mt-8 text-lg leading-relaxed text-slate-600">{product.shortDescription}</p>

              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="text-slate-300">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 border border-slate-200 bg-[#f8faf9] p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <span className="text-sm text-slate-500">Quantity</span>
                  <div className="flex items-center gap-4 text-sm">
                    <button type="button" className="text-slate-400 hover:text-slate-700" onClick={decreaseQuantity}>
                      -
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={increaseQuantity}
                      disabled={stockCount === 0 || quantity >= stockCount}
                    >
                      +
                    </button>
                  </div>
                </div>

                {stockCount === 0 ? (
                  <p className="mt-4 text-sm font-medium text-red-500">Out of Stock</p>
                ) : (
                  <p className="mt-4 text-sm text-emerald-700">In Stock: {stockCount}</p>
                )}

                <button
                  type="button"
                  className="mt-5 w-full rounded-full bg-slate-900 px-4 py-3.5 text-xs tracking-[0.25em] text-white uppercase transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleAddToCart}
                  disabled={stockCount === 0 || cartSubmitting}
                >
                  {stockCount === 0
                    ? "Out of Stock"
                    : cartSubmitting
                      ? "Adding"
                      : `Add to Cart • ${totalPrice} ${product.currency}`}
                </button>

                <button
                  type="button"
                  className={`mt-3 w-full rounded-full border px-4 py-3 text-xs tracking-[0.2em] uppercase transition ${
                    isWishlisted
                      ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-500"
                  }`}
                  onClick={() => onToggleWishlist?.(product.id)}
                >
                  {isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                </button>
              </div>

              {cartMessage && (
                <p className="mt-3 text-sm text-emerald-700" aria-live="polite">
                  {cartMessage}
                </p>
              )}
              {cartError && (
                <p className="mt-3 text-sm text-red-500" aria-live="polite">
                  {cartError}
                </p>
              )}

              <button type="button" className="mt-5 w-full text-center text-xs tracking-[0.22em] text-slate-500 uppercase underline underline-offset-4 hover:text-slate-700">
                Find Nearest Store
              </button>

              <div className="mt-10 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() => setDetailsOpen((open) => !open)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                  aria-expanded={detailsOpen}
                  aria-controls="product-details-content"
                >
                  <h2 className="text-3xl font-light text-slate-700">Product Details</h2>
                  <span className="shrink-0 text-xl text-slate-400 transition hover:text-slate-600" aria-hidden>
                    {detailsOpen ? "−" : "+"}
                  </span>
                </button>
                <div
                  id="product-details-content"
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${detailsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{product.details}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="border-t border-slate-200 bg-white px-6 py-10 sm:px-10 lg:px-14">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-slate-500 uppercase">Customer reviews</p>
              <h2 className="mt-3 text-3xl font-light tracking-tight text-slate-800">
                {ratingCount > 0 ? `${averageRating.toFixed(1)} out of 5` : "No ratings yet"}
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <RatingStars rating={averageRating} />
                <span>{ratingCountLabel}</span>
              </div>

              <form className="mt-8 border border-slate-200 bg-slate-50 p-5" onSubmit={handleReviewSubmit}>
                <h3 className="text-lg font-medium text-slate-800">
                  {ownReview ? "Edit your review" : "Write a review"}
                </h3>
                {ownReview && (
                  <p className="mt-2 text-sm text-slate-500">
                    {REVIEW_STATUS_MESSAGES[ownReview.status] ?? REVIEW_STATUS_LABELS[ownReview.status] ?? ""}
                  </p>
                )}

                {isLoggedIn ? (
                  <>
                    {!canReviewDeliveredProduct && (
                      <div className="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                        You can rate and comment on this product after your order is delivered.
                      </div>
                    )}
                    <div className="mt-5">
                      <RatingStars rating={reviewRating} interactive onChange={setReviewRating} />
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Share your thoughts about this perfume (optional)"
                      rows="5"
                      maxLength="2000"
                      className="mt-5 w-full border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-slate-500"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={reviewSubmitting || ordersLoading || !canReviewDeliveredProduct}
                        className="rounded-full bg-slate-900 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reviewSubmitting
                          ? "Saving"
                          : ownReview
                            ? "Save rating"
                            : "Save rating"}
                      </button>
                      {ownReview && (
                        <button
                          type="button"
                          onClick={handleDeleteReview}
                          disabled={reviewSubmitting}
                          className="rounded-full border border-red-200 bg-white px-5 py-3 text-xs tracking-[0.2em] text-red-600 uppercase disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete review
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuth("login")}
                    className="mt-5 rounded-full bg-slate-900 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase"
                  >
                    Sign in to review
                  </button>
                )}

                {reviewMessage && (
                  <p className="mt-4 text-sm text-emerald-700" aria-live="polite">
                    {reviewMessage}
                  </p>
                )}
                {reviewError && (
                  <p className="mt-4 text-sm text-red-500" aria-live="polite">
                    {reviewError}
                  </p>
                )}
              </form>
            </div>

            <div className="space-y-4">
              {reviewsLoading ? (
                <div className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Loading reviews.
                </div>
              ) : reviewsError ? (
                <div className="border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                  {reviewsError}
                </div>
              ) : approvedReviews.length === 0 ? (
                <div className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  No customer comments yet.
                </div>
              ) : (
                approvedReviews.map((review) => (
                  <article key={review.id} className="border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-slate-800">{review.user_full_name}</h3>
                        <p className="mt-1 text-xs tracking-[0.18em] text-slate-400 uppercase">
                          {formatReviewDate(review.updated_at)}
                        </p>
                      </div>
                      <RatingStars rating={review.rating} />
                    </div>
                    {review.comment.trim() ? (
                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{review.comment}</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

export default ProductPage;
