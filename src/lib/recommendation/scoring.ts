import type { UserVector, Shoe, ScoredShoe, SimilarityBreakdown } from './types';

// Configurable weights for different attributes
export const WEIGHTS = {
  supportLevel: 3,
  cushioning: 2,
  pace: 2,
  terrain: 1.5,
  width: 1.5,
  price: 2,
  durability: 1,
} as const;

export function computeScore(user: UserVector, shoe: Shoe): ScoredShoe {
  // Filter out excluded brands
  if (user.exclusions.brands.some(brand => shoe.brand.toLowerCase().includes(brand))) {
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
    price: priceSimilarity(user.priceTier, shoe.priceTier),
    durability: durabilitySimilarity(user.mileageKmPerWeek, shoe.durabilityKm),
  };

  // Calculate weighted score
  const rawScore = Object.entries(similarity).reduce((sum, [key, value]) => {
    const weight = WEIGHTS[key as keyof typeof WEIGHTS];
    return sum + (value * weight);
  }, 0);

  return {
    shoe,
    score: rawScore,
    similarityBreakdown: similarity,
  };
}

function supportLevelSimilarity(userLevel: string, shoeLevel: string): number {
  if (userLevel === shoeLevel) return 1;
  
  // Soft matches
  if (userLevel === 'neutral' && shoeLevel === 'stability') return 0.7;
  if (userLevel === 'stability' && shoeLevel === 'neutral') return 0.4;
  
  return 0.2;
}

function cushioningSimilarity(userCushioning: number, shoeCushioning: number): number {
  const diff = Math.abs(userCushioning - shoeCushioning);
  return Math.max(0, 1 - (diff / 10)); // Scale of 0-10
}

function paceSimilarity(userPaces: { easy: number; tempo: number }, shoePaceRange: { min: number; max: number }): number {
  const avgUserPace = (userPaces.easy + userPaces.tempo) / 2;
  const shoeMin = shoePaceRange.min;
  const shoeMax = shoePaceRange.max;
  
  // Check if user's average pace falls within shoe's range
  if (avgUserPace >= shoeMin && avgUserPace <= shoeMax) {
    return 1;
  }
  
  // Calculate distance from range
  const distanceFromRange = avgUserPace < shoeMin 
    ? shoeMin - avgUserPace 
    : avgUserPace - shoeMax;
  
  // Convert to similarity (closer = better)
  return Math.max(0, 1 - (distanceFromRange / 120)); // 2 minutes tolerance
}

function terrainSimilarity(userSurfaces: { road: number; treadmill: number; trail: number }, shoeTerrains: string[]): number {
  let score = 0;
  
  // Road and treadmill are similar for shoe purposes
  const roadTreadmillPercent = userSurfaces.road + userSurfaces.treadmill;
  const trailPercent = userSurfaces.trail;
  
  if (shoeTerrains.includes('road')) {
    score += (roadTreadmillPercent / 100) * 1;
  }
  
  if (shoeTerrains.includes('trail')) {
    score += (trailPercent / 100) * 1;
  }
  
  // Bonus for multi-terrain shoes if user runs mixed surfaces
  if (shoeTerrains.length > 1 && trailPercent > 20 && roadTreadmillPercent > 20) {
    score += 0.2;
  }
  
  return Math.min(1, score);
}

function widthSimilarity(userWidth: string, shoeWidthOptions: string[]): number {
  if (shoeWidthOptions.includes(userWidth)) return 1;
  
  // If shoe offers standard and user needs narrow/wide, it's partial match
  if (shoeWidthOptions.includes('standard') && userWidth !== 'standard') {
    return 0.5;
  }
  
  return 0.3;
}

function priceSimilarity(userPriceTier: string, shoePriceTier: string): number {
  if (userPriceTier === shoePriceTier) return 1;
  
  // Price tolerance mappings
  const priceOrder = ['budget', 'mid', 'premium'];
  const userIndex = priceOrder.indexOf(userPriceTier);
  const shoeIndex = priceOrder.indexOf(shoePriceTier);
  
  if (userIndex === -1 || shoeIndex === -1) return 0.5;
  
  const difference = Math.abs(userIndex - shoeIndex);
  if (difference === 1) return 0.7;
  if (difference === 2) return 0.3;
  
  return 1;
}

function durabilitySimilarity(weeklyKm: number, shoeDurabilityKm: number): number {
  // Estimate how many weeks the shoe will last
  const estimatedWeeks = shoeDurabilityKm / weeklyKm;
  
  // Optimal range is 8-16 weeks (2-4 months)
  if (estimatedWeeks >= 8 && estimatedWeeks <= 16) return 1;
  
  // Penalize shoes that won't last long enough or last too long
  if (estimatedWeeks < 8) {
    return Math.max(0.3, estimatedWeeks / 8);
  } else {
    return Math.max(0.5, 16 / estimatedWeeks);
  }
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
  };
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
  // $200+ has no upper limit
  return shoes;
}
