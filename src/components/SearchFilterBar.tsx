"use client";

import type { FilterType } from "@/app/dashboard/page";

type Props = {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export default function SearchFilterBar({
  activeFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
}: Props) {
  const filters: FilterType[] = [
    "ALL",
    "FOREX",
    "METALS",
    "INDICES",
  ];

  const renderIcon = (filter: FilterType) => {
    if (filter === "ALL") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c3 3.5 3 14 0 18" />
          <path d="M12 3c-3 3.5-3 14 0 18" />
        </svg>
      );
    }

    if (filter === "FOREX") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M7 7h11" />
          <path d="m15 4 3 3-3 3" />
          <path d="M17 17H6" />
          <path d="m9 14-3 3 3 3" />
        </svg>
      );
    }

    if (filter === "METALS") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M5 9h14l2 8H3l2-8Z" />
          <path d="M8 9 10 5h4l2 4" />
          <path d="M7 13h10" />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 2 5-6" />
        <path d="M16 7h3v3" />
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="🔍 Search Pair..."
          aria-label="Search scanner pairs"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none lg:w-80"
        />

        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                aria-pressed={isActive}
                className={`relative flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold transition duration-200 ${
                  isActive
                    ? "border-red-500 bg-zinc-800 text-white shadow-[0_8px_18px_-10px_rgba(239,68,68,1)]"
                    : "border-zinc-700 bg-zinc-800 text-gray-300 hover:border-zinc-500 hover:bg-zinc-700"
                }`}
              >
                <span
                  className={
                    isActive ? "text-red-400" : "text-gray-400"
                  }
                >
                  {renderIcon(filter)}
                </span>

                <span>{filter}</span>

                <span
                  className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-red-500 transition-all duration-200 ${
                    isActive
                      ? "w-3/4 shadow-[0_0_10px_rgba(239,68,68,1)]"
                      : "w-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}