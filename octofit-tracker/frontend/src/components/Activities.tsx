import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  return <CapabilityCard<Activity>
    title="Activities"
    description="Track student activity minutes and points."
    path="/api/activities"
    resource="activities"
    emptyMessage="No activities have been recorded yet."
    renderItems={(activities) => <ul>{activities.map((activity, index) => <li key={`${activity.type}-${index}`}>
      {activity.type}: {activity.minutes} minutes, {activity.points} points
    </li>)}</ul>}
  />;
}
