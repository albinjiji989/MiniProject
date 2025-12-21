import React from 'react'

export default function ModuleDashboardLayout({
  title,
  description,
  actions = [], // [{label, onClick, color}]
  stats = [], // [{label, value, icon}]
  tabs = [], // [{key, label}]
  activeTab,
  onTabChange,
  storeInfo, // {storeId, storeName}
  children
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <button key={i} onClick={a.onClick} className={`px-4 py-2 rounded text-white ${a.color || 'bg-emerald-600'}`}>{a.label}</button>
          ))}
        </div>
      </div>
      
      {/* Store Info */}
      {storeInfo && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm">
              <span className="font-medium">Store ID:</span> <span className="font-semibold">{storeInfo.storeId || 'Not set'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Store Name:</span> <span className="font-semibold">{storeInfo.storeName || 'Not set'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-3">
                {s.icon && <div className="text-2xl">{s.icon}</div>}
                <div>
                  <div className="text-sm text-gray-600">{s.label}</div>
                  <div className="text-2xl font-semibold">{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap" aria-label="Tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`whitespace-nowrap py-3 px-4 border-b-2 text-sm font-medium ${activeTab === t.key ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => onTabChange && onTabChange(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Body */}
      <div>
        {children}
      </div>
    </div>
  )
}
