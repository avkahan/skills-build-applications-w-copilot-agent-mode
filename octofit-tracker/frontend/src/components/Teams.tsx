import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: unknown[] };

export default function Teams() {
  return <CapabilityCard<Team>
    title="Teams"
    description="Manage teams and members."
    path="/api/teams"
    resource="teams"
    emptyMessage="No teams have been created yet."
    renderItems={(teams) => <ul>{teams.map((team, index) => <li key={`${team.name}-${index}`}>
      {team.name} ({team.members?.length ?? 0} members)
    </li>)}</ul>}
  />;
}
