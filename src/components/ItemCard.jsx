import { useState } from 'react'
import { CATEGORY_MAP, SOURCE_LABELS } from '../constants'

const PROGRESS_CATEGORIES = ['manga', 'anime']

function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 60) return '1 month ago'
  return `${Math.floor(days / 30)} months ago`
}

export default function ItemCard({ item, onDelete, onEdit, onProgressUpdate, onPinToggle }) {
  const [imgError, setImgError] = useState(false)
  const [editingProgress, setEditingProgress] = useState(false)
  const [progressInput, setProgressInput] = useState(item.progress || '')

  const source = SOURCE_LABELS[item.source] || SOURCE_LABELS.web
  const category = CATEGORY_MAP[item.category]
  const showProgress = PROGRESS_CATEGORIES.includes(item.category)

  function handleOpen() {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  function handleProgressSubmit(e) {
    e.preventDefault()
    onProgressUpdate(item, progressInput)
    setEditingProgress(false)
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-shadow ${
      item.pinned ? 'border-amber-300 dark:border-amber-600' : 'border-gray-100 dark:border-gray-700'
    }`}>
      {/* Thumbnail */}
      {item.image_url && !imgError ? (
        <button onClick={handleOpen} className="block w-full">
          <img
            src={item.image_url}
            alt={item.title || 'Link preview'}
            className="w-full h-40 object-cover bg-gray-100 dark:bg-gray-700"
            onError={() => setImgError(true)}
          />
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className="w-full h-20 bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center"
        >
          <span className="text-3xl">{category?.emoji || '🌐'}</span>
        </button>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Source + Category + Pin badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${source.color}`}>
            {source.label}
          </span>
          {category && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              {category.emoji} {category.label}
            </span>
          )}
          {item.pinned && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              📌 Pinned
            </span>
          )}
        </div>

        {/* Title */}
        <button onClick={handleOpen} className="text-left">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {item.title || item.url}
          </h3>
        </button>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
        )}

        {/* Progress tracker (manga / anime) */}
        {showProgress && (
          <div className="mt-2">
            {editingProgress ? (
              <form onSubmit={handleProgressSubmit} className="flex gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={progressInput}
                  onChange={(e) => setProgressInput(e.target.value)}
                  placeholder="e.g. Chapter 47"
                  className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" className="text-xs bg-primary-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-primary-700 transition-colors">Save</button>
                <button type="button" onClick={() => setEditingProgress(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1.5">✕</button>
              </form>
            ) : (
              <button
                onClick={() => { setProgressInput(item.progress || ''); setEditingProgress(true) }}
                className="flex items-center gap-1.5 text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors w-full text-left"
              >
                <span>📍</span>
                <span>{item.progress || 'Set progress...'}</span>
                <svg className="w-3 h-3 ml-auto flex-none opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-2 py-1 mt-2 line-clamp-2">
            📝 {item.notes}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer — domain, time ago, actions */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 dark:border-gray-700">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              {item.favicon_url && (
                <img src={item.favicon_url} alt="" className="w-4 h-4 rounded-sm flex-none" onError={(e) => { e.target.style.display = 'none' }} />
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {(() => { try { return new URL(item.url).hostname.replace('www.', '') } catch { return item.url } })()}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">{timeAgo(item.created_at)}</span>
          </div>

          <div className="flex items-center gap-1 flex-none">
            {/* Pin/star toggle */}
            <button
              onClick={() => onPinToggle(item)}
              title={item.pinned ? 'Unpin' : 'Pin to top'}
              className={`p-1.5 rounded-lg transition-colors ${
                item.pinned
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
              }`}
            >
              <svg className="w-4 h-4" fill={item.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
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
