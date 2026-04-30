import { expect, test } from '@playwright/test';

test('QA smoke: startup/login/dashboard/menu and drag signal', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Staff Login')).toBeVisible();
  await page.fill('#employeeNumber', '1001');
  await page.fill('#password', 'nurse123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Select unit')).toBeVisible();
  await page.getByRole('button', { name: 'Enter unit' }).click();

  await expect(page.getByText('UnitView').first()).toBeVisible();

  await page.getByRole('button', { name: 'Print' }).click();
  await expect(page.getByRole('menuitem', { name: 'Charge report' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.locator('button[title="Oncoming shift board"]').click();
  await expect(page.getByText('Oncoming Shift Blackboard')).toBeVisible();
  await page.getByRole('button', { name: 'Close board' }).click();

  const firstPatientCard = page.locator('[data-patient-id]').first();
  await expect(firstPatientCard).toBeVisible();
  await firstPatientCard.dispatchEvent('dragstart');
  await firstPatientCard.dispatchEvent('dragend');
});
