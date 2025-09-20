import type { QuizPayload, UserVector, ShoeRole, SupportLevel, PriceTier, Width } from './types';

const KM_PER_MILE = 1.60934;
const DEFAULT_PACE_SEC_PER_KM = 300; // 5:00/km fallback when user skips pace questions
const DEFAULT_SURFACE_SPLIT = {
  road: 70,
  treadmill: 20,
  trail: 10,
} as const;
const ROLE_ORDER: ShoeRole[] = ['daily', 'long-run', 'tempo', 'race', 'trail', 'recovery', 'stability'];

export function buildUserVector(quiz: QuizPayload): UserVector {
  const surfaces = normalizeSurfaceMix(quiz);
  const weeklyMileageKm = mileageStringToKm(quiz.weeklyMileage);
  const paceProfile = buildPaceProfile(quiz.easyPace, quiz.tempoWorkoutPace);

  return {
    rolesNeeded: determineRolesNeeded(quiz),
    supportLevel: mapSupportLevel(quiz.supportLevel),
    cushioning: mapCushioningPreference(quiz.cushioningPreference),
    preferredWidth: mapWidthNeeds(quiz.widthNeeds),
    priceTier: mapBudgetToPriceTier(quiz.budget),
    pacesSecPerKm: paceProfile,
    mileageKmPerWeek: weeklyMileageKm,
    surfaces,
    exclusions: {
      brands: extractExcludedBrands(quiz.excludedBrands),
    },
    preferVersatile: quiz.versatilityPreference.toLowerCase().includes('versatile'),
  };
}

function determineRolesNeeded(quiz: QuizPayload): ShoeRole[] {
  const roles = new Set<ShoeRole>();
  roles.add('daily');

  const weeklyMiles = extractMileageNumber(quiz.weeklyMileage);
  const furthestMiles = parseDistanceMiles(quiz.furthestRunDistance);
  const support = quiz.supportLevel.toLowerCase();
  const goal = quiz.runningGoal.toLowerCase();
  const injuryHistory = quiz.injuryHistory.toLowerCase();
  const wantsSpeed = /improve|faster|time|race|pr|pb/.test(goal);
  const multiRaceGoal = /5k|10k|half|marathon|ultra/.test(goal);
  const highMileage = weeklyMiles >= 30;
  const tempoProvided = hasValue(quiz.tempoWorkoutPace);
  const prefersSoft = quiz.cushioningPreference.toLowerCase().includes('plush');
  const heavyTrailUse = quiz.trailPercentage >= 30;
  const disciplinedDistance = furthestMiles >= 12 || /half|marathon|ultra/.test(goal);

  if (tempoProvided || wantsSpeed) {
    roles.add('tempo');
  }

  if (disciplinedDistance || weeklyMiles >= 25) {
    roles.add('long-run');
  }

  if (heavyTrailUse) {
    roles.add('trail');
  }

  if (wantsSpeed || multiRaceGoal) {
    roles.add('race');
  }

  if (support.includes('stability') || support.includes('motion')) {
    roles.add('stability');
  }

  if (highMileage || prefersSoft || injuryHistory.includes('injur') || injuryHistory.includes('recovery')) {
    roles.add('recovery');
  }

  return ROLE_ORDER.filter(role => roles.has(role));
}

function mapSupportLevel(supportLevel: string): SupportLevel {
  const normalized = supportLevel.toLowerCase();
  if (normalized.includes('motion')) return 'motion-control';
  if (normalized.includes('stability')) return 'stability';
  return 'neutral';
}

function mapCushioningPreference(cushioning: string): number {
  if (!cushioning) return 5;
  const normalized = cushioning.toLowerCase();

  const rangeMatch = normalized.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      return clamp((start + end) / 2, 0, 10);
    }
  }

  if (normalized.includes('minimal') || normalized.includes('firm')) return 3;
  if (normalized.includes('plush') || normalized.includes('max')) return 8;
  return 5;
}

function mapWidthNeeds(width: string): Width {
  const normalized = width.toLowerCase();
  if (normalized.includes('narrow')) return 'narrow';
  if (normalized.includes('wide')) return 'wide';
  return 'standard';
}

function mapBudgetToPriceTier(budget: string): PriceTier {
  const normalized = budget.toLowerCase();

  if (normalized.includes('under') || normalized.includes('$100-150')) {
    return 'budget';
  }
  if (normalized.includes('$200+')) {
    return 'premium';
  }
  return 'mid';
}

