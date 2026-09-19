import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fetchMock from 'jest-fetch-mock'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { AppLayout } from '../global/AppLayout'
import { RoomDetailsPage } from '../../routes/details.$room_type'
import { HomePage } from '../../routes/index'
import type { Review, Stay } from '../../types/api'

const calendarDayFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const stay: Stay = {
  description: 'A spacious suite with a king bed and a panoramic resort view.',
  id: 1,
  name: 'Premier King Suite',
  photos: [
    'https://example.com/one.jpg',
    'https://example.com/two.jpg',
    'https://example.com/three.jpg',
  ],
  price: 100,
  room_type: 'king_suite',
}

const reviews: Review[] = [{
  id: 1,
  rating: 3,
  review: 'Comfortable and quiet.',
  room_type: 'king_suite',
}]

let writeTextMock: ReturnType<typeof jest.fn<() => Promise<void>>>

function renderBookingApp(initialEntry = '/details/king_suite') {
  const rootRoute = createRootRoute({
    component: () => (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
  })
  const homeRoute = createRoute({
    component: HomePage,
    getParentRoute: () => rootRoute,
    path: '/',
  })
  const detailsRoute = createRoute({
    component: RoomDetailsPage,
    getParentRoute: () => rootRoute,
    path: '/details/$room_type',
  })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([homeRoute, detailsRoute]),
  })

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

function mockDetails(reviewData = reviews) {
  fetchMock.mockResponse((request) => {
    if (request.url.endsWith('/reviews')) {
      return Promise.resolve(JSON.stringify(reviewData))
    }

    return Promise.resolve(JSON.stringify(stay))
  })
}

async function selectDay(
  user: ReturnType<typeof userEvent.setup>,
  day: number,
) {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), day)
  await user.click(await screen.findByRole('button', {
    name: `Choose ${calendarDayFormatter.format(date)}`,
  }))
}

beforeEach(() => {
  fetchMock.resetMocks()
  writeTextMock = jest.fn<() => Promise<void>>().mockResolvedValue()
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: writeTextMock,
    },
  })
})

