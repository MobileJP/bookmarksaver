export const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🗂️' },
  { id: 'general', label: 'General', emoji: '🌐' },
  { id: 'health', label: 'Health & Fitness', emoji: '💪' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'work', label: 'Work & Career', emoji: '💼' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'religion', label: 'Religion', emoji: '🕌' },
  { id: 'jobs', label: 'Jobs', emoji: '💰' },
]

export const SOURCE_LABELS = {
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-700' },
  tiktok: { label: 'TikTok', color: 'bg-black text-white' },
  youtube: { label: 'YouTube', color: 'bg-red-100 text-red-700' },
  twitter: { label: 'X / Twitter', color: 'bg-blue-100 text-blue-700' },
  facebook: { label: 'Facebook', color: 'bg-blue-100 text-blue-800' },
  reddit: { label: 'Reddit', color: 'bg-orange-100 text-orange-700' },
  linkedin: { label: 'LinkedIn', color: 'bg-blue-100 text-blue-900' },
  pinterest: { label: 'Pinterest', color: 'bg-red-100 text-red-800' },
  web: { label: 'Web', color: 'bg-gray-100 text-gray-700' },
}

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.filter((c) => c.id !== 'all').map((c) => [c.id, c])
)
