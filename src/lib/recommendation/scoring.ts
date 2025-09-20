import type { UserVector, Shoe, ScoredShoe, SimilarityBreakdown, ShoeRole } from './types';

const ROLE_PRIORITY: Record<ShoeRole, number> = {
  daily: 1,
  'long-run': 0.95,
  tempo: 0.9,
  race: 0.85,
  trail: 0.85,
  recovery: 0.75,
  stability: 0.8,
};

// Configurable weights for different attributes
export const WEIGHTS = {
  supportLevel: 2.5,
  cushioning: 2,
  pace: 2,
  terrain: 1.5,
  width: 1.5,
  price: 1.75,
  durability: 1,
  roleFit: 2.5,
  versatility: 1,
} as const;

export function computeScore(user: UserVector, shoe: Shoe): ScoredShoe {
  if (isExcludedBrand(user, shoe)) {
    return {
      shoe,
      score: 0,
      similarityBreakdown: createZeroSimilarity(),
    };
  }

  const similarity: SimilarityBreakdown = {
    supportLevel: supportLevelSimilarity(user.supportLevel, shoe.supportLevel),
    cushioning: cushioningSimilarity(user.cushioning, shoe.cushioningScale),
    pace: paceSimilarity(user.pacesSecPerKm, shoe.paceRangeSecPerKm),
    terrain: terrainSimilarity(user.surfaces, shoe.terrain),
    width: widthSimilarity(user.preferredWidth, shoe.widthOptions),
    price: priceSimilarity(user.priceTier, shoe.priceTier, shoe.price),
    durability: durabilitySimilarity(user.mileageKmPerWeek, shoe.durabilityKm),
    roleFit: roleFitSimilarity(user, shoe),
    versatility: versatilityAlignment(user, shoe),
  };

  const rawScore = Object.entries(similarity).reduce((sum, [key, value]) => {
    const weight = WEIGHTS[key as keyof typeof WEIGHTS] ?? 1;
    return sum + value * weight;
  }, 0);

  return {
    shoe,
    score: Number(rawScore.toFixed(3)),
    similarityBreakdown: similarity,
  };
}

function isExcludedBrand(user: UserVector, shoe: Shoe) {
  return user.exclusions.brands.some(brand => shoe.brand.toLowerCase().includes(brand));
}

function supportLevelSimilarity(userLevel: string, shoeLevel: string): number {
  if (userLevel === shoeLevel) return 1;

  if (userLevel === 'neutral' && shoeLevel === 'stability') return 0.7;
  if (userLevel === 'stability' && shoeLevel === 'neutral') return 0.45;
  if (userLevel === 'motion-control' && shoeLevel === 'stability') return 0.75;

  return 0.25;
}

function cushioningSimilarity(userPreference: number, shoeCushioning: number): number {
  const diff = Math.abs(userPreference - shoeCushioning);
  return clamp(1 - diff / 8, 0, 1);
}

function paceSimilarity(
  userPaces: { easy: number; tempo: number },
  shoePaceRange: { min: number; max: number }
): number {
  const easy = userPaces.easy;
  const tempo = userPaces.tempo;
  const userMin = Math.min(easy, tempo);
  const userMax = Math.max(easy, tempo);

  if (userMin >= shoePaceRange.min && userMax <= shoePaceRange.max) {
    return 1;
  }

  const distanceBelow = shoePaceRange.min - userMax;
  const distanceAbove = userMin - shoePaceRange.max;
  const over = Math.max(distanceBelow, distanceAbove, 0);

  // 90 seconds buffer keeps close matches relevant even if slightly outside
  return clamp(1 - over / 90, 0, 1);
}

