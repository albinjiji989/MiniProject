import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Chip, Button, CircularProgress, Alert, TextField, Rating, Divider, Stack } from '@mui/material'
import { petShopAPI, apiClient } from '../../../services/api'
import { Pets as PetsIcon, ArrowBack as BackIcon } from '@mui/icons-material'

const PetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [item, setItem] = useState(null)
  const [notes, setNotes] = useState('')
  const [reserving, setReserving] = useState(false)
  const [paying, setPaying] = useState(false)
  const [wishloading, setWishloading] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [reviews, setReviews] = useState([])
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const buildImageUrl = (url) => {
    if (!url) return '/placeholder-pet.svg'
    // Support base64 data URLs
    if (/^data:image\//i.test(url)) return url
    // If absolute URL, return directly
    if (/^https?:\/\//i.test(url)) return url
    // If relative (like /modules/petshop/uploads/...), prefix backend origin
    const apiBase = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || ''
    // Strip trailing /api if present
    const origin = apiBase.replace(/\/?api\/?$/, '')
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const load = async () => {
    try {
      setLoading(true)
      // Try public listing first
      let res
      try {
        res = await petShopAPI.getPublicListing(id)
        setItem(res.data.data.item)
      } catch (err) {
        // If not publicly available (reserved/sold), fallback to user-access endpoint
        const resp = await apiClient.get(`/petshop/user/listings/${id}`)
        setItem(resp.data.data.item)
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pet')
    } finally { setLoading(false) }
  }

  const toggleWishlist = async () => {
    try {
      setWishloading(true)
      if (isWishlisted) {
        await petShopAPI.removeFromWishlist(id)
        setIsWishlisted(false)
      } else {
        await petShopAPI.addToWishlist(id)
        setIsWishlisted(true)
      }
    } catch (e) {
      alert('Wishlist action failed')
    } finally { setWishloading(false) }
  }

  const submitReview = async () => {
    try {
      if (!myRating) return alert('Please select a rating')
      await petShopAPI.createReview({ itemId: id, rating: myRating, comment: myComment })
      setMyRating(0); setMyComment('')
      const r = await petShopAPI.getItemReviews(id)
      setReviews(r?.data?.data?.reviews || [])
    } catch (e) {
      alert('Failed to submit review')
    }
  }

  const buyNow = async () => {
    try {
      if (!item?.price || item.price <= 0) return alert('Price not set for this listing')
      setPaying(true)
      const amountPaise = Math.round(Number(item.price) * 100)
      const orderRes = await petShopAPI.createRazorpayOrder({ amount: amountPaise, currency: 'INR', receipt: `pet_${id}_${Date.now()}` })
      const { data, keyId } = orderRes.data
      const options = {
        key: keyId,
        amount: data.amount,
        currency: data.currency,
        name: item.name || 'Pet Listing',
        description: 'Pet purchase',
        order_id: data.id,
        handler: async function (response) {
          try {
            const verifyRes = await petShopAPI.verifyRazorpay({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            if (verifyRes.data?.success || verifyRes.data?.data?.valid) {
              alert('Payment successful! Our team will contact you shortly.')
            } else {
              alert('Payment verification failed. If amount deducted, please contact support.')
            }
          } catch (e) {
            alert('Payment verification error')
          }
        },
        prefill: {},
        theme: { color: '#0ea5ea' }
      }
      if (window.Razorpay) {
        const rz = new window.Razorpay(options)
        rz.open()
      } else {
        alert('Payment SDK not loaded')
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to start payment')
    } finally {
      setPaying(false)
    }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [id])

  useEffect(() => {
    const fetchExtras = async () => {
      try {
        // reviews
        const r = await petShopAPI.getItemReviews(id)
        setReviews(r?.data?.data?.reviews || [])
        // wishlist membership
        const w = await petShopAPI.listMyWishlist()
        const exists = (w?.data?.data?.items || []).some(x => x.itemId === id)
        setIsWishlisted(exists)
      } catch (_) {}
    }
    fetchExtras()
  }, [id])

  // SEO tags
  useEffect(() => {
    if (!item) return
    if (item.metaTitle) document.title = item.metaTitle
    const ensureMeta = (name) => {
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      return el
    }
    if (item.metaDescription) ensureMeta('description').setAttribute('content', item.metaDescription)
    if (item.metaKeywords && Array.isArray(item.metaKeywords)) ensureMeta('keywords').setAttribute('content', item.metaKeywords.join(', '))
  }, [item])

  // OLD RESERVATION METHOD - REPLACED WITH WIZARD
  // const reserve = async () => {
  //   try {
  //     setReserving(true)
  //     await petShopAPI.createReservation({ itemId: id, notes })
  //     alert('Reservation submitted. You can view it in your reservations list soon.')
  //   } catch (e) {
  //     setError(e?.response?.data?.message || 'Failed to reserve')
  //   } finally { setReserving(false) }
  // }

  const handleReserve = () => {
    // Navigate to the new reservation wizard
    navigate(`/User/petshop/reserve/${id}`)
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>
  if (error) return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>
  if (!item) return null

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Card>
        {/* Header image */}
        {item?.images?.length > 0 ? (
          <CardMedia
            component="img"
            height="300"
            image={buildImageUrl((item.images.find(i=>i.isPrimary)?.url) || item.images[0]?.url)}
            alt={item?.name || 'Pet'}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <CardMedia component="div" sx={{ height: 240, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PetsIcon sx={{ fontSize: 80, color: 'white', opacity: 0.85 }} />
          </CardMedia>
        )}
        <CardContent>
          <Stack direction={{ xs:'column', sm:'row' }} justifyContent="space-between" alignItems={{ xs:'flex-start', sm:'center' }} spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{item.name || 'Pet'} {item.petCode ? `• ${item.petCode}` : ''}</Typography>
              <Typography variant="body2" color="text.secondary">
                {item?.speciesId?.displayName || item?.speciesId?.name || 'Species'} • {item?.breedId?.name || 'Breed'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`₹${(item.price||0).toLocaleString()}`} size="small" color="success" />
              <Chip label={item.status} size="small" color="primary" variant="outlined" />
            </Stack>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Reserve this pet</Typography>
              <TextField fullWidth label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" disabled={reserving} onClick={handleReserve}>Reserve</Button>
                <Button variant="outlined" color="success" disabled={paying} onClick={buyNow}>Buy Now</Button>
                <Button variant="text" disabled={wishloading} onClick={toggleWishlist}>{isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}</Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Reviews</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={myRating} onChange={(_, v) => setMyRating(v || 0)} />
                <TextField size="small" label="Comment (optional)" value={myComment} onChange={(e) => setMyComment(e.target.value)} sx={{ flex: 1 }} />
                <Button variant="contained" onClick={submitReview}>Submit</Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {reviews.map((rv) => (
                  <Box key={rv._id} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={rv.rating} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">{new Date(rv.createdAt).toLocaleString()}</Typography>
                    </Box>
                    {rv.comment && <Typography variant="body2" sx={{ mt: 0.5 }}>{rv.comment}</Typography>}
                  </Box>
                ))}
                {reviews.length === 0 && <Typography variant="body2" color="text.secondary">No reviews yet.</Typography>}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  )
}

export default PetDetails