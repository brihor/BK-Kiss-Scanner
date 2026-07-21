"use client";

import { useEffect, useState } from "react";
import "./dashboard.css";

import Header from "@/components/Header";
import SessionBar from "@/components/SessionBar";
import StatsBar from "@/components/StatsBar";
import SearchFilterBar from "@/components/SearchFilterBar";
import ScannerTable from "@/components/ScannerTable";

export type FilterType =
  | "ALL"
  | "FOREX"
  | "METALS"
  | "INDICES";

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] =
    useState<FilterType>("ALL");

  const [searchTerm, setSearchTerm] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("bk-sound-enabled");
    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "bk-sound-enabled",
      String(soundEnabled)
    );
  }, [soundEnabled]);

  function handleNotificationCategory(
    category: Exclude<FilterType, "ALL">
  ) {
    setActiveFilter(category);
    setSearchTerm("");
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <Header />
        <SessionBar />
        <StatsBar />

        <SearchFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <ScannerTable
          activeFilter={activeFilter}
          searchTerm={searchTerm}
          onViewCategory={handleNotificationCategory}
        />
      </div>
    </main>
  );
}