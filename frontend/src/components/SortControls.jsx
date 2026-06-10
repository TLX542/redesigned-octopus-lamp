import React from "react";

function SortControls({ sortOption, onSortChange }) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="sort-select"
        className="text-sm font-medium text-slate-700"
      >
        Sort by
      </label>

      <select
        id="sort-select"
        value={sortOption}
        onChange={(e) => onSortChange?.(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500"
      >
        <option value="default">Default</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="popularity">Popularity</option>
      </select>
    </div>
  );
}

export default SortControls;