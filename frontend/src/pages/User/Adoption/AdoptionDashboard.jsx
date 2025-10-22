import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  CardActions,
  Tooltip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetIcon,
  Home as HomeIcon,
  ShoppingCart as ShopIcon,
  LocalShipping as RescueIcon,
  Medication as PharmacyIcon,
  Healing as VeterinaryIcon,
  Assignment as AdoptionIcon,
  Build as CareIcon,
  TrendingUp as TrendingIcon,
  Search as SearchIcon,
  Add as AddIcon,
  FavoriteOutlined as FavoriteIcon,
  Notifications as NotificationIcon,
  Star as StarIcon,
  ArrowForward as ArrowIcon,
  Block as BlockIcon,
  Construction as ConstructionIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { apiClient, adoptionAPI, resolveMediaUrl } from '../../../services/api'
import { useNavigate, useLocation } from 'react-router-dom'
import UserLayout from '../../../components/Layout/UserLayout'
import LoadingSpinner from '../../../components/UI/LoadingSpinner'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'

const AdoptionDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [adopted, setAdopted] = useState([])
  const [tab, setTab] = useState('browse')

  useEffect(() => {
    fetchData();
  }, []);

  // Sync active tab from current route
  useEffect(() => {
    if (location.pathname.includes('/adoption/applications')) {
      setTab('applications')
    } else if (location.pathname.includes('/adoption/adopted')) {
      setTab('adopted')
    } else {
      setTab('browse')
    }
  }, [location.pathname])

  const fetchData = async () => {
    try {
      setLoading(true);
      const [petsRes, applicationsRes, adoptedRes] = await Promise.all([
        adoptionAPI.listPets(),
        adoptionAPI.listMyRequests(),
        adoptionAPI.getMyAdoptedPets()
      ]);

      setPets(petsRes.data.data.pets || []);
      setApplications(applicationsRes.data.data || []);
      setAdopted(adoptedRes.data.data || [])
    } catch (error) {
      console.error('Error fetching adoption data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const actions = [
    { label: 'My Applications', onClick: () => navigate('/User/adoption/applications'), color: 'bg-blue-600' },
    { label: 'My Adoptions', onClick: () => navigate('/User/adoption/adopted'), color: 'bg-indigo-600' },
  ]

  const stats = [
    { label: 'Available Pets', value: pets.length, icon: '🐾' },
    { label: 'My Applications', value: applications.length, icon: '📋' },
    { label: 'Adopted Pets', value: adopted.length, icon: '✅' },
  ]

  const tabs = [
    { key: 'browse', label: 'Browse Pets' },
    { key: 'applications', label: 'My Applications' },
    { key: 'adopted', label: 'My Adoptions' },
  ]

  const handleTabChange = (key) => {
    setTab(key)
    if (key === 'applications') navigate('/User/adoption/applications')
    else if (key === 'adopted') navigate('/User/adoption/adopted')
    else navigate('/User/adoption')
  }

  const renderBrowse = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <div key={pet._id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          {pet.images && pet.images.length > 0 && (
            <img src={resolveMediaUrl(pet.images[0]?.url || pet.images[0])} alt={pet.name} className="w-full h-48 object-cover" onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }} />
          )}
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{pet.name}</h3>
                <p className="text-gray-600">{pet.breed} • {pet.species}</p>
              </div>
              <span className="text-lg font-bold text-green-600">₹{pet.adoptionFee}</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p><span className="font-medium">Age:</span> {pet.ageDisplay || `${pet.age} ${pet.ageUnit}`}</p>
              <p><span className="font-medium">Gender:</span> {pet.gender}</p>
              <p><span className="font-medium">Health:</span> {pet.healthStatus}</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => navigate(`/User/adoption/${pet._id}`)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Details</button>
              <button onClick={() => navigate(`/User/adoption/apply/applicant?petId=${pet._id}`)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Adopt</button>
            </div>
          </div>
        </div>
      ))}
      {pets.length === 0 && (
        <div className="col-span-full text-center text-gray-500">No pets available right now.</div>
      )}
    </div>
  )

  const renderApplications = () => (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Recent Applications</div>
        <button className="text-blue-600 hover:underline" onClick={() => navigate('/User/adoption/applications')}>View All</button>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">Pet</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Reason</th>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(a => (
            <tr key={a._id} className="border-b">
              <td className="py-2 pr-4">
                <div className="font-medium">{a.petId?.name || 'Pet'}</div>
                <div className="text-gray-500">{a.petId?.species} • {a.petId?.breed}</div>
              </td>
              <td className="py-2 pr-4">{a.status}</td>
              <td className="py-2 pr-4">{a.status === 'rejected' ? (a.rejectionReason || '-') : '-'}</td>
              <td className="py-2 pr-4">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}</td>
              <td className="py-2">
                <button className="px-3 py-1 rounded bg-gray-100" onClick={() => navigate(`/User/adoption/applications/${a._id}`)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {applications.length === 0 && (
        <div className="py-4 text-center text-gray-500">No applications yet.</div>
      )}
    </div>
  )

  const renderAdopted = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="col-span-full flex items-center justify-between">
        <div className="font-semibold">Recently Adopted</div>
        <button className="text-blue-600 hover:underline" onClick={() => navigate('/User/adoption/adopted')}>View All</button>
      </div>
      {adopted.map(pet => (
        <div key={pet._id} className="bg-white border rounded-lg overflow-hidden">
          {pet.images && pet.images.length > 0 && (
            <img src={resolveMediaUrl(pet.images[0]?.url || pet.images[0])} alt={pet.name} className="w-full h-40 object-cover" onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }} />
          )}
          <div className="p-4">
            <div className="font-semibold">{pet.name}</div>
            <div className="text-gray-600 text-sm">{pet.breed} • {pet.species}</div>
          </div>
        </div>
      ))}
      {adopted.length === 0 && (
        <div className="col-span-full text-center text-gray-500">No adopted pets yet.</div>
      )}
    </div>
  )

  return (
    <ModuleDashboardLayout
      title="Adoption Center"
      description="Find your perfect companion"
      actions={actions}
      stats={stats}
      tabs={tabs}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      {tab === 'browse' && renderBrowse()}
      {tab === 'applications' && renderApplications()}
      {tab === 'adopted' && renderAdopted()}
    </ModuleDashboardLayout>
  );
};

export default AdoptionDashboard;