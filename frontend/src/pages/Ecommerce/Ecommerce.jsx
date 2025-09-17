import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Badge,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as EcommerceIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { shopAPI } from '../../services/api'

const Ecommerce = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [pRes, cRes] = await Promise.all([
          shopAPI.listProducts(),
          shopAPI.getCart()
        ])
        setProducts(pRes.data.data.products || [])
        setCart(cRes.data.data.cart)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load store')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cartCount = useMemo(() => (cart?.items || []).reduce((n, it) => n + it.quantity, 0), [cart])
  const cartTotal = useMemo(() => (cart?.items || []).reduce((n, it) => n + it.quantity * (it.product?.price ?? it.priceAtAdd ?? 0), 0), [cart])

  const addToCart = async (productId) => {
    try {
      const res = await shopAPI.addToCart(productId, 1)
      setCart(res.data.data.cart)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to add to cart')
    }
  }

  const Navbar = () => (
    <AppBar 
      position="sticky" 
      elevation={0} 
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
        color: '#333'
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={handleBackToDashboard}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <EcommerceIcon sx={{ fontSize: 32, color: '#4caf50', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
            Pet Store
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton color="inherit">
            <Badge badgeContent={cartCount} color="error">
              <CartIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit">
            <FavoriteIcon />
          </IconButton>
          
          {isMobile ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body1" sx={{ color: '#333', mr: 2 }}>
                {user?.name || 'User'}
              </Typography>
              <IconButton onClick={handleLogout} color="inherit">
                <LogoutIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )

  const MobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          backgroundColor: '#f8f9fa'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={handleMobileMenuToggle}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleBackToDashboard}>
              <ListItemText primary="Back to Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  )

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <MobileMenu />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#333' }}>
              Pet Products Store
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Everything your pet needs - food, toys, accessories, and more
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              sx={{ borderColor: '#4caf50', color: '#4caf50' }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              sx={{ borderColor: '#4caf50', color: '#4caf50' }}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
            >
              Add Product
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <EcommerceIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {products.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <EcommerceIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {products.filter(product => product.inStock).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Stock
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <EcommerceIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  ${cartTotal.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cart Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <EcommerceIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Products Grid */}
        <Grid container spacing={3}>
          {(loading ? [] : products).map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={product.images?.[0] || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400'}
                  alt={product.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {product.name}
                    </Typography>
                    <Chip 
                      label={product.inStock ? 'In Stock' : 'Out of Stock'} 
                      color={product.inStock ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.category}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      ⭐ {product.rating}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({product.reviews} reviews)
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
                    ${product.price}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    sx={{ borderColor: '#4caf50', color: '#4caf50' }}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={() => addToCart(product._id)}
                    sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                  >
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default Ecommerce