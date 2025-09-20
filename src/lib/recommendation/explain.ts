import type { UserVector, ScoredShoe, ShoeRole } from './types';

export function buildExplanation(user: UserVector, scoredShoe: ScoredShoe): string {
  const { shoe, similarityBreakdown: sim } = scoredShoe;
  const reasons: string[] = [];
  
  // Support level match
  if (sim.supportLevel >= 0.9) {
    if (user.supportLevel === 'stability') {
      reasons.push('provides the stability support you need');
    } else if (user.supportLevel === 'motion-control') {
      reasons.push('offers motion control for your running style');
    } else {
      reasons.push('matches your neutral foot strike');
    }
  } else if (sim.supportLevel >= 0.6) {
    reasons.push('offers compatible support for your needs');
  }
  
  // Cushioning match
  if (sim.cushioning >= 0.8) {
    if (user.cushioning <= 3) {
      reasons.push('provides the firm, responsive feel you prefer');
    } else if (user.cushioning >= 7) {
      reasons.push('delivers the plush cushioning you want');
    } else {
      reasons.push('hits your balanced cushioning preference');
    }
  }
  
  // Pace match
  if (sim.pace >= 0.8) {
    reasons.push('works well for your typical training paces');
  } else if (sim.pace >= 0.6) {
    reasons.push('suitable for your pace range');
  }
  
  // Terrain match
  if (sim.terrain >= 0.8) {
    if (user.surfaces.trail >= 30) {
      reasons.push('handles both road and trail running');
    } else {
      reasons.push('perfect for your road-focused training');
    }
  }
  
  // Width match
  if (sim.width >= 0.9) {
    if (user.preferredWidth !== 'standard') {
      reasons.push(`available in ${user.preferredWidth} width`);
    }
  }
  
  // Price match
  if (sim.price >= 0.9) {
    reasons.push('fits your budget perfectly');
  } else if (sim.price >= 0.6) {
    reasons.push('offers good value for your budget');
  }
  
  // Role-specific reasons
  const roleReasons = getRoleSpecificReasons(shoe.shoeTypes, user.rolesNeeded);
  reasons.push(...roleReasons);
  
  // Durability
  if (sim.durability >= 0.8) {
    reasons.push('should last well with your weekly mileage');
  }
  
  // Build final explanation
  const shoeRoles = shoe.shoeTypes.join(' and ');
  let explanation = `**${shoe.name}** (${shoeRoles})`;
  
  if (reasons.length > 0) {
    // Take the most important reasons (max 3)
    const topReasons = reasons.slice(0, 3);
    explanation += ` was selected because it ${topReasons.join(', ')}.`;
  } else {
    explanation += ' provides a solid option for your rotation.';
  }
  
  // Add price info
  explanation += ` $${shoe.price}`;
  
  return explanation;
}

function getRoleSpecificReasons(shoeTypes: string[], neededRoles: ShoeRole[]): string[] {
  const reasons: string[] = [];
  
  // Check what roles this shoe fills from the user's needs
  const coveredRoles = shoeTypes.filter(type => neededRoles.includes(type as ShoeRole));
  
  if (coveredRoles.length > 1) {
    reasons.push(`covers multiple needs: ${coveredRoles.join(' and ')}`);
  } else if (coveredRoles.length === 1) {
    const role = coveredRoles[0];
    switch (role) {
      case 'daily':
        reasons.push('perfect for daily training runs');
        break;
      case 'long-run':
        reasons.push('ideal for your long runs');
        break;
      case 'tempo':
        reasons.push('excellent for tempo and workout days');
        break;
      case 'race':
        reasons.push('designed for race day performance');
        break;
      case 'trail':
        reasons.push('built for trail adventures');
        break;
      case 'recovery':
        reasons.push('great for easy recovery runs');
        break;
      case 'stability':
        reasons.push('provides motion control support');
        break;
    }
  }
  
  return reasons;
}

export function buildRotationSummary(
  user: UserVector, 
  rotation: ScoredShoe[], 
  uncoveredRoles: ShoeRole[]
): string {
  let summary = `## Your ${rotation.length}-shoe rotation\n\n`;
  
  // Add individual shoe explanations
  rotation.forEach((scored, index) => {
    summary += `${index + 1}. ${buildExplanation(user, scored)}\n\n`;
  });
  
  // Add coverage summary
  const totalRoles = user.rolesNeeded.length;
  const coveredRoles = totalRoles - uncoveredRoles.length;
  const coveragePercent = Math.round((coveredRoles / totalRoles) * 100);
  
  summary += `**Coverage**: ${coveragePercent}% of your running needs covered`;
  
  if (uncoveredRoles.length > 0) {
    summary += `, missing: ${uncoveredRoles.join(', ')}`;
  }
  
  // Add total cost
  const totalCost = rotation.reduce((sum, scored) => sum + scored.shoe.price, 0);
  summary += `\n\n**Total investment**: $${totalCost}`;
  
  // Add versatility note
  if (user.preferVersatile) {
    summary += '\n\n*This rotation prioritizes versatile shoes that can handle multiple types of runs.*';
  }
  
  return summary;
}

export function explainMissingRoles(uncoveredRoles: ShoeRole[]): string {
  if (uncoveredRoles.length === 0) return '';
  
  let explanation = '\n**Note**: Some running needs weren\'t fully covered:\n';
  
  uncoveredRoles.forEach(role => {
    switch (role) {
      case 'trail':
        explanation += '- Consider adding a dedicated trail shoe if you run trails frequently\n';
        break;
      case 'race':
        explanation += '- A lightweight race shoe could help with your time goals\n';
        break;
      case 'recovery':
        explanation += '- A max-cushioned recovery shoe might help on easy days\n';
        break;
      case 'stability':
        explanation += '- You might need a more supportive shoe for stability\n';
        break;
      default:
        explanation += `- ${role} needs weren't fully addressed in this rotation\n`;
    }
  });
  
  return explanation;
}

// Helper to format shoe attributes for display
export function formatShoeDetails(shoe: any): string {
  const details = [];
  
  if (shoe.weightOunces) {
    details.push(`${shoe.weightOunces}oz`);
  }
  
  if (shoe.offsetMilimeters !== undefined) {
    details.push(`${shoe.offsetMilimeters}mm drop`);
  }
  
  if (shoe.cushioningScale !== undefined) {
    details.push(`cushioning: ${shoe.cushioningScale}/10`);
  }
  
  return details.length > 0 ? `(${details.join(', ')})` : '';
}