function terrainSimilarity(
  userSurfaces: { road: number; treadmill: number; trail: number },
  shoeTerrains: string[]
): number {
  const roadShare = (userSurfaces.road + userSurfaces.treadmill) / 100;
  const trailShare = userSurfaces.trail / 100;
  let score = 0;

  if (shoeTerrains.includes('road')) {
    score += roadShare;
  }

  if (shoeTerrains.includes('trail')) {
    score += trailShare;
  }

  if (shoeTerrains.length > 1 && roadShare > 0.2 && trailShare > 0.2) {
    score += 0.15;
  }

  return clamp(score, 0, 1);
}

function widthSimilarity(userWidth: string, shoeWidthOptions: string[]): number {
  if (shoeWidthOptions.includes(userWidth)) {
    return 1;
  }

  if (userWidth !== 'standard' && shoeWidthOptions.includes('standard')) {
    return 0.55;
  }

  return 0.25;
}

function priceSimilarity(userPriceTier: string, shoePriceTier: string, shoePrice: number): number {
  if (userPriceTier === shoePriceTier) {
    return 1;
  }

  const priceOrder = ['budget', 'mid', 'premium'];
  const userIndex = priceOrder.indexOf(userPriceTier);
  const shoeIndex = priceOrder.indexOf(shoePriceTier);

  if (userIndex === -1 || shoeIndex === -1) {
    return clamp(200 / Math.max(shoePrice, 1), 0, 1);
  }

  const difference = Math.abs(userIndex - shoeIndex);
  if (difference === 1) return 0.7;
  if (difference === 2) return 0.35;

  return 0.5;
}

function durabilitySimilarity(weeklyKm: number, shoeDurabilityKm: number): number {
  if (weeklyKm <= 0) {
    // Fall back to default assumption of moderate mileage
    return clamp(shoeDurabilityKm / 500, 0.4, 1);
  }

  const estimatedWeeks = shoeDurabilityKm / weeklyKm;

  if (estimatedWeeks >= 8 && estimatedWeeks <= 20) {
    return 1;
  }

  if (estimatedWeeks < 8) {
    return clamp(estimatedWeeks / 8, 0.3, 0.95);
  }

  return clamp(16 / estimatedWeeks, 0.5, 0.9);
}

function roleFitSimilarity(user: UserVector, shoe: Shoe): number {
  const overlappingRoles = shoe.shoeTypes.filter(role => user.rolesNeeded.includes(role));

  if (overlappingRoles.length === 0) {
    return 0.15;
  }

  const priorityScore = overlappingRoles.reduce((sum, role) => sum + ROLE_PRIORITY[role], 0);
  const averagePriority = priorityScore / overlappingRoles.length;
  const coverageRatio = overlappingRoles.length / Math.min(user.rolesNeeded.length || 1, 3);
  const specializationFactor = shoe.shoeTypes.length <= 2 ? 1 : 0.9;

  return clamp(0.45 + averagePriority * 0.35 + coverageRatio * 0.25, 0, 1) * specializationFactor;
}

function versatilityAlignment(user: UserVector, shoe: Shoe): number {
  const roleCount = shoe.shoeTypes.length;

  if (roleCount <= 1) {
    return user.preferVersatile ? 0.5 : 1;
  }

  if (user.preferVersatile) {
    return clamp(0.65 + 0.15 * Math.min(roleCount - 1, 3), 0, 1);
  }

  return roleCount === 2 ? 0.9 : 0.6;
}

function createZeroSimilarity(): SimilarityBreakdown {
  return {
    supportLevel: 0,
    cushioning: 0,
    pace: 0,
    terrain: 0,
    width: 0,
    price: 0,
    durability: 0,
    roleFit: 0,
    versatility: 0,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Utility function to filter shoes by budget ceiling
export function filterByBudget(shoes: Shoe[], userBudget: string): Shoe[] {
  if (userBudget.includes('Under $100')) {
    return shoes.filter(shoe => shoe.price < 100);
  }
  if (userBudget.includes('$100-150')) {
    return shoes.filter(shoe => shoe.price <= 150);
  }
  if (userBudget.includes('$150-200')) {
    return shoes.filter(shoe => shoe.price <= 200);
  }
  return shoes;
}
