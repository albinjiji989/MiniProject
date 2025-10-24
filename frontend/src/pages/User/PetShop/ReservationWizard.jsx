import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const ReservationWizard = () => {
  const navigate = useNavigate()
  const { petId } = useParams()
  
  // Redirect to the new reservation wizard
  React.useEffect(() => {
    navigate(`/reserve/${petId}`)
  }, [navigate, petId])
  
  return (
    <div>
      Redirecting to new reservation system...
    </div>
  )
}

export default ReservationWizard