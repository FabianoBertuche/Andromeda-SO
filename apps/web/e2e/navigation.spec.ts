import { test, expect } from '@playwright/test';

test.describe('Navegação entre Abas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('deve navegar para aba Console', async ({ page }) => {
    await page.getByRole('button', { name: 'Console' }).click();
    await expect(page.locator('h2')).toContainText('Andromeda Command Console');
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('deve navegar para aba Agents', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Agents' });
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('deve navegar para aba Timelines', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Timelines' });
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('deve navegar para aba Model Center', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Model Center' });
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('deve navegar para aba Memory', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Memory' });
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('deve navegar para aba Knowledge', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Knowledge' });
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('deve destacar aba ativa', async ({ page }) => {
    const consoleButton = page.getByRole('button', { name: 'Console' });
    await consoleButton.click();
    await expect(consoleButton).toHaveClass(/bg-indigo-500\/10/);
  });
});
