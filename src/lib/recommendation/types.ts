export type ShoeRole = 'daily' | 'long-run' | 'tempo' | 'race' | 'trail' | 'recovery' | 'stability';

export type SupportLevel = 'neutral' | 'stability' | 'motion-control';
export type WeightClass = 'light' | 'mid' | 'max';
export type PriceTier = 'budget' | 'mid' | 'premium';
export type Width = 'narrow' | 'standard' | 'wide';
export type Terrain = 'road' | 'trail' | 'track';

export interface Shoe {
  name: string;
  brand: string;
  model: string;
  price: number;
  weightOunces: number;
  offsetMilimeters: number;
  heelStackMm: number;
  forefootStackMm: number;
  url: string;
  
  // Normalized attributes for matching
  shoeTypes: ShoeRole[];
  supportLevel: SupportLevel;
  cushioningScale: number; // 0-10
  weightClass: WeightClass;
  paceRange: {
    minPacePerKm: string;
    maxPacePerKm: string;
  };
  paceRangeSecPerKm: {
    min: number;
    max: number;
  };
  terrain: Terrain[];
  durabilityKm: number;
  priceTier: PriceTier;
  widthOptions: Width[];
  releaseYear: number;
}

export interface QuizPayload {
  runningGoal: string;
  weeklyMileage: string;
  furthestRunDistance: string;
  easyPace: string;
  tempoWorkoutPace: string;
  roadPercentage: number;
  treadmillPercentage: number;
  trailPercentage: number;
  supportLevel: string;
  cushioningPreference: string;
  widthNeeds: string;
  versatilityPreference: string;
  preferences: string;
  injuryHistory: string;
  budget: string;
  excludedBrands: string;
}

export interface UserVector {
  rolesNeeded: ShoeRole[];
  supportLevel: SupportLevel;
  cushioning: number; // 0-10
  preferredWidth: Width;
  priceTier: PriceTier;
  pacesSecPerKm: {
    easy: number;
    tempo: number;
  };
  mileageKmPerWeek: number;
  surfaces: {
    road: number;
    treadmill: number;
    trail: number;
  };
  exclusions: {
    brands: string[];
  };
  preferVersatile: boolean;
}

export interface SimilarityBreakdown {
  supportLevel: number;
  cushioning: number;
  pace: number;
  terrain: number;
  width: number;
  price: number;
  durability: number;
}

export interface ScoredShoe {
  shoe: Shoe;
  score: number;
  similarityBreakdown: SimilarityBreakdown;
}

export interface RecommendationResult {
  shoe: Shoe;
  score: number;
  explanation: string;
  rolesCovered: ShoeRole[];
}

export interface RotationResponse {
  rotation: RecommendationResult[];
  uncoveredRoles: ShoeRole[];
  totalScore: number;
}
