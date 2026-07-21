import Header from "@/components/Header";
import SessionBar from "@/components/SessionBar";
import SearchFilterBar from "@/components/SearchFilterBar";
import StatsBar from "@/components/StatsBar";
import ScannerTable from "@/components/ScannerTable";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#050607] p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        <Header />

        <SessionBar />

        <StatsBar />

        <SearchFilterBar />

        <ScannerTable />

      </div>
    </main>
  );
}