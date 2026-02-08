import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test('should load the Dashboard page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);
  });

  test('should navigate to Tasks page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Tasks' }).click();
    await expect(page).toHaveURL('/tasks');
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });

  test('should navigate to Projects page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });

  test('should navigate to Calendar page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Calendar' }).click();
    await expect(page).toHaveURL('/calendar');
    await expect(page.getByText('Today')).toBeVisible();
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});
