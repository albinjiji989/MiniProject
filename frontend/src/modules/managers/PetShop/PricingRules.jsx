import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const PricingRules = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pricingRules, setPricingRules] = useState([])
  const [categories, setCategories] = useState([])
  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [pricingBreeds, setPricingBreeds] = useState([])
  const [pricingDialog, setPricingDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const [pricingForm, setPricingForm] = useState({
    categoryId: '',
    speciesId: '',
    breedId: '',
    basePrice: 0,
    agePricing: {
      puppy: 1.2,
      young: 1.0,
      adult: 0.8
    },
    sizePricing: {
      tiny: 1.1,
      small: 1.0,
      medium: 1.2,
      large: 1.4,
      giant: 1.6
    },
    genderPricing: {
      male: 1.0,
      female: 1.1
    },
    seasonalPricing: {
      enabled: false,
      highSeason: {
        months: [],
        multiplier: 1.3
      },
      lowSeason: {
        months: [],
        multiplier: 0.9
      }
    },
    minPrice: 0,
    maxPrice: 0,
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch breeds for pricing form when species changes
  useEffect(() => {
    const sid = pricingForm.speciesId
    if (!sid) { setPricingBreeds([]); return }
    ;(async () => {
      try {
        const { data } = await apiClient.get('/admin/breeds/active', { params: { speciesId: sid } })
        setPricingBreeds(data?.data || [])
      } catch (_) { setPricingBreeds([]) }
    })()
  }, [pricingForm.speciesId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rulesRes, catsRes, specsRes, brdsRes] = await Promise.allSettled([
        apiClient.get('/petshop/pricing'),
        apiClient.get('/admin/pet-categories/active'),
        apiClient.get('/admin/species/active'),
        apiClient.get('/admin/breeds/active')
      ])
      if (rulesRes.status === 'fulfilled') {
        const body = rulesRes.value.data || {}
        const dataNode = body.data ?? body
        const rules = Array.isArray(dataNode?.pricingRules) ? dataNode.pricingRules : (Array.isArray(dataNode) ? dataNode : [])
        setPricingRules(rules)
      }
      if (catsRes.status === 'fulfilled') {
        const body = catsRes.value.data || {}
        setCategories(body?.data || body?.items || [])
      }
      if (specsRes.status === 'fulfilled') {
        const body = specsRes.value.data || {}
        setSpecies(body?.data || body?.items || [])
      }
      if (brdsRes.status === 'fulfilled') {
        const body = brdsRes.value.data || {}
        setBreeds(body?.data || body?.items || [])
      }
    } catch (err) {
      console.error('Fetch data error:', err)
      showSnackbar('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreatePricingRule = async () => {
    try {
      await apiClient.post('/petshop/pricing', pricingForm)
      showSnackbar('Pricing rule created successfully!')
      setPricingDialog(false)
      resetPricingForm()
      fetchData()
    } catch (err) {
      console.error('Create pricing rule error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to create pricing rule', 'error')
    }
  }

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return
    
    try {
      await apiClient.delete(`/petshop/pricing/${ruleId}`)
      showSnackbar('Pricing rule deleted successfully!')
      fetchData()
    } catch (err) {
      console.error('Delete pricing rule error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to delete pricing rule', 'error')
    }
  }

  const resetPricingForm = () => {
    setPricingForm({
      categoryId: '',
      speciesId: '',
      breedId: '',
      basePrice: 0,
      agePricing: {
        puppy: 1.2,
        young: 1.0,
        adult: 0.8
      },
      sizePricing: {
        tiny: 1.1,
        small: 1.0,
        medium: 1.2,
        large: 1.4,
        giant: 1.6
      },
      genderPricing: {
        male: 1.0,
        female: 1.1
      },
      seasonalPricing: {
        enabled: false,
        highSeason: {
          months: [],
          multiplier: 1.3
        },
        lowSeason: {
          months: [],
          multiplier: 0.9
        }
      },
      minPrice: 0,
      maxPrice: 0,
      notes: ''
    })
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/manager/petshop/inventory')}
          sx={{ mr: 2 }}
        >
          Back to Overview
        </Button>
        <Typography variant="h4" component="h1">
          Pricing Rules
        </Typography>
      </Box>

      {/* Actions Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setPricingDialog(true)}
            >
              Create New Pricing Rule
            </Button>
            <Typography variant="body2" color="textSecondary">
              Set up automatic pricing based on pet characteristics
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Pricing Rules Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Pricing Rules ({pricingRules.length})
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category/Species/Breed</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell>Age Multipliers</TableCell>
                  <TableCell>Gender Multipliers</TableCell>
                  <TableCell>Price Range</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pricingRules.map(rule => (
                  <TableRow key={rule._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {rule.categoryId?.displayName || rule.categoryId?.name || 'Any Category'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {rule.speciesId?.displayName || rule.speciesId?.name || 'Any Species'} / 
                          {rule.breedId?.name || 'Any Breed'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ₹{Number(rule.basePrice || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption">
                          Puppy: {rule.agePricing?.puppy || 1}x
                        </Typography><br />
                        <Typography variant="caption">
                          Young: {rule.agePricing?.young || 1}x
                        </Typography><br />
                        <Typography variant="caption">
                          Adult: {rule.agePricing?.adult || 1}x
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption">
                          Male: {rule.genderPricing?.male || 1}x
                        </Typography><br />
                        <Typography variant="caption">
                          Female: {rule.genderPricing?.female || 1}x
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        ₹{Number(rule.minPrice || 0).toLocaleString()} - 
                        ₹{Number(rule.maxPrice || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Rule">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Rule">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteRule(rule._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Pricing Rule Dialog */}
      <Dialog open={pricingDialog} onClose={() => setPricingDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Create Pricing Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={pricingForm.categoryId}
                  onChange={(e) => setPricingForm(prev => ({ ...prev, categoryId: e.target.value }))}
                >
                  <MenuItem value="">Any Category</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.displayName || cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Species</InputLabel>
                <Select
                  value={pricingForm.speciesId}
                  onChange={(e) => setPricingForm(prev => ({ ...prev, speciesId: e.target.value, breedId: '' }))}
                >
                  <MenuItem value="">Any Species</MenuItem>
                  {species.map((spec) => (
                    <MenuItem key={spec._id} value={spec._id}>
                      {spec.displayName || spec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Breed</InputLabel>
                <Select
                  value={pricingForm.breedId}
                  onChange={(e) => setPricingForm(prev => ({ ...prev, breedId: e.target.value }))}
                >
                  <MenuItem value="">Any Breed</MenuItem>
                  {pricingBreeds.map((breed) => (
                    <MenuItem key={breed._id} value={breed._id}>
                      {breed.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Price"
                type="number"
                value={pricingForm.basePrice}
                onChange={(e) => setPricingForm(prev => ({ 
                  ...prev, 
                  basePrice: parseFloat(e.target.value) || 0 
                }))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Minimum Price"
                type="number"
                value={pricingForm.minPrice}
                onChange={(e) => setPricingForm(prev => ({ 
                  ...prev, 
                  minPrice: parseFloat(e.target.value) || 0 
                }))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Maximum Price"
                type="number"
                value={pricingForm.maxPrice}
                onChange={(e) => setPricingForm(prev => ({ 
                  ...prev, 
                  maxPrice: parseFloat(e.target.value) || 0 
                }))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                }}
              />
            </Grid>

            {/* Age Pricing Multipliers */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Age-based Pricing Multipliers</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Puppy/Kitten Multiplier"
                        type="number"
                        step="0.1"
                        value={pricingForm.agePricing.puppy}
                        onChange={(e) => setPricingForm(prev => ({
                          ...prev,
                          agePricing: { ...prev.agePricing, puppy: parseFloat(e.target.value) }
                        }))}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Young Multiplier"
                        type="number"
                        step="0.1"
                        value={pricingForm.agePricing.young}
                        onChange={(e) => setPricingForm(prev => ({
                          ...prev,
                          agePricing: { ...prev.agePricing, young: parseFloat(e.target.value) }
                        }))}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Adult Multiplier"
                        type="number"
                        step="0.1"
                        value={pricingForm.agePricing.adult}
                        onChange={(e) => setPricingForm(prev => ({
                          ...prev,
                          agePricing: { ...prev.agePricing, adult: parseFloat(e.target.value) }
                        }))}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Gender Pricing Multipliers */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Gender-based Pricing Multipliers</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Male Multiplier"
                        type="number"
                        step="0.1"
                        value={pricingForm.genderPricing.male}
                        onChange={(e) => setPricingForm(prev => ({
                          ...prev,
                          genderPricing: { ...prev.genderPricing, male: parseFloat(e.target.value) }
                        }))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Female Multiplier"
                        type="number"
                        step="0.1"
                        value={pricingForm.genderPricing.female}
                        onChange={(e) => setPricingForm(prev => ({
                          ...prev,
                          genderPricing: { ...prev.genderPricing, female: parseFloat(e.target.value) }
                        }))}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={pricingForm.notes}
                onChange={(e) => setPricingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this pricing rule..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPricingDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePricingRule} variant="contained">
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  )
}

export default PricingRules
