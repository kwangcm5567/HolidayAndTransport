import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./pages/Dashboard";
import { WeekendGetaway } from "./pages/WeekendGetaway";
import "./index.css";

const queryClient = new QueryClient();

export default function App() {
  const [tab, setTab] = useState<"holiday" | "weekend">("holiday");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Header activeTab={tab} onTabChange={setTab} />
        {tab === "holiday" ? <Dashboard /> : <WeekendGetaway />}
      </div>
    </QueryClientProvider>
  );
}
