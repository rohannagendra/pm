import { test, expect } from '@playwright/test';

test.describe('Tasks CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/seed');
    await page.goto('/tasks');
    // Wait for the h1 "Tasks" heading to be visible
    await expect(page.locator('h1', { hasText: 'Tasks' })).toBeVisible();
    // Wait for store to fetch and render tasks (seeded data should appear)
    await expect(page.getByText('Design homepage mockup')).toBeVisible({ timeout: 10000 });
  });

  test('should display seeded tasks', async ({ page }) => {
    await expect(page.getByText('Implement authentication flow')).toBeVisible();
    await expect(page.getByText('Set up CI/CD pipeline')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Title').fill('Playwright Test Task');
    await page.getByLabel('Description').fill('Created by e2e test');

    await page.getByRole('dialog').getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(page.getByText('Playwright Test Task')).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    // Target a known seeded task
    const taskText = 'Write API documentation';
    await expect(page.getByText(taskText)).toBeVisible();

    // Find the card containing this task and click its more button
    const taskCard = page.locator('.group').filter({ hasText: taskText });
    await taskCard.getByRole('button').last().click({ force: true });

    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByText(taskText)).toBeHidden();
  });
});
