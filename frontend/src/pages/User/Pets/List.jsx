import React, { useEffect, useState } from 'react'
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Grid,
	TextField,
	InputAdornment,
	Chip,
	IconButton,
	Menu,
	MenuItem,
} from '@mui/material'
import {
	Search as SearchIcon,
	Add as AddIcon,
	FilterList as FilterIcon,
	MoreVert as MoreVertIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as ViewIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { userPetsAPI } from '../../../services/api'

const UserPetsList = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [filterAnchor, setFilterAnchor] = useState(null)
	const [menuAnchor, setMenuAnchor] = useState(null)
	const [selectedPet, setSelectedPet] = useState(null)
	const [pets, setPets] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [pages, setPages] = useState(1)
	const [filters, setFilters] = useState({ status: '' })

	const loadPets = async (pageParam = 1) => {
		try {
			setLoading(true)
			setError('')
			const res = await userPetsAPI.list({
				page: pageParam,
				limit: 12,
				search: searchTerm || undefined,
				status: filters.status || undefined,
			})
			const data = res.data
			const items = Array.isArray(data?.data) ? data.data : data
			const pagination = res.data?.pagination
			setPets(items || [])
			setPage(pagination?.current || 1)
			setPages(pagination?.pages || 1)
			setTotal(pagination?.total || (items?.length || 0))
		} catch (err) {
			setError(err?.response?.data?.message || 'Failed to load pets')
			setPets([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { loadPets(1) }, [])

	const handleSearch = (event) => {
		setSearchTerm(event.target.value)
	}

	const applySearch = () => {
		loadPets(1)
	}

	const handleFilterClick = (event) => {
		setFilterAnchor(event.currentTarget)
	}

	const handleMenuClick = (event, pet) => {
		setMenuAnchor(event.currentTarget)
		setSelectedPet(pet)
	}

	const handleMenuClose = () => {
		setMenuAnchor(null)
		setSelectedPet(null)
	}

	const handleViewPet = () => {
		navigate(`/pets/${selectedPet._id}`)
		handleMenuClose()
	}

	const handleEditPet = () => {
		navigate(`/pets/${selectedPet._id}`)
		handleMenuClose()
	}

	const handleDeletePet = () => {
		// TODO: delete flow for user pet
		handleMenuClose()
	}

	const getStatusColor = (status) => {
		switch (status) {
			case 'available':
				return 'success'
			case 'in_care':
				return 'info'
			case 'adopted':
				return 'default'
			case 'rescued':
				return 'warning'
			default:
				return 'default'
		}
	}

	const getStatusLabel = (status) => {
		switch (status) {
			case 'available':
				return 'Available'
			case 'in_care':
				return 'In Care'
			case 'adopted':
				return 'Adopted'
			case 'rescued':
				return 'Rescued'
			default:
				return status
		}
	}

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant="h4" sx={{ fontWeight: 600 }}>
					My Pets
				</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
						onClick={() => navigate('/User/pets/add')}
				>
					Add New Pet
				</Button>
			</Box>

			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
						<TextField
							fullWidth
							placeholder="Search pets by name..."
							value={searchTerm}
							onChange={handleSearch}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon />
									</InputAdornment>
								),
							}}
						/>
						<Button variant="contained" onClick={applySearch}>Search</Button>
						<Button variant="outlined" startIcon={<FilterIcon />} onClick={handleFilterClick}>Filters</Button>
					</Box>
					<Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
						<TextField select label="Status" size="small" value={filters.status} onChange={(e)=>setFilters(f=>({...f, status: e.target.value }))}>
							<MenuItem value="">All</MenuItem>
							{['available','in_care','adopted','rescued','lost','deceased','not_available'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
						</TextField>
					</Box>
					<Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
						<Button variant="outlined" onClick={()=>{ setFilters({ status:'' }); loadPets(1) }}>Clear</Button>
						<Button variant="contained" onClick={()=>loadPets(1)}>Apply Filters</Button>
					</Box>
				</CardContent>
			</Card>

			{error && (
				<Card sx={{ mb: 3 }}>
					<CardContent>
						<Typography color="error">{error}</Typography>
					</CardContent>
				</Card>
			)}
			{loading ? (
				<Typography>Loading pets...</Typography>
			) : pets.length === 0 ? (
				<Card>
					<CardContent>
						<Typography>No pets found.</Typography>
						<Typography variant="body2" color="text.secondary">Add your first pet to get started.</Typography>
					</CardContent>
				</Card>
			) : (
				<Grid container spacing={3}>
					{pets.map((pet) => (
						<Grid item xs={12} sm={6} md={4} key={pet._id}>
							<Card sx={{ height: '100%', position: 'relative' }}>
								<Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
									<IconButton size="small" onClick={(e) => handleMenuClick(e, pet)}>
										<MoreVertIcon />
									</IconButton>
								</Box>
								<CardContent>
									<Box sx={{ textAlign: 'center', mb: 2 }}>
										<Box
											sx={{
												width: 120,
												height: 120,
												borderRadius: '50%',
												backgroundColor: 'grey.200',
												margin: '0 auto 16px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<Typography variant="h4" color="text.secondary">
												{pet.name?.charAt(0) || '?'}
											</Typography>
										</Box>
										<Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
											{pet.name}
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
											{(pet.age !== undefined ? pet.age : '-') + ' ' + (pet.ageUnit || '-') + ' • ' + (pet.gender || '-')}
										</Typography>
										<Chip label={getStatusLabel(pet.currentStatus || 'available')} color={getStatusColor((pet.currentStatus || 'available'))} size="small" />
										<Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
											Color: {pet.color || '-'}
										</Typography>
									</Box>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			)}

			{/* Pagination */}
			<Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="body2" color="text.secondary">Total: {total}</Typography>
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
					<Button variant="outlined" disabled={page <= 1} onClick={()=>loadPets(page - 1)}>Prev</Button>
					<Typography variant="body2">Page {page} of {pages}</Typography>
					<Button variant="outlined" disabled={page >= pages} onClick={()=>loadPets(page + 1)}>Next</Button>
				</Box>
			</Box>

			{/* Action Menu */}
			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={handleMenuClose}
			>
				<MenuItem onClick={handleViewPet}>
					<ViewIcon sx={{ mr: 1 }} />
					View Details
				</MenuItem>
				<MenuItem onClick={handleEditPet}>
					<EditIcon sx={{ mr: 1 }} />
					Edit
				</MenuItem>
				<MenuItem onClick={handleDeletePet} sx={{ color: 'error.main' }}>
					<DeleteIcon sx={{ mr: 1 }} />
					Delete
				</MenuItem>
			</Menu>

			{/* Filter Menu */}
			<Menu
				anchorEl={filterAnchor}
				open={Boolean(filterAnchor)}
				onClose={() => setFilterAnchor(null)}
			>
				<MenuItem onClick={() => { setFilterAnchor(null) }}>All Status</MenuItem>
				<MenuItem onClick={() => { setFilterAnchor(null) }}>Available</MenuItem>
				<MenuItem onClick={() => { setFilterAnchor(null) }}>In Care</MenuItem>
				<MenuItem onClick={() => { setFilterAnchor(null) }}>Adopted</MenuItem>
			</Menu>
		</Box>
	)
}

export default UserPetsList


