"use client";

import { useEffect } from "react";
import "./app-scanner.css";
import DashboardPage from "../dashboard/page";

export default function AppScannerPage() {
  useEffect(() => {
    document.documentElement.classList.add("bk-app-mode");

    return () => {
      document.documentElement.classList.remove("bk-app-mode");
    };
  }, []);

  return (
    <div className="app-scanner-page">
      <DashboardPage />
    </div>
  );
}