describe('Room details', () => {
  test('Details route shows a loader and then the associated room in full', async () => {
    let resolveStay = (_value: string) => undefined
    let resolveReviews = (_value: string) => undefined
    fetchMock
      .mockResponseOnce(() => new Promise<string>((resolve) => {
        resolveStay = resolve
      }))
      .mockResponseOnce(() => new Promise<string>((resolve) => {
        resolveReviews = resolve
      }))

    renderBookingApp()

    expect(await screen.findByLabelText('Loading room details')).toBeInTheDocument()
    expect(screen.queryByRole('search', { name: /search stays/i }))
      .not.toBeInTheDocument()

    act(() => {
      resolveStay(JSON.stringify(stay))
      resolveReviews(JSON.stringify(reviews))
    })

    expect(await screen.findByRole('heading', {
      level: 1,
      name: stay.name,
    })).toBeInTheDocument()
    expect(screen.queryByLabelText('Loading room details')).not.toBeInTheDocument()
    expect(screen.getByText(stay.description)).toBeInTheDocument()
    expect(screen.getByText('$100.00 per night')).toBeInTheDocument()
    expect(screen.getByLabelText('3 out of 5 stars')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/stays/king_suite',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  test('Images are displayed one at a time and carousel arrows cycle them', async () => {
    const user = userEvent.setup()
    mockDetails()
    renderBookingApp()

    const firstImage = await screen.findByRole('img', {
      name: `${stay.name}, photo 1 of 3`,
    })
    expect(firstImage).toHaveAttribute('src', stay.photos[0])
    expect(screen.getAllByRole('img')).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: /previous room photo/i }))
    expect(screen.getByRole('img', {
      name: `${stay.name}, photo 3 of 3`,
    })).toHaveAttribute('src', stay.photos[2])

    await user.click(screen.getByRole('button', { name: /next room photo/i }))
    expect(screen.getByRole('img', {
      name: `${stay.name}, photo 1 of 3`,
    })).toHaveAttribute('src', stay.photos[0])

    await user.click(screen.getByRole('button', { name: /next room photo/i }))
    expect(screen.getByRole('img', {
      name: `${stay.name}, photo 2 of 3`,
    })).toHaveAttribute('src', stay.photos[1])

    await user.click(screen.getByRole('button', { name: /previous room photo/i }))
    expect(screen.getByRole('img', {
      name: `${stay.name}, photo 1 of 3`,
    })).toHaveAttribute('src', stay.photos[0])
  })

  test('User selects dates on the details view and adds the room to the cart', async () => {
    const user = userEvent.setup()
    mockDetails()
    renderBookingApp()

    await screen.findByRole('heading', { name: /book this room/i })
    const resortFee = screen.getByRole('group', { name: /resort fee/i })
    expect(within(resortFee).getByText('Resort fee')).toBeInTheDocument()
    expect(within(resortFee).getByText('$0.00')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /select room/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a check-in and check-out date.',
    )

    await selectDay(user, 4)
    await selectDay(user, 7)
    const subtotal = screen.getByRole('group', { name: /room subtotal/i })
    expect(within(subtotal).getByText('Room subtotal')).toBeInTheDocument()
    expect(within(subtotal).getByText('$300.00')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /select room/i }))
    expect(screen.getByRole('button', {
      name: /shopping cart, 1 items/i,
    })).toBeInTheDocument()
  })

  test('Existing reviews are displayed and a user can submit a scored review', async () => {
    const user = userEvent.setup()
    let resolveReview = (_value: string) => undefined
    fetchMock
      .mockResponseOnce(JSON.stringify(stay))
      .mockResponseOnce(JSON.stringify(reviews))
      .mockResponseOnce(() => new Promise<string>((resolve) => {
        resolveReview = resolve
      }))
    renderBookingApp()

    await screen.findByText(reviews[0].review)
    await user.click(screen.getByRole('button', { name: /submit review/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a review and select a score from 1 to 5.',
    )

    await user.click(screen.getByRole('button', { name: /rate 4 out of 5/i }))
    await user.type(screen.getByRole('textbox', { name: /your review/i }), 'A wonderful stay.')
    await user.click(screen.getByRole('button', { name: /submit review/i }))

    expect(await screen.findByRole('button', { name: /submitting/i }))
      .toBeDisabled()

    act(() => {
      resolveReview(JSON.stringify({
        id: 2,
        rating: 4,
        review: 'A wonderful stay.',
        room_type: 'king_suite',
      }))
    })

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /your review/i })).toHaveValue('')
    })
    expect(screen.getByText('A wonderful stay.')).toBeInTheDocument()
    expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/stays/king_suite/reviews',
      expect.objectContaining({
        body: JSON.stringify({ rating: 4, review: 'A wonderful stay.' }),
        method: 'POST',
      }),
    )
  })

  test('An empty review list and failed review submission are handled', async () => {
    const user = userEvent.setup()
    fetchMock
      .mockResponseOnce(JSON.stringify(stay))
      .mockResponseOnce(JSON.stringify([]))
      .mockResponseOnce('', { status: 500 })
    renderBookingApp()

    expect(await screen.findByText(/be the first to review/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /rate 5 out of 5/i }))
    await user.type(screen.getByRole('textbox', { name: /your review/i }), 'Could be better.')
    await user.click(screen.getByRole('button', { name: /submit review/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a review and select a score from 1 to 5.',
    )
  })

  test('Share copies the canonical room URL and reports clipboard errors', async () => {
    const user = userEvent.setup()
    const writeText = jest.spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue()
    mockDetails()
    renderBookingApp()

    await screen.findByRole('heading', { level: 1, name: stay.name })
    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(writeText).toHaveBeenCalledWith(
      'http://localhost/details/king_suite',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Room link copied.')

    writeText.mockRejectedValueOnce(new Error('Clipboard unavailable'))
    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to copy the room link.',
    )
  })

  test('A reviews request failure uses the same loading error', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(stay))
      .mockResponseOnce('', { status: 500 })
    renderBookingApp()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load this room.',
    )
  })

  test('Loading failures show feedback and a route back to the list', async () => {
    fetchMock
      .mockResponseOnce('', { status: 404 })
      .mockResponseOnce(JSON.stringify(reviews))
    renderBookingApp()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load this room.',
    )
    expect(screen.getByRole('link', { name: /back to stays/i }))
      .toHaveAttribute('href', '/')
  })

  test('Navigating from results to details and back preserves the search', async () => {
    const user = userEvent.setup()
    fetchMock.mockResponse((request) => {
      if (request.url.includes('?')) {
        return Promise.resolve(JSON.stringify([stay]))
      }

      if (request.url.endsWith('/reviews')) {
        return Promise.resolve(JSON.stringify(reviews))
      }

      return Promise.resolve(JSON.stringify(stay))
    })
    renderBookingApp('/')

    await selectDay(user, 4)
    await selectDay(user, 7)
    const results = await screen.findByRole('list', { name: /available stays/i })
    await user.click(within(results).getByRole('link', { name: /details/i }))
    expect(await screen.findByRole('heading', {
      level: 1,
      name: stay.name,
    })).toBeInTheDocument()
    expect(screen.queryByRole('search')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /back to stays/i }))
    expect(await screen.findByRole('list', { name: /available stays/i }))
      .toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stay dates/i }))
      .toHaveTextContent(/–/)
    expect(screen.queryByLabelText('Stay date picker')).not.toBeInTheDocument()
  })

  test('Changing booking guests and reopening dates updates local controls', async () => {
    const user = userEvent.setup()
    mockDetails()
    renderBookingApp()
    await screen.findByRole('heading', { name: /book this room/i })

    await user.click(screen.getByRole('combobox', { name: /guests/i }))
    await user.click(screen.getByRole('option', { name: '4' }))
    expect(screen.getByRole('combobox', { name: /guests/i })).toHaveTextContent('4')

    await user.click(screen.getByRole('button', { name: /select stay dates/i }))
    expect(screen.queryByLabelText('Stay date picker')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /select stay dates/i }))
    const datePicker = screen.getByLabelText('Stay date picker')
    expect(datePicker).toHaveAttribute('data-layout', 'inline')
    expect(datePicker).toHaveStyle({ position: 'static' })
    expect(within(datePicker).getAllByRole('group')).toHaveLength(1)
    const initialMonth = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date())
    await user.click(screen.getByRole('button', { name: /show next months/i }))
    expect(screen.queryByRole('heading', { name: initialMonth }))
      .not.toBeInTheDocument()
  })

  test('Unmounting while details load cancels outstanding requests', async () => {
    fetchMock.mockResponse((request) => new Promise<string>((_resolve, reject) => {
      request.signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'))
      })
    }))
    const { unmount } = renderBookingApp()

    expect(await screen.findByLabelText('Loading room details')).toBeInTheDocument()
    unmount()
  })

  test('A non-Error rejection uses the standard loading failure message', async () => {
    fetchMock
      .mockRejectOnce('failed')
      .mockResponseOnce(JSON.stringify(reviews))
    renderBookingApp()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Unable to load this room.',
      )
    })
  })
})
