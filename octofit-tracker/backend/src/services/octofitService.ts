import { Activity, Team, User, Workout } from '../models/index.js';

type InputRecord = Record<string, unknown>;

function badRequest(message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(input: unknown): input is InputRecord {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isObjectId(input: unknown): input is string {
  return typeof input === 'string' && /^[a-f\d]{24}$/i.test(input);
}

function activityFocus(type: string): string {
  const normalized = type.toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking'].includes(normalized)) return 'endurance';
  if (['strength', 'weights', 'weight training'].includes(normalized)) return 'strength';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  if (!isRecord(_input)) throw badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = _input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw badRequest('Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw notFound('The requested user or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!isRecord(_input)) throw badRequest('Team details are required');
  const { name, mascot } = _input;
  if (typeof name !== 'string' || !name.trim()) throw badRequest('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw badRequest('Team mascot is required');

  const submittedMembers = _input.members ?? [];
  if (!Array.isArray(submittedMembers) || !submittedMembers.every(isObjectId)) {
    throw badRequest('Team members must be valid user IDs');
  }
  const memberIds = [...new Set(submittedMembers)];
  const memberCount = await User.countDocuments({ _id: { $in: memberIds } });
  if (memberCount !== memberIds.length) throw notFound('One or more team members do not exist');

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length) await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw notFound('No user was found for that email address');

  const [workouts, recentActivities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
  ]);
  const goalFocus = user.fitnessGoal?.trim().toLowerCase();
  const recentFocus = recentActivities[0] ? activityFocus(recentActivities[0].type) : undefined;
  const preferredFocus = goalFocus && workouts.some((workout) => workout.focus.toLowerCase() === goalFocus)
    ? goalFocus
    : recentFocus;

  return workouts
    .map((workout) => {
      const matchesGoal = Boolean(goalFocus && workout.focus.toLowerCase() === goalFocus);
      const matchesActivity = Boolean(recentFocus && workout.focus.toLowerCase() === recentFocus);
      const reason = matchesGoal
        ? `Matches your ${user.fitnessGoal} fitness goal.`
        : matchesActivity
          ? `Builds on your recent ${recentActivities[0].type} activity.`
          : 'A varied workout to support your fitness routine.';
      return { ...workout, reason };
    })
    .sort((left, right) => Number(right.focus.toLowerCase() === preferredFocus) - Number(left.focus.toLowerCase() === preferredFocus));
}

export { User };
