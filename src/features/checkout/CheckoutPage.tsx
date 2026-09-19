import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link, useNavigate } from '@tanstack/react-router'
import type { CreateBooking } from '../../types/api'
import { useBooking, type CartItem } from '../global/BookingContext'
import { createBookings } from './createBookings'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`))
}

function numberOfNights(item: CartItem) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return (
    Date.parse(`${item.toDate}T00:00:00Z`)
    - Date.parse(`${item.fromDate}T00:00:00Z`)
  ) / millisecondsPerDay
}

function isMockPaymentValid(cardNumber: string, expiry: string, cvc: string) {
  const digits = cardNumber.replaceAll(/\s/g, '')
  const expiryMatch = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)

  return /^\d{12,19}$/.test(digits) && expiryMatch && /^\d{3,4}$/.test(cvc)
}

function CheckoutRoom({
  item,
  disabled,
}: {
  item: CartItem
  disabled: boolean
}) {
  const { removeFromCart } = useBooking()
  const nights = numberOfNights(item)

  return (
    <Box
      component="li"
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        listStyle: 'none',
        py: 3,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box
          component="img"
          src={item.stay.photos[0]}
          alt={`${item.stay.name} room`}
          sx={{
            borderRadius: 1,
            height: 96,
            objectFit: 'cover',
            width: 128,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography component="h2" variant="h6">
            {item.stay.name}
          </Typography>
          <Typography color="text.secondary">
            {formatDate(item.fromDate)} – {formatDate(item.toDate)}
          </Typography>
          <Typography color="text.secondary">
            {item.guests} {item.guests === 1 ? 'guest' : 'guests'}
          </Typography>
          <Button
            type="button"
            aria-label={`Remove ${item.stay.name}`}
            disabled={disabled}
            onClick={() => {
              removeFromCart(item.id)
            }}
            sx={{ minWidth: 0, mt: 0.5, p: 0, textDecoration: 'underline' }}
          >
            Remove
          </Button>
        </Box>
      </Box>

      <Box
        role="group"
        aria-label={`${item.stay.name} price breakdown`}
        sx={{ mt: 2 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography>Nightly rate</Typography>
          <Typography>{currencyFormatter.format(item.stay.price)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography>
            {nights} {nights === 1 ? 'night' : 'nights'}
            {' '}× {currencyFormatter.format(item.stay.price)}
          </Typography>
          <Typography>{currencyFormatter.format(item.totalPrice)}</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            fontWeight: 700,
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Typography sx={{ fontWeight: 'inherit' }}>Room subtotal</Typography>
          <Typography sx={{ fontWeight: 'inherit' }}>
            {currencyFormatter.format(item.totalPrice)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export function CheckoutPage() {
  const {
    cartItems,
    clearCart,
    setConfirmation,
  } = useBooking()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [error, setError] = useState('')
  const confirmBookings = useMutation({
    mutationFn: (bookings: CreateBooking[]) => createBookings(bookings),
  })
  const isSubmitting = confirmBookings.isPending
  const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)

  async function confirmBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    confirmBookings.reset()

    if (
      name.trim() === ''
      || address.trim() === ''
      || !isMockPaymentValid(cardNumber, expiry, cvc)
    ) {
      setError(
        'Please correct your guest and mock payment details before continuing.',
      )
      return
    }

    const items = [...cartItems]

    try {
      const bookings = await confirmBookings.mutateAsync(
        items.map((item) => ({
          address: address.trim(),
          from_date: item.fromDate,
          guests: item.guests,
          name: name.trim(),
          room_type: item.stay.room_type,
          to_date: item.toDate,
        })),
      )

      setConfirmation({ bookings, items, total })
      clearCart()
      await navigate({ to: '/confirmation' })
    } catch {
      setError(
        'We could not confirm your booking. Please review your details and try again.',
      )
    }
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <Typography component="h1" variant="h4">
          Your checkout is empty
        </Typography>
        <Typography sx={{ mt: 2 }}>
          Add a room to your cart before checking out.
        </Typography>
        <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>
          Find a room
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 } }}>
      <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
        Review reservation
      </Typography>
      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          void confirmBooking(event)
        }}
        sx={{
          alignItems: 'start',
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(300px, 1fr)' },
        }}
      >
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography component="h2" variant="h5">
            Rooms
          </Typography>
          <Box component="ul" aria-label="Rooms in checkout" sx={{ m: 0, p: 0 }}>
            {cartItems.map((item) => (
              <CheckoutRoom
                disabled={isSubmitting}
                item={item}
                key={item.id}
              />
            ))}
          </Box>

          <Typography component="h2" variant="h5" sx={{ mt: 4 }}>
            Guest details
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              mt: 2,
            }}
          >
            <TextField
              label="Guest name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
              }}
              required
            />
            <TextField
              label="Address"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value)
              }}
              required
            />
          </Box>

          <Typography component="h2" variant="h5" sx={{ mt: 4 }}>
            Mock payment
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Payment details are used only to demonstrate checkout and are not
            validated, stored, or processed.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
              mt: 2,
            }}
          >
            <TextField
              label="Card number"
              value={cardNumber}
              onChange={(event) => {
                setCardNumber(event.target.value)
              }}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              required
            />
            <TextField
              label="Expiry (MM/YY)"
              placeholder="MM/YY"
              value={expiry}
              onChange={(event) => {
                setExpiry(event.target.value)
              }}
              required
            />
            <TextField
              label="Security code"
              value={cvc}
              onChange={(event) => {
                setCvc(event.target.value)
              }}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              required
            />
          </Box>
        </Paper>

        <Paper
          component="aside"
          aria-label="Payment details"
          variant="outlined"
          sx={{ p: 3, position: { md: 'sticky' }, top: { md: 24 } }}
        >
          <Typography component="h2" variant="h6">
            Payment details
          </Typography>
          <Box
            role="group"
            aria-label="Checkout total"
            sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}
          >
            <Typography sx={{ fontWeight: 700 }}>Grand total</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {currencyFormatter.format(total)}
            </Typography>
          </Box>
          <Typography variant="caption">*Excluding taxes</Typography>
          <Divider sx={{ my: 2 }} />
          {error !== '' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            fullWidth
            variant="contained"
          >
            {isSubmitting ? 'Confirming…' : 'Confirm booking'}
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}
