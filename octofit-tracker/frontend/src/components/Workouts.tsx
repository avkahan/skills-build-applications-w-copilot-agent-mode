import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  return <CapabilityCard<Suggestion>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
    resource="suggestions"
    emptyMessage="No workout suggestions are available yet."
    renderItems={(suggestions) => <ul>{suggestions.map((suggestion, index) => <li key={`${suggestion.title}-${index}`}>
      <strong>{suggestion.title}</strong>: {suggestion.reason}
    </li>)}</ul>}
  />;
}
