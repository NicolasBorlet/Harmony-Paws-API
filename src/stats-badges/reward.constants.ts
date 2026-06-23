/** 1 os = 10 XP */
export const OS_TO_XP_RATIO = 10;

/** Cumulative XP thresholds for each level (index = level - 1). */
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000,
];

export function osToExperience(os: number): number {
  return os * OS_TO_XP_RATIO;
}

export function computeActivityOs(
  distanceKm: number,
  durationMinutes: number,
): number {
  return Math.max(1, Math.floor(distanceKm * 10 + durationMinutes * 1));
}

export function computeBadgeReward(badgePoints: number): {
  points: number;
  experience: number;
} {
  return {
    points: badgePoints,
    experience: osToExperience(badgePoints),
  };
}

export function computeLevel(totalExperience: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExperience >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}
