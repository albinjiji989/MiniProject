import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Breadcrumbs,
  Link,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon,
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Security as BlockchainIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Verified as VerifiedIcon,
  Fingerprint as FingerprintIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  Security,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI } from '../../../services/petSystemAPI'

const BlockchainExplorer = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [expandedPet, setExpandedPet] = useState(null)
  const [availableSpecies, setAvailableSpecies] = useState([])
  const [availableBreeds, setAvailableBreeds] = useState([])
  const [tamperingData, setTamperingData] = useState(null)
  const [showTamperingAlert, setShowTamperingAlert] = useState(false)
  
  const [blockchainData, setBlockchainData] = useState({
    overview: {
      totalBlocks: 0,
      isValid: true,
      totalPets: 0,
      totalTransactions: 0
    },
    petBlockchains: []
  })

  useEffect(() => {
    loadBlockchainData()
    checkTampering()
    
    // Auto-refresh every 10 seconds to check for tampering
    const interval = setInterval(() => {
      checkTampering()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const checkTampering = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/blockchain/detect-tampering')
      const result = await response.json()
      
      if (result.success && result.data.tamperedPets > 0) {
        setTamperingData(result.data)
        setShowTamperingAlert(true)
      } else {
        setTamperingData(null)
      }
    } catch (err) {
      console.error('Tampering check failed:', err)
    }
  }

  const loadBlockchainData = async () => {
    setLoading(true)
    try {
      const response = await petsAPI.getBlockchainData()
      if (response.data?.success) {
        const data = response.data.data
        
        // Group transactions by pet
        const petMap = new Map()
        
        data.recentTransactions.forEach(tx => {
          const petCode = tx.petCode
          if (!petMap.has(petCode)) {
            petMap.set(petCode, {
              petCode: petCode,
              petName: tx.petName,
              species: tx.species || 'Unknown',
              breed: tx.breed || 'Unknown',
              blocks: [],
              totalBlocks: 0,
              firstTransaction: tx.timestamp,
              lastTransaction: tx.timestamp,
              status: tx.eventType === 'adoption' ? 'adopted' : 'available'
            })
          }
          
          const pet = petMap.get(petCode)
          pet.blocks.push({
            id: tx.id,
            blockIndex: tx.blockIndex,
            timestamp: tx.timestamp,
            eventType: tx.eventType,
            hash: tx.hash,
            userName: tx.userName,
            amount: tx.amount
          })
          pet.totalBlocks = pet.blocks.length
          
          // Update timestamps
          if (new Date(tx.timestamp) < new Date(pet.firstTransaction)) {
            pet.firstTransaction = tx.timestamp
          }
          if (new Date(tx.timestamp) > new Date(pet.lastTransaction)) {
            pet.lastTransaction = tx.timestamp
          }
          
          // Update status
          if (tx.eventType === 'adoption') {
            pet.status = 'adopted'
            pet.adopterName = tx.userName
            pet.adoptionFee = tx.amount
          }
        })
        
        // Convert map to array and sort by last transaction
        const petBlockchains = Array.from(petMap.values())
          .sort((a, b) => new Date(b.lastTransaction) - new Date(a.lastTransaction))
        
        // Extract unique species and breeds for filters
        const species = [...new Set(petBlockchains.map(pet => pet.species).filter(Boolean))]
        const breeds = [...new Set(petBlockchains.map(pet => pet.breed).filter(Boolean))]
        
        setAvailableSpecies(species)
        setAvailableBreeds(breeds)
        
        setBlockchainData({
          overview: {
            totalBlocks: data.totalBlocks || data.recentTransactions.length,
            isValid: data.isValid,
            totalPets: petBlockchains.length,
            totalTransactions: data.recentTransactions.length
          },
          petBlockchains
        })
      }
    } catch (err) {
      setError('Failed to load blockchain data')
      console.error('Blockchain data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExpandPet = (petHash) => {
    setExpandedPet(expandedPet === petHash ? null : petHash)
  }

  const filteredPets = blockchainData.petBlockchains.filter(pet => {
    const matchesSearch = pet.petCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecies = !speciesFilter || pet.species === speciesFilter
    const matchesBreed = !breedFilter || pet.breed === breedFilter
    
    return matchesSearch && matchesSpecies && matchesBreed
  })

  const PetBlockchainCard = ({ pet }) => {
    const petHash = Math.abs(pet.petCode.split('').reduce((a, b) => a + b.charCodeAt(0), 0)).toString()
    const isExpanded = expandedPet === petHash
    
    // Check if this pet has tampering
    const petTampering = tamperingData?.tamperingResults?.find(t => t.petCode === pet.petCode)
    const hasTampering = !!petTampering
    
    return (
      <Card 
        sx={{ 
          mb: 2,
          border: '2px solid',
          borderColor: hasTampering ? 'error.main' : (pet.status === 'adopted' ? 'success.main' : 'info.main'),
          transition: 'all 0.3s ease',
          bgcolor: hasTampering ? alpha('#f44336', 0.05) : 'background.paper',
          '&:hover': {
            boxShadow: 4,
            borderColor: hasTampering ? 'error.dark' : (pet.status === 'adopted' ? 'success.dark' : 'info.dark')
          }
        }}
      >
        <CardContent>
          {/* Tampering Alert */}
          {hasTampering && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              icon={<Security />}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                🚨 DATA TAMPERING DETECTED!
              </Typography>
              {petTampering.discrepancies.map((disc, idx) => (
                <Typography key={idx} variant="body2" sx={{ mt: 1 }}>
                  • <strong>{disc.field}</strong>: Blockchain shows <strong>${disc.blockchainValue}</strong>, 
                  but MongoDB shows <strong>${disc.currentValue}</strong>
                  {disc.difference && ` (Loss: $${disc.difference})`}
                  <br />
                  Missing Event: <strong>{disc.missingEvent}</strong>
                </Typography>
              ))}
            </Alert>
          )}
          
          {/* Pet Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar 
                sx={{ 
                  bgcolor: pet.status === 'adopted' ? 'success.main' : 'info.main',
                  width: 56,
                  height: 56
                }}
              >
                <PetsIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {pet.petCode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pet.species} • {pet.breed}
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {hasTampering && (
                <Chip 
                  label="🚨 TAMPERED" 
                  color="error"
                  icon={<WarningIcon />}
                  sx={{ fontWeight: 'bold', animation: 'pulse 2s infinite' }}
                />
              )}
              <Chip 
                label={pet.status === 'adopted' ? 'Adopted' : 'Available'} 
                color={pet.status === 'adopted' ? 'success' : 'info'}
                icon={pet.status === 'adopted' ? <CheckCircleIcon /> : <PetsIcon />}
              />
              <Chip 
                icon={<BlockchainIcon />}
                label={`${pet.totalBlocks} Blocks`} 
                variant="outlined"
                color="primary"
              />
              <IconButton onClick={() => handleExpandPet(petHash)}>
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </Box>

          {/* Pet Summary Stats */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, bgcolor: alpha('#667eea', 0.1), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Blocks
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {pet.totalBlocks}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, bgcolor: alpha('#4facfe', 0.1), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  First Transaction
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {new Date(pet.firstTransaction).toLocaleDateString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, bgcolor: alpha('#f093fb', 0.1), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Last Transaction
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {new Date(pet.lastTransaction).toLocaleDateString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, bgcolor: alpha('#fa709a', 0.1), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Chain Status
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <VerifiedIcon fontSize="small" color="success" />
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    Verified
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Expanded Blockchain History */}
          <Collapse in={isExpanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              📜 Complete Blockchain History
            </Typography>
            
            <Stack spacing={2}>
              {pet.blocks
                .sort((a, b) => b.blockIndex - a.blockIndex)
                .map((block, index) => (
                <Paper 
                  key={block.id}
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    position: 'relative',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  {/* Block Header */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: block.eventType === 'adoption' ? 'success.main' : 'primary.main',
                          width: 40,
                          height: 40
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          #{block.blockIndex}
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {block.eventType.replace('_', ' ')}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(block.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Chip 
                      icon={<VerifiedIcon />}
                      label="Verified" 
                      size="small" 
                      color="success"
                    />
                  </Box>

                  {/* Blockchain Hash */}
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <FingerprintIcon fontSize="small" color="primary" />
                      <Typography variant="caption" fontWeight="bold" color="text.secondary">
                        SHA-256 HASH
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                        color: 'primary.main',
                        fontWeight: 600
                      }}
                    >
                      {block.hash}
                    </Typography>
                  </Box>

                  {/* Transaction Details */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            User
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            User #{Math.abs((block.userName || 'System').split('').reduce((a, b) => a + b.charCodeAt(0), 0)).toString().slice(-4)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    {block.amount > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <MoneyIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Amount
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight="bold" color={
                                petTampering && block.eventType === 'PET_CREATED' ? 'primary.main' :
                                petTampering && (block.eventType === 'PAYMENT_COMPLETED' || block.eventType === 'payment') ? 'error.main' :
                                'success.main'
                              }>
                                ${block.amount.toLocaleString()}
                              </Typography>
                              {petTampering && block.eventType === 'PET_CREATED' && (
                                <Chip label="ORIGINAL" size="small" color="primary" sx={{ height: 20 }} />
                              )}
                              {petTampering && (block.eventType === 'PAYMENT_COMPLETED' || block.eventType === 'payment') && (
                                <Chip label="TAMPERED" size="small" color="error" sx={{ height: 20 }} />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  {/* Chain Link Indicator */}
                  {index < pet.blocks.length - 1 && (
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        bottom: -16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1
                      }}
                    >
                      <LinkIcon 
                        sx={{ 
                          color: 'primary.main',
                          bgcolor: 'background.paper',
                          borderRadius: '50%',
                          p: 0.5
                        }} 
                      />
                    </Box>
                  )}
                </Paper>
              ))}
            </Stack>

            {/* Tampering Detection Summary */}
            {petTampering && (
              <Paper 
                sx={{ 
                  mt: 3, 
                  p: 3, 
                  bgcolor: alpha('#f44336', 0.1),
                  border: '2px solid',
                  borderColor: 'error.main',
                  borderRadius: 2
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      🚨 TAMPERING DETECTED
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unauthorized data modification detected through blockchain comparison
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Discrepancies Found:
                </Typography>
                
                {petTampering.discrepancies.map((disc, idx) => (
                  <Paper key={idx} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">
                          Field Modified
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {disc.field}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Blockchain Value (Original)
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary.main">
                          ${disc.blockchainValue}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          MongoDB Value (Current)
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          ${disc.currentValue}
                        </Typography>
                      </Grid>
                      {disc.difference && (
                        <Grid item xs={12}>
                          <Alert severity="error" icon={<MoneyIcon />}>
                            <Typography variant="body2" fontWeight="bold">
                              Financial Loss: ${disc.difference.toLocaleString()}
                            </Typography>
                          </Alert>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Alert severity="warning" icon={<BlockchainIcon />}>
                          <Typography variant="body2">
                            Missing Blockchain Event: <strong>{disc.missingEvent}</strong>
                          </Typography>
                          <Typography variant="caption">
                            If this change was legitimate, a blockchain block should have been created.
                          </Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Evidence:</strong> Block #{petTampering.createdBlock.index} (PET_CREATED) 
                    immutably records the original values. This provides forensic proof of tampering.
                  </Typography>
                </Alert>
              </Paper>
            )}

            {/* Adoption Info */}
            {pet.status === 'adopted' && (
              <Paper 
                sx={{ 
                  mt: 3, 
                  p: 3, 
                  bgcolor: alpha('#4caf50', 0.1),
                  border: '2px solid',
                  borderColor: 'success.main',
                  borderRadius: 2
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      Successfully Adopted
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This pet has found a forever home
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Adopter
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      [Adopter #{petHash.slice(-4)}]
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Adoption Fee
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      ${pet.adoptionFee?.toLocaleString() || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Collapse>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}
      </style>
      
      {/* Header */}
      <Box mb={4}>
        {/* Global Tampering Alert */}
        {tamperingData && tamperingData.tamperedPets > 0 && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            icon={<WarningIcon />}
            action={
              <Button color="inherit" size="small" onClick={() => setShowTamperingAlert(false)}>
                DISMISS
              </Button>
            }
          >
            <Typography variant="h6" fontWeight="bold">
              🚨 BLOCKCHAIN TAMPERING DETECTED!
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>{tamperingData.tamperedPets}</strong> pet(s) have unauthorized data modifications detected through blockchain comparison.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total Financial Loss: <strong>${tamperingData.tamperingResults.reduce((sum, t) => {
                const feeLoss = t.discrepancies.find(d => d.field === 'adoptionFee' || d.field === 'payment')
                return sum + (feeLoss?.difference || 0)
              }, 0).toLocaleString()}</strong>
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Last checked: {new Date(tamperingData.checkedAt).toLocaleTimeString()}
            </Typography>
          </Alert>
        )}
        
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link color="inherit" href="/admin/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Admin
          </Link>
          <Link color="inherit" href="/admin/pets" sx={{ display: 'flex', alignItems: 'center' }}>
            <PetsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Pet Management
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            <BlockchainIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Blockchain Explorer
          </Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              🔗 Pet Blockchain Explorer
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              View complete blockchain history for each pet with SHA-256 verification
            </Typography>
            {tamperingData && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                🔄 Auto-checking for tampering every 10 seconds... Last check: {new Date(tamperingData.checkedAt).toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Security />}
              onClick={checkTampering}
              color={tamperingData && tamperingData.tamperedPets > 0 ? 'error' : 'primary'}
            >
              Check Tampering Now
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/pets')}
            >
              Back to Dashboard
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <PetsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {blockchainData.overview.totalPets}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Pets
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <BlockchainIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {blockchainData.overview.totalBlocks}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Blocks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <TimelineIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {blockchainData.overview.totalTransactions}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Transactions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <VerifiedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {blockchainData.overview.isValid ? 'Valid' : 'Invalid'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Chain Status
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by pet code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Species</InputLabel>
                <Select
                  value={speciesFilter}
                  label="Species"
                  onChange={(e) => setSpeciesFilter(e.target.value)}
                  startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="">All Species</MenuItem>
                  {availableSpecies.map((species) => (
                    <MenuItem key={species} value={species}>
                      {species}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Breed</InputLabel>
                <Select
                  value={breedFilter}
                  label="Breed"
                  onChange={(e) => setBreedFilter(e.target.value)}
                  startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="">All Breeds</MenuItem>
                  {availableBreeds.map((breed) => (
                    <MenuItem key={breed} value={breed}>
                      {breed}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setSpeciesFilter('')
                  setBreedFilter('')
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pet Blockchains */}
      <Box>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Individual Pet Blockchains ({filteredPets.length})
        </Typography>
        
        {filteredPets.length > 0 ? (
          filteredPets.map((pet) => (
            <PetBlockchainCard key={`pet-${Math.abs(pet.petCode.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}`} pet={pet} />
          ))
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <BlockchainIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No pets found with blockchain records
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pet transactions will appear here once recorded on the blockchain
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Error Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default BlockchainExplorer
