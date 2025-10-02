import React, { useEffect, useState } from 'react'
import { Box, Typography, Card, CardContent, Button, Grid, TextField, MenuItem, Alert, Avatar } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { userPetsAPI } from '../../../services/api'

const AddPet = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    speciesId: '',
    breedId: '',
    color: '',
    gender: 'Unknown',
    age: '',
    ageUnit: 'months'
  })
  const [images, setImages] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [speciesList, setSpeciesList] = useState([])
  const [breedList, setBreedList] = useState([])
  const [petDetailsOptions, setPetDetailsOptions] = useState([])
  const [requestMessage, setRequestMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      if (!form.name?.trim()) throw new Error('Pet name is required')
      if (!form.gender) throw new Error('Gender is required')
      if (form.age === '' || form.age === null) throw new Error('Age is required')
      if (!form.color?.trim()) throw new Error('Color is required')

      const payload = {
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        ageUnit: form.ageUnit,
        gender: form.gender,
        color: form.color || undefined,
        speciesId: form.speciesId || undefined,
        breedId: form.breedId || undefined,
        tags: undefined
      }
      await userPetsAPI.create(payload)
      navigate('/User/pets')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create pet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onFilesSelected = async (event) => {
    const files = Array.from(event.target.files || [])
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const results = []
    for (const file of files) {
      try {
        const b64 = await toBase64(file)
        results.push(b64)
      } catch (e) { /* ignore single file failure */ }
    }
    setImages((prev) => [...prev, ...results])
  }

  // Load categories and species on mount
  useEffect(() => {
    (async () => {
      try {
        const [catRes] = await Promise.all([
          userPetsAPI.getCategories()
        ])
        const cats = catRes.data?.data || []
        setCategories(cats)
        if (cats.length && !categoryId) {
          setCategoryId(cats[0]._id)
        }
        // Load species for selected category if any
        const selected = cats[0]
        if (selected) {
          const spRes = await userPetsAPI.getSpeciesActive(selected.name)
          setSpeciesList(spRes.data?.data || [])
        } else {
          setSpeciesList([])
        }
      } catch (e) {
        setCategories([])
        setSpeciesList([])
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // When category changes, load species for that category
  useEffect(() => {
    (async () => {
      if (!categoryId) return
      const cat = categories.find((c) => String(c._id) === String(categoryId))
      if (!cat) return
      try {
        const spRes = await userPetsAPI.getSpeciesActive(cat.name)
        setSpeciesList(spRes.data?.data || [])
      } catch (e) {
        setSpeciesList([])
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  // Load breeds when species changes
  useEffect(() => {
    (async () => {
      setBreedList([])
      setForm((f) => ({ ...f, breedId: '', petDetailsId: '' }))
      setPetDetailsOptions([])
      if (!form.speciesId) return
      try {
        const res = await userPetsAPI.getBreedsBySpecies(form.speciesId)
        setBreedList(res.data?.data || [])
      } catch (e) {
        setBreedList([])
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.speciesId])

  // Pet details selection removed per requirements

  const submitRequest = async (type) => {
    try {
      setIsSubmitting(true)
      setError('')
      if (type === 'species') {
        await userPetsAPI.submitCustomRequest({
          requestType: 'species',
          speciesName: requestMessage || 'Requested species',
          speciesDisplayName: requestMessage || 'Requested species',
          reason: 'Requested from Add Pet page'
        })
      } else if (type === 'breed') {
        await userPetsAPI.submitCustomRequest({
          requestType: 'breed',
          speciesId: form.speciesId,
          breedName: requestMessage || 'Requested breed',
          reason: 'Requested from Add Pet page'
        })
      }
      setRequestMessage('')
      navigate('/pets')
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/User/pets')}
          sx={{ mr: 2 }}
        >
          Back to Pets
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Add New Pet
        </Typography>
      </Box>

      <Card component="form" onSubmit={handleSubmit}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add New Pet
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Name" name="name" value={form.name} onChange={handleChange} />
            </Grid>
            {categories.length > 0 && (
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth required label="Category" name="categoryId" value={categoryId} onChange={(e)=>{ setCategoryId(e.target.value); setForm((f)=>({ ...f, speciesId: '', breedId: '', petDetailsId: '' })); setBreedList([]); setPetDetailsOptions([]); }}>
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.displayName || c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required label="Species" name="speciesId" value={form.speciesId} onChange={handleChange}>
                {speciesList
                  .filter((s) => {
                    if (!categoryId) return true
                    const cat = categories.find((c) => String(c._id) === String(categoryId))
                    const selectedCategoryName = (cat?.name || '').toLowerCase()
                    return String(s.category || '').toLowerCase() === selectedCategoryName
                  })
                  .map((s) => (
                  <MenuItem key={s._id} value={s._id}>{s.displayName || s.name}</MenuItem>
                ))}
              </TextField>
              {!speciesList.length && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No species available. Ask admin to add species. You can also submit a request.
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField size="small" placeholder="Species name" value={requestMessage} onChange={(e)=>setRequestMessage(e.target.value)} />
                    <Button size="small" variant="outlined" onClick={() => submitRequest('species')}>Request Species</Button>
                  </Box>
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required label="Breed" name="breedId" value={form.breedId} onChange={handleChange} disabled={!form.speciesId || !breedList.length}>
                {breedList.map((b) => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </TextField>
              {form.speciesId && !breedList.length && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No breeds available for selected species. You can submit a request.
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField size="small" placeholder="Breed name" value={requestMessage} onChange={(e)=>setRequestMessage(e.target.value)} />
                    <Button size="small" variant="outlined" onClick={() => submitRequest('breed')}>Request Breed</Button>
                  </Box>
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Color" name="color" value={form.color} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Gender" name="gender" value={form.gender} onChange={handleChange}>
                {['Male','Female','Unknown'].map((g) => (
                  <MenuItem key={g} value={g}>{g}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Age" name="age" value={form.age} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth label="Age Unit" name="ageUnit" value={form.ageUnit} onChange={handleChange}>
                {['weeks','months','years'].map((u) => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/pets')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>Save Pet</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AddPet


