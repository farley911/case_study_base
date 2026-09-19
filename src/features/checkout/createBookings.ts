import type { Booking, CreateBooking } from '../../types/api'

export const createBookings = async (
  bookings: CreateBooking[],
): Promise<Booking[]> => {
  const created: Booking[] = []

  for (const booking of bookings) {
    const response = await fetch('/bookings', {
      body: JSON.stringify(booking),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('booking-request-rejected')
    }

    created.push(await response.json() as Booking)
  }

  return created
}
