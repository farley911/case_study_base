import { expect, test } from '@playwright/test'

test('Header, search, placeholder, and footer are shown', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('banner', { name: /application header/i }))
    .toBeVisible()
  await expect(page.getByRole('link', { name: /airik's resort home/i }))
    .toBeVisible()
  await expect(page.getByRole('banner').getByText(/las vegas/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /shopping cart, 0 items/i }))
    .toBeVisible()

  await expect(page.getByRole('search', { name: /search stays/i }))
    .toBeVisible()
  await expect(page.getByRole('heading', { name: /find your stay/i }))
    .toBeVisible()
  await expect(page.getByText(/please select a date range to view available stays/i))
    .toBeVisible()

  await expect(page.getByRole('contentinfo')).toContainText(
    'Taxes are not included. Prices shown are the lowest available for each night.',
  )
})
