import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ShareIcon from '@mui/icons-material/Share'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link } from '@tanstack/react-router'
import type { Review, Stay } from '../../types/api'
import { DateRangeCalendar } from '../global/DateRangeCalendar'
import { useBooking, type SearchCriteria } from '../global/BookingContext'
import {
  fetchStay,
  fetchStayReviews,
  postStayReview,
  stayQueryKey,
  stayReviewsQueryKey,
} from './stayDetailsQuery'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

function numberOfNights({ fromDate, toDate }: SearchCriteria) {
  if (fromDate.length === 0 || toDate <= fromDate) {
    return 0
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return (
    Date.parse(`${toDate}T00:00:00Z`)
    - Date.parse(`${fromDate}T00:00:00Z`)
  ) / millisecondsPerDay
}

function Stars({ rating }: { rating: number }) {
  return (
    <Box
      aria-label={`${rating} out of 5 stars`}
      sx={{ color: 'warning.main', display: 'flex' }}
    >
      {[1, 2, 3, 4, 5].map((position) => (
        position <= rating
          ? <StarIcon aria-hidden="true" key={position} />
          : <StarBorderIcon aria-hidden="true" key={position} />
      ))}
    </Box>
  )
}

function RoomCarousel({ stay }: { stay: Stay }) {
  const [imageIndex, setImageIndex] = useState(0)
  const lastImageIndex = stay.photos.length - 1

  return (
    <Box
      component="section"
      aria-label={`${stay.name} photos`}
      sx={{ position: 'relative', width: '100%' }}
    >
      <Box
        component="img"
        src={stay.photos[imageIndex]}
        alt={`${stay.name}, photo ${imageIndex + 1} of ${stay.photos.length}`}
        sx={{
          aspectRatio: '16 / 9',
          bgcolor: 'grey.100',
          display: 'block',
          objectFit: 'cover',
          width: '100%',
        }}
      />
      <Button
        type="button"
        aria-label="Previous room photo"
        onClick={() => {
          setImageIndex((current) => current === 0 ? lastImageIndex : current - 1)
        }}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: '50%',
          left: 16,
          minWidth: 48,
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <ArrowBackIosNewIcon />
      </Button>
      <Button
        type="button"
        aria-label="Next room photo"
        onClick={() => {
          setImageIndex((current) => current === lastImageIndex ? 0 : current + 1)
        }}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: '50%',
          minWidth: 48,
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <ArrowForwardIosIcon />
      </Button>
      <Typography
        aria-live="polite"
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.65)',
          bottom: 12,
          color: 'common.white',
          left: '50%',
          px: 1.5,
          py: 0.5,
          position: 'absolute',
          transform: 'translateX(-50%)',
        }}
      >
        {imageIndex + 1} / {stay.photos.length}
      </Typography>
    </Box>
  )
}

