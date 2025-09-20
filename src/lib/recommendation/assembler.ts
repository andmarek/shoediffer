import type { UserVector, ScoredShoe, ShoeRole } from './types';

export function assembleRotation(user: UserVector, scoredShoes: ScoredShoe[]): ScoredShoe[] {
  const rolesRemaining = new Set(user.rolesNeeded);
  const rotation: ScoredShoe[] = [];
  const MAX_PAIRS = user.preferVersatile ? 3 : 5; // Fewer shoes if user prefers versatile options
  
  // Create a working pool, filtered and sorted
  let pool = scoredShoes
    .filter(scored => scored.score > 0) // Remove excluded shoes
    .sort((a, b) => b.score - a.score); // Sort by score descending
  
  while (rolesRemaining.size > 0 && rotation.length < MAX_PAIRS && pool.length > 0) {
    // Re-sort pool by coverage potential and score
    pool = pool.sort((a, b) => {
      const aCoverage = calculateCoverage(a.shoe, rolesRemaining);
      const bCoverage = calculateCoverage(b.shoe, rolesRemaining);
      
      // Primary sort: coverage count (more roles covered = better)
      if (aCoverage !== bCoverage) {
        return bCoverage - aCoverage;
      }
      
      // Secondary sort: score (higher score = better)
      return b.score - a.score;
    });
    
    // Pick the best shoe
    const bestShoe = pool.shift();
    if (!bestShoe) break;
    
    rotation.push(bestShoe);
    
    // Remove covered roles
    bestShoe.shoe.shoeTypes.forEach(role => {
      rolesRemaining.delete(role as ShoeRole);
    });
    
    // Apply budget penalty to remaining shoes if we're approaching budget limits
    if (rotation.length >= 2) {
      const avgPrice = rotation.reduce((sum, shoe) => sum + shoe.shoe.price, 0) / rotation.length;
      pool = pool.map(scored => {
        if (scored.shoe.price > avgPrice * 1.2) {
          return {
            ...scored,
            score: scored.score * 0.8, // Penalty for expensive shoes
          };
        }
        return scored;
      });
    }
  }
  
  return rotation;
}

function calculateCoverage(shoe: any, rolesRemaining: Set<ShoeRole>): number {
  return shoe.shoeTypes.filter((role: ShoeRole) => rolesRemaining.has(role)).length;
}

// Helper function to identify what roles are covered by the rotation
export function getCoveredRoles(rotation: ScoredShoe[]): ShoeRole[] {
  const covered = new Set<ShoeRole>();
  
  rotation.forEach(scored => {
    scored.shoe.shoeTypes.forEach(role => {
      covered.add(role as ShoeRole);
    });
  });
  
  return Array.from(covered);
}

// Helper function to find uncovered roles
export function getUncoveredRoles(user: UserVector, rotation: ScoredShoe[]): ShoeRole[] {
  const covered = new Set(getCoveredRoles(rotation));
  return user.rolesNeeded.filter(role => !covered.has(role));
}

// Alternative assembly strategy for users who prefer specialized shoes
export function assembleSpecializedRotation(user: UserVector, scoredShoes: ScoredShoe[]): ScoredShoe[] {
  const rolesRemaining = new Set(user.rolesNeeded);
  const rotation: ScoredShoe[] = [];
  const MAX_PAIRS = 5;
  
  // For each role, find the best specialized shoe
  user.rolesNeeded.forEach(role => {
    if (rotation.length >= MAX_PAIRS) return;
    
    const candidatesForRole = scoredShoes
      .filter(scored => 
        scored.score > 0 && 
        scored.shoe.shoeTypes.includes(role) &&
        !rotation.some(existing => existing.shoe.name === scored.shoe.name)
      )
      .sort((a, b) => {
        // Prefer shoes that are more specialized for this role
        const aSpecialization = a.shoe.shoeTypes.length;
        const bSpecialization = b.shoe.shoeTypes.length;
        
        if (aSpecialization !== bSpecialization) {
          return aSpecialization - bSpecialization; // Fewer roles = more specialized
        }
        
        return b.score - a.score;
      });
    
    if (candidatesForRole.length > 0) {
      rotation.push(candidatesForRole[0]);
      rolesRemaining.delete(role);
    }
  });
  
  return rotation;
}

// Quality check function
export function validateRotation(user: UserVector, rotation: ScoredShoe[]): {
  isValid: boolean;
  issues: string[];
  coverage: number; // percentage of roles covered
} {
  const issues: string[] = [];
  const covered = getCoveredRoles(rotation);
  const coverage = (covered.length / user.rolesNeeded.length) * 100;
  
  if (rotation.length === 0) {
    issues.push('No shoes selected');
  }
  
  if (coverage < 80) {
    issues.push(`Low role coverage: ${coverage.toFixed(1)}%`);
  }
  
  if (rotation.length > 5) {
    issues.push('Too many shoes in rotation');
  }
  
  // Check for budget issues
  const totalCost = rotation.reduce((sum, scored) => sum + scored.shoe.price, 0);
  const avgCost = totalCost / rotation.length;
  
  if (user.priceTier === 'budget' && avgCost > 125) {
    issues.push('Average shoe price exceeds budget preference');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    coverage,
  };
}
