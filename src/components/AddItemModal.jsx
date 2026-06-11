import { useState, useEffect, useRef } from 'react'
import { CATEGORIES, SOURCE_LABELS } from '../constants'

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.id !== 'all')

export default function AddItemModal({ initialUrl = '', initialTitle = '', existingItem = null, onSave, onClose }) {
  const [url, setUrl] = useState(existingItem?.url || initialUrl)
  const [title, setTitle] = useState(existingItem?.title || initialTitle)
  const [description, setDescription] = useState(existingItem?.description || '')
  const [imageUrl, setImageUrl] = useState(existingItem?.image_url || '')
  const [faviconUrl, setFaviconUrl] = useState(existingItem?.favicon_url || '')
  const [source, setSource] = useState(existingItem?.source || 'web')
  const [category, setCategory] = useState(existingItem?.category || 'general')
  const [notes, setNotes] = useState(existingItem?.notes || '')
  const [progress, setProgress] = useState(existingItem?.progress || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(existingItem?.tags || [])
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const urlRef = useRef(null)

  useEffect(() => {
    if (!existingItem && initialUrl) fetchMetadata(initialUrl)
  }, [])

  useEffect(() => {
    if (!existingItem) urlRef.current?.focus()
  }, [])

  async function fetchMetadata(targetUrl) {
    if (!targetUrl) return
    setFetching(true)
    setFetchError('')
    try {
      const res = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(targetUrl)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.title) setTitle(data.title)
        if (data.description) setDescription(data.description)
        if (data.image_url) setImageUrl(data.image_url)
        if (data.favicon_url) setFaviconUrl(data.favicon_url)
        if (data.source) setSource(data.source)
      }
    } catch {
      setFetchError('Could not fetch link details — fill in manually.')
    } finally {
      setFetching(false)
    }
  }

  function addTag(raw) {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (tag && !tags.includes(tag)) setTags([...tags, tag])
    setTagInput('')
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url) return
    setSaving(true)
    const payload = { url, title, description, image_url: imageUrl, favicon_url: faviconUrl, source, category, notes, tags, progress }
    try {
      let res
      if (existingItem) {
        res = await fetch(`/api/item/${existingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (res.ok) {
        const saved = await res.json()
        onSave(saved, !!existingItem)
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
  const selectCls = `${inputCls} cursor-pointer`

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 rounded-t-3xl sm:rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {existingItem ? 'Edit Link' : 'Save Link'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL *</label>
            <div className="flex gap-2">
              <input
                ref={urlRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="button"
                onClick={() => fetchMetadata(url)}
                disabled={!url || fetching}
                className="px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {fetching ? '...' : 'Fetch'}
              </button>
            </div>
            {fetchError && <p className="text-amber-600 text-xs mt-1">{fetchError}</p>}
            {fetching && <p className="text-gray-400 text-xs mt-1">Fetching link details...</p>}
          </div>

          {/* Preview image */}
          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="Preview" className="w-full h-36 object-cover rounded-xl bg-gray-100 dark:bg-gray-700" onError={() => setImageUrl('')} />
              <button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Link title" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} className={`${inputCls} resize-none`} />
          </div>

          {/* Category + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className={selectCls}>
                {Object.entries(SOURCE_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl min-h-[44px] bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-primary-500">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                  #{tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-red-500">✕</button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={tags.length ? '' : 'fitness, recipe... (press Enter)'}
                className="flex-1 min-w-[100px] text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a tag</p>
          </div>

          {/* Progress (manga / anime) */}
          {(category === 'manga' || category === 'anime') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📍 Progress
              </label>
              <input
                type="text"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                placeholder={category === 'manga' ? 'e.g. Chapter 47' : 'e.g. Episode 12 Season 2'}
                className={inputCls}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personal notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why you saved this, what to do with it..." rows={2} className={`${inputCls} resize-none`} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!url || saving}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Saving...' : existingItem ? 'Save changes' : 'Save link'}
          </button>
        </form>
      </div>
    </div>
  )
}
