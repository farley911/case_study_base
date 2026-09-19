import { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import AppBar from '@mui/material/AppBar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link, useLocation } from '@tanstack/react-router'
import logo from '../../assets/logo.png'
import { createAppQueryClient } from '../../query/createAppQueryClient'
import { BookingProvider, useBooking } from './BookingContext'
import { SearchSection } from './SearchSection'
import { ShoppingCartPane } from './ShoppingCartPane'

const taxDisclaimer =
  '*Taxes are not included. Prices shown are the lowest available for each night. Prices shown may be available only with multi-night stays or arrival on a specific day.'

function ApplicationShell({ children }: { children: ReactNode }) {
  const { cartItems } = useBooking()
  const [cartOpen, setCartOpen] = useState(false)
  const location = useLocation()
  const isSearchHidden = location.pathname.startsWith('/details/')
    || location.pathname === '/checkout'
    || location.pathname === '/confirmation'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <AppBar
        position="static"
        component="header"
        color="inherit"
        elevation={0}
        aria-label="Application header"
        style={{
          width: '100%',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
        sx={{
          bgcolor: '#000',
          color: 'common.white',
        }}
      >
        <Toolbar
          sx={{
            minWidth: 'max-content',
            flexWrap: 'nowrap',
            gap: { xs: 1.5, sm: 3 },
            px: { xs: 1, sm: 3 },
          }}
        >
          <Link to="/" aria-label="Airik's Resort home">
            <Box
              component="img"
              src={logo}
              alt="Airik's Resort"
              sx={{
                display: 'block',
                height: { xs: 40, sm: 56 },
                width: 'auto',
              }}
            />
          </Link>

          |

          <Typography
            component="span"
            variant="body1"
            sx={{ flexGrow: 1 }}
          >
            LAS VEGAS
          </Typography>

          <IconButton
            aria-label={`Shopping cart, ${cartItems.length} items`}
            aria-expanded={cartOpen}
            aria-controls={cartOpen ? 'shopping-cart-heading' : undefined}
            color="inherit"
            onClick={() => {
              setCartOpen(true)
            }}
          >
            <Badge badgeContent={cartItems.length} color="primary">
              <ShoppingCartIcon titleAccess="Shopping cart" fontSize="large" />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <ShoppingCartPane
        open={cartOpen}
        onClose={() => {
          setCartOpen(false)
        }}
      />

      {!isSearchHidden && <SearchSection />}

      <Box
        component="main"
        style={{ width: '100%' }}
        sx={{
          flex: 1,
        }}
      >
        {children}
      </Box>

      <Box
        component="footer"
        style={{
          width: '100%',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
        }}
        sx={{
          py: 2,
          px: 2,
          textAlign: 'center',
          bgcolor: '#000',
          color: 'common.white',
        }}
      >
        <Typography variant="body2" color="inherit">
          <strong>
            {taxDisclaimer}
          </strong>
        </Typography>
        <Typography variant="body2" color="inherit" sx={{ mt: 1 }}>
          Copyright © 2026 Airik Resorts International. All rights reserved.
        </Typography>
      </Box>
    </Box>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createAppQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <BookingProvider>
        <ApplicationShell>{children}</ApplicationShell>
      </BookingProvider>
    </QueryClientProvider>
  )
}
