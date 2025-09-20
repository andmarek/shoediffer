import { test, expect } from '@playwright/test';

test.describe('Shoe Rotation Quiz', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to rotation tab and complete quiz flow', async ({ page }) => {
    // Click on rotation tab
    await page.click('button:has-text("rotation")');
    
    // Verify quiz is visible
    await expect(page.locator('h2:has-text("build your rotation")')).toBeVisible();
    await expect(page.locator('text=step 1 of 9')).toBeVisible();
    
    // Step 1: Running Goal
    await expect(page.locator('h3:has-text("What\'s your main running goal?")')).toBeVisible();
    await page.click('button:has-text("Improve 5K/10K times")');
    await page.click('button:has-text("next →")');
    
    // Step 2: Weekly mileage & long runs
    await expect(page.locator('text=step 2 of 9')).toBeVisible();
    await page.click('button:has-text("21-30 miles")');
    await page.fill('input[placeholder="e.g. 13.1"]', '10');
    await page.click('button:has-text("next →")');
    
    // Step 3: Typical paces
    await expect(page.locator('text=step 3 of 9')).toBeVisible();
    await page.fill('input[placeholder="e.g. 9:30"]', '8:30');
    await page.fill('input[placeholder="e.g. 8:15"]', '7:45');
    await page.click('button:has-text("next →")');
    
    // Step 4: Running surfaces (default values should be fine)
    await expect(page.locator('text=step 4 of 9')).toBeVisible();
    await page.click('button:has-text("next →")');
    
    // Step 5: Support level
    await expect(page.locator('text=step 5 of 9')).toBeVisible();
    await page.click('button:has-text("Neutral (no support needed)")');
    await page.click('button:has-text("next →")');
    
    // Step 6: Cushioning preference
    await expect(page.locator('text=step 6 of 9')).toBeVisible();
    await page.click('button:has-text("Balanced (4-6)")');
    await page.click('button:has-text("next →")');
    
    // Step 7: Width & versatility
    await expect(page.locator('text=step 7 of 9')).toBeVisible();
    await page.click('button:has-text("Standard")');
    await page.click('button:has-text("Versatile shoes that can handle multiple types of runs")');
    await page.click('button:has-text("next →")');
    
    // Step 8: Additional preferences (optional)
    await expect(page.locator('text=step 8 of 9')).toBeVisible();
    await page.click('button:has-text("next →")');
    
    // Step 9: Budget
    await expect(page.locator('text=step 9 of 9')).toBeVisible();
    await page.click('button:has-text("$150-200")');
    
    // Submit quiz
    const buildButton = page.locator('button:has-text("build rotation")');
    await expect(buildButton).toBeVisible();
    await expect(buildButton).toBeEnabled();
    
    // Click build rotation and wait for results
    await buildButton.click();
    
    // Wait for loading to finish
    await expect(page.locator('text=Building your rotation...')).toBeVisible();
    await expect(page.locator('text=Building your rotation...')).not.toBeVisible({ timeout: 30000 });
    
    // Verify results are shown
    await expect(page.locator('h2:has-text("Your Shoe Rotation")')).toBeVisible();
    
    // Check if we have recommendations
    const hasRecommendations = await page.locator('h3').first().isVisible();
    
    if (hasRecommendations) {
      // Verify recommendation structure
      await expect(page.locator('h3').first()).toContainText('1. ');
      
      // Check for price, score, roles, explanation
      await expect(page.locator('text=/\\$\\d+/')).toBeVisible();
      await expect(page.locator('text=/score: \\d+\\.\\d+/')).toBeVisible();
      
      // Check summary stats
      await expect(page.locator('text=total investment')).toBeVisible();
      await expect(page.locator('text=needs covered')).toBeVisible();
      await expect(page.locator('text=shoes')).toBeVisible();
      
    } else {
      // If no recommendations, should show no results message
      await expect(page.locator('text=No shoes found matching your criteria')).toBeVisible();
    }
  });

  test('should handle quiz validation correctly', async ({ page }) => {
    // Go to rotation tab
    await page.click('button:has-text("rotation")');
    
    // Try to proceed without selecting anything on step 1
    const nextButton = page.locator('button:has-text("next →")');
    await expect(nextButton).toBeDisabled();
    
    // Select an option and button should become enabled
    await page.click('button:has-text("General fitness")');
    await expect(nextButton).toBeEnabled();
  });

  test('should allow going back through quiz steps', async ({ page }) => {
    // Go to rotation tab
    await page.click('button:has-text("rotation")');
    
    // Complete first step
    await page.click('button:has-text("Complete my first 5K")');
    await page.click('button:has-text("next →")');
    
    // Verify we're on step 2
    await expect(page.locator('text=step 2 of 9')).toBeVisible();
    
    // Go back
    await page.click('button:has-text("← previous")');
    
    // Verify we're back on step 1
    await expect(page.locator('text=step 1 of 9')).toBeVisible();
    await expect(page.locator('button:has-text("Complete my first 5K")')).toHaveClass(/border-black/);
  });

  test('should reset quiz when start over is clicked', async ({ page }) => {
    // Complete the full quiz first
    await page.click('button:has-text("rotation")');
    
    // Fill out quiz quickly
    await page.click('button:has-text("General fitness")');
    await page.click('button:has-text("next →")');
    
    await page.click('button:has-text("11-20 miles")');
    await page.fill('input[placeholder="e.g. 13.1"]', '5');
    await page.click('button:has-text("next →")');
    
    await page.fill('input[placeholder="e.g. 9:30"]', '9:30');
    await page.fill('input[placeholder="e.g. 8:15"]', '8:30');
    await page.click('button:has-text("next →")');
    
    await page.click('button:has-text("next →")'); // surfaces
    await page.click('button:has-text("Neutral (no support needed)")');
    await page.click('button:has-text("next →")');
    
    await page.click('button:has-text("Balanced (4-6)")');
    await page.click('button:has-text("next →")');
    
    await page.click('button:has-text("Standard")');
    await page.click('button:has-text("Specialized shoes for specific purposes")');
    await page.click('button:has-text("next →")');
    
    await page.click('button:has-text("next →")'); // preferences
    
    await page.click('button:has-text("$100-150")');
    await page.click('button:has-text("build rotation")');
    
    // Wait for results
    await expect(page.locator('h2:has-text("Your Shoe Rotation")')).toBeVisible({ timeout: 30000 });
    
    // Click start over
    await page.click('button:has-text("start over")');
    
    // Should be back to step 1
    await expect(page.locator('text=step 1 of 9')).toBeVisible();
    await expect(page.locator('h3:has-text("What\'s your main running goal?")')).toBeVisible();
  });

  test('should show error handling for API failures', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/recommendations', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test API error' })
      });
    });
    
    // Complete quiz quickly to trigger API call
    await page.click('button:has-text("rotation")');
    await page.click('button:has-text("General fitness")');
    await page.click('button:has-text("next →")');
    
    await page.click('button:has-text("0-10 miles")');
    await page.fill('input[placeholder="e.g. 13.1"]', '3');
    await page.click('button:has-text("next →")');
    
    await page.fill('input[placeholder="e.g. 9:30"]', '10:00');
    await page.fill('input[placeholder="e.g. 8:15"]', '9:30');
    await page.click('button:has-text("next →")');
    
    // Skip through remaining steps quickly
    for (let i = 0; i < 6; i++) {
      if (i === 0) await page.click('button:has-text("next →")'); // surfaces
      else if (i === 1) {
        await page.click('button:has-text("Neutral (no support needed)")');
        await page.click('button:has-text("next →")');
      }
      else if (i === 2) {
        await page.click('button:has-text("Balanced (4-6)")');
        await page.click('button:has-text("next →")');
      }
      else if (i === 3) {
        await page.click('button:has-text("Standard")');
        await page.click('button:has-text("Versatile shoes that can handle multiple types of runs")');
        await page.click('button:has-text("next →")');
      }
      else if (i === 4) await page.click('button:has-text("next →")'); // preferences
      else if (i === 5) {
        await page.click('button:has-text("Under $100")');
      }
    }
    
    await page.click('button:has-text("build rotation")');
    
    // Should show error message
    await expect(page.locator('text=Test API error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("dismiss")')).toBeVisible();
  });
});
