import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { Link } from '@tanstack/react-router'
import type { Stay } from '../../types/api'
import {
  useBooking,
  type CartItemInput,
  type SearchCriteria,
} from '../global/BookingContext'
import { useStaySearchQuery } from '../global/staySearchQuery'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

function numberOfNights({ fromDate, toDate }: SearchCriteria) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return (
    Date.parse(`${toDate}T00:00:00Z`)
    - Date.parse(`${fromDate}T00:00:00Z`)
  ) / millisecondsPerDay
}

function StayCard({
  stay,
  criteria,
  onSelect,
}: {
  stay: Stay
  criteria: SearchCriteria
  onSelect: (item: CartItemInput) => void
}) {
  const totalPrice = stay.price * numberOfNights(criteria)

  return (
    <Card
      component="article"
      role="listitem"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        overflow: 'hidden',
      }}
    >
      <CardMedia
        component="img"
        image={stay.photos[0]}
        alt={`${stay.name} room`}
        sx={{
          aspectRatio: { xs: '16 / 9', sm: '4 / 3' },
          bgcolor: 'grey.100',
          minHeight: { sm: 240 },
          objectFit: 'contain',
          width: { xs: '100%', sm: '50%' },
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography
            component="h3"
            variant="h6"
            sx={{ textDecoration: 'underline' }}
          >
            {stay.name}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
            {stay.description}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            From
          </Typography>
          <Typography component="p" variant="h4" sx={{ fontWeight: 500 }}>
            {currencyFormatter.format(totalPrice)}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {currencyFormatter.format(stay.price)} per night
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
          <Link
            to="/details/$room_type"
            params={{ room_type: stay.room_type }}
          >
            <Button component="span">Details</Button>
          </Link>
          <Button
            type="button"
            variant="contained"
            onClick={() => {
              onSelect({
                stay,
                ...criteria,
                totalPrice,
              })
            }}
          >
            Select Room
          </Button>
        </CardActions>
      </Box>
    </Card>
  )
}

export function StayList() {
  const { addToCart, searchCriteria } = useBooking()
  const searchQuery = useStaySearchQuery(searchCriteria)

  if (searchQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading available stays" />
      </Box>
    )
  }

  if (searchCriteria === null || !searchQuery.isSuccess) {
    return (
      <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
        Please select a date range to view available stays
      </Typography>
    )
  }

  const criteria = searchCriteria

  return (
    <Box component="section" aria-labelledby="available-stays-heading">
      <Typography
        id="available-stays-heading"
        component="h2"
        variant="h4"
        sx={{ mb: 3 }}
      >
        Select a room
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {searchQuery.data.length} results
      </Typography>
      <Box
        role="list"
        aria-label="Available stays"
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        {searchQuery.data.map((stay) => (
          <StayCard
            key={stay.id}
            stay={stay}
            criteria={criteria}
            onSelect={addToCart}
          />
        ))}
      </Box>
    </Box>
  )
}
