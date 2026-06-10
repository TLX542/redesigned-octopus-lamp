import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const adminTabs = [
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "reviews", label: "Reviews" },
  { id: "users", label: "Users" },
  { id: "orders", label: "Orders" },
];

const reviewRatings = [1, 2, 3, 4, 5];
const reviewStatuses = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];
const reviewStatusLabels = Object.fromEntries(
  reviewStatuses.map((status) => [status.value, status.label]),
);
const reviewStatusClasses = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const orderStatuses = [
  { value: "processing", label: "Processing" },
  { value: "in-transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
];
const orderStatusLabels = Object.fromEntries(
  orderStatuses.map((s) => [s.value, s.label]),
);
const orderStatusClasses = {
  processing: "border-amber-200 bg-amber-50 text-amber-700",
  "in-transit": "border-sky-200 bg-sky-50 text-sky-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const emptyProductForm = {
  name: "",
  model: "",
  serial_number: "",
  description: "",
  quantity_in_stock: "0",
  price: "",
  warranty_status: "",
  distributor_info: "",
  category_id: "",
};

const emptyCategoryForm = {
  name: "",
  description: "",
};

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

function ProductForm({ form, categories, isSaving, editingId, onChange, onSubmit, onCancel }) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Product name"
          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          required
        />
        <input
          name="model"
          value={form.model}
          onChange={onChange}
          placeholder="Model / volume"
          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          required
        />
        <input
          name="serial_number"
          value={form.serial_number}
          onChange={onChange}
          placeholder="Serial number"
          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          required
        />
        <select
          name="category_id"
          value={form.category_id}
          onChange={onChange}
          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          required
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          name="quantity_in_stock"
          type="number"
          min="0"
          value={form.quantity_in_stock}
          onChange={onChange}
          placeholder="Stock"
          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          required
        />
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={onChange}
          placeholder="Price"
          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          required
        />
        <input
          name="warranty_status"
          value={form.warranty_status}
          onChange={onChange}
          placeholder="Warranty status"
          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          required
        />
        <input
          name="distributor_info"
          value={form.distributor_info}
          onChange={onChange}
          placeholder="Distributor info"
          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          required
        />
      </div>

      <textarea
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Description"
        rows="5"
        className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
        required
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-slate-900 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving" : editingId ? "Update product" : "Create product"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-300 px-5 py-3 text-xs tracking-[0.2em] text-slate-700 uppercase"
          >
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}

function CategoryForm({ form, isSaving, editingId, onChange, onSubmit, onCancel }) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <input
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="Category name"
        className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
        required
      />
      <textarea
        name="description"
        value={form.description}
        onChange={onChange}
        placeholder="Category description"
        rows="4"
        className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-slate-900 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving" : editingId ? "Update category" : "Create category"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-300 px-5 py-3 text-xs tracking-[0.2em] text-slate-700 uppercase"
          >
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}

