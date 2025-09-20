import { test, expect } from '@playwright/test';

test('basic navigation and site functionality', async ({ page }) => {
  // Navigate to the site
  await page.goto('/');
  
  // Check that the page loads
  await expect(page).toHaveTitle(/shoediffer/);
  
  // Check that we can navigate to rotation tab
  await page.click('button:has-text("rotation")');
  
  // Verify quiz is visible
  await expect(page.locator('h2:has-text("build your rotation")')).toBeVisible();
});

test('API health check works', async ({ request }) => {
  const response = await request.get('/api/recommendations');
  
  expect(response.status()).toBe(200);
  const data = await response.json();
  
  expect(data).toHaveProperty('shoesAvailable');
  expect(data).toHaveProperty('version');
  expect(typeof data.shoesAvailable).toBe('number');
  expect(data.shoesAvailable).toBeGreaterThan(0);
});
