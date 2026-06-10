import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { buildInvoicePdfDataUrl, enrichInvoiceItems } from "./lib/invoicePdf";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CartDrawer from "./components/CartDrawer";
import PageShell from "./components/PageShell";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductPage from "./pages/ProductPage";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import ContactPage from "./pages/ContactPage";
import CollectionsPage from "./pages/CollectionsPage";
import AdminPage from "./pages/AdminPage";
import WishlistPage from "./pages/WishlistPage";
import SalesManagerPage from "./pages/SalesManagerPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import BoughtProductStatusPage from "./pages/BoughtProductStatusPage";
import { api } from "./lib/api";
import { adaptProduct } from "./lib/productAdapter";

const CART_ID = 1;
const WISHLIST_STORAGE_KEY = "wishlist-product-ids";

function getCartItemCount(cart) {
  return cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
}

function getPopularityScore(product) {
  const ratingCount = Number(product.ratingCount ?? 0);
  if (ratingCount <= 0) {
    return 0;
  }

  return Number(product.popularity ?? product.averageRating ?? 0);
}

function buildInvoiceText(invoice, productsByApiId) {
  const itemLines = enrichInvoiceItems(invoice, productsByApiId)
    .map((item) => {
      return `- ${item.product_name} | Qty: ${item.quantity} | Unit: ${item.unit_price} USD | Line Total: ${item.line_total} USD`;
    })
    .join("\n");

  return [
    `Order ID: ${invoice.order_id}`,
    `Database Order ID: ${invoice.db_order_id}`,
    `Customer: ${invoice.customer_name ?? ""}`,
    `Email: ${invoice.customer_email ?? ""}`,
    `Status: ${invoice.status}`,
    `Created At: ${invoice.created_at}`,
    `Item Count: ${invoice.item_count}`,
    `Total Amount: ${invoice.total_amount} USD`,
    "",
    "Items:",
    itemLines,
  ].join("\n");
}

function money(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildInvoiceEmailHtml(invoice, productsByApiId) {
  const itemsHtml = enrichInvoiceItems(invoice, productsByApiId)
    .map((item) => {
      return `
        <tr>
          <td style="padding:20px 10px;border-bottom:2px solid #222;">
            <strong>${escapeHtml(item.product_name)}</strong><br>
            <span style="color:#666;">QTY: ${escapeHtml(item.quantity)}</span><br>
            <span style="color:#666;">Unit Price: ${money(item.unit_price)}</span>
          </td>
          <td style="padding:20px 10px;border-bottom:2px solid #222;text-align:right;font-weight:700;">
            ${money(item.line_total)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="max-width:640px;margin:0 auto;background:#fff;border-top:6px solid #438c12;padding:24px;font-family:Arial,sans-serif;color:#222;">
      <h2 style="margin:0 0 28px;font-size:22px;">Thank You for Your Order</h2>
      <p style="margin:0 0 24px;color:#444;">We'll send you tracking information when the order ships.</p>
      <h3 style="margin:0 0 8px;font-size:18px;">Order # ${escapeHtml(invoice.order_id)}</h3>
      <div style="border-top:2px solid #222;margin-bottom:28px;"></div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${itemsHtml}
      </table>
      <table role="presentation" width="45%" align="right" cellspacing="0" cellpadding="0" style="margin-top:48px;border-collapse:collapse;">
        <tr>
          <td style="padding:10px;">Shipping</td>
          <td style="padding:10px;text-align:right;">FREE</td>
        </tr>
        <tr>
          <td style="padding:16px 10px;border-top:2px solid #222;font-weight:700;">Order Total</td>
          <td style="padding:16px 10px;border-top:2px solid #222;text-align:right;font-weight:700;">${money(invoice.total_amount)}</td>
        </tr>
      </table>
      <div style="clear:both;"></div>
    </div>
  `;
}

function dataUrlToFile(dataUrl, fileName) {
  const [metadata, base64Content] = dataUrl.split(",");
  const mimeType = metadata.match(/^data:(.*?);base64$/)?.[1] ?? "application/pdf";
  const binary = atob(base64Content);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType });
}

function appendHiddenField(form, name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = String(value ?? "");
  form.appendChild(input);
}

function appendFileField(form, name, file) {
  const input = document.createElement("input");
  input.type = "file";
  input.name = name;

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  form.appendChild(input);
}

function buildInvoiceEmailForm(templateParams, invoiceFile) {
  const form = document.createElement("form");
  form.method = "post";
  form.enctype = "multipart/form-data";
  form.style.display = "none";

  Object.entries(templateParams).forEach(([name, value]) => {
    appendHiddenField(form, name, value);
  });

  ["my_file", "attachment", "file", "invoice_file"].forEach((fieldName) => {
    appendFileField(form, fieldName, invoiceFile);
  });

  return form;
}

function StateLayout({
  searchProps,
  cartCount,
  wishlistCount,
  onCartClick,
  eyebrow,
  title,
  description,
}) {
  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-14">
        <div className="max-w-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">{title}</h1>
          {description && <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>}
        </div>
      </main>
    </PageShell>
  );
}

