import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

test.describe('Views Específicas - Integração Real', () => {
  test.beforeEach(async ({ page }) => {
    const health = await page.request.get(`${API_BASE}/v1/health`).catch(() => null);
    if (!health || !health.ok()) {
      test.fail(true, 'Backend não está rodando em localhost:3000');
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Timeline - deve carregar view com conteúdo', async ({ page }) => {
    await page.getByRole('button', { name: 'Timelines' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByRole('button', { name: 'Timelines' })).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('Model Center - deve carregar view com conteúdo', async ({ page }) => {
    await page.getByRole('button', { name: 'Model Center' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByRole('button', { name: 'Model Center' })).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('Memory - deve carregar view com conteúdo', async ({ page }) => {
    await page.getByRole('button', { name: 'Memory' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByRole('button', { name: 'Memory' })).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('Knowledge - deve carregar view com conteúdo', async ({ page }) => {
    await page.getByRole('button', { name: 'Knowledge' }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByRole('button', { name: 'Knowledge' })).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });
});
