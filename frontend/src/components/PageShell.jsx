import Footer from "./Footer";
import Navbar from "./Navbar";

function PageShell({ children, searchProps, cartCount = 0, wishlistCount = 0, onCartClick }) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-700">
      <Navbar
        {...(searchProps ?? {})}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
      />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}

export default PageShell;