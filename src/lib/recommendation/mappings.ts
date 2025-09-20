import type { QuizPayload, UserVector, ShoeRole, SupportLevel, PriceTier, Width } from './types';

export function buildUserVector(quiz: QuizPayload): UserVector {
  return {
    rolesNeeded: determineRolesNeeded(quiz),
    supportLevel: mapSupportLevel(quiz.supportLevel),
    cushioning: mapCushioningPreference(quiz.cushioningPreference),
    preferredWidth: mapWidthNeeds(quiz.widthNeeds),
    priceTier: mapBudgetToPriceTier(quiz.budget),
    pacesSecPerKm: {
      easy: paceStringToSeconds(quiz.easyPace),
      tempo: paceStringToSeconds(quiz.tempoWorkoutPace),
    },
    mileageKmPerWeek: mileageStringToKm(quiz.weeklyMileage),
    surfaces: {
      road: quiz.roadPercentage,
      treadmill: quiz.treadmillPercentage,
      trail: quiz.trailPercentage,
    },
    exclusions: {
      brands: extractExcludedBrands(quiz.excludedBrands),
    },
    preferVersatile: quiz.versatilityPreference.includes('Versatile'),
  };
}

function determineRolesNeeded(quiz: QuizPayload): ShoeRole[] {
  const roles: Set<ShoeRole> = new Set();
  
  // Always include daily trainer
  roles.add('daily');
  
  // Add tempo if user has tempo pace and isn't just doing general fitness
  if (quiz.tempoWorkoutPace && !quiz.runningGoal.includes('General fitness')) {
    roles.add('tempo');
  }
  
  // Add long-run for higher mileage or marathon/ultra goals
  const weeklyMiles = extractMileageNumber(quiz.weeklyMileage);
  if (weeklyMiles >= 25 || quiz.runningGoal.includes('marathon') || quiz.runningGoal.includes('Ultra')) {
    roles.add('long-run');
  }
  
  // Add trail if significant trail running
  if (quiz.trailPercentage >= 30) {
    roles.add('trail');
  }
  
  // Add race if goal includes race/time improvement
  if (quiz.runningGoal.includes('time') || quiz.runningGoal.includes('5K') || quiz.runningGoal.includes('10K')) {
    roles.add('race');
  }
  
  // Add stability if support needed
  if (quiz.supportLevel.includes('Stability') || quiz.supportLevel.includes('Motion control')) {
    roles.add('stability');
  }
  
  // Add recovery for high mileage runners
  if (weeklyMiles >= 40) {
    roles.add('recovery');
  }
  
  return Array.from(roles);
}

function mapSupportLevel(supportLevel: string): SupportLevel {
  if (supportLevel.includes('Stability')) return 'stability';
  if (supportLevel.includes('Motion control')) return 'motion-control';
  return 'neutral';
}

function mapCushioningPreference(cushioning: string): number {
  if (cushioning.includes('Minimal') || cushioning.includes('1-3')) return 2;
  if (cushioning.includes('Balanced') || cushioning.includes('4-6')) return 5;
  if (cushioning.includes('Plush') || cushioning.includes('7-10')) return 8;
  return 5; // default to balanced
}

function mapWidthNeeds(width: string): Width {
  if (width.includes('Narrow')) return 'narrow';
  if (width.includes('Wide')) return 'wide';
  return 'standard';
}

function mapBudgetToPriceTier(budget: string): PriceTier {
  if (budget.includes('Under $100') || budget.includes('$100-150')) return 'budget';
  if (budget.includes('$200+')) return 'premium';
  return 'mid';
}

function paceStringToSeconds(paceStr: string): number {
  if (!paceStr || paceStr.trim() === '') return 300; // 5:00 default
  
  // Handle formats like "8:30", "7:15", etc.
  const match = paceStr.match(/(\d+):(\d+)/);
  if (match) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    return minutes * 60 + seconds;
  }
  
  return 300; // fallback
}

function mileageStringToKm(mileage: string): number {
  // Extract the number from strings like "21-30 miles"
  const miles = extractMileageNumber(mileage);
  return Math.round(miles * 1.60934); // convert to km
}

function extractMileageNumber(mileage: string): number {
  if (mileage.includes('0-10')) return 5;
  if (mileage.includes('11-20')) return 15;
  if (mileage.includes('21-30')) return 25;
  if (mileage.includes('31-40')) return 35;
  if (mileage.includes('41-50')) return 45;
  if (mileage.includes('51-60')) return 55;
  if (mileage.includes('60+')) return 70;
  return 15; // default
}

function extractExcludedBrands(excludedBrands: string): string[] {
  if (!excludedBrands || excludedBrands.trim() === '') return [];
  
  return excludedBrands
    .split(',')
    .map(brand => brand.trim().toLowerCase())
    .filter(brand => brand.length > 0);
}

// Helper function to convert pace range strings to seconds for shoes
export function convertPaceRangeToSeconds(paceRange: { minPacePerKm: string; maxPacePerKm: string }) {
  return {
    min: paceStringToSeconds(paceRange.minPacePerKm),
    max: paceStringToSeconds(paceRange.maxPacePerKm),
  };
}
