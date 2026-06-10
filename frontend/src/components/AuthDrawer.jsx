import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
      aria-label={shown ? "Hide password" : "Show password"}
    >
      {shown ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );
}

function AuthDrawer() {
  const navigate = useNavigate();
  const {
    authOpen,
    authTab,
    setAuthTab,
    isLoggedIn,
    currentUser,
    authLoading,
    closeAuth,
    login,
    register,
    logout,
  } = useAuth();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");

    const formData = new FormData(event.currentTarget);

    try {
      await login({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();

    try {
      await register({
        full_name: `${firstName} ${lastName}`.trim(),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const selectAuthTab = (tab) => {
    setAuthError("");
    setAuthTab(tab);
  };

  const openBoughtProductStatus = () => {
    closeAuth();
    navigate("/order-status");
  };

  useEffect(() => {
    if (!authOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeAuth();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [authOpen, closeAuth]);

  return (
    <>
      <div
        role="presentation"
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 ${authOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeAuth}
        aria-hidden={!authOpen}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,248,0.98))] shadow-2xl transition-transform duration-300 ease-out sm:max-w-lg ${authOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!authOpen}
        aria-modal={authOpen}
        role="dialog"
        aria-labelledby="auth-drawer-title"
      >
        <div className="flex shrink-0 items-center justify-end px-5 pt-5 sm:px-8">
          <button
            type="button"
            onClick={closeAuth}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-200 px-6 sm:px-8">
          <div className="grid grid-cols-2 gap-0">
            <button
              type="button"
              onClick={() => selectAuthTab("login")}
              className={`pb-1 text-center text-2xl font-light tracking-tight sm:text-3xl ${authTab === "login" ? "border-b-2 border-slate-900 text-slate-900" : "border-b border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => selectAuthTab("signup")}
              className={`pb-1 text-center text-2xl font-light tracking-tight sm:text-3xl ${authTab === "signup" ? "border-b-2 border-slate-900 text-slate-900" : "border-b border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <h2 id="auth-drawer-title" className="sr-only">
            {isLoggedIn ? "Account" : authTab === "login" ? "Log in" : "Create an account"}
          </h2>

          {isLoggedIn ? (
            <div className="space-y-6">
              <p className="text-lg text-slate-700">
                Signed in as {currentUser?.full_name ?? currentUser?.email ?? "customer"}.
              </p>
              <button
                type="button"
                onClick={openBoughtProductStatus}
                className="w-full border border-slate-900 bg-slate-900 px-4 py-3 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-slate-700"
              >
                Bought Product Status
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full border border-slate-300 bg-white px-4 py-3 text-xs font-medium tracking-[0.2em] text-slate-800 uppercase transition hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          ) : authTab === "login" ? (
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                required
              />
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                  required
                />
                <PasswordToggle
                  shown={showLoginPassword}
                  onToggle={() => setShowLoginPassword((value) => !value)}
                />
              </div>

              {authError && (
                <p className="text-sm text-red-500" aria-live="polite">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-full bg-slate-900 px-4 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authLoading ? "Logging in" : "Log in"}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSignupSubmit}>
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                autoComplete="given-name"
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                autoComplete="family-name"
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                required
              />
              <div className="relative">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                  required
                />
                <PasswordToggle
                  shown={showSignupPassword}
                  onToggle={() => setShowSignupPassword((value) => !value)}
                />
              </div>

              <label className="flex items-start gap-3 pt-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-1 accent-slate-700" required />
                <span>I agree to the terms and privacy policy.</span>
              </label>

              {authError && (
                <p className="text-sm text-red-500" aria-live="polite">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="mt-2 w-full rounded-full bg-slate-900 px-4 py-3.5 text-xs font-medium tracking-[0.2em] text-white uppercase transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authLoading ? "Signing up" : "Sign up"}
              </button>
            </form>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-900 px-6 py-6 text-white sm:px-8">
          <p className="text-xl font-light tracking-tight">Member benefits</p>
          <p className="mt-2 text-sm text-slate-300">Exclusive perks when you shop with us.</p>
          <ul className="mt-5 space-y-4 text-sm text-slate-200">
            <li className="flex gap-3">
              <span className="mt-0.5 text-slate-400" aria-hidden>
                ◆
              </span>
              <span>Early access to sales and new arrivals.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-slate-400" aria-hidden>
                ◆
              </span>
              <span>App-only offers on your first order.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-slate-400" aria-hidden>
                ◆
              </span>
              <span>Earn points on purchases to redeem later.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-slate-400" aria-hidden>
                ◆
              </span>
              <span>Birthday surprises and member-only gifts.</span>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}

export default AuthDrawer;
