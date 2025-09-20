import type { UserVector, ScoredShoe, ShoeRole } from './types';

export function assembleRotation(user: UserVector, scoredShoes: ScoredShoe[]): ScoredShoe[] {
  const maxPairs = user.preferVersatile ? 3 : 5;
  const rotation: ScoredShoe[] = [];
  const rolesRemaining = new Set<ShoeRole>(user.rolesNeeded);
  const candidatePool = buildCandidatePool(scoredShoes);
  const takenNames = new Set<string>();

  // Stage 1: lock in anchors for the highest priority needs
  deriveEssentialRoles(user).forEach(role => {
    if (rotation.length >= maxPairs || !rolesRemaining.has(role)) return;
    const candidate = selectBestCandidate({
      pool: candidatePool,
      user,
      rolesRemaining,
      takenNames,
      rotation,
      focusRole: role,
    });

    if (candidate) {
      commitCandidate(candidate, rotation, rolesRemaining, takenNames);
    }
  });

  // Stage 2: cover remaining roles while respecting budget and versatility preferences
  while (rotation.length < maxPairs && rolesRemaining.size > 0) {
    const next = selectBestCandidate({
      pool: candidatePool,
      user,
      rolesRemaining,
      takenNames,
      rotation,
    });

    if (!next) break;
    commitCandidate(next, rotation, rolesRemaining, takenNames);
  }

  // Stage 3: if user prefers smaller versatile rotation but we still have room,
  // add one high scoring generalist as an optional flex pick
  if (rotation.length < maxPairs && rotation.length < 2) {
    const versatilePick = selectHighScoringGeneralist(candidatePool, takenNames);
    if (versatilePick) {
      commitCandidate(versatilePick, rotation, rolesRemaining, takenNames);
    }
  }

  return rotation;
}

function buildCandidatePool(scoredShoes: ScoredShoe[]): ScoredShoe[] {
  return scoredShoes
    .filter(candidate => candidate.score > 0)
    .slice()
    .sort((a, b) => b.score - a.score);
}

function deriveEssentialRoles(user: UserVector): ShoeRole[] {
  const priorityOrder: ShoeRole[] = ['daily', 'stability', 'long-run', 'tempo', 'trail'];
  return priorityOrder.filter(role => user.rolesNeeded.includes(role));
}

interface SelectionContext {
  pool: ScoredShoe[];
  user: UserVector;
  rolesRemaining: Set<ShoeRole>;
  takenNames: Set<string>;
  rotation: ScoredShoe[];
  focusRole?: ShoeRole;
}

function selectBestCandidate(context: SelectionContext): ScoredShoe | null {
  const {
    pool,
    user,
    rolesRemaining,
    takenNames,
    rotation,
    focusRole,
  } = context;

  let best: ScoredShoe | null = null;
  let bestScore = -Infinity;

  for (const candidate of pool) {
    if (takenNames.has(candidate.shoe.name)) continue;
    if (focusRole && !candidate.shoe.shoeTypes.includes(focusRole)) continue;

    const evaluation = evaluateCandidate(candidate, user, rolesRemaining, rotation, focusRole);

    if (evaluation > bestScore) {
      best = candidate;
      bestScore = evaluation;
    }
  }

  if (!best) return null;

  removeFromPool(pool, best);
  return best;
}

function evaluateCandidate(
  candidate: ScoredShoe,
  user: UserVector,
  rolesRemaining: Set<ShoeRole>,
  rotation: ScoredShoe[],
  focusRole?: ShoeRole
): number {
  const { similarityBreakdown, shoe, score } = candidate;
  const overlappingRoles = shoe.shoeTypes.filter(role => rolesRemaining.has(role));

  const coverageBonus = overlappingRoles.length > 0 ? 1.2 * overlappingRoles.length : 0.3;
  const roleFitBonus = similarityBreakdown.roleFit * 3;
  const paceSupportBalance = (similarityBreakdown.pace + similarityBreakdown.supportLevel) * 1.25;
  const versatilityBonus = similarityBreakdown.versatility * (user.preferVersatile ? 1.8 : 0.9);
  const cushioningBonus = similarityBreakdown.cushioning * 0.8;
  const focusBonus = focusRole && shoe.shoeTypes.includes(focusRole) ? 2 : 0;

  const baseComposite = score + coverageBonus + roleFitBonus + paceSupportBalance + versatilityBonus + cushioningBonus + focusBonus;
  const priceFactor = computePriceFactor(candidate, user, rotation);

  return baseComposite * priceFactor;
}

