import React from 'react'

export default function ManagerModuleLayout({
  title,
  subtitle,
  actions = [],
  children
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`px-4 py-2 rounded text-white text-sm font-medium ${
                  action.color || 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {children}
      </div>
    </div>
  )
}