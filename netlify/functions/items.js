const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

function supabaseHeaders(userJwt) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${userJwt}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

function getUserId(userJwt) {
  try {
    const payload = userJwt.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return decoded.sub
  } catch {
    return null
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

  const userJwt = event.headers.authorization?.replace('Bearer ', '')
  if (!userJwt) {
    return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  // GET — list/search items
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    const { search, tags, category, sort = 'newest', limit = '50', offset = '0' } = params

    const orderMap = {
      newest: 'pinned.desc,created_at.desc',
      oldest: 'pinned.desc,created_at.asc',
      alpha:  'pinned.desc,title.asc',
    }

    const q = new URLSearchParams()
    q.set('order', orderMap[sort] || orderMap.newest)
    q.set('limit', limit)
    q.set('offset', offset)

    if (category && category !== 'all') q.set('category', `eq.${category}`)
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tagList.length) q.set('tags', `cs.{${tagList.join(',')}}`)
    }
    if (search && search.trim()) {
      const s = search.trim()
      q.set('or', `(title.ilike.*${s}*,description.ilike.*${s}*,url.ilike.*${s}*,notes.ilike.*${s}*)`)
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/items?${q}`, {
      headers: supabaseHeaders(userJwt),
    })
    const data = await res.json()
    if (!res.ok) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify(data) }
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(data) }
  }

  // POST — create item
  if (event.httpMethod === 'POST') {
    let body
    try { body = JSON.parse(event.body) } catch {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) }
    }

    const userId = getUserId(userJwt)
    if (!userId) return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid token' }) }

    const { url, title, description, image_url, tags, category, source, notes, favicon_url, progress } = body
    if (!url) return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'URL is required' }) }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
      method: 'POST',
      headers: supabaseHeaders(userJwt),
      body: JSON.stringify({
        url,
        title: title || '',
        description: description || '',
        image_url: image_url || '',
        favicon_url: favicon_url || '',
        tags: tags || [],
        category: category || 'general',
        source: source || 'web',
        notes: notes || '',
        progress: progress || '',
        user_id: userId,
      }),
    })

    const data = await res.json()
    if (!res.ok) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify(data) }
    const record = Array.isArray(data) ? data[0] : data
    return { statusCode: 201, headers: corsHeaders(), body: JSON.stringify(record) }
  }

  return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }
}
