import { type Page } from '@playwright/test'

const calendarDayFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function upcomingStayDates() {
  const checkIn = new Date()
  checkIn.setHours(0, 0, 0, 0)
  checkIn.setDate(checkIn.getDate() + 7)

  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + 2)

  return { checkIn, checkOut }
}

export async function selectStayDates(page: Page) {
  const { checkIn, checkOut } = upcomingStayDates()

  await page.getByRole('button', {
    name: `Choose ${calendarDayFormatter.format(checkIn)}`,
  }).click()

  await page.getByRole('button', {
    name: `Choose ${calendarDayFormatter.format(checkOut)}`,
  }).click()

  return { checkIn, checkOut }
}