function ProductRoute({
  searchProps,
  products,
  isLoading,
  cartCount,
  wishlistCount,
  onCartClick,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) {
  const { productId } = useParams();
  const product = products.find((item) => item.id === productId);

  if (isLoading) {
    return (
      <StateLayout
        searchProps={searchProps}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
        eyebrow="Product catalog"
        title="Loading product."
        description="Product information is being loaded from the API."
      />
    );
  }

  if (!product) {
    return (
      <StateLayout
        searchProps={searchProps}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
        eyebrow="Product catalog"
        title="Product not found."
        description="This product is not available in the current catalog."
      />
    );
  }

  return (
    <ProductPage
      product={product}
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
      onAddToCart={onAddToCart}
      isWishlisted={isWishlisted(product.id)}
      onToggleWishlist={onToggleWishlist}
    />
  );
}

function SearchEmptyLayout({ searchProps, searchValue, cartCount, wishlistCount, onCartClick }) {
  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex min-h-[calc(100vh-7rem)] flex-1 items-center justify-center px-6 py-16 sm:px-10 lg:px-14">
        <div className="max-w-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Search results</p>
          <h1 className="mt-4 text-3xl font-light tracking-tight text-slate-700">No products found.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            No matches for &quot;{searchValue.trim()}&quot;. Try a different product name, feature, or description.
          </p>
        </div>
      </main>
    </PageShell>
  );
}

function AdminRoute({ searchProps, cartCount, wishlistCount, onCartClick, onCatalogChange }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminPage
        searchProps={searchProps}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
        onCatalogChange={onCatalogChange}
      />
    </ProtectedRoute>
  );
}

function SalesManagerRoute() {
  return (
    <ProtectedRoute allowedRoles={["sales_manager", "admin"]}>
      <SalesManagerPage />
    </ProtectedRoute>
  );
}

function OrdersRoute({ searchProps, cartCount, wishlistCount, onCartClick }) {
  return (
    <ProtectedRoute requireAuth>
      <OrdersPage
        searchProps={searchProps}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
      />
    </ProtectedRoute>
  );
}

function OrderStatusRoute({ searchProps, cartCount, wishlistCount, onCartClick }) {
  return (
    <ProtectedRoute requireAuth>
      <BoughtProductStatusPage
        searchProps={searchProps}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
      />
    </ProtectedRoute>
  );
}

