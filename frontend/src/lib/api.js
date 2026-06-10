const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function request(path, options = {}) {
  const { token, ...fetchOptions } = options;
  const authHeaders = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
  const headers = {
    ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
    ...authHeaders,
    ...(fetchOptions.headers ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    body:
      fetchOptions.body && typeof fetchOptions.body !== "string"
        ? JSON.stringify(fetchOptions.body)
        : fetchOptions.body,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.detail ?? `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  listProducts(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.categoryId) {
      searchParams.set("category_id", String(params.categoryId));
    }
    const queryString = searchParams.toString();
    return request(`/products${queryString ? `?${queryString}` : ""}`);
  },

  updateProductPrice(token, productId, price) {
    return request(`/products/${productId}/price`, {
      method: "PATCH",
      token,
      body: { price },
    });
  },

  applyProductDiscount(token, productIds, discountRate) {
    return request("/products/discounts", {
      method: "PATCH",
      token,
      body: {
        product_ids: productIds,
        discount_rate: discountRate,
      },
    });
  },

  listWishlist(token) {
    return request("/wishlist", {
      token,
    });
  },

  addWishlistItem(token, productId) {
    return request("/wishlist/items", {
      method: "POST",
      token,
      body: {
        product_id: productId,
      },
    });
  },

  removeWishlistItem(token, productId) {
    return request(`/wishlist/items/${productId}`, {
      method: "DELETE",
      token,
    });
  },

  listDiscountNotifications(token) {
    return request("/notifications/discounts", {
      token,
    });
  },

  markDiscountNotificationsRead(token) {
    return request("/notifications/discounts/read", {
      method: "PATCH",
      token,
    });
  },

  listProductReviews(productId, token) {
    return request(`/products/${productId}/reviews`, {
      token,
    });
  },

  createProductReview(token, productId, payload) {
    return request(`/products/${productId}/reviews`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateProductReview(token, productId, reviewId, payload) {
    return request(`/products/${productId}/reviews/${reviewId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  deleteProductReview(token, productId, reviewId) {
    return request(`/products/${productId}/reviews/${reviewId}`, {
      method: "DELETE",
      token,
    });
  },

  listCategories() {
    return request("/categories");
  },

  getCart(cartId) {
    return request(`/carts/${cartId}`);
  },

  addCartItem(cartId, productId, quantity) {
    return request(`/carts/${cartId}/items`, {
      method: "POST",
      body: {
        product_id: productId,
        quantity,
      },
    });
  },

  removeCartItem(cartId, itemId) {
    return request(`/carts/${cartId}/items/${itemId}`, {
      method: "DELETE",
    });
  },

  checkoutCart(cartId, token) {
    return request(`/carts/${cartId}/checkout`, {
      method: "POST",
      token,
    });
  },

  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    });
  },

  register(payload) {
    return request("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  getCurrentUser(token) {
    return request("/users/me", {
      token,
    });
  },

  listAdminProducts(token) {
    return request("/admin/products", {
      token,
    });
  },

  createAdminProduct(token, payload) {
    return request("/admin/products", {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateAdminProduct(token, productId, payload) {
    return request(`/admin/products/${productId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  deleteAdminProduct(token, productId) {
    return request(`/admin/products/${productId}`, {
      method: "DELETE",
      token,
    });
  },

  listAdminCategories(token) {
    return request("/admin/categories", {
      token,
    });
  },

  createAdminCategory(token, payload) {
    return request("/admin/categories", {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateAdminCategory(token, categoryId, payload) {
    return request(`/admin/categories/${categoryId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  deleteAdminCategory(token, categoryId) {
    return request(`/admin/categories/${categoryId}`, {
      method: "DELETE",
      token,
    });
  },

  listAdminUsers(token) {
    return request("/admin/users", {
      token,
    });
  },

  updateAdminUser(token, userId, payload) {
    return request(`/admin/users/${userId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  listAdminReviews(token) {
    return request("/admin/reviews", {
      token,
    });
  },

  updateAdminReview(token, reviewId, payload) {
    return request(`/admin/reviews/${reviewId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  deleteAdminReview(token, reviewId) {
    return request(`/admin/reviews/${reviewId}`, {
      method: "DELETE",
      token,
    });
  },

  getMyOrders(token) {
    return request("/orders/mine", { token });
  },

  listSalesManagerInvoices(token, params = {}) {
    const searchParams = new URLSearchParams();
    if (params.startDate) {
      searchParams.set("start_date", params.startDate);
    }
    if (params.endDate) {
      searchParams.set("end_date", params.endDate);
    }
    const queryString = searchParams.toString();
    return request(`/orders/invoices${queryString ? `?${queryString}` : ""}`, {
      token,
    });
  },

  listAdminOrders(token) {
    return request("/admin/orders", { token });
  },

  updateAdminOrderStatus(token, orderId, newStatus) {
    return request(`/admin/orders/${orderId}/status`, {
      method: "PATCH",
      token,
      body: { status: newStatus },
    });
  },
};
