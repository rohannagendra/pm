import { test, expect } from '@playwright/test';

test.describe('Projects / Kanban', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/seed');
    await page.goto('/projects');
  });

  test('should display kanban columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'To Do' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Done' })).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    await page.getByRole('button', { name: 'New Project' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // The label "Name" in the dialog doesn't use htmlFor, so use placeholder or locate input directly
    await page.getByRole('dialog').locator('input').first().fill('E2E Test Project');
    await page.getByRole('dialog').getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Verify project appears in the project selector
    await page.getByRole('combobox').click();
    await expect(page.getByRole('option', { name: 'E2E Test Project' })).toBeVisible();
  });
});
