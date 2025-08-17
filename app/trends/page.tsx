import TrendFeed from "@/components/TrendFeed";

export default function TrendsPage() {
  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Trending Signals</h1>
      <p className="text-white/70 text-sm">
        Ranking compares the last 15 minutes vs the prior 24 hours. Rank metrics (e.g., app store ranks) are inverted so lower rank = higher score.
      </p>
      <TrendFeed />
    </main>
  );
}