function BookingPanel({ stay }: { stay: Stay }) {
  const { addToCart, searchCriteria } = useBooking()
  const [criteria, setCriteria] = useState<SearchCriteria>(
    searchCriteria ?? { fromDate: '', toDate: '', guests: 2 },
  )
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const initialDate = criteria.fromDate.length > 0
      ? new Date(`${criteria.fromDate}T00:00:00`)
      : new Date()
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  })
  const [datesExpanded, setDatesExpanded] = useState(
    criteria.fromDate.length === 0,
  )
  const [dateError, setDateError] = useState('')
  const nights = numberOfNights(criteria)
  const roomSubtotal = stay.price * nights

  function handleDateSelect(date: string) {
    const startsNewRange = criteria.fromDate.length === 0
      || criteria.toDate.length > 0
    const nextCriteria = startsNewRange
      ? { ...criteria, fromDate: date, toDate: '' }
      : { ...criteria, toDate: date }

    setCriteria(nextCriteria)
    setDateError('')

    if (!startsNewRange && date > criteria.fromDate) {
      setDatesExpanded(false)
    }
  }

  function selectRoom() {
    if (nights === 0) {
      setDateError('Choose a check-in and check-out date.')
      setDatesExpanded(true)
      return
    }

    addToCart({
      stay,
      ...criteria,
      totalPrice: roomSubtotal,
    })
  }

  return (
    <Paper
      component="section"
      aria-labelledby="book-room-heading"
      elevation={2}
      sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}
    >
      <Typography id="book-room-heading" component="h2" variant="h5">
        Book this room
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        {currencyFormatter.format(stay.price)} per night
      </Typography>
      <Box
        sx={{
          alignItems: 'flex-start',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          my: 2,
        }}
      >
        <Button
          type="button"
          variant="outlined"
          aria-expanded={datesExpanded}
          onClick={() => {
            setDatesExpanded((expanded) => !expanded)
          }}
          sx={{ minHeight: 56 }}
        >
          {criteria.fromDate.length > 0 && criteria.toDate.length > 0
            ? `${criteria.fromDate} – ${criteria.toDate}`
            : 'Select stay dates'}
        </Button>
        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel id="detail-guests-label">Guests</InputLabel>
          <Select
            labelId="detail-guests-label"
            value={criteria.guests}
            label="Guests"
            onChange={(event: SelectChangeEvent<number>) => {
              setCriteria((current) => ({
                ...current,
                guests: Number(event.target.value),
              }))
            }}
          >
            {[1, 2, 3, 4].map((guestCount) => (
              <MenuItem key={guestCount} value={guestCount}>
                {guestCount}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {datesExpanded && (
        <DateRangeCalendar
          displayedMonth={displayedMonth}
          fromDate={criteria.fromDate}
          layout="inline"
          toDate={criteria.toDate}
          onChangeMonth={(offset) => {
            setDisplayedMonth((month) => new Date(
              month.getFullYear(),
              month.getMonth() + offset,
              1,
            ))
          }}
          onSelect={handleDateSelect}
        />
      )}
      {dateError.length > 0 && <Alert severity="error">{dateError}</Alert>}
      <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 3, pt: 2 }}>
        <Box
          role="group"
          aria-label="Room subtotal"
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <Typography>Room subtotal</Typography>
          <Typography>{currencyFormatter.format(roomSubtotal)}</Typography>
        </Box>
        <Box
          role="group"
          aria-label="Resort fee"
          sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}
        >
          <Typography>Resort fee</Typography>
          <Typography>{currencyFormatter.format(0)}</Typography>
        </Box>
      </Box>
      <Button
        type="button"
        variant="contained"
        onClick={selectRoom}
        sx={{ mt: 3 }}
      >
        Select Room
      </Button>
    </Paper>
  )
}

function Reviews({
  reviews,
  roomType,
}: {
  reviews: Review[]
  roomType: string
}) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [hasValidationError, setHasValidationError] = useState(false)
  const submitReviewMutation = useMutation({
    mutationFn: (body: { rating: number, review: string }) => (
      postStayReview(roomType, body)
    ),
  })
  const showError = hasValidationError || submitReviewMutation.isError

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (reviewText.trim().length === 0 || rating === 0) {
      setHasValidationError(true)
      return
    }

    try {
      const review = await submitReviewMutation.mutateAsync({
        rating,
        review: reviewText,
      })
      queryClient.setQueryData<Review[]>(
        stayReviewsQueryKey(roomType),
        [...reviews, review],
      )
      setRating(0)
      setReviewText('')
    } catch {
      setHasValidationError(false)
    }
  }

  return (
    <Box component="section" aria-labelledby="reviews-heading">
      <Typography id="reviews-heading" component="h2" variant="h4">
        Guest reviews
      </Typography>
      {reviews.length === 0
        ? (
            <Typography color="text.secondary" sx={{ my: 2 }}>
              Be the first to review this room.
            </Typography>
          )
        : (
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {reviews.map((review) => (
                <Paper component="li" key={review.id} sx={{ my: 2, p: 2 }}>
                  <Stars rating={review.rating} />
                  <Typography sx={{ mt: 1 }}>{review.review}</Typography>
                </Paper>
              ))}
            </Box>
          )}
      <Paper
        component="form"
        onSubmit={(event) => {
          void submitReview(event)
        }}
        sx={{ mt: 3, p: { xs: 2, sm: 3 } }}
      >
        <Typography component="h3" variant="h6">
          Write a review
        </Typography>
        <Box
          role="group"
          aria-label="Review score"
          sx={{ display: 'flex', my: 2 }}
        >
          {[1, 2, 3, 4, 5].map((score) => (
            <Button
              type="button"
              key={score}
              aria-label={`Rate ${score} out of 5`}
              onClick={() => {
                setRating(score)
                setHasValidationError(false)
                submitReviewMutation.reset()
              }}
              sx={{ minWidth: 44, p: 0.5 }}
            >
              {score <= rating ? <StarIcon /> : <StarBorderIcon />}
            </Button>
          ))}
        </Box>
        <TextField
          label="Your review"
          multiline
          minRows={4}
          fullWidth
          value={reviewText}
          onChange={(event) => {
            setReviewText(event.target.value)
            setHasValidationError(false)
            submitReviewMutation.reset()
          }}
        />
        {showError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Enter a review and select a score from 1 to 5.
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={submitReviewMutation.isPending}
          sx={{ mt: 2 }}
        >
          {submitReviewMutation.isPending ? 'Submitting…' : 'Submit review'}
        </Button>
      </Paper>
    </Box>
  )
}

