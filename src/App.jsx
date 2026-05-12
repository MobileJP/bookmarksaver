import { useState, useEffect, useCallback, useMemo } from 'react'
import PasswordGate from './components/PasswordGate'
import FilterBar from './components/FilterBar'
import ItemCard from './components/ItemCard'
import AddItemModal from './components/AddItemModal'

const PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('lv_dark')
    if (stored !== null) return stored === '1'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('lv_dark', dark ? '1' : '0')
  }, [dark])

  return [dark, () => setDark((d) => !d)]
}

function useUnlocked() {
  const [unlocked, setUnlocked] = useState(() => {
    if (!PASSWORD) return true
    return sessionStorage.getItem('lv_unlocked') === '1'
  })
  function unlock() {
    sessionStorage.setItem('lv_unlocked', '1')
    setUnlocked(true)
  }
  return [unlocked, unlock]
}

function getSharedContent() {
  const params = new URLSearchParams(window.location.search)
  const url = params.get('url') || params.get('text') || ''
  const title = params.get('title') || ''
  if (url || title) {
    window.history.replaceState({}, '', '/')
    return { url, title }
  }
  return null
}

function downloadCSV(items) {
  const headers = ['URL', 'Title', 'Description', 'Category', 'Source', 'Tags', 'Notes', 'Date Saved']
  const escape = (v) => `"${(v || '').toString().replace(/"/g, '""')}"`
  const rows = items.map((item) => [
    escape(item.url),
    escape(item.title),
    escape(item.description),
    escape(item.category),
    escape(item.source),
    escape((item.tags || []).join('; ')),
    escape(item.notes),
    escape(new Date(item.created_at).toLocaleDateString()),
  ])
  const csv = [headers.map(escape), ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `linkvault-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [dark, toggleDark] = useDarkMode()
  const [unlocked, unlock] = useUnlocked()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [activeTags, setActiveTags] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [sharedContent] = useState(() => getSharedContent())

  useEffect(() => {
    if (unlocked && sharedContent) setShowModal(true)
  }, [unlocked, sharedContent])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'all') params.set('category', category)
      if (activeTags.length) params.set('tags', activeTags.join(','))
      const res = await fetch(`/api/items?${params}`)
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }, [search, category, activeTags])

  useEffect(() => {
    if (!unlocked) return
    const id = setTimeout(fetchItems, search ? 300 : 0)
    return () => clearTimeout(id)
  }, [fetchItems, unlocked])

  const allTags = useMemo(() => {
    const set = new Set()
    items.forEach((item) => item.tags?.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [items])

  function toggleTag(tag) {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  function handleSaved(saved, isEdit) {
    if (isEdit) {
      setItems((prev) => prev.map((i) => i.id === saved.id ? saved : i))
    } else {
      setItems((prev) => [saved, ...prev])
    }
    setShowModal(false)
    setEditItem(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this link?')) return
    await fetch(`/api/item/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleEdit(item) {
    setEditItem(item)
    setShowModal(true)
  }

  if (!unlocked) return <PasswordGate onUnlock={unlock} />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">🔗</span>
            <span className="font-bold text-gray-900 dark:text-white text-lg">LinkVault</span>
            {items.length > 0 && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{items.length}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* CSV download */}
            <button
              onClick={() => downloadCSV(items)}
              disabled={items.length === 0}
              title="Download all links as CSV"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {dark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Save link */}
            <button
              onClick={() => { setEditItem(null); setShowModal(true) }}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Save link</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={setCategory}
        activeTags={activeTags}
        onTagClick={toggleTag}
        allTags={allTags}
      />

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-64 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {search || category !== 'all' || activeTags.length ? 'No links match your filters' : 'Your vault is empty'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {search || category !== 'all' || activeTags.length
                ? 'Try adjusting your search or filters'
                : 'Start saving links from Instagram, TikTok, and the web'}
            </p>
            {!(search || category !== 'all' || activeTags.length) && (
              <button
                onClick={() => { setEditItem(null); setShowModal(true) }}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Save your first link
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800 mt-8">
        LinkVault v{__APP_VERSION__} &nbsp;·&nbsp; Released {__BUILD_DATE__}
      </footer>

      {/* FAB on mobile */}
      <button
        onClick={() => { setEditItem(null); setShowModal(true) }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors z-30"
      >
        +
      </button>

      {/* Modal */}
      {showModal && (
        <AddItemModal
          initialUrl={!editItem ? (sharedContent?.url || '') : ''}
          initialTitle={!editItem ? (sharedContent?.title || '') : ''}
          existingItem={editItem}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
