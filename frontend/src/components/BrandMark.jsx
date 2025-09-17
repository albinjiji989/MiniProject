import React from 'react'

const BrandMark = ({ size = 36 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        boxShadow: '0 6px 18px rgba(37,117,252,0.35)'
      }}
    >
      <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>🐾</span>
    </div>
  )
}

export default BrandMark