function AdminPage({ searchProps, cartCount = 0, wishlistCount = 0, onCartClick, onCatalogChange }) {
  const { token, currentUser, refreshCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [userDrafts, setUserDrafts] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );

  const loadAdminData = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [nextProducts, nextCategories, nextUsers, nextReviews, nextOrders] = await Promise.all([
        api.listAdminProducts(token),
        api.listAdminCategories(token),
        api.listAdminUsers(token),
        api.listAdminReviews(token),
        api.listAdminOrders(token),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setUsers(nextUsers);
      setReviews(nextReviews);
      setAdminOrders(nextOrders);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    setUserDrafts(
      Object.fromEntries(
        users.map((user) => [
          user.id,
          {
            full_name: user.full_name,
            email: user.email,
            role: user.role,
          },
        ]),
      ),
    );
  }, [users]);

  useEffect(() => {
    setReviewDrafts(
      Object.fromEntries(
        reviews.map((review) => [
          review.id,
          {
            rating: String(review.rating),
            comment: review.comment,
            status: review.status ?? "pending",
          },
        ]),
      ),
    );
  }, [reviews]);

  const handleProductFormChange = (event) => {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  };

  const handleCategoryFormChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((current) => ({ ...current, [name]: value }));
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSavingKey("product");

    try {
      const payload = {
        ...productForm,
        quantity_in_stock: Number(productForm.quantity_in_stock),
        price: productForm.price,
        category_id: Number(productForm.category_id),
      };

      if (editingProductId) {
        await api.updateAdminProduct(token, editingProductId, payload);
        setNotice("Product updated.");
      } else {
        await api.createAdminProduct(token, payload);
        setNotice("Product created.");
      }

      resetProductForm();
      await loadAdminData();
      await onCatalogChange?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSavingKey("");
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSavingKey("category");

    try {
      if (editingCategoryId) {
        await api.updateAdminCategory(token, editingCategoryId, categoryForm);
        setNotice("Category updated.");
      } else {
        await api.createAdminCategory(token, categoryForm);
        setNotice("Category created.");
      }

      resetCategoryForm();
      await loadAdminData();
      await onCatalogChange?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSavingKey("");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    setError("");
    setNotice("");
    setSavingKey(`delete-product-${productId}`);

    try {
      await api.deleteAdminProduct(token, productId);
      setNotice("Product deleted.");
      await loadAdminData();
      await onCatalogChange?.();
      if (editingProductId === productId) {
        resetProductForm();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSavingKey("");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    setError("");
    setNotice("");
    setSavingKey(`delete-category-${categoryId}`);

    try {
      await api.deleteAdminCategory(token, categoryId);
      setNotice("Category deleted.");
      await loadAdminData();
      await onCatalogChange?.();
      if (editingCategoryId === categoryId) {
        resetCategoryForm();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSavingKey("");
    }
  };

  const handleUserDraftChange = (userId, field, value) => {
    setUserDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        [field]: value,
      },
    }));
  };

  const handleSaveUser = async (userId) => {
    const draft = userDrafts[userId];
    if (!draft) {
      return;
    }

    setError("");
    setNotice("");
    setSavingKey(`user-${userId}`);

    try {
      await api.updateAdminUser(token, userId, draft);
      setNotice("User updated.");
      await loadAdminData();
      if (currentUser?.id === userId) {
        await refreshCurrentUser();
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingKey("");
    }
  };

  const handleReviewDraftChange = (reviewId, field, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [reviewId]: {
        ...current[reviewId],
        [field]: value,
      },
    }));
  };

  const handleSaveReview = async (reviewId) => {
    const draft = reviewDrafts[reviewId];
    if (!draft) {
      return;
    }

    setError("");
    setNotice("");
    setSavingKey(`review-${reviewId}`);

    try {
      await api.updateAdminReview(token, reviewId, {
        rating: Number(draft.rating),
        comment: draft.comment,
        status: draft.status,
      });
      setNotice("Review updated.");
      await loadAdminData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingKey("");
    }
  };

  const handleSetReviewStatus = async (reviewId, status) => {
    setError("");
    setNotice("");
    setSavingKey(`review-status-${reviewId}-${status}`);

    try {
      await api.updateAdminReview(token, reviewId, { status });
      setNotice(`Review ${reviewStatusLabels[status].toLowerCase()}.`);
      await loadAdminData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingKey("");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) {
      return;
    }

    setError("");
    setNotice("");
    setSavingKey(`delete-review-${reviewId}`);

    try {
      await api.deleteAdminReview(token, reviewId);
      setNotice("Review deleted.");
      await loadAdminData();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSavingKey("");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setError("");
    setNotice("");
    setSavingKey(`order-status-${orderId}-${newStatus}`);

    try {
      await api.updateAdminOrderStatus(token, orderId, newStatus);
      setNotice(`Order #${orderId} status updated to ${orderStatusLabels[newStatus] ?? newStatus}.`);
      await loadAdminData();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSavingKey("");
    }
  };

  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex-1 px-6 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-8 py-10 text-white shadow-xl">
            <p className="text-[11px] tracking-[0.3em] text-slate-300 uppercase">Admin Console</p>
            <h1 className="mt-4 text-4xl font-light tracking-tight">Catalog and account control</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">
              Manage products, categories, and user roles from one internal dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs tracking-[0.2em] uppercase">
              <span className="rounded-full border border-white/20 px-4 py-2 text-slate-200">
                Signed in as {currentUser?.full_name ?? currentUser?.email}
              </span>
              <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-emerald-100">
                {products.length} products
              </span>
              <span className="rounded-full border border-sky-300/40 bg-sky-400/10 px-4 py-2 text-sky-100">
                {categories.length} categories
              </span>
              <span className="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/10 px-4 py-2 text-fuchsia-100">
                {reviews.length} reviews
              </span>
              <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-amber-100">
                {users.length} users
              </span>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-3 text-xs tracking-[0.2em] uppercase transition ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-600 hover:border-slate-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {notice && <p className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{notice}</p>}
          {error && <p className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-600">{error}</p>}

          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-12 text-sm text-slate-600 shadow-sm">
              Loading admin data.
            </div>
          ) : activeTab === "products" ? (
            <div className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Product editor</p>
                <h2 className="mt-3 text-2xl font-light tracking-tight text-slate-800">
                  {editingProductId ? "Edit product" : "Add product"}
                </h2>
                <div className="mt-6">
                  <ProductForm
                    form={productForm}
                    categories={categories}
                    isSaving={savingKey === "product"}
                    editingId={editingProductId}
                    onChange={handleProductFormChange}
                    onSubmit={handleProductSubmit}
                    onCancel={resetProductForm}
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Current catalog</p>
                <div className="mt-6 space-y-4">
                  {products.map((product) => (
                    <article key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-medium text-slate-800">{product.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {product.model} · {product.price} USD · {categoryNameById.get(product.category_id) ?? "Uncategorized"}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProductId(product.id);
                              setProductForm({
                                name: product.name,
                                model: product.model,
                                serial_number: product.serial_number,
                                description: product.description,
                                quantity_in_stock: String(product.quantity_in_stock),
                                price: String(product.price),
                                warranty_status: product.warranty_status,
                                distributor_info: product.distributor_info,
                                category_id: String(product.category_id),
                              });
                            }}
                            className="border border-slate-300 px-4 py-2 text-xs tracking-[0.2em] text-slate-700 uppercase"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={savingKey === `delete-product-${product.id}`}
                            className="bg-red-600 px-4 py-2 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : activeTab === "categories" ? (
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Category editor</p>
                <h2 className="mt-3 text-2xl font-light tracking-tight text-slate-800">
                  {editingCategoryId ? "Edit category" : "Add category"}
                </h2>
                <div className="mt-6">
                  <CategoryForm
                    form={categoryForm}
                    isSaving={savingKey === "category"}
                    editingId={editingCategoryId}
                    onChange={handleCategoryFormChange}
                    onSubmit={handleCategorySubmit}
                    onCancel={resetCategoryForm}
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Category list</p>
                <div className="mt-6 space-y-4">
                  {categories.map((category) => (
                    <article key={category.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-medium text-slate-800">{category.name}</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {category.description || "No description provided."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              setCategoryForm({
                                name: category.name,
                                description: category.description ?? "",
                              });
                            }}
                            className="border border-slate-300 px-4 py-2 text-xs tracking-[0.2em] text-slate-700 uppercase"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={savingKey === `delete-category-${category.id}`}
                            className="bg-red-600 px-4 py-2 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : activeTab === "reviews" ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Review moderation</p>
              <div className="mt-6 space-y-4">
                {reviews.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    No product reviews yet.
                  </div>
                ) : (
                  reviews.map((review) => {
                    const draft = reviewDrafts[review.id] ?? {
                      rating: String(review.rating),
                      comment: review.comment,
                      status: review.status ?? "pending",
                    };

                    return (
                      <article key={review.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-medium text-slate-800">
                              {productNameById.get(review.product_id) ?? `Product #${review.product_id}`}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {review.user_full_name} · {formatReviewDate(review.updated_at)}
                            </p>
                            <span
                              className={`mt-3 inline-flex border px-3 py-1 text-[11px] tracking-[0.18em] uppercase ${
                                reviewStatusClasses[review.status] ?? "border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              {reviewStatusLabels[review.status] ?? review.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <select
                              value={draft.status}
                              onChange={(event) =>
                                handleReviewDraftChange(review.id, "status", event.target.value)
                              }
                              className="border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                            >
                              {reviewStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={draft.rating}
                              onChange={(event) =>
                                handleReviewDraftChange(review.id, "rating", event.target.value)
                              }
                              className="border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                            >
                              {reviewRatings.map((rating) => (
                                <option key={rating} value={String(rating)}>
                                  {rating} star{rating === 1 ? "" : "s"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <textarea
                          value={draft.comment}
                          onChange={(event) =>
                            handleReviewDraftChange(review.id, "comment", event.target.value)
                          }
                          placeholder="Rating-only review. Admin can add an internal moderation note or leave this blank."
                          rows="4"
                          maxLength="2000"
                          className="mt-4 w-full border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-slate-500"
                        />

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetReviewStatus(review.id, "approved")}
                            disabled={
                              review.status === "approved" || savingKey === `review-status-${review.id}-approved`
                            }
                            className="bg-emerald-600 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetReviewStatus(review.id, "rejected")}
                            disabled={
                              review.status === "rejected" || savingKey === `review-status-${review.id}-rejected`
                            }
                            className="bg-red-600 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveReview(review.id)}
                            disabled={savingKey === `review-${review.id}`}
                            className="bg-slate-900 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={savingKey === `delete-review-${review.id}`}
                            className="bg-red-600 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ) : activeTab === "users" ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">User management</p>
              <div className="mt-6 space-y-4">
                {users.map((user) => {
                  const draft = userDrafts[user.id] ?? {
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                  };

                  return (
                    <article key={user.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_220px_auto]">
                        <input
                          value={draft.full_name}
                          onChange={(event) =>
                            handleUserDraftChange(user.id, "full_name", event.target.value)
                          }
                          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                        />
                        <input
                          value={draft.email}
                          onChange={(event) =>
                            handleUserDraftChange(user.id, "email", event.target.value)
                          }
                          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                        />
                        <select
                          value={draft.role}
                          onChange={(event) =>
                            handleUserDraftChange(user.id, "role", event.target.value)
                          }
                          className="w-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                        >
                          <option value="customer">customer</option>
                          <option value="sales_manager">sales manager</option>
                          <option value="product_manager">product manager</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveUser(user.id)}
                          disabled={savingKey === `user-${user.id}`}
                          className="bg-slate-900 px-5 py-3 text-xs tracking-[0.2em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Delivery management</p>
              <div className="mt-6 space-y-4">
                {adminOrders.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    No orders yet.
                  </div>
                ) : (
                  adminOrders.map((order) => (
                    <article key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-medium text-slate-800">Order #{order.id}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {order.user_id ? `User #${order.user_id}` : "Guest"} &middot;{" "}
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <span
                            className={`mt-3 inline-flex border px-3 py-1 text-[11px] tracking-[0.18em] uppercase ${
                              orderStatusClasses[order.status] ?? "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {orderStatusLabels[order.status] ?? order.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">
                            {Number(order.total_amount).toFixed(2)} USD
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1 border-t border-slate-200 pt-4">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-sm text-slate-600">
                            {item.product_name} &times; {item.quantity} &mdash; {Number(item.unit_price).toFixed(2)} USD each
                          </p>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {orderStatuses.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            disabled={order.status === s.value || savingKey === `order-status-${order.id}-${s.value}`}
                            onClick={() => handleUpdateOrderStatus(order.id, s.value)}
                            className={`px-4 py-2 text-xs tracking-[0.18em] uppercase disabled:cursor-not-allowed disabled:opacity-50 ${
                              order.status === s.value
                                ? "bg-slate-200 text-slate-500"
                                : "bg-slate-900 text-white hover:bg-slate-700"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </PageShell>
  );
}

export default AdminPage;