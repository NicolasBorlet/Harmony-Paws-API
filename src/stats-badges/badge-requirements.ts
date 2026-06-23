/**
 * Supported badge requirement types.
 *
 * A badge's `requirementType` column references one of these keys. The badge
 * engine (`BadgeEngineService`) computes a numeric metric for each key and
 * unlocks a badge as soon as `metric >= requirementValue`.
 *
 * Boolean-style requirements (`is_premium`, `profile_completed`) are expressed
 * as 0/1 metrics with a `requirementValue` of 1.
 */
export const BADGE_REQUIREMENT_TYPES = {
  TOTAL_DISTANCE_KM: 'total_distance_km',
  TOTAL_ACTIVITIES: 'total_activities',
  TOTAL_DURATION_MINUTES: 'total_duration_minutes',
  CURRENT_STREAK: 'current_streak',
  LONGEST_STREAK: 'longest_streak',
  FRIENDS_COUNT: 'friends_count',
  MEETINGS_COUNT: 'meetings_count',
  DOGS_COUNT: 'dogs_count',
  ACTIVITIES_CREATED: 'activities_created',
  FORMATIONS_COMPLETED: 'formations_completed',
  MESSAGES_SENT: 'messages_sent',
  IS_PREMIUM: 'is_premium',
  PROFILE_COMPLETED: 'profile_completed',
} as const;

export type BadgeRequirementType =
  (typeof BADGE_REQUIREMENT_TYPES)[keyof typeof BADGE_REQUIREMENT_TYPES];

/**
 * Numeric metrics computed for a user, keyed by requirement type.
 */
export type UserMetrics = Record<BadgeRequirementType, number>;
