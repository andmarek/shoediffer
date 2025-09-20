import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { QuizPayload, RotationResponse, RecommendationResult } from '$lib/recommendation/types';
import { buildUserVector } from '$lib/recommendation/mappings';
import { computeScore, filterByBudget } from '$lib/recommendation/scoring';
import { assembleRotation, getUncoveredRoles } from '$lib/recommendation/assembler';
import { buildExplanation, buildRotationSummary } from '$lib/recommendation/explain';
import { shoes } from '$lib/data/shoes';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Basic validation - ensure we have shoe data
    if (!shoes || shoes.length === 0) {
      console.error('No shoe data available');
      return json(
        { error: 'No shoe data available' },
        { status: 500 }
      );
    }

    // Parse the quiz payload
    const quiz: QuizPayload = await request.json();
    
    // Validate required fields
    if (!quiz.runningGoal || !quiz.weeklyMileage || !quiz.budget) {
      return json(
        { error: 'Missing required quiz fields' },
        { status: 400 }
      );
    }

    // Transform quiz answers to user vector
    const user = buildUserVector(quiz);
    
    // Filter shoes by budget ceiling
    const budgetFilteredShoes = filterByBudget(shoes, quiz.budget);
    
    if (budgetFilteredShoes.length === 0) {
      return json({
        rotation: [],
        uncoveredRoles: user.rolesNeeded,
        totalScore: 0,
        summary: 'No shoes found within your budget range. Please consider increasing your budget.',
        debug: {
          userVector: user,
          originalShoeCount: shoes.length,
          filteredShoeCount: 0,
        },
      });
    }
    
    // Score all shoes
    const scoredShoes = budgetFilteredShoes.map(shoe => computeScore(user, shoe));
    
    // Assemble rotation
    const rotation = assembleRotation(user, scoredShoes);
    
    // Find uncovered roles
    const uncoveredRoles = getUncoveredRoles(user, rotation);
    
    // Build explanations
    const recommendations: RecommendationResult[] = rotation.map(scored => ({
      shoe: scored.shoe,
      score: scored.score,
      explanation: buildExplanation(user, scored),
      rolesCovered: scored.shoe.shoeTypes.filter(role => 
        user.rolesNeeded.includes(role as any)
      ) as any[],
    }));
    
    // Calculate total score
    const totalScore = rotation.reduce((sum, scored) => sum + scored.score, 0);
    
    // Build rotation summary
    const summary = buildRotationSummary(user, rotation, uncoveredRoles);
    
    const response: RotationResponse & { summary: string; debug?: any } = {
      rotation: recommendations,
      uncoveredRoles,
      totalScore,
      summary,
    };
    
    // Add debug info in development
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        userVector: user,
        originalShoeCount: shoes.length,
        filteredShoeCount: budgetFilteredShoes.length,
        scoredShoeCount: scoredShoes.length,
        topScores: scoredShoes
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(s => ({ name: s.shoe.name, score: s.score.toFixed(2) })),
      };
    }
    
    return json(response);
    
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async () => {
  // Health check endpoint
  const stats = {
    shoesAvailable: shoes.length,
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
  };
  
  return json(stats);
};
