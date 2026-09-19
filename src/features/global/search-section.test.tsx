import { beforeEach, describe, expect, test } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fetchMock from 'jest-fetch-mock'
import type { Stay } from '../../types/api'
import { createAppQueryClient } from '../../query/createAppQueryClient'
import { BookingProvider } from './BookingContext'
import { SearchSection } from './SearchSection'

const expectedStays: Stay[] = [
  {
    id: 1,
    room_type: 'king_suite',
    name: 'Premier King Suite',
    description: '725 sq ft',
    photos: [],
    price: 538,
  },
]

function mockSuccessfulSearch() {
  fetchMock.mockResponse(JSON.stringify(expectedStays))
}

function renderSearch() {
  const queryClient = createAppQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <BookingProvider>
        <SearchSection />
      </BookingProvider>
    </QueryClientProvider>,
  )
}

const calendarDayFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const calendarMonthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

function calendarDate(day: number) {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), day)
}

function dateKey(date: Date) {
  return [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

async function selectCalendarDay(user: ReturnType<typeof userEvent.setup>, day: number) {
  const date = calendarDate(day)
  await user.click(screen.getByRole('button', {
    name: `Choose ${calendarDayFormatter.format(date)}`,
  }))
  return dateKey(date)
}

beforeEach(() => {
  fetchMock.resetMocks()
})

describe('Search section', () => {
  test('Search is shown', () => {
    renderSearch()

    expect(
      screen.getByRole('search', { name: /search stays/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /find your stay/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /guests/i })).toHaveTextContent('2')
  })

  test('Datepicker is expanded onLoad', () => {
    renderSearch()

    const stayDatesButton = screen.getByRole('button', { name: /stay dates/i })
    expect(stayDatesButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText(/stay date picker/i)).toBeInTheDocument()
  })

  test('Selecting a date range queries the API', async () => {
    const user = userEvent.setup()
    mockSuccessfulSearch()
    renderSearch()

    const fromDate = await selectCalendarDay(user, 8)
    expect(fetchMock).not.toHaveBeenCalled()
    const toDate = await selectCalendarDay(user, 11)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/stays?from_date=${fromDate}&to_date=${toDate}&guests=2`,
        expect.anything(),
      )
    })
    expect(await screen.findByText(`${fromDate} – ${toDate}`)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/stay date picker/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /stay dates/i }))
    expect(screen.getByLabelText(/stay date picker/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {
      name: `Choose ${calendarDayFormatter.format(calendarDate(8))}`,
    })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', {
      name: `Choose ${calendarDayFormatter.format(calendarDate(9))}`,
    })).toHaveAttribute('aria-pressed', 'false')
  })

  test('Selecting an invalid date range triggers validation errors', async () => {
    const user = userEvent.setup()
    mockSuccessfulSearch()
    renderSearch()

    await selectCalendarDay(user, 10)
    expect(fetchMock).not.toHaveBeenCalled()
    await selectCalendarDay(user, 9)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Check-out date must be after check-in date.',
    )
    expect(fetchMock).not.toHaveBeenCalled()

    await selectCalendarDay(user, 11)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('Selecting a guest value queries the API', async () => {
    const user = userEvent.setup()
    mockSuccessfulSearch()
    renderSearch()

    const fromDate = await selectCalendarDay(user, 1)
    const toDate = await selectCalendarDay(user, 3)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    fetchMock.mockClear()

    await user.click(screen.getByRole('combobox', { name: /guests/i }))
    await user.click(screen.getByRole('option', { name: '4' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/stays?from_date=${fromDate}&to_date=${toDate}&guests=4`,
        expect.anything(),
      )
    })
  })

  test('A guest change validates missing dates without querying the API', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.click(screen.getByRole('combobox', { name: /guests/i }))
    await user.click(screen.getByRole('option', { name: '3' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a check-in date.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('A guest change validates a partially selected range', async () => {
    const user = userEvent.setup()
    renderSearch()

    await selectCalendarDay(user, 8)
    await user.click(screen.getByRole('combobox', { name: /guests/i }))
    await user.click(screen.getByRole('option', { name: '1' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a check-out date.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('A completed range can be replaced and calendar months can be changed', async () => {
    const user = userEvent.setup()
    mockSuccessfulSearch()
    renderSearch()

    await selectCalendarDay(user, 8)
    await selectCalendarDay(user, 11)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByRole('button', { name: /stay dates/i }))
    await selectCalendarDay(user, 14)
    expect(screen.getByRole('button', {
      name: `Choose ${calendarDayFormatter.format(calendarDate(14))}`,
    })).toHaveAttribute('aria-pressed', 'true')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const initialMonthDate = calendarDate(1)
    const initialMonth = calendarMonthFormatter.format(initialMonthDate)
    const previousMonth = calendarMonthFormatter.format(new Date(
      initialMonthDate.getFullYear(),
      initialMonthDate.getMonth() - 1,
      1,
    ))
    await user.click(screen.getByRole('button', { name: /show previous months/i }))
    expect(screen.getByRole('group', { name: previousMonth })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /show next months/i }))
    expect(screen.getByRole('group', { name: initialMonth })).toBeInTheDocument()
  })

  test('An API error is announced to the user', async () => {
    const user = userEvent.setup()
    fetchMock.mockResponse('', { status: 500 })
    renderSearch()

    await selectCalendarDay(user, 1)
    await selectCalendarDay(user, 3)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to search for stays.',
    )
  })
})
