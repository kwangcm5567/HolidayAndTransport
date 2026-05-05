export function Header() {
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <span className="text-2xl">✈</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">SG 假期出行助手</h1>
          <p className="text-blue-200 text-xs">新加坡公共假期 × Google Flights × 酒店</p>
        </div>
      </div>
    </header>
  );
}