function AppContent() {
  const { token, currentUser, openAuth } = useAuth();
  const location = useLocation();
  const syncedWishlistUserId = useRef(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [catalogError, setCatalogError] = useState("");
  const [cart, setCart] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistHydrated, setWishlistHydrated] = useState(false);
  const [wishlistSyncError, setWishlistSyncError] = useState("");
  const [discountNotifications, setDiscountNotifications] = useState([]);
  const [discountNotificationsLoading, setDiscountNotificationsLoading] = useState(false);
  const [discountNotificationsError, setDiscountNotificationsError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [sortOption, setSortOption] = useState("default");

  useEffect(() => {
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init(publicKey);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setWishlistIds(parsed.map((id) => String(id)));
      }
    } catch {
      setWishlistIds([]);
    } finally {
      setWishlistHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!token || !currentUser?.id) {
      syncedWishlistUserId.current = null;
      setDiscountNotifications([]);
      setDiscountNotificationsError("");
      setDiscountNotificationsLoading(false);
      return undefined;
    }

    if (!wishlistHydrated || syncedWishlistUserId.current === currentUser.id) {
      return undefined;
    }

    let isMounted = true;

    async function syncCustomerWishlist() {
      setWishlistSyncError("");
      setDiscountNotificationsError("");
      setDiscountNotificationsLoading(true);

      try {
        const localProductIds = wishlistIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0);

        await Promise.allSettled(
          localProductIds.map((productId) => api.addWishlistItem(token, productId)),
        );

        const [wishlistItems, notifications] = await Promise.all([
          api.listWishlist(token),
          api.listDiscountNotifications(token),
        ]);

        if (!isMounted) return;

        setWishlistIds(wishlistItems.map((item) => String(item.product.id)));
        setDiscountNotifications(notifications);
        syncedWishlistUserId.current = currentUser.id;
      } catch (error) {
        if (!isMounted) return;
        setWishlistSyncError(error.message);
        setDiscountNotificationsError(error.message);
        syncedWishlistUserId.current = currentUser.id;
      } finally {
        if (isMounted) {
          setDiscountNotificationsLoading(false);
        }
      }
    }

    syncCustomerWishlist();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, token, wishlistHydrated, wishlistIds]);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      setCatalogStatus("loading");
      setCatalogError("");

      try {
        const [apiProducts, apiCategories, initialCart] = await Promise.all([
          api.listProducts({ categoryId: selectedCategoryId }),
          api.listCategories(),
          api.getCart(CART_ID),
        ]);

        if (!isMounted) return;

        const categoriesById = new Map(apiCategories.map((category) => [category.id, category]));
        setCategories(apiCategories);
        setProducts(
          apiProducts.map((product) =>
            adaptProduct(product, categoriesById.get(product.category_id)),
          ),
        );
        setCart(initialCart);
        setCatalogStatus("success");
      } catch (error) {
        if (!isMounted) return;
        setCatalogError(error.message);
        setCatalogStatus("error");
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [catalogReloadKey, selectedCategoryId]);

  useEffect(() => {
    if (!wishlistHydrated) {
      return;
    }

    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  }, [wishlistHydrated, wishlistIds]);

  useEffect(() => {
    if (!wishlistHydrated || catalogStatus !== "success") {
      return;
    }

    const validIds = new Set(products.map((product) => product.id));
    setWishlistIds((current) => {
      const filtered = current.filter((id) => validIds.has(id));
      return filtered.length === current.length ? current : filtered;
    });
  }, [catalogStatus, products, wishlistHydrated]);

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    let visibleProducts = products;

    if (normalizedSearch) {
      visibleProducts = visibleProducts.filter((product) => {
        const searchableContent = [
          product.name,
          product.volume,
          product.shortDescription,
          product.details,
          ...(product.features ?? []),
        ];

        return searchableContent.some((field) =>
          String(field).toLowerCase().includes(normalizedSearch),
        );
      });
    }

    if (sortOption === "price-asc") {
      return [...visibleProducts].sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortOption === "price-desc") {
      return [...visibleProducts].sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sortOption === "popularity") {
      return [...visibleProducts].sort((a, b) => {
        const aScore = getPopularityScore(a);
        const bScore = getPopularityScore(b);

        if (aScore !== bScore) {
          return bScore - aScore;
        }

        const aHasRatings = Number(a.ratingCount ?? 0) > 0;
        const bHasRatings = Number(b.ratingCount ?? 0) > 0;
        if (aHasRatings !== bHasRatings) {
          return aHasRatings ? -1 : 1;
        }

        return Number(a.apiId ?? 0) - Number(b.apiId ?? 0);
      });
    }

    return visibleProducts;
  }, [normalizedSearch, products, sortOption]);

  const searchStatus = normalizedSearch
    ? filteredProducts.length > 0
      ? "success"
      : "empty"
    : "idle";

  const searchProps = {
    searchValue,
    onSearchChange: setSearchValue,
    onClearSearch: () => setSearchValue(""),
    searchResultCount: filteredProducts.length,
    searchStatus,
  };

  const isCatalogLoading = catalogStatus === "loading";
  const cartCount = getCartItemCount(cart);
  const wishlistCount = wishlistIds.length;
  const isAdminRoute = location.pathname.startsWith("/admin");

  const showSearchEmpty =
    !isAdminRoute &&
    !isCatalogLoading &&
    !catalogError &&
    Boolean(normalizedSearch) &&
    filteredProducts.length === 0;

  const handleAddToCart = useCallback(async (product, quantity) => {
    const updatedCart = await api.addCartItem(CART_ID, product.apiId, quantity);
    setCart(updatedCart);
    return updatedCart;
  }, []);

  const handleCatalogChange = useCallback(() => {
    setCatalogReloadKey((current) => current + 1);
  }, []);

  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategoryId(String(categoryId));
  }, []);

  const handleClearCategory = useCallback(() => {
    setSelectedCategoryId("");
  }, []);

  const handleRemoveCartItem = useCallback(async (itemId) => {
    setRemovingItemId(itemId);
    try {
      const updatedCart = await api.removeCartItem(CART_ID, itemId);
      setCart(updatedCart);
      return updatedCart;
    } finally {
      setRemovingItemId(null);
    }
  }, []);

  const handleToggleWishlist = useCallback(async (productId) => {
    const normalizedProductId = String(productId);
    const apiProductId = Number(productId);
    const addedToWishlist = !wishlistIds.includes(normalizedProductId);

    setWishlistIds((current) => {
      let nextWishlistIds;
      if (current.includes(normalizedProductId)) {
        nextWishlistIds = current.filter((id) => id !== normalizedProductId);
      } else {
        nextWishlistIds = [normalizedProductId, ...current];
      }
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextWishlistIds));
      return nextWishlistIds;
    });

    if (!token || !Number.isInteger(apiProductId)) {
      return;
    }

    try {
      if (addedToWishlist) {
        await api.addWishlistItem(token, apiProductId);
      } else {
        await api.removeWishlistItem(token, apiProductId);
      }
      setWishlistSyncError("");
    } catch (error) {
      setWishlistSyncError(error.message);
      setWishlistIds((current) => {
        const nextWishlistIds = addedToWishlist
          ? current.filter((id) => id !== normalizedProductId)
          : [normalizedProductId, ...current];
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextWishlistIds));
        return nextWishlistIds;
      });
    }
  }, [token, wishlistIds]);

  const wishlistProductSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  const isWishlisted = useCallback(
    (productId) => wishlistProductSet.has(productId),
    [wishlistProductSet],
  );

  const wishlistProducts = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product]));
    return wishlistIds.map((id) => byId.get(id)).filter(Boolean);
  }, [products, wishlistIds]);

  const filteredWishlistProducts = useMemo(() => {
    if (!normalizedSearch) return wishlistProducts;
    const filteredIds = new Set(filteredProducts.map((product) => product.id));
    return wishlistProducts.filter((product) => filteredIds.has(product.id));
  }, [filteredProducts, normalizedSearch, wishlistProducts]);

  const productsByApiId = useMemo(
    () => new Map(products.map((product) => [product.apiId, product])),
    [products],
  );

  const handleMarkDiscountNotificationsRead = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const notifications = await api.markDiscountNotificationsRead(token);
      setDiscountNotifications(notifications);
      setDiscountNotificationsError("");
    } catch (error) {
      setDiscountNotificationsError(error.message);
    }
  }, [token]);

  const sendInvoiceEmail = useCallback(
    async (invoice) => {
      if (!currentUser?.email) {
        return { sent: false, reason: "No user email address found." };
      }

      const invoiceText = buildInvoiceText(invoice, productsByApiId);
      const invoicePdf = buildInvoicePdfDataUrl(invoice, productsByApiId);
      const invoicePdfBase64 = invoicePdf.replace(/^data:application\/pdf;base64,/, "");
      const invoiceHtml = buildInvoiceEmailHtml(invoice, productsByApiId);
      const invoiceItems = enrichInvoiceItems(invoice, productsByApiId);
      const orderItemsText = invoiceItems
        .map((item) => {
          return `${item.product_name} | QTY: ${item.quantity} | Unit Price: ${money(item.unit_price)} | Total: ${money(item.line_total)}`;
        })
        .join("\n");
      const orderItemsHtml = invoiceItems
        .map((item) => {
          return `<strong>${escapeHtml(item.product_name)}</strong><br>QTY: ${escapeHtml(item.quantity)}<br>Unit Price: ${money(item.unit_price)}<br>Total: ${money(item.line_total)}`;
        })
        .join("<hr>");
      const emailJsOrders = invoiceItems.map((item) => ({
        name: item.product_name,
        units: item.quantity,
        price: item.unit_price,
        item_total: item.line_total,
      }));
      const customerName = currentUser.full_name ?? currentUser.name ?? "Customer";
      const customerEmail = currentUser.email;
      const invoiceFileName = `${invoice.order_id}-invoice.pdf`;
      const templateParams = {
        to_email: customerEmail,
        email: customerEmail,
        user_email: customerEmail,
        customer_email: customerEmail,
        reply: customerEmail,
        reply_to: customerEmail,
        from_name: customerName,
        to_name: customerName,
        user_name: customerName,
        customer_name: customerName,
        subject: `Invoice for order ${invoice.order_id}`,
        message: invoiceText,
        html_message: invoiceHtml,
        order_id: invoice.order_id,
        total: invoice.total_amount,
        subtotal: money(invoice.total_amount),
        shipping: "FREE",
        order_total: money(invoice.total_amount),
        total_amount: `${invoice.total_amount} USD`,
        orders: emailJsOrders,
        item_names: emailJsOrders.map((item) => item.name).join(", "),
        item_prices: emailJsOrders.map((item) => String(item.price)).join(", "),
        order_items: orderItemsText,
        order_items_text: orderItemsText,
        order_items_html: orderItemsHtml,
        invoice_html: invoiceHtml,
        invoice_text: invoiceText,
        invoice_pdf: invoicePdf,
        invoice_pdf_base64: invoicePdfBase64,
        invoice_pdf_file: invoicePdf,
        invoice_pdf_filename: invoiceFileName,
        attachment: invoicePdf,
        attachment_name: invoiceFileName,
        content: invoicePdf,
        file: invoicePdf,
        pdf: invoicePdf,
        my_file: invoicePdf,
      };
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId =
        import.meta.env.VITE_EMAILJS_INVOICE_TEMPLATE_ID ??
        import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID ??
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID ??
        "template_xtkn2jc";
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      try {
        if (!serviceId || !templateId || !publicKey) {
          return {
            sent: false,
            reason:
              "Invoice EmailJS service or public key is not configured.",
          };
        }

        const invoiceFile = dataUrlToFile(invoicePdf, invoiceFileName);
        const invoiceForm = buildInvoiceEmailForm(templateParams, invoiceFile);
        document.body.appendChild(invoiceForm);

        try {
          await emailjs.sendForm(serviceId, templateId, invoiceForm, { publicKey });
        } finally {
          invoiceForm.remove();
        }

        return { sent: true };
      } catch (error) {
        try {
          await emailjs.send(serviceId, templateId, templateParams, { publicKey });
          return { sent: true };
        } catch (fallbackError) {
          return {
            sent: false,
            reason: fallbackError?.message ?? error?.message ?? "EmailJS send failed.",
          };
        }
      }
    },
    [currentUser, productsByApiId],
  );

  const handleCheckout = useCallback(async () => {
    if (!token) {
      openAuth("login");
      throw new Error("Login required before checkout.");
    }

    setIsCheckingOut(true);
    setCheckoutMessage("");

    try {
      const invoice = await api.checkoutCart(CART_ID, token);
      setCart(await api.getCart(CART_ID));
      setCatalogReloadKey((current) => current + 1);
      const emailResult = await sendInvoiceEmail(invoice);
      setCheckoutMessage(
        emailResult.sent
          ? `Checkout completed. Order ${invoice.order_id} created. Invoice email sent.`
          : `Checkout completed. Order ${invoice.order_id} created. Invoice email was not sent: ${emailResult.reason}`,
      );
      return invoice;
    } catch (error) {
      setCheckoutMessage(error.message);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  }, [token, openAuth, sendInvoiceEmail]);

  return (
    <>
      {showSearchEmpty ? (
        <SearchEmptyLayout
          searchProps={searchProps}
          searchValue={searchValue}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onCartClick={() => setCartOpen(true)}
        />
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                searchProps={searchProps}
                products={filteredProducts}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={handleCategorySelect}
                onClearCategory={handleClearCategory}
                isLoading={isCatalogLoading}
                error={catalogError}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
                onToggleWishlist={handleToggleWishlist}
                isWishlisted={isWishlisted}
                sortOption={sortOption}
                onSortChange={setSortOption}
              />
            }
          />
          <Route
            path="/about"
            element={
              <AboutPage
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
              />
            }
          />
          <Route
            path="/help"
            element={
              <HelpPage
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
              />
            }
          />
          <Route
            path="/contact"
            element={
              <ContactPage
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
              />
            }
          />
          <Route
            path="/collections"
            element={
              <CollectionsPage
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
                onCheckout={handleCheckout}
                isCheckingOut={isCheckingOut}
                checkoutMessage={checkoutMessage}
                products={products}
              />
            }
          />
          <Route
            path="/wishlist"
            element={
              <WishlistPage
                searchProps={searchProps}
                products={filteredWishlistProducts}
                isLoading={isCatalogLoading}
                error={catalogError}
                syncError={wishlistSyncError}
                discountNotifications={discountNotifications}
                discountNotificationsLoading={discountNotificationsLoading}
                discountNotificationsError={discountNotificationsError}
                onMarkDiscountNotificationsRead={handleMarkDiscountNotificationsRead}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
                onToggleWishlist={handleToggleWishlist}
                isWishlisted={isWishlisted}
              />
            }
          />
          <Route
            path="/orders"
            element={
              <OrdersRoute
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
              />
            }
          />
          <Route
            path="/order-status"
            element={
              <OrderStatusRoute
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
              />
            }
          />
          <Route
            path="/product/:productId"
            element={
              <ProductRoute
                searchProps={searchProps}
                products={products}
                isLoading={isCatalogLoading}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
                onAddToCart={handleAddToCart}
                isWishlisted={isWishlisted}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute
                searchProps={searchProps}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                onCartClick={() => setCartOpen(true)}
                onCatalogChange={handleCatalogChange}
              />
            }
          />
          <Route path="/sales-manager" element={<SalesManagerRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      <CartDrawer
        open={cartOpen}
        cart={cart}
        products={products}
        removingItemId={removingItemId}
        onClose={() => setCartOpen(false)}
        onRemoveItem={handleRemoveCartItem}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
