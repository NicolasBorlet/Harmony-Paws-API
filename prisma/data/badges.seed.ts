/**
 * Canonical badge catalog — single source of truth.
 *
 * This file is consumed by `prisma/seed.ts` to populate the `badge_categories`
 * and `badges` tables, and it mirrors the documentation found in
 * `docs/badges.xlsx`.
 *
 * Each badge references a `requirementType` (see `BADGE_REQUIREMENT_TYPES` in
 * `src/stats-badges/badge-requirements.ts`). The badge engine maps that type to
 * a numeric metric computed for a given user and unlocks the badge as soon as
 * the metric reaches `requirementValue`.
 *
 * Badges with a `null` requirementType are awarded manually (e.g. secret /
 * event badges) and are simply ignored by the automatic engine.
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface BadgeCategorySeed {
  code: string;
  nameKey: string;
  icon: string;
  color: string;
  displayOrder: number;
}

export interface BadgeSeed {
  categoryCode: string;
  code: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  points: number;
  requirementType: string | null;
  requirementValue: number | null;
  requirementUnit: string | null;
  isSecret: boolean;
  rarity: Rarity;
  displayOrder: number;
}

export const BADGE_CATEGORIES: BadgeCategorySeed[] = [
  {
    code: 'distance',
    nameKey: 'badge.category.distance',
    icon: 'route',
    color: '#4CAF50',
    displayOrder: 1,
  },
  {
    code: 'activity',
    nameKey: 'badge.category.activity',
    icon: 'directions-walk',
    color: '#2196F3',
    displayOrder: 2,
  },
  {
    code: 'streak',
    nameKey: 'badge.category.streak',
    icon: 'local-fire-department',
    color: '#FF5722',
    displayOrder: 3,
  },
  {
    code: 'duration',
    nameKey: 'badge.category.duration',
    icon: 'timer',
    color: '#009688',
    displayOrder: 4,
  },
  {
    code: 'social',
    nameKey: 'badge.category.social',
    icon: 'groups',
    color: '#9C27B0',
    displayOrder: 5,
  },
  {
    code: 'companion',
    nameKey: 'badge.category.companion',
    icon: 'pets',
    color: '#795548',
    displayOrder: 6,
  },
  {
    code: 'community',
    nameKey: 'badge.category.community',
    icon: 'campaign',
    color: '#FF9800',
    displayOrder: 7,
  },
  {
    code: 'education',
    nameKey: 'badge.category.education',
    icon: 'school',
    color: '#3F51B5',
    displayOrder: 8,
  },
  {
    code: 'special',
    nameKey: 'badge.category.special',
    icon: 'auto-awesome',
    color: '#FFC107',
    displayOrder: 9,
  },
];

const badge = (
  categoryCode: string,
  code: string,
  points: number,
  requirementType: string | null,
  requirementValue: number | null,
  requirementUnit: string | null,
  rarity: Rarity,
  displayOrder: number,
  icon: string,
  isSecret = false,
): BadgeSeed => ({
  categoryCode,
  code,
  nameKey: `badge.${code}.name`,
  descriptionKey: `badge.${code}.description`,
  icon,
  points,
  requirementType,
  requirementValue,
  requirementUnit,
  isSecret,
  rarity,
  displayOrder,
});

export const BADGES: BadgeSeed[] = [
  // --- Distance (total_distance_km) ---------------------------------------
  badge(
    'distance',
    'premiers_pas',
    10,
    'total_distance_km',
    1,
    'km',
    'common',
    1,
    'footprint',
  ),
  badge(
    'distance',
    'explorateur_10',
    25,
    'total_distance_km',
    10,
    'km',
    'common',
    2,
    'explore',
  ),
  badge(
    'distance',
    'randonneur_50',
    50,
    'total_distance_km',
    50,
    'km',
    'uncommon',
    3,
    'hiking',
  ),
  badge(
    'distance',
    'aventurier_100',
    100,
    'total_distance_km',
    100,
    'km',
    'rare',
    4,
    'terrain',
  ),
  badge(
    'distance',
    'globe_trotter_500',
    250,
    'total_distance_km',
    500,
    'km',
    'epic',
    5,
    'public',
  ),
  badge(
    'distance',
    'legende_1000',
    500,
    'total_distance_km',
    1000,
    'km',
    'legendary',
    6,
    'emoji-events',
  ),

  // --- Activities count (total_activities) --------------------------------
  badge(
    'activity',
    'premiere_balade',
    10,
    'total_activities',
    1,
    'count',
    'common',
    1,
    'directions-walk',
  ),
  badge(
    'activity',
    'habitue_10',
    25,
    'total_activities',
    10,
    'count',
    'common',
    2,
    'event-repeat',
  ),
  badge(
    'activity',
    'assidu_50',
    75,
    'total_activities',
    50,
    'count',
    'uncommon',
    3,
    'workspace-premium',
  ),
  badge(
    'activity',
    'marathonien_100',
    150,
    'total_activities',
    100,
    'count',
    'rare',
    4,
    'military-tech',
  ),
  badge(
    'activity',
    'infatigable_365',
    300,
    'total_activities',
    365,
    'count',
    'epic',
    5,
    'all-inclusive',
  ),

  // --- Streak (longest_streak) --------------------------------------------
  badge(
    'streak',
    'serie_3',
    20,
    'longest_streak',
    3,
    'days',
    'common',
    1,
    'whatshot',
  ),
  badge(
    'streak',
    'serie_7',
    50,
    'longest_streak',
    7,
    'days',
    'uncommon',
    2,
    'local-fire-department',
  ),
  badge(
    'streak',
    'serie_30',
    150,
    'longest_streak',
    30,
    'days',
    'rare',
    3,
    'bolt',
  ),
  badge(
    'streak',
    'serie_100',
    400,
    'longest_streak',
    100,
    'days',
    'legendary',
    4,
    'flare',
  ),

  // --- Duration (total_duration_minutes) ----------------------------------
  badge(
    'duration',
    'chrono_60',
    15,
    'total_duration_minutes',
    60,
    'minutes',
    'common',
    1,
    'timer',
  ),
  badge(
    'duration',
    'chrono_600',
    40,
    'total_duration_minutes',
    600,
    'minutes',
    'uncommon',
    2,
    'schedule',
  ),
  badge(
    'duration',
    'chrono_3000',
    120,
    'total_duration_minutes',
    3000,
    'minutes',
    'rare',
    3,
    'hourglass-top',
  ),

  // --- Social (friends_count / meetings_count) ----------------------------
  badge(
    'social',
    'premier_ami',
    15,
    'friends_count',
    1,
    'count',
    'common',
    1,
    'person-add',
  ),
  badge(
    'social',
    'cercle_5',
    30,
    'friends_count',
    5,
    'count',
    'common',
    2,
    'group',
  ),
  badge(
    'social',
    'populaire_20',
    100,
    'friends_count',
    20,
    'count',
    'rare',
    3,
    'groups',
  ),
  badge(
    'social',
    'premiere_rencontre',
    15,
    'meetings_count',
    1,
    'count',
    'common',
    4,
    'handshake',
  ),
  badge(
    'social',
    'sociable_10',
    60,
    'meetings_count',
    10,
    'count',
    'uncommon',
    5,
    'diversity-3',
  ),

  // --- Companions (dogs_count) --------------------------------------------
  badge(
    'companion',
    'premier_compagnon',
    10,
    'dogs_count',
    1,
    'count',
    'common',
    1,
    'pets',
  ),
  badge(
    'companion',
    'meute_3',
    50,
    'dogs_count',
    3,
    'count',
    'uncommon',
    2,
    'cruelty-free',
  ),
  badge(
    'companion',
    'grande_meute_5',
    120,
    'dogs_count',
    5,
    'count',
    'rare',
    3,
    'diversity-2',
  ),

  // --- Community (activities_created) -------------------------------------
  badge(
    'community',
    'organisateur_1',
    15,
    'activities_created',
    1,
    'count',
    'common',
    1,
    'add-location-alt',
  ),
  badge(
    'community',
    'organisateur_10',
    60,
    'activities_created',
    10,
    'count',
    'uncommon',
    2,
    'campaign',
  ),
  badge(
    'community',
    'chef_de_meute_50',
    150,
    'activities_created',
    50,
    'count',
    'rare',
    3,
    'stars',
  ),

  // --- Education (formations_completed) -----------------------------------
  badge(
    'education',
    'eleve_1',
    25,
    'formations_completed',
    1,
    'count',
    'common',
    1,
    'school',
  ),
  badge(
    'education',
    'studieux_5',
    75,
    'formations_completed',
    5,
    'count',
    'uncommon',
    2,
    'menu-book',
  ),
  badge(
    'education',
    'expert_10',
    150,
    'formations_completed',
    10,
    'count',
    'rare',
    3,
    'psychology',
  ),

  // --- Special (profile / premium / secret) -------------------------------
  badge(
    'special',
    'profil_complet',
    20,
    'profile_completed',
    1,
    'boolean',
    'common',
    1,
    'badge',
  ),
  badge(
    'special',
    'membre_premium',
    50,
    'is_premium',
    1,
    'boolean',
    'uncommon',
    2,
    'workspace-premium',
  ),
  // Secret badges: awarded manually (requirementType = null) — ignored by the engine.
  badge(
    'special',
    'pionnier',
    100,
    null,
    null,
    null,
    'epic',
    3,
    'rocket-launch',
    true,
  ),
  badge(
    'special',
    'noctambule',
    75,
    null,
    null,
    null,
    'rare',
    4,
    'nightlight',
    true,
  ),
];
