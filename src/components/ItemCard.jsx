import { useState } from 'react'
import { CATEGORY_MAP, SOURCE_LABELS } from '../constants'

export default function ItemCard({ item, onDelete, onEdit }) {
  const [imgError, setImgError] = useState(false)
  const source = SOURCE_LABELS[item.source] || SOURCE_LABELS.web
  const category = CATEGORY_MAP[item.category]

  function handleOpen() {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      {item.image_url && !imgError ? (
        <button onClick={handleOpen} className="block w-full">
          <img
            src={item.image_url}
            alt={item.title || 'Link preview'}
            className="w-full h-40 object-cover bg-gray-100"
            onError={() => setImgError(true)}
          />
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className="w-full h-20 bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center"
        >
          <span className="text-3xl">{category?.emoji || '🌐'}</span>
        </button>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Source + Category badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${source.color}`}>
            {source.label}
          </span>
          {category && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {category.emoji} {category.label}
            </span>
          )}
        </div>

        {/* Title */}
        <button onClick={handleOpen} className="text-left">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-primary-600 transition-colors">
            {item.title || item.url}
          </h3>
        </button>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
        )}

        {/* Notes */}
        {item.notes && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-2 line-clamp-2">
            📝 {item.notes}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1">
            {item.favicon_url && (
              <img
                src={item.favicon_url}
                alt=""
                className="w-4 h-4 rounded-sm"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
            <span className="text-xs text-gray-400 truncate max-w-[140px]">
              {(() => { try { return new URL(item.url).hostname.replace('www.', '') } catch { return item.url } })()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
