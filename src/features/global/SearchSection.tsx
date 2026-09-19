import { useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import {
  useBooking,
  type SearchCriteria,
} from './BookingContext'
import { DateRangeCalendar } from './DateRangeCalendar'
import { useStaySearchQuery } from './staySearchQuery'

type SearchValues = SearchCriteria

function validateDateRange({ fromDate, toDate }: SearchValues) {
  if (fromDate.length === 0) {
    return 'Choose a check-in date.'
  }

  if (toDate.length === 0) {
    return 'Choose a check-out date.'
  }

  if (toDate <= fromDate) {
    return 'Check-out date must be after check-in date.'
  }

  return ''
}

export function SearchSection() {
  const { searchCriteria, setSearchCriteria } = useBooking()
  const searchQuery = useStaySearchQuery(searchCriteria)
  const [datesExpanded, setDatesExpanded] = useState(
    searchCriteria === null,
  )
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [values, setValues] = useState<SearchValues>(
    searchCriteria ?? {
      fromDate: '',
      toDate: '',
      guests: 2,
    },
  )
  const [dateError, setDateError] = useState('')
  const searchError = searchQuery.error?.message ?? ''

  function validateAndSearch(searchValues: SearchValues) {
    const validationError = validateDateRange(searchValues)
    setDateError(validationError)

    if (validationError.length === 0) {
      setDatesExpanded(false)
      setSearchCriteria(searchValues)
    }
  }

  function handleDateSelect(date: string) {
    const startsNewRange = values.fromDate.length === 0
      || (values.toDate.length > 0 && dateError.length === 0)
    const nextValues = startsNewRange
      ? { ...values, fromDate: date, toDate: '' }
      : { ...values, toDate: date }

    setValues(nextValues)

    if (startsNewRange) {
      setDateError('')
    } else {
      validateAndSearch(nextValues)
    }
  }

  function handleGuestChange(event: SelectChangeEvent<number>) {
    const nextValues = {
      ...values,
      guests: Number(event.target.value),
    }
    setValues(nextValues)
    validateAndSearch(nextValues)
  }

  const selectedDates = values.fromDate.length > 0 && values.toDate.length > 0
    ? `${values.fromDate} – ${values.toDate}`
    : 'Select check-in and check-out dates'

  return (
    <Box
      component="section"
      role="search"
      aria-label="Search stays"
      style={{ width: '100%' }}
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Typography variant="h6" component="h2" sx={{ textAlign: 'center' }}>
        Find your stay
      </Typography>

      <Box
        sx={{
          alignItems: 'flex-start',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
          mt: 2,
        }}
      >
        <Button
          type="button"
          variant="outlined"
          aria-controls="stay-dates-picker"
          aria-expanded={datesExpanded}
          onClick={() => {
            setDatesExpanded(true)
          }}
          onFocus={() => {
            setDatesExpanded(true)
          }}
          endIcon={<ExpandMoreIcon />}
          sx={{ minHeight: 56, minWidth: 280 }}
        >
          <Box component="span" sx={{ textAlign: 'left' }}>
            <Box component="span" sx={{ display: 'block', fontWeight: 700 }}>
              Stay Dates
            </Box>
            <Box component="span" sx={{ display: 'block' }}>
              {selectedDates}
            </Box>
          </Box>
        </Button>

        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel id="guests-label">Guests</InputLabel>
          <Select
            labelId="guests-label"
            id="guests"
            value={values.guests}
            label="Guests"
            onChange={handleGuestChange}
          >
            {[1, 2, 3, 4].map((guestCount) => (
              <MenuItem key={guestCount} value={guestCount}>
                {guestCount}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>1–4 guests</FormHelperText>
        </FormControl>
      </Box>

      {datesExpanded && (
        <DateRangeCalendar
          displayedMonth={displayedMonth}
          fromDate={values.fromDate}
          toDate={values.toDate}
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

      {dateError.length > 0 && (
        <Typography
          id="stay-dates-error"
          role="alert"
          color="error"
          sx={{ mt: 1, textAlign: 'center' }}
        >
          {dateError}
        </Typography>
      )}

      {searchError.length > 0 && (
        <Typography
          role="alert"
          color="error"
          sx={{ mt: 1, textAlign: 'center' }}
        >
          {searchError}
        </Typography>
      )}
    </Box>
  )
}
