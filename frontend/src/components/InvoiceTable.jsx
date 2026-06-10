import { useEffect, useState } from "react";
import { api } from "../lib/api";

function money(value) {
  return `${Number(value ?? 0).toFixed(2)} USD`;
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getItemCount(invoice) {
  return (invoice.items ?? []).reduce((total, item) => total + Number(item.quantity ?? 0), 0);
}

function InvoiceTable({ token = "" }) {
  const [invoices, setInvoices] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvoices() {
      if (!token) {
        setInvoices([]);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const data = await api.listSalesManagerInvoices(token, appliedFilters);
        if (!isMounted) return;
        setInvoices(data);
      } catch (error) {
        if (!isMounted) return;
        setMessage(error.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInvoices();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters, token]);

  function handleSubmit(event) {
    event.preventDefault();
    setAppliedFilters({ startDate, endDate });
  }

  function handleClearFilters() {
    setStartDate("");
    setEndDate("");
    setAppliedFilters({ startDate: "", endDate: "" });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
          Invoices
        </p>
        <h2 className="mt-2 text-2xl font-light tracking-tight text-slate-800">
          View Invoices
        </h2>
      </div>

      <form className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">
            Start date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-500"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">
            End date
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="self-end rounded-xl border border-slate-300 px-5 py-3 text-sm uppercase tracking-[0.22em] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Filtering..." : "Filter invoices"}
        </button>

        <button
          type="button"
          onClick={handleClearFilters}
          disabled={loading || (!startDate && !endDate && !appliedFilters.startDate && !appliedFilters.endDate)}
          className="self-end rounded-xl bg-slate-800 px-5 py-3 text-sm uppercase tracking-[0.22em] text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </form>

      {message && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-600">
          Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-600">
          No invoices match the selected date range.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4">Invoice ID</th>
                <th className="px-4">Customer</th>
                <th className="px-4">Date</th>
                <th className="px-4">Items</th>
                <th className="px-4">Total</th>
                <th className="px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                  <td className="px-4 py-4 font-medium">INV-{invoice.id}</td>
                  <td className="px-4 py-4">
                    {invoice.user_id ? `Customer #${invoice.user_id}` : "Guest customer"}
                  </td>
                  <td className="px-4 py-4">{formatDate(invoice.created_at)}</td>
                  <td className="px-4 py-4">{getItemCount(invoice)}</td>
                  <td className="px-4 py-4">{money(invoice.total_amount)}</td>
                  <td className="px-4 py-4 capitalize">{invoice.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default InvoiceTable;
