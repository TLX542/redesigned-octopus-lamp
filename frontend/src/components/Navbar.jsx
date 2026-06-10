import { useLocation, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useAuth } from "../context/AuthContext";

const noop = () => {};

function Navbar({
  brandName = "Fragrance shop",
  cartCount = 0,
  wishlistCount = 0,
  searchValue = "",
  onSearchChange = noop,
  onClearSearch = noop,
  searchResultCount = 0,
  searchStatus = "idle",
  onCartClick = noop,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openAuth, isLoggedIn, currentUser, isAdmin } = useAuth();
  const pathname = location.pathname;
  const role = currentUser?.role ?? "guest";

  const navButtonClass = (isActive) =>
    `sans-ui rounded-full border px-4 py-2 text-[12px] tracking-[0.18em] transition ${
      isActive
        ? "border-slate-300 bg-slate-900 text-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.8)]"
        : "border-slate-200/70 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900"
    }`;

  const accountLabelByRole = {
    customer: "My account",
    sales_manager: "Sales account",
    product_manager: "Product account",
    admin: "Admin account",
    guest: "Account",
  };

  const accountLabel = isLoggedIn
    ? accountLabelByRole[role] ?? "My account"
    : "Account";

  const showCustomerNavigation =
    !isLoggedIn || role === "customer";

  const showSalesManagerNavigation =
    isLoggedIn && (role === "sales_manager" || role === "admin");

  const showProductManagerNavigation =
    isLoggedIn && (role === "product_manager" || role === "admin");

  const showAdminNavigation =
    isLoggedIn && isAdmin;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,250,249,0.78))] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-3 sm:px-10 lg:px-14">
        <div className="surface-panel grid gap-4 rounded-[1.9rem] p-4 shadow-[0_20px_45px_-36px_rgba(15,23,42,0.62)] xl:grid-cols-[minmax(0,1fr)_minmax(21rem,28rem)] xl:items-center xl:gap-8 xl:p-5">
          <div className="animate-rise flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="border-0 bg-transparent p-0 text-left transition"
              >
                <span className="sans-ui block text-[10px] tracking-[0.3em] text-slate-400 uppercase">
                  Curated fragrance house
                </span>
                <span className="mt-2 block text-lg font-semibold tracking-[0.22em] text-slate-900 uppercase sm:text-xl">
                  {brandName}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/wishlist")}
                  className="sans-ui rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[10px] tracking-[0.24em] text-slate-600 uppercase shadow-[0_12px_24px_-22px_rgba(15,23,42,0.6)] transition hover:border-slate-300 hover:text-slate-900"
                >
                  Wishlist {wishlistCount}
                </button>
                <button
                  type="button"
                  onClick={onCartClick}
                  className="sans-ui rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[10px] tracking-[0.24em] text-slate-600 uppercase shadow-[0_12px_24px_-22px_rgba(15,23,42,0.6)] transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cart {cartCount}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <nav
                className="sans-ui flex flex-wrap items-center gap-2.5 text-[12px] tracking-[0.18em] uppercase"
                aria-label="Primary"
              >
                {showCustomerNavigation && (
                  <>
                    <button
                      type="button"
                      className={navButtonClass(pathname === "/collections")}
                      onClick={() => navigate("/collections")}
                    >
                      Collections
                    </button>
                    <button
                      type="button"
                      className={navButtonClass(pathname === "/wishlist")}
                      onClick={() => navigate("/wishlist")}
                    >
                      Wishlist
                    </button>
                    <button
                      type="button"
                      className={navButtonClass(pathname === "/help")}
                      onClick={() => navigate("/help")}
                    >
                      Help
                    </button>
                    <button
                      type="button"
                      className={navButtonClass(pathname === "/contact")}
                      onClick={() => navigate("/contact")}
                    >
                      Contact
                    </button>
                    <button
                      type="button"
                      className={navButtonClass(pathname === "/about")}
                      onClick={() => navigate("/about")}
                    >
                      About
                    </button>
                    {isLoggedIn && role === "customer" && (
                      <button
                        type="button"
                        className={navButtonClass(pathname === "/orders")}
                        onClick={() => navigate("/orders")}
                      >
                        My Orders
                      </button>
                    )}
                  </>
                )}

                {showSalesManagerNavigation && (
                  <button
                    type="button"
                    className={navButtonClass(pathname.startsWith("/sales-manager"))}
                    onClick={() => navigate("/sales-manager")}
                  >
                    Sales Dashboard
                  </button>
                )}

                {showProductManagerNavigation && (
                  <button
                    type="button"
                    className={navButtonClass(pathname.startsWith("/admin"))}
                    onClick={() => navigate("/admin")}
                  >
                    Product Dashboard
                  </button>
                )}

                {showAdminNavigation && (
                  <button
                    type="button"
                    className={navButtonClass(pathname.startsWith("/admin"))}
                    onClick={() => navigate("/admin")}
                  >
                    Admin
                  </button>
                )}
              </nav>

              <div className="sans-ui flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-2 text-[11px] tracking-[0.24em] text-slate-500 uppercase">
                <button
                  type="button"
                  className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-slate-200 hover:bg-white/80 hover:text-slate-800"
                  onClick={() => openAuth("login")}
                >
                  {accountLabel}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-slate-200 hover:bg-white/80 hover:text-slate-800"
                  onClick={onCartClick}
                >
                  Open cart
                </button>
              </div>
            </div>
          </div>

          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            onClear={onClearSearch}
            resultCount={searchResultCount}
            status={searchStatus}
          />
        </div>
      </div>
    </header>
  );
}

export default Navbar;