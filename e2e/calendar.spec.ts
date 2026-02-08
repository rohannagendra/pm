import { test, expect } from '@playwright/test';

test.describe('Calendar Views', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/seed');
    await page.goto('/calendar');
  });

  test('should render the calendar with month view by default', async ({ page }) => {
    await expect(page.getByText('Sun')).toBeVisible();
    await expect(page.getByText('Mon', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
  });

  test('should switch to week view', async ({ page }) => {
    await page.getByRole('button', { name: 'week' }).click();
    await expect(page.getByText('9 AM')).toBeVisible();
  });

  test('should switch to day view', async ({ page }) => {
    await page.getByRole('button', { name: 'day', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Tasks Due/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Events/ })).toBeVisible();
  });
});
