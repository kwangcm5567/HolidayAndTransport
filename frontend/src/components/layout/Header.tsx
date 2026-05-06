interface Props {
  activeTab: "holiday" | "weekend";
  onTabChange: (tab: "holiday" | "weekend") => void;
}

export function Header({ activeTab, onTabChange }: Props) {
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <span className="text-2xl">✈</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">SG 假期出行助手</h1>
          <p className="text-blue-200 text-xs">新加坡公共假期 × Google Flights × 酒店</p>
        </div>
        <nav className="flex gap-1">
          <button
            onClick={() => onTabChange("holiday")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === "holiday"
                ? "bg-white text-blue-700"
                : "text-blue-100 hover:bg-blue-600"
            }`}
          >
            📅 假期规划
          </button>
          <button
            onClick={() => onTabChange("weekend")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === "weekend"
                ? "bg-white text-blue-700"
                : "text-blue-100 hover:bg-blue-600"
            }`}
          >
            🏝️ 周末出游
          </button>
        </nav>
      </div>
    </header>
  );
}