function computePriceFactor(candidate: ScoredShoe, user: UserVector, rotation: ScoredShoe[]): number {
  if (user.priceTier === 'premium') {
    return 1;
  }

  const price = candidate.shoe.price;
  const baseThreshold = user.priceTier === 'budget' ? 150 : 210;

  if (rotation.length === 0) {
    if (price > baseThreshold) {
      return user.priceTier === 'budget' ? 0.8 : 0.9;
    }
    return 1;
  }

  const currentAverage = rotation.reduce((sum, item) => sum + item.shoe.price, 0) / rotation.length;
  const toleranceMultiplier = user.priceTier === 'budget' ? 1.15 : 1.3;
  const tolerance = currentAverage * toleranceMultiplier;

  if (price > tolerance) {
    return user.priceTier === 'budget' ? 0.75 : 0.85;
  }

  return 1.05; // small boost for staying on budget as rotation grows
}

function commitCandidate(
  candidate: ScoredShoe,
  rotation: ScoredShoe[],
  rolesRemaining: Set<ShoeRole>,
  takenNames: Set<string>
) {
  rotation.push(candidate);
  takenNames.add(candidate.shoe.name);

  candidate.shoe.shoeTypes.forEach(role => {
    rolesRemaining.delete(role);
  });
}

function selectHighScoringGeneralist(pool: ScoredShoe[], takenNames: Set<string>): ScoredShoe | null {
  for (const candidate of pool) {
    if (takenNames.has(candidate.shoe.name)) continue;
    if (candidate.shoe.shoeTypes.length >= 2) {
      removeFromPool(pool, candidate);
      return candidate;
    }
  }
  return null;
}

function removeFromPool(pool: ScoredShoe[], candidate: ScoredShoe) {
  const index = pool.findIndex(item => item.shoe.name === candidate.shoe.name);
  if (index >= 0) {
    pool.splice(index, 1);
  }
}

export function getCoveredRoles(rotation: ScoredShoe[]): ShoeRole[] {
  const covered = new Set<ShoeRole>();

  rotation.forEach(scored => {
    scored.shoe.shoeTypes.forEach(role => {
      covered.add(role);
    });
  });

  return Array.from(covered);
}

export function getUncoveredRoles(user: UserVector, rotation: ScoredShoe[]): ShoeRole[] {
  const covered = new Set(getCoveredRoles(rotation));
  return user.rolesNeeded.filter(role => !covered.has(role));
}

export function assembleSpecializedRotation(user: UserVector, scoredShoes: ScoredShoe[]): ScoredShoe[] {
  const maxPairs = 5;
  const candidatePool = buildCandidatePool(scoredShoes);
  const rotation: ScoredShoe[] = [];
  const rolesRemaining = new Set<ShoeRole>(user.rolesNeeded);
  const takenNames = new Set<string>();

  user.rolesNeeded.forEach(role => {
    if (rotation.length >= maxPairs) return;

    const bestForRole = selectBestCandidate({
      pool: candidatePool,
      user,
      rolesRemaining,
      takenNames,
      rotation,
      focusRole: role,
    });

    if (bestForRole) {
      commitCandidate(bestForRole, rotation, rolesRemaining, takenNames);
    }
  });

  return rotation;
}

export function validateRotation(user: UserVector, rotation: ScoredShoe[]): {
  isValid: boolean;
  issues: string[];
  coverage: number;
} {
  const issues: string[] = [];
  const covered = getCoveredRoles(rotation);
  const coverage = user.rolesNeeded.length
    ? (covered.length / user.rolesNeeded.length) * 100
    : 0;

  if (rotation.length === 0) {
    issues.push('No shoes selected');
  }

  if (coverage < 80) {
    issues.push(`Low role coverage: ${coverage.toFixed(1)}%`);
  }

  if (rotation.length > 5) {
    issues.push('Too many shoes in rotation');
  }

  const totalCost = rotation.reduce((sum, scored) => sum + scored.shoe.price, 0);
  const avgCost = rotation.length ? totalCost / rotation.length : 0;

  if (user.priceTier === 'budget' && avgCost > 140) {
    issues.push('Average shoe price exceeds budget preference');
  }

  return {
    isValid: issues.length === 0,
    issues,
    coverage,
  };
}
