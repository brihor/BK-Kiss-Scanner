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
    const params = new URLSearchParams(window.location.search);

    if (params.get("app") === "1") {
      document.documentElement.classList.add("bk-app-mode");
    } else {
      document.documentElement.classList.remove("bk-app-mode");
    }

    const saved = localStorage.getItem("bk-sound-enabled");

    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }

    return () => {
      document.documentElement.classList.remove("bk-app-mode");
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "bk-sound-enabled",
      String(soundEnabled)
    );
  }, [soundEnabled]);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          handleInactiveSubscription();
          return;
        }

        const data = await response.json();

        if (
          !data.user ||
          !data.user.isActive ||
          data.user.subscriptionStatus !== "ACTIVE"
        ) {
          handleInactiveSubscription();
        }
      } catch (error) {
        console.error(
          "Unable to verify subscription:",
          error
        );
      }
    }

    function handleInactiveSubscription() {
      const isMobileApp =
        window.location.pathname.startsWith("/app-scanner");

      if (
        isMobileApp &&
        window.ReactNativeWebView
      ) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "SUBSCRIPTION_INACTIVE",
          })
        );

        return;
      }

      window.location.href = "/login";
    }

    checkSubscription();

    const interval = window.setInterval(
      checkSubscription,
      60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  function handleNotificationCategory(
    category: Exclude<FilterType, "ALL">
  ) {
    setActiveFilter(category);
    setSearchTerm("");
  }

  return (
    <main>
      <div className="dashboard-container">
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