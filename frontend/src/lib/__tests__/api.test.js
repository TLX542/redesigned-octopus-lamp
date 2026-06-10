import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

function mockJsonResponse(data, init = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: vi.fn().mockResolvedValue(data === null ? "" : JSON.stringify(data)),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("sends authenticated review creation requests as JSON", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse({ id: 9 }));

    const result = await api.createProductReview("token-123", 3, {
      rating: 5,
      comment: "Lovely",
    });

    expect(result).toEqual({ id: 9 });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products/3/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
      body: JSON.stringify({ rating: 5, comment: "Lovely" }),
    });
  });

  it("sends admin review moderation requests to the admin endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse({ status: "approved" }));

    await api.updateAdminReview("admin-token", 7, { status: "approved" });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/admin/reviews/7`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-token",
      },
      body: JSON.stringify({ status: "approved" }),
    });
  });

  it("sends authenticated product review list requests with a bearer token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse([]));

    const result = await api.listProductReviews(3, "token-123");

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products/3/reviews`, {
      headers: {
        Authorization: "Bearer token-123",
      },
      body: undefined,
    });
  });

  it("sends review update requests as JSON", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse({ rating: 4 }));

    await api.updateProductReview("token-123", 3, 11, {
      rating: 4,
      comment: "Still good",
    });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products/3/reviews/11`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
      body: JSON.stringify({ rating: 4, comment: "Still good" }),
    });
  });

  it("does not add a JSON content type for empty delete requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse(null, { status: 204 }));

    const result = await api.deleteProductReview("token-123", 3, 11);

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products/3/reviews/11`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer token-123",
      },
      body: undefined,
    });
  });

  it("surfaces backend error details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({ detail: "Admin access required" }, { ok: false, status: 403 }),
    );

    await expect(api.listAdminUsers("customer-token")).rejects.toThrow("Admin access required");
  });

  it("uses a status fallback when the backend omits an error detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse({}, { ok: false, status: 500 }));

    await expect(api.listProducts()).rejects.toThrow("Request failed with status 500");
  });

  it("sends admin review delete requests without a JSON content type", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse(null, { status: 204 }));

    await api.deleteAdminReview("admin-token", 7);

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/admin/reviews/7`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer admin-token",
      },
      body: undefined,
    });
  });

  it("sends registration payloads as JSON", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse({ id: 4 }));
    const payload = {
      full_name: "Fresh Customer",
      email: "fresh@example.com",
      password: "password123",
    };

    await api.register(payload);

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  });

  it("adds category filters to product list requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse([]));

    await api.listProducts({ categoryId: 4 });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products?category_id=4`, {
      headers: {},
      body: undefined,
    });
  });

  it("sends bulk product discount requests as a sales manager", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse({ updated_products: [] }));

    await api.applyProductDiscount("manager-token", [1, 3], 20);

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products/discounts`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer manager-token",
      },
      body: JSON.stringify({
        product_ids: [1, 3],
        discount_rate: 20,
      }),
    });
  });

  it("sends authenticated wishlist requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse({ id: 5 }));

    await api.addWishlistItem("customer-token", 9);

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/wishlist/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer customer-token",
      },
      body: JSON.stringify({
        product_id: 9,
      }),
    });
  });

  it("lists customer discount notifications with bearer auth", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockJsonResponse([]));

    await api.listDiscountNotifications("customer-token");

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/notifications/discounts`, {
      headers: {
        Authorization: "Bearer customer-token",
      },
      body: undefined,
    });
  });
});
