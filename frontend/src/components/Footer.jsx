import { useNavigate } from "react-router-dom";

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(241,246,245,0.95))]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-14">
        <div>
          <p className="text-[10px] tracking-[0.34em] text-slate-400 uppercase">Fragrance shop</p>
          <p className="mt-3 max-w-md text-2xl font-light tracking-tight text-slate-900">
            A calmer storefront for discovering signature scents.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Designed for focused browsing, clearer product detail, and a more intentional luxury
            retail feel.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:items-end">
          <nav
            className="flex flex-wrap items-center gap-3 text-[11px] tracking-[0.28em] text-slate-500 uppercase"
            aria-label="Footer"
          >
            <button
              type="button"
              className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-slate-200 hover:bg-white hover:text-slate-800"
              onClick={() => navigate("/about")}
            >
              About
            </button>
            <button
              type="button"
              className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-slate-200 hover:bg-white hover:text-slate-800"
              onClick={() => navigate("/help")}
            >
              Help
            </button>
            <button
              type="button"
              className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-slate-200 hover:bg-white hover:text-slate-800"
              onClick={() => navigate("/contact")}
            >
              Contact
            </button>
          </nav>
          <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">
            © {new Date().getFullYear()} Fragrance shop
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
