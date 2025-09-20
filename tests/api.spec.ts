import { test, expect } from '@playwright/test';

test.describe('Recommendations API', () => {

  test('should return recommendations for valid quiz data', async ({ request }) => {
    const quizData = {
      runningGoal: 'Improve 5K/10K times',
      weeklyMileage: '21-30 miles',
      furthestRunDistance: '10',
      easyPace: '8:30',
      tempoWorkoutPace: '7:45',
      roadPercentage: 70,
      treadmillPercentage: 20,
      trailPercentage: 10,
      supportLevel: 'Neutral (no support needed)',
      cushioningPreference: 'Balanced (4-6)',
      widthNeeds: 'Standard',
      versatilityPreference: 'Versatile shoes that can handle multiple types of runs',
      preferences: '',
      injuryHistory: '',
      budget: '$150-200',
      excludedBrands: ''
    };

    const response = await request.post('/api/recommendations', {
      data: quizData
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('rotation');
    expect(data).toHaveProperty('uncoveredRoles');
    expect(data).toHaveProperty('totalScore');
    expect(data.rotation).toBeInstanceOf(Array);
    expect(data.uncoveredRoles).toBeInstanceOf(Array);
    expect(typeof data.totalScore).toBe('number');

    // If we have recommendations, verify their structure
    if (data.rotation.length > 0) {
      const firstRecommendation = data.rotation[0];
      expect(firstRecommendation).toHaveProperty('shoe');
      expect(firstRecommendation).toHaveProperty('score');
      expect(firstRecommendation).toHaveProperty('explanation');
      expect(firstRecommendation).toHaveProperty('rolesCovered');
      
      // Verify shoe structure
      expect(firstRecommendation.shoe).toHaveProperty('name');
      expect(firstRecommendation.shoe).toHaveProperty('brand');
      expect(firstRecommendation.shoe).toHaveProperty('price');
      expect(typeof firstRecommendation.shoe.price).toBe('number');
      expect(typeof firstRecommendation.score).toBe('number');
      expect(typeof firstRecommendation.explanation).toBe('string');
      expect(firstRecommendation.rolesCovered).toBeInstanceOf(Array);
    }
  });

  test('should handle missing required fields', async ({ request }) => {
    const incompleteQuizData = {
      runningGoal: 'General fitness',
      // Missing other required fields
    };

    const response = await request.post('/api/recommendations', {
      data: incompleteQuizData
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle budget filtering correctly', async ({ request }) => {
    const budgetQuizData = {
      runningGoal: 'General fitness',
      weeklyMileage: '0-10 miles',
      furthestRunDistance: '3',
      easyPace: '10:00',
      tempoWorkoutPace: '9:30',
      roadPercentage: 80,
      treadmillPercentage: 20,
      trailPercentage: 0,
      supportLevel: 'Neutral (no support needed)',
      cushioningPreference: 'Balanced (4-6)',
      widthNeeds: 'Standard',
      versatilityPreference: 'Versatile shoes that can handle multiple types of runs',
      preferences: '',
      injuryHistory: '',
      budget: 'Under $100',
      excludedBrands: ''
    };

    const response = await request.post('/api/recommendations', {
      data: budgetQuizData
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // All recommended shoes should be under $100
    data.rotation.forEach((recommendation: any) => {
      expect(recommendation.shoe.price).toBeLessThan(100);
    });
  });

  test('should respect brand exclusions', async ({ request }) => {
    const quizDataWithExclusions = {
      runningGoal: 'General fitness',
      weeklyMileage: '11-20 miles',
      furthestRunDistance: '5',
      easyPace: '9:00',
      tempoWorkoutPace: '8:30',
      roadPercentage: 70,
      treadmillPercentage: 30,
      trailPercentage: 0,
      supportLevel: 'Neutral (no support needed)',
      cushioningPreference: 'Balanced (4-6)',
      widthNeeds: 'Standard',
      versatilityPreference: 'Versatile shoes that can handle multiple types of runs',
      preferences: '',
      injuryHistory: '',
      budget: '$150-200',
      excludedBrands: 'Brooks, Nike'
    };

    const response = await request.post('/api/recommendations', {
      data: quizDataWithExclusions
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // No recommended shoes should be from excluded brands
    data.rotation.forEach((recommendation: any) => {
      expect(recommendation.shoe.brand.toLowerCase()).not.toMatch(/brooks|nike/);
    });
  });

  test('should return different recommendations for different goals', async ({ request }) => {
    const raceGoalQuiz = {
      runningGoal: 'Improve 5K/10K times',
      weeklyMileage: '31-40 miles',
      furthestRunDistance: '10',
      easyPace: '7:30',
      tempoWorkoutPace: '6:45',
      roadPercentage: 90,
      treadmillPercentage: 10,
      trailPercentage: 0,
      supportLevel: 'Neutral (no support needed)',
      cushioningPreference: 'Minimal/Firm (1-3)',
      widthNeeds: 'Standard',
      versatilityPreference: 'Specialized shoes for specific purposes',
      preferences: '',
      injuryHistory: '',
      budget: '$200+',
      excludedBrands: ''
    };

    const fitnessGoalQuiz = {
      runningGoal: 'General fitness',
      weeklyMileage: '11-20 miles',
      furthestRunDistance: '5',
      easyPace: '9:30',
      tempoWorkoutPace: '8:45',
      roadPercentage: 60,
      treadmillPercentage: 40,
      trailPercentage: 0,
      supportLevel: 'Neutral (no support needed)',
      cushioningPreference: 'Plush/Max (7-10)',
      widthNeeds: 'Standard',
      versatilityPreference: 'Versatile shoes that can handle multiple types of runs',
      preferences: '',
      injuryHistory: '',
      budget: '$100-150',
      excludedBrands: ''
    };

    const raceResponse = await request.post('/api/recommendations', {
      data: raceGoalQuiz
    });
    const fitnessResponse = await request.post('/api/recommendations', {
      data: fitnessGoalQuiz
    });

    expect(raceResponse.status()).toBe(200);
    expect(fitnessResponse.status()).toBe(200);

    const raceData = await raceResponse.json();
    const fitnessData = await fitnessResponse.json();

    // The recommendations should be different for different goals/preferences
    // At minimum, the total scores should be different since different shoes will score differently
    expect(raceData.totalScore).not.toBe(fitnessData.totalScore);
  });

  test('should handle server errors gracefully', async ({ request }) => {
    const validQuizData = {
      runningGoal: 'General fitness',
      weeklyMileage: '11-20 miles',
      furthestRunDistance: '5',
      easyPace: '9:00',
      tempoWorkoutPace: '8:30',
      roadPercentage: 70,
      treadmillPercentage: 30,
      trailPercentage: 0,
      supportLevel: 'Neutral (no support needed)',
      cushioningPreference: 'Balanced (4-6)',
      widthNeeds: 'Standard',
      versatilityPreference: 'Versatile shoes that can handle multiple types of runs',
      preferences: '',
      injuryHistory: '',
      budget: '$150-200',
      excludedBrands: ''
    };

    // Test with malformed JSON
    const malformedResponse = await request.post('/api/recommendations', {
      data: 'invalid json'
    });

    expect(malformedResponse.status()).toBe(400);
  });

  test('health check endpoint should work', async ({ request }) => {
    const response = await request.get('/api/recommendations');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('shoesAvailable');
    expect(data).toHaveProperty('lastUpdated');
    expect(data).toHaveProperty('version');
    expect(typeof data.shoesAvailable).toBe('number');
    expect(data.shoesAvailable).toBeGreaterThan(0);
  });
});
