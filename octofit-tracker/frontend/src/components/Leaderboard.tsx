import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return <CapabilityCard<Entry>
    title="Leaderboard"
    description="Compare team point totals."
    path="/api/leaderboard"
    resource="leaderboard"
    emptyMessage="No leaderboard rankings are available yet."
    renderItems={(entries) => <ol>{entries.map((entry) => <li key={entry.rank}>
      {entry.teamName}: {entry.totalPoints} points
    </li>)}</ol>}
  />;
}
