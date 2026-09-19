import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Booking, Stay } from '../../types/api'

export interface SearchCriteria {
  fromDate: string
  toDate: string
  guests: number
}

export interface CartItem {
  id: number
  stay: Stay
  fromDate: string
  toDate: string
  guests: number
  totalPrice: number
}

export type CartItemInput = Omit<CartItem, 'id'>

export interface CheckoutConfirmation {
  bookings: Booking[]
  items: CartItem[]
  total: number
}

interface BookingContextValue {
  searchCriteria: SearchCriteria | null
  setSearchCriteria: (criteria: SearchCriteria) => void
  cartItems: CartItem[]
  addToCart: (item: CartItemInput) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  confirmation: CheckoutConfirmation | null
  setConfirmation: (confirmation: CheckoutConfirmation | null) => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(
    null,
  )
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [confirmation, setConfirmation] =
    useState<CheckoutConfirmation | null>(null)
  const nextCartItemId = useRef(1)

  const value = useMemo<BookingContextValue>(() => ({
    addToCart: (item) => {
      const id = nextCartItemId.current
      nextCartItemId.current += 1
      setCartItems((items) => [...items, { ...item, id }])
    },
    cartItems,
    clearCart: () => {
      setCartItems([])
    },
    confirmation,
    removeFromCart: (id) => {
      setCartItems((items) => items.filter((item) => item.id !== id))
    },
    searchCriteria,
    setConfirmation,
    setSearchCriteria,
  }), [cartItems, confirmation, searchCriteria])

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)

  if (context === null) {
    throw new Error('useBooking must be used within a BookingProvider.')
  }

  return context
}
