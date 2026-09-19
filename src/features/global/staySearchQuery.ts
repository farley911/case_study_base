import { useQuery } from '@tanstack/react-query'
import type { Stay } from '../../types/api'
import type { SearchCriteria } from './BookingContext'

export function useStaySearchQuery(criteria: SearchCriteria | null) {
  return useQuery({
    enabled: criteria !== null,
    queryFn: async ({ signal }) => {
      const searchCriteria = criteria!
      const searchParameters = new URLSearchParams({
        from_date: searchCriteria.fromDate,
        to_date: searchCriteria.toDate,
        guests: String(searchCriteria.guests),
      })
      const response = await fetch(`/stays?${searchParameters.toString()}`, {
        signal,
      })

      if (!response.ok) {
        throw new Error('Unable to search for stays.')
      }

      return await response.json() as Stay[]
    },
    queryKey: ['stays', 'search', criteria],
  })
}
