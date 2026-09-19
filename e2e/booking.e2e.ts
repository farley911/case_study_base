import { expect, test } from '@playwright/test'
import { selectStayDates } from './helpers'

test('Guest can complete a booking from search through confirmation', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await selectStayDates(page)

  await expect(page.getByRole('heading', { name: /select a room/i }))
    .toBeVisible()

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Premier King Suite' })
    .getByRole('button', { name: /select room/i })
    .click()

  await page.getByRole('button', { name: /shopping cart, 1 items/i }).click()
  await expect(page.getByRole('dialog', { name: /shopping cart/i }))
    .toBeVisible()
  await expect(page.getByRole('dialog').getByText('Premier King Suite'))
    .toBeVisible()

  await page.getByRole('button', { name: /^checkout$/i }).click()

  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByRole('heading', { name: /review reservation/i }))
    .toBeVisible()

  await page.getByLabel(/guest name/i).fill('Eric Guest')
  await page.getByLabel(/^address/i).fill('1 Resort Way')
  await page.getByLabel(/card number/i).fill('424242424242')
  await page.getByLabel(/expiry/i).fill('12/30')
  await page.getByLabel(/security code/i).fill('123')

  await page.getByRole('button', { name: /confirm booking/i }).click()

  await expect(page).toHaveURL(/\/confirmation$/)
  await expect(page.getByRole('heading', { name: /booking confirmed/i }))
    .toBeVisible()
  await expect(page.getByRole('list', { name: /confirmed rooms/i }))
    .toContainText('Premier King Suite')
  await expect(page.getByText(/confirmation number: \d+/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /shopping cart, 0 items/i }))
    .toBeVisible()
})
