import { useState, useEffect, useCallback, useMemo } from 'react'
import PasswordGate from './components/PasswordGate'
import FilterBar from './components/FilterBar'
import ItemCard from './components/ItemCard'
import AddItemModal from './components/AddItemModal'

const PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD

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

// Parse Web Share Target params from URL on first load
function getSharedContent() {
  const params = new URLSearchParams(window.location.search)
  const url = params.get('url') || params.get('text') || ''
  const title = params.get('title') || ''
  if (url || title) {
    // Clean up the URL bar so refreshing doesn't re-open the modal
    window.history.replaceState({}, '', '/')
    return { url, title }
  }
  return null
}

export default function App() {
  const [unlocked, unlock] = useUnlocked()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [activeTags, setActiveTags] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [sharedContent] = useState(() => getSharedContent())

  // Open modal immediately when app receives a shared link
  useEffect(() => {
    if (unlocked && sharedContent) {
      setShowModal(true)
    }
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

  if (!unlocked) {
    return <PasswordGate onUnlock={unlock} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <span className="font-bold text-gray-900 text-lg">LinkVault</span>
            {items.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
            )}
          </div>
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Save link</span>
          </button>
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
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {search || category !== 'all' || activeTags.length ? 'No links match your filters' : 'Your vault is empty'}
            </h3>
            <p className="text-gray-500 mb-6">
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
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100 mt-8">
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