function buildPaceProfile(easyPace: string, tempoPace: string) {
  const easySeconds = paceStringToSecondsPerKm(easyPace, DEFAULT_PACE_SEC_PER_KM, { assumePerMileByDefault: true });
  const defaultTempo = Math.max(Math.round(easySeconds * 0.85), easySeconds - 45);
  const tempoSecondsRaw = paceStringToSecondsPerKm(tempoPace, defaultTempo, { assumePerMileByDefault: true });
  const tempoSeconds = Math.min(tempoSecondsRaw, easySeconds - 15);

  return {
    easy: easySeconds,
    tempo: tempoSeconds > 0 ? tempoSeconds : defaultTempo,
  };
}

function normalizeSurfaceMix(quiz: QuizPayload) {
  const raw = {
    road: sanitizePercentage(quiz.roadPercentage),
    treadmill: sanitizePercentage(quiz.treadmillPercentage),
    trail: sanitizePercentage(quiz.trailPercentage),
  };

  const total = raw.road + raw.treadmill + raw.trail;
  if (total === 100) {
    return raw;
  }

  if (total === 0) {
    return { ...DEFAULT_SURFACE_SPLIT };
  }

  const ratio = 100 / total;
  const road = Math.round(raw.road * ratio);
  const treadmill = Math.round(raw.treadmill * ratio);
  let trail = 100 - road - treadmill;

  if (trail < 0) {
    trail = Math.max(0, Math.round(raw.trail * ratio));
    // Adjust road to keep totals consistent if rounding overshoots
    const adjustment = road + treadmill + trail - 100;
    if (adjustment !== 0) {
      return {
        road: clamp(road - adjustment, 0, 100),
        treadmill,
        trail,
      };
    }
  }

  return {
    road: clamp(road, 0, 100),
    treadmill: clamp(treadmill, 0, 100),
    trail: clamp(trail, 0, 100),
  };
}

function sanitizePercentage(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return clamp(Math.round(value), 0, 100);
}

function paceStringToSecondsPerKm(
  paceStr: string,
  fallback = DEFAULT_PACE_SEC_PER_KM,
  options: { assumePerMileByDefault?: boolean } = {}
): number {
  const { assumePerMileByDefault = false } = options;
  const parsed = parsePaceString(paceStr);
  if (parsed === null) return fallback;

  const normalized = paceStr.toLowerCase();

  if (normalized.includes('km')) {
    return parsed;
  }

  if (normalized.includes('mile') || normalized.includes('mi')) {
    return secondsPerMileToPerKm(parsed);
  }

  if (assumePerMileByDefault && parsed > 420) {
    return secondsPerMileToPerKm(parsed);
  }

  return parsed;
}

function parsePaceString(paceStr: string): number | null {
  if (!paceStr) return null;
  const match = paceStr.trim().match(/(\d+):(\d{1,2})/);
  if (!match) return null;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;

  return minutes * 60 + seconds;
}

function secondsPerMileToPerKm(secondsPerMile: number) {
  return Math.round(secondsPerMile / KM_PER_MILE);
}

function mileageStringToKm(mileage: string): number {
  const miles = extractMileageNumber(mileage);
  return Math.round(miles * KM_PER_MILE);
}

function extractMileageNumber(mileage: string): number {
  if (!mileage) return 15;

  const numericValue = Number(mileage);
  if (!Number.isNaN(numericValue) && numericValue > 0) {
    return numericValue;
  }

  const rangeMatch = mileage.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      return (start + end) / 2;
    }
  }

  const plusMatch = mileage.match(/(\d+)\s*\+/);
  if (plusMatch) {
    const base = Number(plusMatch[1]);
    if (!Number.isNaN(base)) {
      return base;
    }
  }

  if (mileage.includes('0-10')) return 5;
  if (mileage.includes('11-20')) return 15;
  if (mileage.includes('21-30')) return 25;
  if (mileage.includes('31-40')) return 35;
  if (mileage.includes('41-50')) return 45;
  if (mileage.includes('51-60')) return 55;
  if (mileage.includes('60+')) return 65;

  return 15;
}

function parseDistanceMiles(distance: string): number {
  if (!distance) return 0;
  const numeric = Number(distance);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }
  const match = distance.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    return Number(match[1]);
  }
  return 0;
}

function hasValue(value: string) {
  return typeof value === 'string' && value.trim().length > 0;
}

function extractExcludedBrands(excludedBrands: string): string[] {
  if (!excludedBrands || excludedBrands.trim() === '') return [];

  return excludedBrands
    .split(',')
    .map(brand => brand.trim().toLowerCase())
    .filter(brand => brand.length > 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function convertPaceRangeToSeconds(paceRange: { minPacePerKm: string; maxPacePerKm: string }) {
  return {
    min: paceStringToSecondsPerKm(paceRange.minPacePerKm, DEFAULT_PACE_SEC_PER_KM, { assumePerMileByDefault: false }),
    max: paceStringToSecondsPerKm(paceRange.maxPacePerKm, DEFAULT_PACE_SEC_PER_KM, { assumePerMileByDefault: false }),
  };
}
