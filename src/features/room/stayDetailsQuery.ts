import type { Review, Stay } from '../../types/api'

export const stayQueryKey = (roomType: string) => (
  ['stays', roomType] as const
)

export const stayReviewsQueryKey = (roomType: string) => (
  ['stays', roomType, 'reviews'] as const
)

const fetchRoomJson = async <T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> => {
  try {
    const response = await fetch(url, { signal })

    if (!response.ok) {
      throw new Error('Unable to load this room.')
    }

    return await response.json() as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }

    throw new Error('Unable to load this room.', { cause: error })
  }
}

export const fetchStay = (roomType: string, signal?: AbortSignal) => (
  fetchRoomJson<Stay>(`/stays/${encodeURIComponent(roomType)}`, signal)
)

export const fetchStayReviews = (roomType: string, signal?: AbortSignal) => (
  fetchRoomJson<Review[]>(
    `/stays/${encodeURIComponent(roomType)}/reviews`,
    signal,
  )
)

export const postStayReview = async (
  roomType: string,
  body: { rating: number, review: string },
): Promise<Review> => {
  const response = await fetch(
    `/stays/${encodeURIComponent(roomType)}/reviews`,
    {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new Error('Unable to submit your review.')
  }

  return await response.json() as Review
}