function detailsSettledError(
  stayPending: boolean,
  reviewsPending: boolean,
  stayFailed: boolean,
  reviewsFailed: boolean,
) {
  if (stayPending || reviewsPending) {
    return ''
  }

  if (stayFailed || reviewsFailed) {
    return 'Unable to load this room.'
  }

  return ''
}

export function StayDetails({ roomType }: { roomType: string }) {
  const stayQuery = useQuery({
    queryFn: ({ signal }) => fetchStay(roomType, signal),
    queryKey: stayQueryKey(roomType),
  })
  const reviewsQuery = useQuery({
    queryFn: ({ signal }) => fetchStayReviews(roomType, signal),
    queryKey: stayReviewsQueryKey(roomType),
  })
  const [shareStatus, setShareStatus] = useState('')
  const loadError = detailsSettledError(
    stayQuery.isPending,
    reviewsQuery.isPending,
    stayQuery.isError,
    reviewsQuery.isError,
  )

  async function copyShareLink() {
    try {
      const shareUrl = new URL(
        `/details/${encodeURIComponent(roomType)}`,
        window.location.origin,
      )
      await navigator.clipboard.writeText(shareUrl.href)
      setShareStatus('Room link copied.')
    } catch {
      setShareStatus('Unable to copy the room link.')
    }
  }

  if (loadError.length > 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">{loadError}</Alert>
        <Button component={Link} to="/" sx={{ mt: 2 }}>
          Back to stays
        </Button>
      </Box>
    )
  }

  if (
    stayQuery.data === undefined
    || reviewsQuery.data === undefined
  ) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading room details" />
      </Box>
    )
  }

  return (
    <Box component="article">
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Button component={Link} to="/" startIcon={<ArrowBackIcon />}>
          Back to stays
        </Button>
        <Button
          type="button"
          startIcon={<ShareIcon />}
          onClick={() => {
            void copyShareLink()
          }}
        >
          Share
        </Button>
      </Box>
      {shareStatus.length > 0 && (
        <Alert severity={shareStatus.startsWith('Unable') ? 'error' : 'success'}>
          {shareStatus}
        </Alert>
      )}
      <Typography component="h1" variant="h3" sx={{ mb: 2 }}>
        {stayQuery.data.name}
      </Typography>
      <RoomCarousel stay={stayQuery.data} />
      <Typography sx={{ my: 3 }}>{stayQuery.data.description}</Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 4,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 380px' },
        }}
      >
        <Reviews reviews={reviewsQuery.data} roomType={roomType} />
        <BookingPanel stay={stayQuery.data} />
      </Box>
    </Box>
  )
}
